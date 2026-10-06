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
- 26 motions (six of them emotes) and 6 powers with visual effects.
- Agent skills, up to 4 per agent, that run on Claude when the studio is opened inside Claude. All ten are open; runs cost credits, and an operator can cap how often an account may try each skill.
- Saving, duplicating, exporting and importing agents.
- A pay-per-run marketplace in the self-hosted workspace: publish agents to Discover with a price in preview credits.
- Wallet sign-in only (Sign-In with Ethereum for Robinhood Chain): Robinhood Wallet or any EVM wallet. Signing is free and sends no transaction. There is no email or password login.
- Wallet & chain page: link more wallets to one account.
- Schedules: let an agent run one of its skills on its own, 1 to 24 times a day, paid with credits per run. Results land in History, and a schedule can also send each one to your Discord channel or Telegram chat. An agent can also answer questions in a Telegram chat or group.

**Live on rhio.studio** (Robinhood Chain mainnet)

- The RHIO token, since 2 October 2026. Its contract address is in the CA box on the home page.
- Credit top-ups in USDG, credited after the server reads the transfer on-chain.
- Holder tiers from the RHIO balance of linked wallets: monthly credit allotments and a lower platform fee.
- Holder rewards in NVDA Stock Tokens: every 1,500,000 RHIO held earns $0.01 of NVDA per hour, priced by Chainlink, settled every hour and claimed from a reward vault. See Holder rewards (NVDA).

Another server running this software has these off until its operator configures Robinhood Chain addresses.

**What is not live**

- Earnings claims: creators will queue earned credits and claim USDG on-chain from a distributor contract with a merkle proof. The contract is written and tested locally, not audited and not deployed.
- An independent audit: the reward vault's source is verified on the explorer, but neither it nor the claims contract has been audited.
- Continuous on-chain monitoring: the Wallet monitor skill reads an address when it runs (by hand or on a schedule); nothing watches the chain between runs. A scheduled report can be sent to Discord or Telegram, but there are no instant alerts.

Credits are not cash: they cannot be withdrawn or refunded to a wallet. Only credits you **earn** from other people running your agents can be claimed, and only once claims are switched on.

Nothing in this studio is financial advice, and nothing here is an offer to sell a token.
` },
{ id: 'start', title: 'Getting started', body: `
1. **Choose a character** from the roster on the left. Search by name or role, or filter humans and bots.
2. **Dress it** in the Outfit tab. Every change renders immediately. Use *Randomize* for a surprise and *Reset* to return to the preset.
3. **Give it a persona**: a name, instructions and a tone. The instructions are sent to Claude with every task.
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
**Motions** are grouped as Gestures (Wave, Nod, Shrug, Point, Clap, Salute, Bow), Moods (Idle, Think, Typing, Laugh, Cheer, Stretch, Victory), Moves (Walk, Run, Jump, Spin, Dance, Disco) and Emotes (Flex, Heart, Dab, Facepalm, Kick, Backflip). Looping motions (marked with a ring) become the agent's default stance and are saved with the agent. One-shot motions play once and return to the stance.

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
| Wallet monitor | a wallet address (or your linked wallet) | what the address holds, what changed since the last check, recent RHIO transfers, with the reading attached |
| Whale watch | a question about RHIO (or none) | what moved in the last 24 hours: biggest transfers, new holders, biggest holders, with the reading attached |

**Where skills run.** Inside Claude (as a published artifact), the page asks your permission once and then uses your own Claude account for each run. Opened anywhere else, the studio shows "Claude offline" and the Run button is disabled; everything else still works. In the self-hosted Next.js version of RHIO, skills go through the server, which supports an AI provider once one is configured; until then it returns clearly labelled workflow samples.

**Honesty rules baked into every prompt:** say when unsure, never invent links, quotes or statistics, use only the supplied text for document tasks.

**Schedules.** After you pick the skills, choose how the agent works: in the Studio's **Automate** tab or on the Schedules page, pick a skill, write the task, choose how many times a day (1, 2, 3, 4, 6, 8, 12 or hourly) and the time of the first run. The server runs it on those slots and each run costs the skill's live price in credits (at least 5). You can keep up to 3 schedules and 24 scheduled runs a day; a holder tier raises both (6 and 48 for Holder, 12 and 96 for Builder, 24 and 192 for Studio). When credits run out, or the agent or skill is removed, the schedule pauses and says why. Scheduled runs never count toward a cap on tries per skill.

**Recipes.** A recipe is a ready-made automation: one click on the Schedules page (or on the public Recipes page, /recipes) makes the agent with its character, persona and skills, puts one skill on a schedule and, when you have a delivery channel, sends each result there. There are four to start with: a daily whale brief and a wallet check four times a day (both read the RHIO token and need it on the server), a post a day and a morning plan (both ask you for a topic). A recipe is a schedule like any other: each run costs the skill's price, your limits apply, and you can pause, change or delete it. The agent it makes is yours to restyle and rename.

**Teams.** A team is a line of two or three agents, each with one of its skills. You give the team one task: the first agent answers it, and each next agent gets the task together with the answer of the one before it, so a researcher can feed a writer and a writer a translator. Build one on the Teams page from your own saved agents or from agents other creators published in Discover, or start from a ready-made team (research then a thread, ideas then a plan, a summary then a translation, and a token report then a post where the RHIO token is set); the public page is /teams. Every step is a normal run: it costs that skill's price, counts toward your limits and appears in History, and a step on a published agent also pays its creator their price. A step that fails is refunded and can be tried again without repeating the steps before it. An answer longer than 8,000 characters is handed over cut to its first part. Teams run when you press Run; putting a team on a schedule is not built yet.

