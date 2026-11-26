import {API_BASE} from './config.js';
import {experiments,illustration,runExperiment,initAudio,playTone} from './experiments.js';
const $=s=>document.querySelector(s), app=$('#app');
let auth=JSON.parse(sessionStorage.getItem('lab-auth')||'null'), controller, pollTimer, currentRoom, filter='All';
let pending=null, uploadChain=Promise.resolve();
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=s=>new Date(s).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
function toast(message){$('#toast').textContent=message;$('#toast').style.display='block';setTimeout(()=>$('#toast').style.display='none',5000);}
async function api(path,options={}) {
  let response;
  try{response=await fetch(API_BASE+path,{...options,headers:{'Content-Type':'application/json',...(auth?{Authorization:`Bearer ${auth.token}`} :{}),...options.headers}});}catch{throw new Error('Cannot reach the class server. Check your connection and backend configuration.');}
  const data=await response.json().catch(()=>({error:'Backend unavailable. Configure the Cloudflare API URL in public/config.js.'}));
  if(!response.ok)throw new Error(data.error||'Request failed.');return data;
}
const post=(path,body)=>api(path,{method:'POST',body:JSON.stringify(body)});
function setAuth(value){auth=value;if(value)sessionStorage.setItem('lab-auth',JSON.stringify(value));else sessionStorage.removeItem('lab-auth');$('#account').textContent=auth?'Sign out':'Join a class';}
function download(name,data,type='text/csv;charset=utf-8'){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
const button=(id,label,secondary=false)=>`<button id="${id}" class="button ${secondary?'secondary':''}">${label}</button>`;
function errorPanel(error){return `<div class="notice error">${escape(error.message)}</div>`;}
function home(){
  app.innerHTML=`<section class="hero"><div><div class="section-label">YOUR MIND. UNDER THE MICROSCOPE.</div><h1>Don’t just study cognition.<br>Experience it.</h1><p>A hands-on space to explore attention, perception, learning, and the decisions that make us human.</p><a class="button light" href="#experiments" id="explore">Explore the experiments</a></div><div class="hero-art" aria-hidden="true"><div class="orbit"><div class="orbit-core">✳</div><div class="orbit-node"></div></div><span class="hero-tag">SMALL EXPERIMENTS. BIG QUESTIONS.</span></div></section><div class="metrics"><span class="metric"><strong>08</strong> classic experiments</span><span class="metric"><strong>04</strong> areas of cognition</span><span class="metric"><strong>01</strong> shared class workspace</span></div><section id="experiments"><div class="section-top"><div><div class="section-label">THE EXPERIMENT LIBRARY</div><h2>A little curiosity goes a long way.</h2><p>Choose a task. Test a theory. Discover something about yourself.</p></div><div class="filters" aria-label="Filter experiments">${['All','Attention','Perception','Learning','Social'].map(x=>`<button class="filter ${filter===x?'active':''}" data-filter="${x}" aria-pressed="${filter===x}">${x}</button>`).join('')}</div></div><div class="grid">${experiments.filter(e=>filter==='All'||filter===e.category).map(e=>`<a class="experiment-card" href="#/task/${e.id}"><div class="card-art ${e.color}" aria-hidden="true">${illustration(e.id)}</div><div class="card-content"><span class="eyebrow">${e.category}</span><h3>${e.name}</h3><p>${e.description}</p><div class="card-bottom"><span>${e.duration} · ${e.id==='dilemma'?'2 players':'Individual'}</span><strong>Explore task</strong></div></div></a>`).join('')}</div></section><aside class="notice"><strong>A classroom, connected.</strong><span>Join with your class password and Neptun code to save your results. Each class has its own workspace. You can try individual tasks in practice mode before joining.</span></aside>`;
  $('#explore').onclick=e=>{e.preventDefault();$('#experiments').scrollIntoView({behavior:'smooth'});};
  document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;home();$('#experiments').scrollIntoView({block:'start'});});
}
function taskPage(id){
  const e=experiments.find(x=>x.id===id);if(!e){app.innerHTML='<h1>Task not found</h1>';return;}
  app.innerHTML=`<a class="back" href="#/">Back to experiments</a><div class="section-label" style="margin-top:30px">${e.category.toUpperCase()} · ${e.duration.toUpperCase()}</div><h1 class="page-title">${e.name}</h1><p class="muted">${e.description}</p><div class="detail-layout"><div><div class="panel"><h2>What are we exploring?</h2><p>${e.intro}</p><h2>Before you begin</h2><p>${e.instructions}</p>${id==='dichotic'?`<div class="actions">${button('audio-left','Test left ear',true)}${button('audio-right','Test right ear',true)}</div><label class="check" style="margin-top:18px"><input id="audio-confirm" type="checkbox"> I hear each test in the correct ear using stereo headphones.</label>`:''}<div class="actions" style="margin-top:25px">${button('start',id==='dilemma'?'Find a classmate':'Start saved session')}${id!=='dilemma'?button('practice','Try practice',true):''}</div><p id="task-error" class="form-error" role="alert"></p></div><div class="notice">Use a quiet environment and keep this tab visible. Timing depends on your browser and device. These are teaching tasks, not clinical assessments.</div></div><aside><div class="panel"><div class="card-art ${e.color}" style="border-radius:7px;margin-bottom:25px">${illustration(id)}</div><h2>Original research</h2><p class="reference">${e.reference}</p><a href="${e.url}" target="_blank" rel="noopener noreferrer">Read the article</a><p class="protocol">${e.protocol}</p></div></aside></div>`;
  const start=async practice=>{try{
    if(pending&&!practice)throw new Error('Save or download the pending results before starting another saved session. Visit My class.');
    if(id==='dichotic'){if(!$('#audio-confirm').checked)throw new Error('Please check both headphone channels first.');await initAudio();}
    if(!practice&&auth?.role!=='student'){await showLogin();return;}
    if(id==='dilemma')await startDilemma();else await startTask(e,practice);
  }catch(error){const target=$('#task-error');if(target)target.textContent=error.message;else toast(error.message);}};
  $('#start').onclick=()=>start(false);if($('#practice'))$('#practice').onclick=()=>start(true);
  if(id==='dichotic'){ $('#audio-left').onclick=()=>playTone('low',null).catch(e=>toast(e.message));$('#audio-right').onclick=()=>playTone(null,'high').catch(e=>toast(e.message)); }
}
function checkpoint(){if(!pending)return;try{sessionStorage.setItem('lab-pending',JSON.stringify(pending));}catch{toast('Browser storage is full. Keep this tab open and download your results.');}}
async function flush(complete=false){
  const p=pending;if(!p||!p.trials.length)return;
  if(p.participantId!==auth?.participantId||p.classId!==auth?.classId)throw new Error('Sign back into the class that owns these pending results.');
  const snapshot=p.trials.slice();await post('/api/trials',{runId:p.runId,trials:snapshot,complete});
  p.saved=snapshot.length;checkpoint();
}
async function startTask(e,practice){
  const runId=crypto.randomUUID();
  if(!practice){await post('/api/runs',{id:runId,experiment:e.id,metadata:{userAgent:navigator.userAgent,screen:[screen.width,screen.height],language:navigator.language,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,consentVersion:'classroom-1.0'}});pending={runId,experiment:e.id,classId:auth.classId,participantId:auth.participantId,trials:[],saved:0,complete:false};checkpoint();}
  controller=new AbortController();
  app.innerHTML=`<a id="exit-task" class="back" href="#/task/${e.id}">Exit task</a><h1 class="page-title">${e.name}</h1><div class="task-progress"><span id="trial-count">Getting ready</span><span>${practice?'Practice · results are not saved':'Class session · saving to your class'}</span></div><progress id="trial-progress" max="1" value="0"></progress><div id="stage" class="task-stage" tabindex="0"></div><p class="muted" style="font-size:13px">Keep this tab visible. Press the indicated keys or use the response buttons.</p>`;
  $('#exit-task').onclick=event=>{event.preventDefault();render();};
  $('#stage').focus();
  try{await runExperiment({id:e.id,practice,stage:$('#stage'),signal:controller.signal,onTrial:t=>{
    if(!practice){pending.trials.push(t);checkpoint();if(pending.trials.length%5===0)uploadChain=uploadChain.catch(()=>{}).then(()=>flush()).catch(error=>{if(pending){pending.lastError=error.message;checkpoint();}});}
  },onFinish:async results=>{
    const valid=results.filter(t=>!t.visibilityInterrupted&&!t.anticipation),mean=valid.filter(t=>t.correct&&t.rt!==null),accuracy=Math.round(results.filter(t=>t.correct).length/results.length*100);
    if(!practice){pending.complete=true;checkpoint();await uploadChain.catch(()=>{});try{await flush(true);pending=null;sessionStorage.removeItem('lab-pending');}catch(error){toast(error.message);}}
    const stage=$('#stage');if(!stage)return;
    stage.innerHTML=`<div class="section-label">${practice?'PRACTICE COMPLETE':'SESSION COMPLETE'}</div><h2>Thanks for taking part.</h2><div class="metrics"><span class="metric"><strong>${accuracy}%</strong> correct</span><span class="metric"><strong>${mean.length?Math.round(mean.reduce((s,t)=>s+t.rt,0)/mean.length):'—'}</strong> mean RT (ms)</span></div><p>${practice?'Practice results were not added to the class database.':pending?'Results are pending upload. Retry from My class before closing this tab.':'Your responses are saved to your class workspace.'}</p><div class="actions"><a class="button" href="#/class">My class</a><a id="back-task" class="button secondary" href="#/task/${e.id}">Back to task</a></div>`;
    $('#back-task').onclick=event=>{event.preventDefault();render();};
  }});}catch(error){toast(error.message);}
}
async function showLogin(){
  const dialog=$('#login'),select=$('#login-form select');$('#login-form .form-error').textContent='';
  try{const classes=await api('/api/classes');select.innerHTML=classes.map(c=>`<option value="${c.id}">${escape(c.name)} · ${date(c.starts_at)} · ${c.enrolled}/${c.capacity}</option>`).join('');if(!classes.length)throw new Error('No classes yet. Your instructor can create the first class from the Instructor page.');dialog.showModal();}catch(error){toast(error.message);}
}
$('#close-login').onclick=()=>$('#login').close();
$('#login-form').onsubmit=async event=>{event.preventDefault();const form=event.currentTarget,b=Object.fromEntries(new FormData(form));const submit=form.querySelector('button[type=submit],button:not([type])');submit.disabled=true;try{setAuth(await post('/api/login',{...b,consent:!!b.consent}));form.reset();$('#login').close();location.hash='/class';await render();}catch(error){form.querySelector('.form-error').textContent=error.message;}finally{submit.disabled=false;}};
$('#account').onclick=async()=>{if(auth){try{await api('/api/logout',{method:'POST'});}catch{}setAuth(null);location.hash='/';render();}else showLogin();};
async function classPage(){
  if(!auth||auth.role!=='student'){app.innerHTML=`<div class="panel"><div class="section-label">YOUR CLASS WORKSPACE</div><h1 class="page-title">A place to learn together.</h1><p>Join your class with its password and your approved Neptun code. Your first login confirms your place.</p>${button('join','Join a class')}</div>`;$('#join').onclick=showLogin;return;}
  app.innerHTML=`<div class="section-label">YOUR CLASS WORKSPACE</div><h1 class="page-title">${escape(auth.className||'My class')}</h1><p class="muted">Participant <span class="mono">${escape(auth.participantId.slice(0,8))}</span> · Your class enrolment is confirmed.</p>${pending?`<div class="panel"><h2>Results waiting to save</h2><p>${pending.trials.length} responses from ${escape(pending.experiment)} are stored in this browser tab.</p><div class="actions">${button('retry','Retry upload')}${button('local','Download backup',true)}${button('discard','Clear local backup',true)}</div></div>`:''}<div class="panel"><h2>Your sessions</h2><div id="runs">Loading sessions…</div></div>`;
  if(pending){$('#retry').onclick=async()=>{try{await flush(pending.complete);pending=null;sessionStorage.removeItem('lab-pending');toast('Responses saved.');classPage();}catch(e){toast(e.message);}};$('#local').onclick=()=>download(`pending-${pending.runId}.json`,JSON.stringify(pending,null,2),'application/json');$('#discard').onclick=()=>{if(confirm('Clear this local backup? Any responses not uploaded will be lost.')){pending=null;sessionStorage.removeItem('lab-pending');classPage();}};}
  try{const runs=await api('/api/runs');if(!$('#runs'))return;$('#runs').innerHTML=runs.length?`<div class="table-wrap"><table><thead><tr><th>Experiment</th><th>Started</th><th>Trials saved</th><th>Status</th></tr></thead><tbody>${runs.map(r=>`<tr><td>${escape(experiments.find(e=>e.id===r.experiment)?.name)}</td><td>${date(r.started_at)}</td><td>${r.trials}</td><td>${r.completed_at?'Complete':'Partial'}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Your first discovery is waiting. <a href="#/">Explore the experiments</a>.</div>';}catch(error){if($('#runs'))$('#runs').innerHTML=errorPanel(error);}
}
async function instructorPage(){
  if(auth?.role!=='instructor'){
    app.innerHTML=`<div class="panel" style="max-width:520px;margin:30px auto"><div class="section-label">INSTRUCTOR ACCESS</div><h1 class="page-title">Your classroom, organized.</h1><p>Create independent classes, invite expected students and export experiment data.</p><form id="admin-login"><label>Instructor secret<input name="password" type="password" autocomplete="current-password" required></label><p class="form-error" role="alert"></p><button class="button">Sign in</button></form></div>`;
    $('#admin-login').onsubmit=async e=>{e.preventDefault();try{setAuth(await post('/api/login',{role:'instructor',password:new FormData(e.currentTarget).get('password')}));instructorPage();}catch(error){$('#admin-login .form-error').textContent=error.message;}};return;
  }
  let classes;try{classes=await api('/api/classes');}catch(error){app.innerHTML=errorPanel(error);return;}
  app.innerHTML=`<div class="section-label">INSTRUCTOR WORKSPACE</div><h1 class="page-title">Set up the next discovery.</h1><p class="muted">Every class has a separate roster, password, dataset and multiplayer pool.</p><div class="detail-layout"><div><div class="panel"><h2>Create a class</h2><p>Paste the expected students. Their first successful login confirms enrolment.</p><form id="create-class"><div class="fields"><label>Class name<input name="name" value="${classes.length?'':'TEST-CLASS'}" required maxlength="100" placeholder="Cognitive psychology · Group A"></label><label>Class date and time<input name="startsAt" type="datetime-local" required></label><label>Maximum students<input name="capacity" type="number" value="30" min="1" max="500" required></label><label>Secret class password<input name="password" type="password" required minlength="12" maxlength="256" autocomplete="new-password" placeholder="At least 12 characters"></label></div><label>Expected Neptun codes<textarea name="codes" required placeholder="One code per line, or separated by commas">${classes.length?'':'TEST1\nTEST2\nTEST3'}</textarea></label><p class="form-error" role="alert"></p><button class="button">Create independent class</button></form></div><div class="panel"><h2>Classes & enrolment</h2><label>Choose a class<select id="admin-class">${classes.map(c=>`<option value="${c.id}">${escape(c.name)} · ${date(c.starts_at)} · ${c.enrolled}/${c.capacity} confirmed</option>`).join('')}</select></label><div id="roster"></div><form id="add-roster"><label>Add expected students<textarea name="codes" required placeholder="Paste additional codes"></textarea></label><button class="button secondary" ${classes.length?'':'disabled'}>Add to this class</button></form></div></div><aside><div class="panel"><h2>Download class data</h2><p>Exports include trial responses, timing, protocol details and pseudonymous participant IDs. Class selection applies to every export.</p><label class="check"><input id="select-all" type="checkbox" checked> Select all experiments</label><div class="export-checks">${experiments.map(e=>`<label class="check"><input class="export-exp" type="checkbox" value="${e.id}" checked>${e.name}</label>`).join('')}</div><div class="actions">${button('export-csv','Download CSV')}${button('export-json','JSON',true)}</div><p id="export-status" role="status" class="muted"></p></div><div class="panel"><h2>Access & privacy</h2><p>Share each class password privately. Expected codes are stored as class-specific keyed hashes. Exports use participant IDs rather than raw Neptun codes.</p><p>A code plus a shared class password is classroom access, not verified university identity. Use separate passwords for separate groups.</p></div></aside></div>`;
  const local=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);$('#create-class [name=startsAt]').value=local;
  $('#create-class').onsubmit=async event=>{event.preventDefault();const form=event.currentTarget,b=Object.fromEntries(new FormData(form)),submit=form.querySelector('button');submit.disabled=true;try{await post('/api/admin/classes',{...b,capacity:Number(b.capacity),startsAt:new Date(b.startsAt).toISOString()});toast('Class created. Expected students can now confirm by logging in.');instructorPage();}catch(error){form.querySelector('.form-error').textContent=error.message;submit.disabled=false;}};
  async function roster(){if(!classes.length){$('#roster').innerHTML='<p>Create your first class above.</p>';return;}try{const rows=await api('/api/admin/roster?classId='+$('#admin-class').value);$('#roster').innerHTML=`<p><strong>${rows.length}</strong> expected · <strong>${rows.filter(r=>r.enrolled_at).length}</strong> confirmed · <strong>${rows.filter(r=>!r.enrolled_at).length}</strong> pending</p><details><summary>Participant status</summary><div class="table-wrap"><table><thead><tr><th>Participant ID</th><th>Confirmation</th></tr></thead><tbody>${rows.map(r=>`<tr><td class="mono">${r.participant_id.slice(0,8)}</td><td>${r.enrolled_at?date(r.enrolled_at):'Awaiting first login'}</td></tr>`).join('')}</tbody></table></div></details><p class="muted">Codes are hidden after import. Re-adding a code safely keeps its existing enrolment.</p>`;}catch(error){toast(error.message);}}
  $('#admin-class').onchange=roster;roster();
  $('#add-roster').onsubmit=async e=>{e.preventDefault();try{await post('/api/admin/roster',{classId:$('#admin-class').value,codes:new FormData(e.currentTarget).get('codes')});e.target.reset();roster();toast('Expected students added.');}catch(error){toast(error.message);}};
  $('#select-all').onchange=e=>document.querySelectorAll('.export-exp').forEach(c=>c.checked=e.target.checked);
  document.querySelectorAll('.export-exp').forEach(c=>c.onchange=()=>{$('#select-all').checked=[...document.querySelectorAll('.export-exp')].every(x=>x.checked);});
  $('#export-csv').onclick=()=>exportData('csv');$('#export-json').onclick=()=>exportData('json');
}
function csvCell(value){let s=typeof value==='object'&&value!==null?JSON.stringify(value):String(value??'');if(/^\s*[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
async function exportData(format){
  const selected=[...document.querySelectorAll('.export-exp:checked')].map(x=>x.value),classId=$('#admin-class').value;
  if(!classId||!selected.length){toast('Choose a class and at least one experiment.');return;}
  $('#export-csv').disabled=$('#export-json').disabled=true;
  try{let cursor=0,rows=[];do{const page=await api(`/api/admin/export?classId=${classId}&experiments=${selected.join(',')}&after=${cursor}`);rows.push(...page.rows);cursor=page.next;$('#export-status').textContent=`Collected ${rows.length} trials…`;}while(cursor!==null);
    const parsed=rows.map(({data,metadata,cursor,...r})=>({...r,metadata:JSON.parse(metadata),...JSON.parse(data)}));
    if(format==='json')download(`class-${classId}-${Date.now()}.json`,JSON.stringify(parsed,null,2),'application/json');
    else {const headers=[...new Set(parsed.flatMap(Object.keys))];download(`class-${classId}-${Date.now()}.csv`,'\uFEFF'+[headers.map(csvCell).join(','),...parsed.map(row=>headers.map(h=>csvCell(row[h])).join(','))].join('\r\n'));}
    $('#export-status').textContent=`Downloaded ${rows.length} trials from this class.`;
  }catch(error){$('#export-status').textContent=error.message;}finally{$('#export-csv').disabled=$('#export-json').disabled=false;}
}
async function startDilemma(){
  const joined=await post('/api/dilemma/join',{});currentRoom=joined.id;controller=new AbortController();const signal=controller.signal;let previousRound=0,onset=performance.now();
  app.innerHTML=`<a id="exit-task" class="back" href="#/task/dilemma">Exit multiplayer session</a><h1 class="page-title">Prisoner’s dilemma</h1><div id="multiplayer" class="task-stage"><p>Finding a classmate…</p></div><p class="muted">Choices are revealed when both players submit. Leaving ends this room for both players.</p>`;
  $('#exit-task').onclick=event=>{event.preventDefault();render();};
  const poll=async()=>{if(signal.aborted)return;try{
    const state=await api('/api/dilemma/state?roomId='+currentRoom);if(signal.aborted)return;
    const stage=$('#multiplayer');if(!stage)return;
    if(!state.active&&!state.complete){stage.innerHTML='<h2>The room has ended.</h2><p>Your partner left or the room expired. You can start a new session from the task page.</p>';return;}
    if(!state.paired){stage.innerHTML='<div class="section-label">CLASS WAITING ROOM</div><h2>Waiting for a classmate.</h2><p>Ask another student from your class to join this task. You will be paired automatically.</p>';}
    else if(state.complete){stage.innerHTML=`<div class="section-label">TEN ROUNDS COMPLETE</div><h2>You earned ${state.rounds.reduce((s,r)=>s+r.score,0)} points.</h2><p>All ten rounds have been saved to your class.</p><a class="button" href="#/class">My class</a>`;return;}
    else {
      const round=state.rounds.length+1;if(round!==previousRound){onset=performance.now();previousRound=round;}
      const last=state.rounds.at(-1);
      stage.innerHTML=`<div class="section-label">ROUND ${round} OF 10</div>${last?`<p>Last round: you chose ${last.mine}, your partner chose ${last.theirs}. You earned ${last.score} points.</p>`:''}<h2>${state.submitted?'Choice sealed. Waiting for your partner.':'What will you choose?'}</h2><p>Total: ${state.rounds.reduce((s,r)=>s+r.score,0)} points</p>${state.submitted?'':`<div class="actions">${button('cooperate','Cooperate')}${button('defect','Defect',true)}</div>`}<p class="muted">Together: 3 each · Both defect: 1 each · Lone defector: 5, cooperator: 0</p>`;
      for(const choice of ['cooperate','defect'])if($('#'+choice))$('#'+choice).onclick=async()=>{stage.querySelectorAll('button').forEach(b=>b.disabled=true);try{await post('/api/dilemma/choice?roomId='+currentRoom,{round,choice,rt:Math.round(performance.now()-onset)});await poll();}catch(error){toast(error.message);}};
    }
    clearTimeout(pollTimer);pollTimer=setTimeout(poll,2000);
  }catch(error){if(!signal.aborted){toast(error.message);pollTimer=setTimeout(poll,4000);}}};await poll();
}
async function render(){
  controller?.abort();clearTimeout(pollTimer);
  if(currentRoom){const room=currentRoom;currentRoom=null;post('/api/dilemma/leave?roomId='+room,{}).catch(()=>{});}
  const path=location.hash.replace(/^#/,'')||'/';
  document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===(path.startsWith('/instructor')?'instructor':path.startsWith('/class')?'class':'lab')));
  window.scrollTo(0,0);
  if(path.startsWith('/task/'))taskPage(path.split('/')[2]);else if(path==='/class')await classPage();else if(path==='/instructor')await instructorPage();else home();
}
try{pending=JSON.parse(sessionStorage.getItem('lab-pending')||'null');}catch{}
window.addEventListener('hashchange',()=>render().catch(e=>toast(e.message)));
window.addEventListener('beforeunload',event=>{if(pending?.trials.length||currentRoom){event.preventDefault();event.returnValue='';}});
setAuth(auth);render().catch(e=>{app.innerHTML=errorPanel(e);});
