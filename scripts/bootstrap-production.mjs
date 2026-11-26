// One-time bootstrap. Credentials stay in process memory and are sent via stdin.
// Do not rerun after enrolling real students: ROSTER_SECRET must remain stable.
import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const secrets={ADMIN_SECRET:randomBytes(24).toString('base64url'),ROSTER_SECRET:randomBytes(32).toString('base64url')};
const classPassword='Test-'+randomBytes(15).toString('base64url');
console.log('BOOTSTRAP_CREDENTIALS='+JSON.stringify({adminSecret:secrets.ADMIN_SECRET,rosterSecret:secrets.ROSTER_SECRET,classPassword}));
function wrangler(args,input){const r=spawnSync(process.execPath,[resolve('node_modules/wrangler/bin/wrangler.js'),...args,'--config','worker/wrangler.jsonc'],{input,encoding:'utf8',env:{...process.env,CI:'true'},maxBuffer:5*1024*1024});console.error(r.stdout||'');console.error(r.stderr||'');if(r.status!==0)throw new Error(`Wrangler command failed (${args[0]}); preserve the bootstrap credentials before retrying.`);return r.stdout;}
wrangler(['d1','migrations','apply','DB','--remote']);
const existing=JSON.parse(wrangler(['d1','execute','DB','--remote','--json','--command','SELECT count(*) AS n FROM classes']));
if(existing[0].results[0].n>0)throw new Error('Bootstrap refused: classes already exist. Preserve ROSTER_SECRET and use normal deployment.');
wrangler(['secret','bulk'],JSON.stringify(secrets));
const output=wrangler(['deploy']);
const origin=output.match(/https:\/\/experiment-platform-api\.[a-z0-9-]+\.workers\.dev/i)?.[0];
if(!origin)throw new Error('Read the Worker URL from the deployment output.');
async function request(path,body,token){const res=await fetch(origin+'/api'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await res.json();if(!res.ok)throw new Error(data.error);return data;}
const auth=await request('/login',{role:'instructor',password:secrets.ADMIN_SECRET});
const classes=await request('/classes');
let created=classes.find(c=>c.name==='TEST-CLASS');
if(!created)created=await request('/admin/classes',{name:'TEST-CLASS',startsAt:new Date().toISOString(),capacity:30,codes:'TEST1 TEST2 TEST3',password:classPassword},auth.token);
await request('/logout',{},auth.token);
console.log('BOOTSTRAP_RESULT='+JSON.stringify({origin,classId:created.id,name:'TEST-CLASS',expected:['TEST1','TEST2','TEST3']}));
