import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r28.js';
import {cakeAngle,stageBrief,lessonResult} from '../../src/shared/content-r28-scene.js';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const run=(g,n)=>{for(let i=0;i<n;i++)g.update(.016);};
test('R28 first, second and third errors expose increasing help without timeout answers',()=>{
 const g=new ContentLesson('tickets');g.begin();run(g,1000);assert.equal(g.showHint,false);
 const wrong=g.platforms.findIndex(t=>t.color!==g.target.color);
 for(let i=1;i<=3;i++){g.select(wrong);assert.equal(g.hintLevel,i);assert.equal(g.showHint,i===3);}
 g.stage=1;g.reset();assert.equal(g.hintLevel,0);
});
test('R28 speed precedes delayed cake force and brake plus correction beats correction alone',()=>{
 const g=new ContentLesson('cake');g.begin();g.input.go=true;g.update(.016);assert.ok(g.speed>0);assert.ok(Math.abs(g.forceLag)<Math.abs(g.forceTarget));
 const make=()=>{const c=new ContentLesson('cake');c.stage=1;c.begin();c.distance=20;c.speed=5;c.balanceLean=22;c.forceLag=20;c.input['recover-left']=true;c.input.left=true;return c;};
 const a=make(),b=make();b.input.brake=true;run(a,50);run(b,50);assert.ok(b.speed<a.speed);assert.ok(Math.abs(b.balanceLean)<Math.abs(a.balanceLean)-4);assert.ok(b.recoveryRate>a.recoveryRate);
 assert.ok(Math.abs(cakeAngle({balanceLean:32}))<=28);
});
test('R28 looking away keeps traffic unconfirmed; replay changes observed side',()=>{
 for(let stage=0;stage<3;stage++)for(let seed=0;seed<2;seed++){
  const g=new ContentLesson('crossing',{stage,layoutSeed:seed},{observeTraffic:true});g.begin();g.speed=0;
  const source=g.trafficSource;g.look(source==='left'?'right':'left');assert.equal(g.trafficConfirmed,false);g.look(source);assert.equal(g.trafficConfirmed,true);assert.equal(g.canDepart,false);
  const other=new ContentLesson('crossing',{stage,layoutSeed:1-seed});assert.notEqual(other.trafficSource,source);
 }
});
test('R28 choosing station three never grants an unplayed full-course completion',()=>{
 const g=new ContentLesson('cake');assert.equal(g.chooseStage(2),true);g.begin();assert.equal(g.chooseStage(0),false);g.checkpoint();assert.equal(g.completed,false);assert.deepEqual(g.visited,[2]);g.next();assert.equal(g.stage,0);g.checkpoint();g.next();assert.equal(g.stage,1);g.checkpoint();assert.equal(g.completed,true);
 const restored=new ContentLesson('cake',g.snapshot());assert.equal(restored.completed,true);assert.deepEqual(restored.visited,[2,0,1]);
});
test('R28 boarding threshold requires release, pause preserves position and resume completes',()=>{
 const g=new ContentLesson('tickets');g.phase='boarding';g.doorStage='boarding';g.boardTime=.30;g.boardingIndex=0;g.boardingRate=.1;g.input.escort=true;run(g,300);assert.equal(g.escortGate,true);const t=g.boardTime;run(g,100);assert.equal(g.boardTime,t);g.release();run(g,1);assert.equal(g.escortGateReleased,true);run(g,100);assert.equal(g.boardTime,t);g.input.escort=true;run(g,300);assert.equal(g.boardingIndex,1);
});
test('R28 all nine briefs differ by condition and replay changes three concrete targets',()=>{
 for(const kind of ['cake','crossing','tickets']){const a=new ContentLesson(kind),b=new ContentLesson(kind,{layoutSeed:1});assert.equal(new Set([0,1,2].map(i=>stageBrief(a,i))).size,3);assert.ok(kind==='tickets'?a.target.color!==b.target.color:stageBrief(a)!==stageBrief(b));}
 assert.match(lessonResult(new ContentLesson('crossing',{layoutSeed:1})).learned,/^右來車・左來車/);
});
test('R28 recaps count actual early reselections and completed manual corrections exactly once',()=>{
 const t=new ContentLesson('tickets');t.begin();const wrong=t.platforms.findIndex(p=>p.color!==t.target.color),right=t.platforms.findIndex(p=>p.color===t.target.color&&p.shape===t.target.shape);t.select(wrong);t.select(wrong);assert.equal(t.facts.reselections,0);t.select(right);assert.equal(t.facts.reselections,1);
 const c=new ContentLesson('cake');c.begin();c.balanceLean=12;c.input['recover-left']=true;run(c,200);assert.equal(c.facts.recoveries,1);run(c,200);assert.equal(c.facts.recoveries,1);
});
test('R28 cached audio HEAD works offline with original headers and no response body',async()=>{
 const handlers={},body=new Response('cached audio',{status:200,headers:{'Content-Type':'audio/mp4'}}),request=new Request('https://academy.test/audio/lobby-theme.m4a',{method:'HEAD'});let network=0;
 const sandbox={URL,Request,Response,Map,Set,Error,encodeURIComponent,fetch:async()=>{network++;throw Error('offline');},caches:{open:async()=>({match:async r=>r.method==='GET'?body:undefined})},self:{registration:{scope:'https://academy.test/'},addEventListener:(n,f)=>handlers[n]=f}};
 vm.runInNewContext(await readFile(new URL('../../public/sw.js',import.meta.url),'utf8'),sandbox);let result;handlers.fetch({request,respondWith:p=>result=p});const response=await result;assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'audio/mp4');assert.equal(await response.text(),'');assert.equal(network,0);
});
