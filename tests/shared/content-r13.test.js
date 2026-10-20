import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r1.js';
import {drivingCue,pedalState,ticketSceneGeometry,queuePosition,crossingLocation,STOP_X} from '../../src/shared/content-r13-scene.js';
const tick=(g,s)=>{for(let n=0;n<Math.ceil(s*60);n++)g.update(1/60);};
const lesson=(k,s={})=>{const g=new ContentLesson(k,s,{releaseRecovery:true,observeTraffic:true,freshObservation:true,visualDeparture:true});g.balancePractice=k==='cake';g.begin();return g;};
test('R13 cake controls retain names and release recovers without steering, preserving a real recovery on reload',()=>{
 const g=lesson('cake');g.input.go=true;tick(g,.3);assert.ok(g.balanceLean< -5);assert.equal(pedalState(g,drivingCue(g)).text,'踏板');assert.equal(drivingCue(g).action,'');assert.match(drivingCue(g).text,/放開踏板/);
 g.release();const leans=[];for(let i=0;i<3;i++){tick(g,.4);leans.push(Math.abs(g.balanceLean));assert.equal(pedalState(g,drivingCue(g)).text,'踏板');}
 assert.ok(leans[0]>leans[1]&&leans[1]>leans[2]);tick(g,2);assert.ok(g.facts.recoveries>=1);assert.ok(Math.abs(g.balanceLean)<3);assert.equal(drivingCue(g).action,'go');
 const saved=new ContentLesson('cake',JSON.parse(JSON.stringify(g.snapshot())));assert.equal(saved.facts.recoveries,g.facts.recoveries);
});
test('R13 both actual turns lean outward and stopping a held brake cannot introduce roll',()=>{
 for(const [side,sign] of [['left',1],['right',-1]]){const g=lesson('cake',{stage:1});g.distance=side==='left'?20:32;g.speed=3;g.input.go=true;g.input[side]=true;tick(g,.7);assert.ok(g.balanceLean*sign>5,`${side}: ${g.balanceLean}`);g.release();tick(g,4);g.input.brake=true;tick(g,3);assert.ok(Math.abs(g.balanceLean)<.1);}
});
test('R13 every friend must observe both sides and wait for the visible car, all nine complete and save',()=>{
 const g=lesson('crossing');for(let stage=0;stage<3;stage++){g.input.brake=true;tick(g,2);for(let n=0;n<3;n++){assert.deepEqual(g.looked,{left:false,right:false});g.look('left');g.look('right');g.look(g.decisionSide);if(n===0){assert.equal(g.trafficActive,true);tick(g,.3);assert.equal(g.crossTime,0);assert.equal(g.depart(),false);}tick(g,8);assert.equal(g.crossed,n+1);}assert.equal(g.depart(),true);tick(g,1.2);if(stage<2)g.next();}
 const saved=new ContentLesson('crossing',JSON.parse(JSON.stringify(g.snapshot())));assert.equal(saved.completed,true);assert.equal(saved.facts.waited,9);
});
test('R13 station signs and real train doors share separated stops, including wrong selections',()=>{
 const xs=[];for(let selected=0;selected<3;selected++){const geo=ticketSceneGeometry({trainX:2+selected*16});xs.push(geo.x);assert.equal(geo.markers[selected],STOP_X[selected]);assert.ok(Math.abs(geo.door-STOP_X[selected])<1e-8);for(let n=0;n<3;n++){const p=queuePosition(geo.door,n,0,25);assert.ok(p.x>3&&p.x<97);assert.deepEqual(queuePosition(geo.door,n,.58,25),{x:geo.door,bottom:25});}}
 assert.ok((xs[2]-xs[1])*360/100>=100);
 const narrow=ticketSceneGeometry({trainX:34},242);for(const marker of narrow.markers){assert.ok(marker/100*242>=30);assert.ok(marker/100*242+30<=242);}assert.ok(Math.abs(narrow.door-narrow.markers[2])<1e-8);
});
test('R13 crossing feet join the zebra and finish in distinct contained pavement slots',()=>{
 for(const who of ['child','bike','grandma']){assert.deepEqual(crossingLocation(who,'crossing',0),crossingLocation(who,'waiting'));assert.deepEqual(crossingLocation(who,'crossing',1),crossingLocation(who,'arrived'));for(const p of [.18,.4,.6,.82])assert.equal(crossingLocation(who,'crossing',p).bottom,35.5);}
 assert.ok(Math.abs(crossingLocation('child','arrived').bottom-crossingLocation('grandma','arrived').bottom)>=18);
});
