/* Link previews per page. A link to rhio.studio used to show the same picture whatever page it pointed at; a post
   about one feature now carries that feature's own card. Each entry gives a page its title, description and picture
   (/api/og/page/<key>: the text below next to a different character each). To give another page its own card, add an
   entry here and use pageMetadata() in that page's route marker.
   Pages behind sign-in redirect a visitor without a session to /login?next=<path>; the login page takes the card of
   the page it leads to (cardForPath), so a link to such a page still previews as that page.
   The rewards card is filled with the live numbers by the picture route; the text here is what it shows when the
   program is not running on a server. Nothing here may promise a return: it names what the page shows. */
import type {Metadata} from 'next';

export type PageCard={path:string;title:string;kicker:string;headline:string;lines:string[];character:string;description:string;
 /** 'left': the character stands on the left and the text on the right (the tiers card) */layout?:'left'};
export const PAGE_CARDS={
 rewards:{path:'/dashboard/rewards',title:'Holder rewards',kicker:'HOLDER REWARDS',headline:'The reward vault, read from the chain',
  lines:['Vault balance and every refill','Each settled hour','Your own claim'],character:'vesper',
  description:'The reward vault on Robinhood Chain: its balance, every refill, each settled hour and your own claim.'},
 schedules:{path:'/dashboard/schedules',title:'Schedules',kicker:'SCHEDULES · DELIVERY · CHAT',headline:'Your agent works on its own and reports to you',
  lines:['Runs a skill up to once an hour','Sends results to Telegram or Discord','Answers /ask in your Telegram group'],character:'volt',
  description:'Put an agent on a schedule, have each result sent to Telegram or Discord, and let it answer questions in your Telegram chat.'},
 skills:{path:'/dashboard/skills',title:'Skills',kicker:'SKILLS',headline:'Ten skills. Up to four per agent.',
  lines:['Research, writing, documents, code','Wallet monitor and Whale watch','Paid per run, in credits'],character:'kira',
  description:'Ten skills an agent can carry: research, writing, documents, summaries, translation, ideas, code, plans, a wallet monitor and a whale watch.'},
 studio:{path:'/dashboard/studio',title:'Studio',kicker:'STUDIO',headline:'Build an AI agent with a face',
  lines:['25 characters and an outfit editor','26 motions and 6 powers','Skills that do real work'],character:'nova',
  description:'Pick a character, dress it, give it skills and put it to work.'},
 quests:{path:'/dashboard/quests',title:'Quests',kicker:'QUESTS',headline:'Try your agent, collect free credits',
  lines:['Each quest is checked by the server','Free credits, once per account','New quests over time'],character:'zara',
  description:'A short list of things to try with your agent. Each finished quest gives free credits, once per account.'},
 tiers:{path:'/tiers',title:'Holder tiers',kicker:'HOLDER TIERS',headline:'Hold RHIO, unlock more',
  lines:['More schedules','More scheduled runs a day','More delivery channels'],character:'lumi',layout:'left',
  description:'What each holder tier needs and gives: more schedules, scheduled runs a day and delivery channels, and monthly credits. Read from the chain, nothing locked.'},
 recipes:{path:'/recipes',title:'Recipes',kicker:'RECIPES',headline:'One click, and your agent runs it every day',
  lines:['Daily whale brief','Wallet check, four times a day','A post a day, a plan a day'],character:'orbit',layout:'left',
  description:'Ready-made automations: one click makes the agent, puts its skill on a schedule and sends each result to your Telegram or Discord.'},
 teams:{path:'/teams',title:'Agent teams',kicker:'AGENT TEAMS',headline:'One agent hands its work to the next',
  lines:['Research, then write. Summarize, then translate.','Your own agents, or ones other creators published','Every step is a normal run in your History'],character:'atlas',layout:'left',
  description:'Line up two or three AI agents on RHIO: each one does its skill and hands its answer to the next. Use your own agents or ones other creators published.'},
 invite:{path:'/r',title:'You are invited',kicker:'INVITATION',headline:'You are invited to build an AI agent',
  lines:['A character with a face and a wardrobe','Skills that do real work','Free credits after your first run'],character:'juno',layout:'left',
  description:'An invitation to RHIO Agent Studio: build an AI agent with a face, give it skills and put it to work. A new account gets free credits after its first run.'},
 referral:{path:'/invite',title:'Invite friends',kicker:'INVITE FRIENDS',headline:'Invite friends, earn more',
  lines:['Free credits for both of you','A higher holder reward for you','Your link is on the Quests page'],character:'juno',layout:'left',
  description:'Invite a friend to RHIO Agent Studio: free credits for both of you after their first run, and a higher holder reward for you while your friends hold RHIO.'},
 discover:{path:'/dashboard/discover',title:'Discover',kicker:'DISCOVER',headline:'Pick an agent. Talk to it.',
  lines:['Talk to it, paid per message','Or give it a task','Publish your own and earn per run'],character:'juno',
  description:'Agents other creators published on RHIO: talk to one in its own voice or give it a task, paid in credits. Publish your own and earn per run.'},
} satisfies Record<string,PageCard>;
export type PageCardKey=keyof typeof PAGE_CARDS;
export const isPageCard=(k:string):k is PageCardKey=>Object.prototype.hasOwnProperty.call(PAGE_CARDS,k);

/** The card of the page a path leads to (exact path, with or without a trailing slash), or null. */
export function cardForPath(path:string):PageCardKey|null{
 const p=String(path||'').split('?')[0].split('#')[0].replace(/\/+$/,'');
 return (Object.keys(PAGE_CARDS) as PageCardKey[]).find(k=>PAGE_CARDS[k].path===p)??null;
}
/** Title, description and preview picture of a page. `version` changes the picture's address (a card with live numbers). */
export function pageMetadata(key:PageCardKey,version='1'):Metadata{
 const c=PAGE_CARDS[key];const title=`${c.headline} · RHIO`;const image=`/api/og/page/${key}?v=${version}`;
 return {
  title:c.title,description:c.description,
  openGraph:{type:'website',siteName:'RHIO Agent Studio',title,description:c.description,url:c.path,images:[{url:image,width:1200,height:630,alt:`${c.title}: ${c.headline}`}]},
  twitter:{card:'summary_large_image',title,description:c.description,images:[image]},
 };
}
