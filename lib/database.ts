import { Pool } from 'pg';
const globalDb=globalThis as unknown as {arenaPool?:Pool};
export function getPool(){
 if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required. Connect a PostgreSQL database.');
 if(!globalDb.arenaPool){globalDb.arenaPool=new Pool({connectionString:process.env.DATABASE_URL,max:10,connectionTimeoutMillis:5000,idleTimeoutMillis:30000,statement_timeout:8000});globalDb.arenaPool.on('error',e=>console.error('PostgreSQL idle connection error',e.message));}
 return globalDb.arenaPool;
}
