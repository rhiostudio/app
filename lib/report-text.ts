/* The daily reward report, the part without server imports (lib/report.ts reads the numbers; the page, the picture
   and the test use this file): the figures as text, and a post that is ready to copy.
   Words matter here: holders CLAIM their reward from the vault themselves, so an amount is "earned" (allocated to
   holders and claimable), never "sent" or "paid"; an hour that was settled is a "period", not a "payout"; what was
   claimed is the difference between everything allocated and what the vault still owes.
   The post states what happened and the rule, and says the vault is not audited. It never tells anyone to buy or
   hold, and never names a return: the dollar figures are today's value of amounts that already exist. */

export type ReportInput={/** smallest units of the reward token */earned:bigint;balance:bigint;owed:bigint;hourly:bigint;decimals:number;symbol:string;
 /** USD price of one reward token */price:number;periods:number;periodHours:number;earners:number;holders:number;
 /** start of the first settled period and now, seconds */since:number;now:number;
 /** whole RHIO per unit, and the USD rate per unit and hour as text */perUnit:number;rate:string;refills:number;origin:string;vaultStatus:'funded'|'low'|'short'};
export type Report={day:number;since:number;symbol:string;price:string;
 earned:string;earnedUsd:string;claimed:string|null;claimedUsd:string|null;periods:number;earners:number;holders:number;
 vault:string;vaultUsd:string;free:string;freeUsd:string;/** hours of rewards the free balance covers; null when nothing is being earned */hoursLeft:number|null;
 /** the free balance cannot cover the next period */waiting:boolean;vaultStatus:'funded'|'low'|'short';
 rate:string;unit:string;periodHours:number;refills:number;tweet:string;link:string};

/** A raw amount with a fixed number of decimals, thousands separated. */
export function fix(raw:bigint,dec:number,digits:number){
 const neg=raw<0n;const v=neg?-raw:raw;const scale=10n**BigInt(dec),cut=10n**BigInt(Math.max(dec-digits,0));
 const rounded=(v+cut/2n)/cut*cut;const whole=rounded/scale;const frac=((rounded%scale)/cut).toString().padStart(digits,'0');
 return `${neg?'-':''}${whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g,',')}${digits?`.${frac}`:''}`;
}
export const money=(n:number)=>n>=100?`$${Math.round(n).toLocaleString('en-US')}`:`$${n.toLocaleString('en-US',{maximumFractionDigits:n>=10?0:2})}`;
/** 1500000 → "1.5M", 250000 → "250K". */
export const shortUnit=(n:number)=>n>=1e6?`${(n/1e6).toLocaleString('en-US',{maximumFractionDigits:2})}M`:n>=1e3?`${(n/1e3).toLocaleString('en-US',{maximumFractionDigits:1})}K`:String(n);
/** What a post on X may hold, and how long this one counts there: a link counts as 23 characters whatever its length. */
export const POST_MAX=280;
export const postLength=(text:string,link:string)=>[...text].length-[...link].length+23;
/** "about 3 days" / "about 17 hours"; '' when there is nothing to say. */
export const leftText=(hours:number|null)=>hours===null?'':hours>=72?`about ${Math.round(hours/24)} days`:`about ${Math.max(1,Math.round(hours))} hours`;

export function buildReport(i:ReportInput):Report{
 // an amount too small to show with three decimals is not reported as claimed
 const raw=i.earned>i.owed?i.earned-i.owed:0n;const claimed=raw*1000n>=5n*10n**BigInt(Math.max(i.decimals-1,0))?raw:0n;const free=i.balance>i.owed?i.balance-i.owed:0n;
 const hoursLeft=i.hourly>0n?Number(free*10n/i.hourly)/10:null;const waiting=i.hourly>0n&&free<i.hourly;
 const tokens=(raw:bigint)=>Number(raw)/10**i.decimals;const usd=(raw:bigint)=>money(tokens(raw)*i.price);
 // UTC days counted from the start of the first settled period: day 1 is the day it started
 // (never below 1: a clock that runs behind the chain's must not print "day 0")
 const day=Math.max(1,Math.floor((i.now-i.since)/86400)+1);
 const unit=shortUnit(i.perUnit),every=i.periodHours===1?'hour':`${i.periodHours} hours`;
 const link=`${i.origin||'rhio.studio'}/report/${day}`;
 const vaultLine=waiting?(free>0n?`Vault: ${fix(free,i.decimals,3)} $${i.symbol} left, waiting for a refill.`:'Vault: waiting for a refill.')
  :`Vault: ${fix(free,i.decimals,3)} $${i.symbol} left${hoursLeft===null?'':`, ${leftText(hoursLeft)}`}.`;
 // the post has to fit a post on X (280, a link counts as 23): with very large numbers the line about claims goes
 // first, then the dollar value; the rule and "Not audited" always stay
 const write=(withClaimed:boolean,withUsd:boolean)=>[`Day ${day} of $RHIO holder rewards.`,'',
  `${fix(i.earned,i.decimals,3)} $${i.symbol}${withUsd?` (~${usd(i.earned)})`:''} earned by holders so far.`,
  ...(withClaimed&&claimed>0n?[`${fix(claimed,i.decimals,3)} $${i.symbol} claimed.`]:[]),
  `${i.periods.toLocaleString('en-US')} ${i.periodHours===1?'hourly ':''}periods. ${i.earners.toLocaleString('en-US')} wallets earning.`,'',
  vaultLine,'',`$${i.rate} of ${i.symbol} per ${every} per ${unit} RHIO held. Not audited.`,'',link].join('\n');
 const tweet=[write(true,true),write(false,true),write(false,false)].find(t=>postLength(t,link)<=POST_MAX)??write(false,false);
 return {day,since:i.since,symbol:i.symbol,price:money(i.price),
  earned:fix(i.earned,i.decimals,3),earnedUsd:usd(i.earned),claimed:claimed>0n?fix(claimed,i.decimals,3):null,claimedUsd:claimed>0n?usd(claimed):null,
  periods:i.periods,earners:i.earners,holders:i.holders,
  vault:fix(i.balance,i.decimals,3),vaultUsd:usd(i.balance),free:fix(free,i.decimals,3),freeUsd:usd(free),hoursLeft,waiting,vaultStatus:i.vaultStatus,
  rate:`$${i.rate} per ${unit} RHIO, every ${every}`,unit,periodHours:i.periodHours,refills:i.refills,tweet,link};
}
