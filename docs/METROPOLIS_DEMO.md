# Three-minute evidence-led demo

**0:00–0:25 — The problem.** Fraud patterns evolve faster than manual rule changes. AEGISYNTH compiles and tests candidate defences; Monad enforces reviewed constraints on payments made from a controlled vault.

**0:25–0:55 — Existing AEGISYNTH.** On its existing dashboard, run the synthetic fraud lab and show `STEP_UP` / `REVIEW`, adversarial tests and Z3 verification. These are lab figures, not production banking statistics.

**0:55–1:20 — Provenance.** Load `/api/v1/review-package` and identify the review fingerprint, `HUMAN_APPROVAL_REQUIRED` and `NOT_DEPLOYED` safeguards. Explain the human changes policy permissions.

**1:20–1:55 — Monad enforcement.** Show Monad Testnet chain ID `10143`, the actual vault contract address, configured recipient allowlist, payment limit and on-chain evidence hash. Deposit small test MON in advance to avoid faucet delays.

**1:55–2:35 — Positive and negative tests.** Reviewer approves an ID; operator executes a 0.005 test MON payment to an authorized address (adjust for funds). Show the confirmed hash and receipt. Then try over-limit or unapproved recipient; see a real simulated contract revert, with no fake chain transaction.

**2:35–3:00 — Proof and closing.** Show the deployment transaction and `PaymentExecuted` event in MonadVision. Explain that AEGISYNTH does expensive risk reasoning off-chain, while the vault enforces deterministic payment permissions on Monad.

## Prepared backup

- Have existing live Render dashboard and two saved evidence screenshots ready.
- Keep at least one real **successful receipt** from your own Monad Testnet deployment available on MonadVision. Never invent one.
- Have a scripted negative-case `eth_call`/contract simulation result to show even if MetaMask is slow.
- Avoid sending any production funds or using private merchant data.
