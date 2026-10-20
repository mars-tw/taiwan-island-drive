import {spawn} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const result=await new Promise(resolve=>{let log='';const child=spawn(process.execPath,['scripts/measure-frame-times.mjs'],{windowsHide:true,env:{...process.env,BASE_URL:'http://127.0.0.1:5286/',PLAYWRIGHT_MODULE:process.env.PLAYWRIGHT_MODULE||'C:/Users/digimkt/Desktop/遊戲/storm-apocalypse/node_modules/playwright/index.mjs',RUNS:'3',SAMPLE_MS:'2000'}});child.stdout.on('data',b=>{log+=b;process.stdout.write(b);});child.stderr.on('data',b=>{log+=b;process.stderr.write(b);});child.on('close',code=>resolve({code,log}));});
await writeFile('docs/evidence/deep-r1/frame-times.txt',result.log);assert.equal(result.code,0);
const row=result.log.split(/\r?\n/).findLast(s=>s.startsWith('{"renderer":'));assert.ok(row);
const report={...JSON.parse(row),status:'EXECUTED',method:'Three real-time rAF samples per viewport/mode, 2000ms each. Median of per-run p95. Concurrent host load; reference only, not native CPU/GPU frame time.'};
await writeFile('docs/evidence/deep-r1/performance.json',JSON.stringify(report,null,2));assert.equal(report.rows.length,12);assert.ok(report.rows.every(r=>r.runs.length===3&&r.p95<=18));console.log('VERIFIED reference p95 <=18ms, all twelve combinations');
