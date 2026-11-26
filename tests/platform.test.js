import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker,{hashPassword,verifyPassword,csvCell,payoff} from '../worker/index.js';
import {schedule} from '../public/experiments.js';

class D1 {
  constructor(){this.db=new DatabaseSync(':memory:');this.db.exec(readFileSync(new URL('../worker/migrations/0001_initial.sql',import.meta.url),'utf8'));}
  prepare(sql){const statement=this.db.prepare(sql);let args=[];const query={bind(...values){args=values;return query;},async first(){return statement.get(...args)||null;},async all(){return {results:statement.all(...args)};},async run(){return statement.run(...args);}};return query;}
  async batch(statements){this.db.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());this.db.exec('COMMIT');return result;}catch(e){this.db.exec('ROLLBACK');throw e;}}
}
let env;
beforeEach(()=>{env={DB:new D1(),ADMIN_SECRET:'a-long-test-admin-secret',ROSTER_SECRET:'test-hmac-secret-is-long-enough',ALLOWED_ORIGIN:'https://ilyesalex.github.io'};});
async function call(path,{token,method='GET',body,origin}={}){
  const response=await worker.fetch(new Request('https://api.test/api'+path,{method,headers:{...(token?{Authorization:'Bearer '+token}:{}),...(origin?{Origin:origin}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env);
  return {status:response.status,data:await response.json(),headers:response.headers};
}
async function admin(){const r=await call('/login',{method:'POST',body:{role:'instructor',password:env.ADMIN_SECRET}});assert.equal(r.status,200);return r.data.token;}
async function create(token,name='TEST-CLASS',codes='TEST1 TEST2 TEST3',capacity=30){const r=await call('/admin/classes',{method:'POST',token,body:{name,codes,capacity,password:'private-class-password',startsAt:'2026-11-26T09:00:00Z'}});assert.equal(r.status,201,JSON.stringify(r.data));return r.data.id;}
async function login(classId,code='TEST1'){return call('/login',{method:'POST',body:{classId,code,password:'private-class-password',consent:true}});}

test('passwords are salted and checked; CSV cells cannot execute formulas',async()=>{const a=await hashPassword('hello');assert.notEqual(a,await hashPassword('hello'));assert.equal(await verifyPassword('hello',a),true);assert.equal(await verifyPassword('wrong',a),false);assert.equal(csvCell('=SUM(A1)'), '"\'=SUM(A1)"');assert.equal(csvCell('a"b'),'"a""b"');});
test('stimulus schedules are reproducible and balanced',()=>{
  for(const id of ['navon','posner','rotation','dichotic','asrt','weather','wisconsin'])assert.deepEqual(schedule(id,32,123),schedule(id,32,123));
  const navon=schedule('navon',32,12);assert.equal(new Set(navon.map(t=>`${t.level}-${t.global}-${t.local}`)).size,8);
  const posner=schedule('posner',32,12);assert.equal(posner.filter(t=>!t.valid).length,8);assert.equal(posner.filter(t=>!t.valid&&t.side==='left').length,4);
  const asrt=schedule('asrt',160,5);assert.equal(asrt.filter(t=>t.patternTrial).length,80);for(let i=0;i<asrt.length;i+=2)assert.equal(asrt[i].location,asrt[0].pattern[(i/2)%4]);
  assert.ok(schedule('weather',100,8).every(t=>t.cards.length>0&&t.cards.length<4&&t.probability>0&&t.probability<1));
});
test('first login confirms enrolment once, capacity is enforced, invalid students denied',async()=>{
  const a=await admin(),c=await create(a,'TEST-CLASS','TEST1 TEST2',1);
  assert.equal((await login(c,'NOPE')).status,401);assert.equal((await login(c)).status,200);assert.equal((await login(c)).status,200);assert.equal((await login(c,'TEST2')).status,409);
  const roster=await call('/admin/roster?classId='+c,{token:a});assert.equal(roster.data.filter(r=>r.enrolled_at).length,1);
  assert.equal(JSON.stringify(roster.data).includes('TEST1'),false);
});
test('classes isolate identical codes, runs, roster and exports; retries do not duplicate trials',async()=>{
  const a=await admin(),c1=await create(a),c2=await create(a,'Other group');const s1=(await login(c1)).data,s2=(await login(c2)).data;
  assert.notEqual(s1.participantId,s2.participantId);
  const id=crypto.randomUUID();assert.equal((await call('/runs',{token:s1.token,method:'POST',body:{id,experiment:'navon'}})).status,201);
  const batch={runId:id,trials:[{index:0,rt:234,correct:true}],complete:true};
  assert.equal((await call('/trials',{token:s2.token,method:'POST',body:batch})).status,404);
  for(let n=0;n<2;n++)assert.equal((await call('/trials',{token:s1.token,method:'POST',body:batch})).status,200);
  const own=await call('/runs',{token:s1.token});assert.equal(own.data[0].trials,1);assert.ok(own.data[0].completed_at);
  assert.equal((await call('/runs',{token:s2.token})).data.length,0);
  assert.equal((await call('/admin/export?classId='+c1,{token:s1.token})).status,403);
  assert.equal((await call('/admin/roster?classId='+c2,{token:s1.token})).status,403);
  assert.equal((await call('/admin/export?classId='+c1,{token:a})).data.rows.length,1);
  assert.equal((await call('/admin/export?classId='+c2,{token:a})).data.rows.length,0);
  assert.equal((await call('/admin/export?classId='+c1+'&experiments=weather',{token:a})).data.rows.length,0);
});
test('roster additions keep enrolment and reject malformed codes',async()=>{const a=await admin(),c=await create(a);await login(c);const added=await call('/admin/roster',{token:a,method:'POST',body:{classId:c,codes:'TEST1 TEST4'}});assert.equal(added.status,200);const r=await call('/admin/roster?classId='+c,{token:a});assert.equal(r.data.length,4);assert.equal(r.data.filter(x=>x.enrolled_at).length,1);});
test('multiplayer matches only within class and seals choices until both submit',async()=>{
  const a=await admin(),c1=await create(a),c2=await create(a,'Another class');const p1=(await login(c1)).data,p2=(await login(c1,'TEST2')).data,p3=(await login(c2)).data;
  const join=token=>call('/dilemma/join',{method:'POST',token,body:{}});
  const room=(await join(p1.token)).data.id,other=(await join(p3.token)).data.id;assert.notEqual(room,other);assert.equal((await join(p2.token)).data.id,room);
  assert.equal((await call('/dilemma/state?roomId='+room,{token:p3.token})).status,404);
  for(let round=1;round<=10;round++){
    assert.equal((await call('/dilemma/choice?roomId='+room,{method:'POST',token:p1.token,body:{round,choice:'cooperate',rt:500}})).status,200);
    const sealed=await call('/dilemma/state?roomId='+room,{token:p2.token});assert.equal(sealed.data.rounds.length,round-1);assert.equal(sealed.data.submitted,false);
    const reveal=await call('/dilemma/choice?roomId='+room,{method:'POST',token:p2.token,body:{round,choice:'defect',rt:700}});assert.equal(reveal.status,200);assert.equal(reveal.data.rounds.at(-1).score,5);
  }
  const final=await call('/dilemma/state?roomId='+room,{token:p1.token});assert.equal(final.data.complete,true);assert.equal(final.data.rounds.reduce((s,r)=>s+r.score,0),0);
  assert.equal((await call('/runs',{token:p1.token})).data[0].trials,10);
  const rows=(await call('/admin/export?classId='+c1+'&experiments=dilemma',{token:a})).data.rows;assert.equal(rows.length,20);
  assert.equal(payoff('defect','cooperate'),5);assert.equal(payoff('cooperate','cooperate'),3);
});
test('untrusted origins, missing sessions and brute force attempts are blocked',async()=>{
  assert.equal((await call('/classes',{origin:'https://evil.test'})).status,403);
  assert.equal((await call('/runs')).status,401);
  for(let i=0;i<20;i++)await call('/login',{method:'POST',body:{role:'instructor',password:'wrong'}});
  assert.equal((await call('/login',{method:'POST',body:{role:'instructor',password:'wrong'}})).status,429);
});
