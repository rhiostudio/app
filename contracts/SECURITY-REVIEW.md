# RhioClaims: internal security review (29 September 2026)

> **Status:** this is an internal review with tests, written by the development assistant. **It is not an independent audit.** An external audit is still required before RhioClaims holds real funds on mainnet. Testnet use with tUSDG is fine.

## Scope
- In scope: `contracts/RhioClaims.sol` (solc 0.8.26, optimizer 200 runs, evmVersion paris).
- Also checked, because they decide what the contract pays:
  - the off-chain parts `lib/merkle.ts`, `app/api/claims/route.ts` and `app/api/claims/epoch/route.ts`;
  - the Robinhood Chain facts from docs.robinhood.com/chain: an Arbitrum L2, sequencer screening of sanctioned addresses, and finality stages.

## Design summary
- One instance pays one ERC-20 token.
- The owner (meant to be a multisig) sets a merkle root over `(account, cumulativeAmount)` leaves.
- `claim(account, cumulative, proof)` pays `cumulative − claimed[account]` to `account`, and anyone may relay it.
- The owner can pause claims, withdraw funds, and hand over ownership in two steps.

## Findings
| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| 1 | Info (trust) | The owner can post any root and can withdraw the whole float. Users must trust the owner. | By design. Use a multisig owner (for example 2-of-3), keep the float small and top it up per epoch, and publish every root. |
| 2 | Low | A wrong or lower root cannot claw back what was already paid. A later root with a higher cumulative can over-pay if the server builds it wrongly. | Mitigated off-chain: `/api/claims/epoch publish` refuses unless the on-chain root equals the built root, and cumulative amounts only ever grow. Recommend a second person checks `total` before signing `setMerkleRoot`. |
| 3 | Low | There is no timelock on `setMerkleRoot` or `withdraw`. | Acceptable while the float is small. Consider a timelock (or Safe delay module) before large balances. |
| 4 | Info | If the payout token has a blocklist (USDG is issued by Paxos), a claim to a blocked or sanctioned account reverts. The sequencer also excludes transactions linked to sanctioned addresses. | Only that account is affected. Its entitlement stays recorded and other claims keep working. |
| 5 | Info | Fee-on-transfer or rebasing tokens would pay less than `cumulative − claimed`. | USDG is neither. Stock Tokens are not rebasing (ERC-8056 keeps raw balances fixed), so raw amounts are exact. |
| 6 | Info | `pendingOwner` can be cleared by `transferOwnership(address(0))`, but no event says "cancelled". | Cosmetic. |

No critical, high or medium issues were found.

## Checks that passed
- **Leaf format and proofs**
  - The leaf uses double hashing, `keccak256(bytes.concat(keccak256(abi.encode(account, cumulative))))`, so a 64-byte inner node cannot be passed off as a leaf (second-preimage attack).
  - `_verify` hashes sorted pairs, the same as OpenZeppelin `MerkleProof.verify`.
  - `lib/merkle.ts` produces identical roots and proofs: the on-chain claims in the tests used them.
- **Transfer safety**
  - Checks-effects-interactions: `claimed` is written before the external `transfer`, so re-entry cannot claim twice.
  - The safe transfer handles tokens that return `false` and tokens that return nothing.
- **Access control**
  - Constructor rejects a zero token and a zero owner.
  - Admin functions are owner-only.
  - Ownership changes in two steps.
  - The float can only move through `claim` (to the account in the leaf) or `withdraw` (owner).
- **Robinhood Chain specifics**
  - The contract uses neither `block.number` (on Arbitrum it is an L1 estimate) nor `prevrandao`.
  - Code size is far below the 96 KB limit.

## Tests (local chain, chain id 46630)
- `scripts/test-claims-contract.mjs`: **PASS**. It covers:
  - Constructor guards.
  - Owner-only root, pause and withdraw.
  - A proof only pays its own account, and anyone can relay a claim.
  - A new root pays only the difference, and double claims are rejected.
  - Pause blocks claims, and unpause restores them.
  - An underfunded claim reverts without changing state.
  - Two-step ownership, including that the old owner loses its rights.
  - Tokens without a return value.
- `scripts/verify-chain.mjs`: **PASS**. It runs the full app flow: queue, epoch build, root posted by the owner, publish checked against the chain, on-chain claim, and rejection of double and inflated claims.

## Before mainnet
1. Get an independent audit (scope: this file plus the epoch builder), and publish the report.
2. Make the owner a multisig on Robinhood Chain. Deploy with `OWNER_ADDRESS` set to it.
3. Verify the source on robinhoodchain.blockscout.com.
4. Start with a small float, and set up monitoring on the `RootUpdated`, `Claimed` and `Withdrawn` events.

