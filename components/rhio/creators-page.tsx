'use client';
/* Public page of creator agents (/creators): build an agent in your own voice from posts you wrote, publish it, and
   earn each time someone talks to it. It states what the server does today (lib/voice.ts, lib/talk.ts) and that it
   is opt-in: an agent is only written from posts its creator pasted. Its link preview comes from
   app/creators/page.tsx and /api/og/page/creators. */
import {useEffect,useState} from 'react';
import {toast} from 'sonner';
import {FaXTwitter} from 'react-icons/fa6';
import {api,copyText,I} from '@/app/ui';
import {Button} from '@/components/ui/button';
import {Thumb} from '@/components/landing/mocks';
import type {View} from '@/lib/routes';
import {SiteFooter} from './site-footer';

type Go=(v:View,doc?:string)=>void;
type Info={live:boolean;cost:number;min:number;max:number};
const STEPS:[string,string][]=[
 ['Paste your posts','Ten to thirty posts you wrote. Only pasted text is read: nothing is fetched from your accounts.'],
 ['Get your voice back','The Studio drafts the agent’s instructions in your style: how you talk, what you talk about, what you would never say.'],
 ['Pick a face and publish','Choose a character, dress it, read the draft and fix what is off. Then publish with a price per chat message.'],
 ['People talk to it','Anyone can open your agent’s page and talk to it. Each message pays you your chat price.'],
 ['Get the verified mark','Post a code from your X handle and send the link. A person on the team checks it, and your agents say “@you, verified creator”.'],
];

export function CreatorsPage({onNavigate}:{onNavigate:Go}){
 const [info,setInfo]=useState<Info|null>(null);
 useEffect(()=>{let alive=true;api('/api/voice').then(d=>{if(alive)setInfo(d);}).catch(()=>null);return()=>{alive=false;};},[]);
 const link=typeof location!=='undefined'?location.origin+'/creators':'/creators';
 const post=`https://x.com/intent/post?text=${encodeURIComponent('Creator agents on RHIO: an AI agent in your own voice, written from your posts')}&url=${encodeURIComponent(link)}`;
 return <>
  <section className="mx-auto grid max-w-[1120px] gap-10 px-[clamp(16px,3vw,32px)] pt-10 pb-16">
   <div className="grid gap-3">
    <span className="font-mono text-[11px] tracking-[.1em] text-muted-foreground uppercase">RHIO · Creator agents</span>
    <h1 className="font-display text-[clamp(40px,7vw,84px)] leading-[.96] font-medium tracking-[-.05em]">An agent in your own voice</h1>
    <p className="max-w-[62ch] text-[17px] leading-relaxed text-muted-foreground">Paste posts you wrote and the Studio writes an agent that talks like you. Give it a face, publish it, and earn each time someone talks to it.</p>
   </div>
   <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">{STEPS.map(([t,x],i)=><div key={t} className="grid content-start gap-2 rounded-2xl border bg-card p-5">
    <span className="font-mono text-[11px] text-muted-foreground">0{i+1}</span><b className="font-display text-xl font-medium tracking-[-.02em]">{t}</b><p className="text-[14.5px] leading-relaxed text-muted-foreground">{x}</p></div>)}</div>
   <div className="grid items-center gap-5 rounded-2xl border border-lime bg-card p-6 md:grid-cols-[auto_minmax(0,1fr)]">
    <div className="flex -space-x-3">{(['echo','wren','juno'] as const).map(c=><Thumb key={c} id={c} className="size-20 rounded-xl border-2 border-card bg-t-lime object-[50%_18%]"/>)}</div>
    <div className="grid gap-2"><b className="font-display text-2xl font-medium tracking-[-.03em]">Opt-in only</b>
     <p className="text-[15px] leading-relaxed text-muted-foreground">An agent is written only from posts its creator pasted and confirmed as their own. It is an AI character in that style, not the person: it says so when asked, it never claims to be them, and it does not tell anyone to buy or sell anything.</p></div>
   </div>
   <div className="flex flex-wrap gap-2">
    <Button size="lg" asChild><a href="/dashboard/studio?voice=1">Write my agent<I id="arrow"/></a></Button>
    <Button size="lg" variant="outline" onClick={()=>onNavigate('profile')}>Get verified</Button>
    <Button size="lg" variant="outline" onClick={()=>onNavigate('discover')}>Talk to an agent</Button>
    <Button size="lg" variant="outline" onClick={()=>copyText(link,toast.success,toast.error)}><I id="copy"/>Copy link</Button>
    <Button size="lg" variant="outline" asChild><a href={post} target="_blank" rel="noreferrer noopener"><FaXTwitter aria-hidden="true"/>Post on X</a></Button>
   </div>
   <p className="max-w-[80ch] text-[12.5px] text-muted-foreground">{info?(info.live?`A draft costs ${info.cost} credits and needs at least ${info.min} characters of posts. `:'AI is not connected on this server, so drafts cannot be made here. '):''}What you earn are credits: they pay for runs here, and claiming earnings to a wallet is not switched on. Your instructions are never shown to the people who talk to your agent. A creator who posted a code from their X handle and was confirmed by the team shows as a verified creator; everyone else shows an anonymous creator name.</p>
  </section>
  <SiteFooter onNavigate={onNavigate}/>
 </>;
}
