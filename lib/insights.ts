/* Insights for a creator (GET /api/insights; page /dashboard/insights, components/app/insights.tsx): what one of the
   account's own agents did in the last seven days, read from what is already stored.
   - Other people: how many different accounts got an answer, how many answers (chat and tasks), how many runs failed,
     the credits the creator earned from them, and their helpful / not helpful marks. Each with the seven days before.
   - Paid by the creator: answers on their own site (lib/embed.ts) and in their Telegram chats (lib/notify.ts), which
     are the creator's own runs, and the credits those cost.
   - Sources: of the answers that could read the agent's sources (runs.kb, drizzle/0036), how many used one and how
     many were not covered (the AI used none, or nothing matched).
   - The questions that were not covered, as text: ONLY from runs that are the creator's own (their site, their
     Telegram chats, their own messages). What other accounts asked on the agent's page stays theirs: the creator gets
     the count, never the text. Chat pages tell people their messages are kept in their own History, and nothing here
     may make that untrue.
   Nothing is stored for this page. Only the account that owns the agent can read it. */
import type {Agent} from './agents';

export const INSIGHT_DAYS=7,INSIGHT_SERIES=14;
const DAY=86400e3;
type Count={people:number;answers:number;chats:number;failed:number;covered:number;uncovered:number};
export type Insights={agents:{id:string;name:string;skin:string;published:boolean}[];agent:{id:string;name:string;skin:string;published:boolean}|null;days:number;
 /** answers to other accounts in the last seven days, and the same for the seven days before */
 now:(Count&{earned:number;up:number;down:number})|null;before:{people:number;answers:number;earned:number}|null;
 /** answers the creator paid for: on their site, in their Telegram chats; and what they cost */
 own:{site:number;telegram:number;spent:number;covered:number;uncovered:number}|null;
 /** one entry per UTC day, oldest first: answers to others, answers paid by the creator */
 series:{day:string;others:number;own:number}[];
 sources:number;
 /** questions the sources did not cover, from the creator's own runs only */
 gaps:{asked:string;at:string;where:'site'|'telegram'|'you';kind:'unused'|'nomatch'}[]};

type Row={id:string;name:string;config:string;published:number};
const n=(v:unknown)=>Number(v||0);

