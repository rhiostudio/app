/* A chat with an agent on its creator's own website (drizzle/0035; GET/POST/DELETE /api/embed; the page /embed/<id>,
   components/rhio/embed-page.tsx; set up in Schedules → "On your site", components/app/embed-panel.tsx).
   The creator picks one of their own agents, names the one site that may show the chat, and sets how many answers a
   day it may give. They get a frame to paste into that site. Visitors need no wallet and no account: every answer is
   a chat message of the agent (lib/talk.ts, lib/runs.ts performRun with `talk`), paid from the credits of the account
   that made the embed, filed in its History, with the agent's instructions never shown.
   What keeps the cost bounded, in this order: the answers per day the creator chose; a limit per visitor and day and a
   short pause between a visitor's messages; the length of a message.
   What the site check is and is not: the chat page tells the server which site it is shown on, and the server answers
   only for the site the creator named (or for the creator, who sees a preview). A browser cannot be made to lie about
   that from another site. A program that calls the address directly can claim any site: against that there are only
   the limits above, and the texts say so ("at most N answers a day", never "only your visitors").
   A visitor is counted by a keyed hash of the embed, the day and the network address; the address is not stored. */
import {env} from 'cloudflare:workers';
import {HttpError,safeMessage,appOrigin} from './server';
import {performRun} from './runs';
import {talkInfo,TALK_SKILL} from './talk';
import {liveDailyPerUser} from './economy';
import type {Agent} from './agents';
import {chatAsk,chatReads} from './chat-tools';

export const EMBED_ID=/^[A-Za-z0-9_-]{16}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Embeds per account, the choices for answers a day, answers per visitor and day, the pause between one visitor's
    messages, and the longest message. */
export const EMBED_MAX=5,EMBED_DAILY=[20,50,100,200,500] as const,EMBED_PER_VISITOR=15,EMBED_GAP_MS=4000,EMBED_MESSAGE_MAX=600;
/** The agent's own page on RHIO as the place of a chat: a "guest chat". Signed-out visitors of /a/<id> send the agent a
    few messages there, paid by its creator like the answers of a chat on the creator's site. It is kept as an embed
    whose origin is this word instead of a site (siteOrigin() can never produce it), so the day's amount, the
    per-visitor bounds and the paying all run through the same statements. One per agent, the agent must be published,
    and it does not count against EMBED_MAX. The page shows it inside a frame of /embed/<id>, and the check is that the
    frame's parent is this app itself. */
export const PAGE_ORIGIN='rhio:page';
const newId=()=>btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(12)))).replace(/\+/g,'-').replace(/\//g,'_');
const today=()=>new Date().toISOString().slice(0,10);
/** What the page that sets a chat up needs: the limits, how answers run here, and the credits one answer costs. */
export const embedLimits=()=>{const t=talkInfo();return {max:EMBED_MAX,daily:[...EMBED_DAILY],perVisitor:EMBED_PER_VISITOR,chars:EMBED_MESSAGE_MAX,mode:t.mode,message:t.message,
 /** every live run of the account counts against this, the answers of its chats included */perAccount:liveDailyPerUser()};};

/** The site a chat may be shown on: scheme and host of an https address (http only for localhost, to try it out). */
export function siteOrigin(input:unknown):string{
 const raw=String(input??'').trim();let u:URL;
 try{u=new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)?raw:`https://${raw}`);}catch{throw new HttpError(400,'Enter the address of your site, for example https://example.com.');}
 const local=u.hostname==='localhost'||u.hostname==='127.0.0.1';
 if(u.protocol!=='https:'&&!(u.protocol==='http:'&&local))throw new HttpError(400,'The site has to be an https address.');
 if(!local&&!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(u.hostname))throw new HttpError(400,'Enter the address of your site, for example https://example.com.');
 if(u.username||u.password)throw new HttpError(400,'Enter the address of your site, without a user name.');
 return u.origin.toLowerCase();
}
/** The same for what the chat page reports ('' when the page is not inside a frame); never throws. */
const reported=(site:unknown)=>{const s=String(site??'').trim();if(!s)return '';try{return new URL(s).origin.toLowerCase();}catch{return 'invalid';}};

