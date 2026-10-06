'use client';
/* Home page, right under the hero: "Talk to one right now". When a published agent's creator lets visitors try it
   without a wallet (a guest chat, lib/embed.ts), the most used such agent is shown here with its chat in a frame, so
   the first thing a visitor can do on the site is ask a question. Nothing is shown while no agent has that switched
   on: the section never promises a chat that is not there. Answers in the frame are paid by that agent's creator,
   who can read what is asked; the text says so. */
import {useEffect,useState} from 'react';
import {api} from '@/app/ui';
import {Thumb} from '@/components/landing/mocks';
import {CutButton,Eyebrow,Reveal} from '@/components/rhio/motion';
import {agentPath} from '@/lib/routes';
import type {MarketAgent} from '@/lib/agents';
import type {CharacterId} from '@/lib/characters';

export function TryNow({onNavigate}:{onNavigate:(v:string)=>void}){
 const [agent,setAgent]=useState<MarketAgent|null>(null);const [tone,setTone]=useState('');
 useEffect(()=>{let alive=true;
  try{setTone(document.documentElement.getAttribute('data-theme')==='light'?'light':'dark');}catch{setTone('dark');}
  // the list comes most used first: the first agent that takes guests
  api('/api/market?guest=1').then(d=>{if(alive)setAgent(((d.agents||[]) as MarketAgent[]).find(a=>a.guest)||null);}).catch(()=>null);
  return()=>{alive=false;};},[]);
 if(!agent||!agent.guest)return null;
 return <section id="try-now" aria-label={`Talk to ${agent.name} without a wallet`} className="scroll-mt-24 px-4 py-[clamp(56px,7vw,100px)]">
  <div className="mx-auto grid max-w-[1180px] items-center gap-[clamp(28px,5vw,72px)] lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
   <Reveal className="grid justify-items-start gap-5">
    <Eyebrow tone="lime">No wallet needed</Eyebrow>
    <h2 className="text-[clamp(38px,5.4vw,72px)] leading-[.98]"><span className="font-display font-medium tracking-[-.045em]">Talk to one</span><br/><span className="font-display font-light tracking-[-.045em] text-muted-foreground">right now.</span></h2>
    <div className="flex items-center gap-3"><Thumb id={agent.skin as CharacterId} className="size-12 rounded-xl bg-t-lime object-[50%_18%]"/>
     <div className="grid leading-tight"><b className="font-display text-xl font-medium tracking-[-.02em]">{agent.name}</b>{agent.tagline&&<span className="text-[14px] text-muted-foreground">{agent.tagline}</span>}</div></div>
    <p className="max-w-[46ch] text-[15.5px] leading-relaxed text-muted-foreground">An agent someone built here. Ask it anything in the box: no account, no signup. Its creator pays these few answers a day and can read what is asked. It is an AI character, so it can be wrong.</p>
    <div className="flex flex-wrap gap-2"><CutButton variant="lime" onClick={()=>onNavigate('studio')}>Build your own</CutButton><a href={agentPath(agent.id)} className="inline-flex h-11 items-center rounded-lg border px-4 text-sm font-medium transition-colors hover:border-foreground/40">Open its page</a></div>
   </Reveal>
   <Reveal delay={0.08} className="rounded-xl bg-lime p-[clamp(10px,1.6vw,18px)]">
    {tone&&<iframe src={`/embed/${agent.guest}?theme=${tone}`} title={`Chat with ${agent.name}`} loading="lazy" className="h-[540px] w-full rounded-lg border border-[#1f201e]/10 bg-background"/>}
   </Reveal>
  </div>
 </section>;
}
