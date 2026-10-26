import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson,STAND_HOLD_SECONDS} from '../../src/shared/content-r35.js';
import {cakeView,roadPicture,boardingScene,boardingCue,holdFeedback,crossingView,crossingPlayerBox,observationBox,CROSSING_ROADS} from '../../src/shared/content-r35-scene.js';
const run=(g,s)=>{for(let t=0;t<s-.00001;t+=.01)g.update(Math.min(.01,s-t));};

test('R35 one standing stop per friend, held progress fills, release freezes, seating alone increases count',()=>{
 const g=new ContentLesson('tickets');Object.assign(g,{phase:'boarding',doorStage:'boarding',boardingIndex:0,boardTime:.1});
 for(let n=0;n<3;n++){
  g.boardingIndex=n;g.doorStage='boarding';g.escortStop=0;g.escortStable=0;g.escortReadyTime=0;g.boardTime=.1+n*.31;
  g.input.escort=true;run(g,2.6);assert.equal(g.escortWaiting,true);assert.equal(g.boardingWaits,n+1);assert.equal(boardingScene(g)[n].surface,'threshold');
  const before=g.boardTime;run(g,.27);const partial=g.escortStable;assert.ok(partial>.25&&partial<.5);
  g.input.escort=false;run(g,.1);assert.equal(boardingScene(g)[n].pose,'balancing');run(g,2);
  assert.equal(g.boardTime,before);assert.equal(g.escortStable,partial);assert.equal(holdFeedback(g).state,'paused');assert.match(boardingCue(g).text,/進度留著/);assert.equal(g.boardingIndex,n);
  g.input.escort=true;run(g,STAND_HOLD_SECONDS-partial);assert.equal(g.escortStable,.65);assert.equal(boardingScene(g)[n].pose,'standing');assert.equal(holdFeedback(g).progress,1);
  run(g,1.6);assert.equal(g.boardingIndex,n+1);assert.equal(boardingScene(g)[n].pose,'seated');assert.equal(boardingScene(g).filter(f=>f.seated).length,n+1);assert.equal(g.boardingWaits,n+1);
 }
 assert.equal(g.doorStage,'retract-ready');
});

test('R35 cake cues match direction, speed, station, tray edge and distinct backgrounds for every replay',()=>{
 for(let stage=0;stage<3;stage++)for(const layoutSeed of [0,1]){
  const g=new ContentLesson('cake',{stage,layoutSeed});g.begin();g.practice=true;
  for(const balanceLean of [-28,-14,0,14,28])for(const speed of [0,3,6]){
   Object.assign(g,{balanceLean,speed,traySlide:Math.sign(balanceLean)*30});const v=cakeView(g);
   assert.equal(v.support,balanceLean<0?'right':balanceLean>0?'left':'');assert.equal(v.warningSide,balanceLean<0?'left':balanceLean>0?'right':'');assert.equal(v.angle,Math.round(balanceLean*.875));
   if(speed===0)assert.match(v.text,/停住/);if(speed===6)assert.doesNotMatch(v.text,/已停住|停好了/);
   if(balanceLean)assert.equal(v.edge,true);
   if(stage===0)assert.match(v.roadArt.path,/cake-slope/);if(stage===1)assert.match(v.roadArt.path,/cake-bends/);if(stage===2)assert.match(v.roadArt.path,/bay-panorama/);
  }
  for(const distance of [0,20,32,47,54.6]){g.distance=distance;if(stage===0)assert.match(roadPicture(g).path,/cake-slope/);}
  if(stage===2){Object.assign(g,{distance:54.6,bayStopped:true,bayRestarted:true,balanceLean:0,traySlide:0,speed:1});const v=cakeView(g);assert.match(v.title,/主路/);assert.match(v.text,/主路/);assert.doesNotMatch(v.title,/休息灣/);}
 }
});

test('R35 crossing retains right-hand lanes, check rules and continuous player box at view change',()=>{
 for(let stage=0;stage<3;stage++)for(const layoutSeed of [0,1]){
  const g=new ContentLesson('crossing',{stage,layoutSeed},{observeTraffic:true});g.begin();const t=crossingView(g).traffic;
  assert.equal(t.lane,t.source==='left'?'lower':'upper');assert.equal(g.depart(),false);
  for(const [w,h] of [[300,140],[360,190],[768,400]]){const b=observationBox(crossingView(g),stage,w,h);assert.ok(b.top>=b.laneTop&&b.top+b.height<=b.laneBottom);assert.ok(b.stopTop>=b.laneTop&&b.stopTop+b.stopHeight<=b.laneBottom);}
  for(const [w,h] of [[300,300],[360,450],[768,800]]){
   const boxes=[];for(let i=0;i<=100;i++){Object.assign(g,{phase:'departing',departureTime:.6*i/100});boxes.push(crossingPlayerBox(crossingView(g),w,h));}
   for(let i=1;i<boxes.length;i++){assert.ok(Math.abs(boxes[i].width-boxes[i-1].width)<1);assert.ok(Math.abs(boxes[i].height-boxes[i-1].height)<1);}
   const b=boxes.at(-1),r=CROSSING_ROADS[stage];assert.ok(b.centerY-b.height/2>=h*r.center/100);assert.ok(b.centerY+b.height/2<=h*r.bottom/100);
  }
 }
});

test('R35 completed lesson snapshots retain the existing save protocol and all station visits',()=>{
 for(const kind of ['cake','crossing','tickets']){const g=new ContentLesson(kind);g.begin();g.completed=true;g.visited=[0,1,2];g.stage=2;g.practice=true;const saved=g.snapshot();assert.equal(saved.contentVersion,33);assert.deepEqual(new ContentLesson(kind,saved).snapshot(),saved);}
});
