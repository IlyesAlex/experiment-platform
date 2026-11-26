import {writeFileSync} from 'node:fs';
const input=process.env.API_URL;
if(!input)throw new Error('Set repository variable CLOUDFLARE_API_URL to the deployed Cloudflare Worker URL.');
const url=new URL(input);
if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new Error('Use an HTTPS Worker origin with no path, credentials or query.');
writeFileSync('public/config.js',`// Public API origin; contains no secrets.\nexport const API_BASE = ${JSON.stringify(url.origin)};\n`);
