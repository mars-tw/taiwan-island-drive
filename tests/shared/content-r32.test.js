import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r32.js';
import {cakeView,crossingView,boardingScene,boardingCue} from '../../src/shared/content-r32-scene.js';
const run=(g,seconds)=>{for(let i=0;i<seconds/.016;i++)g.update(.016);};
test('R32 wrong support worsens lean and late braking slides the cake; either is recoverable without losing',()=>{
 const g=new ContentLesson('cake');g.practice=true;g.begin();g.input.go=true;run(g,2);
 const before=Math.abs(cakeView(g).angle);g.input['recover-left']=true;run(g,1.8);
 assert.ok(Math.abs(cakeView(g).angle)>before);assert.ok(Math.abs(g.traySlide)>24);assert.equal(cakeView(g).edge,true);assert.equal(cakeView(g).highlight,'');
 g.release();g.input.brake=true;g.input['recover-right']=true;run(g,4);g.release();run(g,1);
 assert.equal(cakeView(g).angle,0);assert.equal(cakeView(g).fill,100);assert.equal(g.traySlide,0);assert.equal(g.edgeRescues,1);assert.equal(g.phase,'playing');
 // Late braking alone also slides: no wrong support is needed to trigger it.
 const late=new ContentLesson('cake');late.begin();late.input.go=true;run(late,4);late.input.right=true;run(late,4);
 assert.equal(late.recoveryWrong,false);assert.ok(Math.abs(late.traySlide)>24);
 late.release();late.input.brake=true;late.input[late.balanceLean>0?'recover-left':'recover-right']=true;run(late,5);late.release();run(late,1);
 assert.equal(cakeView(late).fill,100);assert.equal(late.traySlide,0);
});
test('R32 each replay has a real reflected road and both safe bay coordinates and a recoverable exit',()=>{
 for(const seed of [0,1])for(const distance of [42,47,50,54.6]){const g=new ContentLesson('cake',{stage:2,layoutSeed:seed});g.begin();g.distance=distance;g.bayStopped=distance>=47;g.bayRestarted=distance>47;const p=cakeView(g).pose;assert.ok(p.x>=-.1&&p.x<=.15);assert.ok(p.y>=-.12&&p.y<=0);}
 const a=new ContentLesson('cake',{layoutSeed:0}),b=new ContentLesson('cake',{layoutSeed:1});assert.notEqual(cakeView(a).mirrored,cakeView(b).mirrored);assert.notEqual(a.bend,b.bend);
});
test('R32 crossing unsafe start is visible and never auto-completes; only the new lane expires',()=>{
 const g=new ContentLesson('crossing',{}, {observeTraffic:true,visualDeparture:true});g.practice=true;g.begin();assert.equal(g.depart(),false);assert.match(crossingView(g).text,/車|停|朋友|兩邊/);g.speed=0;g.look('left');g.look('right');run(g,6.4);assert.equal(g.newTraffic,true);const stale=g.staleSide,other=stale==='left'?'right':'left';assert.equal(g.looked[other],true);assert.equal(g.canDepart,false);run(g,12);g.look(stale);run(g,30);assert.equal(g.crossed,3);assert.equal(g.canDepart,true);assert.equal(g.depart(),true);run(g,2);assert.equal(g.phase,'checkpoint');
});
test('R32 cabin threshold, aisle and seat differ in actual positions, count changes only at seat',()=>{
 const g=new ContentLesson('tickets');g.phase='boarding';g.boardingIndex=0;g.doorStage='boarding';const positions=[];
 for(const p of [.69,.86,1]){g.boardTime=.1+p*.29;positions.push(boardingScene(g)[0]);}
 assert.equal(positions[0].surface,'threshold');assert.equal(positions[1].surface,'aisle');assert.equal(positions[2].surface,'seat');assert.ok(positions[0].x>positions[1].x&&positions[1].x>positions[2].x);assert.deepEqual(positions.map(p=>p.seated),[false,false,true]);
 g.doorStage='awaiting';g.boardingIndex=1;g.chosenPassenger=1;assert.equal(boardingCue(g).label,'邀小晴上車');assert.doesNotMatch(boardingCue(g).text,/他/);
});
test('R32 all three lesson saves retain completion and practice choice',()=>{
 for(const kind of ['cake','crossing','tickets']){const g=new ContentLesson(kind);g.begin();g.practice=true;g.completed=true;g.visited=[0,1,2];const s=g.snapshot();assert.equal(s.contentVersion,32);assert.deepEqual(new ContentLesson(kind,s).snapshot(),s);}
});
