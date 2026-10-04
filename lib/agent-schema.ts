/* Zod schemas for saved agents (server routes; the studio imports this lazily). Old configs still validate. */
import {z} from 'zod';
import {skinIds,motionNames,legacyMotions,accessories,getCharacter,wardrobe} from './characters';
import {skillIds,MAX_SKILLS} from './agents';
const color=z.string().regex(/^#[0-9a-fA-F]{6}$/,'Use a six-digit hex color');
const oneOf=(key:keyof typeof wardrobe)=>{const values=(wardrobe[key] as [string,string][]).map(v=>v[0]);return z.string().refine(v=>values.includes(v),`Unknown ${String(key)} option`);};
export const appearanceSchema=z.object({outfit:color,accent:color,skinTone:color,hair:color,accessory:z.enum(accessories),finish:z.enum(['Matte','Gloss'])});
/** Full 3D look (outfit system). Every field is optional and merged onto the character preset. */
export const lookSchema=z.object({
 kind:z.enum(['human','companion']),model:z.enum(['scout','maker','guardian']).nullable(),body:oneOf('body'),build:oneOf('build'),headStyle:z.enum(['human','screen']),
 skin:color,eyes:color,facial:oneOf('facial'),hair:z.object({style:oneOf('hair'),color}),
 top:z.object({type:oneOf('top'),color,accent:color}),bottom:z.object({type:oneOf('bottom'),color}),legwear:oneOf('legwear'),
 shoes:z.object({type:oneOf('shoes'),color}),head:oneOf('head'),face:oneOf('face'),back:oneOf('back'),accColor:color,glow:color,finish:z.enum(['matte','gloss']),
}).partial().strict();
const motion=z.preprocess(v=>typeof v==='string'&&legacyMotions[v]?legacyMotions[v]:v,z.enum(motionNames));
export const agentSchema=z.object({id:z.string().uuid().optional(),name:z.string().trim().min(1).max(40),tagline:z.string().trim().max(140).optional(),skin:z.enum(skinIds),appearance:appearanceSchema.optional(),look:lookSchema.optional(),motion:motion.optional(),personality:z.string().trim().min(1).max(2000),tone:z.enum(['Friendly','Professional','Concise']),language:z.enum(['English','Bahasa Indonesia']),skills:z.array(z.enum(skillIds)).min(1).max(MAX_SKILLS).transform(v=>[...new Set(v)])}).superRefine((v,ctx)=>{if(v.appearance&&getCharacter(v.skin).category==='Companion'&&v.appearance.accessory!=='None')ctx.addIssue({code:z.ZodIssueCode.custom,path:['appearance','accessory'],message:'Accessories are available on humanoid characters.'});if(v.look?.kind&&v.look.kind!==(getCharacter(v.skin).category==='Companion'?'companion':'human'))ctx.addIssue({code:z.ZodIssueCode.custom,path:['look','kind'],message:'This look does not match the selected character.'});});
/** One readable sentence for the first validation problem (the studio and the API both show it). */
export function agentIssue(error:z.ZodError){
 const i=error.issues[0];const key=String(i?.path[0]??'');
 const fixed:Record<string,string>={name:'Give your agent a name (up to 40 characters).',personality:'Write the instructions in Persona (up to 2,000 characters).',
  skills:`Equip 1 to ${MAX_SKILLS} skills.`,tagline:'Keep the tagline under 140 characters.',skin:'Pick a character.',tone:'Pick a tone.',language:'Pick a language.'};
 if(fixed[key])return fixed[key];
 return `${key==='look'||key==='appearance'?'Outfit':key||'Agent'}: ${i?.message||'check this setting'}.`.replace('..','.');
}
export type Agent=z.infer<typeof agentSchema> & {id?:string;updated?:string;archived?:number;published?:number;price?:number;talkPrice?:number|null;uses?:number};
