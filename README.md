# RHIO Agent Studio

Build AI agents as characters: pick a look, write a personality, equip up to four skills, and run tasks.
Agents can be published to a pay-per-run marketplace that accounts in credits. Sign-in is wallet-only
(Sign-In with Ethereum on Robinhood Chain).

RHIO is an independent project. It is not affiliated with, endorsed by or partnered with Robinhood Markets or Anthropic.

## What is live, what is not

- **Live:** character studio (25 procedural characters, three.js), agent builder, eight skills, workspace storage
  per account, history, export / import, schedules, the credit marketplace, wallet sign-in.
- **Live on rhio.studio (Robinhood Chain mainnet):** the RHIO token (since 2 October 2026; the contract address is the
  one in the CA box on the home page), live AI on a server-side provider, USDG credit top-ups, holder tiers, and holder
  rewards in NVDA Stock Tokens ($0.01 per hour per 1,500,000 RHIO held, settled and claimable every hour).
  Every one of these is a server setting: another deployment has them off until its operator configures them.
- **Built, not switched on:** earnings claims in USDG (the claims contract is not deployed).
- **Not done:** an independent audit. The contracts in `contracts/` have not been audited. Credits have no monetary value.

Without an AI provider every skill returns a clearly labelled workflow sample.

## Development

Node >= 22.13.

```sh
npm ci
npm run dev        # http://localhost:5173
npm run build
npx tsc --noEmit
```

Setup, local migrations and tests are described in [START-HERE-ID.md](START-HERE-ID.md) (Indonesian).

## Hosting

The app is a Cloudflare Worker with a D1 database. It runs on Cloudflare, or in one Docker container on workerd
with SQLite on a volume.

- [DEPLOY-ID.md](DEPLOY-ID.md): configuration, AI providers, limits, chain features
- [COOLIFY-ID.md](COOLIFY-ID.md) and [DOCKER-ID.md](DOCKER-ID.md): Docker / Coolify, server security
- [GO-LIVE-RHIO-ID.md](GO-LIVE-RHIO-ID.md), [VAULT-MAINNET-ID.md](VAULT-MAINNET-ID.md),
  [REWARDS-NVDA.md](REWARDS-NVDA.md): token go-live, reward vault, reward rules

Secrets belong in the host's environment only. Never commit them, never put them in frontend files, and never
paste them into a chat. The server holds no key that can transfer funds.

## Security

Please report vulnerabilities privately to the maintainers instead of opening a public issue.
`contracts/SECURITY-REVIEW.md` holds the internal review of the claims contract; it is not an audit.

## Third-party assets

See `public/licenses/` and [public/integration-guide.txt](public/integration-guide.txt).
