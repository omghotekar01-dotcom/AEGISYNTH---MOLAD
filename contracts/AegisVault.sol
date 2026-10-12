// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AegisVault
 * @notice A proof-of-concept Monad Testnet native-MON payment vault.
 * @dev Only protects MON held by THIS vault. Never claims to score real merchants
 * or protect unrelated wallets. The AI's off-chain review digest is informational;
 * owner/reviewer authorization is what gates payments on-chain.
 */
contract AegisVault {
    address public immutable owner;
    address public operator;
    address public reviewer;
    bool public paused;
    bool public policyConfigured;
    bool private entered;
    uint64 public policyVersion;
    uint64 public reviewerEpoch;
    uint256 public lifetimeSpent;
    uint256 public maxPerPayment;
    uint256 public lifetimeBudget;
    bool public reviewRequired;
    bytes32 public policyEvidenceHash;
    mapping(address => bool) public allowedRecipients;
    mapping(bytes32 => bool) public completedPayments;

    struct Approval {
        address recipient;
        uint256 amount;
        uint64 expiresAt;
        uint64 version;
        uint64 reviewerEpochAtApproval;
    }
    mapping(bytes32 => Approval) public approvals;

    error Unauthorized();
    error InvalidConfiguration();
    error VaultPaused();
    error MissingPolicy();
    error PaymentRejected();
    error ApprovalMissing();
    error PaymentAlreadyCompleted();
    error TransferFailed();
    error Reentrancy();

    event Deposited(address indexed sender, uint256 amount);
    event OperatorChanged(address indexed previousOperator, address indexed newOperator);
    event ReviewerChanged(address indexed previousReviewer, address indexed newReviewer);
    event RecipientSet(address indexed recipient, bool allowed);
    event PolicyActivated(uint64 indexed version, bytes32 indexed evidenceHash, uint256 maxPerPayment, uint256 lifetimeBudget, bool reviewRequired);
    event PaymentApproved(bytes32 indexed paymentId, address indexed recipient, uint256 amount, uint64 expiresAt, uint64 version);
    event PaymentExecuted(bytes32 indexed paymentId, address indexed recipient, address indexed operator, uint256 amount, uint64 policyVersion);
    event Paused(address indexed owner);
    event Unpaused(address indexed owner);
    event OwnerWithdrawal(address indexed owner, uint256 amount);

    constructor(address initialOperator, address initialReviewer) {
        if (initialOperator == address(0) || initialReviewer == address(0)) revert InvalidConfiguration();
        owner = msg.sender;
        operator = initialOperator;
        reviewer = initialReviewer;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }
    modifier onlyOperator() {
        if (msg.sender != operator) revert Unauthorized();
        _;
    }
    modifier onlyReviewer() {
        if (msg.sender != reviewer) revert Unauthorized();
        _;
    }
    modifier nonReentrant() {
        if (entered) revert Reentrancy();
        entered = true;
        _;
        entered = false;
    }

    receive() external payable { emit Deposited(msg.sender, msg.value); }
    function deposit() external payable { if (msg.value == 0) revert InvalidConfiguration(); emit Deposited(msg.sender, msg.value); }

    function setOperator(address nextOperator) external onlyOwner {
        if (nextOperator == address(0)) revert InvalidConfiguration();
        emit OperatorChanged(operator, nextOperator);
        operator = nextOperator;
    }
    function setReviewer(address nextReviewer) external onlyOwner {
        if (nextReviewer == address(0)) revert InvalidConfiguration();
        if (reviewerEpoch == type(uint64).max) revert InvalidConfiguration();
        emit ReviewerChanged(reviewer, nextReviewer);
        reviewer = nextReviewer;
        reviewerEpoch += 1;
    }
    function setRecipient(address recipient, bool allowed) external onlyOwner {
        if (recipient == address(0) || recipient == address(this)) revert InvalidConfiguration();
        allowedRecipients[recipient] = allowed;
        emit RecipientSet(recipient, allowed);
    }

    /**
     * @dev Evidence hash is NOT a signed authorization, and the AI does NOT
     * automatically choose spending limits. Owner must explicitly approve them.
     * lifetimeBudget is a hard cap across ALL policy versions for this vault.
     */
    function configurePolicy(bytes32 evidenceHash, uint256 perPayment, uint256 totalBudget, bool needsReview) external onlyOwner {
        if (evidenceHash == bytes32(0) || perPayment == 0 || totalBudget == 0 || totalBudget < lifetimeSpent ||
            perPayment > totalBudget || policyVersion == type(uint64).max) revert InvalidConfiguration();
        policyVersion += 1;
        policyConfigured = true;
        policyEvidenceHash = evidenceHash;
        maxPerPayment = perPayment;
        lifetimeBudget = totalBudget;
        reviewRequired = needsReview;
        emit PolicyActivated(policyVersion, evidenceHash, perPayment, totalBudget, needsReview);
    }

    function approvePayment(bytes32 id, address recipient, uint256 amount, uint64 expiresAt) external onlyReviewer {
        if (!policyConfigured) revert MissingPolicy();
        if (id == bytes32(0) || !allowedRecipients[recipient] || amount == 0 || expiresAt <= block.timestamp || completedPayments[id]) revert InvalidConfiguration();
        if (amount > maxPerPayment || lifetimeSpent + amount > lifetimeBudget) revert PaymentRejected();
        approvals[id] = Approval(recipient, amount, expiresAt, policyVersion, reviewerEpoch);
        emit PaymentApproved(id, recipient, amount, expiresAt, policyVersion);
    }

    function executePayment(bytes32 id, address recipient, uint256 amount) external onlyOperator nonReentrant {
        if (paused) revert VaultPaused();
        if (!policyConfigured) revert MissingPolicy();
        if (id == bytes32(0) || completedPayments[id]) revert PaymentAlreadyCompleted();
        if (!allowedRecipients[recipient] || recipient == address(0) || amount == 0 || amount > maxPerPayment ||
            amount > address(this).balance || lifetimeSpent + amount > lifetimeBudget) revert PaymentRejected();
        if (reviewRequired) {
            Approval memory a = approvals[id];
            if (a.version != policyVersion || a.reviewerEpochAtApproval != reviewerEpoch || a.recipient != recipient || a.amount != amount || a.expiresAt < block.timestamp) revert ApprovalMissing();
        }
        completedPayments[id] = true;
        lifetimeSpent += amount;
        delete approvals[id];
        (bool ok,) = payable(recipient).call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit PaymentExecuted(id, recipient, msg.sender, amount, policyVersion);
    }

    function pause() external onlyOwner { paused = true; emit Paused(msg.sender); }
    function unpause() external onlyOwner { paused = false; emit Unpaused(msg.sender); }

    /** Owner emergency recovery is deliberately outside the operator limits. */
    function withdrawUnused(uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0 || amount > address(this).balance) revert InvalidConfiguration();
        (bool ok,) = payable(owner).call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit OwnerWithdrawal(owner, amount);
    }
}
