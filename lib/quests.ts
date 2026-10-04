/* Quests: a short list of things to try in the Studio. Each one is done when the server can SEE that it happened (an
   agent exists, a run completed, a schedule exists, a channel is connected...), never because a browser says so. A done
   quest can be claimed once per account for a few FREE credits (drizzle/0021).
   Free credits are the kind an account also gets at sign-up: they pay for runs, they are spent before bought credits,
   and they are never part of claimable earnings and cannot be withdrawn (lib/economy.ts). So a quest reward can only be
   used to run agents here.
   To add a quest: add an entry to QUESTS with a check that reads the database. Keep ids stable: they are the claim key.
   A quest whose feature is off on this server (Telegram without a bot, the token without a recorder) is left out.
   Env (server only): QUESTS_ENABLED (default true), QUEST_CREDITS (free credits per quest, default 5; 0 = no credits). */
import {env} from 'cloudflare:workers';
import {HttpError,aiReady} from './server';
import {ensureWallet,ledgerRow} from './economy';
import {notifyConfig} from './notify';
import {chainConfig} from './chain';

type Env={QUESTS_ENABLED?:string;QUEST_CREDITS?:string};
const E=()=>env as unknown as Env;
export function questConfig(){
 const n=Number(E().QUEST_CREDITS);
 return {enabled:E().QUESTS_ENABLED!=='false',credits:E().QUEST_CREDITS!==undefined&&E().QUEST_CREDITS!==''&&Number.isFinite(n)?Math.min(Math.max(Math.round(n),0),100):5};
}

type Quest={id:string;title:string;text:string;/** where the quest is done: a view of the app (lib/routes.ts) */go:string;icon:string;
 /** false: the feature is off on this server, the quest is not offered */on?:()=>boolean;
 check:(db:D1Database,owner:string)=>Promise<boolean>};
const has=async(db:D1Database,sql:string,...args:unknown[])=>!!await db.prepare(sql).bind(...args).first();

export const QUESTS:Quest[]=[
 {id:'agent',title:'Give an agent a face',text:'Pick a character, name it and save your first agent in the Studio.',go:'studio',icon:'cube',
  check:(db,o)=>has(db,'SELECT 1 AS x FROM agents WHERE owner=? LIMIT 1',o)},
 {id:'run',title:'Put it to work',text:'Run one of its skills and get a result.',go:'studio',icon:'play',
  check:(db,o)=>has(db,"SELECT 1 AS x FROM runs WHERE owner=? AND status='complete' LIMIT 1",o)},
 {id:'team',title:'Make two agents work together',text:'Line up two agents on the Teams page and run them: the second one works from the answer of the first.',go:'teams',icon:'link',
  check:(db,o)=>has(db,"SELECT 1 AS x FROM runs WHERE owner=? AND status='complete' AND relay IS NOT NULL AND step>=2 LIMIT 1",o)},
 {id:'talk',title:'Talk to an agent',text:'Open a published agent from Discover and send it a message on its page.',go:'discover',icon:'users',
  check:(db,o)=>has(db,"SELECT 1 AS x FROM runs WHERE owner=? AND status='complete' AND talk IS NOT NULL LIMIT 1",o)},
 {id:'voice',title:'Give an agent your voice',text:'In the Studio, open Persona, paste posts you wrote and let it draft the instructions in your style.',go:'studio',icon:'pen',
  on:()=>aiReady(),
  check:(db,o)=>has(db,"SELECT 1 AS x FROM runs WHERE owner=? AND status='complete' AND skill='voice' LIMIT 1",o)},
 {id:'schedule',title:'Let it work on its own',text:'Put a skill on a schedule so the agent runs it without you.',go:'schedules',icon:'clock',
  check:(db,o)=>has(db,'SELECT 1 AS x FROM schedules WHERE owner=? LIMIT 1',o)},
 {id:'deliver',title:'Get the report where you are',text:'Connect a Discord channel or a Telegram chat under Schedules → Delivery.',go:'schedules',icon:'share',
  on:()=>notifyConfig().discord||notifyConfig().telegram,
  check:(db,o)=>has(db,'SELECT 1 AS x FROM notify_channels WHERE owner=? AND dead=0 LIMIT 1',o)},
 {id:'chat',title:'Talk to it on Telegram',text:'Let an agent answer in one of your Telegram chats, then ask it something there.',go:'schedules',icon:'users',
  on:()=>notifyConfig().telegram,
  check:(db,o)=>has(db,"SELECT 1 AS x FROM notify_channels WHERE owner=? AND kind='telegram' AND chat_agent IS NOT NULL AND chat_used>0 LIMIT 1",o)},
 {id:'chain',title:'Read the chain',text:'Run the Wallet monitor or the Whale watch skill once.',go:'studio',icon:'scan',
  on:()=>!!chainConfig().rhio,
  check:(db,o)=>has(db,"SELECT 1 AS x FROM runs WHERE owner=? AND status='complete' AND skill IN ('monitor','whales') LIMIT 1",o)},
 {id:'share',title:'Show an answer',text:'Open a run in History and share its answer on a public page.',go:'activity',icon:'share',
  check:(db,o)=>has(db,'SELECT 1 AS x FROM run_shares WHERE owner=? LIMIT 1',o)},
 {id:'publish',title:'Open for business',text:'Publish an agent in Discover so other people can run it.',go:'agents',icon:'store',
  check:(db,o)=>has(db,'SELECT 1 AS x FROM agents WHERE owner=? AND published=1 AND archived=0 LIMIT 1',o)},
];
const offered=()=>QUESTS.filter(q=>!q.on||q.on());