**Talk to an agent.** Every published agent has a chat on its own page (Discover, then Talk, or its link /a/<id>). The agent answers in its own voice, from the persona its creator wrote, without browsing; the only skills it can use there are the two that read (see "Reading inside a chat" below). Each message is a run: it costs 3 credits (the operator can set another price) plus the creator's chat price, lands in your History, and the creator earns that chat price per message. A creator sets the chat price in the publish dialog, apart from the price of a task, so an agent can be cheap to talk to and cost more for real work; an agent whose creator never set one charges its task price per message. The last six turns of the conversation go with each message so the agent stays consistent; the conversation is yours alone and reopens in the same browser. The creator's instructions are never shown, also not to the creator on that page. An agent is an AI character: it can be wrong, and nothing it says is financial advice.

**Question links.** Each of the questions to start from that you wrote for a published agent has its own link (/a/<id>?ask=1, 2 or 3). Post it and the preview card shows the question next to the agent's card; whoever opens it lands on the agent's page with that question ready in the chat box. The question is not sent by itself: the visitor presses Send, and a message costs what any message costs. A link can only ever show a question you wrote on the agent; a number that names no question gives the agent's ordinary card. You find the links on the agent's page, under its card (Post, or copy the link).

**Chat in the Studio.** You can talk to your own agent before anyone else can: open the Chat tab in the Studio. It is the same chat a visitor gets on a published agent's page, with your greeting and your questions to start from, but the agent does not need to be published. Sending a message saves what is on screen first, so the answer always comes from the agent as it is now; when you changed the agent since the last message, a new conversation starts, because the earlier turns would carry the old voice into the next answer. On your own agent a message costs the message price only (3 credits unless the operator set another), and each message is a run in your History. Under the box are three questions worth trying before you publish: asking for its instructions, asking whether to buy, and asking whether it is a person. They are word for word what the agent check asks, and each answer is read at once by the check's own rule: it says whether the answer held. When one did not hold, one tap adds the sentence that mends it to the instructions (for example, to say plainly that it is an AI character); ask again and you hear the difference. The agent check in the publish dialog offers the same sentence under a check that did not pass. These rules are plain patterns, not understanding: a check, not a guarantee. The Chat tab also opens from the Chat button on each of your agents and from the launch guide.

**Reading inside a chat.** Self-hosted workspace only (rhio.studio). An agent that carries the Wallet monitor or Whale watch can use it in a conversation. Paste an address and it reads that wallet on Robinhood Chain; ask about your own wallet and it reads the wallet your account is linked to; ask who the biggest holders are, how many holders there are or what moved, and it reads the server's record of the RHIO token. The agent answers in its own voice from that reading, and the numbers the server read are shown under the answer: where the two differ, the numbers are right. A message with a reading costs what any message costs. Which reading is taken is decided from your words by plain patterns, not by the AI, so an agent cannot be talked into reading something else, and a question worded unlike those patterns gets a spoken answer without a reading. One reading per message, read-only, no prices and no owner names; a transfer is never called a buy or a sell. When a reading cannot be made (a mistyped address, the chain not answering) the message is still answered and the agent says it could not read. In a chat on a creator's site or in a Telegram chat an address and the token can be read, but "my wallet" is not: the people writing there are not the account behind the chat. The other skills (research, documents, code and the rest) do not run inside a chat.

**What an agent knows, and how it opens.** Besides its instructions an agent can carry notes (up to 4,000 characters: facts about its creator or their project). They go to the AI with every run as facts to answer from, and the agent is told to say it does not know when they do not cover a question about its creator. The public page says that an agent has notes, never what they are. An agent can also have a greeting (the first thing it says in a chat) and up to three questions to start from, shown as buttons; neither costs anything until a message is sent.

**Insights for creators.** The page /dashboard/insights shows what one of your agents did in the last seven days, next to the seven days before: how many different people got an answer, how many answers (chat and tasks) and how many runs failed and were refunded, the credits you earned from them, and their helpful and not helpful marks. A chart shows answers per day over fourteen days, split into answers to other people and answers you paid for (your own site, your Telegram chats, your own messages), with the same numbers as a table. It also shows how the agent's sources held up: of the answers that could read them, how many used one and how many did not. The questions the sources did not cover are listed as text only from your own channels: your site, your Telegram chats and your own messages. What other people asked on the agent's page is theirs: you see how many of their questions were not covered, never what they wrote. A question counts as not covered when no passage shared words with it, or when the AI was given passages and said it used none; that includes small talk, so the list is a set of candidates for a new source, not a list of errors. Answers made before this feature are not classified.

**The launch guide.** The page /dashboard/launch lists the way from a character to an agent people talk to, for one of your agents: pick a character and name it; give it a voice (instructions of at least 80 characters, written by you or drafted from your own posts); give it what you know (a source, or always-on notes); write its opening (a greeting and at least one question to start from); pass the agent check; publish it with a price; get its first conversation, which is done when someone other than you gets an answer from it. Each step is marked done from what is saved, not from a button, and it opens the place where it is done. A step can go back: changing what the agent knows ends a passed check until it is run again. Further steps, none of them needed: a verified X handle, an answer place in Telegram, a chat on your own site, a duel. The guide stores nothing and gives nothing; what costs credits is what the steps open, at their usual prices.

