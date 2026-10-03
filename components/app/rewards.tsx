'use client';
/* Holder rewards dashboard (/dashboard/rewards). Data from /api/rewards (lib/rewards.ts).
   Fixed rate: every complete block of REWARD_RHIO_PER_UNIT (1,500,000) RHIO held earns $0.01 of NVDA per hour, counted per second from the
   wallet's Transfer history (holder recorder), converted to NVDA at the live Chainlink price when each hourly period is
   built, and paid from an on-chain vault (a RhioClaims instance) that the holder claims from with their own wallet.
   While the program is off (no RHIO token yet) the page shows the rule, a calculator and what is built. */
import {useCallback,useEffect,useState,type ReactNode} from 'react';
import {toast} from 'sonner';
import {formatUnits} from 'viem';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '@/components/ui/table';
import {api,I} from '@/app/ui';
import {cn} from '@/lib/utils';
import {ToneIcon} from '@/components/rhio/navbar';
import {useRhioToken} from '@/components/rhio/token-context';
import {discoverWallets,type WalletInfo} from '@/lib/auth-client';
import {claimOnchain,fetchChain,type ChainInfo} from '@/lib/chain-client';
import {DashPage,Kpi,KpiRow,PageHeader,StatusBadge} from './parts';

type Token={address:string;symbol:string;decimals:number};
type Overview={signedIn:boolean;live:boolean;rhio:string|null;token:Token|null;contract:string|null;explorer:string;excluded:number;
 rhioPerUnit:string;usdPerUnitHour:string;periodHours:number;nextClose:number;lastClose:number;
 price:{usd:string;set:string;stale:boolean;source:'chainlink'|'manual'}|null;priceMaxAgeHours:number;
 recorder:{lastBlock:number;lastTs:number;updated:string;holders:number;earners:number}|null;
 totals:{funded:string;allocated:string;allocatedUsd:string;periods:number;units:string;hourlyUsd:string;hourlyTokens:string}|null;
 vault:{balance:string;owed:string;status:'funded'|'low'|'short'}|null;
 fundings:{tx:string;from:string;amount:string;ts:number;note:string|null;period:number|null}[];
 periods:{id:number;label:string;start:number;end:number;usd:string|null;price:string|null;distributed:string;eligible:number;status:string;tx:string|null}[];
 mine:null|{wallets:{address:string;balance:string;units:string;usdPerHour:string;since:number|null;excluded:boolean;accruedUsd:string;accruedTokens:string}[];
  allocations:{period:number;label:string;end:number;address:string;amount:string;usd:string|null;units:number|null;balance:string}[];
  claims:{address:string;cumulative:string;proof:string[];claimed:string|null}[];period:number|null;attested:boolean;country:string|null;accruedSince:number|null;accruedUntil:number|null}};

