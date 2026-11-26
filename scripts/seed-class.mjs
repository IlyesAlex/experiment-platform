// Hidden stdin allows deployment recovery without shell arguments or secret files.
if(process.stdin.isTTY)process.stdin.setRawMode(true);
process.stdin.setEncoding('utf8');process.stdin.resume();console.log('Ready for class setup JSON on stdin (input hidden).');
let buffer='';
process.stdin.on('data',async chunk=>{
  buffer+=chunk;if(!buffer.includes('\n'))return;
  process.stdin.pause();if(process.stdin.isTTY)process.stdin.setRawMode(false);
  try{
    const {origin,adminSecret,classPassword}=JSON.parse(buffer.trim());
    if(new URL(origin).protocol!=='https:')throw new Error('HTTPS required.');
    async function request(path,body,token){const res=await fetch(origin+'/api'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await res.json();if(!res.ok)throw new Error(data.error);return data;}
    const auth=await request('/login',{role:'instructor',password:adminSecret});
    const classes=await request('/classes');let created=classes.find(c=>c.name==='TEST-CLASS');
    if(!created)created=await request('/admin/classes',{name:'TEST-CLASS',startsAt:new Date().toISOString(),capacity:30,codes:'TEST1 TEST2 TEST3',password:classPassword},auth.token);
    const roster=await request('/admin/roster?classId='+created.id,undefined,auth.token);
    await request('/logout',{},auth.token);
    console.log(JSON.stringify({origin,classId:created.id,name:'TEST-CLASS',expected:roster.length,confirmed:roster.filter(r=>r.enrolled_at).length}));
    process.exit(0);
  }catch(error){console.error(error.message);process.exit(1);}
});