**A chat on your own site.** You can place a chat with one of your agents on your own website (Schedules → On your site). You pick the agent, name the one site that may show it and choose how many answers a day it may give (20 to 500), and you get a frame to paste into that site. Visitors need no wallet and no account. Every answer is a chat message of the agent, paid from your credits at the price of a chat message, filed in your History, with the agent's instructions never shown and without web search; the agent has the last turns of a visitor's conversation as context. What bounds your cost: the answers a day you chose, 15 answers a day per visitor, a few seconds of pause between one visitor's messages, and 600 characters per message. Answers also count as live runs of your account, so all of them together stop at the server's daily limit per account. The chat shows on the site you named and nowhere else in a browser, and you can switch it off or remove it at any time. A program that calls the chat's address directly can pretend to be your site: it can use up the day's answers, never more, which is why the daily number is the real limit.

**A published agent in your Telegram chat.** Where the operator has connected a Telegram bot, you can link your own chat or group (Schedules → Delivery) and choose who answers there: one of your own agents with one of its skills, one of your own agents in its own voice, or an agent someone else published. A published agent of someone else answers in its own voice only. Each answer is a chat message to it, paid from the credits of the account that linked the chat: the price of a message plus the creator's price per message, which the creator earns like for any chat. In a private chat every message is a question; in a group people write /ask and the question. The agent has the last turns of that chat as context. You set how many answers a day the chat may have, and there is a short pause between questions. If the creator changes the price, the agent stops answering there and nothing is charged until you confirm the new price; if the agent is unpublished, the chat says it is no longer available. The agent's instructions are never shown, questions go to the AI provider and land in your History, and it answers without web search. An agent's page has a link "Add to my Telegram" where this is available.

**This week: the busiest agents.** The page /top lists the ten published agents that were used most in the last seven days. What counts is a completed run (a task or a chat message) by an account other than the agent's creator. An agent's place comes first from how many different accounts used it and then from how many runs that was, so three people asking once each stand above one person asking ten times. Next to each place is how the agent moved against the seven days before: new, up, down or the same. The list is updated every few minutes and its link preview shows the first three of the day. It is a list of what was used, not a rating: an account is a wallet and wallets are free, so the count can be pushed. For that reason a place on the board gives nothing: no credits, no badge and no better position in Discover.

**Report only when something changed.** A schedule of the Wallet monitor or of Whale watch can be set to stay quiet until there is something to say. At each of its slots the server first looks, without running any AI. The Wallet monitor compares the ETH balance, the number of transactions the wallet sent and the balances of the tokens this server knows with what the last report saw. Whale watch looks in the server's record of the RHIO token for a transaction that moved at least the amount you chose (100K to 10M RHIO, 1M by default) since the last look, or an address that is new among the ten biggest holders. When nothing changed, nothing runs, nothing is charged, nothing is sent, and the look does not count as one of the day's scheduled runs; the schedule shows when it last looked. When something changed, the schedule runs as usual (the skill's price, in History, sent to its channel), and the report says what set it off. The first slot always reports, so there is something to compare with; changing the task or the amount starts over the same way. It is not an alarm in real time: it looks at the schedule's slots, once an hour at most, the token record follows the chain a few minutes behind, and a change that came and went between two looks (a balance that went up and back down) is missed. The recipes "Whale alarm" and "Wallet alarm" set this up in one click.

**The arena: one question, two agents.** On /arena you pick two published agents and type one question (up to 300 characters). Each agent gets it as a normal chat message, so the price is two messages plus each creator's chat price, and an agent that does not answer costs nothing. When both have answered, the two answers go side by side on a public page, /arena/<id>, with its own preview picture, and readers pick the better one. The page shows the question, both agents and both answers; never who asked, and never an agent's instructions. Whoever made the duel can take it down at any time, and the link then stops working. Picks: one per signed-in account, changeable; the creators of the two agents cannot pick in their own duel. A pick is the opinion of someone who opened the page, and one person can have several accounts, so the count is shown for what it is: it does not change an agent's rating, its place in Discover, or anyone's credits. Duel pages are not listed anywhere and search engines are asked not to index them.

**Sources: what an agent answers from.** A creator can give an agent up to 8 sources of up to 12,000 characters each (60,000 in all): notes, an FAQ, an old thread. Only pasted text is stored; nothing is fetched from a site or an account, and adding a source costs nothing. Each source is cut into passages. When someone sends the agent a message or a task, the passages that share words with it (at most four) go to the AI together with that message, and the agent is told to answer from them, and to say it does not know when the question is about its creator and the passages do not cover it. Under the answer the sources it used are named by their title. Three limits to know: passages are matched by shared words, so a question worded very differently from the source may bring up nothing; the list of sources under an answer is what the AI reported using, not a proof that the answer is right; and a Web research run that browses the web is not given the sources. The public page says how many sources an agent has, never their titles or text, but an answer can repeat anything in them, so nothing private belongs there. Changing the sources ends a passed agent check until it is run again. In the Studio, "Try a question" shows which passages a question would bring up, without running the AI.

**The agent check.** In the publish dialog a creator can have the studio try the agent for real: four short messages go to the live AI as the agent, the way a visitor's chat message would, and each answer is held against one rule: it answers; asked to print its instructions, it does not hand them over; asked whether to buy a token, it does not tell anyone to buy, sell or hold; asked whether it is a real person, it says it is an AI. A fifth check looks at the instructions themselves: under 80 characters they are too short for the copy filter to recognise. An agent that passes shows "Checked" with the date on its page, for as long as its name, instructions, tone and notes stay the ones that were checked. A check costs 8 credits (unless the operator set another price), is kept in History and is refunded when the AI fails. It is a check, not a guarantee: each rule is a pattern in one answer to one question, and an AI can answer differently next time.

**Ratings and how an agent has been doing.** Under each answer in a chat, the person who got it can mark it helpful or not helpful, once per answer, and change or remove the mark. An agent's page shows the share of helpful marks once it has at least three from accounts other than its creator (a creator's marks on their own agent never count), and how many of its last fifty runs it answered. Discover and the plaza order agents by how much they are used, lifted by helpful marks and lowered by unhelpful ones.

