import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='docs/content/r23',baseline='667cf118df8a23ac97ad14ac7d5407c7f8256610';
const hash=b=>createHash('sha256').update(b).digest('hex'),json=async p=>JSON.parse(await readFile(p,'utf8'));
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
assert.equal(git('branch','--show-current'),'r1-fun-polish');
for(const p of ['package.json','package-lock.json'])assert.equal((await json(p)).version,'2.35.0');
assert.equal((await json('public/models/catalog.json')).visualVersion,'2.35.0');
assert.match(await readFile('src/games/car/config.js','utf8'),/APP_VERSION = '2\.35\.0'/);
assert.match(await readFile('android/app/build.gradle','utf8'),/versionCode 31/);
assert.equal([...(await readFile('ios/App/App.xcodeproj/project.pbxproj','utf8')).matchAll(/CURRENT_PROJECT_VERSION = 31/g)].length,2);
const runs=await Promise.all(['browser.json','layout/browser.json','offline/browser.json','store/browser.json'].map(p=>json(`${root}/${p}`))),images=new Map();
for(const run of runs){assert.equal(run.status,'VERIFIED');for(const k of ['errors','http','external'])assert.deepEqual(run[k],[]);for(const s of run.shots){const b=await readFile(s.path);assert.equal(hash(b),s.sha256,s.path);assert.equal(b.readUInt32BE(16),s.width);assert.equal(b.readUInt32BE(20),s.height);assert.doesNotMatch(s.proof.text,/\?{3}/);images.set(s.path,s);}}
for(const kind of ['cake','crossing','tickets'])for(const r of [runs[0],runs[2]])assert.ok(r.rows.some(x=>x.label.startsWith(`${kind} three stops`)));
for(const [w,h] of [[1290,2796],[2064,2752]]){const s=images.get(`docs/store/screenshots/content-r23/tickets-escort-${w}x${h}.png`);assert.ok(s);assert.equal(s.width,w);assert.equal(s.height,h);}
const get=n=>{const s=images.get(`${root}/phone-${n}.png`);assert.ok(s,n);assert.equal(s.width,390);assert.equal(s.height,844);return s;};
const selection=[
 ['cake-stage-2-centre-62','主場景與特寫62%'],['cake-stage-2-centre-80','同一距離回正80%'],['cake-stage-2-centre-100','回正100%'],['cake-stage-3-bay','休息灣與休息好了同框'],['cake-stage-3-restart','離灣左彎與提示一致'],
 ['crossing-stage-2-car','右側橫向來車；0/3對岸不打勾'],['crossing-stage-3-recheck','左側新車接近第一格'],['crossing-stage-3-recheck-2','同車橫向接近第二格'],['crossing-stage-3-recheck-3','同車橫向接近第三格'],['crossing-stage-3-ready-depart','全員到岸才勾；人物姓名旁同式勾'],
 ['tickets-stage-2-boarding-1','階前：乘客在前側鋪面'],['tickets-stage-2-boarding-2','踩階：鋪面連接踏階再到門'],['tickets-stage-2-boarding-3','進門：同一人進入車廂'],['tickets-stage-1-step-out','第一站踏階連接前側月台'],['tickets-stage-3-step-out','第三站踏階連接前側月台']
];
await mkdir(`${root}/review-set`,{recursive:true});const review=[];
for(const [i,[name,caption]] of selection.entries()){const s=get(name),path=`${root}/review-set/${String(i+1).padStart(2,'0')}-${name}.png`;await copyFile(s.path,path);assert.equal(hash(await readFile(path)),s.sha256);review.push({path,original:s.path,caption,width:s.width,height:s.height,sha256:s.sha256});}
await writeFile(`${root}/review-set-manifest.json`,JSON.stringify({status:'VERIFIED',policy:'15 byte-identical original portrait captures; five per existing lesson; no montage, resize or annotation',shots:review},null,2));
assert.equal((await readdir(`${root}/review-set`)).filter(n=>n.endsWith('.png')).length,15);
const xs=['','-2','-3'].map(s=>get('crossing-stage-3-recheck'+s));assert.ok(xs.every(s=>s.hint.includes('左邊又有車')));
for(let stage=1;stage<=3;stage++){assert.ok(get(`tickets-stage-${stage}-step-out`).proof.step);assert.equal(get(`tickets-stage-${stage}-step-in`).proof.step,null);}
assert.match(get('cake-stage-3-bay').hint,/休息好了，可以出發了/);assert.match(get('cake-stage-3-restart').hint,/左彎/);
await writeFile(`${root}/acceptance.json`,JSON.stringify({status:'VERIFIED',scope:'Four explicitly requested R23 corrections',tickets:{stations:[1,2,3].map(n=>({path:get(`tickets-stage-${n}-step-out`).path,step:get(`tickets-stage-${n}-step-out`).proof.step})),boarding:[2,3].map(n=>[1,2,3].map(f=>get(`tickets-stage-${n}-boarding-${f}`).path)),checks:'Actual UI assertions: front paving, contact overlap, foot path through the door step'},traffic:{threeStationCars:[1,2,3].map(n=>get(`crossing-stage-${n}-car`).path),leftRecheck:xs.map(s=>({path:s.path,hint:s.hint})),checks:'Actual UI assertions: zero rotation, directional sprite scale, horizontal lane, fresh left car center <50%'},cake:{rest:get('cake-stage-3-bay').path,restart:get('cake-stage-3-restart').path,hint:get('cake-stage-3-restart').hint,checks:'Every screenshot prompt/sign agrees with roadShape; unit sweep checks every 0.25 distance'},arrival:{zero:get('crossing-stage-2-car').path,all:get('crossing-stage-3-ready-depart').path,checks:'Destination check iff 3/3; arrow intersects neither people nor state labels'}},null,2));
const integrity=[];
for(const file of git('ls-tree','-r','--name-only',baseline,'tests').split('\n').filter(Boolean)){
 const after=await readFile(file),baselineBlob=git('rev-parse',`${baseline}:${file}`),workingBlob=git('hash-object',file);assert.equal(workingBlob,baselineBlob,file);integrity.push({path:file,sha256:hash(after),gitBlob:workingBlob});
}
await writeFile(`${root}/existing-tests-integrity.json`,JSON.stringify({status:'VERIFIED',baseline,method:'Compare baseline and working-tree Git blob IDs using repository line-ending filters; also retain raw SHA256',files:integrity},null,2));
const assets=['public/art/content-r12/station-low-platform.webp','public/art/r8/platform-floor.webp','public/art/content-r21/boarding-step.webp','public/art/content-r3/train-side.webp','public/art/r6/car.png','public/art/content-r20/cake-bay.webp','public/art/content-r19/cake-bends.webp'];
const art=[];for(const path of assets){const b=await readFile(path);art.push({path,sha256:hash(b),bytes:b.length});}
await writeFile(`${root}/art-manifest.json`,JSON.stringify({status:'VERIFIED',generationCalls:0,newRuntimeImages:0,tool:null,method:'Existing controlled art reused through scene placement and CSS background crops; no generated or edited raster files',assets:art},null,2));
const comparisons=[];
for(const [kind,name] of [['cake','cake-stage-3-restart'],['crossing','crossing-stage-3-recheck'],['tickets','tickets-stage-2-boarding-2']]){
 const source=`docs/content/r22/phone-${name}.png`,before=execFileSync('git',['show',`${baseline}:${source}`]),s=get(name);
 const beforePath=`${root}/before-${kind}.png`,afterPath=`${root}/after-${kind}.png`;
 await writeFile(beforePath,before);await copyFile(s.path,afterPath);
 comparisons.push({kind,before:beforePath,after:afterPath,baselineSource:`${baseline}:${source}`,beforeSha256:hash(before),afterSha256:s.sha256});
}
await writeFile(`${root}/before-after.json`,JSON.stringify({status:'VERIFIED',method:'Before: exact tracked R22 capture from baseline Git blob. After: exact current original capture. No montage or image editing.',comparisons},null,2));
if(process.env.R23_EVIDENCE_ONLY==='1'){console.log(JSON.stringify({status:'VERIFIED',images:images.size,review:review.length,existingTestFilesUnchanged:integrity.length}));process.exit(0);}
const negative=await json(`${root}/negative/checks.json`),perf=await json(`${root}/performance.json`),merge=await json(`${root}/merge/merge-path.json`),store=await json(`${root}/store-regression/review-path.json`),scan=await json(`${root}/secret-scan.json`),cleanup=await json(`${root}/cleanup-result.json`);
assert.equal(negative.status,'VERIFIED');assert.equal(scan.hits,0);assert.equal(cleanup.status,'EXECUTED');
for(const row of cleanup.files){git('cat-file','-e',`${baseline}:${row.path}`);try{await readFile(row.path);assert.fail('cleanup target still exists');}catch(e){assert.equal(e.code,'ENOENT');}}
assert.equal(perf.status,'VERIFIED');assert.equal(perf.rows.length,9);assert.ok(perf.rows.every(r=>r.p95<=18));
for(const r of [merge,store]){assert.deepEqual(r.errors,[]);assert.deepEqual(r.externalRequests,[]);for(const row of r.rows)assert.deepEqual(row.problems,[]);}
assert.equal(merge.rows.length,132);assert.equal(store.rows.length,101);
const unit=await readFile(`${root}/unit-test.txt`,'utf8');assert.match(unit,/pass 271/);assert.match(unit,/fail 0/);assert.match(await readFile(`${root}/build-test.txt`,'utf8'),/built in/);
const proof={status:'VERIFIED',baseline,branch:'r1-fun-polish',version:'2.35.0',sourceBuild:31,unitTests:271,existingTestFilesUnchanged:integrity.length,courseBrowserChecks:runs.reduce((n,r)=>n+r.rows.length,0),negativeChecks:negative.rows.length,mergeChecks:merge.rows.length,storeChecks:store.rows.length,screenshots:images.size,reviewSet:15,newArt:0,secretHits:scan.hits,cleanup:{files:cleanup.deletedFiles,bytes:cleanup.releasedBytes,retained:cleanup.retained.length},performance:perf,scope:'Only four route-specific R23 fixes; full Muse five-item redesign is not claimed',blocked:['Physical iPhone/iPad and parent-child play need devices/participants','Clean hardware performance needs exclusive hardware','Muse >=8 awaits independent review','Native signed packages not rebuilt','Muse physical sign, larger cake poses and central/ring feedback exceed the explicit four-fix scope']};
await writeFile(`${root}/release-proof.json`,JSON.stringify(proof,null,2));console.log(JSON.stringify({...proof,performance:{status:perf.status,rows:perf.rows.length}}));
