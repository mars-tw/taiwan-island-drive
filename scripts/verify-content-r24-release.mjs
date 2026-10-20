import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='docs/content/r24',baseline='2457616c4fcc544257c0831d0d85ed18b13c1ba8';
const hash=b=>createHash('sha256').update(b).digest('hex'),json=async p=>JSON.parse(await readFile(p,'utf8'));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
assert.equal(git('branch','--show-current'),'r1-fun-polish');
for(const path of ['package.json','package-lock.json'])assert.equal((await json(path)).version,'2.36.0');
assert.equal((await json('public/models/catalog.json')).visualVersion,'2.36.0');
assert.match(await readFile('src/games/car/config.js','utf8'),/APP_VERSION = '2\.36\.0'/);
assert.match(await readFile('android/app/build.gradle','utf8'),/versionCode 32/);
assert.equal([...(await readFile('ios/App/App.xcodeproj/project.pbxproj','utf8')).matchAll(/CURRENT_PROJECT_VERSION = 32/g)].length,2);
const runs=await Promise.all(['browser.json','layout/browser.json','offline/browser.json','store/browser.json'].map(p=>json(`${root}/${p}`))),images=new Map();
for(const run of runs){assert.equal(run.status,'VERIFIED');for(const k of ['errors','http','external'])assert.deepEqual(run[k],[]);for(const s of run.shots){const b=await readFile(s.path);assert.equal(hash(b),s.sha256,s.path);assert.equal(b.readUInt32BE(16),s.width);assert.equal(b.readUInt32BE(20),s.height);assert.doesNotMatch(s.proof.text,/\?{3}/);images.set(s.path,s);}}
for(const kind of ['cake','crossing','tickets'])for(const r of [runs[0],runs[2]])assert.ok(r.rows.some(x=>x.label.startsWith(`${kind} three stops`)));
for(const [w,h] of [[1290,2796],[2064,2752]]){const s=images.get(`docs/store/screenshots/content-r24/tickets-escort-${w}x${h}.png`);assert.ok(s);assert.equal(s.width,w);assert.equal(s.height,h);}
const get=name=>{const s=images.get(`${root}/phone-${name}.png`);assert.ok(s,name);assert.equal(s.width,390);assert.equal(s.height,844);return s;};
const selection=[
 ['cake-wrong-recovery','錯向加傾與換另一邊提示'],['cake-stage-2-centre-62','62%傾斜／直立參照與暫停環'],['cake-stage-2-centre-80','同一距離80%'],['cake-stage-2-centre-100','真正直立100%與回饋'],['cake-complete','蛋糕送到朋友桌上的專屬結尾'],
 ['crossing-stage-3-recheck','重新確認時左側來車接近'],['crossing-stage-3-recheck-2','同一車通過斑馬線'],['crossing-stage-3-recheck-3','同一車駛離右端'],['crossing-stage-3-recheck-4','離場後改成再看左邊'],['crossing-stage-3-ready-depart','3/3出發高亮與其他動作變灰'],
 ['tickets-stage-1-boarding-2','海風站：沿鋪面接近實體踏階'],['tickets-stage-2-boarding-2','榕樹站：同尺度列車與環形陪同進度'],['tickets-stage-3-boarding-2','燈塔站：牌柱與地面引導'],['tickets-stage-2-paused','放開半程保留進度及中央原因'],['tickets-complete','三站完成，朋友在車窗內揮手']
];
await mkdir(`${root}/review-set`,{recursive:true});const review=[];
for(const [i,[name,caption]] of selection.entries()){const s=get(name),path=`${root}/review-set/${String(i+1).padStart(2,'0')}-${name}.png`;await copyFile(s.path,path);assert.equal(hash(await readFile(path)),s.sha256);review.push({path,original:s.path,caption,width:s.width,height:s.height,sha256:s.sha256});}
assert.equal((await readdir(`${root}/review-set`)).filter(p=>p.endsWith('.png')).length,15);
await writeFile(`${root}/review-set-manifest.json`,JSON.stringify({status:'VERIFIED',policy:'15 original 390x844 phone captures, five per lesson, byte-identical copies; no resize, montage or annotations',shots:review},null,2));
const poses=[62,80,100].map(v=>get(`cake-stage-2-centre-${v}`));assert.ok(poses.every(s=>s.state.distance===poses[0].state.distance));assert.equal(poses[2].state.balanceLean,'0.00');assert.match(get('cake-wrong-recovery').hint,/越扶越歪/);
const cars=['','-2','-3','-4'].map(s=>get('crossing-stage-3-recheck'+s));assert.match(cars[0].hint,/左邊又有車/);assert.match(cars[1].hint,/通過中/);assert.match(cars[2].hint,/離開/);assert.match(cars[3].hint,/車過了，再看一次左邊/);assert.equal(cars[3].state.trafficActive,'false');
for(let stage=1;stage<=3;stage++){assert.ok(get(`tickets-stage-${stage}-step-out`).proof.step);assert.equal(get(`tickets-stage-${stage}-step-in`).proof.step,null);assert.ok(get(`crossing-stage-${stage}-ready-depart`).proof.needed.includes('depart'));assert.equal(get(`tickets-stage-${stage}-paused`).state.holdState,'paused');}
const integrity=[];for(const path of git('ls-tree','-r','--name-only',baseline,'tests').split('\n').filter(Boolean)){const expected=git('rev-parse',`${baseline}:${path}`),actual=git('hash-object',path);assert.equal(actual,expected,path);integrity.push({path,gitBlob:actual});}
await writeFile(`${root}/existing-test-integrity.json`,JSON.stringify({status:'VERIFIED',baseline,files:integrity},null,2));
const comparisons=[];await mkdir('docs/evidence/content-r24',{recursive:true});
for(const [kind,name] of [['cake','cake-stage-2-centre-62'],['crossing','crossing-stage-3-recheck-2'],['tickets','tickets-stage-2-boarding-2']]){const source=`docs/content/r23/phone-${name}.png`,before=execFileSync('git',['show',`${baseline}:${source}`]),after=get(name),beforePath=`docs/evidence/content-r24/before-${kind}.png`,afterPath=`docs/evidence/content-r24/after-${kind}.png`;await writeFile(beforePath,before);await copyFile(after.path,afterPath);comparisons.push({kind,before:beforePath,after:afterPath,baselineSource:`${baseline}:${source}`,beforeSha256:hash(before),afterSha256:after.sha256});}
await writeFile(`${root}/before-after.json`,JSON.stringify({status:'VERIFIED',method:'Exact Git baseline captures and exact current captures, no montage',comparisons},null,2));
if(process.env.R24_EVIDENCE_ONLY==='1'){console.log(JSON.stringify({status:'VERIFIED',scope:'Evidence and unchanged existing tests only',screenshots:images.size,reviewSet:review.length,existingTests:integrity.length}));process.exit(0);}
const perf=await json(`${root}/performance.json`),merge=await json(`${root}/merge/merge-path.json`),store=await json(`${root}/store-regression/review-path.json`),scan=await json(`${root}/secret-scan.json`),cleanup=await json(`${root}/cleanup-result.json`),art=await json(`${root}/art/manifest.json`);
assert.equal(scan.hits,0);assert.equal(cleanup.status,'EXECUTED');for(const row of cleanup.files){git('cat-file','-e',`${baseline}:${row.path}`);try{await readFile(row.path);assert.fail('cleanup file still exists');}catch(e){assert.equal(e.code,'ENOENT');}}
assert.equal(perf.status,'VERIFIED');assert.equal(perf.rows.length,9);assert.ok(perf.rows.every(r=>r.p95<=18));
for(const run of [merge,store]){assert.deepEqual(run.errors,[]);assert.deepEqual(run.externalRequests,[]);for(const row of run.rows)assert.deepEqual(row.problems,[]);}
assert.equal(merge.rows.length,132);assert.equal(store.rows.length,101);
assert.match(await readFile(`${root}/unit-test.txt`,'utf8'),/pass 278/);assert.match(await readFile(`${root}/unit-test.txt`,'utf8'),/fail 0/);assert.match(await readFile(`${root}/build-test.txt`,'utf8'),/built in/);
for(const asset of art.assets){assert.equal(hash(await readFile(asset.runtime)),asset.sha256);assert.equal(hash(await readFile(asset.original)),asset.originalSha256);}
const software=await json(`${root}/performance-software.json`);
const proof={status:'VERIFIED',scope:'Local implementation, requested tests, original evidence and D3D11 reference benchmark; independent score and physical-device tests remain pending',baseline,branch:'r1-fun-polish',version:'2.36.0',sourceBuild:32,unitTests:278,existingTestFilesUnchanged:integrity.length,courseBrowserChecks:runs.reduce((n,r)=>n+r.rows.length,0),mergeChecks:merge.rows.length,storeChecks:store.rows.length,screenshots:images.size,reviewSet:15,newRuntimeArt:5,generationCalls:6,secretHits:scan.hits,cleanup:{files:cleanup.deletedFiles,bytes:cleanup.releasedBytes,retained:cleanup.retained.length},performance:perf,forcedSoftwareExperiment:{status:software.status,desktopP95:software.rows.filter(r=>r.viewport==='desktop').map(r=>r.p95),artifact:`${root}/performance-software.json`},blocked:['Physical iPhone/iPad touch and native speech need devices','Parent-child play and blind interpretation need participants','Clean performance needs exclusive hardware','Independent Muse score >=8 pending','Native signed packages not rebuilt','Forced software-rendering desktop experiment exceeded 18ms; kept separate from the established D3D11 benchmark']};
await writeFile(`${root}/release-proof.json`,JSON.stringify(proof,null,2));console.log(JSON.stringify({...proof,performance:{status:perf.status,rows:perf.rows.length}}));