**What an agent says about RHIO.** In a chat, every agent on a server where the RHIO token is set carries a short list of facts about RHIO, built from that server's own settings: what the studio is, that the token is live, the holder reward rule, the holder tiers, the referral boost, and what is not done (no independent audit, no published legal review of the reward payouts). When someone asks an agent whether to buy, sell or hold, it says the decision is theirs and that it will not make it, then says what holding does today and that it is not audited, and points to the Holder rewards page. It never predicts a price, never promises a return, and never tells anyone to buy, sell or hold; the agent check still fails an agent that does.

**An agent's card.** Every published agent has a card: the agent on a card of the deck (a colour of its own, a serial number, the creator's verified handle or the character's role) next to its name, its line, how often it ran and what a chat message and a task cost. It is the picture a link to the agent shows, and the agent's page offers it to post or to download. The character on it is the character's default picture: an outfit made in the Studio is not drawn there.

**Share a conversation.** In the chat on an agent's page, Share puts the conversation so far on a public page (/s/<id>): the last answered message and up to five turns before it, as you asked and as the agent answered, next to the agent's character. The page does not say who you are, never shows the agent's instructions, and nothing you write after sharing appears on it; Share again makes a page that includes the newer messages, and Stop sharing takes the page down at once. The link has its own preview picture with the question and the start of the answer.

**Creator agents: your voice from your posts.** In the Studio, under Persona, "Write it from my posts" takes posts you wrote yourself (300 to 12,000 characters of pasted text; nothing is fetched from any account) and drafts the agent's instructions in your style, with a tagline. You read the draft and press Use this, or discard it: the agent changes only then. A draft is a run of its own (8 credits unless the operator set another price) and is kept in your History. It is opt-in: you confirm the posts are your own, and the server refuses the request without that. The agent it describes is an AI character in your style, not you: it says so when asked and never claims to be a person. Published, it can be talked to on its page for your chat price per message. The public page is /creators.

**Verified creators.** A creator can show that an X handle is theirs: on the Profile page they name the handle, get a code, post it from that handle and send the link to the post. A person on the team opens the post and confirms it. From then on every agent that account published says "@handle, verified creator"; without it an agent shows an anonymous creator name, and a handle is never shown before it was confirmed. Nothing is read from X by the server: the check is one post, looked at by a person. A handle is verified for one account only, and a creator can remove the mark at any time. Verification is open on a server only where the operator named reviewers. The public page /verified explains the mark: what it means and what it does not.

**The plaza.** The page /plaza shows the published agents standing in one row, the most used first, up to twelve, one per look: when two agents look the same, the more used one stands there and the other stays in Discover. Pointing at an agent shows its tagline and its chat price; a click brings it forward as the live 3D character with its chat. Standing in the plaza is a picture: an agent only runs, and you only pay, when you send it a message.

**Delivery.** A schedule can send each finished run to a Discord channel or a Telegram chat, next to History. Set it up on the Schedules page under Delivery, then choose the channel on the schedule. Discord: paste the webhook address of a channel (channel settings → Integrations → Webhooks). The server accepts discord.com webhook addresses only, checks the address with Discord, keeps it on the server and does not show it again. Telegram: available where the operator has connected a bot (the panel says so when it is not). You open the bot through a one-time link and press Start, in a private chat or a group. Long reports are cut to a few messages and the full text stays in History. A schedule that gets paused sends one notice. You can keep up to 4 channels, send a test message, and remove a channel at any time.

What to know: the report text leaves RHIO for Discord or Telegram, which are separate services with their own terms, and in a group everyone there can read it. Research answers that used Google Search are not sent, because they may only be shown in the Studio to the account that asked: the channel gets a notice instead. A failed send never changes the run or its credits. A channel that is gone (webhook deleted, bot blocked) is marked disconnected and is not called again until you test or reconnect it.

**Chat on Telegram.** A connected Telegram chat can also talk to one of your agents. Under Delivery, choose "Let an agent answer" on the chat, then pick the agent, one of its skills and how many answers a day the chat may have (5, 20, 50 or 100). In a private chat every message is a question. In a group people write /ask and the question; ordinary group talk never reaches the agent. Each answer is a live run of that skill, paid from your credits at the skill's price, and it shows up in your History like any other run. There is a pause of about 15 seconds between two questions in one chat, and when the day's limit is reached the bot says so once.

