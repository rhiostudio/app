/* Shared answers: the owner of a run can put its answer on a public page, /s/<id> (drizzle/0020), to post it or send
   it to someone. Opt-in per run, and the owner can take it down again at any time.
   What the page shows: the agent's name and character, the skill, the answer, the date and, when the owner allows it,
   the first part of the task. What it never shows: who the owner is, the agent's instructions, credits.
   What cannot be shared: a run that did not complete, and an answer grounded with Google Search (Google's terms: only
   shown with its Search Suggestions, to the user who asked).
   The page is user content on this site: it is marked noindex, the task is plain text, and the answer goes through the
   same renderer as in the Studio (only http(s) links become links). */
import {HttpError} from './server';
import {splitSearchWidget} from './grounding';
import {skillCatalog} from './agents';

export const SHARE_ID=/^[A-Za-z0-9_-]{16}$/;
const MAX_SHARES=100,TASK_CHARS=400;
const newId=()=>btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(12)))).replace(/\+/g,'-').replace(/\//g,'_');

export type SharedRun={id:string;agentName:string;skin:string;look:unknown;appearance:unknown;motion:string|null;
 /** set when the agent is published: the page links to it */agentId:string|null;
 skill:string;skillName:string;sample:boolean;text:string;task:string|null;created:string};

/** Makes the run public (or changes whether its task is shown). Returns the public id. */
export async function shareRun(db:D1Database,owner:string,runId:string,showTask:boolean){
 const run=await db.prepare('SELECT id,status,output FROM runs WHERE id=? AND owner=?').bind(runId,owner).first<{id:string;status:string;output:string}>();
 if(!run)throw new HttpError(404,'Run not found.');
 if(run.status!=='complete'||!run.output)throw new HttpError(400,'Only a completed run can be shared.');
 if(splitSearchWidget(run.output).widget)throw new HttpError(400,'An answer that used Google Search can only be shown in the Studio, to the account that asked.');
 const known=await db.prepare('SELECT id FROM run_shares WHERE run_id=?').bind(runId).first<{id:string}>();
 if(known){await db.prepare('UPDATE run_shares SET show_task=? WHERE id=? AND owner=?').bind(showTask?1:0,known.id,owner).run();return known.id;}
 const id=newId();
 // the count check runs inside the insert, so parallel requests cannot pass the limit
 const r=await db.prepare('INSERT OR IGNORE INTO run_shares (id,run_id,owner,show_task,created) SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM run_shares WHERE owner=?)<?')
  .bind(id,runId,owner,showTask?1:0,new Date().toISOString(),owner,MAX_SHARES).run();
 if(r.meta.changes)return id;
 const raced=await db.prepare('SELECT id FROM run_shares WHERE run_id=?').bind(runId).first<{id:string}>();if(raced)return raced.id;
 throw new HttpError(409,`You can keep up to ${MAX_SHARES} shared answers. Stop sharing one first.`);
}
export async function unshareRun(db:D1Database,owner:string,runId:string){
 const r=await db.prepare('DELETE FROM run_shares WHERE run_id=? AND owner=?').bind(runId,owner).run();
 if(!r.meta.changes)throw new HttpError(404,'This answer is not shared.');
}
/** The owner's shared runs, by run id (the Studio shows which answers are public). */
export async function sharesOf(db:D1Database,owner:string){
 const rows=await db.prepare('SELECT id,run_id,show_task FROM run_shares WHERE owner=?').bind(owner).all<{id:string;run_id:string;show_task:number}>();
 return Object.fromEntries(rows.results.map(r=>[r.run_id,{id:r.id,task:!!r.show_task}]));
}

/** A shared answer as the public sees it; null when the id is unknown or the run can no longer be shown. */
export async function sharedRun(db:D1Database,id:string):Promise<SharedRun|null>{
 if(!SHARE_ID.test(id))return null;
 const r=await db.prepare(`SELECT s.id,s.show_task,r.agent_name,r.prompt,r.output,r.mode,r.status,r.skill,r.created,a.id AS agent_id,a.config,a.published,a.archived
  FROM run_shares s JOIN runs r ON r.id=s.run_id AND r.owner=s.owner LEFT JOIN agents a ON a.id=r.agent_id WHERE s.id=?`).bind(id)
  .first<{id:string;show_task:number;agent_name:string;prompt:string;output:string;mode:string;status:string;skill:string|null;created:string;agent_id:string|null;config:string|null;published:number|null;archived:number|null}>();
 if(!r||r.status!=='complete')return null;
 const {text,widget}=splitSearchWidget(r.output);if(widget||!text.trim())return null;
 let c:{skin?:string;look?:unknown;appearance?:unknown;motion?:string}={};try{c=r.config?JSON.parse(r.config):{};}catch{c={};}
 const task=r.show_task?(r.prompt.length>TASK_CHARS?r.prompt.slice(0,TASK_CHARS).trimEnd()+'…':r.prompt):null;
 const skill=r.skill||'';
 return {id:r.id,agentName:r.agent_name,skin:c.skin||'atlas',look:c.look??null,appearance:c.appearance??null,motion:c.motion||null,
  agentId:r.agent_id&&r.published&&!r.archived?r.agent_id:null,skill,skillName:skillCatalog.find(s=>s.id===skill)?.name||skill,
  sample:r.mode==='sample',text,task,created:r.created};
}

/** The answer as one plain line for a link preview: markdown marks, tables and links removed. */
export function excerpt(text:string,max:number){
 const s=text.replace(/```[\s\S]*?```/g,' ').split('\n').filter(l=>!/^\s*\|?\s*:?-{3,}/.test(l)&&!/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(l))
  .map(l=>l.replace(/^\s{0,3}#{1,6}\s+/,'').replace(/^\s*[-*]\s+/,'').replace(/^\s*\d+\.\s+/,'').replace(/\|/g,' '))
  .join(' ').replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,'$1').replace(/[*_`]/g,'').replace(/\s+/g,' ').trim();
 return s.length>max?s.slice(0,max-1).trimEnd()+'…':s;
}
