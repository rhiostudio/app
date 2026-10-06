/* The opening writer (POST /api/opening; "Write its opening for me" in the Studio's Persona tab,
   components/app/opening.tsx): a draft of the greeting and the three questions to start from, written from what the
   creator already said about the agent. The part without server imports is lib/opening-draft.ts. */
import {aiReady,runtime} from './server';
import {GREETING_MAX,STARTER_MAX,STARTERS_MAX} from './agents';
import {OPENING_LIMITS} from './opening-draft';
export {OPENING_MIN,OPENING_SKILL,openingBrief,parseOpening} from './opening-draft';

// the draft is cut to what an agent may carry: these must stay the limits of lib/agents.ts (a type error when not)
const SAME:[typeof GREETING_MAX,typeof STARTER_MAX,typeof STARTERS_MAX]=[OPENING_LIMITS.greeting,OPENING_LIMITS.starter,OPENING_LIMITS.starters];void SAME;

/** Credits for one draft (OPENING_COST, default 4, at least 1): one short AI call. */
export function openingCost(){const raw=(runtime() as {OPENING_COST?:string}).OPENING_COST;const v=Number(raw);return typeof raw==='string'&&raw.trim()!==''&&Number.isFinite(v)?Math.min(Math.max(Math.round(v),1),500):4;}
export const openingInfo=()=>({live:aiReady(),cost:openingCost()});
