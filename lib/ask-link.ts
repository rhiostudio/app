/* A link to one of an agent's questions (/a/<id>?ask=N): the page opens with that question ready in the chat, and the
   link's preview shows the question on the agent's card. N counts the questions to start from that the agent's
   creator wrote, as the public agent carries them (1 to 3): the link can only ever show text the creator put on the
   agent's page, never text someone typed into an address. No server imports: the page, the route marker and the card
   use this file. */
export const ASK_PARAM='ask';
/** The question a link names, or null (no such number, or the agent has no questions). */
export function askedQuestion(starters:readonly string[]|undefined,value:string|string[]|null|undefined):{n:number;text:string}|null{
 const raw=Array.isArray(value)?value[0]:value;if(typeof raw!=='string'||!/^[1-9]$/.test(raw))return null;
 const n=Number(raw);const text=String(starters?.[n-1]||'').trim();
 return text?{n,text}:null;
}
/** The address of question N of an agent (N from 1). */
export const askPath=(agentId:string,n:number)=>`/a/${agentId}?${ASK_PARAM}=${n}`;
/** A short mark of the question's wording, so a changed question gets a new picture address. */
export function askMark(text:string){let h=5381;for(let i=0;i<text.length;i++)h=((h<<5)+h+text.charCodeAt(i))|0;return (h>>>0).toString(36);}
