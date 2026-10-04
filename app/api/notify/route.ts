/* The owner's delivery channels (lib/notify.ts): where schedules send finished runs. GET lists channels and what this
   server supports; POST connects Discord (webhook address), starts a Telegram link or sends a test; DELETE removes a
   channel. A webhook address or chat id is never sent back to the browser, only the channel's label. */
import {z} from 'zod';
import {context,failure,body,HttpError} from '@/lib/server';
import {addDiscord,channelsOf,notifyConfig,pendingTelegram,pollTelegram,removeChannel,startTelegram,testChannel} from '@/lib/notify';

const post=z.discriminatedUnion('action',[
 z.object({action:z.literal('discord'),url:z.string().trim().min(20).max(400)}),
 z.object({action:z.literal('telegram')}),
 z.object({action:z.literal('test'),id:z.string().uuid()}),
]);

async function view(db:D1Database,owner:string){
 let pending=await pendingTelegram(db,owner).catch(()=>null);
 // while the owner waits for their chat to appear, the page asks every few seconds: read the bot's messages now
 if(pending){await pollTelegram(db).catch(()=>null);pending=await pendingTelegram(db,owner).catch(()=>null);}
 return {config:notifyConfig(),channels:await channelsOf(db,owner),pending};
}

export async function GET(request:Request){try{const {db,owner}=await context(request);return Response.json(await view(db,owner),{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e)}}

export async function POST(request:Request){try{
 const {db,owner}=await context(request,true);const p=post.safeParse(await body(request));if(!p.success)throw new HttpError(400,'Check the request and try again.');const d=p.data;
 if(d.action==='discord'){const id=await addDiscord(db,owner,d.url);return Response.json({id,...await view(db,owner)});}
 if(d.action==='telegram'){await startTelegram(db,owner);return Response.json(await view(db,owner));}
 await testChannel(db,owner,d.id);return Response.json({sent:true,...await view(db,owner)});
}catch(e){return failure(e)}}

export async function DELETE(request:Request){try{
 const {db,owner}=await context(request,true);const {id}=await body(request) as {id?:string};
 await removeChannel(db,owner,String(id||''));return Response.json(await view(db,owner));
}catch(e){return failure(e)}}