export type QuestView={id:string;title:string;text:string;go:string;icon:string;credits:number;done:boolean;claimed:boolean};
/** The quests of this server; with an account: which are done and which were claimed. */
export async function questList(db:D1Database,owner?:string){
 const cfg=questConfig();if(!cfg.enabled)return {enabled:false,credits:0,quests:[] as QuestView[],earned:0};
 const list=offered();
 const claims=owner?(await db.prepare('SELECT quest,credits FROM quest_claims WHERE owner=?').bind(owner).all<{quest:string;credits:number}>()).results:[];
 const claimed=new Map(claims.map(c=>[c.quest,c.credits]));
 const done=owner?await Promise.all(list.map(q=>claimed.has(q.id)?true:q.check(db,owner).catch(()=>false))):list.map(()=>false);
 return {enabled:true,credits:cfg.credits,earned:claims.reduce((a,c)=>a+c.credits,0),
  quests:list.map((q,i)=>({id:q.id,title:q.title,text:q.text,go:q.go,icon:q.icon,credits:claimed.get(q.id)??cfg.credits,done:done[i],claimed:claimed.has(q.id)}))};
}

/** Claims a finished quest: the claim row, the credits and the ledger line go in ONE batch. The claim row comes first
    and its primary key fails the batch on a second claim, so two clicks or two tabs can never add credits twice. */
export async function claimQuest(db:D1Database,owner:string,id:string){
 const cfg=questConfig();if(!cfg.enabled)throw new HttpError(503,'Quests are switched off on this server.');
 const q=offered().find(x=>x.id===id);if(!q)throw new HttpError(404,'Quest not found.');
 if(await has(db,'SELECT 1 AS x FROM quest_claims WHERE owner=? AND quest=?',owner,id))throw new HttpError(409,'You already claimed this quest.');
 if(!await q.check(db,owner))throw new HttpError(400,'This quest is not done yet.');
 await ensureWallet(db,owner);const now=new Date().toISOString();
 const batch=[db.prepare('INSERT INTO quest_claims (owner,quest,credits,created) VALUES (?,?,?,?)').bind(owner,id,cfg.credits,now)];
 // free credits: the balance grows, the bought part (paid) does not
 if(cfg.credits>0)batch.push(db.prepare('UPDATE preview_wallets SET balance=balance+? WHERE owner=?').bind(cfg.credits,owner),ledgerRow(db,owner,cfg.credits,'quest',`Quest · ${q.title}`,id,now));
 try{await db.batch(batch);}catch{throw new HttpError(409,'You already claimed this quest.');}
 return {claimed:id,credits:cfg.credits};
}
