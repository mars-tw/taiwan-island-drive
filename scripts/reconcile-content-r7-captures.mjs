import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const path='docs/content/r7/browser-play.json',j=JSON.parse(await readFile(path,'utf8')),last=new Map(),superseded=[];
for(const s of j.shots){if(last.has(s.path))superseded.push(last.get(s.path));last.set(s.path,s);}
for(const s of last.values())assert.equal(createHash('sha256').update(await readFile(s.path)).digest('hex'),s.sha256,s.path);
j.shots=[...last.values()];j.capturePolicy='Repeated filename observations retain the final original capture. Only superseded index rows are removed; no screenshots are modified.';
await writeFile(path,JSON.stringify(j,null,2));await writeFile('docs/content/r7/capture-reconciliation.json',JSON.stringify({status:'VERIFIED',manifest:path,policy:j.capturePolicy,superseded:superseded.map(s=>({path:s.path,sha256:s.sha256})),retained:j.shots.length,pixelEdits:false},null,2));console.log(`VERIFIED ${superseded.length} superseded index rows; ${j.shots.length} unique original captures, hashes verified`);
