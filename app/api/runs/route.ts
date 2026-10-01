import {z} from 'zod';
import {context,failure,body,HttpError} from '@/lib/server';
import {skillIds} from '@/lib/agents';
import {performRun} from '@/lib/runs';
// expectedPrice: the creator price the buyer saw in Discover (lib/runs.ts refuses the run when it changed meanwhile)
const schema=z.object({id:z.string().uuid(),agentId:z.string().uuid(),prompt:z.string().trim().min(3).max(12000),skill:z.enum(skillIds),mode:z.enum(['sample','live']),expectedPrice:z.number().int().min(0).max(500).optional()});
export async function POST(request:Request){try{
 const {db,owner}=await context(request,true);const parsed=schema.safeParse(await body(request));if(!parsed.success)throw new HttpError(400,'Choose an agent and enter a task between 3 and 12,000 characters.');
 return Response.json(await performRun(db,owner,parsed.data));
}catch(e){return failure(e)}}
