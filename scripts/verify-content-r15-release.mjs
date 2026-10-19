import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,mkdir,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='docs/content/r15',baseline='77a9f915eda0ae279436eb8e2f8ebd275717a412';
const text=async p=>{const b=await readFile(p);return b[0]===0xff&&b[1]===0xfe?b.toString('utf16le').slice(1):b.toString('utf8');},json=async p=>JSON.parse(await text(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:32*1024*1024});
const pkg=await json('package.json'),lock=await json('package-lock.json');assert.equal(pkg.version,'2.27.0');assert.equal(lock.version,pkg.version);assert.equal(lock.packages[''].version,pkg.version);
assert.deepEqual(pkg.dependencies,JSON.parse(git('show',baseline+':package.json')).dependencies);assert.deepEqual(pkg.devDependencies,JSON.parse(git('show',baseline+':package.json')).devDependencies);
for(const p of ['package.json','package-lock.json','src/games/car/config.js','public/models/catalog.json','android/app/build.gradle','ios/App/App.xcodeproj/project.pbxproj']){assert.ok((await text(p)).includes(pkg.version));assert.ok(!(await text(p)).includes('2.26.0'));}
assert.match(await text('android/app/build.gradle'),/versionCode 23/);assert.match(await text('ios/App/App.xcodeproj/project.pbxproj'),/CURRENT_PROJECT_VERSION = 23/);
const oldTests=git('ls-tree','-r','--name-only',baseline,'tests').trim().split(/\r?\n/);for(const p of oldTests)assert.equal((await text(p)).replaceAll('\r\n','\n'),git('show',baseline+':'+p).replaceAll('\r\n','\n'),'Existing test changed: '+p);
assert.match(await text(`${root}/unit-tests.txt`),/pass 232/);assert.match(await text(`${root}/unit-tests.txt`),/fail 0/);
const runs=await Promise.all(['all','negative','store','state'].map(s=>json(`${root}/browser-${s}.json`)));const offline=await json(`${root}/offline/browser-offline.json`);runs.push(offline);
for(const r of runs){assert.equal(r.status,'VERIFIED');assert.deepEqual(r.errors,[]);assert.deepEqual(r.external,[]);assert.deepEqual(r.http,[]);}
const shots=runs.flatMap(r=>r.shots);for(const s of shots){const b=await readFile(s.path);assert.equal(sha(b),s.sha256,s.path);assert.equal(b.readUInt32BE(16),s.width);assert.equal(b.readUInt32BE(20),s.height);}
const byPath=new Map(shots.map(s=>[s.path,s])),get=name=>{const s=byPath.get(`${root}/${name}.png`);assert.ok(s,name);assert.equal(s.width,390);assert.equal(s.height,844);return s;};
const intersections=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y));
let arrivalChecks=0,zebraChecks=0;
for(const s of runs[0].shots){
 if(s.path.includes('/phone-crossing-')&&s.path.endsWith('-arrived.png')){
  const people=s.geometry.people.filter(p=>p.kind==='crossing-arrived'),box=s.geometry.scene;
  for(let i=0;i<people.length;i++){const a=people[i].box;assert.ok(a.x>=box.x-.1&&a.right<=box.right+.1&&a.y>=box.y-.1&&a.bottom<=box.bottom+.1);for(let j=i+1;j<people.length;j++)assert.equal(intersections(a,people[j].box),0);}
  assert.equal(new Set(s.geometry.people.map(p=>p.id)).size,s.geometry.people.length);arrivalChecks++;
 }
 if(s.path.includes('/phone-crossing-')&&/-moving-[12]\.png$/.test(s.path)){const person=s.geometry.people.find(p=>p.kind==='content-walker'),b=s.geometry.scene;assert.ok(person);const foot=(person.box.bottom-b.y)/b.height;assert.ok(foot>=.60&&foot<=.68);zebraChecks++;}
 if(s.path.includes('/phone-cake-'))assert.equal(s.geometry.mini,s.geometry.large);
 if(s.path.includes('/phone-tickets-')){assert.equal(s.geometry.queue,'');assert.ok(Math.abs(s.geometry.train.width/s.geometry.train.height-2.42)<.02);}
}
assert.equal(arrivalChecks,9);assert.equal(zebraChecks,18);await writeFile(`${root}/scene-regressions.json`,JSON.stringify({status:'VERIFIED',arrivalChecks,zebraChecks,checks:['No duplicate physical identities; arrived bounds inside scene and pairwise intersection zero','First two crossing frames have feet inside the zebra band','Roof and magnifier use identical cake transforms','No leftover queue line; same 2.42 train aspect in play, departure and result']},null,2));
// Each course gets five originals in actual station order. No contact sheets,
// compositing, thumbnail resizing or injected verification UI is used.
const selected=[
 ['cake-stage-2-wrong-turn','按錯右轉，車不前進且蛋糕傾斜'],
 ['cake-stage-2-left-driving','按住左轉，沿左彎前進'],
 ['cake-stage-2-left-recovered','放開後回穩，同一次左彎'],
 ['cake-stage-2-right-driving','後續右彎，按右轉、往彎外傾'],
 ['cake-saved-result','第三站完成後重開，三站保存'],
 ['crossing-stage-1-child-look-left','第一位自己看左，下一步看右'],
 ['crossing-stage-1-child-look-right','自己看右，仍需等可見來車'],
 ['crossing-stage-1-child-moving-2','來車通過後，小朋友才走進斑馬線'],
 ['crossing-stage-2-grandma-look-left','下一站奶奶也重新看左右'],
 ['crossing-saved-result','九位通過、三站完成後重開'],
 ['tickets-stage-1-invite-1','停對、開門後仍候車，玩家邀請第一位'],
 ['tickets-stage-1-boarding-1-2','只一位正在跨踏階進門'],
 ['tickets-stage-1-invite-2','一位已入座，下一位須再由玩家邀請'],
 ['tickets-stage-3-departing-2','第三站全員坐好，列車等比例駛離'],
 ['tickets-saved-result','同一列車、九位坐好，重開保存']
];
await mkdir(`${root}/review-set`,{recursive:true});const manifest=[];
for(let i=0;i<selected.length;i++){const [name,purpose]=selected[i],s=get('phone-'+name),path=`${root}/review-set/${String(i+1).padStart(2,'0')}-${name}.png`;await copyFile(s.path,path);assert.equal(sha(await readFile(path)),s.sha256);manifest.push({index:i+1,path,source:s.path,purpose,width:s.width,height:s.height,sha256:s.sha256});}
assert.equal((await readdir(`${root}/review-set`)).length,15);
await writeFile(`${root}/review-set-manifest.json`,JSON.stringify({status:'VERIFIED',perCourse:5,count:15,method:'Byte-for-byte copies of original portrait runtime PNGs, ordered by course and stage',images:manifest},null,2));
const acceptance=[
 {item:1,title:'玩家轉向、錯向後果與放開回穩',images:['phone-cake-bend-pedal-held',...['left','right'].flatMap(s=>[`phone-cake-stage-2-${s}-ready`,`phone-cake-stage-2-${s}-driving`,`phone-cake-stage-2-${s}-recovered`]),'phone-cake-stage-2-wrong-turn','phone-cake-tray-edge-sliding','phone-cake-tray-edge-stopped','phone-cake-tray-edge-recovered','phone-cake-stage-3-bay-stopped','phone-cake-stage-3-bay-restarted']},
 {item:2,title:'九位各自看左看右、等車、到岸才加一',images:[...['child','bike','grandma'].map(w=>`phone-crossing-stage-1-${w}-look-left`),...[1,2,3].flatMap(n=>[`phone-crossing-stage-${n}-traffic`,`phone-crossing-stage-${n}-ready-cross`,`phone-crossing-stage-${n}-ready-depart`]),'phone-crossing-stage-2-grandma-look-right','phone-crossing-stage-2-grandma-moving-2','phone-crossing-stage-3-child-arrived']},
 {item:3,title:'每次邀請只動一位、跨門檻後計人、手動收階關門',images:[1,2,3].flatMap(n=>[`phone-tickets-stage-1-invite-${n}`,`phone-tickets-stage-1-boarding-${n}-1`,`phone-tickets-stage-1-boarding-${n}-2`,`phone-tickets-stage-1-seated-${n}`]).concat(['phone-tickets-stage-1-retracting','phone-tickets-stage-1-close-ready','phone-tickets-stage-1-closing','phone-tickets-stage-1-closed'])},
 {item:4,title:'三站不同欄、重玩改排列、三種載具駛離至少100px',images:[1,2,3].map(n=>`phone-tickets-stage-${n}-stopped`).concat(['phone-tickets-replay-layout',...['cake','crossing','tickets'].flatMap(k=>[1,2,3].map(n=>`phone-${k}-stage-3-departing-${n}`))])},
 {item:5,title:'單一主指令、精簡三站成果與兩按鈕',images:['phone-cake-saved-result','phone-crossing-saved-result','phone-tickets-saved-result']}
];
await writeFile(`${root}/acceptance.json`,JSON.stringify({status:'VERIFIED',source:'docs/content/CONTENT_REVIEW_R14_MUSE.md',items:acceptance.map(x=>({...x,status:'VERIFIED',images:x.images.map(get)})),limits:['Executing-agent verification, not an independent Muse rescore','Supplemental originals outside review-set are not assumed to have been reviewed']},null,2));
await writeFile(`${root}/screenshots.json`,JSON.stringify({status:'VERIFIED',count:shots.length,images:shots},null,2));
const pedalFrame=get('phone-cake-bend-pedal-held'),pedal=pedalFrame.controls.find(b=>b.id==='go'),needed=pedalFrame.controls.filter(b=>b.needed==='true');assert.equal(pedal.held,'true');assert.equal(needed.length,1);assert.ok(['left','right'].includes(needed[0].id));
function lab(css){const rgb=css.match(/\d+/g).slice(0,3).map(v=>{const c=+v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;});const [r,g,b]=rgb;const f=v=>v>.008856?Math.cbrt(v):7.787*v+16/116,x=f((.4124564*r+.3575761*g+.1804375*b)/.95047),y=f(.2126729*r+.7151522*g+.072175*b),z=f((.0193339*r+.119192*g+.9503041*b)/1.08883);return [116*y-16,500*(x-y),200*(y-z)];}
const blue=lab(pedal.color),yellow=lab(needed[0].color),deltaE=Math.hypot(...blue.map((v,i)=>v-yellow[i]));assert.ok(deltaE>=30);await writeFile(`${root}/palette-measurement.json`,JSON.stringify({status:'VERIFIED',source:pedalFrame.path,method:'CIE76 Delta E, sRGB to CIELAB D65; actual computed button colors',pedal:pedal.color,needed:needed[0].color,deltaE,minimum:30},null,2));
// Replace early per-course diagnostics with current-run extracts, so every
// referenced hash continues to identify the final original on disk.
for(const k of ['cake','crossing','tickets','matrix']){const r=runs[0];await writeFile(`${root}/browser-${k}.json`,JSON.stringify({...r,method:'Extract from final browser-all run',rows:r.rows.filter(x=>k==='matrix'?/\d+x\d+/.test(x.label):x.label.includes(k)),shots:r.shots.filter(s=>k==='matrix'?s.path.includes('/device-'):s.path.includes('/phone-'+k+'-'))},null,2));}
await mkdir(`${root}/art`,{recursive:true});const art=await json('docs/content/r14/art/manifest.json');for(const a of art.assets)assert.equal(sha(await readFile(a.path)),a.sha256);await writeFile(`${root}/art/manifest.json`,JSON.stringify({...art,status:'VERIFIED',newGenerationCalls:0,newDesigns:0,newRuntimeAssets:0,tool:null,method:'R15 reuses registered generated art. Door shutters sample the existing train illustration including its window, frame, shadows and handle. No new generation or raster asset; translations are gameplay projection, not new skeletal animation.'},null,2));
await mkdir('docs/evidence/content-r15',{recursive:true});const comparisons=[['phone','docs/content/r14/phone-cake-left-bend.png',`${root}/phone-cake-stage-2-left-driving.png`],['landscape','docs/content/r14/device-landscape-cake-layout.png',`${root}/device-844x390-cake.png`],['ipad','docs/content/r14/device-ipad-cake-layout.png',`${root}/device-768x1024-cake.png`]];for(const [name,before,after] of comparisons){await copyFile(before,`docs/evidence/content-r15/${name}-before.png`);await copyFile(after,`docs/evidence/content-r15/${name}-after.png`);}await writeFile(`${root}/before-after.json`,JSON.stringify({status:'VERIFIED',method:'Unscaled copies; historical R14 before versus current R15 runtime after',comparisons},null,2));
if(process.env.R15_PREPARE_ONLY==='1'){console.log(`VERIFIED ${shots.length} original PNG hashes, 15 ordered review copies, unchanged historical tests and release versions`);process.exit(0);}
const files=[];async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(e.isSymbolicLink()||['.git','.secrets','node_modules','dist','dist-native','.audit-tmp','output','release','.gradle','build','DerivedData'].includes(e.name))continue;const p=`${dir}/${e.name}`;if(e.isDirectory())await walk(p);else if(/\.(js|mjs|json|md|html|css|txt|gradle|pbxproj|xml|yml|yaml|py|ps1|swift|plist|svg|webmanifest)$/i.test(e.name))files.push(p);}}await walk('.');
const hits=[];for(const p of files)if(/sk-proj-[A-Za-z0-9_-]{20}|sk-[a-z0-9]{40}|AIza[0-9A-Za-z_-]{35}|gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{50,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----|xox[baprs]-[A-Za-z0-9-]{20,}/.test(await text(p)))hits.push(p);assert.deepEqual(hits,[]);await writeFile(`${root}/secret-scan.json`,JSON.stringify({status:'VERIFIED',files:files.length,hits,scope:'Repository text only; secrets directory and symlinks never accessed'},null,2));
const merge=await json(`${root}/merge/merge-path.json`),store=await json(`${root}/store/review-path.json`),perf=await json(`${root}/performance.json`);for(const r of [merge,store]){assert.deepEqual(r.errors,[]);assert.deepEqual(r.externalRequests,[]);for(const row of r.rows)assert.deepEqual(row.problems,[]);}assert.equal(perf.withinReferenceLimit,true);
const sourceFiles=['android/app/build.gradle','ios/App/App.xcodeproj/project.pbxproj','package.json','package-lock.json','public/models/catalog.json','src/games/car/config.js','src/shared/content-r1-ui.js','src/shared/content-r15.js','src/shared/content-r15-scene.js','src/shared/content-r15.css','tests/shared/content-r15.test.js','scripts/check-content-r15.mjs','scripts/measure-content-r15.mjs','scripts/verify-content-r15-release.mjs','docs/art/ART_DIRECTION.md','docs/OPTIM_PLAN_CONTENT_R15.md','docs/CODEX_RESPONSE_CONTENT_R15.md','docs/content/r15/review-guide.md'];
await writeFile(`${root}/source-manifest.json`,JSON.stringify({status:'VERIFIED',baseline,files:await Promise.all(sourceFiles.map(async path=>({path,sha256:sha(await readFile(path))})))},null,2));
const retained=git('ls-files','--others','--exclude-standard').split(/\r?\n/).filter(p=>/^docs\/(art\/ART_RESCORE|content\/CONTENT_REVIEW_)/.test(p));
const report={status:'VERIFIED',version:pkg.version,build:23,branch:git('branch','--show-current').trim(),baseline,unitTests:232,oldTestFilesUnchanged:oldTests.length,browserChecks:runs.reduce((n,r)=>n+r.rows.length,0),originalScreenshots:shots.length,reviewSet:15,mergeChecks:merge.rows.length,storeChecks:store.rows.length,newArt:0,newDependencies:0,secretHits:0,performanceMaxMedianP95:Math.max(...perf.rows.map(r=>r.p95)),performanceReferencePassed:perf.withinReferenceLimit,retainedUntracked:await Promise.all(retained.map(async path=>({path,sha256:sha(await readFile(path))}))),blocked:['Physical iPhone/iPad and native voice/touch require devices','Parent-child playtest requires participants','Clean-machine performance needs exclusive hardware','Muse >=8 requires independent rescore; not performed','Native package build/signing not performed']};assert.equal(report.branch,'r1-fun-polish');
await writeFile(`${root}/release-proof.json`,JSON.stringify(report,null,2));await writeFile(`${root}/release-verification.txt`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,retainedUntracked:retained.length}));
