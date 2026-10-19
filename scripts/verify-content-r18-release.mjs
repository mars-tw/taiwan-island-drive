import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,mkdir,copyFile,lstat,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='docs/content/r18',baseline='65834975c39b72472a1c1e67dbcf80cf11dee14d';
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:64*1024*1024});
const text=async p=>{const b=await readFile(p);return b[0]===255&&b[1]===254?b.toString('utf16le').slice(1):b.toString('utf8');};
const json=async p=>JSON.parse(await text(p));
const pkg=await json('package.json'),lock=await json('package-lock.json');
assert.equal(pkg.version,'2.30.0');assert.equal(lock.version,pkg.version);assert.equal(lock.packages[''].version,pkg.version);
assert.equal(git('branch','--show-current').trim(),'r1-fun-polish');
const preserved=await json(`${root}/preserved-user-files.json`),staged=new Set(git('diff','--cached','--name-only','-z').split('\0'));
for(const f of preserved.files){assert.equal(sha(await readFile(f.path)),f.sha256);assert.equal(staged.has(f.path),false);}
for(const key of ['dependencies','devDependencies'])assert.deepEqual(pkg[key],JSON.parse(git('show',baseline+':package.json'))[key]);
for(const path of ['package.json','package-lock.json','src/games/car/config.js','public/models/catalog.json','android/app/build.gradle','ios/App/App.xcodeproj/project.pbxproj']){
 assert.ok((await text(path)).includes('2.30.0'));assert.ok(!(await text(path)).includes('2.29.0'));
}
assert.match(await text('android/app/build.gradle'),/versionCode 26/);
assert.equal(((await text('ios/App/App.xcodeproj/project.pbxproj')).match(/CURRENT_PROJECT_VERSION = 26;/g)||[]).length,2);
const oldTests=git('ls-tree','-r','--name-only',baseline,'tests').trim().split(/\r?\n/);
for(const path of oldTests)assert.equal((await text(path)).replaceAll('\r\n','\n'),git('show',baseline+':'+path).replaceAll('\r\n','\n'),'Existing test changed '+path);
assert.equal(git('diff','--diff-filter=DMRT','--name-only',baseline,'--','docs/store/screenshots').trim(),'','Existing store media changed');
assert.match(await text(`${root}/unit-tests.txt`),/pass 248/);assert.match(await text(`${root}/unit-tests.txt`),/fail 0/);
assert.match(await text(`${root}/build-test.txt`),/built in/);
const runPaths=[`${root}/browser-cake.json`,`${root}/browser-all.json`,`${root}/browser-negative.json`,`${root}/browser-state.json`,`${root}/browser-store.json`,`${root}/layout-proof/browser-layout.json`,`${root}/offline/browser-offline.json`,`${root}/viewport-320x568/browser-journeys.json`,`${root}/viewport-568x320/browser-journeys.json`];
const runs=[];for(const path of runPaths){const r=await json(path);assert.equal(r.status,'VERIFIED',path);for(const k of ['errors','external','http'])assert.deepEqual(r[k],[]);runs.push({path,r,time:(await stat(path)).mtimeMs});}
// Focused reruns may replace same-name PNGs. Deliver the latest capture hash.
const latest=new Map(),recaptures=[];for(const {path,r} of runs.sort((a,b)=>a.time-b.time))for(const s of r.shots){const old=latest.get(s.path);if(old&&old.sha256!==s.sha256)recaptures.push({path:s.path,previousSha256:old.sha256,currentSha256:s.sha256,currentManifest:path});latest.set(s.path,s);}
await writeFile(`${root}/recaptures.json`,JSON.stringify({status:'VERIFIED',policy:'Run manifests retain capture-time hashes. Later focused reruns replace same-name PNGs. screenshots.json is the delivered current-image index; review-set is copied from that index.',recaptures},null,2));
const shots=[...latest.values()];
for(const s of shots){const b=await readFile(s.path);assert.equal(sha(b),s.sha256,s.path);assert.equal(b.readUInt32BE(16),s.width);assert.equal(b.readUInt32BE(20),s.height);assert.deepEqual(s.screenContract.failures,[]);assert.deepEqual(s.screenContract.overlaps,[]);}
const get=name=>{const s=shots.find(s=>s.path===`${root}/phone-${name}.png`);assert.ok(s,name);assert.equal(s.width,390);assert.equal(s.height,844);return s;};
for(const n of ['cake-tray-edge-sliding','cake-tray-edge-recovering','cake-tray-edge-recovered'])assert.ok(get(n).controls.filter(b=>['left','right','go'].includes(b.id)).every(b=>b.held==='false'));
assert.equal(get('cake-tray-edge-recovered').state.hazard,'false');
assert.notEqual(get('cake-first-bend').state.bend,get('cake-replay-old-direction').state.bend);
assert.equal(get('cake-replay-old-direction').state.inBend,'true');assert.match(get('cake-replay-old-direction').hint,/方向相反/);
assert.match(get('crossing-stage-1-child-look-left').hint,/左邊有車/);assert.match(get('crossing-stage-1-child-look-right').hint,/右邊沒車/);assert.match(get('crossing-same-station-right-has-car').hint,/右邊有車/);
for(let stage=1;stage<=3;stage++){const s=get(`crossing-stage-${stage}-ready-depart`);assert.equal(s.screenContract.stageDots,stage);assert.match(s.screenContract.progress,new RegExp('路口完成 '+stage+'/3'));assert.match(s.regression.playerSource,/content-r11\/car-rear/);}
assert.match(get('crossing-stage-2-grandma-moving-3').hint,/到了/);
for(const stage of [1,2,3])for(const state of ['seated-3','close-ready','closed','departing-2'])assert.ok(get(`tickets-stage-${stage}-${state}`));
const selected=[
 ['cake-first-bend','首輪右彎，路與牌可判斷方向'],
 ['cake-replay-old-direction','重玩左彎，沿用右轉不增加路程'],
 ['cake-tray-edge-sliding','盤緣：方向鍵已退出按住態'],
 ['cake-tray-edge-recovering','連續回穩中：蛋糕向中央回來'],
 ['cake-tray-edge-recovered','連續回正：回到中央才恢復下一步'],
 ['crossing-stage-1-child-look-left','第一站看左有車，來車完整且標籤在圈外'],
 ['crossing-stage-1-child-look-right','同站看右無車，另述另一側車流'],
 ['crossing-same-station-right-has-car','同站連續等車，車來到右側，字幕同步'],
 ['crossing-stage-2-grandma-moving-3','第二站奶奶到岸即改為到了'],
 ['crossing-stage-3-departing-2','第三站3/3與三點一致，車尾朝玩家向上出發'],
 ['tickets-stage-1-wrong','錯選小籤兩行完整，不與人數標籤重疊'],
 ['tickets-stage-1-seated-3','三人已入座，門和踏階仍開，等玩家操作'],
 ['tickets-stage-1-close-ready','玩家已收踏階，門仍開，下一步關門'],
 ['tickets-stage-1-closed','玩家關好門後，等按前進'],
 ['tickets-stage-1-departing-2','玩家按前進後列車實際駛離，尚未跳結果']
];
await mkdir(`${root}/review-set`,{recursive:true});const review=[];
for(const [i,[name,purpose]] of selected.entries()){const s=get(name),path=`${root}/review-set/${String(i+1).padStart(2,'0')}-${name}.png`;await copyFile(s.path,path);assert.equal(sha(await readFile(path)),s.sha256);review.push({index:i+1,path,source:s.path,purpose,width:s.width,height:s.height,sha256:s.sha256});}
assert.equal((await readdir(`${root}/review-set`)).length,15);
await writeFile(`${root}/review-set-manifest.json`,JSON.stringify({status:'VERIFIED',count:15,perCourse:5,method:'Unmodified byte-identical original 390x844 portrait screenshots, ordered by course; no montage or overlays',images:review},null,2));
await writeFile(`${root}/review-guide.md`,'# R18 審查精選\n\nVERIFIED：15張390×844原圖，每課5張，依課程順序。\n\n'+review.map(x=>`${String(x.index).padStart(2,'0')}．${x.purpose}：${x.path}`).join('\n\n')+'\n\n15張上限優先包含五項Muse修正及本線回歸；三站計數1→2→3、三站車尾、上車門前→門框→窗內、錯序、存檔重載及三視口錯選另有完整原圖，見acceptance.json及交付報告。精選未容納的補充圖不冒稱審查員已看。\n');
const groups=[
 {item:1,title:'看哪邊就說哪邊',names:['crossing-stage-1-child-look-left','crossing-stage-1-child-look-right','crossing-same-station-right-has-car']},
 {item:2,title:'到岸及出發閉環',names:['crossing-stage-2-grandma-moving-2','crossing-stage-2-grandma-moving-3','crossing-stage-2-grandma-arrived',...[1,2,3].map(n=>`crossing-stage-${n}-ready-depart`),'crossing-stage-3-departing-1','crossing-stage-3-departing-2','crossing-stage-3-departing-3']},
 {item:3,title:'盤緣放開與回穩',names:['cake-tray-edge-sliding','cake-tray-edge-recovering','cake-tray-edge-recovered']},
 {item:4,title:'重玩彎道與舊方向',names:['cake-first-start','cake-first-bend','cake-replay-bend','cake-replay-old-direction']},
 {item:5,title:'錯選及玩家收階關門出發',names:['tickets-stage-1-wrong','tickets-stage-1-seated-3','tickets-stage-1-close-ready','tickets-stage-1-closed','tickets-stage-1-departing-1','tickets-stage-1-departing-2','tickets-stage-1-departing-3','tickets-saved-result']}
];
await writeFile(`${root}/acceptance.json`,JSON.stringify({status:'VERIFIED',source:'docs/content/CONTENT_REVIEW_R17_MUSE.md',items:groups.map(g=>({...g,status:'VERIFIED automatic and screenshot evidence',images:g.names.map(get)})),boarding:[1,2,3].map(stage=>['boarding-1-1','boarding-1-2','seated-1'].map(n=>get(`tickets-stage-${stage}-${n}`))),limits:['Executing-agent verification; independent Muse rescore remains BLOCKED','15 review screenshots cannot include every supplemental acceptance frame']},null,2));
await writeFile(`${root}/screenshots.json`,JSON.stringify({status:'VERIFIED',count:shots.length,images:shots},null,2));
for(const a of (await json(`${root}/art/manifest.json`)).assets)assert.equal(sha(await readFile(a.path)),a.sha256);
const storeShots=shots.filter(s=>s.path.startsWith('docs/store/'));for(const [w,h] of [[1290,2796],[2064,2752]])assert.ok(storeShots.some(s=>s.width===w&&s.height===h));
const comparisons=await json(`${root}/before-images.json`);for(const row of comparisons){const kind=row.path.match(/before-(\w+)/)[1],name={cake:'cake-replay-old-direction',crossing:'crossing-stage-1-child-look-left',tickets:'tickets-stage-1-wrong'}[kind],source=get(name);row.after=row.path.replace('before-','after-');await copyFile(source.path,row.after);row.afterSha256=source.sha256;assert.equal(sha(await readFile(row.path)),row.sha256);}
await writeFile(`${root}/before-after.json`,JSON.stringify({status:'VERIFIED',method:'Unscaled original screenshot copies',comparisons},null,2));
if(process.env.R18_PREPARE_ONLY==='1'){console.log(JSON.stringify({status:'VERIFIED',shots:shots.length,review:15}));process.exit(0);}
const cleanup=await json(`${root}/cleanup-result.json`);assert.equal(cleanup.status,'EXECUTED');for(const f of cleanup.files)assert.equal(await lstat(f.path).then(()=>true,()=>false),false);for(const f of cleanup.retained)assert.equal(await lstat(f.path).then(()=>true,()=>false),true);
const merge=await json(`${root}/merge/merge-path.json`),store=await json(`${root}/store/review-path.json`),perf=await json(`${root}/performance.json`);
for(const run of [merge,store]){assert.deepEqual(run.errors,[]);assert.deepEqual(run.externalRequests,[]);for(const row of run.rows)assert.deepEqual(row.problems,[]);}
assert.equal(merge.rows.length,132);assert.equal(store.rows.length,101);
const files=[];async function scan(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(e.isSymbolicLink()||['.git','.secrets','node_modules','dist','dist-native','.audit-tmp','output','release','.gradle','build','DerivedData','__pycache__'].includes(e.name))continue;const path=`${dir}/${e.name}`;if(e.isDirectory())await scan(path);else if(/\.(js|mjs|json|md|html|css|txt|gradle|pbxproj|xml|yml|yaml|py|ps1|swift|plist|svg|webmanifest)$/i.test(e.name))files.push(path);}}
await scan('.');const hits=[];for(const path of files)if(/sk-proj-[A-Za-z0-9_-]{20}|sk-[a-z0-9]{40}|AIza[0-9A-Za-z_-]{35}|gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{50,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----|xox[baprs]-[A-Za-z0-9-]{20,}/.test(await text(path)))hits.push(path);
assert.deepEqual(hits,[]);await writeFile(`${root}/secret-scan.json`,JSON.stringify({status:'VERIFIED',files:files.length,hits,scope:'Repository text only; symlinks and secret directories excluded; no matched values output'},null,2));
const sources=['package.json','package-lock.json','src/games/car/config.js','public/models/catalog.json','android/app/build.gradle','ios/App/App.xcodeproj/project.pbxproj','src/shared/content-r1-ui.js','src/shared/content-r18.js','src/shared/content-r18-scene.js','src/shared/content-r18.css','tests/shared/content-r18.test.js','scripts/check-content-r18.mjs','scripts/run-content-r18-validation.mjs','scripts/measure-content-r18.mjs','scripts/cleanup-content-r18.py','scripts/verify-content-r18-release.mjs','docs/art/ART_DIRECTION.md','docs/OPTIM_PLAN_CONTENT_R18.md','docs/CODEX_RESPONSE_CONTENT_R18.md'];
await writeFile(`${root}/source-manifest.json`,JSON.stringify({status:'VERIFIED',baseline,files:await Promise.all(sources.map(async path=>({path,sha256:sha(await readFile(path))})))},null,2));
const report={status:'VERIFIED',branch:'r1-fun-polish',baseline,version:pkg.version,nativeSourceBuild:26,unitTests:248,oldTestFilesUnchanged:oldTests.length,browserChecks:runs.reduce((n,{r})=>n+r.rows.length,0),originalScreenshots:shots.length,reviewSet:15,mergeChecks:merge.rows.length,storeChecks:store.rows.length,newGenerationCalls:0,newRuntimeAssets:0,newDependencies:0,secretHits:0,maxMedianP95:Math.max(...perf.rows.map(r=>r.p95)),withinReferenceLimit:perf.withinReferenceLimit,performanceStatus:'EXECUTED concurrent load reference; clean/native measurement BLOCKED',cleanup:{files:cleanup.deletedFiles,bytes:cleanup.releasedBytes,retainedInputs:cleanup.retained.length},blocked:['Physical iPhone/iPad touch and native voice need devices','Parent-child playtest and covered-caption direction judgement need participants','Clean-machine performance needs exclusive hardware','Muse >=8 needs independent rescore','Native signed packages not rebuilt']};
await writeFile(`${root}/release-proof.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
