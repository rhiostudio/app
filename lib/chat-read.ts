/* Skills inside a chat, the reading (lib/chat-tools.ts decides whether one is made; lib/runs.ts performRun calls this
   for a conversation). The reading is the same one the skill itself makes: plain numbers for the AI after the
   message, and the same numbers under the answer, so a reader can check what the agent said against what was read.
   A chat message is never refused or failed because a reading could not be made: the agent is then told so, and
   told to say so instead of guessing a number.
   In a chat other people use on the account's credits (`shared`), only an address written in the message is read,
   the reading is not compared with an earlier one and is not kept as the account's "last check". */
import {HttpError} from './server';
import {addressIn,monitorTarget,readWallet,type WalletReading} from './monitor';
import {whaleReading} from './whales';
import type {ChatTool} from './chat-tools';

export type ChatReading={facts:string;note:string;/** a wallet reading to keep as the account's last check */wallet?:WalletReading};

export async function chatReading(db:D1Database,owner:string,tool:ChatTool,message:string,shared:boolean):Promise<ChatReading>{
 try{
  if(tool==='whales')return await whaleReading(db);
  const address=shared?addressIn(message):await monitorTarget(db,owner,message);
  if(!address)throw new HttpError(400,'There is no wallet address in the message.');
  const r=await readWallet(db,owner,address,{compare:!shared});
  return {facts:r.facts,note:r.note,wallet:shared?undefined:r};
 }catch(e){
  const known=e instanceof HttpError&&(e.status===400||e.status===503);
  const why=known?(e as Error).message.replace(/\s*Nothing was charged[^.]*\./g,'').trim():'It could not be read right now.';
  return {facts:[`NO READING: the RHIO server tried to read ${tool==='whales'?'its record of the RHIO token':'the wallet'} for the message at the top and could not. ${why}`,
   'Tell the user that, in your own voice, and do not state any balance, transfer or holder number.'].join('\n'),note:''};
 }
}
