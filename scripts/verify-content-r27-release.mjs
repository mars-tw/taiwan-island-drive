import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile,access,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='docs/content/r27',hash=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const git=(...args)=>execFileSync('git',args,{windowsHide:true}).toString('utf8').trim();
const baseline=await json(`${root}/baseline.json`);
assert.equal(git('branch','--show-current'),'r1-fun-polish');
const art=await json(`${root}/art/manifest.json`);assert.equal(art.tool,'image_gen.imagegen');assert.equal(art.generationCalls,2);assert.equal(hash(await readFile(art.source)),art.sourceSha256);for(const a of art.assets)assert.equal(hash(await readFile(a.path)),a.sha256);
assert.equal((await json(`${root}/art/visual-check.json`)).status,'VERIFIED');
const runs=await Promise.all(['','/layout','/offline','/store','/supplement','/hints'].map(s=>json(`${root}${s}/browser.json`))),images=new Map();
for(const run of runs){assert.equal(run.status,'VERIFIED');for(const field of ['errors','http','external'])assert.deepEqual(run[field],[]);for(const shot of run.shots){const b=await readFile(shot.path);assert.equal(hash(b),shot.sha256);assert.equal(b.readUInt32BE(16),shot.width);assert.equal(b.readUInt32BE(20),shot.height);for(const field of ['overlaps','iconOverlaps','signOcclusion','counterOcclusion'])assert.deepEqual(shot.proof.layout[field],[]);images.set(shot.path,shot);}}
const get=(name,replay=false)=>{const shot=images.get(`${root}/${replay?'replay/':''}phone-${name}.png`);assert.ok(shot,name);return shot;};
for(const kind of ['cake','crossing','tickets']){for(const replay of [false,true]){assert.deepEqual(get(`${kind}-no-hint`,replay).proof.needed,[]);assert.deepEqual(get(`${kind}-no-hint`,replay).proof.actualYellow,[]);assert.equal(get(`${kind}-saved`,replay).phase,'done');}}
for(const stage of [1,2,3]){const shot=images.get(`${root}/hints/phone-crossing-stage-${stage}-after-wrong-hint.png`);assert.ok(shot);assert.deepEqual(shot.proof.needed,[stage===2?'look-right':'look-left']);}
for(const stage of [1,2,3]){
 for(const state of ['decision','wrong','right','board-start','walking','boarding-2','inside','aisle','paused','seated-1','seated-2','seated-3'])get(`tickets-stage-${stage}-${state}`);
 for(const state of ['1-approach','2-passing','3-leaving','4-clear'])get(`crossing-stage-${stage}-traffic-${state}`);
 for(const n of [1,2,3]){assert.equal(get(`crossing-stage-${stage}-arrived-${n}`).proof.progress,`已到對岸 ${n}/3 人`);assert.equal(get(`tickets-stage-${stage}-seated-${n}`).proof.counts,`已入座 ${n}/3 人`);}
 for(const phase of ['start','middle','pavement'])get(`crossing-stage-${stage}-${[2,3,1][stage-1]}-${phase}`);
 for(const kind of ['cake','crossing','tickets']){const a=get(`${kind}-stage-${stage}-decision`),b=get(`${kind}-stage-${stage}-decision`,true);assert.notEqual(a.state.layoutSeed,b.state.layoutSeed);}
 assert.notEqual(get(`crossing-stage-${stage}-decision`).state.crossingOrder,get(`crossing-stage-${stage}-decision`,true).state.crossingOrder);
 assert.notEqual(get(`tickets-stage-${stage}-decision`).state.targetName,get(`tickets-stage-${stage}-decision`,true).state.targetName);
}
assert.notEqual(get('cake-stage-2-decision').state.bend,get('cake-stage-2-decision',true).state.bend);assert.notEqual(get('cake-stage-3-decision').state.bend,get('cake-stage-3-decision',true).state.bend);
for(const stage of [1,2,3]){const a=images.get(`${root}/supplement/phone-cake-stage-${stage}-turn-decision.png`),b=images.get(`${root}/supplement/replay/phone-cake-stage-${stage}-turn-decision.png`);assert.ok(a&&b);assert.notEqual(a.state.roadShape,b.state.roadShape);assert.notEqual(a.sha256,b.sha256);}
const bay=get('cake-stage-3-bay');assert.equal(bay.proof.semantic.status,'坐穩了');assert.equal(bay.state.balanceLean,'0.00');assert.match(bay.hint,/可以出發/);
for(const n of [95,100])get(`cake-stage-2-centre-${n}`);
const selection=['cake-no-hint','cake-wrong-recovery','cake-stage-2-correct-recovery','cake-stage-2-centre-100','cake-stage-3-bay','crossing-no-hint','crossing-stage-1-traffic-2-passing','crossing-stage-3-1-start','crossing-stage-3-1-middle','crossing-stage-3-1-pavement','tickets-no-hint','tickets-stage-1-wrong','tickets-stage-1-inside','tickets-stage-1-aisle','tickets-stage-1-seated-1'];
await mkdir(`${root}/review-set`,{recursive:true});const selected=[];
for(const [i,name] of selection.entries()){const shot=get(name);assert.equal(shot.width,390);assert.equal(shot.height,844);const path=`${root}/review-set/${String(i+1).padStart(2,'0')}-${name}.png`;await copyFile(shot.path,path);assert.equal(hash(await readFile(path)),shot.sha256);selected.push({...shot,original:shot.path,path});}
assert.equal((await readdir(`${root}/review-set`)).length,15);
await writeFile(`${root}/review-set.json`,JSON.stringify({status:'VERIFIED',count:15,perCourse:5,method:'Original unmodified 390x844 copies; five per lesson. Three-frame cake correction, walking-bicycle crossing and door/aisle/seating. Full multi-stage chains remain outside the capped review set.',shots:selected},null,2));
const integrity=[];for(const row of baseline.existingTests){assert.equal(hash(await readFile(row.path)),row.sha256);integrity.push(row);}
await writeFile(`${root}/existing-test-integrity.json`,JSON.stringify({status:'VERIFIED',baseline:baseline.baseline,files:integrity},null,2));
if(process.env.R27_EVIDENCE_ONLY==='1'){console.log('VERIFIED R27 screenshot chains, 15-image selection and unchanged existing tests');process.exit(0);}
const scan=await json(`${root}/secret-scan.json`),cleanup=await json(`${root}/cleanup-result.json`),performance=await json(`${root}/performance.json`),merge=await json(`${root}/merge/merge-path.json`),store=await json(`${root}/store-regression/review-path.json`);
assert.equal(scan.hits,0);assert.equal(cleanup.status,'EXECUTED');for(const row of cleanup.files)await assert.rejects(access(row.path),{code:'ENOENT'});
assert.deepEqual(git('diff',baseline.baseline,'--no-renames','--name-only','--diff-filter=D').split('\n').filter(Boolean).sort(),cleanup.files.map(r=>r.path).sort());
assert.equal(git('diff',baseline.baseline,'--name-only','--diff-filter=D','--','docs/store/screenshots'),'');
for(const path of baseline.existingUntracked.filter(p=>/^docs\/(content\/CONTENT_REVIEW_|art\/ART_RESCORE)/.test(p)))await access(path);
for(const run of [merge,store]){assert.deepEqual(run.errors,[]);assert.deepEqual(run.externalRequests,[]);for(const row of run.rows)assert.deepEqual(row.problems,[]);}
assert.equal(merge.rows.length,132);assert.equal(store.rows.length,101);assert.equal((await json(`${root}/merge/screens/manifest.json`)).sourceVersion,'2.39.0');assert.equal((await json(`${root}/store-regression/screens/manifest.json`)).buildWorkerSha256,hash(await readFile('dist/sw.js')));
assert.match(await readFile(`${root}/unit-test.txt`,'utf8'),/pass 291/);assert.match(await readFile(`${root}/unit-test.txt`,'utf8'),/fail 0/);assert.equal(performance.status,'VERIFIED');assert.ok(performance.rows.every(r=>r.p95<=18));
for(const size of ['1290x2796','2064x2752'])assert.ok(images.has(`docs/store/screenshots/content-r27/tickets-escort-${size}.png`));
for(const path of ['package.json','package-lock.json','src/games/car/config.js','public/models/catalog.json','android/app/build.gradle','ios/App/App.xcodeproj/project.pbxproj']){const text=await readFile(path,'utf8');assert.match(text,/2\.39\.0/);assert.doesNotMatch(text,/2\.38\.0/);}
assert.match(await readFile('android/app/build.gradle','utf8'),/versionCode 35/);assert.equal((await readFile('ios/App/App.xcodeproj/project.pbxproj','utf8')).match(/CURRENT_PROJECT_VERSION = 35;/g).length,2);
await mkdir('docs/evidence/content-r27',{recursive:true});const comparisons=[];
for(const name of ['cake-wrong-recovery','cake-stage-3-bay','crossing-stage-3-1-middle','tickets-stage-3-inside']){const shot=get(name),before=`docs/evidence/content-r27/before-phone-${name}.png`,after=`docs/evidence/content-r27/after-phone-${name}.png`;await copyFile(shot.path,after);comparisons.push({before,after,beforeSha256:hash(await readFile(before)),afterSha256:shot.sha256,beforeSource:`${baseline.baseline}:docs/content/r26/phone-${name}.png`});}
for(const [name,path] of [['phone',`${root}/phone-cake-wrong-recovery.png`],['phone-landscape',`${root}/layout/device-844x390-tickets-playing.png`],['ipad',`${root}/layout/device-768x1024-tickets-playing.png`]])await copyFile(path,`docs/evidence/content-r27/${name}.png`);
await writeFile(`${root}/before-after.json`,JSON.stringify({status:'VERIFIED',comparisons},null,2));
const sourceSha256={};for(const path of ['src/shared/content-r1-ui.js','src/shared/content-r27.js','src/shared/content-r27-scene.js','src/shared/content-r27.css','package.json','dist/sw.js'])sourceSha256[path]=hash(await readFile(path));
await writeFile(`${root}/release-proof.json`,JSON.stringify({status:'VERIFIED',baseline:baseline.baseline,branch:'r1-fun-polish',version:'2.39.0',sourceBuild:35,unitTests:291,unchangedExistingTestFiles:integrity.length,mergeChecks:132,storeChecks:101,screenshots:images.size,reviewSet:15,newRuntimeArt:2,generationCalls:2,secretHits:0,cleanup:{files:cleanup.deletedFiles,bytes:cleanup.releasedBytes,retained:cleanup.retained.length},performance,sourceSha256,blocked:['Physical iPhone/iPad touch and native speech require devices','Parent-child play requires participants','Exclusive hardware required for clean performance','Independent Muse rescore not received','Signed native builds not produced']},null,2));
console.log('VERIFIED R27 regression, live screenshots, replay, save, cleanup and source integrity');