type Row={id:string;owner:string;agent_id:string;origin:string;daily:number;day:string|null;used:number;active:number;created:string};
export type Embed={id:string;agentId:string;agentName:string;origin:string;daily:number;used:number;active:boolean;created:string;/** the agent was archived: the chat does not answer */gone:boolean};
/** A guest chat of one of the account's agents (see PAGE_ORIGIN). */
export type Guest={id:string;agentId:string;daily:number;used:number;active:boolean};

async function ownAgent(db:D1Database,owner:string,agentId:unknown){
 if(typeof agentId!=='string'||!UUID.test(agentId))throw new HttpError(404,'Choose one of your saved agents.');
 const a=await db.prepare('SELECT id,archived FROM agents WHERE id=? AND owner=?').bind(agentId.toLowerCase(),owner).first<{id:string;archived:number}>();
 if(!a)throw new HttpError(404,'Choose one of your saved agents.');
 if(a.archived)throw new HttpError(404,'This agent was archived. Restore it first.');
 return a.id;
}
const dailyOf=(v:unknown)=>{const n=Number(v);if(!(EMBED_DAILY as readonly number[]).includes(n))throw new HttpError(400,'Choose one of the listed amounts of answers a day.');return n;};

export async function listEmbeds(db:D1Database,owner:string):Promise<Embed[]>{
 const rows=(await db.prepare('SELECT e.*,a.name AS agent_name,a.archived AS agent_archived FROM embeds e LEFT JOIN agents a ON a.id=e.agent_id AND a.owner=e.owner WHERE e.owner=? AND e.origin!=? ORDER BY e.created').bind(owner,PAGE_ORIGIN).all<Row&{agent_name:string|null;agent_archived:number|null}>()).results;
 const day=today();
 return rows.map(r=>({id:r.id,agentId:r.agent_id,agentName:r.agent_name||'Removed agent',origin:r.origin,daily:r.daily,used:r.day===day?r.used:0,active:!!r.active,created:r.created,gone:r.agent_name===null||!!r.agent_archived}));
}
/** The account's guest chats: which of its agents visitors can try on the agent's page, and for how many answers a day. */
export async function listGuests(db:D1Database,owner:string):Promise<Guest[]>{
 const rows=(await db.prepare('SELECT * FROM embeds WHERE owner=? AND origin=? ORDER BY created').bind(owner,PAGE_ORIGIN).all<Row>()).results;const day=today();
 return rows.map(r=>({id:r.id,agentId:r.agent_id,daily:r.daily,used:r.day===day?r.used:0,active:!!r.active}));
}
export async function createEmbed(db:D1Database,owner:string,input:{agentId?:unknown;origin?:unknown;daily?:unknown}){
 const agentId=await ownAgent(db,owner,input.agentId);const page=input.origin===PAGE_ORIGIN;const origin=page?PAGE_ORIGIN:siteOrigin(input.origin);const daily=dailyOf(input.daily??50);
 const id=newId();
 if(page){
  const a=await db.prepare('SELECT published FROM agents WHERE id=? AND owner=?').bind(agentId,owner).first<{published:number}>();
  if(!a?.published)throw new HttpError(409,'Publish the agent first: visitors try it on its page.');
  // one per agent, checked inside the insert
  const made=await db.prepare('INSERT INTO embeds (id,owner,agent_id,origin,daily,used,active,created) SELECT ?,?,?,?,?,0,1,? WHERE NOT EXISTS (SELECT 1 FROM embeds WHERE owner=? AND agent_id=? AND origin=?)').bind(id,owner,agentId,PAGE_ORIGIN,daily,new Date().toISOString(),owner,agentId,PAGE_ORIGIN).run();
  if(!made.meta.changes)throw new HttpError(409,'Visitors can already try this agent. Change the amount instead.');
  return id;
 }
 // the count check runs inside the insert, so parallel requests cannot pass the limit
 const r=await db.prepare('INSERT INTO embeds (id,owner,agent_id,origin,daily,used,active,created) SELECT ?,?,?,?,?,0,1,? WHERE (SELECT COUNT(*) FROM embeds WHERE owner=? AND origin!=?)<?').bind(id,owner,agentId,origin,daily,new Date().toISOString(),owner,PAGE_ORIGIN,EMBED_MAX).run();
 if(!r.meta.changes)throw new HttpError(409,`You can keep up to ${EMBED_MAX} chats on sites. Remove one first.`);
 return id;
}
export async function updateEmbed(db:D1Database,owner:string,id:unknown,input:{origin?:unknown;daily?:unknown;active?:unknown}){
 if(typeof id!=='string'||!EMBED_ID.test(id))throw new HttpError(404,'Chat not found.');
 const sets:string[]=[],args:unknown[]=[];
 // a guest chat stays on the agent's page: its place cannot be changed into a site
 let guard='';
 if(input.origin!==undefined){sets.push('origin=?');args.push(siteOrigin(input.origin));guard=` AND origin!='${PAGE_ORIGIN}'`;}
 if(input.daily!==undefined){sets.push('daily=?');args.push(dailyOf(input.daily));}
 if(typeof input.active==='boolean'){sets.push('active=?');args.push(input.active?1:0);}
 if(!sets.length)throw new HttpError(400,'Nothing to change.');
 const r=await db.prepare(`UPDATE embeds SET ${sets.join(',')} WHERE id=? AND owner=?${guard}`).bind(...args,id,owner).run();
 if(!r.meta.changes)throw new HttpError(404,'Chat not found.');
}
export async function removeEmbed(db:D1Database,owner:string,id:unknown){
 if(typeof id!=='string'||!EMBED_ID.test(id))throw new HttpError(404,'Chat not found.');
 const done=await db.batch([db.prepare('DELETE FROM embed_hits WHERE embed_id=? AND EXISTS (SELECT 1 FROM embeds WHERE id=? AND owner=?)').bind(id,id,owner),db.prepare('DELETE FROM embeds WHERE id=? AND owner=?').bind(id,owner)]);
 if(!done[1].meta.changes)throw new HttpError(404,'Chat not found.');
}