const short=(a:string)=>`${a.slice(0,6)}…${a.slice(-4)}`;
const amount=(raw:string|bigint,dec=18,max=4)=>Number(formatUnits(BigInt(raw),dec)).toLocaleString('en-US',{maximumFractionDigits:max});
const num=(v:string)=>{const n=Number(String(v).replace(/[, _]/g,''));return Number.isFinite(n)&&n>=0?n:0;};
const fmt=(n:number,d=2)=>n.toLocaleString('en-US',{maximumFractionDigits:d});
const usd=(v:string|number|null|undefined,d=4)=>`$${fmt(Number(v??0),d)}`;
const when=(ts:number)=>new Date(ts*1000).toLocaleString(undefined,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const day=(ts:number)=>new Date(ts*1000).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
const closeLabel=(ts:number)=>new Date(ts*1000).toLocaleString(undefined,{weekday:'short',hour:'2-digit',minute:'2-digit'});
const walletError=(e:any)=>e?.code===4001?'You cancelled the request in your wallet.':(e?.shortMessage||e?.message||'The wallet request failed.');
const perText=(d:Overview|null)=>Number(d?.rhioPerUnit||1_500_000).toLocaleString('en-US');
/** "every 1,500,000 RHIO = $0.01 of NVDA per hour" from the live settings. */
const ruleText=(d:Overview|null,sym='NVDA')=>`every ${perText(d)} RHIO = $${d?.usdPerUnitHour||'0.01'} of ${sym} per hour`;

export function RewardsPage({wallet,auth,onSignIn,onPaper}:{wallet?:string;auth:boolean;onSignIn:()=>void;onPaper:()=>void}){
 const [data,setData]=useState<Overview|null>(null);const [cfg,setCfg]=useState<ChainInfo|null>(null);const [error,setError]=useState('');
 const [wallets,setWallets]=useState<WalletInfo[]>([]);const [busy,setBusy]=useState('');
 const load=useCallback(async()=>{try{const [d,c]=await Promise.all([api('/api/rewards') as Promise<Overview>,fetchChain().catch(()=>null)]);setData(d);setCfg(c);setError('');}catch(e:any){setError(e.message||'Could not load rewards.');}},[]);
 useEffect(()=>{load();},[load,auth]);
 useEffect(()=>discoverWallets(setWallets),[]);
 const sym=data?.token?.symbol||'NVDA';const dec=data?.token?.decimals??18;
 // token and program state as this server knows them: the layout's answer until /api/rewards has loaded (no flash of
 // "not paying" on a live program), then the API's (a testnet token counts there)
 const token=useRhioToken();const hasToken=data?!!data.rhio:!!token;const live=data?data.live:!!token?.rewardsLive;

 async function claim(c:{address:string;cumulative:string;proof:string[]}){
  if(busy||!cfg||!data?.contract)return;const w=wallets[0];if(!w){toast.error('Open this page in a browser with a wallet to claim.');return;}
  setBusy(c.address);try{const h=await claimOnchain(w.provider,cfg,c,data.contract);toast.success('Claim sent',{description:short(h)});setTimeout(load,4000);}catch(e){toast.error(walletError(e));}finally{setBusy('');}
 }

 return <DashPage>
  <PageHeader icon="coins" tone="lime" title="Holder rewards" text={`Hold RHIO in your wallet: ${ruleText(data,sym)}, counted by the second. Paid in ${sym} at the current price, and you claim it yourself from an on-chain vault.`}
   actions={<><StatusBadge kind={live?'live':'pending'}>{live?'Live':hasToken?'Open · not paying yet':'Open · first payout after token launch'}</StatusBadge><Button variant="outline" onClick={onPaper}><I id="doc"/>How it works</Button></>}/>

  {!live&&<div className="flex flex-wrap items-start gap-3 rounded-xl border bg-t-amber p-4 text-[13.5px]">
   <ToneIcon icon="shield" tone="amber" className="size-8"/>
   <div className="grid flex-1 gap-1"><b className="font-semibold">{hasToken?'NVDA rewards are open, but not paying yet. The first payout comes once the reward vault is switched on.':'NVDA rewards are open. The first payout comes after the RHIO token launches.'}</b><span className="text-muted-foreground">Rewards are paid in NVDA Stock Tokens on Robinhood Chain. They start once {hasToken?'the reward vault is':'the RHIO token and the reward vault are'} live, so there is nothing to claim yet. NVDA Stock Tokens track the share price but are debt securities, not shares. They may not go to US persons or to restricted and sanctioned countries, so each holder confirms their eligibility before claiming.</span></div>
  </div>}

  <Pipeline data={data} live={live} hasToken={hasToken}/>

  {live&&data&&<>
   <KpiRow>
    <Kpi label="Reward rate" value={`$${data.usdPerUnitHour}/h`} hint={`per ${perText(data)} RHIO`} tone="lime" icon="coins"/>
    <Kpi label={`${sym} price`} value={data.price?usd(data.price.usd,2):'—'} hint={!data.price?'Not set yet: rewards wait':data.price.stale?'Market closed or feed paused: rewards wait':`${data.price.source==='chainlink'?'Chainlink live':'Set'} · ${when(Date.parse(data.price.set)/1000)}`} tone={!data.price||data.price.stale?'coral':'iris'} icon="clock"/>
    <Kpi label="Vault" value={data.vault?`${amount(data.vault.balance,dec,4)} ${sym}`:'—'} hint={!data.vault?'Not readable right now':data.vault.status==='short'?'Needs a refill: rewards wait':data.vault.status==='low'?'Low: less than a day left':`Funded · ${amount(data.vault.owed,dec,4)} owed`} tone={data.vault?.status==='funded'?'sky':'amber'} icon="shield"/>
    <Kpi label="Earning now" value={data.recorder?.earners??0} hint={`${usd(data.totals?.hourlyUsd,2)} per hour in total`} tone="amber" icon="users"/>
   </KpiRow>
   <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]">
    <Position data={data} auth={auth} onSignIn={onSignIn}/>
    <ClaimCard data={data} busy={busy} hasWallet={wallets.length>0} onClaim={claim} onAttested={load}/>
   </div>
   <MyAllocations data={data}/>
   <div className="grid items-start gap-4 xl:grid-cols-2">
    <Fundings data={data}/>
    <Periods data={data}/>
   </div>
  </>}

  {!live&&<div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)]">
   <Calculator perUnit={Number(data?.rhioPerUnit||1_500_000)} rate={Number(data?.usdPerUnitHour||0.01)} sym={sym}/>
   <div className="stagger grid gap-3">
    <section className="grid gap-3 rounded-xl border bg-card p-4">
     <b className="text-sm font-semibold">Your wallet</b>
     {wallet?<><div className="flex items-center gap-2 rounded-lg border bg-secondary/50 p-2.5 font-mono text-[12px]"><I id="wallet" className="i size-4"/>{short(wallet)}</div><p className="text-[13px] text-muted-foreground">Signed in with this wallet. Once the program is live, this page shows your RHIO, reward units, hourly rate, what you have accrued and a Claim button.</p></>
      :<><p className="text-[13px] text-muted-foreground">{auth?'Link a wallet on the Wallet page to be counted once the program is live.':'Sign in with a wallet to be ready. Signing is free and sends no transaction.'}</p>{!auth&&<Button variant="outline" onClick={onSignIn}><I id="wallet"/>Sign in with wallet</Button>}</>}
    </section>
    <Rules data={data} sym={sym}/>
   </div>
  </div>}
  {error&&<p className="text-xs text-muted-foreground">{error}</p>}
 </DashPage>;
}

