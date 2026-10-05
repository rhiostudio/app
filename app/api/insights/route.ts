/* Insights for a creator (lib/insights.ts). GET ?agent=<id>: what one of the signed-in account's own agents did in the
   last seven days (the most recently changed agent when none is named). Signed-in only; it only reads. */
import {context,failure} from '@/lib/server';
import {insights} from '@/lib/insights';

export async function GET(request:Request){try{
 const {db,owner}=await context(request);
 return Response.json(await insights(db,owner,new URL(request.url).searchParams.get('agent')),{headers:{'Cache-Control':'no-store'}});
}catch(e){return failure(e)}}
