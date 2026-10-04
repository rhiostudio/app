/* Referrals: an account has an invite link (/r/<code>). Someone who signs in through it is recorded as invited by
   that account, and when the invited account has completed its first run, both get FREE credits, once (drizzle/0022).
   Free credits are the kind an account starts with: they pay for runs, are spent before bought credits, and are never
   part of claimable earnings and cannot be withdrawn (lib/economy.ts). So an invitation can only ever be used to run
   agents here.
   Rules that keep it honest:
   - an account can be invited only before it has any run, only once, and not by itself;
   - the reward waits for a COMPLETED run of the invited account: an account that never uses the Studio pays nothing;
   - an inviter is rewarded for at most REFERRAL_MAX invitations; further invited accounts still get their own bonus;
   - the reward row's primary key (the invited account) fails a second payment, so it is paid exactly once.
   What is not prevented: one person making several wallets. The reward is free credits with the limits above, and the
   studio's daily pool for free AI caps what they can cost.
   Env (server only): REFERRALS_ENABLED (default true), REFERRAL_CREDITS (free credits for each side, default 10,
   0 to 100; 0 = invitations are recorded but nothing is paid), REFERRAL_MAX (rewarded invitations per account, default 20). */
import {env} from 'cloudflare:workers';
import {HttpError} from './server';
import {ensureWallet,ledgerRow} from './economy';

type Env={REFERRALS_ENABLED?:string;REFERRAL_CREDITS?:string;REFERRAL_MAX?:string};
const E=()=>env as unknown as Env;
const int=(v:string|undefined,d:number,min:number,max:number)=>{const n=Number(v);return v!==undefined&&v!==''&&Number.isFinite(n)?Math.min(Math.max(Math.round(n),min),max):d;};
export function referralConfig(){return {enabled:E().REFERRALS_ENABLED!=='false',credits:int(E().REFERRAL_CREDITS,10,0,100),max:int(E().REFERRAL_MAX,20,0,1000)};}

/** Codes avoid letters and digits that read alike (0/O, 1/I/L). */
const ALPHABET='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const REFERRAL_CODE=/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/;
const newCode=()=>[...crypto.getRandomValues(new Uint8Array(8))].map(b=>ALPHABET[b%ALPHABET.length]).join('');

/** The account's invite code, made on first use. */
export async function codeOf(db:D1Database,owner:string){
 const known=await db.prepare('SELECT code FROM referral_codes WHERE owner=?').bind(owner).first<{code:string}>();if(known)return known.code;
 for(let i=0;i<5;i++){
  const code=newCode();
  const r=await db.prepare('INSERT OR IGNORE INTO referral_codes (owner,code,created) VALUES (?,?,?)').bind(owner,code,new Date().toISOString()).run();
  if(r.meta.changes)return code;
  const raced=await db.prepare('SELECT code FROM referral_codes WHERE owner=?').bind(owner).first<{code:string}>();if(raced)return raced.code;
 }
 throw new HttpError(500,'Could not make an invite code. Try again.');
}
/** Is this a code somebody has? (The invite page asks; it learns nothing about the account behind it.) */
export async function codeExists(db:D1Database,code:string){
 return REFERRAL_CODE.test(code)&&!!await db.prepare('SELECT 1 AS x FROM referral_codes WHERE code=?').bind(code).first();
}

/** Records that this account was invited by the owner of `code`. Only before the account's first run, only once. */
export async function attachReferral(db:D1Database,owner:string,code:string){
 const cfg=referralConfig();if(!cfg.enabled)throw new HttpError(503,'Invitations are switched off on this server.');
 if(!REFERRAL_CODE.test(code))throw new HttpError(400,'That invite code is not valid.');
 const ref=await db.prepare('SELECT owner FROM referral_codes WHERE code=?').bind(code).first<{owner:string}>();
 if(!ref)throw new HttpError(404,'That invite code does not exist.');
 if(ref.owner===owner)throw new HttpError(400,'You cannot invite yourself.');
 if(await db.prepare('SELECT 1 AS x FROM referrals WHERE referee=?').bind(owner).first())throw new HttpError(409,'This account was already invited.');
 if(await db.prepare('SELECT 1 AS x FROM runs WHERE owner=? LIMIT 1').bind(owner).first())throw new HttpError(409,'An invite only counts for a new account, before its first run.');
 // the "no run yet" check is repeated inside the insert, so a run started in between cannot slip past it
 const r=await db.prepare('INSERT OR IGNORE INTO referrals (referee,referrer,created) SELECT ?,?,? WHERE NOT EXISTS (SELECT 1 FROM runs WHERE owner=?)').bind(owner,ref.owner,new Date().toISOString(),owner).run();
 if(!r.meta.changes)throw new HttpError(409,'This account was already invited, or has already run a task.');
 return {attached:true,credits:cfg.credits};
}

