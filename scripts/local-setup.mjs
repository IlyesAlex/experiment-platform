import {existsSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
if(!existsSync('worker/.dev.vars')){
  writeFileSync('worker/.dev.vars',`# Local development only. Never commit this file.\nADMIN_SECRET=${randomBytes(24).toString('base64url')}\nROSTER_SECRET=${randomBytes(32).toString('base64url')}\n`);
  console.log('Created worker/.dev.vars. Open this ignored file to view your local instructor secret.');
}else console.log('Preserved existing local secrets in worker/.dev.vars.');