## Addendum: second instance as the NVDA holder-reward vault (30 September 2026)

Scope: the same contract deployed a second time with `token` = NVDA Stock Token
(`0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC`), fed by the fixed-rate calculator in `lib/rewards.ts`
(3,000,000 RHIO = $0.01 of NVDA per hour). No contract change. `scripts/test-claims-contract.mjs` re-run: **PASS**.

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| 7 | Info (trust) | Solvency is enforced off-chain: a root is only built when the vault balance covers every `cumulative − claimed` (read on-chain). The contract itself would accept a root that owes more than it holds; claims beyond the balance then revert without changing state. | By design for v1; the server check plus the multisig review of each root. Worth an audit discussion: an on-chain `setMerkleRoot(root, totalOwed)` guard. |
| 8 | Info | NVDA Stock Tokens keep raw balances fixed across corporate actions (the price feed carries the multiplier), so cumulative raw amounts stay exact. The server stops settling while the token's `oraclePaused()` is on. | Checked on mainnet: `oraclePaused() = false`, 18 decimals. |
| 9 | Low (compliance) | `claim` is permissionless and pays the leaf's account. The eligibility statement (no US persons, restricted or sanctioned countries) is enforced by serving proofs only after it, not on-chain. | Legal review decides whether self-certification is enough (HANDOFF/LEGAL-BRIEF-NVDA.md). |
| 10 | Info (operations) | Hourly settlement means an hourly `setMerkleRoot` if claims should be available every hour. Each root replaces the previous one and includes every earlier hour, so a slower cadence delays claims but never loses them. | Decision for the team: manual multisig cadence, or an automated poster (a key that can post roots can move funds). |

The price used for NVDA amounts comes from Chainlink "Robinhood NVDA / USD" (`0x379EC4f7C378F34a1B47E4F3cbeBCbAC3E8E9F15`,
8 decimals, 0.5% deviation, 24 h heartbeat, market hours 24/5), with a >50% jump guard and a 72 h age limit off-chain.
Include this file, `lib/rewards.ts` (`accrue`, `buildPeriod`, `refreshPrice`) and `lib/merkle.ts` in the external audit scope.

## Addendum: root poster and payout limit (1 October 2026)

Client decision: holders claim NVDA every hour, so roots are posted by an automated key instead of the Safe.

- `rootPoster` (set by the owner) may call `setMerkleRoot` and nothing else: not `withdraw`, `setPaused`,
  `setRootPoster`, `setPayoutLimit` or `transferOwnership` (tested).
- Risk: a root decides who may claim, so a leaked poster key could post a root that pays an attacker. Mitigation:
  `setPayoutLimit(maxPayout, windowSeconds)` caps what all claims together can take per window; a claim above what is
  left in the window is paid in part (`claimed` grows by what was paid, the rest stays claimable). Tested: a forged root
  over the whole vault paid the thief at most one window, then `setPaused(true)` + `setRootPoster(0)` stopped it and the
  owner withdrew the rest (owner withdrawals are not capped).
- `check-reward-vault.mjs` fails a vault that has a poster but no payout limit, or whose poster is the owner.
- Server side (`lib/rewards.ts` `postRoot`): only roots of periods that `buildPeriod` accepted (the vault can pay every
  outstanding amount) are posted; the hash is stored on the period and a reverted transaction is sent again; publishing
  still requires the on-chain root to equal the period's root.
- Residual risk: the payout limit should be set close to what holders really claim per hour; a limit set too high
  weakens the protection, one set too low only slows claims. Monitor `Claimed` events and the poster's ETH balance.

## Addendum: operating rules added after the application audit (1 October 2026)

- Order: the Safe sets the payout limit BEFORE it names a poster (`scripts/build-safe-batch.mjs` writes one batch in
  that order). The server refuses to post while the vault has no limit, names another poster, or the poster is the owner.
- The server watches `RootUpdated` on the vault. A root it did not build stops the automation and is reported
  (`rootWatch.alert`); it is never published and never used for proofs.
- Recovery after a leaked key: pause, remove the poster, have the Safe post the correct root again, and only then
  unpause. Unpausing while a forged root is still on the vault lets the forged claims continue.
- Periods are bound to the vault, token and chain they were built for. `claimed()` starts at zero on a new vault, so a
  tree built from the old cumulative amounts would pay everything again; the server refuses that build.
- A claim can be submitted by anyone for the account in the leaf (the tokens always go to that account). Eligibility
  is enforced by the app when it serves proofs, not by the contract.
- The vault's balance is the worst-case loss of every failure mode above. Fund it for one to two weeks, not for a year.
