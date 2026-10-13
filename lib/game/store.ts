import { apply,newRoom,validName,view,GameError,EXPIRY_MS,type Room,type Action } from './engine';
type SQL={query:(sql:string,params?:unknown[])=>Promise<{rows:any[];rowCount?:number|null}>};
export function roomStore(db:SQL){
 return async function execute(b:Action&{code?:string}){
  if(typeof b.token!=='string'||!/^[-a-zA-Z0-9]{32,80}$/.test(b.token))throw new GameError('Please reload the page to reconnect.',401);
  if(b.action==='create'){
   const name=validName(b.name);const now=Date.now();
   await db.query('DELETE FROM rooms WHERE expires < $1',[now]);
   for(let attempt=0;attempt<6;attempt++){
    const bytes=new Uint8Array(6);crypto.getRandomValues(bytes);const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const code=Array.from(bytes,n=>alphabet[n%alphabet.length]).join('');
    const r=newRoom(code,b.token,name,now);
    const inserted=await db.query('INSERT INTO rooms (code,state,revision,expires) VALUES ($1,$2,0,$3) ON CONFLICT (code) DO NOTHING RETURNING code',[code,JSON.stringify(r),now+EXPIRY_MS]);
    if(inserted.rows.length)return view(r,b.token,now);
   }throw new GameError('Could not create a room. Try again.',503);
  }
  const code=typeof b.code==='string'?b.code.toUpperCase():'';if(!/^[A-Z2-9]{6}$/.test(code))throw new GameError('Enter a valid six-character room code.');
  for(let attempt=0;attempt<24;attempt++){
   const row=(await db.query('SELECT state,revision,expires FROM rooms WHERE code=$1',[code])).rows[0];
   const now=Date.now();if(!row||Number(row.expires)<now)throw new GameError('Room not found or expired. Check the code or create a room.',404);
   const room=apply(JSON.parse(row.state) as Room,b,now);
   const saved=await db.query('UPDATE rooms SET state=$1,revision=revision+1,expires=$2 WHERE code=$3 AND revision=$4 RETURNING code',[JSON.stringify(room),now+EXPIRY_MS,code,row.revision]);
   if(saved.rows.length)return view(room,b.token,now);
   await new Promise(resolve=>setTimeout(resolve,10+Math.random()*40));
  }throw new GameError('Room is busy. Please try again.',503);
 };
}
