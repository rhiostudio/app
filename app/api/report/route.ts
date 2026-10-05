/* The daily reward report, public (lib/report.ts): the holder reward program in numbers and a post ready to copy.
   A server where the program is not running answers {live:false}. */
import {env} from 'cloudflare:workers';
import {failure} from '@/lib/server';
import {dailyReport} from '@/lib/report';

export async function GET(){try{
 const db=(env as unknown as {DB?:D1Database}).DB;
 const report=db?await dailyReport(db):null;
 return Response.json(report?{live:true,report}:{live:false},{headers:{'Cache-Control':'public, max-age=60'}});
}catch(e){return failure(e)}}
