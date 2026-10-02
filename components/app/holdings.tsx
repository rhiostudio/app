'use client';
/* Holdings & allocation: the signed-in user's RHIO position and what it unlocks. Reads /api/chain (tier table)
   and /api/tier (balance across linked wallets, share of supply, monthly allotment). Until the RHIO token exists
   everything is shown as a clearly labelled preview with zero values: nothing here is live without the token.
   Once it exists, a visitor whose wallets are not read (signed out, still loading, chain unreachable) is told that,
   never that the token is not live. */
import {useEffect,useState} from 'react';
import {formatUnits} from 'viem';
import {Button} from '@/components/ui/button';
import {api,I} from '@/app/ui';
import {cn} from '@/lib/utils';
import {ToneIcon} from '@/components/rhio/navbar';
import {useRhioToken} from '@/components/rhio/token-context';
import {StatusBadge} from './parts';

type TierRow={id:string;name:string;min:string;feePermille:number;credits:number;slots:number};
type Chain={tiersLive:boolean;tierBase:number;tiers:TierRow[];name:string;rewards?:{rhioPerUnit:string;usdPerUnitHour:string;token:{symbol:string}|null}};
type Tier={live:boolean;wallets:string[];period:string;balance?:string;supply?:string|null;shareBps?:number|null;tier:string;next?:{id:string;name:string;min:string}|null;allotment:{credits:number;claimed:boolean;claimedCredits:number}|null};

const whole=(raw?:string|null)=>raw?Number(formatUnits(BigInt(raw),18)):0;
const fmt=(n:number,d=0)=>n.toLocaleString('en-US',{maximumFractionDigits:d});
/* tier ladder on a log scale so 10k, 100k and 1M are evenly spaced */
const pos=(n:number,max:number)=>n<=0?0:Math.min(100,Math.max(4,Math.log10(n)/Math.log10(max)*100));

