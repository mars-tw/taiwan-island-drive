import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson,BOARDING_STOPS} from '../../src/shared/content-r33.js';
import {cakeView,crossingView,boardingScene,boardingCue} from '../../src/shared/content-r33-scene.js';
const run=(g,s)=>{for(let i=0;i<s/.016;i++)g.update(.016);};
test('R33 both boarding decisions require release and standing still; holding cannot skip either',()=>{
 for(let index=0;index<3;index++){
  const g=new ContentLesson('tickets');Object.assign(g,{phase:'boarding',doorStage:'boarding',boardingIndex:index,boardTime:.1+index*.31});
  for(let gate=0;gate<2;gate++){
   g.input.escort=true;run(g,5);assert.equal(g.escortWaiting,true);assert.equal(g.escortStop,gate);const t=g.boardTime;
   assert.ok(Math.abs(boardingScene(g)[index].progress-BOARDING_STOPS[gate])<.001);assert.equal(boardingScene(g)[index].seated,false);
   assert.equal(boardingScene(g)[index].pose,'standing');
   g.release();run(g,.2);g.input.escort=true;run(g,.1);assert.equal(g.boardTime,t);assert.ok(g.escortBump>0);assert.match(boardingCue(g).text,/晃了一下/);
   g.release();run(g,.7);assert.equal(g.boardTime,t);assert.equal(g.escortStable,.65);assert.match(boardingCue(g).text,/站穩了/);
  }
  g.input.escort=true;run(g,3);assert.equal(boardingScene(g)[index].seated,true);assert.equal(boardingScene(g)[index].pose,'seated');assert.equal(g.boardingIndex,index+1);
 }
});
test('R33 bay speed never says high inside parking space, main road uses different art and position',()=>{
 for(const layoutSeed of [0,1]){const g=new ContentLesson('cake',{stage:2,layoutSeed});g.begin();Object.assign(g,{distance:47,bayStopped:true,restReady:true});const poses=[];
 for(const distance of [47,50.7,54.6]){Object.assign(g,{distance,bayRestarted:distance>47});poses.push(cakeView(g));}
 assert.notEqual(poses[0].bayPan,poses[2].bayPan);assert.ok(Math.abs(poses[0].pose.x-poses[1].pose.x)>.05&&Math.abs(poses[1].pose.x-poses[2].pose.x)>.05);
 g.distance=49;g.speed=6;g.input.go=true;g.update(.016);assert.ok(g.speed<2);assert.doesNotMatch(cakeView(g).speedText,/高速/);g.speed=0;assert.match(cakeView(g).speedText,/已停住/);
 }
});
test('R33 cake roof, meter and closeup share displacement and angle and use three readable tones',()=>{
 const g=new ContentLesson('cake');const rows=[];
 for(const [balanceLean,traySlide] of [[0,0],[16,15],[31,31]]){Object.assign(g,{balanceLean,traySlide});rows.push(cakeView(g));}
 assert.deepEqual(rows.map(r=>r.tone),['green','yellow','red']);assert.ok(rows[0].roofShift<rows[1].roofShift&&rows[1].roofShift<rows[2].roofShift);assert.ok(rows.every(r=>r.pose.x>0));
});
test('R33 attempted unsafe departure names crossing friend and retains both car coordinates and safety conditions',()=>{
 for(let stage=0;stage<3;stage++)for(const layoutSeed of [0,1])for(const practice of [false,true]){const g=new ContentLesson('crossing',{stage,layoutSeed},{observeTraffic:true});g.begin();g.practice=practice;g.speed=0;g.crossTime=.9;const before=crossingView(g).player;assert.equal(g.depart(),false);const v=crossingView(g);assert.deepEqual(v.player,before);assert.match(v.text,/等.+走到對岸/);
 g.newTraffic=true;g.newTrafficTime=.3;g.crossed=0;const t=crossingView(g);assert.equal(t.stop.visible,true);assert.ok(t.traffic.source==='left'?t.stop.x>t.traffic.x:t.stop.x<t.traffic.x);assert.equal(t.stop.top,t.traffic.top-1);
 }
});
test('R33 all lesson completion saves remain round trippable',()=>{for(const k of ['cake','crossing','tickets']){const g=new ContentLesson(k);g.begin();g.completed=true;g.visited=[0,1,2];g.practice=true;const s=g.snapshot();assert.equal(s.contentVersion,33);assert.deepEqual(new ContentLesson(k,s).snapshot(),s);}});