function Rules({data,sym}:{data:Overview|null;sym:string}){
 const per=Number(data?.rhioPerUnit||1_500_000);const rate=data?.usdPerUnitHour||'0.01';
 return <section className="grid gap-2 rounded-xl border bg-t-sky p-4 text-[13px]">
  <b className="font-semibold">Rules in the program</b>
  {[`Every complete ${per.toLocaleString('en-US')} RHIO earns $${rate} per hour: ${(per*2).toLocaleString('en-US')} earns 2×, ${(per*2-1).toLocaleString('en-US')} still earns 1×`,
   'Counted by the second from your wallet\'s transfer history: RHIO earns only while you actually hold it, and never in two wallets at once',
   `Paid in ${sym}: the dollar value is fixed, the ${sym} amount follows the price when each hour is settled`,
   'A new period every hour; its root is posted on-chain automatically, then you can claim',
   'Team, treasury and liquidity wallets never earn',
   'Every refill, root and claim is public on-chain'].map(t=><span key={t} className="flex items-start gap-2 text-muted-foreground"><I id="check" className="i mt-0.5 size-3.5 shrink-0 text-foreground"/>{t}</span>)}
 </section>;
}

/** The four parts of the program and whether each is running. */
function Pipeline({data,live,hasToken}:{data:Overview|null;live:boolean;hasToken:boolean}){
 const rec=data?.recorder;
 const parts:[string,string,string,'lime'|'iris'|'coral'|'sky',ReactNode][]=[
  ['users','Holder recorder','Reads every RHIO transfer: each wallet\'s balance at every second.','sky',rec?`${rec.holders} holders · block ${rec.lastBlock.toLocaleString('en-US')}`:hasToken?'Waiting for first sync':'Waiting for the RHIO token'],
  ['layers','Reward calculator',`Units × $${data?.usdPerUnitHour||'0.01'} × hours held, settled every hour at the current price.`,'iris',`${perText(data)} RHIO = 1 unit · hourly`],
  ['shield','Reward vault','Holds the NVDA and pays claims against a public merkle root. Never owes more than it holds.','coral',data?.contract?<a className="underline underline-offset-2" href={`${data.explorer}/address/${data.contract}`} target="_blank" rel="noreferrer">{short(data.contract)}</a>:'RhioClaims · awaiting audit'],
  ['coins','RHIO dashboard','Your units, accrued reward, history and the claim button, on this page.','lime',live?'Live':hasToken?'Not switched on yet':'Open · waiting for token'],
 ];
 return <section className="grid overflow-hidden rounded-xl border bg-card sm:grid-cols-2 xl:grid-cols-4">
  {parts.map(([ic,t,p,tone,state],k)=><div key={t} className={cn('grid content-start gap-2.5 p-4',k>0&&'border-t sm:border-t-0',k%2===1&&'sm:border-l',k>=2&&'sm:border-t xl:border-t-0',k>0&&'xl:border-l')}>
   <div className="flex items-center justify-between gap-2"><ToneIcon icon={ic} tone={tone}/><span className="font-mono text-[10px] text-muted-foreground">0{k+1}</span></div>
   <b className="text-[14.5px] font-semibold">{t}</b><p className="text-[12.5px] leading-relaxed text-muted-foreground">{p}</p>
   <span className={cn('mt-auto flex items-center gap-1.5 font-mono text-[10.5px] font-semibold tracking-[.04em] uppercase',live?'text-foreground':'text-muted-foreground')}>
    <i className={cn('size-1.5 rounded-full',live?'bg-lime':'bg-amber')}/>Built · {state}</span>
  </div>)}
 </section>;
}

