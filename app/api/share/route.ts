/* Shared answers (lib/share.ts). GET ?id= is public: the answer of one run its owner made public (/s/<id>).
   POST {runId, showTask, turns?} makes a run of the signed-in account public (a chat message with up to five earlier turns), or changes whether its task is shown;
   POST {runId, pin: true|false} pins one of the account's own chat answers of its own agent to that agent's public page
   (at most three per agent; it is shared when it was not), or unpins it. GET ?agent=<id> (signed in): which of the
   account's runs of that agent are pinned.
   DELETE {runId} takes it down. */
import {z} from 'zod';
import {env} from 'cloudflare:workers';
import {context,failure,body,HttpError} from '@/lib/server';
import {pinRun,pinnedRuns,shareRun,sharedRun,unshareRun,PIN_MAX,SHARE_TURNS} from '@/lib/share';

// turns: for a chat message, how many earlier turns of its conversation the page shows
const post=z.object({runId:z.string().uuid(),showTask:z.boolean().default(true),turns:z.number().int().min(0).max(SHARE_TURNS).default(0),pin:z.boolean().optional()});
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request:Request){try{
 const agent=new URL(request.url).searchParams.get('agent');
 if(agent!==null){const {db,owner}=await context(request);return Response.json({pinned:UUID.test(agent)?await pinnedRuns(db,owner,agent.toLowerCase()):[],max:PIN_MAX},{headers:{'Cache-Control':'no-store'}});}
 const db=(env as unknown as {DB?:D1Database}).DB;if(!db)throw new HttpError(503,'Storage is unavailable.');
 const shared=await sharedRun(db,new URL(request.url).searchParams.get('id')||'');
 if(!shared)throw new HttpError(404,'This answer is not shared (anymore).');
 // short cache: an owner who stops sharing sees the page gone within a minute
 return Response.json({shared},{headers:{'Cache-Control':'public, max-age=30','X-Robots-Tag':'noindex'}});
}catch(e){return failure(e)}}

export async function POST(request:Request){try{
 const {db,owner}=await context(request,true);const p=post.safeParse(await body(request));if(!p.success)throw new HttpError(400,'Choose the run to share.');
 if(p.data.pin!==undefined)return Response.json({id:await pinRun(db,owner,p.data.runId,p.data.pin),pinned:p.data.pin});
 return Response.json({id:await shareRun(db,owner,p.data.runId,p.data.showTask,p.data.turns),task:p.data.showTask});
}catch(e){return failure(e)}}

export async function DELETE(request:Request){try{
 const {db,owner}=await context(request,true);const {runId}=await body(request) as {runId?:string};
 await unshareRun(db,owner,String(runId||''));return Response.json({removed:true});
}catch(e){return failure(e)}}
