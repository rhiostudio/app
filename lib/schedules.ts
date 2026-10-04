/* Scheduled agent work. The owner chooses an agent, one of its skills, the task, how many times a day it should run
   and the time of the first run; the scheduler then runs it on those slots, paid with credits.
   Limits (env, server only):
     SCHEDULES_ENABLED     default true
     SCHEDULE_RUN_COST     minimum credits per scheduled run, default 5; a live run costs the skill's price when higher
     SCHEDULE_MAX          schedules per account, default 3
     SCHEDULE_DAILY_RUNS   scheduled runs per account per UTC day, default 24
   SCHEDULE_MAX and SCHEDULE_DAILY_RUNS are what a Free account gets; a holder tier multiplies them (lib/tiers.ts).
     SCHEDULER_TOKEN       bearer token for POST /api/schedules/tick (the Docker entrypoint generates one per start)
   Slots: start_minute (UTC minute of day) + k x (1440 / per_day). A missed slot (server down) is skipped, never replayed
   in a burst. Out of credits or a removed agent/skill pauses the schedule with a readable status.
   Delivery: a schedule with `notify` (a channel of its owner, lib/notify.ts) sends each completed run there, and one
   notice when it gets paused. Sending happens after the run is settled and can never fail or refund it. */
import {env} from 'cloudflare:workers';
import {aiReady,HttpError} from './server';
import {isOpenSkill,type Agent,type SkillId} from './agents';
import {performRun} from './runs';
import {liveRunCost} from './economy';
import {deliverRun,deliverNotice,notifyConfig} from './notify';
import {limitsFor,perkTable} from './tiers';
import {chainConfig,TIERS} from './chain';
/** Credits for one scheduled run: the skill's live price (lib/economy.ts), never below SCHEDULE_RUN_COST. */
export const scheduledRunCost=(runCost:number,skill:string,mode:'live'|'sample')=>mode==='live'?Math.max(runCost,liveRunCost(skill)):runCost;

type Env={SCHEDULES_ENABLED?:string;SCHEDULE_RUN_COST?:string;SCHEDULE_MAX?:string;SCHEDULE_DAILY_RUNS?:string;SCHEDULER_TOKEN?:string;CLAIMS_ADMIN_TOKEN?:string};
const E=()=>env as unknown as Env;
const int=(v:string|undefined,d:number,min=0,max=100000)=>{const n=Number(v);return v!==undefined&&v!==''&&Number.isFinite(n)?Math.min(Math.max(Math.round(n),min),max):d;};
export const PER_DAY=[1,2,3,4,6,8,12,24] as const;

export function scheduleConfig(){
 const e=E();
 return {enabled:e.SCHEDULES_ENABLED!=='false',runCost:int(e.SCHEDULE_RUN_COST,5,0,10000),max:int(e.SCHEDULE_MAX,3,0,100),dailyCap:int(e.SCHEDULE_DAILY_RUNS,24,1,1000),perDay:[...PER_DAY]};
}

const base=()=>{const c=scheduleConfig();return {schedules:c.max,dailyRuns:c.dailyCap,channels:notifyConfig().max};};
/** This account's limits: the server's own (SCHEDULE_MAX, SCHEDULE_DAILY_RUNS, NOTIFY_MAX) raised by its holder tier. */
export const accountLimits=(db:D1Database,owner:string)=>limitsFor(db,owner,base());
/** Every tier's limits on this server (null while there is no token). */
export const tierPerks=()=>perkTable(base());
export type TierRow={id:string;name:string;min:string;monthlyCredits:number;schedules:number;dailyRuns:number;channels:number};
/** The tiers as the public page and its link preview show them: what each needs and gives here (null without a token). */
export function tierRows():TierRow[]|null{
 const perks=tierPerks();if(!perks)return null;const credits=chainConfig().tierBase;
 return perks.map(p=>({id:p.id,name:p.name,min:p.min,monthlyCredits:(TIERS.find(t=>t.id===p.id)?.mult??0)*credits,schedules:p.schedules,dailyRuns:p.dailyRuns,channels:p.channels}));
}

/** First slot strictly after `after`. */
export function nextRun(perDay:number,startMinute:number,after:Date){
 const step=1440/perDay;const day=Date.UTC(after.getUTCFullYear(),after.getUTCMonth(),after.getUTCDate());let best=Infinity;
 for(const d of [0,1])for(let k=0;k<perDay;k++){const t=day+d*864e5+((startMinute+k*step)%1440)*6e4;if(t>after.getTime()&&t<best)best=t;}
 return new Date(best);
}

/** Bearer check for the tick endpoint: SCHEDULER_TOKEN, or the operator token as a fallback. */
export function tickAllowed(req:Request){
 const got=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
 return [E().SCHEDULER_TOKEN,E().CLAIMS_ADMIN_TOKEN].some(want=>{
  if(!want||want.length<32||got.length!==want.length)return false;let d=0;for(let i=0;i<want.length;i++)d|=want.charCodeAt(i)^got.charCodeAt(i);return d===0;});
}

