import ts from 'typescript';
import { readFile,mkdir,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('work/test-engine',{recursive:true});
for(const name of ['questions','engine']){
 const src=(await readFile(`lib/game/${name}.ts`,'utf8')).replace("'./questions'","'./questions.mjs'");
 await writeFile(`work/test-engine/${name}.mjs`,ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);
}
const {newRoom,apply,tick,view,ROUND_MS}=await import('../work/test-engine/engine.mjs');
const T=1000000,host='host',guest='guest';
const act=(r,action,token=host,extra={},now=T)=>apply(r,{action,token,...extra},now);
const room=()=>{let r=newRoom('ABC234',host,'Host',T);act(r,'join',guest,{name:'Guest'});return r;};
const checks=[];
function test(name,fn){fn();checks.push(name);console.log('PASS',name);}
test('2–8 players, duplicate names, and capacity limits',()=>{let r=room();assert.throws(()=>act(r,'join','dup',{name:'guest'}));for(let i=2;i<8;i++)act(r,'join','p'+i,{name:'Player '+i});assert.equal(r.players.length,8);assert.throws(()=>act(r,'join','ninth',{name:'Ninth'}));});
test('host-only start and at least two connected players',()=>{let r=room();assert.throws(()=>act(r,'start',guest));act(r,'start');assert.equal(r.questions.length,10);assert.equal(r.phase,'question');assert.throws(()=>act(r,'start'));assert.throws(()=>act(newRoom('ABC234',host,'Host',T),'start'));});
test('question secrecy and anonymous token secrecy',()=>{let r=room();act(r,'start');const v=view(r,host,T);assert.equal(v.question.correct,undefined);assert.equal(v.players[0].id,undefined);assert.equal(v.questions,undefined);});
test('speed scoring: max, 9 seconds remaining, and incorrect',()=>{for(const [elapsed,expected] of [[0,150],[6000,130],[14999,100]]){let r=room();act(r,'start');act(r,'answer',host,{gameId:r.gameId,index:0,choice:r.questions[0].correct},T+elapsed);assert.equal(r.players[0].score,expected);}let r=room();act(r,'start');act(r,'answer',host,{gameId:r.gameId,index:0,choice:(r.questions[0].correct+1)%4});assert.equal(r.players[0].score,0);});
test('one locked answer, duplicate submission idempotency, stale-game rejection',()=>{let r=room();act(r,'start');const payload={gameId:r.gameId,index:0,choice:r.questions[0].correct};act(r,'answer',host,payload);act(r,'answer',host,{...payload,choice:2});assert.equal(r.players[0].score,150);assert.throws(()=>act(r,'answer',guest,{...payload,gameId:'old'}));assert.throws(()=>act(r,'answer',guest,{...payload,choice:4}));});
test('late answers rejected and deadline produces reveal then next question',()=>{let r=room();act(r,'start');assert.throws(()=>act(r,'answer',host,{gameId:r.gameId,index:0,choice:0},T+ROUND_MS));assert.equal(r.phase,'reveal');tick(r,T+ROUND_MS+4000);assert.equal(r.index,1);assert.equal(r.phase,'question');assert.equal(Object.keys(r.answers).length,0);});
test('all answered produces immediate reveal and shared ranks',()=>{let r=room();act(r,'start');for(const p of r.players)act(r,'answer',p.id,{gameId:r.gameId,index:0,choice:r.questions[0].correct});assert.equal(r.phase,'reveal');assert.equal(view(r,host,T).question.correct,r.questions[0].correct);assert.deepEqual(view(r,host,T).players.map(p=>p.rank),[1,1]);});
test('disconnect transfer, reconnect, leave, and midgame join protection',()=>{let r=room();act(r,'start');assert.throws(()=>act(r,'join','new',{name:'New'}));r.players[1].seen=T+29000;tick(r,T+31000);assert.equal(r.host,guest);act(r,'poll',host,{},T+31000);assert.equal(r.players.length,2);act(r,'leave',guest,{},T+31000);assert.equal(r.host,host);});
test('ten rounds finish, host rematch resets scores and chooses fresh questions',()=>{let r=room();act(r,'start');const old=r.questions.map(q=>q.id);let time=T;for(let i=0;i<10;i++){assert.equal(r.index,i);for(const p of r.players)act(r,'answer',p.id,{gameId:r.gameId,index:i,choice:r.questions[i].correct},time);time+=4000;tick(r,time);}assert.equal(r.phase,'finished');r.players.forEach(p=>p.seen=time);assert.throws(()=>act(r,'restart',guest,{},time));act(r,'restart',host,{},time);assert.equal(r.phase,'question');assert.equal(r.index,0);assert.ok(r.players.every(p=>p.score===0));assert.ok(r.questions.every(q=>!old.includes(q.id)));});
console.log(`${checks.length} engine checks passed.`);
