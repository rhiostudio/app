/* Reward vault alerts, the rule alone (no server imports: lib/vault-alert.ts reads the vault and sends; the test
   imports this file). From what the vault holds, what it owes and what an hour of rewards costs, it says how the
   vault stands and what, if anything, the team should be told.
     ok        more than `lowHours` of rewards are covered
     low       fewer than `lowHours` hours are covered
     critical  fewer than CRITICAL_HOURS hours are covered
     waiting   an hour has closed and could not be built because the vault cannot cover it (full-or-wait,
               lib/rewards.ts): holders lose nothing, the hours are settled after a refill
   A message goes out when the level changes (worse, better, or back to ok), and again every REMIND_HOURS while periods
   wait. "Hours covered" divides the free balance by the hourly need at the current price and holders; the referral
   boost can make the real need a little higher, so the texts say "about". */

export const CRITICAL_HOURS=3,REMIND_HOURS=6,GRACE_SECONDS=20*60;
export type VaultLevel='ok'|'low'|'critical'|'waiting';
export type VaultRead={/** smallest units of the reward token */balance:bigint;owed:bigint;hourly:bigint;decimals:number;symbol:string;
 /** end of the last hour that closed, end of the last period that was built (0: none), now; seconds */lastClose:number;lastBuilt:number;now:number};
export type VaultStand={level:VaultLevel;free:bigint;/** hours of rewards the free balance covers; null when nothing is being earned */hours:number|null};

export function stand(v:VaultRead,lowHours:number):VaultStand{
 const free=v.balance>v.owed?v.balance-v.owed:0n;
 if(v.hourly<=0n)return {level:'ok',free,hours:null};
 const hours=Number(free*100n/v.hourly)/100;
 const waiting=v.lastBuilt<v.lastClose&&v.now>v.lastClose+GRACE_SECONDS&&free<v.hourly;
 return {level:waiting?'waiting':hours<CRITICAL_HOURS?'critical':hours<lowHours?'low':'ok',free,hours};
}

const RANK:Record<VaultLevel,number>={ok:0,low:1,critical:2,waiting:3};
/** Whether to send now: the level changed, or periods are still waiting and the last message is REMIND_HOURS old. */
export function shouldTell(level:VaultLevel,last:{level:VaultLevel;at:number}|null,nowMs:number){
 if(!last)return level!=='ok';
 if(level!==last.level)return true;
 return level==='waiting'&&nowMs-last.at>=REMIND_HOURS*3600e3;
}
export const worse=(a:VaultLevel,b:VaultLevel)=>RANK[a]>RANK[b];

/** A raw amount as a short number: at most four decimals, never "0" for something that is not nothing. */
export function short(raw:bigint,decimals:number){
 const unit=10n**BigInt(decimals);const whole=raw/unit;const frac=((raw%unit)*10000n/unit).toString().padStart(4,'0').replace(/0+$/,'');
 if(raw>0n&&whole===0n&&!frac)return '<0.0001';
 return whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g,',')+(frac?'.'+frac:'');
}
const hoursText=(h:number)=>h<1?'less than an hour':h<1.5?'about an hour':h<48?`about ${Math.round(h)} hours`:`about ${Math.round(h/24)} days`;
const utc=(ts:number)=>new Date(ts*1000).toISOString().slice(11,16)+' UTC';

/** The message for a level: a headline and a body. `was` is the level told before (for "fine again"). */
export function message(v:VaultRead,s:VaultStand,was:VaultLevel|null):{head:string;body:string}{
 const have=`${short(s.free,v.decimals)} ${v.symbol} free (${short(v.balance,v.decimals)} in the vault, ${short(v.owed,v.decimals)} owed to holders)`;
 const need=`An hour of rewards needs about ${short(v.hourly,v.decimals)} ${v.symbol}.`;
 if(s.level==='waiting')return {head:'Reward vault · periods are waiting',body:[`The hour to ${utc(v.lastClose)} could not be built: the vault cannot cover it.`,`${have}. ${need}`,'Holders lose nothing: the waiting hours are settled as soon as the vault is refilled.'].join('\n')};
 if(s.level==='critical'||s.level==='low')return {head:`Reward vault · ${s.level==='critical'?'almost empty':'running low'}`,body:[`${s.hours===null?'':`${hoursText(s.hours)[0].toUpperCase()}${hoursText(s.hours).slice(1)} of rewards left. `}${have}.`,need,'When it cannot cover an hour, periods wait until it is refilled.'].join('\n')};
 return {head:'Reward vault · fine again',body:[`${was==='waiting'?'Periods are being built again. ':''}${s.hours===null?'Nothing is being earned right now.':`${hoursText(s.hours)[0].toUpperCase()}${hoursText(s.hours).slice(1)} of rewards covered.`}`,`${have}.`].join('\n')};
}