type Loaded=Row&{config:string|null;name:string|null;archived:number|null;published:number|null};
const load=(db:D1Database,id:string)=>db.prepare('SELECT e.*,a.config,a.name,a.archived,a.published FROM embeds e LEFT JOIN agents a ON a.id=e.agent_id AND a.owner=e.owner WHERE e.id=?').bind(id).first<Loaded>();
/** The embed when this request may see it: shown on the site its creator named, or opened by the creator (preview).
    A guest chat is shown on this app's own pages (`self`, its origin) and only while its agent is published. */
async function open(db:D1Database,id:unknown,site:unknown,viewer?:string|null,self?:string){
 if(typeof id!=='string'||!EMBED_ID.test(id))throw new HttpError(404,'This chat is not available.');
 const e=await load(db,id);if(!e||!e.config||e.archived)throw new HttpError(404,'This chat is not available.');
 const mine=!!viewer&&viewer===e.owner;const page=e.origin===PAGE_ORIGIN;
 if(page&&!e.published)throw new HttpError(404,'This chat is not available.');
 if(!mine){
  if(!e.active)throw new HttpError(404,'This chat is switched off.');
  if(page){if(!self||reported(site)!==self.toLowerCase())throw new HttpError(403,'This chat is shown on the agent\u2019s own page only.');}
  else if(reported(site)!==e.origin)throw new HttpError(403,`This chat is set up for ${new URL(e.origin).host} only.`);
 }
 return {e,mine};
}
/** What the chat page shows before the first message: the agent's public face. Never its instructions or its owner. */
export async function embedInfo(db:D1Database,id:unknown,site:unknown,viewer?:string|null,self?:string){
 const {e,mine}=await open(db,id,site,viewer,self);const c=JSON.parse(e.config!) as Agent;
 return {id:e.id,name:e.name||c.name,skin:c.skin,look:c.look??null,appearance:c.appearance??null,motion:c.motion||null,tagline:c.tagline||'',
  greeting:typeof c.greeting==='string'?c.greeting:'',starters:Array.isArray(c.starters)?c.starters.filter(s=>typeof s==='string'&&s).slice(0,3):[],
  agentId:e.published&&!e.archived?e.agent_id:null,/* what it can read in a chat (lib/chat-tools.ts); "my wallet" is never read here */reads:chatReads(c.skills||[]).replace('a wallet on Robinhood Chain','a wallet address on Robinhood Chain'),ask:chatAsk(c.skills||[],{shared:true}),mode:talkInfo().mode,max:EMBED_MESSAGE_MAX,/** the creator looking at their own chat: answers are charged as usual */preview:mine,active:!!e.active};
}

