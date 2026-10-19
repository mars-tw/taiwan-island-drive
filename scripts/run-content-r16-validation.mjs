import {spawn} from 'node:child_process';
import {writeFileSync,appendFileSync} from 'node:fs';
for(const scope of (process.env.R16_SCOPES||'layout,all,negative,state,store,offline').split(',')){
 const log=`docs/content/r16/${scope}-test.txt`;writeFileSync(log,'');console.log(`EXECUTED ${scope}: starting headless validation`);
 const child=spawn(process.execPath,['scripts/check-content-r16.mjs'],{env:{...process.env,R16_SCOPE:scope,R16_OUT:scope==='offline'?'docs/content/r16/offline':scope==='layout'?'docs/content/r16/layout-proof':'docs/content/r16'},windowsHide:true});
 for(const stream of [child.stdout,child.stderr])stream.on('data',b=>{appendFileSync(log,b);process.stdout.write(b);});
 const code=await new Promise((resolve,reject)=>{child.on('exit',resolve);child.on('error',reject);});if(code!==0)throw Error(`${scope} failed (${code}); see ${log}`);
 console.log(`VERIFIED ${scope}`);
}
