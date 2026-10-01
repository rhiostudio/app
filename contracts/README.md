# Contracts (draft, unaudited, not deployed)

- `RhioClaims.sol` is a cumulative merkle distributor that pays one ERC-20 token.
  - Creator earnings use an instance that pays USDG.
  - A separate instance could pay NVDA Stock Tokens for the planned holder reward. The NVDA token does not block contract transfers (checked by a mainnet simulation). Stock Tokens are legally restricted securities, though, so claims would need geo-blocking and eligibility checks first (HANDOFF/LEGAL-BRIEF-NVDA.md).
  - The owner must be a multisig. It posts roots, pauses claims, and withdraws unclaimed funds.
  - The leaf format matches `lib/merkle.ts` and OpenZeppelin `MerkleProof`: `keccak256(bytes.concat(keccak256(abi.encode(account, cumulativeAmount))))`.
- `test/MockToken.sol` is an ERC-20 that only its deployer can mint. It is used for tUSDG/tRHIO on the local chain and on Robinhood Chain **testnet** (`scripts/deploy-testnet.mjs`). Never deploy it to mainnet.
- `SECURITY-REVIEW.md` is the internal review with test results. It is not an independent audit.

Tested on a local ganache chain with Robinhood Chain Testnet's chain id, via `scripts/local-chain.mjs` and `scripts/verify-chain.mjs`. The tests cover these cases:
- Valid claim.
- Inflated amount rejected.
- Double claim rejected.
- Contract-level tests (`npm run test:contracts`): pause, withdraw, two-step ownership, root replacement, tokens without a return value.
- Only the owner can post a root.

Before any public deployment:
1. Get an independent audit.
2. Deploy to testnet (46630) first.
3. Verify the source on the official explorer.
4. Set the multisig as owner.
5. Publish the addresses in the docs.
