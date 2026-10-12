# AI agent instructions — safe continuation

Source baseline: `omghotekar01-dotcom/Mastercard-project---AEGISYNTH`; destination `omghotekar01-dotcom/AEGISYNTH-MONAD`. Do not edit, force-push, or deploy the original research repo.

Always inspect the destination Git status before mutation, use repository-local git author `Om Ghotekar <omghotekar01@gmail.com>`, and never stage `.env`, `.env.local`, secrets, deployer keys, seed phrases or merchant records.

Priority sequence:
1. Import original repository into separate destination and apply this overlay.
2. Install Node 22 and run `npm test`, `npm run web3:build`. Fix only reproducible failures, do not claim unexecuted tests passed.
3. Run source AEGISYNTH Python tests in `backend/` to check existing functionality is preserved.
4. Audit AegisVault permissions, economic limits, expired approvals, approval invalidation and malicious recipient behavior; add tests before security-related changes.
5. Verify actual Monad Testnet chain ID `10143`, secure wallet ownership, successful deployed bytecode and receipt.
6. Show one successful authorized transaction and one honest simulated rejection. Confirm explorer hashes and never invent evidence.
7. Make the frontend responsive; keep visual polish secondary to live functionality.
8. Update README, privacy limitations, source attribution, tested environment and submission links.

Never describe the SHA-256 artifact as proof of blockchain execution; it is only a digest. Never imply the fraud compiler autonomously signs or runs transactions or has access to customers' payment details.

No background agent should possess wallet private keys. Browser-based signing remains a user-confirmed security boundary.