export type ScheduleRow={id:string;owner:string;agent_id:string;skill:string;prompt:string;per_day:number;start_minute:number;mode:string;active:number;next_run:string;last_run:string|null;last_status:string|null;last_run_id:string|null;runs:number;created:string;updated:string;notify?:string|null};

const today=()=>new Date().toISOString().slice(0,10)+'T00:00:00.000Z';
export async function usedToday(db:D1Database,owner:string){
 // failed runs count too: a schedule whose runs keep failing still makes the provider work, so it must not run without limit
 return (await db.prepare('SELECT COUNT(*) AS n FROM runs WHERE owner=? AND schedule_id IS NOT NULL AND created>=?').bind(owner,today()).first<{n:number}>())?.n??0;
}

/** Checks that the agent is the owner's, not archived, and carries the (open) skill. Returns the agent name. */
export async function checkTarget(db:D1Database,owner:string,agentId:string,skill:string){
 const a=await db.prepare('SELECT owner,config,name,archived FROM agents WHERE id=?').bind(agentId).first<{owner:string;config:string;name:string;archived:number}>();
 if(!a||a.owner!==owner)throw new HttpError(404,'Schedules run your own saved agents only.');
 if(a.archived)throw new HttpError(404,`${a.name} was archived. Restore it to run this schedule again.`);
 if(!(JSON.parse(a.config) as Agent).skills.includes(skill as SkillId))throw new HttpError(400,'Equip this skill on the agent first.');
 if(!isOpenSkill(skill))throw new HttpError(403,'This skill is locked.');
 return a.name;
}

/** Runs every due schedule (up to `limit`, within `budgetMs`). Safe to call from several tickers at once. */
export async function runDue(db:D1Database,{limit=10,budgetMs=50000,now=new Date()}:{limit?:number;budgetMs?:number;now?:Date}={}){
 const cfg=scheduleConfig();if(!cfg.enabled)return {ran:0,skipped:0,paused:0,due:0};
 const started=Date.now();
 const due=await db.prepare('SELECT * FROM schedules WHERE active=1 AND next_run<=? ORDER BY next_run LIMIT ?').bind(now.toISOString(),limit).all<ScheduleRow>();
 let ran=0,skipped=0,paused=0;const caps=new Map<string,number>();
 for(const s of due.results){
  if(Date.now()-started>budgetMs)break;
  // claim this slot: only the ticker that moves next_run forward runs it
  const next=nextRun(s.per_day,s.start_minute,now).toISOString();
  const claim=await db.prepare('UPDATE schedules SET next_run=?,updated=? WHERE id=? AND next_run=? AND active=1').bind(next,now.toISOString(),s.id,s.next_run).run();
  if(!claim.meta.changes)continue;
  const set=(status:string,extra='',...args:unknown[])=>db.prepare(`UPDATE schedules SET last_status=?,updated=?${extra} WHERE id=?`).bind(status,new Date().toISOString(),...args,s.id).run();
  // the daily limit is the account's own: the server's, raised by its holder tier (read once per tick and owner)
  let cap=caps.get(s.owner);if(cap===undefined){cap=(await accountLimits(db,s.owner)).dailyRuns;caps.set(s.owner,cap);}
  if(await usedToday(db,s.owner)>=cap){await set(`Skipped: daily limit of ${cap} scheduled runs reached`);skipped++;continue;}
  const stopped=async(why:string)=>{await set(`Paused: ${why}`,',active=0');paused++;if(s.notify)await deliverNotice(db,s.owner,s.notify,'',`A schedule was paused: ${why}`);};
  try{await checkTarget(db,s.owner,s.agent_id,s.skill);}catch(e){await stopped((e as Error).message);continue;}
  const mode=s.mode==='sample'||!aiReady()?'sample':'live';
  try{
   const r=await performRun(db,s.owner,{id:crypto.randomUUID(),agentId:s.agent_id,prompt:s.prompt,skill:s.skill as SkillId,mode},{id:s.id,cost:scheduledRunCost(cfg.runCost,s.skill,mode)});
   await set('Complete',',last_run=?,last_run_id=?,runs=runs+1',r.created,r.id);ran++;
   if(s.notify)await deliverRun(db,s.owner,s.notify,r);
  }catch(e){
   const st=e instanceof HttpError?e.status:500;
   if(st===402||st===404||st===400||st===403)await stopped((e as Error).message);
   else{await set('Failed, credits returned. Tries again at the next slot.',',last_run=?',new Date().toISOString());skipped++;}
  }
 }
 return {ran,skipped,paused,due:due.results.length};
}
