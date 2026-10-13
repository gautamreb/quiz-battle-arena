import { getPool } from '../../../lib/database';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(){try{await getPool().query('SELECT code FROM rooms LIMIT 1');return Response.json({status:'ok'},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({status:'unavailable'},{status:503});}}
