/* Referrals (lib/referrals.ts). GET ?code= is public: whether an invite code exists and what an invitation gives
   (nothing about the account behind it). GET without a code needs a session: the account's own invite card.
   POST {code} records that the signed-in account was invited (only before its first run, only once). */
import {env} from 'cloudflare:workers';
import {context,failure,body,HttpError} from '@/lib/server';
import {attachReferral,codeExists,referralConfig,referralView} from '@/lib/referrals';

export async function GET(request:Request){try{
 const code=new URL(request.url).searchParams.get('code');
 if(code!==null){
  const db=(env as unknown as {DB?:D1Database}).DB;if(!db)throw new HttpError(503,'Storage is unavailable.');
  const cfg=referralConfig();
  return Response.json({enabled:cfg.enabled,valid:cfg.enabled&&await codeExists(db,code),credits:cfg.credits},{headers:{'Cache-Control':'no-store'}});
 }
 const {db,owner}=await context(request);
 return Response.json(await referralView(db,owner),{headers:{'Cache-Control':'no-store'}});
}catch(e){return failure(e)}}

export async function POST(request:Request){try{
 const {db,owner}=await context(request,true);const {code}=await body(request) as {code?:string};
 return Response.json(await attachReferral(db,owner,String(code||'').trim().toUpperCase()));
}catch(e){return failure(e)}}
