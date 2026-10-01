/* URL routes. Every screen has its own path; the app shell (app/studio.tsx, mounted once in the root layout)
   reads the pathname to decide what to render, so state such as the agent draft survives navigation.
   Public site:  /  /docs[/slug]  /whitepaper[/slug]  /roadmap  /login
   Dashboard:    /dashboard  /dashboard/{studio,agents,discover,skills,schedules,history,credits,wallet,rewards,profile}
                 /dashboard/docs[/slug]  /dashboard/whitepaper[/slug]  /dashboard/roadmap
   Signed-in only (proxy.ts redirects to /login?next=...): see PROTECTED_PATHS. */
export type View='home'|'login'|'notfound'|'overview'|'profile'|'rewards'|'wallet'|'studio'|'agents'|'discover'|'skills'|'schedules'|'activity'|'credits'|'docs'|'paper'|'roadmap';
export type Area='site'|'dash';
export type Route={view:View;area:Area;doc?:string};

const DASH:Partial<Record<View,string>>={overview:'',studio:'studio',agents:'agents',discover:'discover',skills:'skills',schedules:'schedules',activity:'history',
 credits:'credits',wallet:'wallet',rewards:'rewards',profile:'profile',docs:'docs',paper:'whitepaper',roadmap:'roadmap'};
const DASH_BY_SEGMENT=Object.fromEntries(Object.entries(DASH).map(([v,s])=>[s,v as View])) as Record<string,View>;
/** Views that exist on the public site too (with a different, editorial layout). */
const SITE:Partial<Record<View,string>>={home:'/',login:'/login',docs:'/docs',paper:'/whitepaper',roadmap:'/roadmap'};

/** Paths that need a session. The proxy only checks that a session cookie exists; the APIs verify it. */
export const PROTECTED_PATHS=['/dashboard','/dashboard/agents','/dashboard/schedules','/dashboard/history','/dashboard/credits','/dashboard/wallet','/dashboard/profile'];
export const isProtectedPath=(p:string)=>{const n=p.replace(/\/+$/,'')||'/';return PROTECTED_PATHS.includes(n);};

/** Path for a view. Docs, whitepaper and roadmap live in both areas; everything else has one home. */
export function pathFor(view:View,doc?:string,area:Area='dash'):string{
 if(view==='home'||view==='login'||view==='notfound')return view==='login'?'/login':'/';
 const docs=view==='docs'||view==='paper';
 if(area==='site'&&SITE[view])return SITE[view]+(docs&&doc?`/${doc}`:'');
 const seg=DASH[view];if(seg===undefined)return '/';
 return '/dashboard'+(seg?`/${seg}`:'')+(docs&&doc?`/${doc}`:'');
}

export function parsePath(pathname:string):Route{
 const parts=(pathname||'/').split('?')[0].split('#')[0].split('/').filter(Boolean).map(decodeURIComponent);
 if(!parts.length)return {view:'home',area:'site'};
 const [a,b,c,...rest]=parts;
 if(a==='login'&&!b)return {view:'login',area:'site'};
 if((a==='docs'||a==='whitepaper')&&!c)return {view:a==='docs'?'docs':'paper',area:'site',doc:b};
 if(a==='roadmap'&&!b)return {view:'roadmap',area:'site'};
 if(a==='dashboard'){
  if(!b)return {view:'overview',area:'dash'};
  const v=DASH_BY_SEGMENT[b];
  if(v&&(v==='docs'||v==='paper')&&!rest.length)return {view:v,area:'dash',doc:c};
  if(v&&!c)return {view:v,area:'dash'};
 }
 return {view:'notfound',area:'site'};
}

/** Legacy hash links (#studio, #agents, ...) from before routes existed. */
export const LEGACY_HASH:Record<string,View>={studio:'studio',agents:'agents',discover:'discover',skills:'skills',schedules:'schedules',activity:'activity',credits:'credits',wallet:'wallet',rewards:'rewards',docs:'docs',paper:'paper',roadmap:'roadmap'};
