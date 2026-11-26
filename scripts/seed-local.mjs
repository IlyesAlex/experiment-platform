import {readFileSync} from 'node:fs';
const origin='http://127.0.0.1:8787';
const secret=readFileSync('worker/.dev.vars','utf8').match(/^ADMIN_SECRET=(.+)$/m)?.[1].trim();
if(!secret)throw new Error('Run node scripts/local-setup.mjs first.');
async function request(path,body,token){const res=await fetch(origin+'/api'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await res.json();if(!res.ok)throw new Error(data.error);return data;}
const auth=await request('/login',{role:'instructor',password:secret});
const classes=await request('/classes');
if(!classes.some(c=>c.name==='TEST-CLASS')){
  const created=await request('/admin/classes',{name:'TEST-CLASS',startsAt:new Date().toISOString(),capacity:30,codes:'TEST1 TEST2 TEST3',password:'Local-class-test-2026!'},auth.token);
  console.log('Created local TEST-CLASS with 3 expected students; no enrolments yet.');
}else console.log('Preserved existing TEST-CLASS.');
await request('/logout',{},auth.token);
