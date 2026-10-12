# AEGISYNTH Sentinel — testnet security and privacy boundary

## Model and authority

1. `backend/app/engine.py` generates synthetic fraud data. There is no access to live Mastercard or merchant information.
2. `backend/app/artifact.py` emits a SHA-256 integrity fingerprint. It is **not** a signature or bank-issued attestation; the backend never claims policy is deployed.
3. The human owner must configure the on-chain recipient allowlist and spending limits; the AI cannot mint permissions.
4. `AegisVault.sol` transfers **only its deposited native test MON** and only when called by `operator` within configured constraints.
5. When `reviewRequired`, `reviewer` approves the exact payment ID, amount, recipient and expiry. Policy change or reviewer rotation invalidates stale approvals.
6. The owner can pause/unpause and recover unused funds. Centralized owner custody and governance are explicit limitations.

## Solvable threats and test cases

- Missing/invalid policy fails closed.
- Allowlist and non-zero addresses reject unauthorized payees.
- Per-payment cap and cross-version lifetime budget are enforced with Solidity checked arithmetic.
- Payment IDs are single use, consumed before external value transfer.
- Access controls separate owner, reviewer and operator.
- Reentrancy guard covers external transfers and withdrawals.
- Reviewer approval is bound to a policy version, reviewer epoch, recipient, amount, and expiration.
- `paused` blocks execution even if a reviewer has approved it.
- No private key, secrets, customer PII, real card numbers or user risk scores are stored in the repo or on chain.

## Not guaranteed

- No proof of production readiness or full prevention of fraud. Merchant-level properties cannot be trusted from arbitrary off-chain inputs without oracle/data provenance and cryptographic attestation.
- No general on-chain privacy. Sender/recipient wallets, payments, balances and history are public to all observers.
- No guarantee the owner/reviewer/operator wallets remain uncompromised.
- No contract security audit. Manual review and external audit would be required before mainnet funds.
- No autonomous bank transaction rejection. This vault controls only native funds deposited directly to itself.

## Release gates

`npm test` with Solidity compiler successfully installed; all tests green; manual permission review; confirmed bytecode and Monad 10143; wallet network check; balance limits; active policy; successful payment receipt; failing unauthorized payment simulation; deployment hash and address recorded; source-only public Git repository with no populated `.env` files.
