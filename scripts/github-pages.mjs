// Uses Git Credential Manager for this exact GitHub host. Never prints credentials.
import {spawnSync} from 'node:child_process';
const mode=process.argv[2],origin=process.argv[3];
if(!['configure','status','inspect'].includes(mode))throw new Error('Usage: node scripts/github-pages.mjs configure <Worker URL> | status | inspect');
const credential=spawnSync('git',['credential','fill'],{input:'protocol=https\nhost=github.com\n\n',encoding:'utf8',env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'Never'}});
if(credential.status!==0)throw new Error('No GitHub credential available. Sign in through Git Credential Manager first.');
const token=credential.stdout.match(/^password=(.+)$/m)?.[1];if(!token)throw new Error('GitHub credential not found.');
const base='https://api.github.com/repos/IlyesAlex/experiment-platform';
async function request(path,method='GET',data){const response=await fetch(base+path,{method,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});const body=await response.text();let value;try{value=JSON.parse(body);}catch{value={};}if(!response.ok)throw Object.assign(new Error(`GitHub ${method} ${path}: ${response.status} ${value.message||''}`),{status:response.status});return value;}
if(mode==='inspect'){
  const repo=await request('');console.log(JSON.stringify({repository:repo.full_name,branch:repo.default_branch,permissions:repo.permissions}));
}else if(mode==='configure'){
  const parsed=new URL(origin);if(parsed.protocol!=='https:'||parsed.origin!==origin)throw new Error('Provide the HTTPS Worker origin.');
  try{await request('/actions/variables/CLOUDFLARE_API_URL','PATCH',{name:'CLOUDFLARE_API_URL',value:origin});}catch(error){if(error.status!==404)throw error;await request('/actions/variables','POST',{name:'CLOUDFLARE_API_URL',value:origin});}
  let pages;try{pages=await request('/pages');if(pages.build_type!=='workflow')pages=await request('/pages','PUT',{build_type:'workflow'});}catch(error){if(error.status!==404)throw error;pages=await request('/pages','POST',{build_type:'workflow'});}
  console.log(JSON.stringify({pages:pages.html_url,api:origin}));
}else{
  const runs=await request('/actions/workflows/pages.yml/runs?per_page=3');console.log(JSON.stringify(runs.workflow_runs.map(r=>({id:r.id,status:r.status,conclusion:r.conclusion,url:r.html_url,sha:r.head_sha})),null,2));
}
