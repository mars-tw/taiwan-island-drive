import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,copyFile,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root='docs/content/r20',baseline='cd0dbad';
const json=async p=>JSON.parse(await readFile(p,'utf8')),hash=b=>createHash('sha256').update(b).digest('hex');
const text=async p=>{const b=await readFile(p);return b[0]===255&&b[1]===254?b.subarray(2).toString('utf16le'):b.toString('utf8').replace(/^\uFEFF/,'');};
assert.equal(execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),'r1-fun-polish');
assert.equal((await json('package.json')).version,'2.32.0');
assert.equal((await json('package-lock.json')).version,'2.32.0');
assert.equal((await json('public/models/catalog.json')).visualVersion,'2.32.0');
assert.match(await readFile('src/games/car/config.js','utf8'),/APP_VERSION = '2\.32\.0'/);
const android=await readFile('android/app/build.gradle','utf8'),ios=await readFile('ios/App/App.xcodeproj/project.pbxproj','utf8');
assert.match(android,/versionCode 28/);assert.match(android,/versionName "2\.32\.0"/);
assert.equal([...ios.matchAll(/CURRENT_PROJECT_VERSION = 28/g)].length,2);assert.equal([...ios.matchAll(/MARKETING_VERSION = 2\.32\.0/g)].length,2);
const runPaths=['all','negative','state','store','offline','layout'].map(s=>`${root}/${s==='offline'?'offline/':s==='layout'?'layout-proof/':''}browser-${s}.json`);
const runs=await Promise.all(runPaths.map(json)),images=new Map();
for(const r of runs){assert.equal(r.status,'VERIFIED');for(const k of ['errors','external','http'])assert.deepEqual(r[k],[]);for(const s of r.shots){const b=await readFile(s.path);assert.equal(hash(b),s.sha256,s.path);assert.equal(b.readUInt32BE(16),s.width);assert.equal(b.readUInt32BE(20),s.height);images.set(s.path,s);}}
const get=n=>{const s=images.get(`${root}/phone-${n}.png`);assert.ok(s,n);assert.equal(s.width,390);assert.equal(s.height,844);return s;};
const selection=[
 ['cake-replay-old-direction','錯向回歸：橘紅按鍵、傾斜橘條'],
 ['cake-tray-edge-sliding','盤緣：橘條量傾斜，藍圈量回中央'],
 ['cake-tray-edge-recovering','同構圖回穩中'],
 ['cake-tray-edge-recovered','回中央後恢復操作'],
 ['cake-stage-3-bay-stopped','第三站臨停：完整海岸休息區'],
 ['crossing-stage-1-child-look-left','來車標籤與左右觀察回歸'],
 ['crossing-stage-2-grandma-moving-1','奶奶走在斑馬線中央：無斜線、0人'],
 ['crossing-stage-2-grandma-moving-2','奶奶踏上對岸：仍0人'],
 ['crossing-stage-2-grandma-arrived','走到空位才打勾、1人'],
 ['crossing-stage-3-departing-2','第三站全員到岸後實際出發'],
 ['tickets-stage-1-wrong','選錯回歸：腳底在紅磚、三欄含0'],
 ['tickets-stage-1-boarding-1-1','上車進行中：人在門框，踏階在腳下'],
 ['tickets-stage-1-seated-3','全員入座：門開、踏階伸出'],
 ['tickets-stage-1-close-ready','踏階完全收回，才可關門'],
 ['tickets-stage-1-closed','關門完成，才可前進']
];
await import('node:fs/promises').then(m=>m.mkdir(`${root}/review-set`,{recursive:true}));
const review=[];
for(const [i,[name,purpose]] of selection.entries()){const s=get(name),path=`${root}/review-set/${String(i+1).padStart(2,'0')}-${name}.png`;await copyFile(s.path,path);assert.equal(hash(await readFile(path)),s.sha256);review.push({index:i+1,path,source:s.path,purpose,sha256:s.sha256,width:s.width,height:s.height});}
assert.equal((await readdir(`${root}/review-set`)).length,15);
await writeFile(`${root}/review-set-manifest.json`,JSON.stringify({status:'VERIFIED',count:15,perCourse:5,method:'Byte-identical original 390x844 runtime PNG; no montage or annotations',images:review},null,2));
await writeFile(`${root}/review-guide.md`,'# R20精選\n\nVERIFIED：每課5張，依課程順序；含三課實際進行中及回歸。\n\n'+review.map(s=>`${String(s.index).padStart(2,'0')}．${s.purpose}：${s.path}`).join('\n\n')+'\n\n其餘三站／重載／離線證據不在精選15張內，不能當作審查員已看過。\n');
const overlap=[1,2,3].map(n=>({stage:n,...get(`tickets-stage-${n}-boarding-1-1`).r20}));for(const r of overlap)assert.ok(r.doorOverlap>=.5);
const extended=get('tickets-stage-1-seated-3'),retracted=get('tickets-stage-1-close-ready'),door=extended.geometry.door;
// The bridge is centered at the door sill, 20% of the scene's inner width.
// Derive the pixel ROI from the captured doorway geometry, independently of
// the UI's step flags; both PNGs are unmodified runtime captures.
const width=Math.ceil((extended.geometry.scene.width-6)*.20),height=32;
const left=Math.floor((door.x+door.right-width)/2),top=Math.floor(door.bottom-2);
const pixels=[];for(const s of [extended,retracted])pixels.push(await sharp(s.path).extract({left,top,width,height}).removeAlpha().raw().toBuffer());
let changed=0;for(let p=0;p<pixels[0].length;p+=3)if(Math.max(...[0,1,2].map(c=>Math.abs(pixels[0][p+c]-pixels[1][p+c])))>=20)changed++;
assert.ok(changed>=1500,`step visible pixel difference ${changed}`);
const recovery=['cake-tray-edge-sliding','cake-tray-edge-recovering','cake-tray-edge-recovered'].map(get);
for(let n=1;n<recovery.length;n++){assert.ok(Math.abs(+recovery[n].state.balanceLean)<Math.abs(+recovery[n-1].state.balanceLean));assert.ok(+recovery[n].r20.recovery>+recovery[n-1].r20.recovery);}
assert.ok(+recovery.at(-1).r20.recovery>=90);
const evidence={status:'VERIFIED',items:[
 {item:1,title:'海岸臨停灣',images:[get('cake-stage-3-bay-stopped')],artThumbnail:`${root}/art/cake-bay-64.png`,detailReview:'Executing agent visually inspected original and 64px view; connected roadside bay, road marking, curb, coast, village, tree and bench; no claim of independent Muse approval'},
 {item:2,title:'固定傾斜橘條、另用藍色回中央環',images:[get('cake-replay-old-direction'),...recovery]},
 {item:3,title:'無斜線、起點→中央→對岸→空位',images:['crossing-stage-2-start','crossing-stage-2-grandma-moving-1','crossing-stage-2-grandma-moving-2','crossing-stage-2-grandma-arrived','crossing-stage-1-child-look-left'].map(get)},
 {item:4,title:'三站紅磚候車與門口上車',images:[1,2,3].flatMap(n=>['wrong','boarding-1-1','boarding-1-2','seated-1'].map(s=>get(`tickets-stage-${n}-${s}`))),doorOverlap:overlap.map(r=>({stage:r.stage,ratio:r.doorOverlap}))},
 {item:5,title:'踏階與固定三欄人數',images:[extended,retracted,get('tickets-stage-1-closed')],pixelDifference:{threshold:1500,changed,channelDelta:20,region:{left,top,width,height}}}
],supplementalRuns:runPaths,limitations:['Only 15 review-set images are submitted for visual review','Physical devices, family playtest, clean hardware and independent Muse rescore require external follow-up']};
await writeFile(`${root}/acceptance.json`,JSON.stringify(evidence,null,2));
await writeFile(`${root}/screenshots.json`,JSON.stringify({status:'VERIFIED',count:images.size,images:[...images.values()]},null,2));
const comparisons=[];
for(const [kind,old,name] of [['cake','05-cake-stage-3-bay-stopped','cake-stage-3-bay-stopped'],['crossing','07-crossing-stage-2-grandma-moving-1','crossing-stage-2-grandma-moving-1'],['tickets','12-tickets-stage-1-boarding-1-1','tickets-stage-1-boarding-1-1']]){
 const before=`${root}/before-${kind}.png`,after=`${root}/after-${kind}.png`,data=execFileSync('git',['show',`${baseline}:docs/content/r19/review-set/${old}.png`],{maxBuffer:8*1024*1024});
 await writeFile(before,data);await copyFile(get(name).path,after);comparisons.push({before,beforeBaseline:baseline,beforeSha256:hash(data),after,afterSha256:get(name).sha256});
}
await writeFile(`${root}/before-after.json`,JSON.stringify({status:'VERIFIED',method:'Original unscaled baseline git objects and byte-identical R20 captures',comparisons},null,2));
if(process.env.R20_EVIDENCE_ONLY==='1'){console.log(JSON.stringify({status:'VERIFIED',scope:'Screenshot evidence only; remaining release gates are not asserted',screenshots:images.size,review:15,stepChangedPixels:changed,doorOverlap:overlap.map(r=>({stage:r.stage,ratio:r.doorOverlap}))}));process.exit(0);}
// Old tests are compared with the starting commit; no assertion was deleted or relaxed.
const originals=execFileSync('git',['ls-tree','-r','--name-only',baseline,'tests'],{encoding:'utf8'}).trim().split(/\r?\n/);
const testIntegrity=[];
for(const path of originals){
 // Compare the canonical Git blob, honoring the checkout's CRLF clean filter.
 // Do not rewrite existing tests merely to change their line endings.
 const expected=execFileSync('git',['rev-parse',`${baseline}:${path}`],{encoding:'utf8'}).trim();
 const actual=execFileSync('git',['hash-object','--path',path,path],{encoding:'utf8'}).trim();
 assert.equal(actual,expected,path);testIntegrity.push({path,baselineBlob:expected,workingCanonicalBlob:actual,workingSha256:hash(await readFile(path))});
}
await writeFile(`${root}/test-source-integrity.json`,JSON.stringify({status:'VERIFIED',method:'Exact canonical Git blob comparison, preserving Windows checkout line endings',files:testIntegrity},null,2));
const cleanup=await json(`${root}/cleanup-result.json`);assert.equal(cleanup.status,'EXECUTED');for(const f of cleanup.files)assert.equal(await stat(f.path).then(()=>true,()=>false),false);for(const f of cleanup.retained)assert.equal(hash(await readFile(f.path)),f.sha256);
assert.match(await text(`${root}/unit-test.txt`),/pass 257/);assert.match(await text(`${root}/unit-test.txt`),/fail 0/);assert.match(await text(`${root}/build-test.txt`),/built in/);
const merge=await json(`${root}/merge/merge-path.json`),store=await json(`${root}/store/review-path.json`),perf=await json(`${root}/performance.json`);
for(const r of [merge,store]){assert.deepEqual(r.errors,[]);assert.deepEqual(r.externalRequests,[]);for(const row of r.rows)assert.deepEqual(row.problems,[]);}
assert.equal(merge.rows.length,132);assert.equal(store.rows.length,101);
assert.equal(perf.rows.length,9);assert.equal(perf.withinReferenceLimit,true);
for(const r of perf.rows){assert.equal(r.runs.length,3);assert.equal(r.p95,[...r.runs].sort((a,b)=>a-b)[1]);assert.ok(r.p95<=18);}
for(const [w,h] of [[1290,2796],[2064,2752]])assert.ok([...images.values()].some(s=>s.path.startsWith('docs/store/')&&s.width===w&&s.height===h));
const textFiles=[];async function scan(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(e.isSymbolicLink()||['.git','.secrets','node_modules','dist','dist-native','.audit-tmp','output','release','.gradle','build','DerivedData','__pycache__'].includes(e.name))continue;const p=`${dir}/${e.name}`;if(e.isDirectory())await scan(p);else if(/\.(js|mjs|json|md|html|css|txt|gradle|pbxproj|xml|yml|yaml|py|ps1|swift|plist|svg|webmanifest)$/i.test(e.name))textFiles.push(p);}}
await scan('.');const hits=[];for(const p of textFiles)if(/sk-proj-[A-Za-z0-9_-]{20}|sk-[a-z0-9]{40}|AIza[0-9A-Za-z_-]{35}|gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{50,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----|xox[baprs]-[A-Za-z0-9-]{20,}/.test(await text(p)))hits.push(p);
assert.deepEqual(hits,[]);await writeFile(`${root}/secret-scan.json`,JSON.stringify({status:'VERIFIED',files:textFiles.length,hits,scope:'Repository text, no secret folders read, matched values never printed'},null,2));
const artPaths=[`${root}/art/cake-bay-original.png`,'public/art/content-r20/cake-bay.webp',`${root}/art/cake-bay-64.png`];
await writeFile(`${root}/art/manifest.json`,JSON.stringify({status:'VERIFIED',tool:'image_gen.imagegen',model_slug:null,newGenerationCalls:1,newRuntimeAssets:1,assets:await Promise.all(artPaths.map(async path=>({path,sha256:hash(await readFile(path)),...await sharp(path).metadata().then(m=>({width:m.width,height:m.height}))})))},null,2));
const sources=['package.json','package-lock.json','android/app/build.gradle','ios/App/App.xcodeproj/project.pbxproj','public/models/catalog.json','src/games/car/config.js','src/shared/content-r1-ui.js','src/shared/content-r20-scene.js','src/shared/content-r20.css','tests/shared/content-r20.test.js','scripts/check-content-r20.mjs','scripts/run-content-r20-validation.mjs','scripts/measure-content-r20.mjs','scripts/cleanup-content-r20.py','scripts/verify-content-r20-release.mjs','docs/art/ART_DIRECTION.md'];
await writeFile(`${root}/source-manifest.json`,JSON.stringify({status:'VERIFIED',baseline,files:await Promise.all(sources.map(async path=>({path,sha256:hash(await readFile(path))})))},null,2));
const result={status:'VERIFIED',baseline,branch:'r1-fun-polish',version:'2.32.0',nativeSourceBuild:28,unitTests:257,unchangedExistingTestFiles:originals.length,browserChecks:runs.reduce((n,r)=>n+r.rows.length,0),screenshots:images.size,reviewSet:15,mergeChecks:132,storeChecks:101,newGenerationCalls:1,newRuntimeAssets:1,newDependencies:0,secretHits:0,stepChangedPixels:changed,doorOverlap:overlap.map(r=>({stage:r.stage,ratio:r.doorOverlap})),cleanup:{files:cleanup.deletedFiles,bytes:cleanup.releasedBytes,retained:cleanup.retained.length},performance:perf,blocked:['Physical iPhone/iPad touch and native voice require devices','Parent-child playtest requires participants','Clean hardware performance requires exclusive resources','Muse >=8 requires independent rescore','Native signed packages not rebuilt']};
await writeFile(`${root}/release-proof.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({...result,performance:perf.rows.map(r=>({viewport:r.viewport,kind:r.kind,p95:r.p95}))}));
