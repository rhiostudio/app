/* One published agent, as the public sees it (Discover, the agent page /a/<id>, link previews). Only public fields
   leave the database: instructions are never part of publicAgent(). */
import {publicAgent} from '@/lib/economy';
import {skillCatalog} from '@/lib/agents';

type Row={id:string;owner:string;name:string;config:string;price:number;uses:number;published_at:string|null};
export type PublicAgent=ReturnType<typeof publicAgent>;
export const AGENT_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The agent when it is published and not archived, otherwise null (unknown, private and archived look the same). */
export async function publishedAgent(db:D1Database,id:string,viewer?:string):Promise<PublicAgent|null>{
 if(!AGENT_ID.test(id))return null;
 const row=await db.prepare('SELECT id,owner,name,config,price,uses,published_at FROM agents WHERE id=? AND published=1 AND archived=0').bind(id).first<Row>();
 return row?publicAgent(row,viewer):null;
}

export const skillLabel=(id:string)=>skillCatalog.find(s=>s.id===id)?.name||id;
export const priceLabel=(price:number)=>price>0?`${price} credits per run`:'Free to run';
/** One line for link previews and the page header: what the agent does and what it costs. */
export function agentSummary(a:{tagline:string;skills:string[];price:number}){
 const skills=a.skills.map(skillLabel).join(', ');
 return [a.tagline,skills&&`Skills: ${skills}`,priceLabel(a.price)].filter(Boolean).join(' · ');
}
/** Changes whenever what the preview shows changes, so X and Telegram fetch a new picture instead of a cached one. */
export function previewVersion(a:{name:string;tagline:string;skin:string;skills:string[];price:number}){
 const s=[a.name,a.tagline,a.skin,a.skills.join(','),a.price].join('|');let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36);
}
