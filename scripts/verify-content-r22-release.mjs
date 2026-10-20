import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile,stat,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='docs/content/r22',baseline='22b0ecaae4d4f88e125b22bc2baa48562f57ad9c';
const hash=b=>createHash('sha256').update(b).digest('hex'),json=async p=>JSON.parse(await readFile(p,'utf8'));
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
assert.equal(git('branch','--show-current'),'r1-fun-polish');
for(const p of ['package.json','package-lock.json'])assert.equal((await json(p)).version,'2.34.0');
assert.equal((await json('public/models/catalog.json')).visualVersion,'2.34.0');
assert.match(await readFile('src/games/car/config.js','utf8'),/APP_VERSION = '2\.34\.0'/);
assert.match(await readFile('android/app/build.gradle','utf8'),/versionCode 30/);
assert.equal([...(await readFile('ios/App/App.xcodeproj/project.pbxproj','utf8')).matchAll(/CURRENT_PROJECT_VERSION = 30/g)].length,2);
const runs=await Promise.all(['browser.json','layout/browser.json','offline/browser.json','store/browser.json'].map(p=>json(`${root}/${p}`))),images=new Map();
for(const run of runs){assert.equal(run.status,'VERIFIED');for(const key of ['errors','http','external'])assert.deepEqual(run[key],[]);for(const s of run.shots){const b=await readFile(s.path);assert.equal(hash(b),s.sha256,s.path);assert.equal(b.readUInt32BE(16),s.width);assert.equal(b.readUInt32BE(20),s.height);assert.doesNotMatch(s.proof.text,/\?{3}/);images.set(s.path,s);}}
for(const kind of ['cake','crossing','tickets'])for(const r of [runs[0],runs[2]])assert.ok(r.rows.some(x=>x.label.startsWith(`${kind} three stops`)));
const get=n=>{const s=images.get(`${root}/phone-${n}.png`);assert.ok(s,n);assert.equal(s.width,390);assert.equal(s.height,844);return s;};
const selection=[
 ['cake-stage-2-wrong','第二站轉錯彎：四鍵仍可選，短句只談轉彎'],
 ['cake-stage-2-centre-62','同站回中央62%：主畫面與特寫一起偏右'],
 ['cake-stage-2-centre-80','同站回中央80%：兩處蛋糕同步扶正'],
 ['cake-stage-2-centre-100','同站回中央100%：蛋糕、草莓與旗子回正'],
 ['cake-stage-3-restart','第三站在路旁休息區停穩後，實際重新起步'],
 ['crossing-stage-2-right-first','第二站右先看：固定動作按鈕，已看狀態分開顯示'],
 ['crossing-stage-3-recheck','第三站新來車：左側待確認，右側看過，提示一致'],
 ['crossing-stage-3-2-start','同一位3號奶奶起步：已到岸1/3'],
 ['crossing-stage-3-2-middle','奶奶仍在斑馬線：已到岸仍1/3'],
 ['crossing-stage-3-2-pavement','奶奶踏上對岸：同一人物勾選、計數2/3與提示同步'],
 ['tickets-stage-2-boarding-1','第二站按住陪小安上車；地名、無人物編號、車門對齊1號牌'],
 ['tickets-stage-2-boarding-2','同一乘客連續上車第二格；唯一已入座進度、同伴仍在候車區'],
 ['tickets-stage-3-boarding-2','第三站隊形不同，車門對齊2號牌，人物旁顯示上車中'],
 ['tickets-stage-3-step-out','同站同門：三人入座，寬踏階仍伸出，需先收階'],
 ['tickets-stage-3-step-in','同站同門：階面及引導標籤收回，才出現關門']
];
await mkdir(`${root}/review-set`,{recursive:true});const review=[];
for(const [i,[name,purpose]] of selection.entries()){const s=get(name),path=`${root}/review-set/${String(i+1).padStart(2,'0')}-${name}.png`;await copyFile(s.path,path);assert.equal(hash(await readFile(path)),s.sha256);review.push({path,source:s.path,purpose,width:390,height:844,sha256:s.sha256});}
assert.equal((await readdir(`${root}/review-set`)).length,15);
await writeFile(`${root}/review-set-manifest.json`,JSON.stringify({status:'VERIFIED',count:15,perCourse:5,method:'Byte-identical phone originals; no scaling, added labels or collage',images:review},null,2));
const comparisons=[];
for(const [kind,old,current] of [['cake','phone-cake-stage-2-recovery-2','cake-stage-2-centre-80'],['crossing','phone-crossing-stage-3-grandma-3','crossing-stage-3-2-pavement'],['tickets','phone-tickets-stage-3-step-out','tickets-stage-3-step-out']]){
 const baselinePath=`docs/content/r21/${old}.png`,before=`${root}/before-${kind}.png`,after=`${root}/after-${kind}.png`;
 const b=execFileSync('git',['show',`${baseline}:${baselinePath}`],{maxBuffer:12*1024*1024});await writeFile(before,b);await copyFile(get(current).path,after);comparisons.push({baseline,baselinePath,before,beforeSha256:hash(b),after,afterSha256:get(current).sha256});
}
await writeFile(`${root}/before-after.json`,JSON.stringify({status:'VERIFIED',method:'Unmodified Git baseline captures compared to current UI; not synchronized pixel differences',comparisons},null,2));
const cake=[62,80,100].map(n=>get(`cake-stage-2-centre-${n}`));
assert.deepEqual(cake.map(s=>+s.proof.text.match(/回中央 (\d+)%/)[1]),[62,80,100]);
assert.equal(cake[2].state.balanceLean,'0.00');assert.ok(cake.every(s=>s.state.distance===cake[0].state.distance));
for(let stage=1;stage<=3;stage++)for(let friend=1;friend<=3;friend++){
 const frames=['start','middle','pavement'].map(n=>get(`crossing-stage-${stage}-${friend}-${n}`));
 assert.equal(frames[0].state.person,frames[2].state.person);assert.equal(frames[1].proof.progress,`已到對岸 ${friend-1}/3 人`);assert.equal(frames[2].proof.progress,`已到對岸 ${friend}/3 人`);assert.match(frames[2].hint,/到對岸了/);
}
for(const s of runs[0].shots.filter(s=>s.state?.doorStage&&s.path.includes('tickets'))){assert.match(s.proof.counts,/^已入座 [0-3]\/3 人$/);assert.doesNotMatch(s.proof.text,/\d [小安晴宇]/);}
const aligns=runs[0].rows.filter(x=>x.label.includes('door alignment'));assert.equal(aligns.length,3);assert.ok(aligns.every(x=>x.errorPx<=20));
const extended=get('tickets-stage-3-step-out'),retracted=get('tickets-stage-3-step-in');assert.ok(extended.proof.step.width>=100&&extended.proof.step.height>=54);assert.equal(retracted.proof.step,null);
assert.ok(!extended.proof.controls.some(x=>x.id==='close-door'));assert.ok(retracted.proof.controls.some(x=>x.id==='close-door'));
for(const [w,h] of [[1290,2796],[2064,2752]])assert.ok(runs[3].shots.some(s=>s.width===w&&s.height===h));
const cleanup=await json(`${root}/cleanup-result.json`);assert.equal(cleanup.status,'EXECUTED');for(const f of cleanup.files)assert.equal(await stat(f.path).then(()=>true,()=>false),false);for(const f of cleanup.retained)assert.equal(hash(await readFile(f.path)),f.sha256,f.path);
const oldTests=git('ls-tree','-r','--name-only',baseline,'tests').split('\n'),integrity=[];
for(const path of oldTests){const expected=git('rev-parse',`${baseline}:${path}`),actual=execFileSync('git',['hash-object','--path',path,'--stdin'],{input:await readFile(path),encoding:'utf8'}).trim();assert.equal(actual,expected,path);integrity.push({path,baselineBlob:expected,currentBlob:actual});}
await writeFile(`${root}/test-source-integrity.json`,JSON.stringify({status:'VERIFIED',existingUnchanged:integrity.length,files:integrity},null,2));
const sources=['src/shared/content-r22.js','src/shared/content-r22-scene.js','src/shared/content-r22.css','src/shared/content-r1-ui.js','src/games/car/config.js','public/models/catalog.json','package.json','package-lock.json','android/app/build.gradle','ios/App/App.xcodeproj/project.pbxproj'];
await writeFile(`${root}/source-manifest.json`,JSON.stringify({status:'VERIFIED',files:await Promise.all(sources.map(async path=>({path,sha256:hash(await readFile(path))})))},null,2));
await writeFile(`${root}/art-manifest.json`,JSON.stringify({status:'VERIFIED',newGenerationCalls:0,newRuntimeAssets:0,tool:null,method:'Reuse managed R7 cake layers, existing character poses, R21 generated boarding step. Code changes pose, size and UI only; no procedural character/background art.',files:await Promise.all(['public/art/content-r21/boarding-step.webp',...['base','middle','top','pick'].map(x=>`public/art/content-r7/cake-${x}.png`)].map(async path=>({path,sha256:hash(await readFile(path))})))},null,2));
await writeFile(`${root}/screenshots.json`,JSON.stringify({status:'VERIFIED',count:images.size,images:[...images.values()]},null,2));
const acceptance={status:'VERIFIED',cake: cake.map(s=>({path:s.path,lean:s.state.balanceLean,fill:s.proof.text.match(/回中央 \d+%/)[0]})),crossing:'9 named friends: start/middle/pavement, no early count, same identity and synchronous arrival text',doorAlignment:aligns,step:{extended:extended.path,retracted:retracted.path,width:extended.proof.step.width,height:extended.proof.step.height},reviewSet:review};
await writeFile(`${root}/acceptance.json`,JSON.stringify(acceptance,null,2));
if(process.env.R22_EVIDENCE_ONLY==='1'){console.log(JSON.stringify({status:'VERIFIED',evidenceOnly:true,images:images.size,review:15}));process.exit(0);}
const negative=await json(`${root}/negative/checks.json`),perf=await json(`${root}/performance.json`),merge=await json(`${root}/merge/merge-path.json`),store=await json(`${root}/store-regression/review-path.json`),scan=await json(`${root}/secret-scan.json`);
assert.equal(negative.status,'VERIFIED');assert.equal(scan.hits,0);
assert.equal(perf.status,'VERIFIED');assert.equal(perf.rows.length,9);assert.ok(perf.rows.every(x=>x.p95<=18));
for(const r of [merge,store]){assert.deepEqual(r.errors,[]);assert.deepEqual(r.externalRequests,[]);for(const row of r.rows)assert.deepEqual(row.problems,[]);}
assert.equal(merge.rows.length,132);assert.equal(store.rows.length,101);
assert.match(await readFile(`${root}/unit-test.txt`,'utf8'),/pass 267/);assert.match(await readFile(`${root}/unit-test.txt`,'utf8'),/fail 0/);assert.match(await readFile(`${root}/build-test.txt`,'utf8'),/built in/);
const proof={status:'VERIFIED',baseline,branch:'r1-fun-polish',version:'2.34.0',sourceBuild:30,unitTests:267,existingTestFilesUnchanged:integrity.length,courseBrowserChecks:runs.reduce((n,r)=>n+r.rows.length,0),negativeChecks:negative.rows.length,mergeChecks:merge.rows.length,storeChecks:store.rows.length,screenshots:images.size,reviewSet:15,newArt:0,secretHits:scan.hits,cleanup:{files:cleanup.deletedFiles,bytes:cleanup.releasedBytes,retained:cleanup.retained.length},performance:perf,blocked:['Physical iPhone/iPad touch and native voice need devices','Parent-child play and blind visual tests need participants','Clean-hardware performance needs exclusive hardware','Muse >=8 needs independent review','Native signed packages not rebuilt']};
await writeFile(`${root}/release-proof.json`,JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
