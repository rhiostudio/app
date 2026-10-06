/* The opening writer (lib/opening.ts). GET is public: whether drafts can be made here and what one costs.
   POST {id, agentId} drafts the greeting and three questions to start from for the creator's OWN saved agent, from
   what is saved on it (name, tagline, instructions, notes): a normal paid live run (lib/runs.ts performRun in draft
   mode). It returns the draft; it changes nothing on the agent. */
import {z} from 'zod';
import {context,failure,body,HttpError} from '@/lib/server';
import {performRun} from '@/lib/runs';
import {openingBrief,openingInfo,parseOpening,OPENING_MIN,OPENING_SKILL} from '@/lib/opening';
import type {Agent} from '@/lib/agents';
import {chatReads} from '@/lib/chat-tools';

const schema=z.object({id:z.string().uuid(),agentId:z.string().uuid()});
const noStore={headers:{'Cache-Control':'no-store'}};

export async function GET(){try{return Response.json(openingInfo(),noStore);}catch(e){return failure(e)}}

export async function POST(request:Request){try{
 const {db,owner}=await context(request,true);const parsed=schema.safeParse(await body(request));
 if(!parsed.success)throw new HttpError(400,'Save the agent first, then try again.');
 const {id,agentId}=parsed.data;
 const row=await db.prepare('SELECT config,archived FROM agents WHERE id=? AND owner=?').bind(agentId.toLowerCase(),owner).first<{config:string;archived:number}>();
 if(!row||row.archived)throw new HttpError(404,'Save this agent first.');
 const agent=JSON.parse(row.config) as Agent;
 if(String(agent.personality||'').trim().length<OPENING_MIN)throw new HttpError(400,`Write at least ${OPENING_MIN} characters of instructions first: the opening is written from them.`);
 const run=await performRun(db,owner,{id,agentId:agentId.toLowerCase(),prompt:openingBrief(agent,chatReads(agent.skills||[])),skill:OPENING_SKILL,mode:'live',voice:true});
 const balance=(await db.prepare('SELECT balance FROM preview_wallets WHERE owner=?').bind(owner).first<{balance:number}>())?.balance??0;
 return Response.json({id:run.id,...parseOpening(run.output),cost:run.cost,balance},noStore);
}catch(e){return failure(e)}}
