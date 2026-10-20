import {spawn} from 'node:child_process';
import {writeFileSync,appendFileSync} from 'node:fs';
const commands=[['layout',['scripts/check-content-r21.mjs'],{R21_SCOPE:'layout'}],['offline',['scripts/check-content-r21.mjs'],{R21_SCOPE:'offline'}],['store',['scripts/check-content-r21.mjs'],{R21_SCOPE:'store'}],['negative',['scripts/check-content-r21-negative.mjs'],{}],['performance',['scripts/measure-content-r21.mjs'],{}]];
for(const [scope,args,env] of commands.filter(([scope])=>!process.env.R21_SCOPES||process.env.R21_SCOPES.split(',').includes(scope))){
 const path=`docs/content/r21/${scope}-test.txt`;writeFileSync(path,'');console.log('EXECUTED '+scope);
 const child=spawn(process.execPath,args,{env:{...process.env,...env,R21_COURSES:'cake,crossing,tickets'},windowsHide:true});for(const s of [child.stdout,child.stderr])s.on('data',b=>{appendFileSync(path,b);process.stdout.write(b);});const code=await new Promise((r,j)=>{child.on('exit',r);child.on('error',j);});if(code!==0)throw Error(scope+' failed: '+code);console.log('VERIFIED '+scope);
}
