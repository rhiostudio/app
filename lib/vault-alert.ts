/* Reward vault alerts for the team (drizzle/0037; called by the scheduler tick; lib/vault-alert-rule.ts holds the rule).
   Where holder rewards run, the server looks at the vault every few minutes: what it holds, what it owes, what an
   hour costs. When that changes how the vault stands (running low, almost empty, periods waiting, fine again) it
   sends one message to every delivery channel that asked for it. Only accounts of the team can ask (the wallets in
   CREATOR_ADMINS, lib/creators.ts); a channel is a Discord channel or Telegram chat that account connected itself
   (lib/notify.ts). Everything in the message is public on the rewards page already; nothing here moves funds or
   changes a period. REWARD_ALERT_HOURS (default 12) is where "low" starts. */
import {env} from 'cloudflare:workers';
import {rewardConfig} from './chain';
import {rewardsOverview} from './rewards';
import {sendNote} from './notify';
import {safeMessage} from './server';
import {message,shouldTell,stand,type VaultLevel,type VaultRead} from './vault-alert-rule';

const KEY='vault:alert';
export function alertHours(){const raw=(env as unknown as {REWARD_ALERT_HOURS?:string}).REWARD_ALERT_HOURS;const v=Number(raw);return typeof raw==='string'&&raw.trim()!==''&&Number.isFinite(v)?Math.min(Math.max(Math.round(v),4),240):12;}
/** Alerts can be switched on here: rewards run with a vault. */
export const alertsAvailable=()=>{const rc=rewardConfig();return !!(rc.live&&rc.token&&rc.contract);};

/** The vault as the rule needs it; null when rewards do not run here or the vault cannot be read right now. */
export async function readVault(db:D1Database,now=new Date()):Promise<VaultRead|null>{
 if(!alertsAvailable())return null;
 const o=await rewardsOverview(db,null);if(!o.live||!o.vault||!o.totals||!o.token)return null;
 const built=(o.periods as {end?:number;status?:string}[]).reduce((a,p)=>Math.max(a,Number(p.end)||0),0);
 return {balance:BigInt(o.vault.balance),owed:BigInt(o.vault.owed),hourly:BigInt(o.totals.hourlyTokens),decimals:o.token.decimals,symbol:o.token.symbol,
  lastClose:Number((o as {lastClose?:number}).lastClose)||0,lastBuilt:built,now:Math.floor(now.getTime()/1000)};
}

/** Looks at the vault and tells the subscribed channels when its standing changed. Never throws. */
export async function vaultAlerts(db:D1Database,now=new Date()):Promise<{level:VaultLevel|null;sent:number}>{
 try{
  const v=await readVault(db,now);if(!v)return {level:null,sent:0};
  const s=stand(v,alertHours());
  // nobody asked for alerts: nothing is recorded as told, so the first channel that asks hears how the vault stands
  const to=(await db.prepare('SELECT id,owner FROM notify_channels WHERE vault_alert=1 AND dead=0').all<{id:string;owner:string}>()).results;
  if(!to.length)return {level:s.level,sent:0};
  const raw=(await db.prepare('SELECT value FROM notify_state WHERE key=?').bind(KEY).first<{value:string}>())?.value;
  let last:{level:VaultLevel;at:number}|null=null;try{last=raw?JSON.parse(raw):null;}catch{last=null;}
  if(!shouldTell(s.level,last,now.getTime()))return {level:s.level,sent:0};
  // what was told is written first, and only by the ticker whose write goes through: two tickers never both send
  const next=JSON.stringify({level:s.level,at:now.getTime()});
  const took=raw===undefined
   ?await db.prepare('INSERT OR IGNORE INTO notify_state (key,value) VALUES (?,?)').bind(KEY,next).run()
   :await db.prepare('UPDATE notify_state SET value=? WHERE key=? AND value=?').bind(next,KEY,raw).run();
  if(!took.meta.changes)return {level:s.level,sent:0};
  const m=message(v,s,last?.level??null);let sent=0;
  for(const c of to){const r=await sendNote(db,c.owner,c.id,m.head,m.body,'rewards');if(r.ok)sent++;}
  return {level:s.level,sent};
 }catch(e){console.error('RHIO vault alert failed:',safeMessage((e as Error)?.message||e));return {level:null,sent:0};}
}
