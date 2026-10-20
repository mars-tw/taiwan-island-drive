import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root='docs/content/r21',baseline='99becd2ba4ea8edc50daa9ad336814bee9239632',hash=b=>createHash('sha256').update(b).digest('hex'),json=async p=>JSON.parse(await readFile(p,'utf8'));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
assert.equal(git('branch','--show-current'),'r1-fun-polish');
for(const p of ['package.json','package-lock.json'])assert.equal((await json(p)).version,'2.33.0');assert.equal((await json('public/models/catalog.json')).visualVersion,'2.33.0');assert.match(await readFile('src/games/car/config.js','utf8'),/APP_VERSION = '2\.33\.0'/);
assert.match(await readFile('android/app/build.gradle','utf8'),/versionCode 29/);assert.match(await readFile('android/app/build.gradle','utf8'),/versionName "2\.33\.0"/);assert.equal([...(await readFile('ios/App/App.xcodeproj/project.pbxproj','utf8')).matchAll(/CURRENT_PROJECT_VERSION = 29/g)].length,2);
const runs=await Promise.all(['browser.json','layout/browser.json','offline/browser.json','store/browser.json'].map(p=>json(`${root}/${p}`))),images=new Map();
for(const r of runs){assert.equal(r.status,'VERIFIED');assert.deepEqual(r.errors,[]);assert.deepEqual(r.http,[]);assert.deepEqual(r.external,[]);for(const s of r.shots){const b=await readFile(s.path);assert.equal(hash(b),s.sha256,s.path);assert.equal(b.readUInt32BE(16),s.width);assert.equal(b.readUInt32BE(20),s.height);assert.doesNotMatch(s.proof.text,/\?{3}/);if(images.has(s.path))assert.equal(images.get(s.path).sha256,s.sha256,'no overwritten evidence');images.set(s.path,s);}}
assert.ok(runs[0].rows.some(x=>x.label.startsWith('cake three stops')));assert.ok(runs[0].rows.some(x=>x.label.startsWith('crossing three stops')));assert.ok(runs[0].rows.some(x=>x.label.startsWith('tickets three stops')));
const get=n=>{const s=images.get(`${root}/phone-${n}.png`);assert.ok(s,n);assert.equal(s.width,390);assert.equal(s.height,844);return s;};
const selection=[
 ['cake-stage-2-wrong','第二站：看左彎卻按右，橘紅錯向回饋；四個按鈕仍可選'],
 ['cake-stage-2-recovery-1','第二站：按住向中央扶，第一格'],
 ['cake-stage-2-recovery-2','相同按住操作，回中央增加，第二格'],
 ['cake-stage-2-recovery-3','相同按住操作，回中央增加，第三格'],
 ['cake-stage-3-bay','第三站：臨停完成可重新起步；無車外虛線'],
 ['crossing-stage-2-right-first','第二站右邊先有車；只留已到對岸人數，固定角色編號'],
 ['crossing-stage-3-recheck','第三站兩邊看過後還要確認近側，四鈕均可選'],
 ['crossing-stage-3-grandma-1','第三站同一位3號奶奶在斑馬線中間'],
 ['crossing-stage-3-grandma-2','同一位3號奶奶走向對岸'],
 ['crossing-stage-3-grandma-3','同一位3號奶奶沿對岸走到空位，未落位不增加人數'],
 ['tickets-stage-2-decision','第二站橘三角形車票：顏色及形狀都需配對'],
 ['tickets-stage-3-decision','第三站綠正方形車票：正確月台換位置'],
 ['tickets-stage-3-boarding-2','第三站按住陪上車；車門中有角色，其他候車本體仍在'],
 ['tickets-stage-3-step-out','第三站三人入座：完整黃黑踏階與標籤仍伸出'],
 ['tickets-stage-3-step-in','同站同車門：階面與標籤完全收回，門仍開著']
];
await mkdir(`${root}/review-set`,{recursive:true});const review=[];
for(const [i,[name,purpose]] of selection.entries()){const s=get(name),path=`${root}/review-set/${String(i+1).padStart(2,'0')}-${name}.png`;await copyFile(s.path,path);assert.equal(hash(await readFile(path)),s.sha256);review.push({index:i+1,path,source:s.path,purpose,sha256:s.sha256,width:s.width,height:s.height});}
await writeFile(`${root}/review-set-manifest.json`,JSON.stringify({status:'VERIFIED',count:review.length,perCourse:5,method:'Byte-identical unscaled phone originals; no overlays or collage',images:review},null,2));
await writeFile(`${root}/review-guide.md`,'# R21 手機精選圖\n\n只看 review-set 的15張；每課5張、每課含第二與第三站。全部390×844原尺寸，未拼貼或加驗收字。\n\n'+review.map(r=>`${String(r.index).padStart(2,'0')}．${r.purpose}：\`${r.path}\``).join('\n\n')+'\n\n三秒盲看、親子、實體裝置與Muse評分均為BLOCKED，未以自動化代替真人。完成、保存與斷網全程另存本輪證據，不冒稱已進入15張精選。\n');
const recoveries=[1,2,3].map(i=>get(`cake-stage-2-recovery-${i}`));const lean=recoveries.map(s=>Math.abs(+s.state.balanceLean));assert.ok(lean[0]>lean[1]&&lean[1]>lean[2]);assert.ok(recoveries.every(s=>s.proof.controls.some(b=>b.id.startsWith('recover-'))));
const step=get('tickets-stage-3-step-out'),retracted=get('tickets-stage-3-step-in'),box=step.proof.step;assert.ok(box.height>=46);assert.equal(retracted.proof.step,null);
const rect={left:Math.floor(box.x)-3,top:Math.floor(box.y)-3,width:Math.ceil(box.width)+6,height:Math.ceil(box.height)+25};
const one=await sharp(step.path).extract(rect).ensureAlpha().raw().toBuffer(),two=await sharp(retracted.path).extract(rect).ensureAlpha().raw().toBuffer();let changed=0;for(let i=0;i<one.length;i+=4)if(Math.max(Math.abs(one[i]-two[i]),Math.abs(one[i+1]-two[i+1]),Math.abs(one[i+2]-two[i+2]))>25)changed++;assert.ok(changed>=2500,'visible step-area difference '+changed);
await writeFile(`${root}/acceptance.json`,JSON.stringify({status:'VERIFIED',recovery:{lean,readout:recoveries.map(s=>s.proof.text.match(/回中央 \d+%/)[0]),playerAction:'held recovery key',idleAndWrongHold:'frozen without penalty'},step:{height:box.height,width:box.width,rect,changedPixels:changed,blindHumanTest:'BLOCKED - participant required'},singleProgress:true,answerHighlight:false,fixedFriendNumbers:{child:1,bike:2,grandma:3},decisionFrames:review.filter(x=>/decision|right-first|recheck|wrong|bay/.test(x.source)).map(x=>x.path)},null,2));
const comparisons=[];for(const [kind,old,current] of [['cake','03-cake-tray-edge-recovering','cake-stage-2-recovery-2'],['crossing','06-crossing-stage-1-child-look-left','crossing-stage-2-right-first'],['tickets','13-tickets-stage-1-seated-3','tickets-stage-3-step-out']]){const before=`${root}/before-${kind}.png`,after=`${root}/after-${kind}.png`,b=execFileSync('git',['show',`${baseline}:docs/content/r20/review-set/${old}.png`],{maxBuffer:10*1024*1024});await writeFile(before,b);await copyFile(get(current).path,after);comparisons.push({before,baseline,baselineSource:`docs/content/r20/review-set/${old}.png`,beforeSha256:hash(b),after,afterSha256:get(current).sha256});}
await writeFile(`${root}/before-after.json`,JSON.stringify({status:'VERIFIED',method:'Original Git baseline captures; different stops used to compare the named UI correction, not a pixel-aligned scene comparison',comparisons},null,2));
const cleanup=await json(`${root}/cleanup-result.json`);assert.equal(cleanup.status,'EXECUTED');for(const f of cleanup.files)assert.equal(await stat(f.path).then(()=>true,()=>false),false);for(const f of cleanup.retained)assert.equal(hash(await readFile(f.path)),f.sha256,f.path);
const art=await json(`${root}/art/PROMPTS.json`);assert.equal(art.tool,'image_gen.imagegen');assert.equal(art.model_slug,null);assert.ok(art.transparentPixels>0);for(const f of art.files)assert.equal(hash(await readFile(f.path)),f.sha256);assert.equal(hash(await readFile('public/art/content-r21/boarding-step.webp')),hash(await readFile('dist/art/content-r21/boarding-step.webp')));
const sources=['src/shared/content-r21.js','src/shared/content-r21-scene.js','src/shared/content-r21.css','src/shared/content-r1-ui.js','src/games/car/config.js','public/models/catalog.json','package.json','package-lock.json','android/app/build.gradle','ios/App/App.xcodeproj/project.pbxproj'];await writeFile(`${root}/source-manifest.json`,JSON.stringify({status:'VERIFIED',files:await Promise.all(sources.map(async path=>({path,sha256:hash(await readFile(path))})))},null,2));
const originalTests=git('ls-tree','-r','--name-only',baseline,'tests').split('\n'),integrity=[];
for(const path of originalTests){const expected=git('rev-parse',`${baseline}:${path}`),actual=execFileSync('git',['hash-object','--path',path,'--stdin'],{input:await readFile(path),encoding:'utf8'}).trim();assert.equal(actual,expected,path);integrity.push({path,baselineBlob:expected,currentBlob:actual});}await writeFile(`${root}/test-source-integrity.json`,JSON.stringify({status:'VERIFIED',existingUnchanged:integrity.length,files:integrity},null,2));
if(process.env.R21_EVIDENCE_ONLY==='1'){console.log(JSON.stringify({status:'VERIFIED',evidenceOnly:true,images:images.size,review:review.length,changedPixels:changed}));process.exit(0);}
const negative=await json(`${root}/negative/checks.json`),perf=await json(`${root}/performance.json`);assert.equal(negative.status,'VERIFIED');assert.equal(perf.status,'VERIFIED');assert.ok(perf.rows.every(r=>r.p95<=18));
const defaultRenderer=await json(`${root}/performance-default-renderer.json`);
const text=async p=>{const b=await readFile(p);return b[0]===255&&b[1]===254?b.subarray(2).toString('utf16le'):b.toString('utf8');};
assert.match(await text(`${root}/unit-test.txt`),/pass 262/);assert.match(await text(`${root}/unit-test.txt`),/fail 0/);assert.match(await text(`${root}/build-test.txt`),/built in/);
const merge=await json(`${root}/merge/merge-path.json`),store=await json(`${root}/store-regression/review-path.json`);
for(const r of [merge,store]){assert.deepEqual(r.errors,[]);assert.deepEqual(r.externalRequests,[]);for(const row of r.rows)assert.deepEqual(row.problems,[]);}assert.equal(merge.rows.length,132);assert.equal(store.rows.length,101);
const scan=await json(`${root}/secret-scan.json`);assert.equal(scan.hits,0);
await writeFile(`${root}/screenshots.json`,JSON.stringify({status:'VERIFIED',count:images.size,images:[...images.values()]},null,2));
const proof={status:'VERIFIED',baseline,branch:'r1-fun-polish',version:'2.33.0',sourceBuild:29,unitTests:262,existingTestFilesUnchanged:integrity.length,courseBrowserChecks:runs.reduce((n,r)=>n+r.rows.length,0),negativeChecks:negative.rows.length,mergeChecks:merge.rows?.length,storeChecks:store.rows?.length,screenshots:images.size,reviewSet:15,newArt:1,secretHits:0,cleanup:{files:cleanup.deletedFiles,bytes:cleanup.releasedBytes,retained:cleanup.retained.length},stepChangedPixels:changed,performance:perf,defaultRendererReference:{status:defaultRenderer.status,maxP95:Math.max(...defaultRenderer.rows.map(x=>x.p95)),artifact:`${root}/performance-default-renderer.json`,limitation:'Default headless desktop renderer exceeded 18ms. Passing reference is explicitly limited to the established R20 D3D11 measurement configuration.'},blocked:['Physical iPhone/iPad touch and native voice require devices','Parent-child and three-second blind step tests require participants','Clean-hardware performance requires exclusive hardware','Muse >=8 requires independent review','Native signed packages not rebuilt']};
await writeFile(`${root}/release-proof.json`,JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