/** The visitor, as a key that says nothing about them: a keyed hash of the embed, the day and the network address. */
async function visitorKey(request:Request,embedId:string,day:string){
 const h=request.headers;const ip=(h.get('x-real-ip')||(h.get('x-forwarded-for')||'').split(',').map(s=>s.trim()).filter(Boolean).pop()||'local').slice(0,64);
 const secret=(env as unknown as {BETTER_AUTH_SECRET?:string}).BETTER_AUTH_SECRET||'rhio-embed';
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${secret}\n${embedId}\n${day}\n${ip}`)));
 return [...bytes.slice(0,12)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

/** One message from a visitor of the site: a paid chat message of the agent, charged to the account behind the embed.
    The reply never carries that account's numbers. */
export async function embedSay(db:D1Database,request:Request,input:{id?:unknown;site?:unknown;thread?:unknown;message?:unknown;rid?:unknown},viewer?:string|null){
 const {e}=await open(db,input.id,input.site,viewer,appOrigin(request));
 const message=String(input.message??'').trim();
 if(!message||message.length>EMBED_MESSAGE_MAX)throw new HttpError(400,`Write a message of up to ${EMBED_MESSAGE_MAX} characters.`);
 if(typeof input.thread!=='string'||!UUID.test(input.thread)||typeof input.rid!=='string'||!UUID.test(input.rid))throw new HttpError(400,'Reload the chat and try again.');
 const day=today(),now=Date.now(),who=await visitorKey(request,e.id,day);
 // one statement takes the visitor's slot: not above their limit for the day, not inside the pause after their last message
 const mineSlot=await db.prepare('INSERT INTO embed_hits (embed_id,visitor,day,used,last) VALUES (?1,?2,?3,1,?4) ON CONFLICT(embed_id,visitor,day) DO UPDATE SET used=used+1,last=?4 WHERE used<?5 AND last<?6').bind(e.id,who,day,now,EMBED_PER_VISITOR,now-EMBED_GAP_MS).run();
 if(!mineSlot.meta.changes){
  const had=await db.prepare('SELECT used FROM embed_hits WHERE embed_id=? AND visitor=? AND day=?').bind(e.id,who,day).first<{used:number}>();
  throw new HttpError(429,(had?.used??0)>=EMBED_PER_VISITOR?'You have had your answers here for today. Come back tomorrow.':'One moment: wait a few seconds between messages.');
 }
 const back=()=>db.prepare('UPDATE embed_hits SET used=MAX(used-1,0) WHERE embed_id=? AND visitor=? AND day=?').bind(e.id,who,day).run().catch(()=>null);
 // and one takes a slot of the day the creator allowed
 const slot=await db.prepare('UPDATE embeds SET used=CASE WHEN day IS ?1 THEN used+1 ELSE 1 END,day=?1 WHERE id=?2 AND (day IS NOT ?1 OR used<daily)').bind(day,e.id).run();
 if(!slot.meta.changes){await back();throw new HttpError(429,'This chat has had its answers for today. It opens again after 00:00 UTC.');}
 try{
  const run=await performRun(db,e.owner,{id:input.rid.toLowerCase(),agentId:e.agent_id,prompt:message,skill:TALK_SKILL,mode:talkInfo().mode,talk:input.thread.toLowerCase()},undefined,{guard:true,search:false,label:e.origin===PAGE_ORIGIN?'Guest chat on its page':'Chat on your site',shared:true});
  return {id:run.id,answer:run.output};
 }catch(err){
  // nothing was produced: both slots go back, and the visitor is told without the owner's numbers
  await back();await db.prepare('UPDATE embeds SET used=MAX(used-1,0) WHERE id=? AND day=?').bind(e.id,day).run().catch(()=>null);
  const st=err instanceof HttpError?err.status:500;
  if(st!==402&&st!==429&&st!==503&&st!==502)console.error('RHIO embed chat failed:',safeMessage((err as Error)?.message||err));
  throw new HttpError(st===402||st===429||st===503?503:502,st===402?'This chat is paused for now.':st===429?'This chat is busy right now. Try again later.':st===503?'The AI is not available right now. Try again later.':'That message could not be answered. Try again.');
 }
}
