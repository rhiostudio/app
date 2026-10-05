/* A chat with an agent on its creator's own site (lib/embed.ts).
   GET ?id=<embed>&site=<origin the page is shown on>   public: the agent's public face for the chat page
   GET                                                  the signed-in account's own embeds and the limits
   POST {action:'say', id, site, thread, rid, message}  public: one message of a visitor (paid by the embed's owner)
   POST {action:'create', agentId, origin, daily}       makes an embed for one of the account's own agents
   POST {action:'update', id, origin?, daily?, active?} changes it
   DELETE {id}                                          removes it
   The public calls need no session. `say` must come from this site's own page (Origin), like every write here. */
import {env} from 'cloudflare:workers';
import {context,failure,body,HttpError,appOrigin} from '@/lib/server';
import {createEmbed,embedInfo,embedLimits,embedSay,listEmbeds,removeEmbed,updateEmbed} from '@/lib/embed';

const noStore={headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}};
/** The signed-in account when there is one (the creator previewing their own chat); never required here. */
async function who(request:Request){
 try{const c=await context(request);return {db:c.db,owner:c.owner as string|null};}
 catch(e){if(!(e instanceof HttpError)||e.status!==401)throw e;const db=(env as unknown as {DB?:D1Database}).DB;if(!db)throw new HttpError(503,'Storage is unavailable.');return {db,owner:null};}
}

export async function GET(request:Request){try{
 const {db,owner}=await who(request);const p=new URL(request.url).searchParams;const id=p.get('id');
 if(id===null){if(!owner)throw new HttpError(401,'Sign in to put a chat on your site.');return Response.json({embeds:await listEmbeds(db,owner),limits:embedLimits()},noStore);}
 return Response.json({embed:await embedInfo(db,id,p.get('site'),owner)},noStore);
}catch(e){return failure(e)}}

export async function POST(request:Request){try{
 const data=await body(request) as {action?:unknown;id?:unknown;site?:unknown;thread?:unknown;rid?:unknown;message?:unknown;agentId?:unknown;origin?:unknown;daily?:unknown;active?:unknown};
 if(data?.action==='say'){
  if(request.headers.get('origin')!==appOrigin(request))throw new HttpError(403,'Please use the chat itself to send a message.');
  const {db,owner}=await who(request);
  return Response.json(await embedSay(db,request,data,owner),noStore);
 }
 const {db,owner}=await context(request,true);
 if(data?.action==='update')await updateEmbed(db,owner,data.id,data);
 else if(data?.action==='create'){const id=await createEmbed(db,owner,data);return Response.json({id,embeds:await listEmbeds(db,owner),limits:embedLimits()},noStore);}
 else throw new HttpError(400,'Check the request and try again.');
 return Response.json({embeds:await listEmbeds(db,owner),limits:embedLimits()},noStore);
}catch(e){return failure(e)}}

export async function DELETE(request:Request){try{
 const {db,owner}=await context(request,true);const data=await body(request) as {id?:unknown};
 await removeEmbed(db,owner,data?.id);return Response.json({embeds:await listEmbeds(db,owner),limits:embedLimits()},noStore);
}catch(e){return failure(e)}}
