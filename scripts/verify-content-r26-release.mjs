import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root='docs/content/r26',baseline='3d036b8';
const hash=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const git=(...args)=>execFileSync('git',args,{windowsHide:true}).toString('utf8').trim();
assert.equal(git('branch','--show-current'),'r1-fun-polish');
const art=await json(`${root}/art/manifest.json`);assert.equal(art.tool,'image_gen.imagegen');assert.equal(art.assets.length,2);assert.equal(hash(await readFile(art.source)),art.sourceSha256);for(const a of art.assets)assert.equal(hash(await readFile(a.path)),a.sha256);
const runs=await Promise.all(['','/offline','/layout','/store','/supplement'].map(p=>json(`${root}${p}/browser.json`)));
const images=new Map();for(const run of runs){assert.equal(run.status,'VERIFIED');assert.deepEqual(run.errors,[]);assert.deepEqual(run.http,[]);assert.deepEqual(run.external,[]);for(const s of run.shots){const data=await readFile(s.path);assert.equal(hash(data),s.sha256);assert.equal(data.readUInt32BE(16),s.width);assert.equal(data.readUInt32BE(20),s.height);assert.ok(s.proof.semantic,'every captured screenshot includes three-way state agreement');for(const field of ['overlaps','iconOverlaps','signOcclusion','counterOcclusion'])assert.deepEqual(s.proof.layout[field],[]);images.set(s.path,s);}}
const get=name=>{const s=images.get(`${root}/phone-${name}.png`);assert.ok(s,name);return s;};
const controls=get('cake-stage-3-bay'),glyphs=[];
for(const [action,label] of [['go','踏板'],['brake','煞車']]){
 const b=controls.proof.layout.labels.find(b=>b.id===`BUTTON:${label}`);assert.ok(b);
 const crop={left:Math.round(b.x+b.width/2-15),top:Math.round(b.y+6),width:30,height:28};
 const buffer=await sharp(controls.path).extract(crop).png().toBuffer(),raw=await sharp(buffer).ensureAlpha().raw().toBuffer();let colorPixels=0;
 for(let i=0;i<raw.length;i+=4)if(action==='go'?raw[i]<100&&raw[i+1]>80&&raw[i+2]<120:raw[i]>150&&raw[i+1]<120&&raw[i+2]<120)colorPixels++;
 assert.ok(colorPixels>5,'rendered green arrow and red wide brake survive without any text');
 const path=`${root}/art/${action}-glyph-64.png`;await sharp(buffer).resize(64,64).png().toFile(path);glyphs.push({action,path,source:controls.path,crop,sha256:hash(await readFile(path)),colorPixels});
}
assert.notEqual(glyphs[0].sha256,glyphs[1].sha256);
const panel=controls.proof.layout.labels.filter(b=>['左轉','右轉','踏板','煞車'].some(t=>b.id===`BUTTON:${t}`)),left=Math.floor(Math.min(...panel.map(b=>b.x))),right=Math.ceil(Math.max(...panel.map(b=>b.right))),top=Math.round(Math.min(...panel.map(b=>b.y))+5);
await sharp(controls.path).extract({left,top,width:right-left,height:30}).resize({width:64}).png().toFile(`${root}/art/controls-panel-64.png`);
await writeFile(`${root}/art/control-check.json`,JSON.stringify({status:'VERIFIED',method:'Sharp inspection thumbnails from the original rendered screenshot. Crop contains glyphs only; text is excluded. No runtime artwork changed.',glyphs},null,2));
const selected=['cake-stage-1-playing','cake-wrong-recovery','cake-stage-3-braking','cake-stage-3-bay','cake-complete','crossing-stage-1-car','crossing-stage-2-car','crossing-stage-3-recheck-4','crossing-stage-3-1-middle','crossing-stage-3-1-pavement','tickets-stage-1-decision','tickets-stage-2-wrong','tickets-stage-3-boarding-2','tickets-stage-3-inside','tickets-complete'];
await mkdir(`${root}/review-set`,{recursive:true});const review=[];
for(let i=0;i<selected.length;i++){const s=get(selected[i]);assert.equal(s.width,390);assert.equal(s.height,844);const path=`${root}/review-set/${String(i+1).padStart(2,'0')}-${selected[i]}.png`;await copyFile(s.path,path);assert.equal(hash(await readFile(path)),s.sha256);review.push({...s,original:s.path,path});}
await writeFile(`${root}/review-set.json`,JSON.stringify({status:'VERIFIED',count:15,perCourse:5,policy:'Original-size unmodified 390x844 copies. Every selected frame has semantic and rendered geometry proof. Nine stops represented; extended four-frame identity and all neutral/wrong/right choices retained in the round root.',shots:review},null,2));
for(let stage=1;stage<=3;stage++){
 for(const state of ['decision','wrong','right','board-start','walking','boarding-2','inside','paused','seated-1','seated-2','seated-3','closed'])get(`tickets-stage-${stage}-${state}`);
 for(let n=1;n<=3;n++){assert.equal(get(`crossing-stage-${stage}-arrived-${n}`).proof.progress,`已到對岸 ${n}/3 人`);assert.equal(get(`tickets-stage-${stage}-seated-${n}`).proof.counts,`已入座 ${n}/3 人`);}
 assert.match(get(`tickets-stage-${stage}-board-start`).hint,/^按住陪上車/);
 for(const state of ['decision','right'])assert.ok(get(`tickets-stage-${stage}-${state}`).proof.semantic);
}
for(const state of ['braking','resting','bay','restart'])get(`cake-stage-3-${state}`);
const correctRecovery=images.get(`${root}/supplement/phone-cake-stage-2-correct-recovery.png`);assert.ok(correctRecovery);assert.equal(correctRecovery.proof.semantic.status,'回穩中');assert.equal(correctRecovery.state.recoveryActive,'true');assert.equal(correctRecovery.proof.highlights.length,1);assert.ok(correctRecovery.proof.layout.recovery.some(b=>b.held==='true'&&b.needed==='true'));
for(const size of ['1290x2796','2064x2752'])assert.ok(images.has(`docs/store/screenshots/content-r26/tickets-escort-${size}.png`));
const integrity=[];for(const path of git('ls-tree','-r','--name-only',baseline,'tests').split('\n').filter(Boolean)){const expected=git('rev-parse',`${baseline}:${path}`);assert.equal(git('hash-object',path),expected,path);integrity.push({path,gitBlob:expected});}
await writeFile(`${root}/existing-test-integrity.json`,JSON.stringify({status:'VERIFIED',baseline,files:integrity},null,2));
await mkdir('docs/evidence/content-r26',{recursive:true});const comparisons=[];
for(const [kind,old,name] of [['cake','04-cake-stage-3-bay','cake-stage-3-bay'],['crossing','07-crossing-stage-3-1-middle','crossing-stage-3-1-middle'],['tickets','15-tickets-complete','tickets-complete']]){
 const original=`docs/content/r25/review-set/${old}.png`,before=execFileSync('git',['show',`${baseline}:${original}`],{windowsHide:true}),after=get(name),a=`docs/evidence/content-r26/before-${kind}.png`,b=`docs/evidence/content-r26/after-${kind}.png`;
 await writeFile(a,before);await copyFile(after.path,b);comparisons.push({kind,before:a,after:b,beforeSha256:hash(before),afterSha256:after.sha256,source:`${baseline}:${original}`});
}
await writeFile(`${root}/before-after.json`,JSON.stringify({status:'VERIFIED',comparisons},null,2));
for(const [name,path] of [['phone',`${root}/phone-cake-wrong-recovery.png`],['phone-landscape',`${root}/layout/device-844x390-tickets-playing.png`],['ipad',`${root}/layout/device-768x1024-tickets-playing.png`]])await copyFile(path,`docs/evidence/content-r26/${name}.png`);
if(process.env.R26_EVIDENCE_ONLY==='1'){console.log('VERIFIED screenshot selection and unchanged historical tests');process.exit(0);}
const scan=await json(`${root}/secret-scan.json`),cleanup=await json(`${root}/cleanup-result.json`),performance=await json(`${root}/performance.json`),merge=await json(`${root}/merge/merge-path.json`),store=await json(`${root}/store-regression/review-path.json`);
assert.equal(scan.hits,0);assert.equal(cleanup.status,'EXECUTED');for(const row of cleanup.files){try{await readFile(row.path);assert.fail(row.path+' should be deleted');}catch(e){assert.equal(e.code,'ENOENT');}}
assert.deepEqual(git('diff',baseline,'--name-only','--diff-filter=D').split('\n').filter(Boolean).sort(),cleanup.files.map(r=>r.path).sort(),'deletions exactly match the reviewed media allowlist');
for(const run of [merge,store]){assert.deepEqual(run.errors,[]);assert.deepEqual(run.externalRequests,[]);for(const row of run.rows)assert.deepEqual(row.problems,[]);}
assert.equal(merge.rows.length,132);assert.equal(store.rows.length,101);
assert.equal((await json(`${root}/merge/screens/manifest.json`)).sourceVersion,'2.38.0');
assert.equal((await json(`${root}/store-regression/screens/manifest.json`)).buildWorkerSha256,hash(await readFile('dist/sw.js')));
assert.match(await readFile(`${root}/unit-test.txt`,'utf8'),/pass 285/);assert.match(await readFile(`${root}/unit-test.txt`,'utf8'),/fail 0/);
assert.equal(performance.status,'VERIFIED');assert.ok(performance.rows.every(r=>r.p95<=18));
const sourceSha256={};for(const path of ['src/shared/content-r1-ui.js','src/shared/content-r26.js','src/shared/content-r26-scene.js','src/shared/content-r26.css','package.json','dist/sw.js'])sourceSha256[path]=hash(await readFile(path));
await writeFile(`${root}/release-proof.json`,JSON.stringify({status:'VERIFIED',baseline,branch:'r1-fun-polish',version:'2.38.0',sourceBuild:34,unitTests:285,unchangedExistingTestFiles:integrity.length,mergeChecks:132,storeChecks:101,screenshots:images.size,reviewSet:15,newRuntimeArt:2,generationCalls:1,secretHits:0,cleanup:{files:cleanup.deletedFiles,bytes:cleanup.releasedBytes,retained:cleanup.retained.length},performance,sourceSha256,blocked:['Physical iPhone/iPad and native touch/speech require devices','Parent-child play requires participants','Exclusive hardware required for clean performance','Independent Muse rescore not yet received','Signed native builds not produced']},null,2));
console.log('VERIFIED R26 release evidence, regression checks, cleanup and integrity');