function Position({data,auth,onSignIn}:{data:Overview;auth:boolean;onSignIn:()=>void}){
 const dec=data.token?.decimals??18;const sym=data.token?.symbol||'NVDA';
 return <section className="grid content-start gap-3 rounded-xl border bg-card p-5">
  <div className="flex items-center gap-3"><ToneIcon icon="wallet" tone="sky"/><b className="text-[15px] font-semibold">Your holding</b></div>
  {!auth||!data.mine?<><p className="text-[13px] text-muted-foreground">Sign in with your wallet to see your RHIO, reward units and what you have accrued.</p><Button variant="outline" className="justify-self-start" onClick={onSignIn}><I id="wallet"/>Sign in with wallet</Button></>
   :data.mine.wallets.map(w=>{const units=Number(w.units);const state=w.excluded?'Excluded':units>0?'Earning':'Below minimum';
    return <div key={w.address} className="grid gap-2.5 rounded-lg border p-3">
     <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-[12px]">{short(w.address)}</span><StatusBadge kind={state==='Earning'?'live':'archived'}>{state}</StatusBadge></div>
     <b className="font-display text-xl font-medium tabular-nums">{amount(w.balance,18,2)} <span className="text-sm text-muted-foreground">RHIO</span></b>
     <div className="grid grid-cols-3 overflow-hidden rounded-lg border text-center">
      {([['Units',String(units)],['Rate',`$${w.usdPerHour}/h`],['Accrued',usd(w.accruedUsd)]] as const).map(([l,v],k)=><div key={l} className={cn('grid gap-0.5 p-2.5',k&&'border-l',k===2&&'bg-t-mint')}><span className="font-mono text-[10px] tracking-[.08em] text-muted-foreground uppercase">{l}</span><b className="font-display text-lg font-medium tabular-nums">{v}</b></div>)}
     </div>
     <span className="text-xs text-muted-foreground">{w.excluded?'Team, treasury and liquidity wallets do not earn.':Number(w.accruedUsd)>0||units>0?`≈ ${amount(w.accruedTokens,dec,6)} ${sym} accrued since ${data.mine!.accruedSince?when(data.mine!.accruedSince):'the start'}. It settles at ${closeLabel(data.nextClose)} and becomes claimable once that root is on-chain.`:`Hold ${perText(data)} RHIO to start earning.`}</span>
    </div>;})}
 </section>;
}

