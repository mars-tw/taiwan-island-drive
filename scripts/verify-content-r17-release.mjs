import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,mkdir,copyFile,lstat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='docs/content/r17',baseline='4af0b7fce9927445217b6b702a3c46d83d055d41';
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:64*1024*1024});
const text=async p=>{const b=await readFile(p);return b[0]===255&&b[1]===254?b.toString('utf16le').slice(1):b.toString('utf8');};
const json=async p=>JSON.parse(await text(p));
const pkg=await json('package.json'),lock=await json('package-lock.json');
assert.equal(pkg.version,'2.29.0');assert.equal(lock.version,pkg.version);assert.equal(lock.packages[''].version,pkg.version);
assert.equal(git('branch','--show-current').trim(),'r1-fun-polish');
const preserved=await json(`${root}/preserved-user-files.json`),staged=new Set(git('diff','--cached','--name-only','-z').split('\0'));
for(const f of preserved.files){assert.equal(sha(await readFile(f.path)),f.sha256);assert.equal(staged.has(f.path),false,'User review must remain untracked');}
for(const key of ['dependencies','devDependencies'])assert.deepEqual(pkg[key],JSON.parse(git('show',baseline+':package.json'))[key]);
for(const path of ['package.json','package-lock.json','src/games/car/config.js','public/models/catalog.json','android/app/build.gradle','ios/App/App.xcodeproj/project.pbxproj']){
 assert.ok((await text(path)).includes('2.29.0'));assert.ok(!(await text(path)).includes('2.28.0'));
}
assert.match(await text('android/app/build.gradle'),/versionCode 25/);
assert.equal(((await text('ios/App/App.xcodeproj/project.pbxproj')).match(/CURRENT_PROJECT_VERSION = 25;/g)||[]).length,2);
const oldTests=git('ls-tree','-r','--name-only',baseline,'tests').trim().split(/\r?\n/);
for(const path of oldTests)assert.equal((await text(path)).replaceAll('\r\n','\n'),git('show',baseline+':'+path).replaceAll('\r\n','\n'),'Existing test changed '+path);
assert.equal(git('diff','--diff-filter=DMRT','--name-only',baseline,'--','docs/store/screenshots').trim(),'','Existing store media changed');
assert.match(await text(`${root}/unit-tests.txt`),/pass 242/);assert.match(await text(`${root}/unit-tests.txt`),/fail 0/);
assert.match(await text(`${root}/build-test.txt`),/built in/);
const runPaths=[`${root}/layout-proof/browser-layout.json`,...['all','negative','state','store'].map(x=>`${root}/browser-${x}.json`),`${root}/offline/browser-offline.json`,`${root}/browser-crossing.json`,`${root}/browser-matrix.json`,`${root}/offline/browser-offline-crossing.json`];
const runs=await Promise.all(runPaths.map(json));
for(const run of runs){assert.equal(run.status,'VERIFIED');for(const key of ['errors','external','http'])assert.deepEqual(run[key],[]);}
const latest=new Map(),recaptures=[];
for(const [index,run] of runs.entries())for(const shot of run.shots){const old=latest.get(shot.path);if(old&&old.shot.sha256!==shot.sha256)recaptures.push({path:shot.path,previousManifest:old.manifest,previousSha256:old.shot.sha256,currentManifest:runPaths[index],currentSha256:shot.sha256});latest.set(shot.path,{shot,manifest:runPaths[index]});}
const shots=[...latest.values()].map(x=>x.shot);
await writeFile(`${root}/recaptures.json`,JSON.stringify({status:'VERIFIED',policy:'Execution manifests retain capture-time hashes. Later focused crossing and matrix runs replace same-name images. screenshots.json is the delivered current-image index; review-set contains byte-identical copies of those originals.',recaptures},null,2));
for(const s of shots){const b=await readFile(s.path);assert.equal(sha(b),s.sha256,s.path);assert.equal(b.readUInt32BE(16),s.width);assert.equal(b.readUInt32BE(20),s.height);}
const get=name=>{const s=shots.find(s=>s.path===`${root}/phone-${name}.png`);assert.ok(s,name);assert.equal(s.width,390);assert.equal(s.height,844);return s;};
const held=get('cake-stage-2-left-half-second'),released=get('cake-stage-2-left-recovered');
assert.equal(held.controls.find(x=>x.id==='left').held,'true');assert.equal(held.controls.find(x=>x.id==='left').color,'rgb(255, 211, 68)');
const carMatrix=held.regression.turn.match(/matrix\(([^)]+)\)/);assert.ok(carMatrix);const components=carMatrix[1].split(',').map(Number);assert.ok(Math.abs(Math.atan2(components[1],components[0])*180/Math.PI)>=8,'car visibly turns at least eight degrees');
assert.equal(released.controls.find(x=>x.id==='left').held,'false');assert.equal(released.controls.find(x=>x.id==='left').color,'rgb(255, 255, 255)');
assert.match(get('crossing-wrong-side').hint,/你先看了右邊/);
assert.ok(get('tickets-stage-1-wrong').geometry.signs.some(x=>x.text.includes('你選的')));
for(const [stage,person] of [[1,'child'],[2,'grandma'],[3,'bike']]){
 for(const side of ['left','right'])assert.ok(get(`crossing-stage-${stage}-${person}-look-${side}`).regression.ellipse);
 assert.equal(get(`crossing-stage-${stage}-${person}-moving-2`).regression.ellipse,null);
 const frames=[1,2,3].map(n=>get(`crossing-stage-${stage}-traffic-moving-${n}`));
 assert.ok(Math.abs(frames[2].regression.traffic.x-frames[0].regression.traffic.x)>30,'visible lane travel');
}
assert.notEqual(get('cake-first-bend').state.bend,get('cake-replay-bend').state.bend);
assert.notEqual(get('tickets-unselected').state.targetName,get('tickets-replay-layout').state.targetName);
assert.match(get('tickets-replay-old-position').hint,/形狀|顏色/);
assert.ok(Math.abs(get('crossing-replay-traffic').regression.traffic.x-get('crossing-stage-1-child-look-left').regression.traffic.x)>100);
const selected=[
 ['cake-stage-2-wrong-turn','蛋糕錯向，安全停下且可修正'],
 ['cake-stage-2-left-half-second','同站按住左轉0.5秒，實心黃與下沉邊'],
 ['cake-stage-2-left-recovered','同站放開回穩，白底下一步，與按住不同'],
 ['cake-tray-edge-stopped','盤緣緩停、等待回穩，保留核心互動回歸'],
 ['cake-replay-old-direction','重玩互換首彎，沿用舊方向得到具體錯誤'],
 ['crossing-stage-1-child-look-left','第一站看左，來車在橫向車道'],
 ['crossing-stage-1-child-look-right','同一來車前進、改看右側空車道入口'],
 ['crossing-stage-2-grandma-moving-2','第二站奶奶在斑馬線，觀察圈已收起'],
 ['crossing-stage-2-grandma-moving-3','同位奶奶繼續前進，同一玩家車'],
 ['crossing-stage-3-bike-look-right','第三站看右，只圈車道，不切人物名牌'],
 ['tickets-stage-1-wrong','同站錯選外框與你選的小籤，人物不與車重疊'],
 ['tickets-stage-1-chosen','同站改選、開門、點唯一小安後才邀請'],
 ['tickets-stage-1-boarding-1-2','小安向門內走，受門框遮擋；全畫面唯一身份'],
 ['tickets-stage-1-seated-1','同位小安入座，月台2人、車內1人'],
 ['tickets-saved-result','結尾同一比例列車、同三位乘客，保存重載']
];
await mkdir(`${root}/review-set`,{recursive:true});const review=[];
for(const [i,[name,purpose]] of selected.entries()){
 const s=get(name),path=`${root}/review-set/${String(i+1).padStart(2,'0')}-${name}.png`;
 await copyFile(s.path,path);assert.equal(sha(await readFile(path)),s.sha256);review.push({index:i+1,path,source:s.path,purpose,width:s.width,height:s.height,sha256:s.sha256});
}
assert.equal((await readdir(`${root}/review-set`)).length,15);
await writeFile(`${root}/review-set-manifest.json`,JSON.stringify({status:'VERIFIED',count:15,perCourse:5,method:'Byte-identical unmodified 390x844 portrait PNG copies. Ordered by course and operation. No montage, resizing or verification overlays.',images:review},null,2));
await writeFile(`${root}/review-guide.md`,'# R17 審查精選\n\nVERIFIED：15張390×844原圖，每課5張。只審review-set；執行者不自行給Muse分數。\n\n'+review.map(x=>`${String(x.index).padStart(2,'0')}．${x.purpose}：${x.path}`).join('\n\n')+'\n\n三站各自左右觀察、車道連拍、錯序、重玩新舊題、九次過街與上車、收階關門、八視口及離線補充圖列於acceptance.json／screenshots.json；不宣稱15張已涵蓋所有補充項目。\n');
const groups=[
 {item:1,title:'按住與下一步分態',names:['cake-stage-2-wrong-turn','cake-stage-2-left-half-second','cake-stage-2-left-recovered','cake-tray-edge-stopped']},
 {item:2,title:'三站觀察只指車道',names:[1,2,3].flatMap((stage,i)=>['left','right'].map(side=>`crossing-stage-${stage}-${['child','grandma','bike'][i]}-look-${side}`)),humanStatus:'BLOCKED - 需要參與者遮住字幕辨識方向與目標，未以自審代替'},
 {item:3,title:'上車全畫面唯一乘客',names:[1,2,3].flatMap(stage=>[`tickets-stage-${stage}-chosen`,`tickets-stage-${stage}-boarding-1-2`,`tickets-stage-${stage}-seated-1`])},
 {item:4,title:'主場景標出錯選與錯序',names:['tickets-stage-1-wrong','crossing-wrong-side']},
 {item:5,title:'重玩換題及舊選擇不能通關',names:['cake-first-bend','cake-replay-bend','cake-replay-old-direction','crossing-stage-1-child-look-left','crossing-replay-traffic','tickets-unselected','tickets-replay-layout','tickets-replay-old-position']}
];
await writeFile(`${root}/acceptance.json`,JSON.stringify({status:'VERIFIED',source:'docs/content/CONTENT_REVIEW_R16_MUSE.md',items:groups.map(g=>({...g,status:'VERIFIED automatic evidence',images:g.names.map(get)})),laneMotion:[1,2,3].map(stage=>[1,2,3].map(n=>get(`crossing-stage-${stage}-traffic-moving-${n}`))),limits:['Observer identification check remains BLOCKED','Executing-agent verification, not independent Muse score']},null,2));
await writeFile(`${root}/screenshots.json`,JSON.stringify({status:'VERIFIED',count:shots.length,images:shots},null,2));
const art=await json(`${root}/art/manifest.json`),prompt=await json(`${root}/art/PROMPTS.json`);
assert.equal(prompt.tool,'image_gen.imagegen');assert.equal(prompt.model_slug,null);
assert.ok(prompt.prompt.startsWith((await json('docs/content/r16/art/PROMPTS.json')).style_prefix));
for(const a of art.assets)assert.equal(sha(await readFile(a.path)),a.sha256);
const storeShots=shots.filter(s=>s.path.startsWith('docs/store/'));for(const [w,h] of [[1290,2796],[2064,2752]])assert.ok(storeShots.some(s=>s.width===w&&s.height===h));
const comparisons=await json(`${root}/before-images.json`);
for(const row of comparisons){const after=row.path.replace('/before-','/after-'),source=row.path.replace('docs/evidence/content-r17/before-',`${root}/device-`);await copyFile(source,after);row.after=after;row.afterSha256=sha(await readFile(after));assert.equal(sha(await readFile(row.path)),row.sha256);}
await writeFile(`${root}/before-after.json`,JSON.stringify({status:'VERIFIED',method:'Unscaled original screenshot byte copies; historical and current device views',comparisons},null,2));
if(process.env.R17_PREPARE_ONLY==='1'){console.log(JSON.stringify({status:'VERIFIED',shots:shots.length,review:15}));process.exit(0);}
const cleanup=await json(`${root}/cleanup-result.json`);assert.equal(cleanup.status,'EXECUTED');
for(const f of cleanup.files)assert.equal(await lstat(f.path).then(()=>true,()=>false),false);
for(const f of cleanup.retained)assert.equal(await lstat(f.path).then(()=>true,()=>false),true);
const merge=await json(`${root}/merge/merge-path.json`),store=await json(`${root}/store/review-path.json`),perf=await json(`${root}/performance.json`);
for(const run of [merge,store]){assert.deepEqual(run.errors,[]);assert.deepEqual(run.externalRequests,[]);for(const row of run.rows)assert.deepEqual(row.problems,[]);}
assert.equal(merge.rows.length,132);assert.equal(store.rows.length,101);assert.equal(perf.withinReferenceLimit,true);
const files=[];async function scan(dir){for(const e of await readdir(dir,{withFileTypes:true})){
 if(e.isSymbolicLink()||['.git','.secrets','node_modules','dist','dist-native','.audit-tmp','output','release','.gradle','build','DerivedData','__pycache__'].includes(e.name))continue;
 const path=`${dir}/${e.name}`;if(e.isDirectory())await scan(path);else if(/\.(js|mjs|json|md|html|css|txt|gradle|pbxproj|xml|yml|yaml|py|ps1|swift|plist|svg|webmanifest)$/i.test(e.name))files.push(path);
}}await scan('.');
const hits=[];for(const path of files)if(/sk-proj-[A-Za-z0-9_-]{20}|sk-[a-z0-9]{40}|AIza[0-9A-Za-z_-]{35}|gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{50,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----|xox[baprs]-[A-Za-z0-9-]{20,}/.test(await text(path)))hits.push(path);
assert.deepEqual(hits,[]);await writeFile(`${root}/secret-scan.json`,JSON.stringify({status:'VERIFIED',files:files.length,hits,scope:'Repository text only; symlinks and secret directories excluded; no matched values output'},null,2));
const sourceFiles=['CREDITS.md','package.json','package-lock.json','android/app/build.gradle','ios/App/App.xcodeproj/project.pbxproj','src/games/car/config.js','public/models/catalog.json','src/shared/content-r1-ui.js','src/shared/content-r17.js','src/shared/content-r17-scene.js','src/shared/content-r17.css','tests/shared/content-r17.test.js','scripts/check-content-r17.mjs','scripts/run-content-r17-validation.mjs','scripts/measure-content-r17.mjs','scripts/cleanup-content-r17.py','scripts/verify-content-r17-release.mjs','docs/art/ART_DIRECTION.md','docs/OPTIM_PLAN_CONTENT_R17.md','docs/CODEX_RESPONSE_CONTENT_R17.md'];
await writeFile(`${root}/source-manifest.json`,JSON.stringify({status:'VERIFIED',baseline,files:await Promise.all(sourceFiles.map(async path=>({path,sha256:sha(await readFile(path))})))},null,2));
const report={status:'VERIFIED',branch:'r1-fun-polish',baseline,version:pkg.version,nativeSourceBuild:25,unitTests:242,oldTestFilesUnchanged:oldTests.length,browserChecks:runs.reduce((n,r)=>n+r.rows.length,0),originalScreenshots:shots.length,reviewSet:15,mergeChecks:merge.rows.length,storeChecks:store.rows.length,newGenerationCalls:1,newRuntimeAssets:1,newDependencies:0,secretHits:0,maxMedianP95:Math.max(...perf.rows.map(r=>r.p95)),performanceStatus:'EXECUTED - concurrent host reference only',cleanup:{files:cleanup.deletedFiles,bytes:cleanup.releasedBytes,retainedInputs:cleanup.retained.length},blocked:['Human observer direction/target check needs a participant','Physical iPhone/iPad touch and native voice need devices','Parent-child playtest needs participants','Clean-machine performance needs exclusive hardware','Muse >=8 needs independent rescore','Native rebuild and signing not performed']};
await writeFile(`${root}/release-proof.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
