import assert from 'node:assert/strict';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const folder='docs/evidence/r3-store';
const pkg=JSON.parse(await readFile('package.json','utf8'));
const manifest=JSON.parse(await readFile('docs/store/screenshots/manifest.json','utf8'));
assert.equal(manifest.status,'VERIFIED');assert.equal(manifest.sourceVersion,pkg.version);
assert.equal(manifest.buildWorkerSha256,createHash('sha256').update(await readFile('dist/sw.js')).digest('hex'));
for(const shot of manifest.shots){const b=await readFile(shot.path);assert.equal(createHash('sha256').update(b).digest('hex'),shot.sha256);assert.equal(b.readUInt32BE(16),shot.width);assert.equal(b.readUInt32BE(20),shot.height);}
for(const [name,width,height] of [['iphone-store',1290,2796],['ipad13-store',2064,2752]]){
 const shots=manifest.shots.filter(s=>s.path.includes(name));assert.equal(shots.length,8);for(const s of shots){assert.equal(s.width,width);assert.equal(s.height,height);assert.equal(s.native,false);}
}
const path=JSON.parse(await readFile(`${folder}/review-path.json`,'utf8'));assert.equal(path.rows.length,101);assert.deepEqual(path.errors,[]);assert.deepEqual(path.externalRequests,[]);
const completions=path.rows.filter(r=>r.label.endsWith('full review path'));assert.equal(completions.length,12);for(const row of completions){assert.equal(row.save.completed,3);assert.ok(row.durationMs<180000);}
const listing=await readFile('docs/store/LISTING.zh-TW.md','utf8');
const field=label=>listing.match(new RegExp(`^${label}：(.+)$`,'m'))[1];
const counts={name:[...field('名稱')].length,subtitle:[...field('副標題')].length,keywordsUtf8Bytes:Buffer.byteLength(field('關鍵字')),googleShort:[...field('Google 簡短說明')].length};
assert.ok(counts.name<=30);assert.ok(counts.subtitle<=30);assert.ok(counts.keywordsUtf8Bytes<=100);assert.ok(counts.googleShort<=80);
for(const file of ['package-lock.json','src/games/car/config.js','car/index.html'])assert.ok(!(await readFile(file,'utf8')).includes('2.5.0'),file);
const result={status:'VERIFIED',sourceVersion:pkg.version,screenshots:manifest.shots.length,storeDraftScreenshots:16,reviewPathChecks:path.rows.length,completedViewports:completions.length,rangeSeconds:[Math.min(...completions.map(r=>r.durationMs))/1000,Math.max(...completions.map(r=>r.durationMs))/1000],metadataCounts:counts,nativeScreenshots:false};
const evidence=[];
for(const phase of ['before','after'])for(const file of await readdir(`${folder}/${phase}`)){if(!file.endsWith('.png'))continue;const name=`${folder}/${phase}/${file}`,b=await readFile(name);evidence.push({path:name,phase,sourceVersion:phase==='before'?'2.5.0':pkg.version,width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:createHash('sha256').update(b).digest('hex')});}
await writeFile(`${folder}/evidence-manifest.json`,JSON.stringify({status:'VERIFIED',native:false,images:evidence,storeImagesManifest:'docs/store/screenshots/manifest.json'},null,2));
await writeFile(`${folder}/evidence-check.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
