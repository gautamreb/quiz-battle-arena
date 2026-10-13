import assert from 'node:assert/strict';
const base=process.argv[2]||'http://127.0.0.1:5173';
let count=0;
const request=async(token,action,extra={})=>{const r=await fetch(base+'/api/game',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,action,...extra})});const body=await r.json();return {status:r.status,...body};};
const ok=(condition,label)=>{assert.ok(condition,label);count++;console.log('PASS',label);};
const tokens=Array.from({length:9},()=>crypto.randomUUID());
let s=await request(tokens[0],'create',{name:'Host'});ok(s.status===200,'anonymous create');const code=s.code;
let guests=await Promise.all(tokens.slice(1,8).map((token,i)=>request(token,'join',{code,name:'Player '+(i+2)})));ok(guests.every(r=>r.status===200),'seven simultaneous joins');
s=await request(tokens[0],'poll',{code});ok(s.players.length===8,'all eight players persisted');
const ninth=await request(tokens[8],'join',{code,name:'Ninth'});ok(ninth.status===409,'ninth player rejected');
ok((await request(tokens[1],'start',{code})).status===403,'non-host start rejected');
s=await request(tokens[0],'start',{code});ok(s.phase==='question'&&s.question.correct===undefined,'host starts with answer hidden');
ok((await request(tokens[8],'join',{code,name:'Latecomer'})).status!==200,'mid-game join rejected');
const firstGame=s.gameId;
for(let round=0;round<10;round++){
 const index=s.index,gameId=s.gameId;
 const responses=await Promise.all(tokens.slice(0,8).map(token=>request(token,'answer',{code,index,gameId,choice:0})));
 ok(responses.every(r=>r.status===200),'simultaneous answers accepted in round '+(round+1));
 s=await request(tokens[0],'poll',{code});ok(s.phase==='reveal'&&s.answeredCount===8,'one synchronized reveal for round '+(round+1));
 if(round===0){const score=s.players.find(p=>p.isYou).score;await request(tokens[0],'answer',{code,index,gameId,choice:1});s=await request(tokens[0],'poll',{code});ok(s.players.find(p=>p.isYou).score===score,'retry does not change score');}
 // Keep all players present while the shared four-second reveal runs.
 const deadline=Date.now()+4300;
 do{await new Promise(r=>setTimeout(r,500));const states=await Promise.all(tokens.slice(0,8).map(token=>request(token,'poll',{code})));ok(states.every(r=>r.status===200),'all devices receive shared state');s=states[0];}while(s.phase==='reveal'&&Date.now()<deadline+3000);
 if(round<9)ok(s.phase==='question'&&s.index===round+1,'next question synchronized');
}
ok(s.phase==='finished','game finishes after ten questions');
const before=s.players.map(p=>[p.name,p.score]);
const restored=await request(tokens[2],'poll',{code});ok(JSON.stringify(restored.players.map(p=>[p.name,p.score]))===JSON.stringify(before),'reconnected player sees same final scores');
s=await request(tokens[0],'restart',{code});ok(s.phase==='question'&&s.gameId!==firstGame&&s.players.every(p=>p.score===0),'host restart resets all scores');
await Promise.all(tokens.slice(0,8).map(token=>request(token,'leave',{code})));
console.log(`${count} HTTP multiplayer checks passed against ${base}`);