export function HoldingsCard({auth,onWallet,compact}:{auth:boolean;onWallet:()=>void;compact?:boolean}){
 const [chain,setChain]=useState<Chain|null>(null);const [tier,setTier]=useState<Tier|null>(null);const [err,setErr]=useState('');
 useEffect(()=>{let alive=true;
  api('/api/chain').then(c=>alive&&setChain(c)).catch(()=>{});
  if(auth)api('/api/tier').then(t=>alive&&setTier(t)).catch(e=>alive&&setErr(e.message||'Could not read your holdings.'));
  return()=>{alive=false};},[auth]);
 const live=!!(chain?.tiersLive&&tier?.live);
 // does the token exist on this server: the layout's answer until /api/chain has loaded, then the API's (a testnet token counts there)
 const token=useRhioToken();const tokenLive=chain?chain.tiersLive:!!token;
 const tiers=chain?.tiers||[];const max=Math.max(1,...tiers.map(t=>Number(t.min)))*3;
 const bal=whole(tier?.balance);const cur=tiers.find(t=>t.id===(tier?.tier||'free'))||tiers[0];
 const next=tier?.next?tiers.find(t=>t.id===tier.next!.id):tiers[1];
 const toNext=next?Math.max(0,Number(next.min)-bal):0;
 const share=tier?.shareBps!=null?tier.shareBps/100:null;
 const pct=(n:number)=>`${fmt(n,n<0.01?4:2)}%`;
 // fixed-rate NVDA rewards: complete blocks of rhioPerUnit RHIO x USD per unit per hour (integer units, exact)
 const perUnit=BigInt(chain?.rewards?.rhioPerUnit||'3000000');const rate=Number(chain?.rewards?.usdPerUnitHour||'0.01');
 const units=tier?.balance?BigInt(tier.balance)/(perUnit*10n**18n):0n;const rsym=chain?.rewards?.token?.symbol||'NVDA';
 const tiles:{label:string;value:string;hint:string;icon:string;tone:'lime'|'iris'|'coral'|'sky'}[]=[
  {label:'Monthly credits',value:live&&cur?`${cur.credits} CR`:'—',hint:!tokenLive?'Starts with the token':!live?'From your RHIO balance':tier?.allotment?.claimed?`Claimed for ${tier.period}`:cur?.credits?`Claimable for ${tier?.period}`:'None on Free',icon:'coins',tone:'lime'},
  {label:'Platform fee',value:live&&cur?(cur.feePermille<1000?`−${Math.round((1000-cur.feePermille)/10)}%`:'Standard'):'—',hint:live?'On your sales':'Holder discount',icon:'store',tone:'iris'},
  {label:'Share of supply',value:live&&share!=null?pct(share):'—',hint:live?`${fmt(bal)} of ${fmt(whole(tier?.supply))} RHIO`:'Of all RHIO',icon:'users',tone:'sky'},
  {label:`${rsym} reward`,value:live?`$${fmt(Number(units)*rate,2)}/h`:'—',hint:live?(units>0n?`${units} × ${fmt(Number(perUnit))} RHIO`:`Hold ${fmt(Number(perUnit))} RHIO to earn`):`$${rate} per ${fmt(Number(perUnit))} RHIO per hour`,icon:'hype',tone:'coral'},
 ];
 return <section className="grid gap-4 overflow-hidden rounded-xl border bg-card p-5">
  <div className="flex flex-wrap items-start justify-between gap-3">
   <div className="flex items-center gap-3"><ToneIcon icon="hype" tone="lime"/><div className="grid"><b className="text-[15px] font-semibold">Holdings &amp; allocation</b><span className="text-xs text-muted-foreground">RHIO across your linked wallets on {chain?.name||'Robinhood Chain'}</span></div></div>
   <StatusBadge kind={live?'live':tokenLive?'pending':'archived'}>{live?'Live':!tokenLive?'Token not live':!auth?'Connect a wallet':err?'Balance not read':'Reading wallets'}</StatusBadge>
  </div>

  <div className={cn('grid gap-5',!compact&&'lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]')}>
   {/* balance + ladder */}
   <div className="grid content-start gap-4 rounded-lg border bg-t-lime p-4">
    <div className="flex items-end justify-between gap-3">
     <div className="grid gap-1"><span className="font-mono text-[10px] tracking-[.1em] text-muted-foreground uppercase">Your RHIO</span>
      <b className="font-display text-[34px] leading-none font-medium tracking-[-.04em] tabular-nums">{live?fmt(bal,2):'0'}</b></div>
     <div className="grid justify-items-end gap-1 text-right"><span className="font-mono text-[10px] tracking-[.1em] text-muted-foreground uppercase">Tier</span><b className="rounded-md bg-foreground px-2 py-0.5 font-mono text-[12px] text-background">{cur?.name||'Free'}</b></div>
    </div>
    <div className="grid gap-2">
     <div className="relative h-2.5 rounded-full bg-background/80">
      <div className="absolute inset-y-0 left-0 rounded-full bg-foreground transition-[width] duration-700" style={{width:`${live?pos(bal,max):0}%`}}/>
      {tiers.slice(1).map(t=><span key={t.id} className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-lime" style={{left:`${pos(Number(t.min),max)}%`}} title={`${t.name}: ${fmt(Number(t.min))} RHIO`}/>)}
     </div>
     <div className="relative h-4 font-mono text-[9.5px] text-muted-foreground uppercase">{tiers.slice(1).map(t=><span key={t.id} className="absolute -translate-x-1/2 whitespace-nowrap" style={{left:`${pos(Number(t.min),max)}%`}}>{t.name}</span>)}</div>
    </div>
    <p className="text-[12.5px] text-muted-foreground">{!auth?'Connect a wallet to see your position.':err?err:!tokenLive?'Tiers start when the RHIO token exists. Link the wallets you will hold it in now, and they are counted automatically.':!live?'Reading the RHIO balance of your linked wallets.':next?`${fmt(toNext)} RHIO more for ${next.name}.`:'Top tier reached.'}</p>
   </div>
   {/* allocation tiles */}
   <div className="grid grid-cols-2 gap-2.5">
    {tiles.map(({label,value,hint,icon,tone})=><div key={label} className="grid content-between gap-3 rounded-lg border p-3">
     <div className="flex items-center justify-between gap-2"><span className="font-mono text-[9.5px] tracking-[.08em] text-muted-foreground uppercase">{label}</span><ToneIcon icon={icon} tone={tone} className="size-7 rounded-md [&_svg]:size-3.5"/></div>
     <div className="grid gap-0.5"><b className="font-display text-xl leading-none font-medium tabular-nums">{value}</b><span className="text-[11.5px] text-muted-foreground">{hint}</span></div>
    </div>)}
   </div>
  </div>
  <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
   <span className="text-xs text-muted-foreground">Estimates only. Rewards need the token, a legal review and an audited contract.</span>
   <Button size="sm" variant="outline" onClick={onWallet}><I id="wallet"/>{auth?'Manage wallets':'Connect wallet'}</Button>
  </div>
 </section>;
}
