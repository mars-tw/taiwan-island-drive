import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,mkdir,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root='docs/content/r16',baseline='c429d761fe79e7e48c61345ad6b8e50e93a1dd8d';
const sha=b=>createHash('sha256').update(b).digest('hex'),git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:32*1024*1024});
const text=async p=>{const b=await readFile(p);return b[0]===255&&b[1]===254?b.toString('utf16le').slice(1):b.toString('utf8');},json=async p=>JSON.parse(await text(p));
const pkg=await json('package.json'),lock=await json('package-lock.json');assert.equal(pkg.version,'2.28.0');assert.equal(lock.version,pkg.version);assert.equal(lock.packages[''].version,pkg.version);
assert.equal(git('branch','--show-current').trim(),'r1-fun-polish');
for(const k of ['dependencies','devDependencies'])assert.deepEqual(pkg[k],JSON.parse(git('show',baseline+':package.json'))[k]);
for(const path of ['package.json','package-lock.json','src/games/car/config.js','public/models/catalog.json','android/app/build.gradle','ios/App/App.xcodeproj/project.pbxproj']){assert.ok((await text(path)).includes('2.28.0'));assert.ok(!(await text(path)).includes('2.27.0'));}
assert.match(await text('android/app/build.gradle'),/versionCode 24/);assert.match(await text('ios/App/App.xcodeproj/project.pbxproj'),/CURRENT_PROJECT_VERSION = 24/);
const oldTests=git('ls-tree','-r','--name-only',baseline,'tests').trim().split(/\r?\n/);for(const p of oldTests)assert.equal((await text(p)).replaceAll('\r\n','\n'),git('show',baseline+':'+p).replaceAll('\r\n','\n'),'Existing test changed '+p);
assert.equal(git('diff','--diff-filter=DMRT','--name-only',baseline,'--','docs/store/screenshots').trim(),'','Existing store screenshot changed');
assert.match(await text(`${root}/unit-tests.txt`),/pass 237/);assert.match(await text(`${root}/unit-tests.txt`),/fail 0/);
const layout=await json(`${root}/layout-proof/browser-layout.json`);await copyFile(`${root}/layout-proof/browser-layout.json`,`${root}/browser-layout.json`);
const runs=[layout,...await Promise.all(['all','negative','state','store'].map(s=>json(`${root}/browser-${s}.json`))),await json(`${root}/offline/browser-offline.json`)];
for(const r of runs){assert.equal(r.status,'VERIFIED');for(const k of ['errors','external','http'])assert.deepEqual(r[k],[]);}
const shots=[...new Map(runs.flatMap(r=>r.shots).map(s=>[s.path,s])).values()];
for(const s of shots){const b=await readFile(s.path);assert.equal(sha(b),s.sha256,s.path);assert.equal(b.readUInt32BE(16),s.width);assert.equal(b.readUInt32BE(20),s.height);}
const get=name=>{const s=shots.find(s=>s.path===`${root}/phone-${name}.png`);assert.ok(s,name);assert.equal(s.width,390);assert.equal(s.height,844);return s;};
for(const s of shots.filter(s=>s.path.includes('phone-cake-'))){assert.equal(s.geometry.mini,s.geometry.large);assert.doesNotMatch(s.hint,/可起步|回穩 \d+ 次|蛋糕歪了/);}
assert.ok(runs[2].rows.some(r=>r.roadMove>=40));
assert.equal(get('cake-tray-edge-stopped').state.bend,'-1');
const selected=[
 ['cake-stage-2-wrong-turn','同站錯向，安全停下且可修正'],
 ['cake-stage-2-left-driving','同站正確按住左轉，綠色正向回饋'],
 ['cake-stage-2-left-recovered','同站放開回穩，狀態與下一步一致'],
 ['cake-tray-edge-stopped','同一左彎持續按住後滑移緩停'],
 ['cake-saved-result','完整三層蛋糕送到朋友桌上，重載保存'],
 ['crossing-wrong-side','兩側皆可點，順序錯誤有溫和修正'],
 ['crossing-stage-1-child-look-left','駕駛看左，範圍與來車可見'],
 ['crossing-stage-1-child-look-right','駕駛看右，觀察範圍換側、來車接近'],
 ['crossing-stage-2-grandma-moving-2','第二站由右側起步，奶奶過街；路面、站位及車流方向改變'],
 ['crossing-saved-result','同三位朋友在對岸揮手，重載三站成果'],
 ['tickets-unselected','同站三個月台無預先答案'],
 ['tickets-stage-1-wrong','同站錯選指出顏色，門不能開'],
 ['tickets-stage-1-chosen','同站改選、停穩開門，玩家點人後才邀請'],
 ['tickets-stage-1-boarding-1-2','同一乘客跨門檻進車，其他人仍候車'],
 ['tickets-saved-result','同三人車窗揮手、列車在海岸軌道上，重載成果']
];
await mkdir(`${root}/review-set`,{recursive:true});const review=[];
for(let i=0;i<selected.length;i++){const [name,purpose]=selected[i],s=get(name),path=`${root}/review-set/${String(i+1).padStart(2,'0')}-${name}.png`;await copyFile(s.path,path);assert.equal(sha(await readFile(path)),s.sha256);review.push({index:i+1,path,source:s.path,purpose,width:s.width,height:s.height,sha256:s.sha256});}
assert.equal((await readdir(`${root}/review-set`)).length,15);
await writeFile(`${root}/review-set-manifest.json`,JSON.stringify({status:'VERIFIED',count:15,perCourse:5,method:'Byte-for-byte original portrait PNG copies, ordered by course. The first three cake frames and ticket choice frames share their station. Supplementary originals are not assumed to be reviewed.',images:review},null,2));
await writeFile(`${root}/review-guide.md`,'# R16 審查精選\n\nVERIFIED：恰15張390×844原圖，每課5張，依課程與操作因果排列。這份索引不是Muse分數。只交review-set即可；補充原圖不假稱審查員已看過。\n\n'+review.map(r=>`${String(r.index).padStart(2,'0')}．${r.purpose}：${r.path}`).join('\n\n')+'\n\n其餘原圖含兩彎、盤緣三格、九位過街、九位邀請、收階關門、三站佈局、八視口、離線與重玩，完整列表見screenshots.json。\n');
const groups=[
 {item:1,title:'蛋糕錯向、正確轉彎與放開回穩一致',names:['cake-stage-2-wrong-turn','cake-stage-2-left-driving','cake-stage-2-left-recovered','cake-positive-half-second','cake-tray-edge-sliding','cake-tray-edge-stopped','cake-tray-edge-recovered','cake-stage-2-right-driving','cake-stage-3-bay-stopped','cake-stage-3-bay-restarted']},
 {item:2,title:'場景內駕駛看左右，人物過街可辨',names:['crossing-stage-1-child-look-left','crossing-stage-1-child-look-right','crossing-stage-1-child-moving-2','crossing-stage-1-bike-moving-2','crossing-stage-1-grandma-moving-2','crossing-stage-1-start','crossing-stage-2-start','crossing-stage-3-start']},
 {item:3,title:'同站未選、錯選、正確後開門與先選人',names:['tickets-unselected','tickets-stage-1-wrong','tickets-stage-1-chosen','tickets-wrong-friend','tickets-stage-1-boarding-1-1','tickets-stage-1-boarding-1-2','tickets-stage-1-seated-1','tickets-stage-1-retracting','tickets-stage-1-close-ready','tickets-stage-1-closing','tickets-stage-1-closed','tickets-replay-layout']},
 {item:4,title:'專屬結尾與對應行為，沒有九位誤稱',names:['cake-saved-result','crossing-saved-result','tickets-saved-result']},
 {item:5,title:'三課各有多選項、可修正錯誤',names:['cake-stage-2-wrong-turn','cake-stage-2-left-driving','cake-stage-2-left-recovered','crossing-wrong-side','crossing-stage-1-child-look-left','crossing-stage-1-child-look-right','tickets-unselected','tickets-stage-1-wrong','tickets-stage-1-chosen']}
];
await writeFile(`${root}/acceptance.json`,JSON.stringify({status:'VERIFIED',source:'docs/content/CONTENT_REVIEW_R15_MUSE.md',items:groups.map(g=>({...g,status:'VERIFIED',images:g.names.map(get)})),labelMatrix:layout.shots.filter(s=>s.path.includes('-labels.png')).map(s=>({path:s.path,geometry:s.geometry.labels})),limits:['Executing-agent checks, not an independent Muse score','Physical devices, parent-child playtests and clean-machine performance not performed']},null,2));
await writeFile(`${root}/screenshots.json`,JSON.stringify({status:'VERIFIED',count:shots.length,images:shots},null,2));
for(const k of ['cake','crossing','tickets']){const r=runs[1];await writeFile(`${root}/browser-${k}.json`,JSON.stringify({...r,method:'Extract from final browser-all run',shots:r.shots.filter(s=>s.path.includes('/phone-'+k+'-')),rows:r.rows.filter(x=>x.label.includes(k))},null,2));}
const art=await json(`${root}/art/manifest.json`);for(const a of art.assets){assert.equal(sha(await readFile(a.path)),a.sha256);if(a.path.includes('passenger'))assert.equal(a.hasAlpha,true);}
const prompts=await json(`${root}/art/PROMPTS.json`),cakePrompt=await json(`${root}/art/cake-prompt.json`),prefix=(await json('docs/content/r13/art/PROMPTS.json')).style_prefix.trim();
assert.equal(prompts.tool,'image_gen.imagegen');assert.equal(cakePrompt.tool,'image_gen.imagegen');for(const p of [...prompts.records,cakePrompt])assert.ok(p.prompt.startsWith(prefix));assert.equal(sha(await readFile(cakePrompt.frozenReference.path)),cakePrompt.frozenReference.sha256);
const artMetrics=[];for(const a of art.assets.filter(a=>a.path.includes('passenger'))){const {data,info}=await sharp(a.path).ensureAlpha().raw().toBuffer({resolveWithObject:true});let n=0,l=0,sat=0,black=0,low=0;for(let i=0;i<data.length;i+=info.channels){if(data[i+3]<16)continue;const rgb=[data[i],data[i+1],data[i+2]].map(v=>v/255),v=Math.max(...rgb),s=v?(v-Math.min(...rgb))/v:0,y=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];n++;l+=y;sat+=s;black+=y<.12;low+=s<.2;}const m={path:a.path,meanLuma:l/n,meanSaturation:sat/n,nearBlackFraction:black/n,lowSaturationFraction:low/n};assert.ok(m.meanLuma>=.3&&m.meanLuma<=.75&&m.meanSaturation>=.32&&m.nearBlackFraction<.35&&m.lowSaturationFraction<.2);artMetrics.push(m);}
await writeFile(`${root}/art/color-metrics.json`,JSON.stringify({status:'VERIFIED',method:'Visible alpha>=16 pixels only; Rec709 weighted sRGB luma, HSV saturation; existing character identities retained, new front waving poses only',rows:artMetrics},null,2));
await mkdir('docs/evidence/content-r16',{recursive:true});const comparisons=[['phone','docs/content/r15/phone-cake-stage-2-left-driving.png',`${root}/phone-cake-stage-2-left-driving.png`],['landscape','docs/content/r15/device-844x390-cake.png',`${root}/device-844x390-cake.png`],['ipad','docs/content/r15/device-768x1024-cake.png',`${root}/device-768x1024-cake.png`]];for(const [name,before,after] of comparisons){await copyFile(before,`docs/evidence/content-r16/${name}-before.png`);await copyFile(after,`docs/evidence/content-r16/${name}-after.png`);}
await writeFile(`${root}/before-after.json`,JSON.stringify({status:'VERIFIED',method:'Unscaled byte copies of R15 versus R16 originals',comparisons},null,2));
if(process.env.R16_PREPARE_ONLY==='1'){console.log(JSON.stringify({status:'VERIFIED',shots:shots.length,checks:runs.reduce((n,r)=>n+r.rows.length,0),review:15,art:art.assets.length}));process.exit(0);}
const files=[];async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(e.isSymbolicLink()||['.git','.secrets','node_modules','dist','dist-native','.audit-tmp','output','release','.gradle','build','DerivedData'].includes(e.name))continue;const p=`${dir}/${e.name}`;if(e.isDirectory())await walk(p);else if(/\.(js|mjs|json|md|html|css|txt|gradle|pbxproj|xml|yml|yaml|py|ps1|swift|plist|svg|webmanifest)$/i.test(e.name))files.push(p);}}await walk('.');
const hits=[];for(const p of files)if(/sk-proj-[A-Za-z0-9_-]{20}|sk-[a-z0-9]{40}|AIza[0-9A-Za-z_-]{35}|gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{50,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----|xox[baprs]-[A-Za-z0-9-]{20,}/.test(await text(p)))hits.push(p);assert.deepEqual(hits,[]);await writeFile(`${root}/secret-scan.json`,JSON.stringify({status:'VERIFIED',files:files.length,hits,scope:'Repository text only; secrets directory and symlinks never accessed; no matched values printed'},null,2));
const merge=await json(`${root}/merge/merge-path.json`),store=await json(`${root}/store/review-path.json`),perf=await json(`${root}/performance.json`);for(const r of [merge,store]){assert.deepEqual(r.errors,[]);assert.deepEqual(r.externalRequests,[]);for(const row of r.rows)assert.deepEqual(row.problems,[]);}assert.equal(perf.withinReferenceLimit,true);
const sourceFiles=['CREDITS.md','android/app/build.gradle','ios/App/App.xcodeproj/project.pbxproj','package.json','package-lock.json','public/models/catalog.json','src/games/car/config.js','src/shared/content-r1-ui.js','src/shared/content-r16.js','src/shared/content-r16-scene.js','src/shared/content-r16.css','tests/shared/content-r16.test.js','scripts/check-content-r16.mjs','scripts/run-content-r16-validation.mjs','scripts/prepare-content-r16.mjs','scripts/measure-content-r16.mjs','scripts/verify-content-r16-release.mjs','docs/art/ART_DIRECTION.md','docs/OPTIM_PLAN_CONTENT_R16.md','docs/CODEX_RESPONSE_CONTENT_R16.md'];
await writeFile(`${root}/source-manifest.json`,JSON.stringify({status:'VERIFIED',baseline,files:await Promise.all(sourceFiles.map(async path=>({path,sha256:sha(await readFile(path))})))},null,2));
const report={status:'VERIFIED',branch:'r1-fun-polish',baseline,version:pkg.version,build:24,unitTests:237,oldTestFilesUnchanged:oldTests.length,browserChecks:runs.reduce((n,r)=>n+r.rows.length,0),originalScreenshots:shots.length,reviewSet:15,mergeChecks:merge.rows.length,storeChecks:store.rows.length,newGenerationCalls:2,newArt:4,newRuntimeAssets:4,newDependencies:0,secretHits:0,maxMedianP95:Math.max(...perf.rows.map(r=>r.p95)),performanceStatus:'EXECUTED - concurrent machine, reference only',blocked:['Physical iPhone/iPad and native touch/voice need devices','Parent-child playtest needs participants','Clean-machine performance needs exclusive hardware','Muse >=8 requires independent rescore; not performed','Native package rebuild/signing not performed']};
await writeFile(`${root}/release-proof.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
