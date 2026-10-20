import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root='docs/content/r25',baseline='d53b6f9bc42586dcac032991db23153ba740ccb2';
const hash=b=>createHash('sha256').update(b).digest('hex'),json=async p=>JSON.parse(await readFile(p,'utf8'));
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',windowsHide:true}).trim();
assert.equal(git('branch','--show-current'),'r1-fun-polish');
assert.deepEqual(git('diff','--name-only',baseline,'--','docs/store/screenshots').split('\n').filter(p=>p&&!p.startsWith('docs/store/screenshots/content-r25/')),[],'existing store screenshots stay unchanged');
for(const p of ['package.json','package-lock.json'])assert.equal((await json(p)).version,'2.37.0');
assert.equal((await json('public/models/catalog.json')).visualVersion,'2.37.0');
assert.match(await readFile('src/games/car/config.js','utf8'),/APP_VERSION = '2\.37\.0'/);
assert.match(await readFile('android/app/build.gradle','utf8'),/versionCode 33/);
assert.match(await readFile('android/app/build.gradle','utf8'),/versionName "2\.37\.0"/);
assert.equal([...(await readFile('ios/App/App.xcodeproj/project.pbxproj','utf8')).matchAll(/CURRENT_PROJECT_VERSION = 33;/g)].length,2);
assert.equal([...(await readFile('ios/App/App.xcodeproj/project.pbxproj','utf8')).matchAll(/MARKETING_VERSION = 2\.37\.0;/g)].length,2);
const runs=await Promise.all(['browser.json','layout/browser.json','offline/browser.json','store/browser.json'].map(p=>json(`${root}/${p}`))),images=new Map();
for(const run of runs){
 assert.equal(run.status,'VERIFIED');for(const k of ['errors','http','external'])assert.deepEqual(run[k],[]);
 for(const s of run.shots){const b=await readFile(s.path);assert.equal(hash(b),s.sha256,s.path);assert.equal(b.readUInt32BE(16),s.width);assert.equal(b.readUInt32BE(20),s.height);
  const layout=s.proof.layout;assert.ok(layout);for(const k of ['overlaps','iconOverlaps','signOcclusion','counterOcclusion'])assert.deepEqual(layout[k],[],s.path);if(layout.carOffset!==null)assert.ok(layout.carOffset<=20);
  for(let i=0;i<layout.labels.length;i++)for(let j=i+1;j<layout.labels.length;j++){const a=layout.labels[i],b=layout.labels[j];assert.equal(Math.max(0,Math.min(a.right,b.right)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)),0,`${s.path}: ${a.id} / ${b.id}`);}
  assert.doesNotMatch(s.proof.text,/\?{3}/);images.set(s.path,s);
 }
}
for(const kind of ['cake','crossing','tickets'])for(const run of [runs[0],runs[2]])assert.ok(run.rows.some(r=>r.label.startsWith(`${kind} three stops`)));
const get=name=>{const s=images.get(`${root}/phone-${name}.png`);assert.ok(s,name);assert.equal(s.width,390);assert.equal(s.height,844);return s;};
const selection=[
 ['cake-wrong-recovery','錯向當下只亮正確鍵，提示指名左邊'],['cake-stage-2-centre-62','放開保留位置，路牌完整'],['cake-stage-2-centre-100','恢復直立後四鍵圖文與圓環分離'],['cake-stage-3-bay','休息灣停穩後才再起步'],['cake-complete','分享蛋糕專屬收尾'],
 ['crossing-stage-3-recheck-3','車到右緣，標籤仍貼車身'],['crossing-stage-3-1-middle','腳踏車在斑馬線中央，0/3'],['crossing-stage-3-2-middle','奶奶在中央，腳踏車已到岸，1/3'],['crossing-stage-3-3-middle','小朋友在中央，前兩位到岸，2/3'],['crossing-stage-3-ready-depart','3/3到岸，名字與對岸牌分開，只有出發亮黃'],
 ['tickets-stage-1-board-start','小安起步，另外兩位留在前景等候區，0/3'],['tickets-stage-1-boarding-2','小安經過踏階與門口，0/3'],['tickets-stage-1-inside','進門後陪入座，仍是0/3'],['tickets-stage-1-seated-1','同一位小安真正坐下，計數1/3'],['tickets-complete','車窗揮手與完成旅程票，3/3完整可讀']
];
await mkdir(`${root}/review-set`,{recursive:true});const review=[];
for(const [i,[name,caption]] of selection.entries()){const s=get(name),path=`${root}/review-set/${String(i+1).padStart(2,'0')}-${name}.png`;await copyFile(s.path,path);assert.equal(hash(await readFile(path)),s.sha256);review.push({path,original:s.path,caption,width:s.width,height:s.height,sha256:s.sha256,layout:s.proof.layout});}
assert.equal((await readdir(`${root}/review-set`)).filter(p=>p.endsWith('.png')).length,15);
await writeFile(`${root}/review-set-manifest.json`,JSON.stringify({status:'VERIFIED',policy:'Five original 390x844 screenshots per course, exact byte copies; every selected state passed all-label, banner, road-sign, counter, button, icon and progress geometry checks at capture time.',shots:review},null,2));
const wrong=get('cake-wrong-recovery');assert.match(wrong.hint,/改按[左右]邊/);assert.equal(wrong.proof.layout.recovery.filter(b=>b.background==='rgb(255, 211, 68)').length,1);
for(const suffix of ['','-2','-3']){const car=get('crossing-stage-3-recheck'+suffix);assert.notEqual(car.proof.layout.carOffset,null,'three traffic frames must actually show the label');assert.ok(car.proof.layout.carOffset<=20);}
assert.equal(get('crossing-stage-3-recheck-4').state.trafficActive,'false');
for(let stage=1;stage<=3;stage++){
 for(let n=1;n<=3;n++){
  for(const phase of ['start','middle','pavement'])get(`crossing-stage-${stage}-${n}-${phase}`);
  assert.equal(get(`crossing-stage-${stage}-arrived-${n}`).proof.progress,`已到對岸 ${n}/3 人`);
  assert.equal(get(`tickets-stage-${stage}-seated-${n}`).proof.counts,`已入座 ${n}/3 人`);
 }
 for(const phase of ['board-start','boarding-2','inside','seated-1','paused','step-out','step-in','closed'])get(`tickets-stage-${stage}-${phase}`);
 assert.ok(get(`crossing-stage-${stage}-ready-depart`).proof.needed.includes('depart'));
}
for(const [w,h] of [[1290,2796],[2064,2752]]){const s=images.get(`docs/store/screenshots/content-r25/tickets-escort-${w}x${h}.png`);assert.ok(s);assert.equal(s.width,w);assert.equal(s.height,h);}
const integrity=[];for(const p of git('ls-tree','-r','--name-only',baseline,'tests').split('\n').filter(Boolean)){const expected=git('rev-parse',`${baseline}:${p}`);assert.equal(git('hash-object',p),expected,p);integrity.push({path:p,gitBlob:expected});}
await writeFile(`${root}/existing-test-integrity.json`,JSON.stringify({status:'VERIFIED',baseline,files:integrity},null,2));
await mkdir('docs/evidence/content-r25',{recursive:true});const comparisons=[];
for(const [kind,old,name] of [['cake','01-cake-wrong-recovery','cake-wrong-recovery'],['crossing','10-crossing-stage-3-ready-depart','crossing-stage-3-ready-depart'],['tickets','15-tickets-complete','tickets-complete']]){
 const source=`docs/content/r24/review-set/${old}.png`,before=execFileSync('git',['show',`${baseline}:${source}`],{windowsHide:true}),after=get(name),beforePath=`docs/evidence/content-r25/before-${kind}.png`,afterPath=`docs/evidence/content-r25/after-${kind}.png`;
 await writeFile(beforePath,before);await copyFile(after.path,afterPath);comparisons.push({kind,before:beforePath,after:afterPath,source:`${baseline}:${source}`,beforeSha256:hash(before),afterSha256:after.sha256});
}
await writeFile(`${root}/before-after.json`,JSON.stringify({status:'VERIFIED',comparisons},null,2));
await mkdir(`${root}/art`,{recursive:true});const assets=[];
for(const [who,path] of [['child','public/art/content-r7/child-0.png'],['bike','public/art/content-r1/bike-0.png'],['grandma','public/art/content-r9/grandma-2.png'],['passenger','public/art/r5/passenger-1-0.png']]){const thumbnail=`${root}/art/${who}-64.png`;await sharp(path).resize(64,64,{fit:'contain',background:'#fff8d9'}).png().toFile(thumbnail);assets.push({who,source:path,sourceSha256:hash(await readFile(path)),thumbnail,thumbnailSha256:hash(await readFile(thumbnail))});}
await writeFile(`${root}/art/manifest.json`,JSON.stringify({status:'VERIFIED',newRuntimeArt:0,generationCalls:0,actualGenerationTool:null,method:'Existing managed artwork reused. Sharp creates inspection thumbnails only, not new game art.',assets},null,2));
if(process.env.R25_EVIDENCE_ONLY==='1'){console.log(JSON.stringify({status:'VERIFIED',screenshots:images.size,reviewSet:review.length,existingTests:integrity.length}));process.exit(0);}
const perf=await json(`${root}/performance.json`),merge=await json(`${root}/merge/merge-path.json`),store=await json(`${root}/store-regression/review-path.json`),scan=await json(`${root}/secret-scan.json`),cleanup=await json(`${root}/cleanup-result.json`);
assert.equal(scan.hits,0);assert.equal(cleanup.status,'EXECUTED');for(const row of cleanup.files){git('cat-file','-e',`${baseline}:${row.path}`);try{await readFile(row.path);assert.fail('deleted media still exists');}catch(e){assert.equal(e.code,'ENOENT');}}
for(const run of [merge,store]){assert.deepEqual(run.errors,[]);assert.deepEqual(run.externalRequests,[]);for(const row of run.rows)assert.deepEqual(row.problems,[]);}
const storeManifest=await json(`${root}/store-regression/screens/manifest.json`);assert.equal(storeManifest.status,'VERIFIED');assert.equal(storeManifest.buildWorkerSha256,hash(await readFile('dist/sw.js')),'store regression evidence must match the final built worker');
assert.equal((await json(`${root}/merge/screens/manifest.json`)).sourceVersion,'2.37.0');
assert.equal(merge.rows.length,132);assert.equal(store.rows.length,101);
assert.match(await readFile(`${root}/unit-test.txt`,'utf8'),/pass 281/);assert.match(await readFile(`${root}/unit-test.txt`,'utf8'),/fail 0/);assert.match(await readFile(`${root}/build-test.txt`,'utf8'),/built in/);
assert.equal(perf.status,'VERIFIED');assert.equal(perf.rows.length,9);assert.ok(perf.rows.every(r=>r.p95<=18));
const sourceSha256={};for(const p of ['src/shared/content-r1-ui.js','src/shared/content-r25-scene.js','src/shared/content-r25.css','package.json','dist/sw.js'])sourceSha256[p]=hash(await readFile(p));
const proof={status:'VERIFIED',baseline,branch:'r1-fun-polish',version:'2.37.0',sourceBuild:33,unitTests:281,unchangedExistingTestFiles:integrity.length,courseBrowserChecks:runs.reduce((n,r)=>n+r.rows.length,0),mergeChecks:merge.rows.length,storeChecks:store.rows.length,screenshots:images.size,reviewSet:15,newRuntimeArt:0,generationCalls:0,secretHits:0,cleanup:{files:cleanup.deletedFiles,bytes:cleanup.releasedBytes,retained:cleanup.retained.length},performance:perf,blocked:['Physical iPhone/iPad touch and native speech require devices','Parent-child play and three-second blind button recognition require participants','Clean hardware performance needs exclusive hardware','Muse >=8 and combined review target require independent rescore','Native signed packages not rebuilt']};
proof.sourceSha256=sourceSha256;
await writeFile(`${root}/release-proof.json`,JSON.stringify(proof,null,2));console.log(JSON.stringify({...proof,performance:{status:perf.status,rows:perf.rows.length}}));
