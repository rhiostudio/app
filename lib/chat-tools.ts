/* Skills inside a chat, the rule alone (no server imports: lib/chat-read.ts does the reading; the page and the test use
   this file). In a conversation an agent can use the two skills that READ something, when it carries them:
     monitor  the Wallet monitor: reads one address on Robinhood Chain (lib/monitor.ts)
     whales   Whale watch: reads the server's record of the RHIO token (lib/whales.ts)
   Which one, if any, is decided from the message by plain patterns, not by the AI: that is predictable, costs nothing,
   and means an agent cannot be talked into reading something else. A message that asks in other words than these
   gets a spoken answer without a reading, which is the safe way to be wrong.
   Whose wallet: an address written in the message is read for anyone. "My wallet" is read from the wallets linked to
   the account that is talking, and ONLY when that account is the one talking. In a chat the account pays for but
   other people use (a creator's site, a Telegram chat: `shared`), "my wallet" is never resolved: it would show a
   visitor the wallet of the account behind the chat. */

export type ChatTool='monitor'|'whales';
export const CHAT_TOOLS:readonly ChatTool[]=['monitor','whales'];
const ADDRESS=/(?<![0-9a-fA-F])0x[0-9a-fA-F]{40}(?![0-9a-fA-F])/;
/** "my wallet", "my balance", "our holdings", "what do I hold" … */
const OWN=/\b(?:my|our)\s+(?:own\s+|linked\s+|rhio\s+)?(?:wallets?|address|balances?|holdings?|bags?|portfolio|tokens?|tier)\b|\bwhat\s+do\s+i\s+(?:hold|have|own)\b|\bhow\s+much\s+(?:rhio\s+)?do\s+i\s+(?:hold|have|own)\b/i;
/** questions about the token as a whole: its holders, its biggest transfers, its supply */
const TOKEN=/\bwhales?\b|\b(?:top|biggest|largest|major)\s+(?:\d+\s+|ten\s+)?(?:rhio\s+)?(?:holders?|transfers?|wallets?|moves?)\b|\bnew\s+holders?\b|\bhow\s+many\s+(?:people\s+|wallets\s+|addresses\s+)?(?:holders?|hold)\b|\b(?:rhio|token)(?:['’]s)?\s+(?:transfers?|activity|supply|holders?|moves?|movements?)\b|\b(?:transfers?|activity|moved|movements?)\s+(?:of|in|for)\s+(?:the\s+)?(?:rhio|token)\b|\bwho\s+(?:is\s+|are\s+)?(?:holding|moving)\b|\btotal\s+supply\b/i;

/** The skill a chat message makes the agent use, or null. `skills` are the agent's own; `shared`: the people asking
    are not the account that pays (see the note above). */
export function chatTool(message:string,skills:readonly string[],o:{shared?:boolean}={}):ChatTool|null{
 const text=String(message||'');
 const canWallet=skills.includes('monitor'),canToken=skills.includes('whales');
 if(canWallet&&ADDRESS.test(text))return 'monitor';
 if(canToken&&TOKEN.test(text))return 'whales';
 if(canWallet&&!o.shared&&OWN.test(text))return 'monitor';
 return null;
}
/** How to ask for a reading, as one short phrase for the page ('' when nothing). `shared`: "my wallet" is not read there. */
export function chatAsk(skills:readonly string[],o:{shared?:boolean}={}){
 const w=skills.includes('monitor'),t=skills.includes('whales');
 const ways=[...(w?['paste an address',...(o.shared?[]:['ask about your own linked wallet'])]:[]),...(t?[w?'ask who the biggest holders are':'ask who the biggest holders are or what moved today']:[])];
 const s=ways.length>2?`${ways.slice(0,-1).join(', ')}, or ${ways[ways.length-1]}`:ways.join(' or ');
 return s?s[0].toUpperCase()+s.slice(1):'';
}
/** What an agent with these skills can read in a chat, as short words for the page ('' when nothing). */
export function chatReads(skills:readonly string[]){
 const w=skills.includes('monitor'),t=skills.includes('whales');
 return w&&t?'a wallet on Robinhood Chain and the RHIO token’s transfers and holders':w?'a wallet on Robinhood Chain':t?'the RHIO token’s transfers and holders':'';
}
