/* The launch guide (lib/launch.ts). GET ?agent=<id>: the steps from a saved character to a published agent people
   talk to, and which of them are done for that agent of the signed-in account (the most recently changed one when
   none is named). Signed out, it returns the steps with none done. It only reads. */
import {env} from 'cloudflare:workers';
import {context,failure,HttpError} from '@/lib/server';
import {launch,launchPreview} from '@/lib/launch';

export async function GET(request:Request){try{
 let db:D1Database|undefined,owner:string|undefined;
 try{const c=await context(request);db=c.db;owner=c.owner;}catch(e){if(!(e instanceof HttpError)||e.status!==401)throw e;db=(env as unknown as {DB?:D1Database}).DB;}
 const headers={'Cache-Control':'no-store'};
 if(!db||!owner)return Response.json({signedIn:false,...launchPreview()},{headers});
 return Response.json({signedIn:true,...await launch(db,owner,new URL(request.url).searchParams.get('agent'))},{headers});
}catch(e){return failure(e)}}
