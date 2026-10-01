'use client';
/* "CA" pill with a copy button (ZATS pattern). Reads lib/token.ts: until a real contract exists it
   says "Not deployed yet" and the copy button is disabled, so nothing fake can be copied. */
import {useState} from 'react';
import {toast} from 'sonner';
import {Tooltip,TooltipContent,TooltipProvider,TooltipTrigger} from '@/components/ui/tooltip';
import {copyText} from '@/app/ui';
import {RHIO_CONTRACT,shortAddress} from '@/lib/token';
import {cn} from '@/lib/utils';

export function ContractPill({className}:{className?:string}){
 const [done,setDone]=useState(false);const c=RHIO_CONTRACT;
 const copy=()=>{if(!c)return;copyText(c.address,m=>{toast.success(m);setDone(true);setTimeout(()=>setDone(false),1600);},toast.error);};
 const pill=<div className={cn('inline-flex h-11 max-w-full items-center gap-3 rounded-lg bg-secondary py-1 pr-1 pl-4 font-mono text-[12.5px]',className)}>
  <span className="font-semibold tracking-[.06em] text-muted-foreground">CA</span>
  <span className={cn('min-w-0 flex-1 truncate tracking-[.02em]',c?'text-foreground':'text-muted-foreground')} title={c?.address}>{c?shortAddress(c.address):'Not deployed yet'}</span>
  <button type="button" onClick={copy} disabled={!c} aria-label={c?'Copy contract address':'No contract to copy yet'}
   className="h-9 shrink-0 rounded-lg bg-foreground px-4 text-[11.5px] font-semibold tracking-[.08em] text-background uppercase transition-colors duration-300 hover:bg-foreground/85 disabled:cursor-not-allowed disabled:bg-foreground/25">{done?'Copied':'Copy'}</button>
 </div>;
 if(c)return pill;
 return <TooltipProvider delayDuration={150}><Tooltip><TooltipTrigger asChild><span className={cn('inline-flex max-w-full',className?.includes('w-full')&&'w-full sm:w-auto')} tabIndex={0}>{pill}</span></TooltipTrigger><TooltipContent side="bottom" className="max-w-[240px] text-center">No RHIO contract exists yet. Any address shared as “RHIO” today is not ours.</TooltipContent></Tooltip></TooltipProvider>;
}
