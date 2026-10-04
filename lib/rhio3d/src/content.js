/* RHIO — Docs, Whitepaper and Roadmap content. Shared by the standalone studio and the Next app.
   Bodies are a small Markdown subset (headings, paragraphs, lists, bold, code, blockquote, tables). */
(function (G) {
'use strict';
const R = G.RHIO;

R.CONTENT = {
version: 'v0.8 · 4 October 2026',

/* ---------------------------------------------------------------- DOCS */
docs: [
{ id: 'overview', title: 'What is RHIO', body: `
RHIO Agent Studio is a game-like workspace for building AI agents. You pick a 3D character, dress it, give it a personality and a set of practical skills, then run real tasks: research briefs, summaries, document Q&A, drafts, translations, plans and code reviews.

The character is not decoration for its own sake. It makes an agent feel like a teammate you recognise, and it gives the studio a language for state: the agent thinks while Claude works, cheers when a task lands, shrugs when something fails.

**What is live today**

- 25 original characters (22 humanoids, 3 companion bots) rendered in the browser.
- Full outfit editor: build, skin, eyes, hair, facial hair, tops, bottoms, shoes, gear, glow, finish.
- 20 motions and 6 powers with visual effects.
- Agent skills, up to 4 per agent, that run on Claude when the studio is opened inside Claude. All eight are open; runs cost credits, and an operator can cap how often an account may try each skill.
- Saving, duplicating, exporting and importing agents.
- A pay-per-run marketplace in the self-hosted workspace: publish agents to Discover with a price in preview credits.
- Wallet sign-in only (Sign-In with Ethereum for Robinhood Chain): Robinhood Wallet or any EVM wallet. Signing is free and sends no transaction. There is no email or password login.
- Wallet & chain page: link more wallets to one account.
- Schedules: let an agent run one of its skills on its own, 1 to 24 times a day, paid with credits per run. Results land in History.

**Live on rhio.studio** (Robinhood Chain mainnet)

- The RHIO token, since 2 October 2026. Its contract address is in the CA box on the home page.
- Credit top-ups in USDG, credited after the server reads the transfer on-chain.
- Holder tiers from the RHIO balance of linked wallets: monthly credit allotments and a lower platform fee.
- Holder rewards in NVDA Stock Tokens: every 1,500,000 RHIO held earns $0.01 of NVDA per hour, priced by Chainlink, settled every hour and claimed from a reward vault. See Holder rewards (NVDA).

Another server running this software has these off until its operator configures Robinhood Chain addresses.

**What is not live**

- Earnings claims: creators will queue earned credits and claim USDG on-chain from a distributor contract with a merkle proof. The contract is written and tested locally, not audited and not deployed.
- An independent audit: the reward vault's source is verified on the explorer, but neither it nor the claims contract has been audited.
- On-chain monitoring.

Credits are not cash: they cannot be withdrawn or refunded to a wallet. Only credits you **earn** from other people running your agents can be claimed, and only once claims are switched on.

Nothing in this studio is financial advice, and nothing here is an offer to sell a token.
` },
{ id: 'start', title: 'Getting started', body: `
1. **Choose a character** from the roster on the left. Search by name or role, or filter humans and bots.
2. **Dress it** in the Outfit tab. Every change renders immediately. Use *Randomize* for a surprise and *Reset* to return to the preset.
3. **Give it a persona**: a name, instructions, a tone and an answer language. The instructions are sent to Claude with every task.
4. **Equip skills** (up to four). Each skill has its own inputs.
5. **Run a task** from the Run task tab. The first run asks your permission to use Claude on your account.
6. **Save**. Saved agents appear under *My agents*, where you can duplicate, export or delete them.

Tips: drag the stage to turn the character, scroll to zoom, double-click to reset the view, and press keys 1–6 to fire powers.
` },
{ id: 'characters', title: 'Characters & outfits', body: `
The 22 human characters are modelled, rigged bodies with painted skin and hair, from the public-domain (CC0) "Universal Base Characters" kit by Quaternius. The studio dresses them: every garment, shoe, hat and accessory is made in your browser from the look you choose, so any outfit fits any character. The android (Byte) and the three companion bots are built entirely from code. The model files (about 3 MB) load when a character is first shown; if they cannot be loaded, a human is drawn with the studio's built-in body made of shapes instead. Every agent stands on a small platform.

**Life layer.** Every character breathes, shifts weight, blinks, glances around and turns its head toward your pointer, even when it is "idle". The mouth and brows of a modelled face do not move; the android and the bots show expressions on their screens. Motions cross-fade into each other. Hair, coats, capes, scarves and antennas react to movement with a simple spring simulation.

**Outfit slots**

| Slot | Options |
| --- | --- |
| Body | Feminine, Masculine |
| Build | Slim, Regular, Curvy, Broad |
| Hair | 13 styles, any colour |
| Facial hair | None, Stubble, Beard |
| Top | T-shirt, Tank, Sweater, Hoodie, Track jacket, Flight jacket, Open jacket, Suit, Long coat, Robe, Armor, Spacesuit |
| Bottom | Pants, Joggers, Cargo, Shorts, Skirt (+ tights) |
| Shoes | Sneakers, Boots, Loafers |
| Head | Cap, Beanie, Explorer hat, Headphones, Halo, Cat ears, Space helmet |
| Face | Glasses, Shades, Visor |
| Back | Backpack, Jetpack, Cape, Scarf |
| Colour | Every slot, plus a glow colour used by lights, powers and the pad |

Companion bots (Scout, Maker, Guardian) have a shell colour, an accent and a glow instead of clothing.

Each character has a **signature power** with a shorter cooldown. It is shown on the roster card and in the stage header.
` },
{ id: 'motions', title: 'Motions & powers', body: `
**Motions** are grouped as Gestures (Wave, Nod, Shrug, Point, Clap, Salute, Bow), Moods (Idle, Think, Typing, Laugh, Cheer, Stretch, Victory) and Moves (Walk, Run, Jump, Spin, Dance, Disco). Looping motions (marked with a ring) become the agent's default stance and are saved with the agent. One-shot motions play once and return to the stance.

Walk and Run circle the platform. Speed can be set to 0.5×, 1× or 1.5×, and the stage can be paused.

**Powers** are stage actions with effects. They do not do any work; they are there for feel and for showing state.

| Power | Key | Effect |
| --- | --- | --- |
| Pulse Orb | 1 | Charges an energy orb between the hands and launches it |
| Aegis | 2 | Raises a hex shield dome around the agent |
| Blink | 3 | Dissolves and re-forms a step to the side |
| Levitate | 4 | Floats above the pad with a ring of light |
| Deep Scan | 5 | Sweeps a scanner ring and shows the agent's profile card |
| Hype | 6 | Confetti burst and a cheer |

The studio also triggers motions automatically: Think or Typing while a task runs, Cheer or Victory when it completes, Shrug on an error, Salute on save.
` },
{ id: 'skills', title: 'Agent skills', body: `
Skills are prompt programs. Each one combines your agent's persona with a task template and sends it to Claude through the studio page. Claude has no browsing and no memory between runs, so every skill states its inputs explicitly.

| Skill | Inputs | Output |
| --- | --- | --- |
| Research brief | question, depth | short answer, key findings, trade-offs, open questions, what to verify |
| Summarizer | text or file, style | TL;DR, key points or action items |
| Document Q&A | document, question | answer, quoted evidence, confidence |
| Content writer | brief, format, length | thread, post, caption, outline or email |
| Translator | text, target language, style | translation plus a note on untranslatable phrases |
| Idea generator | topic, count | ranked ideas with reason and effort |
| Code explainer | code, mode | explanation, review, bug list or commented code |
| Task planner | goal, timeframe | ordered checklist with estimates |

**Where skills run.** Inside Claude (as a published artifact), the page asks your permission once and then uses your own Claude account for each run. Opened anywhere else, the studio shows "Claude offline" and the Run button is disabled; everything else still works. In the self-hosted Next.js version of RHIO, skills go through the server, which supports an AI provider once one is configured; until then it returns clearly labelled workflow samples.

**Honesty rules baked into every prompt:** say when unsure, never invent links, quotes or statistics, use only the supplied text for document tasks.

**Schedules.** After you pick the skills, choose how the agent works: in the Studio's **Automate** tab or on the Schedules page, pick a skill, write the task, choose how many times a day (1, 2, 3, 4, 6, 8, 12 or hourly) and the time of the first run. The server runs it on those slots and each run costs the skill's live price in credits (at least 5). You can keep up to 3 schedules and 24 scheduled runs a day. When credits run out, or the agent or skill is removed, the schedule pauses and says why. Scheduled runs never count toward a cap on tries per skill.

**Planned, not active:** Wallet monitor.
` },
{ id: 'credits', title: 'Credits, prices & earnings', body: `
The self-hosted workspace runs a **pay-per-run** economy in credits.

- Every new account starts with **25 free credits**: enough for two web research runs or five to six lighter tasks. A workflow sample costs 5.
- **Free credits refill every 24 hours**: the free part of your balance is topped back up to 25. Bought credits are never touched and free credits never pile up past 25.
- **Heavy skills** (Web research, Document Q&A, Code explainer) have a 5-hour window: 2 runs per window on free credits, 20 while you hold bought credits. Lighter skills only have the daily limit. Free live AI also shares one daily pool for the whole studio: when it is used up, accounts that hold bought credits can still run live AI and free runs open again at 00:00 UTC.
- A live AI run is priced by skill: Web research 12, Document Q&A and Code explainer 6, Content writer 5, Summarizer, Translator, Idea generator and Task planner 4. The operator can change these prices.
- Runs paid only with free credits use a lighter model; runs paid with bought credits use the full model.
- Any saved agent can be **published to Discover** with a price from 0 to 500 credits per run. The agent's instructions are never shown: visitors see the character, tagline, skills, tone and language. The agent is told to keep its instructions to itself and an answer that copies them is withheld, but no AI can promise it never paraphrases them, so never put passwords or keys in instructions.
- When someone runs your published agent, the price is debited from them and credited to you, minus the platform fee. Running your own agent never charges the creator price.
- **Platform fee: 0% during beta**, then 10%. It is a server setting (\`PLATFORM_FEE_BPS\`), so it can change without a code change.
- Every movement is written to a ledger (grant, run, earning, fee, refund). If a run fails, the buyer gets the credits back and the creator is not paid. A failed run still counts toward the daily and 5-hour limits when the AI had already started answering.
- Credits have **no monetary value**. On rhio.studio you can buy credits with USDG on Robinhood Chain (1 USDG = 100 credits). Claims of **earned** credits in USDG are built but not switched on. Granted and bought credits can never be withdrawn or refunded.

The published studio page does not use credits at all: skills run on the viewer's own Claude account.
` },
{ id: 'save', title: 'Saving, export & share', body: `
- **Save agent** stores the agent. In the published studio it is stored in your browser; in the self-hosted workspace it is stored per account in the database.
- **Export** produces a JSON config. It contains the character id, the full outfit look, the default motion, persona, tone, language and skills. It also carries the older \`appearance\` fields so first-generation configs remain readable.
- **Import** accepts a config or a list of configs. First-generation configs (12 characters, colour-only appearance, motion names such as Pray) are converted automatically.
- **Share links** in the self-hosted workspace embed the config in the URL fragment. Nothing is sent to a server when a link is opened.

The config never contains API keys, wallet addresses or account identifiers.
` },
{ id: 'rewards', title: 'Holder rewards (NVDA)', body: `
> **Live on rhio.studio.** Hours have been settled since 3 October 2026 and claims are open. The Rewards page in the dashboard shows the current price, the vault and every settled hour. The reward vault is source-verified but not independently audited, and NVDA Stock Tokens are restricted in some countries (see below).

**The rule.** Every complete **1,500,000 RHIO** held in your wallet earns **$0.01 of NVDA per hour**, counted by the second.

| RHIO held | Units | Per hour | Per day |
| --- | --- | --- | --- |
| 1,499,999 | 0 | $0 | $0 |
| 1,500,000 | 1 | $0.01 | $0.24 |
| 3,000,000 | 2 | $0.02 | $0.48 |
| 4,500,000 | 3 | $0.03 | $0.72 |

Units are whole blocks of 1,500,000: 2,999,999 RHIO is still 1 unit. The dollar value is fixed; the number of NVDA tokens follows the NVDA price when each hour is settled.

The unit was 3,000,000 RHIO for the first hours after launch and has been 1,500,000 since 3 October 2026. The rate is a server setting: the team can change it, and hours already settled keep their amounts.

**No staking.** RHIO stays in your own wallet. The server reads every RHIO transfer on Robinhood Chain, so it knows each wallet's balance at every second. Moving RHIO to another wallet never earns twice, and buying just before an hour closes earns seconds, not the hour. Selling stops the accrual at the second of the transfer.

**Price.** Each hour is converted to NVDA at the latest **Chainlink NVDA / USD** price on Robinhood Chain. Stock prices pause on weekends and US holidays: those hours are settled at the last price before the pause, as long as it is not older than 72 hours. Beyond that, during a corporate-action pause of the NVDA token, or after a jump of 50% or more that the team has not confirmed, hours wait and are settled together when the price is available again. Amounts always round down.

**Vault.** The team buys NVDA and sends it to the reward vault (a RhioClaims contract). An hour is settled only when the vault can pay everything owed in full; otherwise it waits and nothing is lost. The dashboard shows the vault as **Funded**, **Low** or **Needs a refill**, and every refill is public on-chain.

**Claiming**

1. Sign in with your wallet and link every wallet that holds RHIO.
2. Open **Rewards** in the dashboard and confirm your eligibility once (country of residence).
3. When the latest root is on-chain, press **Claim**. Your wallet sends the claim and pays a little ETH for gas. You receive everything settled so far that you have not claimed yet. The vault releases a limited amount per hour for all claims together: a claim above what is left for that hour is paid in part, and you claim the rest later.

**Who cannot claim.** NVDA Stock Tokens are debt securities of Robinhood Assets (Jersey) Limited, not shares. They may not go to US persons, they are restricted in Canada, the UK and Switzerland, and they are prohibited in Cuba, Belarus, Iran, North Korea, Russia, Syria, Ukraine, South Sudan, Sudan, Myanmar and Venezuela. Team, treasury and liquidity wallets never earn.

**What you trust.** The contract pays what the published root says; it does not check the formula. Every input (transfers, refills, roots, claims) is public, so anyone can recompute the numbers. The server holds no key that can transfer the vault's tokens. For hourly claims it holds one key that can only post a root; the vault itself caps how much can be claimed per window, and the multisig can pause the vault or replace that key.
` },
{ id: 'privacy', title: 'Privacy & safety', body: `
- Task inputs are sent to Claude only when you press Run. They are not stored by RHIO beyond the local task history you can clear.
- The published page has no analytics and makes no network requests of its own.
- Prompts treat any pasted document as untrusted content: instructions inside a document are not followed.
- No provider secrets ever live in the frontend. The self-hosted version reads provider settings on the server only.
- RHIO is an independent project. It is not affiliated with, endorsed by or partnered with Robinhood Markets or Anthropic.
` },
{ id: 'faq', title: 'FAQ', body: `
**Is the RHIO token live?** Yes, since 2 October 2026, on Robinhood Chain (chain 4663). The contract address is the one in the CA box on the home page of this site: it is the only place we publish it. Check it on robinhoodchain.blockscout.com and treat every other address as not ours. Nobody from RHIO will ask for your recovery phrase or ask you to send tokens anywhere.

**Why Robinhood Chain?** Robinhood Chain is an Ethereum-compatible Layer 2 built on Arbitrum. Its mainnet launched on 1 July 2026 (chain id 4663; testnet 46630). It pays gas in ETH, has USDG as its main stablecoin, and hosts Robinhood's Stock Tokens. RHIO uses it for wallet sign-in, top-ups, claims and holder tiers. Only trust the official explorer, robinhoodchain.blockscout.com.

**How do top-ups work?** Link a wallet, then pay USDG from it to the RHIO treasury on the Wallet & chain page. Your wallet asks you to confirm the transfer. The server reads the transaction from the chain and adds credits after a few confirmations (default rate: 1 USDG = 100 credits). A payment from a wallet you have not linked is not credited. On rhio.studio top-ups are on and use real USDG on mainnet; credits cannot be refunded or withdrawn.

**How do claims work?** Earnings claims are built but not switched on yet. Once they are, credits you earn when other people run your published agents can be queued for a claim to one of your linked wallets. The RHIO multisig publishes the queued claims as a merkle root on the RhioClaims contract. You then claim USDG on-chain and pay your own gas. The server never holds a payout key.

**What are holder tiers?** Tiers (Free, Holder, Builder, Studio) come from the RHIO held by your linked wallets. They give monthly credits and a lower platform fee on your sales. They are live on rhio.studio: Holder from 10,000 RHIO, Builder from 100,000, Studio from 1,000,000.

**Can I upload my own 3D model or photo?** Not yet. All characters come from one shared set of bodies and are dressed by the studio, so every look stays consistent and light.

**Does research browse the web?** In the published studio, no. Claude answers from its training and the prompt asks it to list what you should verify. In the self-hosted workspace, yes, once the operator connects a provider with search: Claude or OpenAI web search, or Gemini with Google Search. Answers list their sources; with Google Search, Google's search suggestions are shown under the answer. Web search costs the operator per query, so the studio has a daily number of searching runs, and an operator can keep web search for accounts that hold bought credits. When a run cannot search, Web research still answers from what the model knows and says so; the Run panel tells you before you run. An answer without listed sources was not checked on the web.

**Is my agent visible to other people?** Only if you publish it. Published agents appear in Discover with a price; their instructions are never shown to anyone else.

**How do I sign in?** With a wallet only: Robinhood Wallet (on your phone, open RHIO in its in-app browser) or any EVM wallet such as MetaMask or Rabby. Choose Connect wallet and sign a message for Robinhood Chain. It is free, sends no transaction and never asks for your recovery phrase. There is no email or password login.

**Is there NVDA on Robinhood Chain?** Yes. Robinhood issues Stock Tokens there, NVDA among them. The official NVDA contract is 0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC (mainnet; there is none on testnet). Stock Tokens are tokenised debt securities issued by Robinhood Assets (Jersey) Limited. They are standard ERC-20 tokens (18 decimals) that track the share price and give economic exposure, not ownership of the share. The token contract itself does not restrict transfers. The limits are legal: they may not be offered, sold or delivered to US persons, and they are restricted in Canada, the UK, Switzerland and several sanctioned countries. The chain also screens transactions linked to sanctioned addresses.

**What is the NVDA reward?** RHIO holders get NVDA Stock Tokens on Robinhood Chain. Every 1,500,000 RHIO you hold earns $0.01 of NVDA per hour (3M = $0.02, 4.5M = $0.03), counted by the second. The dollar value is fixed; the NVDA amount follows the live Chainlink NVDA price when each hour is settled. No staking: RHIO stays in your wallet. The RHIO team buys NVDA and refills the reward vault, and holders claim it themselves with a merkle proof, paying a little ETH for gas. The program is live on rhio.studio: an hour is settled every hour and you claim on the Rewards page. Stock Tokens are debt securities, not shares, and may not go to US persons or to restricted and sanctioned countries, so every holder confirms eligibility before their first claim. See Holder rewards (NVDA) in these docs and the whitepaper.

**Can I use RHIO without Claude?** Yes, for everything except running skills.
` },
],

/* ---------------------------------------------------------- WHITEPAPER */
paper: {
title: 'RHIO Whitepaper',
subtitle: 'Characters, skills and a credit economy for everyday AI agents',
status: 'Token and holder rewards live · updated 3 October 2026',
sections: [
{ id: 'abstract', title: 'Abstract', body: `
RHIO is an agent studio where people build AI agents as characters: a look they choose, a personality they write, and a small set of skills that do useful work. The studio runs today, and so does its economy: creators publish agents with a price, users pay per run in credits, and the creator keeps the price minus a platform fee. The RHIO token, live on Robinhood Chain since 2 October 2026, is a second layer on top of that: holders get monthly usage credits and a lower platform fee, and they earn holder rewards in a real-world asset, tokenized NVDA stock on Robinhood Chain, at a fixed rate: every 1,500,000 RHIO held earns $0.01 of NVDA per hour, priced by Chainlink and paid from a vault the team refills.

This document describes the product and the token as they exist today, and what is planned but not built. Where a part is planned or not done, it says so.
` },
{ id: 'problem', title: 'The problem', body: `
AI assistants are powerful and forgettable. Every session starts from a blank prompt; every "agent" is a text box with a name. People who are not prompt engineers get little from the tooling, and people who are get no way to package what they know into something others can use.

Three gaps stand out:

1. **No identity.** Agents have no persistent character, so users do not form habits around them.
2. **No packaging.** Good prompts and workflows live in personal notes instead of reusable, shareable agents.
3. **No fair economy.** Usage is metered per platform account. There is no way for a creator to be paid when their agent does work for someone else, and no way for a community to sponsor usage for its members.
` },
{ id: 'product', title: 'The product today', body: `
**Characters.** 25 characters with an outfit system, 20 motions and 6 powers. The 22 humans are modelled bodies from a public-domain (CC0) character kit, about 3 MB of static files served with the site; their clothes, shoes and accessories are generated in the browser from the chosen look. The android and the three bots are generated from primitives.

**Persona.** A name, free-form instructions, a tone and an answer language. These travel with the agent and are prepended to every task.

**Skills.** Eight prompt programs (research brief, summarizer, document Q&A, content writer, translator, idea generator, code explainer, task planner). All eight are open. Runs cost credits, and an operator can cap how often an account may try each skill (a failed run gives the try back). An agent carries up to four. Skills run on Claude inside the published studio, or through a server-side provider in the self-hosted workspace.

**Persistence.** Agents are saved, duplicated, exported and imported as plain JSON. The self-hosted workspace stores them per account, keeps task history and tracks credits with atomic, idempotent debits.

**Marketplace.** Creators publish agents to Discover with a per-run price (0–500 credits). Buyers pay per run; the creator is credited when the run completes, minus the platform fee (0% in beta). Instructions are never shown to buyers or returned by the API. Every credit movement is recorded in a ledger with refunds on failed runs.
` },
{ id: 'architecture', title: 'Architecture', body: `
\`\`\`
Browser
  ├─ Character engine (three.js: rigged bodies, outfits made in the browser, spring bones, VFX)
  ├─ Studio UI (roster, outfit editor, persona, skills, run)
  ├─ Skill runner → Claude (published page)  or  → /api/runs (self-hosted)
  └─ Wallet (EIP-1193): SIWE sign-in / link, USDG transfer, on-chain claim

Self-hosted workspace (Cloudflare Worker + D1)
  ├─ /api/auth/*        Better Auth: Sign-In with Ethereum for Robinhood Chain (wallet only)
  ├─ /api/agents        owner-scoped agent configs (JSON)
  ├─ /api/workspace     agents, runs, credit balance, ledger
  ├─ /api/runs          atomic credit debit, idempotent run ids, tier fee discount
  ├─ /api/chain         public Robinhood Chain settings (no secrets)
  ├─ /api/wallet        link / unlink wallets (SIWE, one-time nonce)
  ├─ /api/topups        verify a USDG transfer receipt, credit once per log
  ├─ /api/claims        queue earned credits; merkle proofs for the latest epoch
  ├─ /api/claims/epoch  operator: build a root, publish after the multisig posts it
  ├─ /api/tier          RHIO balance → tier; monthly allotment at a snapshot block
  ├─ /api/rewards       NVDA holder rewards: rule, price, vault, your accrual and proofs
  ├─ /api/rewards/admin operator: sync, settle, publish (never signs a transaction)
  └─ /api/schedules     agents that run a skill on their own; ticked every minute

Robinhood Chain (chain 4663, testnet 46630)
  ├─ USDG             top-ups and claim payouts
  ├─ RhioClaims       cumulative merkle distributor for USDG earnings (not deployed, unaudited)
  ├─ RhioClaims #2    NVDA reward vault, owned by the multisig (live, source-verified, not audited)
  ├─ RHIO (ERC-20)    live; the address is the one in the CA box on the home page
  ├─ NVDA Stock Token holder reward asset (legally restricted)
  └─ Chainlink        NVDA / USD price feed
\`\`\`

Design constraints we hold to: no secrets in the frontend, no trust in client-supplied identity headers, prompt inputs treated as untrusted content, every paid or on-chain action signed by the user in their own wallet, and no payout key on the server. The server only reads the chain, through its own RPC.
` },
{ id: 'token', title: 'The RHIO token', body: `
> **Live since 2 October 2026.** RHIO is an ERC-20 token on Robinhood Chain mainnet. The only place its contract address is published is the CA box on the home page of rhio.studio.

**On-chain facts** (anyone can check them on robinhoodchain.blockscout.com)

| Item | Value |
| --- | --- |
| Name and symbol | Rhio Agent (RHIO) |
| Chain | Robinhood Chain, an Ethereum-compatible Arbitrum Layer 2 (mainnet since 1 July 2026, chain id 4663) |
| Standard | ERC-20, 18 decimals |
| Total supply | 1,000,000,000 RHIO, minted once at deployment |
| Contract | Not an upgradeable proxy and no owner function |
| Transfers | Balances change only through transfers: no transfer tax and no rebasing (checked against the full transfer history on 3 October 2026) |
| Burned | 54,586,381.54 RHIO (about 5.5% of the supply) sent to the burn address on launch day |

This paper lists no allocation or vesting table: the table in earlier drafts was a proposal and does not describe the token as it launched. The holder list on the explorer shows where the supply sits. Team, treasury, liquidity and burn addresses do not earn holder rewards.

**What holding RHIO does today**

1. **Holder rewards.** RHIO held in your own wallet earns NVDA Stock Tokens at a fixed dollar rate (below). There is no staking and no lock.
2. **Usage credits.** Each tier receives a monthly credit allotment. Credits are off-chain, non-transferable and have no cash value; the token is never spent to run a task.
3. **Fee discount.** Creators in a tier keep a larger share when others run their agents. The platform fee is 0% during the beta, so the discount starts to matter when the fee is switched on.

**Planned, not built**

- A creator boost: more visibility in Discover for agents from higher tiers.
- Agent slots per tier.
- Part of the platform fees helping to refill the reward vault, once fees are on.
- Advisory votes on roadmap priorities, fee levels and the skill library.

**Tiers** (live on rhio.studio)

| Tier | Hold (RHIO) | Platform fee | Monthly credits | Agent slots (planned) |
| --- | --- | --- | --- | --- |
| Free | 0 | 10% | none | 10 |
| Holder | 10,000 | 7% | 100 | 25 |
| Builder | 100,000 | 5% | 300 | 50 |
| Studio | 1,000,000 | 3% | 1,000 | unlimited |

The fee column is the creator's platform fee once the 10% fee is on. The server adds up the RHIO balance of every wallet linked to an account. The fee discount applies to the creator's platform fee on each sale; the tier is cached for 24 hours. The monthly allotment is claimed once per account and once per wallet. Balances are read at the month's **snapshot block**, which the first claim of the month fixes, so moving tokens to a fresh wallet afterwards earns nothing extra.

**Holder reward in NVDA Stock Tokens (live)**

The reward asset is a real-world asset instead of more RHIO: Robinhood's **NVDA Stock Token** on Robinhood Chain. Stock Tokens are ERC-20 tokens that track the share price. They give economic exposure, not legal ownership of the share. How it works:

1. **Rate.** Every complete **1,500,000 RHIO** held earns **$0.01 per hour**. Units are whole blocks: 1,499,999 RHIO is 0 units, 2,999,999 is 1, 3,000,000 is 2. Accrual is per second, so half an hour at 1 unit is $0.005.
2. **Holding, not a snapshot.** The reward is computed from every RHIO transfer on Robinhood Chain, so each wallet's balance is known at every second. A token sits in one wallet at a time: moving RHIO to another wallet never earns twice, and buying just before an hour closes earns seconds, not the hour. (A contract that only reads the current balance cannot see this history, which is why the calculation runs on recorded transfers.)
3. **Paid in NVDA.** Each hour is settled at the latest Chainlink NVDA / USD price on Robinhood Chain: $0.01 at an NVDA price of $180 is 0.0000555 NVDA. The dollar value is the promise; the token amount follows the price. Amounts always round down.
4. **Vault.** The team buys NVDA and refills the reward vault (a RhioClaims instance). An hour is only settled when the vault can pay everything owed in full; otherwise it waits and is settled later, so no accrual is lost. Holders claim themselves and pay their own gas; nothing is pushed.

| Parameter | Value |
| --- | --- |
| Reward asset | NVDA Stock Token on Robinhood Chain |
| Source | NVDA bought by the team from its treasury, and from platform fees once fees are on |
| Rate | $0.01 per hour for every complete 1,500,000 RHIO held, accrued per second. The unit was 3,000,000 RHIO for the first hours after launch and has been 1,500,000 since 3 October 2026 |
| Price | Chainlink NVDA / USD feed on Robinhood Chain (8 decimals). Weekend and holiday hours use the last price before the pause. An hour waits if that price is older than 72 hours, if the NVDA token reports a corporate-action pause, or if the price moved 50% or more until the team confirms it |
| Period | Hourly: closes on every full hour UTC. Each hour's root is posted to the vault automatically a few minutes later, and you can claim everything settled so far |
| Vault | Refilled by the team with NVDA; never settles more than it can pay. A payout limit in the vault caps what all claims together can take out per hour |
| Payout | Claim with a merkle proof (RhioClaims) |
| Excluded | Team, treasury and liquidity wallets never earn |

**What limits this, technically and legally.** The token contract does not block transfers. A read-only simulation on mainnet showed NVDA transfers from a holder to a fresh wallet and to a contract both succeed, so a distributor contract needs no issuer allow-list. The chain does screen transactions linked to sanctioned addresses at the sequencer.

The real limits are legal. Stock Tokens are tokenised debt securities of Robinhood Assets (Jersey) Limited. They may not be offered, sold or delivered, directly or indirectly, in the United States or to US persons. They are restricted in Canada, the UK and Switzerland, and prohibited for investors in Cuba, Belarus, Iran, North Korea, Russia, Syria, Ukraine, South Sudan, Sudan, Myanmar and Venezuela.

**What the studio does about it.** Before a first claim, a holder states their country of residence and confirms they are not a US person; claims from the restricted and prohibited countries above are refused. This is a self-certification. There is no identity check, no legal opinion has been published, and there is no USDG alternative for holders who cannot receive Stock Tokens. Each holder is responsible for their own eligibility.

**The four parts of the program** (running on mainnet):

| Part | What it does |
| --- | --- |
| Holder recorder | Reads every RHIO Transfer on Robinhood Chain (settled blocks only), so each wallet's balance is known at every second. |
| Reward calculator | Settles each hour automatically on the full hour: units × $0.01 × seconds held, converted to NVDA at the live Chainlink price, integer math, rounded down. Refuses to settle with a stale price or an underfunded vault. |
| Reward vault | A separate RhioClaims instance holds the NVDA. Refills are plain transfers, verified on-chain. A dedicated key that can only post roots publishes each hour's root (each root includes every hour before it), so claims open every hour; a payout limit in the vault caps what can leave per hour, and the multisig can pause the vault or replace that key at any time; holders claim the difference between their cumulative total and what they already received. |
| RHIO dashboard | Shows the rule, the NVDA price, the vault, your RHIO, units, hourly rate, what you accrued, your settled hours, and a Claim button that sends the claim from your own wallet. |

The rate, the unit and the reward asset are server settings, and the team funds the vault with its own money: the program can be changed, paused or ended. Hours already settled keep their amounts.

**What the token is not.** It is not required to use the studio and it is not a payment for AI usage. Holder rewards are paid from a vault the team funds while the program runs; they are not a claim on RHIO revenue or equity, and they confer no rights against the team. Credits have no cash value and cannot be converted to RHIO. Only earned credits will be claimable, in USDG, once the claims contract is live.
` },
{ id: 'economy', title: 'Credit economy', body: `
Credits are the unit the studio accounts in today.

**Sources.** 25 free starting credits per account, plus three more sources:

- **Top-ups in USDG on Robinhood Chain.** Live on rhio.studio. The buyer sends USDG from a linked wallet to the treasury. The server reads the receipt through its own RPC and checks the token, recipient, sender and amount. Credits are added after the required confirmations (default 3), exactly once per transfer log.
- **Holder allotments.** Monthly, from the tier table. Live since the token launch.
- **Earnings** from other people running your published agents.

Top-ups fund the actual AI provider bill. Allotments are a subsidy, capped per period.

**Claims** (built, not switched on: the claims contract is not deployed). Only earned credits can leave the system, never grants, top-ups or allotments. A creator queues a claim of at least 500 earned credits to a linked wallet, and the credits leave the balance at once. The operator groups every claim into a cumulative merkle root, one leaf per wallet: its total ever owed. The multisig posts that root to RhioClaims. The creator then claims the difference between that total and what the wallet already received. New roots never double-pay, and no server key can move funds. Default rate: 100 credits = 1 USDG.

**Flows.** A run on your own agent costs the platform fee for the run: 5 credits for a workflow sample, 4 to 12 for live AI depending on the skill. A run on another creator's published agent costs that fee plus the creator's price. The price is split: platform fee (0% in beta, 10% afterwards) and creator share, credited when the run completes. A failed run is refunded and the creator is not paid. Everything is written to a ledger.

**Why per-run.** Per-run pricing ties earnings to real usage, keeps the buyer's risk to one task, and gives creators a direct signal on which agents are worth improving. Subscriptions and per-session pricing can be layered on later.

**Abuse.** Self-use never pays the creator price. Idempotent run ids stop double charges. Sybil rings that buy their own runs only move credits between accounts and pay the fee for it. Claims require a linked wallet, and a wallet belongs to one account. Top-ups only count from linked wallets, and a transaction hash can be used once. A minimum account tenure before claims is planned.
` },
{ id: 'launch', title: 'Launch status', body: `
The token went live on 2 October 2026 and the first reward hour was settled on 3 October 2026. This is where things stand.

**In place**

- The reward vault is owned by a multisig. The app server holds no key that can transfer funds. For hourly rewards it holds one key that can only post claim roots, behind a payout limit enforced by the vault.
- The reward vault's source code is verified on the explorer.
- Every refill, root and claim of the reward vault is public on-chain.
- Holders confirm their country of residence before a first claim; claims from restricted countries are refused.

**Not done**

- No independent audit of RhioClaims, the contract behind the reward vault and the future claims contract.
- No published legal review of paying NVDA Stock Tokens to holders.
- The top-up treasury is a team wallet, not a multisig.
- No allocation or vesting schedule is published, and nothing in this paper states that team tokens are locked.
- No governance, on-chain or advisory.

Earlier drafts of this paper planned an audit, a legal review and a working marketplace before the token. The token launched first; those items are listed above as not done.
` },
{ id: 'risks', title: 'Risks', body: `
- **Product risk.** The studio depends on third-party AI providers whose pricing and availability can change.
- **Chain risk.** Robinhood Chain is young (mainnet since July 2026). Its fees, terms and compliance filtering may change, and transactions can be screened before inclusion.
- **Smart contract risk.** RhioClaims is unaudited. A bug in it, or in a token it pays, could lock or lose funds.
- **Key risk.** A compromised multisig signer set, or a leaked root-posting key, could post a wrong root. Roots are public, the vault's payout limit caps what a wrong root can release per window, and claims can be paused.
- **Phishing risk.** Fake explorers and lookalike token addresses exist. RHIO will never ask for a recovery phrase or ask you to send funds to an address outside the app.
- **Regulatory risk.** Token distribution may be restricted or unavailable in some jurisdictions.
- **Economic risk.** Holder rewards are paid by the team from its own funds at a fixed dollar rate. The team can change the rate or stop the program, and when the vault runs low, hours wait until it is refilled.
- **Asset risk.** Rewards paid in NVDA Stock Tokens move with the NVIDIA share price and depend on the issuer and the chain; they can lose value. Legal restrictions (US persons, restricted and sanctioned jurisdictions) mean many holders could not receive them.
- **Oracle and operator risk.** The NVDA price comes from Chainlink, and the reward amounts are computed by the RHIO server and posted by the multisig or the root-posting key. A wrong price is limited by the 50% jump guard, the pause flag and the 72-hour age limit, not eliminated. Rewards are paid only while the team keeps the vault funded.
- **RWA regulatory risk.** Tokenized stocks are restricted or unavailable in many jurisdictions, and paying them to holders may bring securities rules into scope.
- **Security risk.** Prompt injection through pasted documents, wallet-linking scams and impersonation of the project are all expected; the studio is built to limit blast radius, not to eliminate risk.
` },
{ id: 'disclaimer', title: 'Disclaimer', body: `
This document is a product and design description, not an offer to sell or a solicitation to buy any token, and not investment, legal or tax advice. Nothing here creates any obligation on the team. The RHIO token may lose all value. RHIO is an independent project and is not affiliated with Robinhood Markets, Inc., Anthropic, or any AI provider named here.
` },
],
},

/* ------------------------------------------------------------- ROADMAP */
roadmap: [
{ phase: 'Phase 0', title: 'Foundation', when: 'Q3 2026', status: 'done', items: [
  ['done', 'Brand and modular R identity'],
  ['done', 'Agent studio: persona, skills, save / duplicate / archive / export / share'],
  ['done', 'Self-hosted workspace on Cloudflare Worker + D1 with preview credits'],
  ['done', 'Original character engine: 25 characters, outfit system, 20 motions, 6 powers'],
  ['done', 'Eight agent skills built and open'],
] },
{ phase: 'Phase 1', title: 'Private preview', when: 'Q4 2026', status: 'now', items: [
  ['now', 'Invite 20–50 testers; collect character, outfit and skill feedback'],
  ['done', 'Docs, whitepaper and roadmap'],
  ['done', 'Pay-per-run marketplace: publish agents with a price, Discover gallery, creator earnings, ledger'],
  ['next', 'Mobile polish: touch controls, low-power rendering mode'],
  ['done', 'Server-side AI provider connected on rhio.studio'],
  ['done', 'Web-backed research skill (sources with links): Claude, OpenAI or Gemini with Google Search, on once a provider is configured'],
] },
{ phase: 'Phase 2', title: 'Public beta', when: 'Q1 2027', status: 'planned', items: [
  ['done', 'Standalone hosting built: Docker / Coolify container with server-side wallet sign-in (Better Auth, SIWE)'],
  ['done', 'USDG top-ups on Robinhood Chain mainnet: live on rhio.studio'],
  ['done', 'Earnings claims: merkle epochs + RhioClaims contract, tested locally (unaudited, not deployed)'],
  ['next', 'Testnet deployment (chain 46630) with a public claims contract address'],
  ['planned', 'Independent contract audit; earnings claims on mainnet after it'],
  ['planned', 'Platform fee switched on (10%)'],
  ['done', 'Schedules: agents run a skill on their own, 1 to 24 times a day, paid with credits'],
  ['planned', 'Task history export'],
  ['planned', 'More characters, seasonal outfits, emotes'],
  ['planned', 'Community skill proposals'],
] },
{ phase: 'Phase 3', title: 'Token & wallet', when: 'Q4 2026', status: 'now', items: [
  ['done', 'Wallet link on Robinhood Chain (SIWE, several wallets per account)'],
  ['done', 'RHIO token live on Robinhood Chain mainnet (2 October 2026)'],
  ['done', 'Holder tiers live: fee discount, monthly allotment at a snapshot block'],
  ['planned', 'Agent slots per tier'],
  ['done', 'Holder reward pipeline on mainnet: holder recorder, per-second reward calculator, reward vault (RhioClaims), rewards dashboard'],
  ['done', 'Fixed-rate NVDA reward live: $0.01 per hour per 1,500,000 RHIO, Chainlink NVDA price, hourly settlement and hourly claims, full-or-wait vault'],
  ['done', 'Eligibility statement before claims, public funding and claim log'],
  ['planned', 'Legal review of NVDA payouts per region; USDG fallback for holders who cannot receive Stock Tokens'],
  ['planned', 'Wallet monitor skill'],
] },
{ phase: 'Phase 4', title: 'Creator economy', when: 'H2 2027', status: 'planned', items: [
  ['planned', 'Public agent gallery and remixing'],
  ['planned', 'Usage attribution and creator rewards'],
  ['planned', 'Advisory governance on roadmap and skill library'],
  ['planned', 'Team-shared workspaces'],
] },
{ phase: 'Later', title: 'Ideas under consideration', when: 'Not scheduled', status: 'idea', items: [
  ['idea', 'Voice for agents'],
  ['idea', 'Custom model upload with a style-consistent pipeline'],
  ['idea', 'Multi-agent tasks (agents that hand work to each other)'],
  ['idea', 'On-chain governance module'],
] },
],
};
})(window);
