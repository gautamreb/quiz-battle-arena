import { Pool } from 'pg';
import { readFile } from 'node:fs/promises';
export async function migrate(){
 if(!process.env.DATABASE_URL)throw new Error('Set DATABASE_URL to your PostgreSQL connection string.');
 const pool=new Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000});
 try{await pool.query(await readFile(new URL('../migrations/001_rooms.sql',import.meta.url),'utf8'));console.log('Database schema is ready.');}finally{await pool.end();}
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href)await migrate();
