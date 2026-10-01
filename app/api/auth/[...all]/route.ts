/* Better Auth endpoints (wallet only): SIWE nonce/verify, get-session, sign-out. */
import {createAuth,AuthError} from '@/lib/auth';
async function handle(request:Request){
 try{return await createAuth(request).handler(request);}
 catch(e){if(e instanceof AuthError)return Response.json({error:e.message},{status:e.status});console.error('auth handler failed',e);return Response.json({error:'Sign-in failed. Try again.'},{status:500});}
}
export const GET=handle;export const POST=handle;
