export const experiments = [
  {id:'navon',name:'Navon',category:'Attention',color:'',duration:'3–4 min',trials:32,description:'See the bigger picture. Explore how global and local features compete for your attention.',intro:'Identify a large letter or the small letters that compose it. Comparing congruent and incongruent trials illustrates interference across levels of visual processing.',instructions:'The cue says GLOBAL or LOCAL. Press H or S to identify the letter at that level. Ignore the other level. Respond as quickly and accurately as possible.',reference:'Navon, D. (1977). Forest before trees: The precedence of global features in visual perception. Cognitive Psychology, 9, 353–383.',url:'https://doi.org/10.1016/0010-0285(77)90012-3',protocol:'32 factorially balanced trials: global/local × H/S × congruent/incongruent. 500 ms fixation; response deadline 3 s. Classroom adaptation.'},
  {id:'posner',name:'Posner cueing',category:'Attention',color:'violet',duration:'3–4 min',trials:32,description:'Follow the cue. Discover how spatial attention changes the speed of your responses.',intro:'A central arrow usually predicts where a target will appear. Compare responses when the cue is valid versus invalid to explore covert spatial attention.',instructions:'Keep your eyes on the central +. An arrow cues a side. Press F for a target in the left box or J for a target in the right box. Respond to the target, not to the arrow.',reference:'Posner, M. I. (1980). Orienting of attention. Quarterly Journal of Experimental Psychology, 32, 3–25.',url:'https://doi.org/10.1080/00335558008248231',protocol:'32 trials: 24 valid and 8 invalid, balanced target side. 500 ms fixation, 200 ms central cue, 100 ms gap; 3 s target deadline.'},
  {id:'rotation',name:'Mental rotation',category:'Perception',color:'blue',duration:'3–4 min',trials:32,description:'Turn it over in your mind. Compare shapes across different angles and orientations.',intro:'Decide whether a rotated shape matches a reference or is its mirror image. Angular disparity can influence the time needed to make this judgement.',instructions:'Compare the two shapes. Press F if they are the SAME shape at different rotations, or J if they are MIRRORED. Size and position do not matter.',reference:'Shepard, R. N., & Metzler, J. (1971). Mental rotation of three-dimensional objects. Science, 171, 701–703.',url:'https://doi.org/10.1126/science.171.3972.701',protocol:'32 balanced trials: 0°, 60°, 120°, 180° × same/mirrored. Asymmetric 2D polygons, rather than the original 3D objects. 6 s response deadline.'},
  {id:'dichotic',name:'Dichotic listening',category:'Attention',color:'peach',duration:'3–4 min',trials:24,description:'Tune in to one ear. Listen selectively while two sounds compete at the same time.',intro:'Different tones are delivered simultaneously to the left and right headphone channels. Attend to the cued ear and identify its pitch. This demonstrates dichotic selective listening using tones rather than speech.',instructions:'Use stereo headphones. Check left and right audio below. Each trial cues LEFT or RIGHT; listen to that ear, then press F for LOW (300 Hz) or J for HIGH (800 Hz). Keep the volume comfortable.',reference:'Cherry, E. C. (1953). Some experiments on the recognition of speech, with one and with two ears. Journal of the Acoustical Society of America, 25, 975–979.',url:'https://doi.org/10.1121/1.1907229',protocol:'24 balanced ear × pitch × competing-pitch trials. 500 ms stereo tones; 4 s response deadline. Tone-based teaching adaptation, not the original speech-shadowing protocol.'},
  {id:'asrt',name:'ASRT',category:'Learning',color:'yellow',duration:'3–5 min',trials:160,description:'Find the rhythm without trying. Experience how the mind learns hidden regularities.',intro:'The alternating serial reaction time task interleaves a repeating four-element sequence with random locations. Learning is reflected in performance across high- and low-probability triplets.',instructions:'Press D, F, J or K to match the highlighted circle from left to right. Work quickly and accurately. There are four blocks, with short rests.',reference:'Howard, J. H., Jr., & Howard, D. V. (1997). Age differences in implicit learning of higher order dependencies in serial patterns. Psychology and Aging, 12, 634–656.',url:'https://doi.org/10.1037/0882-7974.12.4.634',protocol:'4 × 40 trials, alternating counterbalanced 4-location permutation and random locations. 120 ms response-to-stimulus interval, 3 s deadline. Exports pattern/random, triplet probability, repetitions and trills.'},
  {id:'weather',name:'Weather prediction',category:'Learning',color:'blue',duration:'4–5 min',trials:60,description:'Make a forecast. Learn uncertain relationships between cards and tomorrow’s weather.',intro:'Each card combination predicts sun or rain with a particular probability. Use feedback to learn the associations even though no prediction is always correct.',instructions:'Look at the cards, then press F to predict SUN or J to predict RAIN. The feedback shows the sampled weather. Some outcomes will remain surprising.',reference:'Knowlton, B. J., Squire, L. R., & Gluck, M. A. (1994). Probabilistic classification learning in amnesia. Learning & Memory, 1, 106–120.',url:'https://doi.org/10.1101/lm.1.2.106',protocol:'60 trials; 14 nonempty card subsets excluding all four; summed log-odds weights [−1.5, −0.5, 0.5, 1.5]. Sampled outcome feedback; exports actual probability and optimal response. Teaching adaptation, not the original stimulus schedule.'},
  {id:'wisconsin',name:'Wisconsin card sorting',category:'Learning',color:'rose',duration:'4–6 min',trials:64,description:'Rethink the rule. Adapt your strategy as the sorting principle quietly changes.',intro:'Sort cards using feedback to discover a hidden rule. The rule changes after a run of correct responses, demonstrating cognitive flexibility and set shifting.',instructions:'Match the current card to one of four reference cards using keys 1–4. Infer the rule from “Correct” or “Try another rule” feedback. The rule may change without warning.',reference:'Berg, E. A. (1948). A simple objective technique for measuring flexibility in thinking. Journal of General Psychology, 39, 15–22.',url:'https://doi.org/10.1080/00221309.1948.9918159',protocol:'64 trials; color, shape or number rule switches after 6 consecutive correct responses. Four reference cards. Classroom card-sorting adaptation; not the standardized clinical WCST.'},
  {id:'dilemma',name:'Prisoner’s dilemma',category:'Social',color:'teal',duration:'3–6 min',trials:10,description:'Cooperate or compete? Play a real classmate and explore the dynamics of trust.',intro:'Two classmates independently choose whether to cooperate or defect. Choices are hidden until both players submit. Your decisions influence both players’ outcomes over ten rounds.',instructions:'Join the waiting room to pair with another student in your class. Choose COOPERATE or DEFECT each round. Both cooperate: 3 points each. Both defect: 1 each. A lone defector earns 5, and the cooperator earns 0. Rooms expire after 30 minutes.',reference:'Lave, L. B. (1962). An empirical approach to the Prisoners’ Dilemma game. Quarterly Journal of Economics, 76, 424–436.',url:'https://doi.org/10.2307/1879629',protocol:'10 rounds with a real classmate; server-sealed choices, fixed payoff matrix (R=3,T=5,P=1,S=0), class-scoped pairing. No simulated partners.'}
];
export function rng(seed) {let a=seed>>>0;return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export function shuffle(items,random) {const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function schedule(id,count,seed) {
  const random=rng(seed),pick=a=>a[Math.floor(random()*a.length)];let result=[];
  if(id==='navon') for(let i=0;i<count;i++){const global=i%2?'H':'S',congruent=Math.floor(i/2)%2===0;result.push({global,local:congruent?global:global==='H'?'S':'H',level:Math.floor(i/4)%2?'local':'global',congruent});}
  if(id==='posner') for(let i=0;i<count;i++){const side=i%2?'left':'right',valid=Math.floor(i/2)%4!==0;result.push({side,valid,cue:valid?side:side==='left'?'right':'left'});}
  if(id==='rotation') for(let i=0;i<count;i++) result.push({angle:[0,60,120,180][i%4],mirrored:Math.floor(i/4)%2===0});
  if(id==='dichotic') for(let i=0;i<count;i++){const ear=i%2?'left':'right',pitch=Math.floor(i/2)%2?'high':'low',congruent=Math.floor(i/4)%2===0;result.push({ear,pitch,otherPitch:congruent?pitch:pitch==='high'?'low':'high',congruent});}
  if(id==='asrt') {
    const pattern=shuffle([0,1,2,3],random);
    for(let i=0;i<count;i++){const patternTrial=i%2===0,location=patternTrial?pattern[Math.floor(i/2)%4]:Math.floor(random()*4);result.push({location,patternTrial,pattern,block:Math.floor(i/40)+1});}
    result.forEach((t,i)=>{if(i%40<2){t.triplet='unclassified';return;}const a=result[i-2].location,b=result[i-1].location;t.repetition=a===b&&b===t.location;t.trill=a===t.location&&a!==b;t.triplet=pattern[(pattern.indexOf(a)+1)%4]===t.location?'high':'low';});
    return result;
  }
  if(id==='weather') for(let i=0;i<count;i++){const mask=1+Math.floor(random()*14),cards=[0,1,2,3].filter(n=>mask&(1<<n)),probability=1/(1+Math.exp(-cards.reduce((sum,c)=>sum+[-1.5,-.5,.5,1.5][c],0)));result.push({cards,probability,outcome:random()<probability?'sun':'rain',optimal:probability===.5?'either':probability>.5?'sun':'rain'});}
  if(id==='wisconsin') for(let i=0;i<count;i++) result.push({color:Math.floor(random()*4),shape:Math.floor(random()*4),number:1+Math.floor(random()*4)});
  return ['navon','posner','rotation','dichotic'].includes(id)?shuffle(result,random):result;
}
export function illustration(id) {
  return ({navon:'<div class="mini-navon">H   H\nH   H\nHHHHH\nH   H\nH   H</div>',posner:'<div class="visual-posner"><span class="visual-box"></span><span>+</span><span class="visual-box">●</span></div>',rotation:'<div><span class="rotation-glyph">F</span><span class="rotation-glyph">F</span></div>',dichotic:'<div class="headphones"></div>',asrt:'<div class="dots"><i></i><i></i><i></i><i></i></div>',weather:'<div class="mini-cards"><i>☀</i><i>☂</i><i>◇</i></div>',wisconsin:'<div class="mini-cards"><i>▲</i><i>●</i><i>✚</i></div>',dilemma:'<div class="players"><span>♙</span><small>+</small><span>♙</span></div>'})[id];
}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
const colors=['#bd4141','#358254','#326ac0','#9a6cbb'],shapes=['▲','★','✚','●'];
function card(t) {return `<div class="shape-card" style="color:${colors[t.color]}">${Array(t.number).fill(shapes[t.shape]).join(' ')}</div>`;}
function polygon(angle=0,mirror=false) {return `<svg class="rotation" viewBox="0 0 140 140" aria-label="Asymmetric polygon"><g transform="translate(70 70) rotate(${angle}) scale(${mirror?-1:1} 1)"><path d="M-36 -43 H0 V-18 H30 V12 H0 V40 H-23 V-18 H-36 Z" fill="#316757" stroke="#173f33" stroke-width="2"/></g></svg>`;}
let audio;
export async function initAudio(){audio ||= new AudioContext();await audio.resume();if(audio.state!=='running')throw new Error('Audio could not start. Please enable sound.');}
export async function playTone(left,right,duration=.5){await initAudio();const start=audio.currentTime+.03;for(const [channel,pitch] of [left,right].entries()){if(!pitch)continue;const oscillator=audio.createOscillator(),gain=audio.createGain(),merger=audio.createChannelMerger(2);oscillator.frequency.value=pitch==='high'?800:300;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.12,start+.02);gain.gain.setValueAtTime(.12,start+duration-.03);gain.gain.linearRampToValueAtTime(0,start+duration);oscillator.connect(gain);gain.connect(merger,0,channel);merger.connect(audio.destination);oscillator.start(start);oscillator.stop(start+duration);}}
export async function runExperiment({id,practice,stage,onTrial,onFinish,signal}) {
  const exp=experiments.find(e=>e.id===id),seed=crypto.getRandomValues(new Uint32Array(1))[0];
  const trials=schedule(id,practice?(id==='asrt'?16:8):exp.trials,seed),results=[];
  let ruleIndex=0,streak=0,ruleChanges=0;const rules=['color','shape','number'];
  const alive=()=>{if(signal.aborted)throw new DOMException('Stopped','AbortError');};
  const set=html=>{alive();stage.innerHTML=html;};
  async function respond(options,deadline){
    await frame();alive();const onset=performance.now();let hidden=document.hidden;
    return new Promise((resolve,reject)=>{
      let timer;const visibility=()=>{hidden=true;};
      const finish=response=>{clearTimeout(timer);window.removeEventListener('keydown',keydown);stage.removeEventListener('click',click);document.removeEventListener('visibilitychange',visibility);signal.removeEventListener('abort',abort);resolve({response,rt:response?Math.round((performance.now()-onset)*100)/100:null,hidden});};
      const abort=()=>{finish(null);reject(new DOMException('Stopped','AbortError'));};
      const keydown=e=>{if(!e.repeat&&options.includes(e.key.toLowerCase())){e.preventDefault();finish(e.key.toLowerCase());}};
      const click=e=>{const key=e.target.closest('[data-response]')?.dataset.response;if(options.includes(key))finish(key);};
      window.addEventListener('keydown',keydown);stage.addEventListener('click',click);document.addEventListener('visibilitychange',visibility);signal.addEventListener('abort',abort,{once:true});timer=setTimeout(()=>finish(null),deadline);
    });
  }
  const buttons=arr=>`<div class="response-buttons">${arr.map(([key,label])=>`<button class="button secondary" data-response="${key}"><span class="key">${key.toUpperCase()}</span>${label}</button>`).join('')}</div>`;
  try {
    for(let i=0;i<trials.length;i++){
      alive();const t=trials[i];document.querySelector('#trial-count').textContent=`${practice?'Practice · ':''}Trial ${i+1} of ${trials.length}`;document.querySelector('#trial-progress').value=i/trials.length;
      if(id==='asrt'&&i>0&&i%40===0){set('<h2>Take a short break.</h2><p>Keep using D, F, J and K to match the circles.</p>'+buttons([[' ','Continue']]));await respond([' '],120000);}
      if(id!=='asrt'){set('<span class="stimulus">+</span>');await pause(500);alive();}
      let correctKey,options,deadline=3000;
      if(id==='navon'){
        const patterns={H:['10001','10001','11111','10001','10001'],S:['11111','10000','11111','00001','11111']};
        const letter=patterns[t.global].map(row=>[...row].map(c=>c==='1'?t.local:' ').join('')).join('\n');
        set(`<div class="section-label">${t.level.toUpperCase()}</div><div class="navon-stimulus">${letter}</div>`+buttons([['h','H'],['s','S']]));options=['h','s'];correctKey=t[t.level].toLowerCase();
      }
      if(id==='posner'){
        const view=center=>`<div class="posner-stage"><span class="posner-box"></span><span>${center}</span><span class="posner-box"></span></div>`;
        set(view(t.cue==='left'?'←':'→'));await pause(200);set(view('+'));await pause(100);
        set(`<div class="posner-stage"><span class="posner-box">${t.side==='left'?'●':''}</span><span>+</span><span class="posner-box">${t.side==='right'?'●':''}</span></div>`+buttons([['f','Left'],['j','Right']]));options=['f','j'];correctKey=t.side==='left'?'f':'j';
      }
      if(id==='rotation'){set(`<div class="cards-row">${polygon()}${polygon(t.angle,t.mirrored)}</div>`+buttons([['f','Same'],['j','Mirrored']]));options=['f','j'];correctKey=t.mirrored?'j':'f';deadline=6000;}
      if(id==='dichotic'){
        set(`<h2>Attend ${t.ear.toUpperCase()}</h2><p>Listen to the cued ear.</p>`);await pause(500);alive();
        set(`<h2>${t.ear.toUpperCase()} EAR</h2>`+buttons([['f','Low pitch'],['j','High pitch']]));
        await playTone(t.ear==='left'?t.pitch:t.otherPitch,t.ear==='right'?t.pitch:t.otherPitch);options=['f','j'];correctKey=t.pitch==='low'?'f':'j';deadline=4000;
      }
      if(id==='asrt'){set(`<div class="cards-row">${['D','F','J','K'].map((key,n)=>`<div class="asrt-circle ${t.location===n?'active':''}">${key}</div>`).join('')}</div>`+buttons([['d','1'],['f','2'],['j','3'],['k','4']]));options=['d','f','j','k'];correctKey=options[t.location];}
      if(id==='weather'){set(`<div class="cards-row">${t.cards.map(c=>`<div class="shape-card">${['◆','●','▲','★'][c]}</div>`).join('')}</div>`+buttons([['f','Sun'],['j','Rain']]));options=['f','j'];correctKey=t.outcome==='sun'?'f':'j';deadline=6000;}
      if(id==='wisconsin'){
        t.rule=rules[ruleIndex%3];t.ruleChanges=ruleChanges;
        set(`<div class="cards-row">${[0,1,2,3].map(n=>`<div>${card({color:n,shape:n,number:n+1})}<span class="key">${n+1}</span></div>`).join('')}</div><p>Sort this card</p>${card(t)}`+buttons([['1','Pile 1'],['2','Pile 2'],['3','Pile 3'],['4','Pile 4']]));options=['1','2','3','4'];correctKey=String(t.rule==='number'?t.number:t[t.rule]+1);deadline=8000;
      }
      const response=await respond(options,deadline);alive();const correct=response.response===correctKey;
      const result={...t,index:i,seed,response:response.response,correct,rt:response.rt,visibilityInterrupted:response.hidden,anticipation:response.rt!==null&&response.rt<100,device:matchMedia('(pointer:coarse)').matches?'touch':'keyboard-or-mouse',recordedAt:new Date().toISOString()};
      if(id==='wisconsin'){streak=correct?streak+1:0;result.streak=streak;result.ruleChangedAfter=streak===6;if(streak===6){streak=0;ruleIndex++;ruleChanges++;}}
      results.push(result);onTrial(result);
      if(id==='weather'){set(`<h2>${t.outcome==='sun'?'☀ Sun':'☂ Rain'}</h2><p>${correct?'Your prediction matched.':'Your prediction did not match.'}</p>`);await pause(800);}
      else if(id==='wisconsin'||practice){set(`<h2 class="${correct?'success':'error'}">${!response.response?'Too slow':correct?'Correct':id==='wisconsin'?'Try another rule':'Incorrect'}</h2>`);await pause(450);}
      else {set('<span class="stimulus">+</span>');await pause(id==='asrt'?120:180);}
    }
    alive();document.querySelector('#trial-progress').value=1;await onFinish(results,{seed});
  }catch(error){if(error.name!=='AbortError')throw error;}
}
