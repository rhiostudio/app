/* The launch guide (GET /api/launch; page /dashboard/launch, components/app/launch.tsx): the way from "I picked a
   character" to "people are talking to my agent", as one list. Every step is something the Studio already has; the
   guide only says which ones are done for one of the account's agents, read from the database, and where to do the
   next one. Nothing is stored for it and nothing is paid for finishing it.
   A step is done when the server can see it:
     character  the agent is saved
     voice      its instructions are long enough for the agent check (lib/agent-check.ts needs 80 characters)
     knows      it has a source (lib/knowledge.ts) or always-on notes
     opening    it has a greeting and at least one question to start from
     check      it passed the agent check with what it says and knows now
     publish    it is published
     first      someone other than its creator got an answer from it
   and, further on (none of them needed): a verified X handle, an answer place in Telegram, a chat on the creator's
   site, a duel. A step whose feature is off on this server is left out. */
import {configMark,type Agent} from './agents';
import {notifyConfig} from './notify';
import {aiReady} from './server';

export const LAUNCH_VOICE_MIN=80;
export type LaunchStep={id:string;title:string;text:string;done:boolean;/** where the step is done: a tab of the Studio, the publish dialog, sharing, or a page */go:'look'|'persona'|'voice'|'publish'|'share'|'profile'|'schedules'|'arena'};
export type Launch={agents:{id:string;name:string;skin:string;published:boolean}[];agent:{id:string;name:string;skin:string;published:boolean}|null;
 steps:LaunchStep[];more:LaunchStep[];done:number;/** the first step that is not done */next:string|null};

const STEPS:Omit<LaunchStep,'done'>[]=[
 {id:'character',title:'Pick a character and name it',text:'Choose one of the 25 characters, dress it, give it a name and save it.',go:'look'},
 {id:'voice',title:'Give it a voice',text:'Write how it talks and what it is about, or paste posts you wrote and let the Studio draft it in your voice.',go:'voice'},
 {id:'knows',title:'Give it what you know',text:'Paste your notes, an FAQ or an old thread. It answers from them and names the source under its answer.',go:'persona'},
 {id:'opening',title:'Write its opening',text:'The first line it says in a chat, and one to three questions people can tap to start.',go:'persona'},
 {id:'check',title:'Pass the agent check',text:'Four real messages test that it answers, keeps its instructions to itself, gives no buy or sell advice and says it is an AI.',go:'publish'},
 {id:'publish',title:'Publish it with a price',text:'Set what a task and a chat message cost. It then has its own page, card and place in Discover and the plaza.',go:'publish'},
 {id:'first',title:'Get its first conversation',text:'Post its link. This step is done when someone other than you gets an answer from it.',go:'share'},
];
const MORE:Omit<LaunchStep,'done'>[]=[
 {id:'verified',title:'Verify your X handle',text:'Post a code from your account; a person on the team checks it and your agents carry your handle.',go:'profile'},
 {id:'telegram',title:'Let it answer in Telegram',text:'Link a chat or a group and choose this agent to answer there.',go:'schedules'},
 {id:'site',title:'Put it on your own site',text:'A chat with it in a frame on your website; visitors need no account.',go:'schedules'},
 {id:'duel',title:'Put it in a duel',text:'Ask it and another agent the same question and let readers pick.',go:'arena'},
];

type Row={id:string;name:string;config:string;published:number;archived:number;checked_at:string|null;check_mark:string|null;check_passed:number|null;kb_rev:number;updated:string};

export async function launch(db:D1Database,owner:string,want?:string|null):Promise<Launch>{
 const rows=(await db.prepare('SELECT id,name,config,published,archived,checked_at,check_mark,check_passed,kb_rev,updated FROM agents WHERE owner=? AND archived=0 ORDER BY updated DESC LIMIT 50').bind(owner).all<Row>()).results;
 const skinOf=(r:Row)=>{try{return (JSON.parse(r.config) as Agent).skin||'atlas';}catch{return 'atlas';}};
 const agents=rows.map(r=>({id:r.id,name:r.name,skin:skinOf(r),published:!!r.published}));
 const row=rows.find(r=>r.id===String(want||'').toLowerCase())||rows[0]||null;
 const telegram=notifyConfig().telegram;const more=MORE.filter(s=>s.id!=='telegram'||telegram);
 if(!row)return {agents,agent:null,steps:STEPS.map(s=>({...s,done:false})),more:more.map(s=>({...s,done:false})),done:0,next:'character'};
 let c:Partial<Agent>={};try{c=JSON.parse(row.config) as Agent;}catch{c={};}
 const [sources,used,handle,tg,site,duel]=await Promise.all([
  db.prepare('SELECT COUNT(*) AS n FROM knowledge_sources WHERE agent_id=?').bind(row.id).first<{n:number}>(),
  db.prepare("SELECT 1 AS x FROM runs WHERE agent_id=? AND owner!=? AND status='complete' LIMIT 1").bind(row.id,owner).first(),
  db.prepare("SELECT 1 AS x FROM creators WHERE owner=? AND status='verified'").bind(owner).first(),
  telegram?db.prepare("SELECT 1 AS x FROM notify_channels WHERE kind='telegram' AND chat_agent=? LIMIT 1").bind(row.id).first():Promise.resolve(null),
  db.prepare('SELECT 1 AS x FROM embeds WHERE agent_id=? AND owner=? LIMIT 1').bind(row.id,owner).first(),
  db.prepare('SELECT 1 AS x FROM duels d JOIN runs r ON r.id IN (d.run_a,d.run_b) WHERE r.agent_id=? LIMIT 1').bind(row.id).first(),
 ]);
 const starters=Array.isArray(c.starters)?c.starters.filter(s=>typeof s==='string'&&s.trim()):[];
 const is:Record<string,boolean>={
  character:true,
  voice:(c.personality||'').trim().length>=LAUNCH_VOICE_MIN,
  knows:Number(sources?.n||0)>0||(c.knowledge||'').trim().length>=40,
  opening:!!(c.greeting||'').trim()&&starters.length>0,
  check:!!row.checked_at&&!!row.check_passed&&row.check_mark===configMark(c,row.kb_rev),
  publish:!!row.published,
  first:!!used,
  verified:!!handle,telegram:!!tg,site:!!site,duel:!!duel,
 };
 // the agent check needs live AI: where there is none the step is left out, so the guide can still be finished
 const steps=STEPS.filter(s=>s.id!=='check'||aiReady()).map(s=>({...s,done:!!is[s.id]}));
 return {agents,agent:{id:row.id,name:row.name,skin:skinOf(row),published:!!row.published},steps,more:more.map(s=>({...s,done:!!is[s.id]})),
  done:steps.filter(s=>s.done).length,next:steps.find(s=>!s.done)?.id??null};
}
/** The guide for someone who is not signed in: the steps, none of them done. */
export const launchPreview=():Launch=>({agents:[],agent:null,steps:STEPS.filter(s=>s.id!=='check'||aiReady()).map(s=>({...s,done:false})),more:MORE.filter(s=>s.id!=='telegram'||notifyConfig().telegram).map(s=>({...s,done:false})),done:0,next:'character'});