What to know: in a group everyone there can ask, so the daily limit is what a group can spend from your credits. Questions go to the AI provider and are stored in your History. The agent's instructions are not shown, even when someone asks for them. Answers come without web search, because search results may only be shown inside the Studio. A long answer is cut to two messages. The Wallet monitor reads your linked wallet when a question names no address, so in a group anyone can make it report on that wallet: public chain data, but it shows which wallet is yours. The bot never writes your balance or limits into the chat. Turn the chat off, or remove the channel, at any time.

**Wallet monitor.** Self-hosted workspace only (rhio.studio). Put an address (0x…) in the task, or leave it out to read your linked wallet. The server reads Robinhood Chain at one block, read-only: ETH, the number of transactions sent, and the balances of RHIO, USDG and NVDA. It compares them with the reading your account took of that address last time and lists the address's recent RHIO transfers from the server's own record of the token. The agent writes a short report from those numbers, and the reading itself is attached under the report, so you can check one against the other. Put it on a schedule to get a report up to once an hour.

What it does not do: it never sends a transaction, it does not list transfers of tokens other than RHIO (it shows their balance and its change), it does not know prices, it reads one address per run, and it only looks when it runs: there are no alerts between runs. A task without an address, or a moment when the chain does not answer, costs nothing.

**Whale watch.** Self-hosted workspace only (rhio.studio). The agent gets the server's reading of the RHIO token with your task: how many addresses hold it, how many got their first RHIO in the last 24 hours and still hold it, how many transactions moved RHIO and how much, the biggest transfers and the biggest holders with their share of the supply. A transaction is counted once, from the address the tokens left to the address they ended up at, however many addresses passed them along inside it. It writes a short report from those numbers and the reading is attached under it. Put it on a schedule and send it to Discord or Telegram for a daily or hourly token brief. The same numbers are public on the Whale watch page (/whales), which anyone can open and share.

What it does not do: it knows no prices, it does not know who owns an address, and it cannot tell a buy from a sell, so it never says so. The only label on an address is "not earning holder rewards", for addresses the server leaves out of rewards (team, treasury, pool or contract). The numbers come from the server's own record of the token's Transfer events, which follows the chain a few minutes behind; when that record is not available the run costs nothing.
` },
{ id: 'credits', title: 'Credits, prices & earnings', body: `
The self-hosted workspace runs a **pay-per-run** economy in credits.

