import {spawn} from 'node:child_process';
import {dirname,join} from 'node:path';
import {writeFileSync,appendFileSync,readFileSync} from 'node:fs';
const npm=join(dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');let server;
const tasks=(process.env.R21_FINAL_TASKS||'unit,build,all,remaining,merge,store-regression').split(',');
async function run(label,args,env={}){const log=`docs/content/r21/${label}-test.txt`;writeFileSync(log,'');console.log('EXECUTED '+label);const p=spawn(process.execPath,args,{env:{...process.env,...env},windowsHide:true});for(const s of [p.stdout,p.stderr])s.on('data',b=>{appendFileSync(log,b);process.stdout.write(b);});const code=await new Promise((r,j)=>{p.on('exit',r);p.on('error',j);});if(code!==0)throw Error(label+' failed '+code);console.log('VERIFIED '+label);}
async function preview(port){server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{windowsHide:true,stdio:'ignore'});const expected=readFileSync('dist/index.html','utf8');for(let n=0;n<100;n++){if(server.exitCode!==null)throw Error('preview exited; port may be owned by another line: '+port);try{const r=await fetch(`http://127.0.0.1:${port}/`);if(r.ok&&(await r.text())===expected)return;}catch{}await new Promise(r=>setTimeout(r,100));}throw Error('preview not ready '+port);}
async function stop(){if(server){const p=server;server=null;const ended=new Promise(r=>p.on('exit',r));p.kill();await ended;}}
try{
 if(tasks.includes('unit'))await run('unit',[npm,'test']);if(tasks.includes('build'))await run('build',[npm,'run','build']);
 await preview(5286);
 if(tasks.includes('all'))await run('all',['scripts/check-content-r21.mjs'],{R21_SCOPE:'all',R21_COURSES:'cake,crossing,tickets'});
 if(tasks.includes('remaining'))await run('remaining',['scripts/run-content-r21-validation.mjs'],{R21_SCOPES:'offline,store,negative,performance'});
 if(tasks.includes('performance'))await run('performance',['scripts/measure-content-r21.mjs']);
 if(tasks.includes('merge'))await run('merge',[npm,'run','test:merge'],{EVIDENCE_FOLDER:'docs/content/r21/merge',SCREENSHOT_FOLDER:'docs/content/r21/merge/screens'});
 await stop();await preview(5113);
 if(tasks.includes('store-regression'))await run('store-regression',[npm,'run','test:store'],{BASE_URL:'http://127.0.0.1:5113/',EVIDENCE_FOLDER:'docs/content/r21/store-regression',SCREENSHOT_FOLDER:'docs/content/r21/store-regression/screens'});
}finally{await stop();}
