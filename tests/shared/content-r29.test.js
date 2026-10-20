import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r29.js';
import {queueFrame} from '../../src/shared/content-r10-scene.js';
import {cakeAngle,carGround,departReasons,crossingLocation,stageBrief,STOP_RULES,queuePosition,holdFeedback,drivingCue} from '../../src/shared/content-r29-scene.js';
const run=(g,n)=>{for(let i=0;i<n;i++)g.update(.016);};
test('R29 same bend and initial tilt: braking plus support restores cake faster than support alone',()=>{
 const make=()=>{const g=new ContentLesson('cake',{stage:1});g.begin();Object.assign(g,{distance:22,speed:5.8,balanceLean:24,forceLag:24});g.input.left=true;g.input['recover-left']=true;return g;};
 const a=make(),b=make();b.input.brake=true;run(a,40);run(b,40);assert.ok(b.speed<a.speed);assert.ok(Math.abs(b.balanceLean)<Math.abs(a.balanceLean)-6);assert.ok(Math.abs(cakeAngle(b))<Math.abs(cakeAngle(a)));
});
test('R29 steering onset precedes cake response; support does not steer the vehicle',()=>{
 const g=new ContentLesson('cake',{stage:1});g.begin();g.distance=20;g.speed=4;g.input.left=true;g.update(.016);assert.ok(g.steer<0);assert.ok(Math.abs(cakeAngle(g))<1);
 const h=new ContentLesson('cake',{stage:1});h.begin();h.distance=22;h.balanceLean=24;h.input['recover-left']=true;run(h,25);assert.equal(h.steer,0);assert.ok(h.balanceLean<24);assert.doesNotMatch(drivingCue(h).text,/減速/);
});
test('R29 bay restart has separated parked, leaving and main-road world positions',()=>{
 const g=new ContentLesson('cake',{stage:2});g.bayStopped=true;g.distance=47;const parked=carGround(g);g.bayRestarted=true;g.distance=51;const leaving=carGround(g);g.distance=55;const main=carGround(g);assert.ok(parked.x>leaving.x&&leaving.x>main.x);assert.ok(parked.y>leaving.y&&leaving.y>main.y);
});
test('R29 crossing reasons cannot claim clear until actual traffic and all three people have cleared',()=>{
 const g=new ContentLesson('crossing',{}, {observeTraffic:true});g.begin();g.speed=0;assert.match(departReasons(g).join(),/還有一台車/);g.crossTime=.5;assert.match(departReasons(g).join(),/到對岸/);assert.equal(g.canDepart,false);g.trafficTime=10;g.trafficConfirmed=true;g.crossTime=0;g.crossed=3;g.looked={left:true,right:true};assert.equal(g.canDepart,true);assert.deepEqual(departReasons(g),['路面淨空，可以出發']);
});
test('R29 waiting and arrived slots let every next walker enter the zebra without crossing another person',()=>{
 for(let stage=0;stage<3;stage++){const g=new ContentLesson('crossing',{stage});const order=g.crossingOrder;for(let i=0;i<3;i++)for(let p=0;p<=1;p+=.01){const current=crossingLocation(order[i],'crossing',p,stage,order);for(let j=0;j<3;j++)if(j!==i){const other=crossingLocation(order[j],j<i?'arrived':'waiting',0,stage,order);assert.ok(Math.abs(current.x-other.x)>20||Math.abs(current.bottom-other.bottom)>18,`stage ${stage}, ${i}/${j} at ${p}`);}}}
});
test('R29 all literal ticket rules request both matching dimensions, never a decoy',()=>{
 for(let stage=0;stage<3;stage++)for(let seed=0;seed<3;seed++){const g=new ContentLesson('tickets',{stage,layoutSeed:seed});g.begin();assert.equal(STOP_RULES.tickets[stage],'形狀、顏色都一樣');assert.doesNotMatch(stageBrief(g),/不同|同形・找|同色・找/);const i=g.platforms.findIndex(t=>t.shape===g.target.shape&&t.color===g.target.color);g.select(i);assert.equal(g.matched,true);}
});
test('R29 boarding cannot bypass release and actual standstill, only seated passengers count',()=>{
 const g=new ContentLesson('tickets');g.phase='boarding';g.doorStage='boarding';g.boardTime=.3;g.boardingIndex=0;g.boardingRate=.1;g.input.escort=true;run(g,400);assert.equal(g.escortGate,true);const before=g.boardTime;run(g,100);assert.equal(g.boardTime,before);assert.equal(queueFrame(g.boardTime,0).seated,false);g.release();run(g,1);g.input.escort=true;run(g,100);assert.equal(g.boardTime,before);assert.equal(holdFeedback(g).state,'paused');assert.match(holdFeedback(g).reason,/站穩/);g.release();run(g,30);assert.equal(g.boardTime,before);g.input.escort=true;run(g,350);assert.equal(g.boardingIndex,1);assert.equal(queueFrame(g.boardTime,0).seated,true);
});
test('R29 aisle endpoint moves continuously into its own seat, with no early seating',()=>{
 for(const door of [20,50,80])for(let n=0;n<3;n++){const a=queuePosition(door,n,.99,40),b=queuePosition(door,n,1,40);assert.equal(a.surface,'aisle');assert.equal(b.surface,'seat');assert.ok(Math.abs(a.x-b.x)<2.5);}
});
test('R29 completion save restores visited stations, facts and replay conditions for all courses',()=>{
 for(const kind of ['cake','crossing','tickets']){const g=new ContentLesson(kind,{layoutSeed:1});g.begin();for(let i=0;i<3;i++){g.checkpoint();if(i<2)g.next();}const save=g.snapshot(),restored=new ContentLesson(kind,save);assert.equal(save.contentVersion,29);assert.equal(restored.completed,true);assert.deepEqual(restored.snapshot().visited,save.visited);assert.equal(restored.layoutSeed,1);}
});
test('R29 every replay including cycle wrap changes the advertised bend, traffic source or ticket color',()=>{
 for(const kind of ['cake','crossing','tickets'])for(let seed=0;seed<6;seed++){const a=new ContentLesson(kind,{layoutSeed:seed}),b=new ContentLesson(kind,{layoutSeed:(seed+1)%6});assert.notEqual(kind==='tickets'?a.target.color:kind==='cake'?a.bend:a.trafficSource,kind==='tickets'?b.target.color:kind==='cake'?b.bend:b.trafficSource);}
});
