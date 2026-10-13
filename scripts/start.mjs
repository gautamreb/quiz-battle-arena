import { spawn } from 'node:child_process';
import { migrate } from './migrate.mjs';
await migrate();
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','0.0.0.0','--port',process.env.PORT||'3000'],{stdio:'inherit'});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.kill(signal));
server.on('exit',(code)=>process.exit(code??1));
