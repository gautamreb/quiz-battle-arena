import { pickQuestions, type Question } from './questions';
export const ROUND_MS=15000, REVEAL_MS=4000, EXPIRY_MS=2*60*60*1000;
export type Player={id:string;name:string;score:number;seen:number};
export type Answer={choice:number;points:number};
export type Room={code:string;host:string;phase:'lobby'|'question'|'reveal'|'finished';players:Player[];questions:Question[];index:number;deadline:number;answers:Record<string,Answer>;gameId:string;updated:number};
export type Action={action:string;token:string;name?:string;choice?:number;gameId?:string;index?:number};
export class GameError extends Error { constructor(message:string,public status=400){super(message);} }
export function newRoom(code:string,token:string,name:string,now:number):Room{return {code,host:token,phase:'lobby',players:[{id:token,name,score:0,seen:now}],questions:[],index:0,deadline:0,answers:{},gameId:crypto.randomUUID(),updated:now};}
export function validName(name:unknown):string {if(typeof name!=='string'||!name.trim()||name.trim().length>20)throw new GameError('Choose a nickname between 1 and 20 characters.');return name.trim();}
export function tick(r:Room,now:number){
 const host=r.players.find(p=>p.id===r.host);
 if(!host||now-host.seen>30000){const next=r.players.find(p=>now-p.seen<10000);if(next)r.host=next.id;}
 if(r.phase==='lobby')r.players=r.players.filter(p=>p.id===r.host||now-p.seen<60000);
 if(r.phase==='question'&&now>=r.deadline){r.phase='reveal';r.deadline+=REVEAL_MS;}
 if(r.phase==='reveal'&&now>=r.deadline){if(r.index===9){r.phase='finished';r.deadline=0;}else{r.index++;r.answers={};r.phase='question';r.deadline=now+ROUND_MS;}}
}
export function apply(r:Room,a:Action,now:number):Room{
 tick(r,now);
 let p=r.players.find(p=>p.id===a.token);
 if(a.action==='join'){
  if(p){p.seen=now;return r;}
  if(r.phase!=='lobby'&&r.phase!=='finished')throw new GameError('This game has started. Join after the final results.');
  if(r.players.length>=8)throw new GameError('This room is full (8 players).',409);
  const name=validName(a.name);
  if(r.players.some(p=>p.name.toLowerCase()===name.toLowerCase()))throw new GameError('That nickname is taken in this room.');
  p={id:a.token,name,score:0,seen:now};r.players.push(p);
 }
 if(!p)throw new GameError('Your place in this room expired. Please join again.',401);
 p.seen=now;
 if(a.action==='start'||a.action==='restart'){
  if(r.host!==a.token)throw new GameError('Only the host can do that.',403);
  if(a.action==='start'&&r.phase!=='lobby')throw new GameError('The game has already started.',409);
  if(a.action==='restart'&&r.phase!=='finished')throw new GameError('Finish this game before restarting.',409);
  r.players=r.players.filter(p=>now-p.seen<10000);
  if(r.players.length<2)throw new GameError('At least two connected players are needed.');
  r.questions=pickQuestions(r.questions.map(q=>q.id));r.players.forEach(p=>p.score=0);r.index=0;r.answers={};r.phase='question';r.deadline=now+ROUND_MS;r.gameId=crypto.randomUUID();
 }else if(a.action==='answer'){
  if(a.gameId!==r.gameId||a.index!==r.index)throw new GameError('That question has ended.',409);
  // Retrying an already accepted answer is safe and never awards points twice.
  if(r.answers[a.token])return r;
  if(r.phase!=='question'||now>=r.deadline)throw new GameError('Time is up. Watch for the next question.',409);
  if(!Number.isInteger(a.choice)||a.choice!<0||a.choice!>3)throw new GameError('Choose one of the four answers.');
  const points=a.choice===r.questions[r.index].correct?100+Math.floor(50*(r.deadline-now)/ROUND_MS):0;
  r.answers[a.token]={choice:a.choice!,points};p.score+=points;
  if(r.players.every(p=>r.answers[p.id])){r.phase='reveal';r.deadline=now+REVEAL_MS;}
 }else if(a.action==='leave'){
  r.players=r.players.filter(p=>p.id!==a.token);
  if(r.host===a.token)r.host=r.players[0]?.id||'';
 }else if(!['join','poll','start','restart'].includes(a.action))throw new GameError('Unknown action.');
 r.updated=now;return r;
}
export function view(r:Room,token:string,now:number){
 const q=r.questions[r.index];const reveal=r.phase==='reveal'||r.phase==='finished';
 const sorted=[...r.players].sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
 return {code:r.code,phase:r.phase,gameId:r.gameId,index:r.index,deadline:r.deadline,serverNow:now,isHost:r.host===token,
 players:sorted.map((p,i)=>({name:p.name,score:p.score,rank:sorted.findIndex(x=>x.score===p.score)+1,isYou:p.id===token,isHost:p.id===r.host,connected:now-p.seen<10000,answered:!!r.answers[p.id],points:reveal?r.answers[p.id]?.points??0:undefined})),
 question:q?{category:q.category,text:q.text,choices:q.choices,...(reveal?{correct:q.correct}:{})}:null,
 answer:r.answers[token]??null,answeredCount:r.players.filter(p=>r.answers[p.id]).length};
}
