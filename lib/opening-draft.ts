/* The opening writer, the part without server imports (lib/opening.ts has the cost; the test imports this file).
   "Write its opening for me" in the Studio's Persona tab: from what the creator already wrote about the agent (name,
   tagline, instructions, always-on notes) a neutral writer drafts the greeting the agent says first in a chat and
   three questions a visitor could tap to start. Nothing is saved: the Studio shows the draft and the creator decides.
   The draft is a normal paid run of the creator's OWN saved agent (lib/runs.ts performRun with `voice`, the draft mode,
   and skill OPENING_SKILL); the model works as the voice writer of lib/voice-draft.ts with the `opening` rule in
   lib/provider.ts and answers in four marked lines, which parseOpening() reads. */
import type {Agent} from './agents';

/** What an agent may carry (the same numbers as GREETING_MAX, STARTER_MAX and STARTERS_MAX in lib/agents.ts; written
    out here so this file has no imports that run: lib/opening.ts fails the build if they ever differ). */
export const OPENING_LIMITS={greeting:200,starter:80,starters:3} as const;
const GREETING_MAX=OPENING_LIMITS.greeting,STARTER_MAX=OPENING_LIMITS.starter,STARTERS_MAX=OPENING_LIMITS.starters;

/** What an opening draft is filed under in runs.skill. Not one of the agent skills (lib/agents.ts skillIds). */
export const OPENING_SKILL='opening';
/** Instructions shorter than this say too little about the character to write its opening from. */
export const OPENING_MIN=40;
const NOTES_ROOM=1500;

/** What the writer is given: the agent as its creator described it (only text the creator wrote on this agent), and
    what it can do in a chat besides talking: `reads` names what it can read there (lib/chat-tools.ts chatReads), so the
    opening does not promise a lookup the agent cannot make. */
export function openingBrief(a:Pick<Agent,'name'|'tagline'|'personality'|'knowledge'|'tone'>,reads=''){
 const notes=String(a.knowledge||'').trim();
 return [`NAME: ${String(a.name||'').trim()}`,a.tagline?`TAGLINE: ${String(a.tagline).trim()}`:'',`TONE: ${a.tone}`,`IN A CHAT IT CAN: ${reads?`talk, and read ${reads} when asked`:'only talk (it cannot browse, open links, read addresses or look anything up)'}`,'INSTRUCTIONS:',String(a.personality||'').trim(),
  ...(notes?['NOTES IT CARRIES:',notes.length>NOTES_ROOM?notes.slice(0,NOTES_ROOM)+' …':notes]:[])].filter(Boolean).join('\n');
}

const strip=(s:string)=>s.trim().replace(/^[-*•\d.)\s]+/,'').replace(/^["“”'‘’*_\s]+|["“”'‘’*_\s]+$/g,'').replace(/\s+/g,' ').trim();
/** The draft as the page needs it. The model is asked for "GREETING: ..." and "Q1: ..." to "Q3: ..."; lines without
    those marks are ignored, so an answer in another shape gives an empty draft and the page says so. Everything is
    cut to what an agent may carry, and a question that repeats another is dropped. */
export function parseOpening(output:string):{greeting:string;starters:string[]}{
 const lines=String(output||'').split('\r').join('').split('\n').map(l=>l.trim()).filter(Boolean);
 let greeting='';const starters:string[]=[];
 for(const l of lines){
  const g=l.match(/^[-*_•>\s]*GREETING[*_\s]*:\s*(.+)$/i);if(g&&!greeting){greeting=strip(g[1]).slice(0,GREETING_MAX);continue;}
  const q=l.match(/^[-*_•>\s]*Q(?:UESTION)?\s*[1-9][*_\s]*[:.)]\s*(.+)$/i);
  if(q&&starters.length<STARTERS_MAX){const t=strip(q[1]).slice(0,STARTER_MAX).trim();if(t&&!starters.some(x=>x.toLowerCase()===t.toLowerCase()))starters.push(t);}
 }
 return {greeting,starters};
}
