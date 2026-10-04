/* Recipes: ready-made automations. One click makes the agent (a character, a persona, the skills), puts one of its
   skills on a schedule and, when the account has a delivery channel, sends each result there. Nothing here is special
   on the server: a recipe is used through the same endpoints as doing it by hand (POST /api/agents, POST
   /api/schedules), so every limit, price and check applies as usual.
   To add a recipe: add an entry. `agent` must pass lib/agent-schema.ts (name up to 40 characters, a known character
   and skills), `task` must be a task that makes sense every time it runs, and `needs` says what the server must have
   (`token`: the RHIO token and its record; nothing: works everywhere). `ask` adds one text field whose value replaces
   {topic} in the task. Keep ids stable: links to /dashboard/schedules?recipe=<id> open that recipe.
   This file has no server imports: the page, the public gallery and the tests read it. */
import type {SkillId} from './agents';

export type Recipe={id:string;title:string;text:string;/** what arrives, in a few words */gives:string;
 agent:{name:string;skin:string;personality:string;tone:'Friendly'|'Professional'|'Concise';skills:SkillId[]};
 skill:SkillId;task:string;perDay:number;/** local hour of the first run */hour:number;needs?:'token';
 ask?:{label:string;placeholder:string}};

export const RECIPES:Recipe[]=[
 {id:'whale-brief',title:'Daily whale brief',text:'Every morning: what moved in RHIO in the last 24 hours, the biggest transfers, new holders and anything unusual.',gives:'A short token brief, once a day',
  agent:{name:'Whale Watcher',skin:'scout',personality:'You report on the RHIO token from the numbers you are given. Be short and exact. Say what stands out and why it might matter, never guess who is behind an address, and never call a transfer a buy or a sell.',tone:'Concise',skills:['whales','monitor','summarize']},
  skill:'whales',task:'Write a short brief of what moved in RHIO in the last 24 hours: the biggest transfers, new holders, and anything unusual against the supply.',perDay:1,hour:8,needs:'token'},
 {id:'wallet-watch',title:'Wallet check, four times a day',text:'Every six hours: what your linked wallet holds and what changed since the last check.',gives:'Balances and changes, every 6 hours',
  agent:{name:'Wallet Guard',skin:'guardian',personality:'You watch one wallet and report only what the reading shows. Lead with what changed. If nothing changed, say so in one line.',tone:'Concise',skills:['monitor','whales','summarize']},
  skill:'monitor',task:'Check my wallet and tell me what changed since the last check.',perDay:4,hour:8,needs:'token'},
 {id:'daily-post',title:'A post a day',text:'Every morning: one ready-to-edit post about your topic, with a hook and a clear point.',gives:'One draft post, once a day',
  agent:{name:'Post Writer',skin:'nova',personality:'You write short social posts that sound like a person, not an ad. One idea per post, a first line that earns the second, no hashtags unless asked, no invented facts or numbers.',tone:'Friendly',skills:['write','brainstorm','summarize']},
  skill:'write',task:'Write one post for X about {topic}. A strong first line, one clear point, under 280 characters. Give two alternatives for the first line.',perDay:1,hour:9,
  ask:{label:'What should it post about?',placeholder:'e.g. building AI agents, our product, a weekly lesson'}},
 {id:'morning-plan',title:'Morning plan',text:'Every morning: three priorities for the day and a short checklist, from the goal you set.',gives:'A plan for the day, once a day',
  agent:{name:'Day Planner',skin:'kira',personality:'You turn a goal into a realistic plan for one day. Three priorities at most, each with a first step small enough to start now. Flag one risk.',tone:'Professional',skills:['planner','brainstorm','summarize']},
  skill:'planner',task:'Plan my day toward this goal: {topic}. Three priorities, a short checklist with time estimates, and one risk to watch.',perDay:1,hour:7,
  ask:{label:'What are you working toward?',placeholder:'e.g. launch the beta by Friday'}},
];
export const recipeById=(id:string|null|undefined)=>RECIPES.find(r=>r.id===id)||null;
/** The task as it will run: the topic put in, or the bare task when the recipe asks nothing. */
export const recipeTask=(r:Recipe,topic:string)=>r.task.replace('{topic}',topic.trim());