const COUNTRIES:[string,string][]=[['ID','Indonesia'],['SG','Singapore'],['MY','Malaysia'],['PH','Philippines'],['TH','Thailand'],['VN','Vietnam'],['IN','India'],['JP','Japan'],['KR','South Korea'],['AU','Australia'],['AE','United Arab Emirates'],['DE','Germany'],['FR','France'],['NL','Netherlands'],['ES','Spain'],['IT','Italy'],['BR','Brazil'],['MX','Mexico'],['NG','Nigeria'],['TR','Turkey'],['US','United States'],['CA','Canada'],['GB','United Kingdom'],['CH','Switzerland'],['RU','Russia'],['UA','Ukraine']];

/** Self-certification before the first claim (NVDA Stock Tokens are restricted securities). */
function Attest({onDone}:{onDone:()=>void}){
 const [country,setCountry]=useState('');const [ok,setOk]=useState(false);const [busy,setBusy]=useState(false);
 async function send(){setBusy(true);try{await api('/api/rewards',{method:'POST',body:JSON.stringify({action:'attest',country,confirm:ok})});toast.success('Thanks. You can claim now.');onDone();}catch(e:any){toast.error(e.message);}finally{setBusy(false);}}
 return <div className="grid gap-2.5 rounded-lg border bg-t-amber p-3 text-[12.5px]">
  <b className="text-[13px] text-foreground">Confirm you can receive NVDA Stock Tokens</b>
  <label className="grid gap-1"><span className="text-muted-foreground">Country of residence</span>
   <select aria-label="Country of residence" value={country} onChange={e=>setCountry(e.target.value)} className="h-9 rounded-md border bg-card px-2 text-[13px]"><option value="">Choose…</option>{COUNTRIES.map(([c,n])=><option key={c} value={c}>{n}</option>)}<option value="XX">Other</option></select></label>
  <label className="flex items-start gap-2"><input type="checkbox" aria-label="I confirm the eligibility statement" checked={ok} onChange={e=>setOk(e.target.checked)} className="mt-0.5 size-4 accent-[var(--lime)]"/>
   <span className="text-muted-foreground">I am not a US person, and I do not live in the US, Canada, the UK, Switzerland or a sanctioned country. I understand Stock Tokens are debt securities, not shares.</span></label>
  <Button size="sm" className="justify-self-start" disabled={!country||!ok||busy} onClick={send}>{busy?'Saving…':'Confirm'}</Button>
 </div>;
}

