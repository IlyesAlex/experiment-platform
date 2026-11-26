const EXPERIMENTS = ['navon','posner','rotation','dichotic','asrt','weather','wisconsin','dilemma'];
const encoder = new TextEncoder();
export const hex = bytes => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2,'0')).join('');
export async function digest(text) { return hex(await crypto.subtle.digest('SHA-256', encoder.encode(text))); }
export async function hashPassword(password, salt = crypto.randomUUID()) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-256'},key,256);
  return `${salt}:${hex(hash)}`;
}
export async function verifyPassword(password, stored) { return equal(await hashPassword(password, stored.split(':')[0]), stored); }
function equal(a,b) { let diff=a.length^b.length; for(let i=0;i<Math.max(a.length,b.length);i++) diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0); return diff===0; }
async function codeHash(env,classId,code) {
  const key = await crypto.subtle.importKey('raw',encoder.encode(env.ROSTER_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return hex(await crypto.subtle.sign('HMAC',key,encoder.encode(`${classId}:${code.trim().toUpperCase()}`)));
}
export function csvCell(value) { const str=String(value??''); return '"'+(/^[\s]*[=+\-@\t\r]/.test(str)?"'"+str:str).replaceAll('"','""')+'"'; }
export function payoff(mine,theirs) { return mine==='cooperate'?(theirs==='cooperate'?3:0):(theirs==='cooperate'?5:1); }
function fail(status,message) { throw Object.assign(new Error(message),{status}); }
function json(data,status=200) { return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}}); }
async function body(request) {
  if(Number(request.headers.get('content-length')||0)>400000) fail(413,'Request too large.');
  const text=await request.text(); if(text.length>400000) fail(413,'Request too large.');
  try{return JSON.parse(text);}catch{fail(400,'Invalid JSON.');}
}
function text(value,min,max,label) { if(typeof value!=='string'||value.length<min||value.length>max) fail(400,`Invalid ${label}.`); return value; }
async function rate(env,key,limit=20) {
  const now=Math.floor(Date.now()/1000);
  const row=await env.DB.prepare('INSERT INTO rate_limits(key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<? THEN 1 ELSE count+1 END,expires=CASE WHEN expires<? THEN excluded.expires ELSE expires END RETURNING count').bind(key,now+900,now,now).first();
  if(row.count>limit) fail(429,'Too many attempts. Try again in 15 minutes.');
}
async function session(request,env,role) {
  const token=(request.headers.get('Authorization')||'').replace(/^Bearer /,'');
  const s=await env.DB.prepare('SELECT * FROM sessions WHERE token_hash=? AND expires>?').bind(await digest(token),Date.now()).first();
  if(!s || (role && s.role!==role)) fail(401,'Please log in again.');
  return s;
}
async function newSession(env,role,classId=null,participantId=null) {
  const token=crypto.randomUUID()+crypto.randomUUID();
  await env.DB.prepare('INSERT INTO sessions VALUES (?,?,?,?,?)').bind(await digest(token),role,classId,participantId,Date.now()+8*3600000).run();
  return {token,role,classId,participantId};
}
async function route(request,env,url) {
  const path=url.pathname,method=request.method;
  if(path==='/api/health') return json({ok:true});
  if(!env.ADMIN_SECRET || !env.ROSTER_SECRET) fail(503,'Backend setup incomplete: configure ADMIN_SECRET and ROSTER_SECRET.');
  if(path==='/api/classes' && method==='GET') {
    return json((await env.DB.prepare('SELECT c.id,c.name,c.starts_at,c.capacity,(SELECT count(*) FROM roster r WHERE r.class_id=c.id AND enrolled_at IS NOT NULL) AS enrolled FROM classes c ORDER BY starts_at').all()).results);
  }
  if(path==='/api/login' && method==='POST') {
    const client=await digest(request.headers.get('CF-Connecting-IP')||'local');
    // A whole classroom may share a campus NAT; throttle credentials separately.
    await rate(env,'login-global:'+client,1000);
    const b=await body(request);
    await rate(env,'login-target:'+client+':'+await digest(`${b.role==='instructor'?'instructor':b.classId+':'+String(b.code).trim().toUpperCase()}`));
    if(b.role==='instructor') {
      if(!equal(await digest(text(b.password,1,256,'password')),await digest(env.ADMIN_SECRET))) fail(401,'Incorrect instructor secret.');
      return json(await newSession(env,'instructor'));
    }
    if(b.consent!==true) fail(400,'Please confirm data collection before joining.');
    const c=await env.DB.prepare('SELECT * FROM classes WHERE id=?').bind(text(b.classId,1,100,'class')).first();
    const hash=await codeHash(env,b.classId,text(b.code,3,12,'Neptun code'));
    const r=await env.DB.prepare('SELECT * FROM roster WHERE class_id=? AND code_hash=?').bind(b.classId,hash).first();
    if(!c || !r || !await verifyPassword(text(b.password,1,256,'password'),c.password_hash)) fail(401,'Class, code or password is incorrect.');
    if(!r.enrolled_at) {
      const result=await env.DB.prepare("UPDATE roster SET enrolled_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE class_id=? AND code_hash=? AND enrolled_at IS NULL AND (SELECT count(*) FROM roster WHERE class_id=? AND enrolled_at IS NOT NULL)<? RETURNING participant_id").bind(c.id,hash,c.id,c.capacity).first();
      if(!result) fail(409,'This class has reached its capacity.');
    }
    return json({...await newSession(env,'student',c.id,r.participant_id),className:c.name});
  }
  const s=await session(request,env);
  if(path==='/api/logout' && method==='POST') {await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(s.token_hash).run();return json({ok:true});}
  if(path==='/api/me') return json({role:s.role,classId:s.class_id,participantId:s.participant_id});
  if(path==='/api/admin/classes' && method==='POST') {
    if(s.role!=='instructor') fail(403,'Instructor access required.');
    const b=await body(request), id=crypto.randomUUID();
    const name=text(b.name.trim(),1,100,'class name'), starts=text(b.startsAt,1,50,'class date');
    if(!Number.isFinite(Date.parse(starts))) fail(400,'Invalid date.');
    if(!Number.isInteger(b.capacity)||b.capacity<1||b.capacity>500) fail(400,'Capacity must be 1–500.');
    const codes=[...new Set(text(b.codes,1,10000,'roster').split(/[\s,;]+/).filter(Boolean).map(x=>x.toUpperCase()))];
    if(codes.length>500||codes.some(x=>!/^[A-Z0-9]{3,12}$/.test(x))) fail(400,'Use 3–12 letters or digits per code, at most 500 students.');
    const password=await hashPassword(text(b.password,12,256,'class password (minimum 12 characters)'));
    await env.DB.batch([env.DB.prepare('INSERT INTO classes(id,name,starts_at,capacity,password_hash) VALUES (?,?,?,?,?)').bind(id,name,starts,b.capacity,password),...await Promise.all(codes.map(async code=>env.DB.prepare('INSERT INTO roster(class_id,code_hash,participant_id) VALUES (?,?,?)').bind(id,await codeHash(env,id,code),crypto.randomUUID())))]);
    return json({id,name,expected:codes.length},201);
  }
  if(path==='/api/admin/roster' && method==='POST') {
    if(s.role!=='instructor') fail(403,'Instructor access required.');
    const b=await body(request), c=await env.DB.prepare('SELECT id FROM classes WHERE id=?').bind(b.classId).first();
    if(!c) fail(404,'Class not found.');
    const codes=[...new Set(text(b.codes,1,10000,'roster').toUpperCase().split(/[\s,;]+/).filter(Boolean))];
    if(codes.length>500||codes.some(x=>!/^[A-Z0-9]{3,12}$/.test(x))) fail(400,'Invalid student codes.');
    await env.DB.batch(await Promise.all(codes.map(async code=>env.DB.prepare('INSERT OR IGNORE INTO roster(class_id,code_hash,participant_id) VALUES (?,?,?)').bind(c.id,await codeHash(env,c.id,code),crypto.randomUUID()))));
    return json({ok:true});
  }
  if(path==='/api/admin/roster' && method==='GET') {
    if(s.role!=='instructor') fail(403,'Instructor access required.');
    return json((await env.DB.prepare('SELECT participant_id,enrolled_at FROM roster WHERE class_id=? ORDER BY enrolled_at DESC').bind(url.searchParams.get('classId')).all()).results);
  }
  if(path==='/api/runs' && method==='POST') {
    if(s.role!=='student') fail(403,'Student access required.');
    const b=await body(request); if(!EXPERIMENTS.includes(b.experiment)||b.experiment==='dilemma') fail(400,'Unknown individual experiment.');
    const id=text(b.id,36,36,'run identifier');
    await env.DB.prepare('INSERT OR IGNORE INTO runs(id,class_id,participant_id,experiment,protocol,metadata) VALUES (?,?,?,?,?,?)').bind(id,s.class_id,s.participant_id,b.experiment,'classroom-1.0',JSON.stringify(b.metadata||{})).run();
    const own=await env.DB.prepare('SELECT * FROM runs WHERE id=?').bind(id).first();
    if(own.participant_id!==s.participant_id||own.class_id!==s.class_id||own.experiment!==b.experiment) fail(409,'Run identifier already in use.');
    return json({id},201);
  }
  if(path==='/api/trials' && method==='POST') {
    const b=await body(request), run=await env.DB.prepare('SELECT * FROM runs WHERE id=? AND class_id=? AND participant_id=?').bind(b.runId,s.class_id,s.participant_id).first();
    if(!run || s.role!=='student') fail(404,'Run not found.');
    if(!Array.isArray(b.trials)||b.trials.length>500||b.trials.some(t=>!Number.isInteger(t.index)||t.index<0||t.index>5000||JSON.stringify(t).length>6000)) fail(400,'Invalid trial batch.');
    await env.DB.batch([...b.trials.map(t=>env.DB.prepare('INSERT OR IGNORE INTO trials(run_id,trial_index,data) VALUES (?,?,?)').bind(run.id,t.index,JSON.stringify(t))),...(b.complete?[env.DB.prepare("UPDATE runs SET completed_at=COALESCE(completed_at,strftime('%Y-%m-%dT%H:%M:%fZ','now')) WHERE id=?").bind(run.id)]:[])]);
    return json({ok:true});
  }
  if(path==='/api/runs' && method==='GET') {
    if(s.role!=='student') fail(403,'Student access required.');
    return json((await env.DB.prepare('SELECT id,experiment,started_at,completed_at,(SELECT count(*) FROM trials WHERE run_id=runs.id) AS trials FROM runs WHERE class_id=? AND participant_id=? ORDER BY started_at DESC').bind(s.class_id,s.participant_id).all()).results);
  }
  if(path==='/api/admin/export') {
    if(s.role!=='instructor') fail(403,'Instructor access required.');
    const classId=url.searchParams.get('classId'); if(!classId) fail(400,'Select a class.');
    const selected=(url.searchParams.get('experiments')||EXPERIMENTS.join(',')).split(',');
    if(selected.some(x=>!EXPERIMENTS.includes(x))) fail(400,'Invalid experiment filter.');
    const after=Number(url.searchParams.get('after')||0); if(!Number.isSafeInteger(after)||after<0) fail(400,'Invalid cursor.');
    const rows=(await env.DB.prepare(`SELECT t.rowid AS cursor,r.id AS run_id,r.class_id,r.participant_id,r.experiment,r.protocol,r.started_at,r.completed_at,r.metadata,t.trial_index,t.data,t.received_at FROM trials t JOIN runs r ON r.id=t.run_id WHERE r.class_id=? AND r.experiment IN (${selected.map(()=>'?').join(',')}) AND t.rowid>? ORDER BY t.rowid LIMIT 1000`).bind(classId,...selected,after).all()).results;
    return json({rows,next:rows.length===1000?rows.at(-1).cursor:null});
  }
  if(path.startsWith('/api/dilemma')) return dilemma(request,env,url,s);
  fail(404,'Endpoint not found.');
}
async function dilemma(request,env,url,s) {
  if(s.role!=='student') fail(403,'Student access required.');
  const now=Date.now(), p=s.participant_id;
  if(url.pathname==='/api/dilemma/join' && request.method==='POST') {
    await env.DB.prepare('UPDATE rooms SET active=0 WHERE active=1 AND created<?').bind(now-30*60000).run();
    let room=await env.DB.prepare('SELECT * FROM rooms WHERE class_id=? AND active=1 AND (p1=? OR p2=?) LIMIT 1').bind(s.class_id,p,p).first();
    if(!room) room=await env.DB.prepare('UPDATE rooms SET p2=? WHERE id=(SELECT id FROM rooms WHERE class_id=? AND active=1 AND p2 IS NULL AND p1<>? ORDER BY created LIMIT 1) AND p2 IS NULL AND NOT EXISTS (SELECT 1 FROM rooms WHERE class_id=? AND active=1 AND (p1=? OR p2=?)) RETURNING *').bind(p,s.class_id,p,s.class_id,p,p).first();
    if(!room) {
      const id=crypto.randomUUID();
      await env.DB.prepare('INSERT OR IGNORE INTO rooms(id,class_id,p1,created) SELECT ?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE class_id=? AND active=1 AND (p1=? OR p2=?))').bind(id,s.class_id,p,now,s.class_id,p,p).run();
      room=await env.DB.prepare('SELECT * FROM rooms WHERE class_id=? AND active=1 AND (p1=? OR p2=?)').bind(s.class_id,p,p).first();
    }
    return json({id:room.id});
  }
  const id=url.searchParams.get('roomId');
  const room=await env.DB.prepare('SELECT * FROM rooms WHERE id=? AND class_id=? AND (p1=? OR p2=?)').bind(id,s.class_id,p,p).first();
  if(!room) fail(404,'Room not found.');
  if(url.pathname==='/api/dilemma/leave' && request.method==='POST') { await env.DB.prepare('UPDATE rooms SET active=0 WHERE id=?').bind(id).run();return json({ok:true}); }
  if(url.pathname==='/api/dilemma/choice' && request.method==='POST') {
    if(!room.active||!room.p2||room.created<now-30*60000) fail(409,'Room is no longer available.');
    const b=await body(request);
    if(!Number.isInteger(b.round)||b.round<1||b.round>10||!['cooperate','defect'].includes(b.choice)||!Number.isFinite(b.rt)||b.rt<0||b.rt>1800000) fail(400,'Invalid choice.');
    if(b.round>1) {const prev=await env.DB.prepare('SELECT count(*) AS n FROM choices WHERE room_id=? AND round=?').bind(id,b.round-1).first();if(prev.n!==2) fail(409,'Wait for the previous round.');}
    await env.DB.prepare('INSERT OR IGNORE INTO choices(room_id,round,participant_id,choice,rt) VALUES (?,?,?,?,?)').bind(id,b.round,p,b.choice,b.rt).run();
  }
  const choices=(await env.DB.prepare('SELECT * FROM choices WHERE room_id=? ORDER BY round').bind(id).all()).results;
  const saved=new Set((await env.DB.prepare('SELECT run_id,trial_index FROM trials WHERE run_id IN (?,?)').bind(`${id}:${room.p1}`,`${id}:${room.p2}`).all()).results.map(t=>`${t.run_id}:${t.trial_index}`));
  const rounds=[];
  for(let n=1;n<=10;n++) {
    const pair=choices.filter(c=>c.round===n);const mine=pair.find(c=>c.participant_id===p), theirs=pair.find(c=>c.participant_id!==p);
    if(mine&&theirs) {
      const score=payoff(mine.choice,theirs.choice); rounds.push({round:n,mine:mine.choice,theirs:theirs.choice,score});
      // Persist both players when a pair is complete, even if one closes their tab.
      // Every read repairs an interrupted materialization; inserts are idempotent.
      for(const [own,partner] of [[mine,theirs],[theirs,mine]]) {
        const runId=`${id}:${own.participant_id}`;
        if(saved.has(`${runId}:${n-1}`)) continue;
        await env.DB.batch([
          env.DB.prepare('INSERT OR IGNORE INTO runs(id,class_id,participant_id,experiment,protocol,metadata) VALUES (?,?,?,?,?,?)').bind(runId,s.class_id,own.participant_id,'dilemma','classroom-1.0',JSON.stringify({roomId:id,rounds:10})),
          env.DB.prepare('INSERT OR IGNORE INTO trials(run_id,trial_index,data) VALUES (?,?,?)').bind(runId,n-1,JSON.stringify({index:n-1,roomId:id,round:n,choice:own.choice,partnerChoice:partner.choice,score:payoff(own.choice,partner.choice),rt:own.rt})),
          ...(n===10?[env.DB.prepare("UPDATE runs SET completed_at=COALESCE(completed_at,strftime('%Y-%m-%dT%H:%M:%fZ','now')) WHERE id=?").bind(runId)]:[])
        ]);
      }
    }
  }
  const next=rounds.length+1;
  return json({id,paired:!!room.p2,active:!!room.active&&room.created>now-30*60000,rounds,submitted:choices.some(c=>c.round===next&&c.participant_id===p),complete:rounds.length===10});
}
export default {
  async fetch(request,env) {
    const url=new URL(request.url);
    if(!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    const origin=request.headers.get('Origin'),allowed=origin===url.origin||origin===env.ALLOWED_ORIGIN||/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin||'');
    const headers={'Vary':'Origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
    if(allowed) Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type'});
    if(origin&&!allowed) return json({error:'Origin is not allowed.'},403);
    if(request.method==='OPTIONS') return new Response(null,{status:204,headers});
    let response;
    try {response=await route(request,env,url);} catch(error) {if(!error.status) console.error('API failure',error.message);response=json({error:error.status?error.message:'The server could not complete this request.'},error.status||500);}
    for(const [k,v] of Object.entries(headers)) response.headers.set(k,v);
    response.headers.set('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'");
    return response;
  },
  async scheduled(_event,env) {await env.DB.batch([env.DB.prepare('DELETE FROM sessions WHERE expires<?').bind(Date.now()),env.DB.prepare('DELETE FROM rate_limits WHERE expires<?').bind(Math.floor(Date.now()/1000))]);}
};