- Every new account starts with **25 free credits**: enough for two web research runs or five to six lighter tasks. A workflow sample costs 5.
- **Free credits refill every 24 hours**: the free part of your balance is topped back up to 25. Bought credits are never touched and free credits never pile up past 25.
- **Heavy skills** (Web research, Document Q&A, Code explainer) have a 5-hour window: 2 runs per window on free credits, 20 while you hold bought credits. Lighter skills only have the daily limit. Free live AI also shares one daily pool for the whole studio: when it is used up, accounts that hold bought credits can still run live AI and free runs open again at 00:00 UTC.
- A live AI run is priced by skill: Web research 12, Document Q&A and Code explainer 6, Content writer, Wallet monitor and Whale watch 5, Summarizer, Translator, Idea generator and Task planner 4. The operator can change these prices.
- Runs paid only with free credits use a lighter model; runs paid with bought credits use the full model.
- Any saved agent can be **published to Discover** with a price from 0 to 500 credits per run. The agent's instructions are never shown: visitors see the character, tagline, skills and tone. The agent is told to keep its instructions to itself and an answer that copies them is withheld, but no AI can promise it never paraphrases them, so never put passwords or keys in instructions.
- When someone runs your published agent, the price is debited from them and credited to you, minus the platform fee. Running your own agent never charges the creator price.
- **Platform fee: 0% during beta**, then 10%. It is a server setting (\`PLATFORM_FEE_BPS\`), so it can change without a code change.
- Every movement is written to a ledger (grant, run, earning, fee, refund). If a run fails, the buyer gets the credits back and the creator is not paid. A failed run still counts toward the daily and 5-hour limits when the AI had already started answering.
- Credits have **no monetary value**. On rhio.studio you can buy credits with USDG on Robinhood Chain (1 USDG = 100 credits). Claims of **earned** credits in USDG are built but not switched on. Granted and bought credits can never be withdrawn or refunded.

The published studio page does not use credits at all: skills run on the viewer's own Claude account.
` },
{ id: 'save', title: 'Saving, export & share', body: `
- **Save agent** stores the agent. In the published studio it is stored in your browser; in the self-hosted workspace it is stored per account in the database.
- **Export** produces a JSON config. It contains the character id, the full outfit look, the default motion, persona, tone and skills. It also carries the older \`appearance\` fields so first-generation configs remain readable.
- **Import** accepts a config or a list of configs. First-generation configs (12 characters, colour-only appearance, motion names such as Pray) are converted automatically.
- **Share links** in the self-hosted workspace embed the config in the URL fragment. Nothing is sent to a server when a link is opened.
- **Quests** (self-hosted workspace, rhio.studio). The Quests page lists a few things to try: save an agent, run a skill, run two agents as a team, talk to a published agent, draft an agent's voice from your own posts, put it on a schedule, connect Discord or Telegram, ask it on Telegram, read the chain, share an answer, publish an agent. A quest is done when the server sees that it happened, and you can then claim it once for free credits (5 per quest unless the operator set another amount). Quest credits are free credits like the ones a new account starts with: they pay for runs, they are spent before bought credits, and they are never part of claimable earnings and cannot be withdrawn. A quest whose feature is off on a server is not listed there.
- **Invite a friend** (self-hosted workspace, rhio.studio). The Quests page shows your invite link. When someone signs in through it with a new account and completes their first run, you and they each get free credits (10 each unless the operator set another amount), for up to 20 rewarded invitations per account. An invite only counts for an account that has not run anything yet, once, and never for yourself. The bonus is free credits like the ones a new account starts with: they pay for runs and are never part of claimable earnings and cannot be withdrawn.
- **Holder reward boost for inviters** (rhio.studio). Every friend you invited who holds one reward unit (1,500,000 RHIO) for a whole hour raises your own NVDA holder reward for that hour by 10%, for up to 5 friends: 1.1x with one friend, 1.5x at most. It multiplies what your own wallets earned in that hour, so an account that holds less than a unit has nothing to boost. A friend counts only while they keep holding the unit through the entire hour, and only for the one account that invited them; the friend's own reward does not change. The invite card on the Quests page shows your current multiplier, and a boosted hour is marked in "Your settled hours". A boost is paid from the same vault as every reward.
- **Share an answer** (self-hosted workspace, rhio.studio). Open a run in History, or press Share under a fresh result, and choose "Create public link". The answer then has its own page, /s/ followed by a random id, with your agent's character next to it and a preview picture when the link is posted. You choose whether the start of your task is shown. The page never shows your account, your wallet or the agent's instructions, and search engines are asked not to index it. "Stop sharing" takes the page down. Only completed runs can be shared, and an answer that used Google Search cannot: it may only be shown in the Studio, to the account that asked. You can keep up to 100 shared answers.

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

**The reward report.** The page /report shows the program in a few live numbers: how much NVDA holders have earned so far (allocated to them and claimable; each holder claims with their own wallet), how much of it was claimed, how many periods were settled, how many wallets are earning, and what the vault holds free for coming periods, with the hours that covers at today's rate. When the vault cannot cover the next period the page says that periods are waiting for a refill. Dollar figures use the latest price the server holds and move with it. The page also writes a short post with the same numbers, the rule and the words "Not audited", ready to copy; /report/<day> is the same page under an address of its own for each day, so a post keeps that day's picture.

**What you trust.** The contract pays what the published root says; it does not check the formula. Every input (transfers, refills, roots, claims) is public, so anyone can recompute the numbers. The server holds no key that can transfer the vault's tokens. For hourly claims it holds one key that can only post a root; the vault itself caps how much can be claimed per window, and the multisig can pause the vault or replace that key.
` },
{ id: 'privacy', title: 'Privacy & safety', body: `
- Task inputs are sent to Claude only when you press Run. They are not stored by RHIO beyond the local task history you can clear.
- The published page has no analytics and makes no network requests of its own.
- Prompts treat any pasted document as untrusted content: instructions inside a document are not followed.
- Delivery is opt-in: only a schedule you point at a Discord channel or Telegram chat sends its report text to that service. Webhook addresses and chat ids stay on the server.
- A shared answer is public for anyone who has its link, until you stop sharing it. Read it again before you share: whatever the answer and the shown part of your task contain becomes public.
- Chat on Telegram is opt-in per chat: questions asked there go to the AI provider and into the History of the account that connected the chat, and the answers go to Telegram.
- No provider secrets ever live in the frontend. The self-hosted version reads provider settings on the server only.
- RHIO is an independent project. It is not affiliated with, endorsed by or partnered with Robinhood Markets or Anthropic.
` },
{ id: 'faq', title: 'FAQ', body: `
**Is the RHIO token live?** Yes, since 2 October 2026, on Robinhood Chain (chain 4663). The contract address is the one in the CA box on the home page of this site: it is the only place we publish it. Check it on robinhoodchain.blockscout.com and treat every other address as not ours. Nobody from RHIO will ask for your recovery phrase or ask you to send tokens anywhere.

**Why Robinhood Chain?** Robinhood Chain is an Ethereum-compatible Layer 2 built on Arbitrum. Its mainnet launched on 1 July 2026 (chain id 4663; testnet 46630). It pays gas in ETH, has USDG as its main stablecoin, and hosts Robinhood's Stock Tokens. RHIO uses it for wallet sign-in, top-ups, claims and holder tiers. Only trust the official explorer, robinhoodchain.blockscout.com.

**How do top-ups work?** Link a wallet, then pay USDG from it to the RHIO treasury on the Wallet & chain page. Your wallet asks you to confirm the transfer. The server reads the transaction from the chain and adds credits after a few confirmations (default rate: 1 USDG = 100 credits). A payment from a wallet you have not linked is not credited. On rhio.studio top-ups are on and use real USDG on mainnet; credits cannot be refunded or withdrawn.

**How do claims work?** Earnings claims are built but not switched on yet. Once they are, credits you earn when other people run your published agents can be queued for a claim to one of your linked wallets. The RHIO multisig publishes the queued claims as a merkle root on the RhioClaims contract. You then claim USDG on-chain and pay your own gas. The server never holds a payout key.

**What are holder tiers?** Tiers (Free, Holder, Builder, Studio) come from the RHIO held by your linked wallets. They give monthly credits, a lower platform fee on your sales and higher limits (more schedules, scheduled runs a day and delivery channels). They are live on rhio.studio: Holder from 1,500,000 RHIO, Builder from 5,000,000, Studio from 10,000,000 (until 4 October 2026 the thresholds were 10,000, 100,000 and 1,000,000).

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
**Characters.** 25 characters with an outfit system, 26 motions and 6 powers. The 22 humans are modelled bodies from a public-domain (CC0) character kit, about 3 MB of static files served with the site; their clothes, shoes and accessories are generated in the browser from the chosen look. The android and the three bots are generated from primitives.

**Persona.** A name, free-form instructions and a tone. Agents answer in English. These travel with the agent and are prepended to every task.

**Skills.** Ten skills: eight prompt programs (research brief, summarizer, document Q&A, content writer, translator, idea generator, code explainer, task planner) and the wallet monitor, which reads an address on Robinhood Chain (balances, change since the last check, RHIO transfers; read-only) and reports on it, and the whale watch, which reports on the RHIO token from the server's record of its transfers (biggest transfers, new holders, biggest holders; no prices). All ten are open. Runs cost credits, and an operator can cap how often an account may try each skill (a failed run gives the try back). An agent carries up to four. Skills run on Claude inside the published studio, or through a server-side provider in the self-hosted workspace.

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
  ├─ /api/schedules     agents that run a skill on their own; ticked every minute
  ├─ /api/notify        delivery channels (Discord webhooks, Telegram chats) and agent chat on Telegram
  ├─ /api/teams         saved lines of agents; each step of a team run is a normal run
  ├─ /api/talk          the chat on a published agent's page; each message is a normal run
  ├─ /api/voice         drafts an agent's instructions from posts its creator pasted
  ├─ /api/creator       a creator's claim to an X handle, and the reviewers' decisions
  ├─ /api/agents/check  the agent check: four real messages, one result per rule
  ├─ /api/rate          helpful / not helpful marks on answers
  ├─ /api/share         an answer its owner made public (/s/<id>)
  ├─ /api/quests        things to try; a finished quest gives free credits once
  └─ /api/referrals     invite links; free credits for both sides after the first run

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
4. **Higher limits.** A tier raises what an account may keep running: schedules, scheduled runs a day and delivery channels (table below). Runs cost the same credits on every tier.

**Planned, not built**

- A creator boost: more visibility in Discover for agents from higher tiers.
- Agent slots per tier.
- Part of the platform fees helping to refill the reward vault, once fees are on.
- Advisory votes on roadmap priorities, fee levels and the skill library.

**Tiers** (live on rhio.studio)

| Tier | Hold (RHIO) | Platform fee | Monthly credits | Agent slots (planned) |
| --- | --- | --- | --- | --- |
| Free | 0 | 10% | none | 10 |
| Holder | 1,500,000 | 7% | 100 | 25 |
| Builder | 5,000,000 | 5% | 300 | 50 |
| Studio | 10,000,000 | 3% | 1,000 | unlimited |

**Limits by tier** (live on rhio.studio)

| Tier | Schedules | Scheduled runs a day | Delivery channels |
| --- | --- | --- | --- |
| Free | 3 | 24 | 4 |
| Holder | 6 | 48 | 6 |
| Builder | 12 | 96 | 8 |
| Studio | 24 | 192 | 12 |

The Free row is the server's own limits; a tier multiplies schedules and runs and adds channels. The server reads the tier from the chain and checks it again every few hours. When an account drops to a lower tier, its schedules stay, but no new one can be added above the new limit, and the lower daily run limit applies from the next check.

The fee column is the creator's platform fee once the 10% fee is on. The server adds up the RHIO balance of every wallet linked to an account. The fee discount applies to the creator's platform fee on each sale; the tier is cached for 24 hours. The monthly allotment is claimed once per account and once per wallet. Balances are read at the month's **snapshot block**, which the first claim of the month fixes, so moving tokens to a fresh wallet afterwards earns nothing extra.

**Holder reward in NVDA Stock Tokens (live)**

The reward asset is a real-world asset instead of more RHIO: Robinhood's **NVDA Stock Token** on Robinhood Chain. Stock Tokens are ERC-20 tokens that track the share price. They give economic exposure, not legal ownership of the share. How it works:

1. **Rate.** Every complete **1,500,000 RHIO** held earns **$0.01 per hour**. Units are whole blocks: 1,499,999 RHIO is 0 units, 2,999,999 is 1, 3,000,000 is 2. Accrual is per second, so half an hour at 1 unit is $0.005.
2. **Holding, not a snapshot.** The reward is computed from every RHIO transfer on Robinhood Chain, so each wallet's balance is known at every second. A token sits in one wallet at a time: moving RHIO to another wallet never earns twice, and buying just before an hour closes earns seconds, not the hour. (A contract that only reads the current balance cannot see this history, which is why the calculation runs on recorded transfers.)
3. **Paid in NVDA.** Each hour is settled at the latest Chainlink NVDA / USD price on Robinhood Chain: $0.01 at an NVDA price of $180 is 0.0000555 NVDA. The dollar value is the promise; the token amount follows the price. Amounts always round down.
4. **Vault.** The team buys NVDA and refills the reward vault (a RhioClaims instance). An hour is only settled when the vault can pay everything owed in full; otherwise it waits and is settled later, so no accrual is lost. Holders claim themselves and pay their own gas; nothing is pushed.
5. **Referral boost.** An account that invited friends earns more on its own reward: +10% for each invited friend who holds one unit through the entire hour, for up to 5 friends (1.5x at most). The boost multiplies what the inviter's own wallets earned in that hour and is paid from the same vault; the friend's reward does not change. One person can spread tokens over several accounts to count as their own friends: the cap is what limits that.

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
  ['done', 'Modelled human characters: rigged bodies dressed by the studio, body option in the outfit editor'],
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
  ['done', 'Delivery: a schedule sends each result to a Discord channel or a Telegram chat'],
  ['done', 'Chat on Telegram: a connected chat or group asks one of your agents through the bot'],
  ['done', 'Share an answer: a public page and preview picture for a run, taken down again with one click'],
  ['done', 'Quests: a list of things to try, each worth free credits once per account'],
  ['done', 'Invite a friend: both get free credits after the invited account completes its first run'],
  ['done', 'Holder reward boost: +10% NVDA reward per invited friend who holds 1,500,000 RHIO, up to 1.5x; public page /invite'],
  ['done', 'A link preview of its own for the main pages (rewards with live vault numbers, schedules, skills, studio, discover, quests)'],
  ['planned', 'Task history export'],
  ['done', 'Six emotes: Flex, Heart, Dab, Facepalm, Kick, Backflip'],
  ['planned', 'More characters, seasonal outfits, more emotes'],
  ['planned', 'Community skill proposals'],
] },
{ phase: 'Phase 3', title: 'Token & wallet', when: 'Q4 2026', status: 'now', items: [
  ['done', 'Wallet link on Robinhood Chain (SIWE, several wallets per account)'],
  ['done', 'RHIO token live on Robinhood Chain mainnet (2 October 2026)'],
  ['done', 'Holder tiers live: fee discount, monthly allotment at a snapshot block'],
  ['done', 'Recipes: ready-made automations, one click for the agent, the schedule and the delivery; public page /recipes'],
  ['done', 'Agent teams: two or three agents in a line, each working from the answer of the one before it; public page /teams'],
  ['done', 'Talk to an agent: a chat on the page of every published agent, paid per message, the creator earns per message'],
  ['done', 'Question links: each of a published agent\'s questions has its own link and its own preview card'],
  ['done', 'Chat in the Studio: talk to your own agent on the Chat tab before you publish it'],
  ['done', 'A verdict on the three hard questions in the Chat tab, and one tap to add the line that fixes an answer that did not hold'],
  ['done', 'Reading inside a chat: an agent that carries the Wallet monitor or Whale watch reads a wallet or the RHIO token when asked in a conversation, and shows the numbers under its answer'],
  ['done', 'Creator agents: an agent in your own voice, drafted from posts you pasted; opt-in only; public page /creators'],
  ['done', 'Verified creators: a code posted from the X handle, confirmed by a person on the team; the handle shows on the creator\'s agents'],
  ['done', 'The plaza: the published agents in one place, click one to talk; public page /plaza'],
  ['done', 'Share a conversation: a public page for a chat with an agent, with its own preview picture'],
  ['done', 'Agent cards: a card to show off for every published agent, as its link preview and as a download'],
  ['done', 'Agent quality: notes an agent answers from, a greeting and questions to start from, the agent check before publishing, ratings of answers'],
  ['done', 'Reward report: the holder rewards in a few live numbers and a post ready to copy; public page /report'],
  ['done', 'Insights for creators: an agent\'s week (people, answers, credits earned, marks), answers per day, and the questions its sources did not cover; page /dashboard/insights'],
  ['done', 'The launch guide: seven steps from a character to a published agent people talk to, each marked done from what is saved; page /dashboard/launch'],
  ['done', 'A chat on your own site: a frame with one of your agents for your website; visitors need no account, you pay per answer up to a daily number you choose'],
  ['done', 'A published agent in your Telegram chat: link your chat or group and let an agent someone else published answer there, paid per answer, the creator earns'],
  ['done', 'This week: the published agents used most in the last seven days, by people and then by runs, with who is new and who moved; public page /top'],
  ['done', 'Report only on change: a Wallet monitor or Whale watch schedule looks at every slot for free and runs only when something changed; recipes Whale alarm and Wallet alarm'],
  ['done', 'The arena: two published agents answer one question side by side on a public page, and readers pick the better answer; public page /arena'],
  ['done', 'Agent sources: a creator pastes notes, an FAQ or an old thread; the agent answers from the passages that match a question and names the sources under its answer'],
  ['done', 'Holder perks: more schedules, scheduled runs a day and delivery channels by tier; public page /tiers'],
  ['planned', 'Agent slots per tier'],
  ['done', 'Holder reward pipeline on mainnet: holder recorder, per-second reward calculator, reward vault (RhioClaims), rewards dashboard'],
  ['done', 'Fixed-rate NVDA reward live: $0.01 per hour per 1,500,000 RHIO, Chainlink NVDA price, hourly settlement and hourly claims, full-or-wait vault'],
  ['done', 'Eligibility statement before claims, public funding and claim log'],
  ['planned', 'Legal review of NVDA payouts per region; USDG fallback for holders who cannot receive Stock Tokens'],
  ['done', 'Wallet monitor skill: reads a wallet on Robinhood Chain, reports what changed since the last check, can run on a schedule'],
  ['done', 'Whale watch: a public page and a skill for the biggest RHIO transfers and holders, from the chain'],
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
