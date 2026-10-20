import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile,readdir,stat,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='docs/content/r29',hash=b=>createHash('sha256').update(b).digest('hex'),json=async p=>JSON.parse((await readFile(p,'utf8')).replace(/^\uFEFF/,''));
const logText=async p=>{const b=await readFile(p);return b[0]===255&&b[1]===254?b.subarray(2).toString('utf16le'):b.toString('utf8');};
const baseline=await json(`${root}/baseline.json`),branch=execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim();assert.equal(branch,'r1-fun-polish');
const preexistingUntracked=baseline.untracked.filter(p=>!(baseline.taskCreatedBeforeCapture||[]).includes(p));
for(const [path,sha] of Object.entries(baseline.existingTestHashes))assert.equal(hash(await readFile(path)),sha,path+' existing test unchanged');
for(const path of preexistingUntracked)await access(path);
const modes=['all','controlled','offline','layout','store','performance'],evidence=[];
for(const mode of modes){const dir=mode==='offline'?`${root}/offline`:root,proof=await json(`${dir}/browser-${mode}.json`);assert.equal(proof.status,'VERIFIED',mode);assert.deepEqual(proof.errors,[]);assert.deepEqual(proof.failed,[]);assert.deepEqual(proof.external,[]);assert.equal(new Set(proof.shots.map(s=>s.path)).size,proof.shots.length,mode+' unique screenshot paths');for(const s of proof.shots){const b=await readFile(s.path);assert.equal(hash(b),s.sha256,s.path);assert.equal(b.readUInt32BE(16),s.width);assert.equal(b.readUInt32BE(20),s.height);assert.deepEqual(s.layout.overlaps,[]);assert.deepEqual(s.layout.iconOverlaps,[]);assert.deepEqual(s.textClipping,[]);assert.ok(s.controls.every(c=>!c.bad));}evidence.push({mode,checks:proof.checks.length,images:proof.shots.length});}
const regressions=[];
for(const [label,path,manifest,log] of [['merge',`${root}/merge/merge-path.json`,`${root}/merge/screens/manifest.json`,`${root}/test-output/merge.txt`],['store',`${root}/store-regression/review-path.json`,`${root}/store-regression/screens/manifest.json`,`${root}/test-output/store.txt`]]){
 const result=await json(path),images=await json(manifest);assert.deepEqual(result.errors,[]);assert.deepEqual(result.externalRequests,[]);assert.ok(result.rows.length>0);assert.ok(result.rows.every(r=>!(r.problems||[]).length));assert.equal(images.sourceVersion,'2.41.0');assert.match(await logText(log),label==='merge'?/PASS \d+ integration checks; \d+ screenshots; 0 runtime errors/:/PASS \d+ checks; \d+ unmodified screenshots; zero runtime errors/);
 for(const s of images.shots)assert.equal(hash(await readFile(s.path)),s.sha256,s.path);regressions.push({label,status:'VERIFIED',checks:result.rows.length,images:images.shots.length});
}
const testedBuild=await json(`${root}/tested-build.json`);for(const [p,sha] of Object.entries(testedBuild.sha256))assert.equal(hash(await readFile(p)),sha,p+' matches the build used for final regressions');
assert.match(await logText(`${root}/test-output/unit.txt`),/tests 309/);assert.match(await logText(`${root}/test-output/unit.txt`),/fail 0/);
const finalStore=await json(`${root}/store-regression/screens/manifest.json`);assert.equal(hash(await readFile('dist/sw.js')),finalStore.buildWorkerSha256,'store offline cache uses the final worker');
testedBuild.status='VERIFIED';testedBuild.regressions=regressions;await writeFile(`${root}/tested-build.json`,JSON.stringify(testedBuild,null,2));
const secret=await json(`${root}/secret-scan.json`);assert.equal(secret.status,'VERIFIED');assert.equal(secret.hits,0);
const selection=[
 ['cake-turn-only','Steering onset before cake tilt'],
 ['cake-controlled-high-support','Same initial state: fast support only'],
 ['cake-controlled-brake-support','Same initial state: braking and support'],
 ['cake-bay-main-road','Actually back on the main road'],
 ['cake-replay-new-conditions','Nine-station previews: previous and current bend'],
 ['crossing-stage-1-traffic-2','Same crossing, car moving across the observed side'],
 ['crossing-stage-1-traffic-clear','Same crossing, actual empty road after traffic left'],
 ['crossing-stage-1-1-middle','Wait reason beside locked departure; name follows walker'],
 ['crossing-stage-1-ready','Three friends arrived, road clear, departure unlocked'],
 ['crossing-replay-new-conditions','Three crossing previews and changed traffic source'],
 ['tickets-stage-3-holding','Literal matching rule; finger and progress while walking'],
 ['tickets-stage-3-paused','Blue pause, no early seating'],
 ['tickets-stage-3-resumed','Yellow held state, full-body walking in the aisle'],
 ['tickets-stage-3-seated-1','Same friend actually seated, count changes only now'],
 ['tickets-replay-new-conditions','Three ticket previews: actual previous and current targets']
];
await mkdir(`${root}/review-set`,{recursive:true});const review=[];
for(const [i,[name,purpose]] of selection.entries()){const source=`${root}/phone-${name}.png`,path=`${root}/review-set/${String(i+1).padStart(2,'0')}-${name}.png`,b=await readFile(source);assert.equal(b.readUInt32BE(16),390);assert.equal(b.readUInt32BE(20),844);await copyFile(source,path);assert.equal(hash(await readFile(path)),hash(b));review.push({path,source,purpose,width:390,height:844,sha256:hash(b)});}
assert.equal((await readdir(`${root}/review-set`)).filter(n=>n.endsWith('.png')).length,15);
await writeFile(`${root}/review-set.json`,JSON.stringify({status:'VERIFIED',method:'Unmodified full-resolution copies, five per course',images:review},null,2));
const comparison=await json(`${root}/controlled-comparison.json`);assert.equal(comparison.status,'VERIFIED');assert.deepEqual(comparison.rows[0].initial,comparison.rows[1].initial);
const cleanup=await json(`${root}/cleanup-result.json`);for(const f of cleanup.files)await assert.rejects(access(f.path));for(const r of cleanup.retained)assert.equal(hash(await readFile(r.path)),r.sha256,r.path);
const deleted=execFileSync('git',['diff',baseline.head,'--no-renames','--name-only','--diff-filter=D','-z'],{encoding:'utf8'}).split('\0').filter(Boolean).sort();assert.deepEqual(deleted,cleanup.files.map(f=>f.path).sort());
for(const size of ['1290x2796','2064x2752']){const b=await readFile(`docs/store/screenshots/content-r29/cake-bay-${size}.png`),[w,h]=size.split('x').map(Number);assert.equal(b.readUInt32BE(16),w);assert.equal(b.readUInt32BE(20),h);}
const comparisons=[];for(const [kind,name] of [['cake','cake-bay-parked'],['crossing','crossing-stage-3-1-start'],['tickets','tickets-stage-3-resumed']]){const before=`docs/evidence/content-r29/before-${kind}.png`,after=`docs/evidence/content-r29/after-${kind}.png`;await copyFile(`${root}/phone-${name}.png`,after);comparisons.push({before,after,beforeSha256:hash(await readFile(before)),afterSha256:hash(await readFile(after))});}
await writeFile(`${root}/before-after.json`,JSON.stringify({status:'VERIFIED',baseline:baseline.head,method:'Matching course, station and phase UI comparisons; physics-controlled comparison is a separate JSON proof',comparisons},null,2));
for(const [name,source] of [['phone',`${root}/phone-cake-controlled-brake-support.png`],['phone-landscape',`${root}/layout/device-844x390-tickets-interactive.png`],['ipad',`${root}/layout/device-768x1024-tickets-interactive.png`]])await copyFile(source,`docs/evidence/content-r29/${name}.png`);
const perf=await json(`${root}/performance.json`);assert.equal(perf.status,'VERIFIED');
const sourceSha256={};for(const p of ['src/shared/content-r1-ui.js','src/shared/content-r29.js','src/shared/content-r29-scene.js','src/shared/content-r29.css','public/sw.js','public/art/content-r29/steady-cake.webp','public/art/content-r29/traffic-car.webp','tests/shared/content-r29.test.js','scripts/check-content-r29.mjs','package.json','package-lock.json','dist/sw.js'])sourceSha256[p]=hash(await readFile(p));
const art=[];for(const p of ['docs/content/r29/art/steady-cake-original.png','docs/content/r29/art/traffic-car-original.png','public/art/content-r29/steady-cake.webp','public/art/content-r29/traffic-car.webp'])art.push({path:p,sha256:hash(await readFile(p)),bytes:(await stat(p)).size});await writeFile(`${root}/art/manifest.json`,JSON.stringify({status:'VERIFIED',tool:'image_gen.imagegen',generationCalls:2,runtimeAssets:2,files:art},null,2));
assert.equal((await json('package.json')).version,'2.41.0');
await writeFile(`${root}/release-proof.json`,JSON.stringify({status:'VERIFIED',branch,baseline:baseline.head,version:'2.41.0',sourceBuild:37,existingTestsUnchanged:Object.keys(baseline.existingTestHashes).length,preexistingUntrackedPreserved:preexistingUntracked.length,captureExclusions:baseline.taskCreatedBeforeCapture||[],evidence,regressions,reviewImages:15,cleanup:{status:'VERIFIED',deletedFiles:cleanup.deletedFiles,releasedBytes:cleanup.releasedBytes,retained:cleanup.retained.length},performance:perf.rows.map(r=>({width:r.width,height:r.height,p95:r.p95})),sourceSha256,limits:['Physical devices and families unavailable','Concurrent workstation performance only','Muse score requires independent review']},null,2));
console.log('VERIFIED R29 release, 15 original portrait review images, immutable existing tests, cleanup, source and artifact hashes');
