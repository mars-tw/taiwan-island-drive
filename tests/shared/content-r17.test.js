import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r17.js';
import {observation,crossingTraffic,ticketSceneGeometry,queuePosition,drivingCue,stability} from '../../src/shared/content-r17-scene.js';
const options={releaseRecovery:true,observeTraffic:true,freshObservation:true,visualDeparture:true,manualDoors:true,visualDelivery:true,strictTurns:true};
const make=(k,stage=0,layoutSeed=0)=>{const g=new ContentLesson(k,{stage,layoutSeed},options);g.balancePractice=k==='cake';g.begin();return g;};
const tick=(g,s)=>{for(let i=0;i<Math.ceil(s*60);i++)g.update(1/60);};
test('R17 replay swaps cake bend and rejects the previous direction without progress',()=>{
 const first=make('cake'),replay=make('cake',0,1);first.distance=replay.distance=20;
 assert.equal(first.bend,-replay.bend);replay.input.right=true;tick(replay,.3);assert.equal(replay.distance,20);assert.match(drivingCue(replay).text,/方向相反/);
 replay.release();tick(replay,3);replay.input.left=true;tick(replay,.5);assert.ok(replay.distance>20);assert.equal(stability(replay).tone,'green');assert.equal(new ContentLesson('cake',replay.snapshot()).layoutSeed,1);
});
test('R17 traffic changes direction on replay and observation ends before anyone walks',()=>{
 for(let stage=0;stage<3;stage++){
  const g=make('crossing',stage);g.speed=0;g.look('right');assert.equal(g.wrongLook,'right');assert.match(g.choiceHint,/你先看了右邊/);assert.deepEqual(g.looked,{left:false,right:false});
  g.look('left');assert.equal(g.wrongLook,'');assert.ok(observation(g));g.look('right');assert.ok(observation(g));tick(g,5);assert.equal(observation(g),null);
  assert.notEqual(crossingTraffic(g).reverse,crossingTraffic(make('crossing',stage,1)).reverse);
 }
});
test('R17 every replay changes target combination and answer slot; previous slot is safely wrong',()=>{
 for(let stage=0;stage<3;stage++){
  const a=make('tickets',stage),b=make('tickets',stage,1);assert.notDeepEqual(a.target,b.target);
  const slot=a.platforms.findIndex(t=>t.shape===a.target.shape&&t.color===a.target.color);b.select(slot);assert.equal(b.matched,false);b.distance=30;assert.equal(b.door(),false);
  assert.equal(new ContentLesson('tickets',b.snapshot()).target.name,b.target.name);
 }
});
test('R17 train size and queue origins are independent of wrong platform choice',()=>{
 const a=make('tickets'),b=make('tickets');a.select(0);b.select(1);a.distance=b.distance=30;
 assert.deepEqual(ticketSceneGeometry(a),ticketSceneGeometry(b));
 const d=ticketSceneGeometry(a).door,origins=[0,1,2].map(n=>queuePosition(d,n,0,25));
 assert.equal(new Set(origins.map(p=>p.x)).size,3);assert.ok(origins.every(p=>p.x>10&&p.x<90&&p.bottom>25));
 assert.equal(queuePosition(d,0,.58,25).x,d);assert.equal(queuePosition(d,0,.58,25).bottom,25);
});
test('R17 three courses still finish, serialize and restore after scene corrections',()=>{
 for(const kind of ['cake','crossing','tickets']){
  const g=make(kind);
  for(let stage=0;stage<3;stage++){
   if(kind==='cake'){
    for(let n=0;n<30000&&g.phase==='playing';n++){const c=drivingCue(g);g.release();if(c.action)g.input[c.action]=true;g.update(1/60);}assert.equal(g.phase,'delivering');tick(g,2);
   }else if(kind==='crossing'){
    g.speed=0;for(let n=0;n<3;n++){g.look('left');g.look('right');for(let i=0;i<900&&g.crossed===n;i++)g.update(1/60);assert.equal(g.crossed,n+1);}assert.equal(g.depart(),true);tick(g,2);
   }else{
    g.select(g.platforms.findIndex(t=>t.shape===g.target.shape&&t.color===g.target.color));g.distance=30;assert.equal(g.door(),true);tick(g,1);
    for(let n=0;n<3;n++){assert.equal(g.choosePassenger(n),true);assert.equal(g.boardFriend(),true);tick(g,1.2);}
    assert.equal(g.retractStep(),true);tick(g,1);assert.equal(g.closeDoor(),true);tick(g,1);assert.equal(g.departTrain(),true);tick(g,2);
   }
   if(stage<2)g.next();
  }
  assert.equal(g.completed,true);const saved=JSON.parse(JSON.stringify(g.snapshot()));assert.equal(new ContentLesson(kind,saved).completed,true);
 }
});
