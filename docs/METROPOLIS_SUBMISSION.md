# Metropolis Hackathon — draft submission

**Name:** AEGISYNTH Sentinel

**One-line description:** A human-governed AI fraud-defence compiler with enforceable payment permissions on Monad Testnet.

**Track candidate:** Trust, Identity & AI Infrastructure (alternative: Consumer Products & Payments; select only one according to official rules).

## Problem

Payment fraud defences often depend on manual investigation and slow policy updates. Autonomous rule generation alone is not enough: a new rule must be understandable, tested against benign traffic and adversarial bypasses, reviewed by an authorized person and enforced at the real transaction boundary.

## Solution

AEGISYNTH's existing synthetic attack lab generates candidate defence rules, counterexamples and Z3-backed policy-evaluation evidence. Sentinel adds a controlled native-MON payment vault on Monad Testnet. An owner signs payment constraints, a reviewer can approve exact payment intents and an operator executes only transactions that meet the on-chain rules. Each successful protected payment has a verifiable blockchain receipt.

## What Monad actually does

- Holds user-funded TESTNET MON in a specific vault (not arbitrary wallet funds).
- Stores a versioned SHA-256 research-evidence fingerprint (does not prove an AI outcome is correct).
- Enforces allowed recipients, per-payment caps, cumulative budgets, pause status and reviewer approval.
- Emits policy and payment event logs, recording confirmed transactions.

## Credible novelty

Clear separation between an offline defence-reasoning control plane, a human decision maker, and a deterministic on-chain payment execution plane. Fraud research and customer data need not be posted to a public blockchain.

## Current limits (must disclose)

Existing AEGISYNTH data is synthetic. The contract cannot authenticate merchant features and only guards this vault's TESTNET MON. No independent smart-contract audit and no production bank integration. Public-chain transfers do not provide counterparty privacy. Human approvals and wallet signatures are not automated away.

## Submission proof checklist

- [ ] New GitHub repo exists: `omghotekar01-dotcom/AEGISYNTH-MONAD`
- [ ] Original foundation acknowledged and Metropolis-specific additions clearly distinguished
- [ ] npm test and CI green
- [ ] Frontend Vite build green
- [ ] New vault deployed on Monad Testnet 10143
- [ ] Deployment hash and contract address saved (never fabricated)
- [ ] Successful protected transfer with verified receipt and explorer link
- [ ] Rejected unauthorized request confirmed by contract simulation
- [ ] Policy fingerprint version and role controls displayed
- [ ] 3-minute video recorded and HTTPS page verified
- [ ] Official event eligibility and past-work disclosure checked
