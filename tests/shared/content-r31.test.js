import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r31.js';
import {cakeView,crossingView,boardingCue} from '../../src/shared/content-r31-scene.js';
const run=(g,n)=>{for(let i=0;i<n;i++)g.update(.016);};

test('R31 cake projects every visible interpretation from one state, including every bay and input state',()=>{
 const records=[];
 for(let stage=0;stage<3;stage++)for(const distance of [0,18,30,43,47,51,54.6,55])for(const speed of [0,1,3,6])for(const lean of [-25,0,25])for(const support of ['', 'recover-left','recover-right']){
  const g=new ContentLesson('cake',{stage});g.begin();Object.assign(g,{distance,speed,balanceLean:lean,bayStopped:stage===2&&distance>=47,bayRestarted:stage===2&&distance>=51,restReady:true});if(support)g.input[support]=true;
  const v=cakeView(g);records.push({stage,distance,speed,lean,support,visible:[v.title,v.status,v.text,v.speedText,v.goLabel],highlight:v.highlight});
  assert.equal(v.highlight,v.action);assert.equal(v.fill===100,v.angle===0);
  if(!support)assert.notEqual(v.status,'扶正中');
  assert.doesNotMatch(v.speedText,/先減速|慢慢開|放輕點/);
  assert.ok(!(v.status==='扶正中'&&v.text.includes('蛋糕歪了')));
  if(v.id==='main-road')assert.match(v.text,/向前/);
  assert.ok(Object.isFrozen(v));
 }
 assert.equal(records.length,864);
});
test('R31 all crossing stages preserve the other lane and one recheck unlocks the complete journey',()=>{
 for(let stage=0;stage<3;stage++)for(let layoutSeed=0;layoutSeed<2;layoutSeed++){
  const g=new ContentLesson('crossing',{stage,layoutSeed},{observeTraffic:true,visualDeparture:true});g.begin();g.speed=0;g.look('left');g.look('right');run(g,400);
  assert.equal(g.newTraffic,true);const stale=g.staleSide,other=stale==='left'?'right':'left';assert.equal(g.looked[other],true);
  let v=crossingView(g);assert.equal(v.sides[stale].confirmed,false);assert.equal(v.sides[other].confirmed,true);assert.equal(v.text,v.note);assert.ok(v.traffic.x>=12&&v.traffic.x<=88);assert.equal(v.sides[stale].car,true);
  g.look(other);assert.equal(g.staleSide,stale);run(g,700);assert.equal(g.looked[other],true);v=crossingView(g);assert.match(v.text,/車過了，再看/);assert.doesNotMatch(v.note,/新車來了/);
  g.look(stale);assert.equal(g.refreshes,1);assert.equal(g.staleSide,'');run(g,1400);assert.equal(g.crossed,3);assert.equal(g.canDepart,true);v=crossingView(g);assert.equal(v.id,'ready');assert.equal(v.route,true);assert.equal(v.action,'depart');
  for(const s of Object.values(v.sides))assert.ok(!s.car&&s.confirmed);
  assert.equal(g.depart(),true);assert.equal(crossingView(g).id,'departing');run(g,100);
 }
});
test('R31 observed occupied lane never projects a safe check',()=>{
 const g=new ContentLesson('crossing',{}, {observeTraffic:true});g.begin();g.speed=0;g.look(g.trafficSource);const v=crossingView(g),s=v.sides[g.trafficSource];assert.equal(s.car,true);assert.equal(s.confirmed,false);assert.doesNotMatch(s.check,/✓/);assert.equal(v.traffic.source,g.trafficSource);
});
test('R31 invitation names the selected child and each lesson completion survives snapshot',()=>{
 const g=new ContentLesson('tickets');g.phase='boarding';g.doorStage='awaiting';assert.equal(g.choosePassenger(2),false);assert.equal(boardingCue(g).label,'點小安的車票');assert.equal(g.choosePassenger(0),true);assert.equal(boardingCue(g).label,'邀小安上車');g.boardingIndex=2;g.chosenPassenger=2;assert.equal(boardingCue(g).label,'邀小宇上車');
 for(const kind of ['cake','crossing','tickets']){const g=new ContentLesson(kind);g.begin();g.completed=true;g.visited=[0,1,2];const saved=g.snapshot();assert.equal(saved.contentVersion,31);assert.deepEqual(new ContentLesson(kind,saved).snapshot(),saved);}
});