/** Pays the reward of this account's invitation once it has completed a run. Safe to call often: it does nothing
    until then and nothing afterwards. Never throws (it runs while the workspace loads). */
export async function settleReferral(db:D1Database,referee:string){
 try{
  const cfg=referralConfig();if(!cfg.enabled)return null;
  const row=await db.prepare('SELECT r.referrer FROM referrals r WHERE r.referee=? AND NOT EXISTS (SELECT 1 FROM referral_rewards w WHERE w.referee=r.referee)').bind(referee).first<{referrer:string}>();
  if(!row)return null;
  if(!await db.prepare("SELECT 1 AS x FROM runs WHERE owner=? AND status='complete' LIMIT 1").bind(referee).first())return null;
  const paid=(await db.prepare('SELECT COUNT(*) AS n FROM referral_rewards WHERE referrer=? AND referrer_credits>0').bind(row.referrer).first<{n:number}>())?.n??0;
  const forReferrer=paid<cfg.max?cfg.credits:0,forReferee=cfg.credits;const now=new Date().toISOString();
  await ensureWallet(db,referee);if(forReferrer>0)await ensureWallet(db,row.referrer);
  // the reward row comes first: its primary key fails the whole batch when the reward was already paid
  const batch=[db.prepare('INSERT INTO referral_rewards (referee,referrer,referrer_credits,referee_credits,created) VALUES (?,?,?,?,?)').bind(referee,row.referrer,forReferrer,forReferee,now)];
  if(forReferee>0)batch.push(db.prepare('UPDATE preview_wallets SET balance=balance+? WHERE owner=?').bind(forReferee,referee),ledgerRow(db,referee,forReferee,'referral','Invited by a friend · welcome bonus',referee,now));
  if(forReferrer>0)batch.push(db.prepare('UPDATE preview_wallets SET balance=balance+? WHERE owner=?').bind(forReferrer,row.referrer),ledgerRow(db,row.referrer,forReferrer,'referral','A friend you invited ran their first task',referee,now));
  await db.batch(batch);
  return {referrer:forReferrer,referee:forReferee};
 }catch{return null;}
}

/** The invite card of an account: its code, what an invitation pays, and how its invitations are doing. */
export async function referralView(db:D1Database,owner:string){
 const cfg=referralConfig();if(!cfg.enabled)return {enabled:false as const};
 const [code,invited,rewards,mine]=await Promise.all([codeOf(db,owner),
  db.prepare('SELECT COUNT(*) AS n FROM referrals WHERE referrer=?').bind(owner).first<{n:number}>(),
  db.prepare('SELECT COUNT(*) AS n,COALESCE(SUM(referrer_credits),0) AS c FROM referral_rewards WHERE referrer=?').bind(owner).first<{n:number;c:number}>(),
  db.prepare('SELECT (SELECT 1 FROM referral_rewards w WHERE w.referee=r.referee) AS paid FROM referrals r WHERE r.referee=?').bind(owner).first<{paid:number|null}>()]);
 return {enabled:true as const,code,credits:cfg.credits,max:cfg.max,invited:invited?.n??0,active:rewards?.n??0,earned:rewards?.c??0,
  /** this account's own invitation: null (not invited), 'waiting' (bonus after the first run) or 'paid' */
  invitedBy:mine?(mine.paid?'paid' as const:'waiting' as const):null};
}