function ClaimCard({data,busy,hasWallet,onClaim,onAttested}:{data:Overview;busy:string;hasWallet:boolean;onClaim:(c:{address:string;cumulative:string;proof:string[]})=>void;onAttested:()=>void}){
 const dec=data.token?.decimals??18;const sym=data.token?.symbol||'NVDA';const claims=data.mine?.claims||[];const price=Number(data.price?.usd||0);
 return <section className="grid content-start gap-3 rounded-xl border bg-card p-5">
  <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><ToneIcon icon="coins" tone="lime"/><b className="text-[15px] font-semibold">Claim</b></div>{data.mine?.period&&<StatusBadge kind="live">Period {data.mine.period}</StatusBadge>}</div>
  {claims.length>0&&data.mine&&!data.mine.attested&&<Attest onDone={onAttested}/>}
  {!claims.length?<p className="rounded-lg border border-dashed p-3 text-[13px] text-muted-foreground">Nothing to claim yet. What you accrue becomes claimable after each hour is settled and its root is on-chain.</p>
   :claims.map(c=>{const left=BigInt(c.cumulative)-BigInt(c.claimed??'0');const leftTokens=Number(formatUnits(left>0n?left:0n,dec));
    return <div key={c.address} className="grid gap-2 rounded-lg border p-3">
     <div className="flex items-baseline justify-between gap-2"><b className="font-display text-2xl font-medium tabular-nums">{amount(left>0n?left:0n,dec,6)} <span className="text-sm text-muted-foreground">{sym}</span></b><span className="font-mono text-[11px] text-muted-foreground">{short(c.address)}</span></div>
     <span className="text-xs text-muted-foreground">{price>0&&left>0n?`≈ ${usd(leftTokens*price)} at today's price · `:''}Total earned {amount(c.cumulative,dec,6)} · claimed {c.claimed===null?'unknown':amount(c.claimed,dec,6)}</span>
     {/* a period with a single eligible holder has an empty (and valid) proof, so readiness is the statement, not the proof length */}
     <Button disabled={left<=0n||!!busy||!hasWallet||!data.mine?.attested} onClick={()=>onClaim(c)}>{busy===c.address?'Check your wallet…':left>0n?`Claim ${amount(left,dec,6)} ${sym}`:'All claimed'}</Button>
    </div>;})}
  {claims.length>0&&!hasWallet&&<p className="text-xs text-muted-foreground">Open this page in a browser with your wallet (extension or the wallet app's browser) to claim.</p>}
  <p className="text-[11.5px] text-muted-foreground">You send the claim from your own wallet and pay a small gas fee on Robinhood Chain. RHIO never holds your key.</p>
 </section>;
}

function MyAllocations({data}:{data:Overview}){
 const rows=data.mine?.allocations||[];if(!data.mine)return null;const dec=data.token?.decimals??18;
 return <section className="grid gap-3">
  <h2 className="font-display text-xl font-medium tracking-[-.02em]">Your settled hours</h2>
  {!rows.length?<p className="rounded-xl border border-dashed p-4 text-[13px] text-muted-foreground">Nothing settled yet. Hold {perText(data)} RHIO; each hour that closes adds your share here.</p>
   :<div className="overflow-x-auto rounded-xl border"><Table><TableHeader><TableRow><TableHead>Period</TableHead><TableHead>Ended</TableHead><TableHead>Wallet</TableHead><TableHead className="text-right">Units</TableHead><TableHead className="text-right">USD</TableHead><TableHead className="text-right">{data.token?.symbol||'NVDA'}</TableHead></TableRow></TableHeader>
    <TableBody>{rows.map(r=><TableRow key={r.period+r.address}><TableCell>{r.label}</TableCell><TableCell>{when(r.end)}</TableCell><TableCell className="font-mono text-xs">{short(r.address)}</TableCell><TableCell className="text-right tabular-nums">{r.units??'—'}</TableCell><TableCell className="text-right tabular-nums">{r.usd?usd(r.usd):'—'}</TableCell><TableCell className="text-right font-semibold tabular-nums">{amount(r.amount,dec,6)}</TableCell></TableRow>)}</TableBody></Table></div>}
 </section>;
}

function Fundings({data}:{data:Overview}){
 const dec=data.token?.decimals??18;
 return <section className="grid content-start gap-3">
  <h2 className="font-display text-xl font-medium tracking-[-.02em]">Vault refills</h2>
  {!data.fundings.length?<p className="rounded-xl border border-dashed p-4 text-[13px] text-muted-foreground">No refill recorded yet.</p>
   :<div className="overflow-x-auto rounded-xl border"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Transaction</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
    <TableBody>{data.fundings.map(f=><TableRow key={f.tx+f.ts}><TableCell>{day(f.ts)}</TableCell><TableCell><a className="font-mono text-xs underline underline-offset-2" href={`${data.explorer}/tx/${f.tx}`} target="_blank" rel="noreferrer">{short(f.tx)}</a></TableCell><TableCell className="text-right tabular-nums">{amount(f.amount,dec,4)} {data.token?.symbol}</TableCell></TableRow>)}</TableBody></Table></div>}
 </section>;
}

function Periods({data}:{data:Overview}){
 const dec=data.token?.decimals??18;
 return <section className="grid content-start gap-3">
  <h2 className="font-display text-xl font-medium tracking-[-.02em]">Settled periods</h2>
  {!data.periods.length?<p className="rounded-xl border border-dashed p-4 text-[13px] text-muted-foreground">No periods yet.</p>
   :<div className="overflow-x-auto rounded-xl border"><Table><TableHeader><TableRow><TableHead>Period</TableHead><TableHead className="text-right">USD</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">{data.token?.symbol||'NVDA'}</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
    <TableBody>{data.periods.map(p=><TableRow key={p.id}><TableCell><span className="grid"><span>{p.label}</span><span className="text-[11px] text-muted-foreground">{when(p.start)} – {when(p.end)} · {p.eligible} holders</span></span></TableCell><TableCell className="text-right tabular-nums">{p.usd?usd(p.usd):'—'}</TableCell><TableCell className="text-right tabular-nums">{p.price?usd(p.price,2):'—'}</TableCell><TableCell className="text-right tabular-nums">{amount(p.distributed,dec,6)}</TableCell>
     <TableCell><StatusBadge kind={p.status==='published'?'live':p.status==='built'?'pending':'private'}>{p.status==='superseded'?'included':p.status==='built'?'waiting for root':p.status}</StatusBadge></TableCell></TableRow>)}</TableBody></Table></div>}
 </section>;
}

/** What a holding earns, on made-up inputs (the same rule as the server: complete units only). */
function Calculator({perUnit,rate,sym}:{perUnit:number;rate:number;sym:string}){
 const [hold,setHold]=useState('6000000');const [hours,setHours]=useState('24');const [price,setPrice]=useState('180');
 const units=Math.floor(num(hold)/perUnit);const h=num(hours);const p=num(price);
 const earned=units*rate*h;const tokens=p>0?earned/p:0;
 return <section className="grid gap-4 rounded-xl border bg-card p-5">
  <div className="flex flex-wrap items-center justify-between gap-2"><div className="grid gap-0.5"><b className="text-[15px] font-semibold">What would my RHIO earn?</b><span className="text-xs text-muted-foreground">Made-up inputs. It does not predict prices or returns.</span></div><StatusBadge kind="sample">Sample</StatusBadge></div>
  <div className="grid gap-3 sm:grid-cols-3">
   {([['RHIO held','RHIO',hold,setHold],['Hours held','hours',hours,setHours],[`${sym} price`,'USD',price,setPrice]] as [string,string,string,(v:string)=>void][]).map(([l,u,v,set])=><label key={l} className="grid gap-1.5"><span className="text-[12.5px] font-medium text-muted-foreground">{l}</span><div className="flex items-center gap-2"><Input inputMode="decimal" value={v} onChange={e=>set(e.target.value)} className="h-10 tabular-nums"/><span className="w-10 font-mono text-[11px] text-muted-foreground">{u}</span></div></label>)}
  </div>
  <div className="grid grid-cols-3 overflow-hidden rounded-lg border">
   <div className={cn('grid gap-1 p-3',units>0?'bg-t-mint':'bg-t-coral')}><span className="font-mono text-[10px] tracking-[.08em] text-muted-foreground uppercase">Units</span><b className="font-display text-xl font-medium">{units}</b></div>
   <div className="grid gap-1 border-l p-3"><span className="font-mono text-[10px] tracking-[.08em] text-muted-foreground uppercase">Earned</span><b className="font-display text-xl font-medium tabular-nums">{usd(earned,4)}</b></div>
   <div className="grid gap-1 border-l p-3"><span className="font-mono text-[10px] tracking-[.08em] text-muted-foreground uppercase">≈ {sym}</span><b className="font-display text-xl font-medium tabular-nums">{fmt(tokens,6)}</b></div>
  </div>
  <p className="text-xs text-muted-foreground">{units>0?`${units} × $${rate} × ${fmt(h,2)} h = ${usd(earned,4)}, paid as ${fmt(tokens,6)} ${sym} at $${fmt(p,2)}.`:`Below ${perUnit.toLocaleString('en-US')} RHIO: no complete unit, nothing accrues.`}</p>
 </section>;
}
