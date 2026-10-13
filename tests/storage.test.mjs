import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('work/test-engine',{recursive:true});
for(const name of ['questions','engine','store']){
 let src=await readFile(`lib/game/${name}.ts`,'utf8');src=src.replace("'./questions'","'./questions.mjs'").replace("'./engine'","'./engine.mjs'");
 await writeFile(`work/test-engine/${name}.mjs`,ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);
}
const {roomStore}=await import('../work/test-engine/store.mjs');
const db=new PGlite();await db.exec(await readFile('migrations/001_rooms.sql','utf8'));
const execute=roomStore(db);const tokens=Array.from({length:9},()=>crypto.randomUUID());
let room=await execute({action:'create',token:tokens[0],name:'Host'});const code=room.code;
await Promise.all(tokens.slice(1,8).map((token,i)=>execute({action:'join',token,code,name:'Guest '+i})));
room=await execute({action:'poll',token:tokens[0],code});assert.equal(room.players.length,8);console.log('PASS PostgreSQL concurrent joins persist eight players');
await assert.rejects(()=>execute({action:'join',token:tokens[8],code,name:'Ninth'}));
await assert.rejects(()=>execute({action:'start',token:tokens[1],code}));
room=await execute({action:'start',token:tokens[0],code});assert.equal(room.question.correct,undefined);
await Promise.all(tokens.slice(0,8).map(token=>execute({action:'answer',token,code,gameId:room.gameId,index:0,choice:0})));
room=await execute({action:'poll',token:tokens[0],code});assert.equal(room.phase,'reveal');assert.equal(room.answeredCount,8);console.log('PASS PostgreSQL concurrent answers produce one reveal with no lost updates');
const score=room.players.find(p=>p.isYou).score;
await execute({action:'answer',token:tokens[0],code,gameId:room.gameId,index:0,choice:1});room=await execute({action:'poll',token:tokens[0],code});assert.equal(room.players.find(p=>p.isYou).score,score);console.log('PASS PostgreSQL duplicate submissions are idempotent');
await db.close();console.log('PostgreSQL storage checks passed (embedded PostgreSQL engine).');
