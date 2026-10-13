import { getPool } from '../../../lib/database';
import { roomStore } from '../../../lib/game/store';
import { GameError,type Action } from '../../../lib/game/engine';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request){
 try{
  const origin=request.headers.get('origin');
  const expectedOrigin=process.env.APP_ORIGIN||process.env.RENDER_EXTERNAL_URL||new URL(request.url).origin;
  if(origin&&origin!==new URL(expectedOrigin).origin)throw new GameError('Invalid request origin.',403);
  const raw=await request.text();if(raw.length>4096)throw new GameError('Request too large.',413);
  let b:Action&{code?:string};try{b=JSON.parse(raw);}catch{throw new GameError('Invalid request.');}
  if(!b||typeof b!=='object')throw new GameError('Invalid request.');
  return response(await roomStore(getPool())(b));
 }catch(e){if(e instanceof GameError)return response({error:e.message},e.status);console.error('Game request failed',e);return response({error:'Connection interrupted. Please try again.'},503);}
}
