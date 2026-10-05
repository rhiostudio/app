/* The daily reward report: the holder reward program in a handful of numbers, for the public page /report, its link
   preview and a post that is ready to copy. Everything comes from what the server already knows (lib/rewards.ts): the
   settled periods, the vault and the recorder. Nothing is estimated and nothing is promised. The figures and the
   wording are made in lib/report-text.ts.
   Day 1 is the day of the first settled period (UTC days counted from its start). null when the program is not
   running on this server, or before its first period was settled. */
import {env} from 'cloudflare:workers';
import {rewardsOverview} from './rewards';
import {buildReport,type Report} from './report-text';
export type {Report};

export async function dailyReport(db:D1Database,now=new Date()):Promise<Report|null>{
 const o=await rewardsOverview(db,null);
 if(!o.live||!o.token||!o.vault||!o.totals||!o.price)return null;
 // every settled period of this vault (a period that was only built, or discarded, is not settled)
 const rows=(await db.prepare("SELECT start_ts,distributed FROM reward_periods WHERE status IN ('published','superseded') AND (contract IS NULL OR lower(contract)=lower(?)) ORDER BY start_ts").bind(o.contract||'').all<{start_ts:number;distributed:string}>()).results;
 if(!rows.length)return null;
 const origin=((env as unknown as {APP_ORIGIN?:string}).APP_ORIGIN||'').replace(/^https?:\/\//,'').replace(/[/]+$/,'');
 return buildReport({earned:rows.reduce((a,r)=>a+BigInt(r.distributed),0n),balance:BigInt(o.vault.balance),owed:BigInt(o.vault.owed),hourly:BigInt(o.totals.hourlyTokens),
  decimals:o.token.decimals,symbol:o.token.symbol,price:Number(o.price.usd),periods:rows.length,periodHours:o.periodHours,
  earners:o.recorder?.earners??0,holders:o.recorder?.holders??0,since:rows[0].start_ts,now:Math.floor(now.getTime()/1000),
  perUnit:Number(o.rhioPerUnit),rate:o.usdPerUnitHour,refills:o.fundings.length,origin,vaultStatus:o.vault.status});
}
