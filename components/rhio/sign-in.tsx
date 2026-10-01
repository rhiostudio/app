'use client';
/* Connect-wallet picker (account Modal and /login). Wallet is the only sign-in: any EIP-1193 wallet signs a
   Sign-In with Ethereum message for Robinhood Chain. Compact tile grid instead of a long list:
   - wallets found in the browser (EIP-6963) connect directly and are marked with a dot;
   - well-known wallets that are not installed open their app (phones: in-app dApp browser deep link) or
     their download page (desktop). Robinhood Wallet is always first; it has no public deep link, so on a
     phone its tile shows the three steps and a copy-link button.
   More than eight tiles collapse behind a "+N" tile so the dialog stays short. */
import {useEffect,useMemo,useState} from 'react';
import {toast} from 'sonner';
import {I} from '@/app/ui';
import {cn} from '@/lib/utils';
import {discoverWallets,isMobileBrowser,signInWithWallet,type WalletInfo} from '@/lib/auth-client';

/** `logo`: the wallet's own published icon in public/wallets (vendor sources: public/licenses/wallet-logos.txt).
    `plain`: the icon has no background of its own, so it sits on a white tile. */
type Known={key:string;name:string;match:RegExp;logo:string;plain?:boolean;install:string;open?:(url:string)=>string};
const logo=(k:Known)=>`/wallets/${k.logo}`;
const enc=encodeURIComponent;
/** Links are the wallets' own documented download pages and dApp-browser deep links. */
const KNOWN:Known[]=[
 {key:'robinhood',name:'Robinhood',match:/robinhood/i,logo:'robinhood.png',install:'https://robinhood.com/web3-wallet/'},
 {key:'metamask',name:'MetaMask',match:/metamask|io\.metamask/i,logo:'metamask.svg',install:'https://metamask.io/download/',open:u=>`https://metamask.app.link/dapp/${u.replace(/^https?:\/\//,'')}`},
 {key:'coinbase',name:'Coinbase',match:/coinbase/i,logo:'coinbase.svg',install:'https://www.coinbase.com/wallet/downloads',open:u=>`https://go.cb-w.com/dapp?cb_url=${enc(u)}`},
 {key:'rabby',name:'Rabby',match:/rabby/i,logo:'rabby.png',install:'https://rabby.io/'},
 {key:'okx',name:'OKX',match:/okx|okex/i,logo:'okx.png',install:'https://www.okx.com/web3',open:u=>`okx://wallet/dapp/url?dappUrl=${enc(u)}`},
 {key:'phantom',name:'Phantom',match:/phantom/i,logo:'phantom.svg',install:'https://phantom.com/download',open:u=>`https://phantom.app/ul/browse/${enc(u)}?ref=${enc(new URL(u).origin)}`},
 {key:'trust',name:'Trust',match:/trust/i,logo:'trust.svg',plain:true,install:'https://trustwallet.com/download',open:u=>`https://link.trustwallet.com/open_url?coin_id=60&url=${enc(u)}`},
];
type Tile={id:string;name:string;icon?:string;fallback?:string;plain?:boolean;detected?:WalletInfo;known?:Known;best?:boolean};
const LIMIT=8;

