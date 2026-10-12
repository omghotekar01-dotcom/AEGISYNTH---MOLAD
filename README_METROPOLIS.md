# AEGISYNTH Sentinel — Monad Metropolis 2026

**Project direction:** governed synthetic fraud-defence compilation plus an owner-controlled Monad Testnet native-MON payment vault.

This is an **experimental testnet prototype**, not a bank integration or production fraud prevention service. AI never receives private keys or direct signing authority. A reviewer must explicitly approve policy deployment, and the contract enforces only its programmed rules. Blockchain amounts, wallet identities, balances, and receipts are **public**.

## Origin and provenance

- Pre-existing base: [`omghotekar01-dotcom/Mastercard-project---AEGISYNTH`](https://github.com/omghotekar01-dotcom/Mastercard-project---AEGISYNTH)
- Pre-existing research engine: synthetic `ghost_merchant_swarm` data, counterexample-guided defence policy compiler, Z3 verification and SHA-256 evidence packages.
- New Metropolis-focused integration: `contracts/AegisVault.sol`, Hardhat security tests, browser-based Monad Security Console under `web3/`, deployment script and this documentation.
- **Do not claim** the original model operates on live bank/payment data or that the on-chain contract independently checks merchant-age/burst features.

## Minimal start (after the repo is copied and dependencies can be installed)

Requires Node 22+, Python 3.12 and MetaMask. Backend environment/setup instructions remain in the original `README.md`.

```sh
npm install
npm test
# For the original AEGISYNTH API:
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

In a separate terminal:

```sh
npm run web3:dev
```

The browser console may use the existing public API `https://aegisynth.onrender.com` for the evidence package, or `VITE_AEGIS_API_BASE=http://localhost:8000` for a local backend.

## Monad Testnet deployment

Network **10143**, RPC `https://testnet-rpc.monad.xyz`. Use a dedicated, minimally funded testnet account. Never expose seed words or a private key to ChatGPT, screenshots, committed files, or a web page.

1. Copy `metropolis.env.example` to `.env`; insert `MONAD_TESTNET_PRIVATE_KEY` into the ignored file **only on your trusted local computer**, never into GitHub or a public Vercel variable.
2. Run `npm run contracts:compile && npm run contracts:test` and fix any failures.
3. Check available test MON before running `npm run contracts:deploy:testnet`.
4. Check the deployment output for chain `10143`, a successful receipt and bytecode. Record the actual new vault address and deployment hash.
5. Copy `web3/.env.example` to `web3/.env.local` and set `VITE_AEGIS_VAULT_ADDRESS=0xYOUR_NEW_VAULT`.
6. Run `npm run web3:dev`. Connect a MetaMask wallet on the correct testnet.

**Do not use BEAT DROP's existing contract address.** It is a music-jam contract, not this payment vault. No address is supplied here until independently deployed.

## Live proof sequence

1. Open original AEGISYNTH synthetic defence dashboard and run the lab.
2. Open `/api/v1/review-package` to retrieve a verified, human-governed review artifact.
3. In the separate Monad console, click **Read review package**; it will show the policy evidence fingerprint (not yet an on-chain policy).
4. As vault owner, activate limits, allow a TESTNET recipient, and deposit a tiny amount of test MON.
5. As authorized reviewer, approve one payment ID; as operator, execute it using MetaMask. Show SUCCESS receipt on MonadVision.
6. Attempt to send to an unapproved address or exceed maxPerPayment. Contract simulation must reject it. **A failed simulation has no on-chain transaction hash.**
7. Show replay prevention, pause and recipient revocation as optional security demos.

## Trust model and limitations

- Contract protects **only native MON deposited in this vault**; it does not control every wallet transaction or bank/credit-card payment.
- Spending limits, allowlists, policy version and payment approvals are enforceable on-chain. AI feature rules are not independently verifiable on-chain; their SHA-256 artifact fingerprint is only a transparent audit reference.
- Human owner/reviewer approval and wallet signatures remain required. It would be unsafe and misleading to bypass those using AI background access.
- Owner can change the policy and withdraw unused vault funds; owner-key compromise is out of scope.
- Current demo assumes same address may fulfill all three roles for simplicity. For a serious deployment use distinct controlled identities, multi-signature owner, external audit and incident-response controls.
- Public-chain state is transparent; never submit real merchant IDs, confidential risk evidence, customer data or banking secrets on-chain.
- The AI/review-package status in the **original backend** remains `NOT_DEPLOYED`; the separate vault's `PolicyActivated` event is the authority for on-chain configuration.

## Verification status

Local offline checks can exercise JS policy validation and source syntax. Solidity compilation, Hardhat test results, chain deployment, MetaMask signing, Render availability, Vercel hosting and live Monad receipts **must be explicitly checked before being marked complete**.

See `docs/METROPOLIS_DEMO.md` for a three-minute judge script and `docs/METROPOLIS_SECURITY.md` for the threat model.