export async function insights(db:D1Database,owner:string,want?:string|null,at=new Date()):Promise<Insights>{
 const rows=(await db.prepare('SELECT id,name,config,published FROM agents WHERE owner=? AND archived=0 ORDER BY updated DESC LIMIT 50').bind(owner).all<Row>()).results;
 const skinOf=(r:Row)=>{try{return (JSON.parse(r.config) as Agent).skin||'atlas';}catch{return 'atlas';}};
 const face=(r:Row)=>({id:r.id,name:r.name,skin:skinOf(r),published:!!r.published});
 const agents=rows.map(face);const row=rows.find(r=>r.id===String(want||'').toLowerCase())||rows[0]||null;
 if(!row)return {agents,agent:null,days:INSIGHT_DAYS,now:null,before:null,own:null,series:[],sources:0,gaps:[]};
 const to=at.toISOString(),from=new Date(at.getTime()-INSIGHT_DAYS*DAY).toISOString(),earlier=new Date(at.getTime()-2*INSIGHT_DAYS*DAY).toISOString();
 const first=new Date(Date.UTC(at.getUTCFullYear(),at.getUTCMonth(),at.getUTCDate())-(INSIGHT_SERIES-1)*DAY);
 const others=(a:string,b:string)=>db.prepare(`SELECT COUNT(DISTINCT CASE WHEN status='complete' THEN owner END) AS people,SUM(CASE WHEN status='complete' THEN 1 ELSE 0 END) AS answers,
   SUM(CASE WHEN status='complete' AND talk IS NOT NULL THEN 1 ELSE 0 END) AS chats,SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS failed,
   SUM(CASE WHEN status='complete' AND kb=1 THEN 1 ELSE 0 END) AS covered,SUM(CASE WHEN status='complete' AND kb IN (2,3) THEN 1 ELSE 0 END) AS uncovered
   FROM runs WHERE agent_id=? AND owner!=? AND created>=? AND created<?`).bind(row.id,owner,a,b).first<Count>();
 const earned=(a:string,b:string)=>db.prepare("SELECT COALESCE(SUM(l.delta),0) AS v FROM credit_ledger l JOIN runs r ON r.id=l.ref WHERE l.owner=? AND l.kind='earning' AND r.agent_id=? AND l.created>=? AND l.created<?").bind(owner,row.id,a,b).first<{v:number}>();
 // the creator's own runs that came from their site or their Telegram chats are named so in the ledger (lib/runs.ts)
 const PLACE="(SELECT l.note FROM credit_ledger l WHERE l.ref=r.id AND l.owner=r.owner AND l.kind='run' LIMIT 1)";
 const [cur,prev,gain,gainBefore,marks,mine,series,sources,gaps]=await Promise.all([
  others(from,to),others(earlier,from),earned(from,to),earned(earlier,from),
  db.prepare('SELECT SUM(CASE WHEN value=1 THEN 1 ELSE 0 END) AS up,SUM(CASE WHEN value=-1 THEN 1 ELSE 0 END) AS down FROM run_ratings WHERE agent_id=? AND owner!=? AND created>=? AND created<?').bind(row.id,owner,from,to).first<{up:number;down:number}>(),
  db.prepare(`SELECT SUM(CASE WHEN note LIKE 'Chat on your site%' OR note LIKE 'Guest chat on its page%' THEN 1 ELSE 0 END) AS site,SUM(CASE WHEN note LIKE 'Telegram chat%' THEN 1 ELSE 0 END) AS telegram,
    SUM(CASE WHEN note LIKE 'Chat on your site%' OR note LIKE 'Guest chat on its page%' OR note LIKE 'Telegram chat%' THEN cost ELSE 0 END) AS spent,
    SUM(CASE WHEN kb=1 THEN 1 ELSE 0 END) AS covered,SUM(CASE WHEN kb IN (2,3) THEN 1 ELSE 0 END) AS uncovered
    FROM (SELECT r.cost,r.kb,${PLACE} AS note FROM runs r WHERE r.agent_id=? AND r.owner=? AND r.status='complete' AND r.created>=? AND r.created<?)`).bind(row.id,owner,from,to).first<{site:number;telegram:number;spent:number;covered:number;uncovered:number}>(),
  db.prepare("SELECT substr(created,1,10) AS day,SUM(CASE WHEN owner!=?1 THEN 1 ELSE 0 END) AS others,SUM(CASE WHEN owner=?1 THEN 1 ELSE 0 END) AS own FROM runs WHERE agent_id=?2 AND status='complete' AND created>=?3 GROUP BY day").bind(owner,row.id,first.toISOString()).all<{day:string;others:number;own:number}>(),
  db.prepare('SELECT COUNT(*) AS n FROM knowledge_sources WHERE agent_id=?').bind(row.id).first<{n:number}>(),
  db.prepare(`SELECT r.prompt,r.created,r.kb,${PLACE} AS note FROM runs r WHERE r.agent_id=? AND r.owner=? AND r.status='complete' AND r.kb IN (2,3) AND r.talk IS NOT NULL AND LENGTH(r.prompt)>=12 AND r.created>=? ORDER BY r.created DESC LIMIT 20`).bind(row.id,owner,earlier).all<{prompt:string;created:string;kb:number;note:string|null}>(),
 ]);
 const byDay=new Map(series.results.map(s=>[s.day,s]));
 const days=Array.from({length:INSIGHT_SERIES},(_,i)=>{const day=new Date(first.getTime()+i*DAY).toISOString().slice(0,10);const s=byDay.get(day);return {day,others:n(s?.others),own:n(s?.own)};});
 const clip=(t:string)=>{const s=t.replace(/\s+/g,' ').trim();return s.length>200?`${s.slice(0,200)}…`:s;};
 return {agents,agent:face(row),days:INSIGHT_DAYS,
  now:{people:n(cur?.people),answers:n(cur?.answers),chats:n(cur?.chats),failed:n(cur?.failed),covered:n(cur?.covered),uncovered:n(cur?.uncovered),earned:n(gain?.v),up:n(marks?.up),down:n(marks?.down)},
  before:{people:n(prev?.people),answers:n(prev?.answers),earned:n(gainBefore?.v)},
  own:{site:n(mine?.site),telegram:n(mine?.telegram),spent:n(mine?.spent),covered:n(mine?.covered),uncovered:n(mine?.uncovered)},
  series:days,sources:n(sources?.n),
  gaps:gaps.results.map(g=>({asked:clip(g.prompt),at:g.created,where:(g.note||'').startsWith('Chat on your site')||(g.note||'').startsWith('Guest chat on its page')?'site' as const:(g.note||'').startsWith('Telegram chat')?'telegram' as const:'you' as const,kind:g.kb===3?'nomatch' as const:'unused' as const}))};
}