export function SignIn({onWalletDone}:{onWalletDone:()=>void}){
 const [wallets,setWallets]=useState<WalletInfo[]|null>(null);const [busy,setBusy]=useState('');const [mobile,setMobile]=useState(false);
 const [more,setMore]=useState(false);const [help,setHelp]=useState(false);
 useEffect(()=>{setMobile(isMobileBrowser());const stop=discoverWallets(setWallets);const t=setTimeout(()=>setWallets(w=>w??[]),600);return()=>{stop();clearTimeout(t);};},[]);

 const tiles=useMemo(()=>{
  const found=wallets||[];const used=new Set<string>();
  const detected:Tile[]=found.map(w=>{const k=KNOWN.find(x=>x.match.test(w.name)||x.match.test(w.rdns||''));if(k)used.add(k.key);
   return {id:w.id,name:w.name.replace(/\s*wallet$/i,'')||w.name,icon:w.icon||(k&&logo(k)),fallback:k&&logo(k),detected:w,known:k,best:!!w.robinhood||k?.key==='robinhood'};});
  const rest:Tile[]=KNOWN.filter(k=>!used.has(k.key)).map(k=>({id:k.key,name:k.name,icon:logo(k),plain:k.plain,known:k,best:k.key==='robinhood'}));
  // Robinhood first, then installed wallets, then the others
  return [...detected.filter(t=>t.best),...rest.filter(t=>t.best),...detected.filter(t=>!t.best),...rest.filter(t=>!t.best)];
 },[wallets]);
 const shown=more||tiles.length<=LIMIT?tiles:tiles.slice(0,LIMIT-1);const hidden=tiles.length-shown.length;

 async function connect(w:WalletInfo){
  setBusy(w.id);
  try{await signInWithWallet(w.provider);onWalletDone();}
  catch(e:any){toast.error(e?.code===4001?'You cancelled the request in your wallet.':(e?.message||'Wallet sign-in failed.'));}
  finally{setBusy('');}
 }
 function pick(t:Tile){
  if(busy)return;
  if(t.detected){connect(t.detected);return;}
  const k=t.known!;const url=location.href.split('#')[0];
  if(k.key==='robinhood'){setHelp(h=>!h);return;}
  window.open(mobile&&k.open?k.open(url):k.install,'_blank','noopener,noreferrer');
 }
 const copy=()=>navigator.clipboard?.writeText(location.origin).then(()=>toast.success('Link copied. Paste it in the wallet app browser.')).catch(()=>{});
 const rh=tiles.find(t=>t.best);

 return <div className="grid gap-3">
  {wallets===null?<div className="grid grid-cols-4 gap-2">{Array.from({length:4},(_,k)=><div key={k} className="h-[74px] animate-pulse rounded-xl bg-secondary"/>)}</div>
  :<div className="grid grid-cols-4 gap-2 max-[360px]:grid-cols-3" role="list" aria-label="Wallets">
   {shown.map(t=>{const hint=t.detected?'Connect':t.known?.key==='robinhood'?'How to connect':mobile&&t.known?.open?'Open app':'Get';
    return <button key={t.id} role="listitem" onClick={()=>pick(t)} disabled={!!busy&&busy!==t.id} title={`${t.name} · ${hint}`}
     className={cn('group relative grid h-[74px] min-w-0 content-center justify-items-center gap-1.5 rounded-xl border bg-card px-1 transition-[border-color,transform,opacity] duration-200 hover:-translate-y-px hover:border-foreground/30 disabled:opacity-50',
      t.best&&'border-lime/70 bg-lime/[.06]',busy===t.id&&'border-lime')}>
     <WalletLogo src={t.icon} fallback={t.fallback} plain={t.plain&&!t.detected}/>
     <span className="max-w-full truncate text-[11.5px] font-medium">{busy===t.id?'Sign…':t.name}</span>
     {t.detected&&<i className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-lime ring-2 ring-card" aria-label="installed"/>}
     {!t.detected&&<span className="absolute top-1 right-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 [&_svg]:size-3"><I id="arrow"/></span>}
     {busy===t.id&&<span className="absolute inset-x-3 bottom-1.5 h-0.5 overflow-hidden rounded-full bg-secondary"><i className="block h-full w-1/2 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-lime"/></span>}
    </button>;})}
   {hidden>0&&<button onClick={()=>setMore(true)} className="grid h-[74px] content-center justify-items-center gap-1.5 rounded-xl border border-dashed text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground">
    <span className="font-display text-lg font-semibold">+{hidden}</span><span className="text-[11.5px]">More</span></button>}
  </div>}

  {help&&rh&&<div className="grid gap-2 rounded-xl border bg-t-lime p-3 text-[12.5px]">
   <b className="text-foreground">Robinhood Wallet</b>
   <span className="text-muted-foreground">{mobile?'Open the Robinhood Wallet app, go to its browser tab, paste this site and connect.':'Robinhood Wallet is a phone app. Open this site in its browser tab, or use a browser extension here.'}</span>
   <div className="flex flex-wrap gap-2"><button onClick={copy} className="flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1.5 font-medium [&_svg]:size-3.5"><I id="copy"/>Copy site link</button>
    <a href={rh.known?.install||'https://robinhood.com/web3-wallet/'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1.5 font-medium">Get the app</a></div>
  </div>}

  <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><i className="mt-1.5 size-1.5 shrink-0 rounded-full bg-lime"/>
   <span>{wallets?.length?'Dot = installed, connects right away. ':mobile?'No wallet in this browser: tap a wallet to open RHIO in its app. ':'No wallet extension found: pick one to install. '}
   You sign a free message for <b className="text-foreground">Robinhood Chain</b>. No transaction, never your recovery phrase.</span></p>
 </div>;
}

/** Wallet logo: the wallet's own image; if it is missing or fails to load, the known logo, then a neutral wallet glyph. */
function WalletLogo({src,fallback,plain}:{src?:string;fallback?:string;plain?:boolean}){
 const [url,setUrl]=useState(src);useEffect(()=>setUrl(src),[src]);
 if(!url)return <span className="grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground [&_svg]:size-4"><I id="wallet"/></span>;
 return <img src={url} alt="" width={32} height={32} loading="lazy" decoding="async" className={cn('size-8 rounded-lg object-contain',plain&&'bg-white p-1')} onError={()=>setUrl(u=>u!==fallback&&fallback?fallback:undefined)}/>;
}
