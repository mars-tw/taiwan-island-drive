// Execute existing regression assertions unchanged; redirect historical artifacts only.
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const folder='docs/evidence/deep-r1',out='output/playwright/r8-regression';await mkdir(out,{recursive:true});
const names=['check-art-r7.mjs','check-acceptance-r7.mjs','check-car-framing-r7.mjs','check-mobile-keyboard-r7.mjs','check-mobile.mjs','check-reachability.mjs','run-flight-layout.mjs'];
let rows=[];
if(process.env.R8_RESUME==='1')try{rows=JSON.parse(await readFile(folder+'/regressions.json','utf8')).rows.filter(r=>r.exitCode===0);}catch{}
for(const name of names){
 const original=await readFile('scripts/'+name,'utf8');
 if(rows.some(r=>r.script==='scripts/'+name&&r.sha256===createHash('sha256').update(original).digest('hex'))){console.log('Retained verified assertions: '+name);continue;}
 const source=original.replaceAll('docs/art',out+'/art').replaceAll('docs/store/screenshots',out+'/screenshots');
 const file=out+'/'+name;await writeFile(file,source);await mkdir(out+'/art/evidence/r7',{recursive:true});
 const result=await new Promise(resolve=>{let log='';const child=spawn(process.execPath,[file],{env:{...process.env,BASE_URL:'http://127.0.0.1:5286/',PLAYWRIGHT_MODULE:process.env.PLAYWRIGHT_MODULE||'C:/Users/digimkt/Desktop/遊戲/storm-apocalypse/node_modules/playwright/index.mjs',EVIDENCE_FOLDER:out+'/'+name.replace('.mjs','')},windowsHide:true});child.stdout.on('data',b=>{log+=b;process.stdout.write(b);});child.stderr.on('data',b=>{log+=b;process.stdout.write(b);});child.on('close',code=>resolve({code,log}));});
 await writeFile(folder+'/'+name.replace('.mjs','.txt'),result.log);
 rows.push({script:'scripts/'+name,sha256:createHash('sha256').update(original).digest('hex'),assertions:'Unchanged; only artifact directory literals redirected',exitCode:result.code,log:folder+'/'+name.replace('.mjs','.txt')});await writeFile(folder+'/regressions.json',JSON.stringify({status:rows.every(r=>r.exitCode===0)&&rows.length===names.length?'VERIFIED':'BLOCKED',rows},null,2));
 if(result.code!==0)process.exit(result.code||1);
}
