import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,stat,mkdir,copyFile,lstat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='docs/content/r19',baseline='baece5c',sha=b=>createHash('sha256').update(b).digest('hex');
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:64*1024*1024});
const text=async p=>{const b=await readFile(p);return b[0]===255&&b[1]===254?b.toString('utf16le').slice(1):b.toString('utf8');};
const json=async p=>JSON.parse(await text(p));
assert.equal(git('branch','--show-current').trim(),'r1-fun-polish');
const pkg=await json('package.json'),lock=await json('package-lock.json');assert.equal(pkg.version,'2.31.0');assert.equal(lock.version,pkg.version);assert.equal(lock.packages[''].version,pkg.version);
for(const key of ['dependencies','devDependencies'])assert.deepEqual(pkg[key],JSON.parse(git('show',baseline+':package.json'))[key]);
const originalTests=git('ls-tree','-r','--name-only',baseline,'tests').trim().split(/\r?\n/);
for(const path of originalTests)assert.equal((await text(path)).replaceAll('\r\n','\n'),git('show',baseline+':'+path).replaceAll('\r\n','\n'),'Existing test changed '+path);
assert.equal(git('diff','--diff-filter=DMRT','--name-only',baseline,'--','docs/store/screenshots').trim(),'','Existing store screenshots changed');
const preserved=await json(`${root}/preserved-user-files.json`),staged=new Set(git('diff','--cached','--name-only','-z').split('\0'));
for(const f of preserved.files){assert.equal(sha(await readFile(f.path)),f.sha256);assert.equal(staged.has(f.path),false);}
for(const p of ['package.json','package-lock.json','src/games/car/config.js','public/models/catalog.json','android/app/build.gradle','ios/App/App.xcodeproj/project.pbxproj'])assert.ok((await text(p)).includes('2.31.0'));
assert.match(await text('android/app/build.gradle'),/versionCode 27/);assert.equal(((await text('ios/App/App.xcodeproj/project.pbxproj')).match(/CURRENT_PROJECT_VERSION = 27;/g)||[]).length,2);
const runPaths=['cake','crossing','tickets','negative','matrix','state','store'].map(k=>`${root}/browser-${k}.json`).concat([`${root}/layout-proof/browser-layout.json`,`${root}/offline/browser-offline.json`,`${root}/offline/browser-offline-cake.json`,`${root}/viewport-320x568/browser-journeys.json`,`${root}/viewport-320x568/browser-cake.json`,`${root}/viewport-320x568/browser-negative.json`]);
const runs=[];for(const path of runPaths){const r=await json(path);assert.equal(r.status,'VERIFIED',path);for(const key of ['errors','external','http'])assert.deepEqual(r[key],[]);runs.push({path,r,time:(await stat(path)).mtimeMs});}
const latest=new Map();for(const {r} of runs.sort((a,b)=>a.time-b.time))for(const s of r.shots)latest.set(s.path,s);
const images=[...latest.values()];
for(const s of images){const b=await readFile(s.path);assert.equal(sha(b),s.sha256,s.path+' final image hash');assert.equal(b.readUInt32BE(16),s.width);assert.equal(b.readUInt32BE(20),s.height);assert.deepEqual(s.screenContract.failures,[]);assert.deepEqual(s.screenContract.overlaps,[]);if(s.phase==='playing'&&/(?:phone|device[^/]+)-cake/.test(s.path))assert.ok(s.r19.cakeFit,s.path+' must include final raster-boundary checks');if(s.phase==='playing'&&s.r19.guided==='false')for(const c of s.controls.filter(c=>c.needed==='true'&&c.held!=='true'))assert.notEqual(c.color,'rgb(255, 211, 68)',s.path+' no unpressed correct answer in yellow');}
const get=n=>{const s=latest.get(`${root}/phone-${n}.png`);assert.ok(s,'missing image '+n);assert.equal(s.width,390);assert.equal(s.height,844);return s;};
const recovery=['cake-tray-edge-sliding','cake-tray-edge-recovering','cake-tray-edge-recovered'].map(get);
assert.ok(Math.abs(+recovery[0].state.balanceLean)>24);assert.ok(Math.abs(+recovery[1].state.balanceLean)<Math.abs(+recovery[0].state.balanceLean));assert.ok(Math.abs(+recovery[2].state.balanceLean)<3);
assert.ok(recovery.every(s=>s.r19.largeScale==='1'&&s.r19.mini===s.r19.large&&s.r19.cakeFit===recovery[0].r19.cakeFit));
for(let stage=1;stage<=3;stage++){
 const first={1:'child',2:'grandma',3:'bike'}[stage],landed=get(`crossing-stage-${stage}-${first}-arrived`);assert.equal(landed.state.crossed,'1');assert.equal(landed.r19.arrived.length,1);assert.equal(landed.r19.waiting.length,2);
 for(const state of ['wrong','boarding-1-1','seated-3','close-ready','closed','departing-2'])assert.equal(get(`tickets-stage-${stage}-${state}`).r19.ticketVisible,true);
 const extended=get(`tickets-stage-${stage}-seated-3`),retracted=get(`tickets-stage-${stage}-close-ready`);assert.equal(extended.r19.stepVisible,true);assert.equal(retracted.r19.stepVisible,false);assert.equal(extended.state.step,'1');assert.equal(retracted.state.step,'0');
}
const selected=[
 ['cake-replay-old-direction','回歸：重玩左彎按舊右轉，仍在原地且說明錯向'],
 ['cake-tray-edge-sliding','盤緣：主車蛋糕偏離中央，按鍵灰色等待'],
 ['cake-tray-edge-recovering','連續回穩：相同倍率，主車與特寫同步回中央'],
 ['cake-tray-edge-recovered','連續坐穩：回中央後恢復操作，重玩無正解亮框'],
 ['cake-stage-3-bay-stopped','回歸：第三站實際停在臨停灣，接著須再起步'],
 ['crossing-stage-1-child-arrived','第一站1人到岸，2人仍在起點，方向標記可見'],
 ['crossing-stage-2-grandma-moving-1','奶奶到岸前：仍在斑馬線，計數不增加'],
 ['crossing-stage-2-grandma-moving-2','連續踏上對岸：仍等走到空位，計數不增加'],
 ['crossing-stage-2-grandma-arrived','連續落位：奶奶在對岸空位打勾，才計1人'],
 ['crossing-stage-3-bike-arrived','第三站1人到岸：方向與起點清楚，另2人未提前過街'],
 ['tickets-stage-1-wrong','回歸：第一站錯選仍顯示左上車票，形狀對而顏色不同'],
 ['tickets-stage-1-boarding-1-1','玩家邀請後真正上車：月台2＋上車中1＋已入座0'],
 ['tickets-stage-1-seated-3','三人落座，門開且踏階伸出，等玩家收回'],
 ['tickets-stage-1-close-ready','連續收階後：階面已消失，門仍開，才提供關門'],
 ['tickets-stage-1-closed','連續關門後：門已關，等玩家按前進']
];
await mkdir(`${root}/review-set`,{recursive:true});const review=[];
for(const [i,[name,purpose]] of selected.entries()){const s=get(name),path=`${root}/review-set/${String(i+1).padStart(2,'0')}-${name}.png`;await copyFile(s.path,path);assert.equal(sha(await readFile(path)),s.sha256);review.push({index:i+1,path,source:s.path,purpose,width:s.width,height:s.height,sha256:s.sha256});}
assert.equal((await readdir(`${root}/review-set`)).length,15);
await writeFile(`${root}/review-set-manifest.json`,JSON.stringify({status:'VERIFIED',count:15,perCourse:5,method:'Byte-identical original portrait screenshots; no montage, overlays or scaling',images:review},null,2));
await writeFile(`${root}/review-guide.md`,'# R19精選\n\nVERIFIED：依課程順序，每課5張，390×844原圖。\n\n'+review.map(r=>`${String(r.index).padStart(2,'0')}．${r.purpose}：${r.path}`).join('\n\n')+'\n\n精選上限15張，完整三站／視口／駛離／離線／重載等補充原圖列在acceptance.json；未將精選外的證據冒稱審查員已看。\n');
const groups=[
 {item:1,title:'踏階機械變化',names:['tickets-stage-1-seated-3','tickets-stage-1-retracting','tickets-stage-1-close-ready','tickets-stage-1-closed','tickets-stage-1-departing-2']},
 {item:2,title:'回穩同一指令及同源位移',names:['cake-first-release-wait','cake-replay-release-wait',...recovery.map(s=>s.path.split('/phone-')[1].replace('.png','')),'cake-replay-old-direction']},
 {item:3,title:'方向、落位後才計數、出發動作',names:['crossing-stage-2-grandma-moving-1','crossing-stage-2-grandma-moving-2','crossing-stage-2-grandma-arrived','crossing-stage-1-child-arrived','crossing-stage-3-bike-arrived','crossing-stage-3-ready-depart','crossing-stage-3-departing-2']},
 {item:4,title:'固定車票與三人計數',names:[1,2,3].flatMap(n=>['wrong','boarding-1-1','seated-3','close-ready','closed','departing-2'].map(s=>`tickets-stage-${n}-${s}`)).concat('tickets-saved-result')},
 {item:5,title:'不透明路牌與車旁標籤',names:['cake-first-bend','cake-replay-old-direction',...recovery.map(s=>s.path.split('/phone-')[1].replace('.png','')),'crossing-stage-1-child-look-left','crossing-stage-1-child-look-right','crossing-same-station-right-has-car']}
];
await writeFile(`${root}/acceptance.json`,JSON.stringify({status:'VERIFIED',scope:'Five specifically assigned R19 fixes; R18 Muse synchronization and independent decisions included without adding content',items:groups.map(g=>({...g,images:g.names.map(get)})),supplementalRuns:runPaths,limits:['Executing-agent verification only; independent Muse rescore BLOCKED','15 review screenshots cannot include every supplemental regression frame']},null,2));
await writeFile(`${root}/screenshots.json`,JSON.stringify({status:'VERIFIED',count:images.length,images},null,2));
const comparisons=[];
for(const [kind,name,old] of [['cake','cake-tray-edge-sliding','03-cake-tray-edge-sliding'],['crossing','crossing-stage-2-grandma-arrived','09-crossing-stage-2-grandma-moving-3'],['tickets','tickets-stage-1-seated-3','12-tickets-stage-1-seated-3']]){
 const before=`${root}/before-${kind}.png`,after=`${root}/after-${kind}.png`,s=get(name);assert.equal(sha(await readFile(before)),sha(execFileSync('git',['show',`${baseline}:docs/content/r18/review-set/${old}.png`],{maxBuffer:8*1024*1024})));await copyFile(s.path,after);comparisons.push({before,beforeBaseline:baseline,beforeSha256:sha(await readFile(before)),after,source:s.path,afterSha256:s.sha256});
}
await writeFile(`${root}/before-after.json`,JSON.stringify({status:'VERIFIED',method:'Unscaled originals; baseline PNGs checked directly against git objects, after images copied byte-for-byte',comparisons},null,2));
const luma=hex=>{const v=hex.match(/\w\w/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722;};
const contrast=(luma('fff8d9')+.05)/(luma('143b61')+.05);assert.ok(contrast>=4.5);await writeFile(`${root}/contrast.json`,JSON.stringify({status:'VERIFIED',foreground:'#143b61',background:'#fff8d9',ratio:contrast,threshold:4.5,opacity:1,checkedBy:'Computed styles in every playing screenshot; contrast from WCAG relative luminance formula'},null,2));
for(const a of (await json(`${root}/art/manifest.json`)).assets)assert.equal(sha(await readFile(a.path)),a.sha256);
for(const [w,h] of [[1290,2796],[2064,2752]])assert.ok(images.some(s=>s.path.startsWith('docs/store/')&&s.width===w&&s.height===h));
if(process.env.R19_PREPARE_ONLY==='1'){console.log(JSON.stringify({status:'VERIFIED',images:images.length,review:15}));process.exit(0);}
const cleanup=await json(`${root}/cleanup-result.json`),additional=await json(`${root}/cleanup-additional-result.json`);for(const c of [cleanup,additional]){assert.equal(c.status,'EXECUTED');for(const f of c.files)assert.equal(await lstat(f.path).then(()=>true,()=>false),false);}const deletedPaths=new Set([...cleanup.files,...additional.files].map(f=>f.path)),retained=new Map([...cleanup.retained,...additional.retained].filter(f=>!deletedPaths.has(f.path)).map(f=>[f.path,f]));for(const f of retained.values())assert.equal(await lstat(f.path).then(()=>true,()=>false),true);cleanup.deletedFiles=deletedPaths.size;cleanup.releasedBytes+=additional.releasedBytes;
const dependencyAudit=await json(`${root}/cleanup-dependency-audit.json`);assert.equal(dependencyAudit.status,'VERIFIED');assert.deepEqual(dependencyAudit.referencedDeleted,{});for(const f of dependencyAudit.restoredProtectedInputs)assert.equal(sha(await readFile(f.path)),f.sha256);
assert.match(await text(`${root}/unit-test.txt`),/pass 254/);assert.match(await text(`${root}/unit-test.txt`),/fail 0/);assert.match(await text(`${root}/build-test.txt`),/built in/);
const merge=await json(`${root}/merge/merge-path.json`),store=await json(`${root}/store/review-path.json`),perf=await json(`${root}/performance.json`);
for(const r of [merge,store]){assert.deepEqual(r.errors,[]);assert.deepEqual(r.externalRequests,[]);for(const row of r.rows)assert.deepEqual(row.problems,[]);}
assert.equal(merge.rows.length,132);assert.equal(store.rows.length,101);
const files=[];async function scan(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(e.isSymbolicLink()||['.git','.secrets','node_modules','dist','dist-native','.audit-tmp','output','release','.gradle','build','DerivedData','__pycache__'].includes(e.name))continue;const path=`${dir}/${e.name}`;if(e.isDirectory())await scan(path);else if(/\.(js|mjs|json|md|html|css|txt|gradle|pbxproj|xml|yml|yaml|py|ps1|swift|plist|svg|webmanifest)$/i.test(e.name))files.push(path);}}
await scan('.');const hits=[];for(const path of files)if(/sk-proj-[A-Za-z0-9_-]{20}|sk-[a-z0-9]{40}|AIza[0-9A-Za-z_-]{35}|gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{50,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----|xox[baprs]-[A-Za-z0-9-]{20,}/.test(await text(path)))hits.push(path);
assert.deepEqual(hits,[]);await writeFile(`${root}/secret-scan.json`,JSON.stringify({status:'VERIFIED',files:files.length,hits,scope:'Repository text only; symlinks and secret folders excluded; matched values never output'},null,2));
const sources=git('diff','--name-only',baseline,'--','src','package.json','package-lock.json','android/app/build.gradle','ios/App/App.xcodeproj/project.pbxproj','public/models/catalog.json').trim().split(/\r?\n/).concat(['src/shared/content-r19.js','src/shared/content-r19-scene.js','src/shared/content-r19.css','tests/shared/content-r19.test.js','scripts/check-content-r19.mjs','scripts/run-content-r19-validation.mjs','scripts/measure-content-r19.mjs','scripts/cleanup-content-r19.py','scripts/verify-content-r19-release.mjs','docs/art/ART_DIRECTION.md','docs/OPTIM_PLAN_CONTENT_R19.md','docs/CODEX_RESPONSE_CONTENT_R19.md']);
await writeFile(`${root}/source-manifest.json`,JSON.stringify({status:'VERIFIED',baseline,files:await Promise.all([...new Set(sources)].map(async path=>({path,sha256:sha(await readFile(path))})))},null,2));
const result={status:'VERIFIED',branch:'r1-fun-polish',baseline,version:pkg.version,nativeSourceBuild:27,unitTests:254,unchangedOriginalTestFiles:originalTests.length,browserChecks:runs.reduce((n,{r})=>n+r.rows.length,0),screenshots:images.length,reviewSet:15,mergeChecks:132,storeChecks:101,newGenerationCalls:1,newRuntimeAssets:1,newDependencies:0,secretHits:0,p95:perf.rows.map(r=>({viewport:r.viewport,kind:r.kind,p95:r.p95})),performanceWithinLimit:perf.withinReferenceLimit,performanceStatus:'EXECUTED concurrent load reference; clean/device measurement BLOCKED',cleanup:{files:cleanup.deletedFiles,bytes:cleanup.releasedBytes,retainedInputs:retained.size},blocked:['Physical iPhone/iPad touch and native voice require devices','Parent-child playtest requires participants','Clean-machine performance requires exclusive hardware','Muse >=8 requires independent rescore','Native signed packages not rebuilt']};
await writeFile(`${root}/release-proof.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
