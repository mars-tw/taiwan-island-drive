import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson,CONTENT_LESSONS,CAKE_ROUTES,CROSSING_SECONDS} from '../../src/shared/content-r1.js';
const tick=(g,s)=>{for(let i=0;i<Math.ceil(s*60);i++)g.update(1/60);};
test('R2 cake: acceleration, side force and braking have distinguishable flag angles; relaxing recovers',()=>{
 const g=new ContentLesson('cake');g.begin();g.input.go=true;tick(g,.5);const start=g.tilt;assert.ok(start< -22);assert.equal(g.rough,true);
 tick(g,2);g.input.left=true;tick(g,1);const turn=g.tilt;assert.ok(turn>12);assert.ok(turn-start>35);
 g.release();g.input.brake=true;tick(g,.3);const stop=g.tilt;assert.ok(stop>15);g.release();tick(g,5);assert.ok(Math.abs(g.tilt)<1);assert.equal(g.rough,false);
 assert.equal(new Set(CAKE_ROUTES).size,3);const bends=new ContentLesson('cake',{stage:1});bends.distance=20;assert.equal(bends.bend,-1);bends.distance=35;assert.equal(bends.bend,1);
});
test('R2 crossing: honest name, three real speeds, all observations and all three friends gate departure',()=>{
 assert.equal(CONTENT_LESSONS.crossing,'路口停看聽');assert.ok(CROSSING_SECONDS.bike<CROSSING_SECONDS.child);assert.ok(CROSSING_SECONDS.grandma>CROSSING_SECONDS.child);
 const g=new ContentLesson('crossing');g.begin();g.input.brake=true;tick(g,2);g.look('left');g.look('right');assert.equal(g.canDepart,false);
 const people=[];for(let i=0;i<3;i++){people.push(g.crossingPerson);g.look(g.decisionSide);assert.equal(g.friendConfirmed,true);tick(g,g.crossingDuration+.7);assert.equal(g.canDepart,i===2);}
 assert.deepEqual(people,['child','bike','grandma']);assert.equal(g.depart(),true);assert.equal(new ContentLesson('crossing',g.snapshot()).stage,1);
});
test('R2 cake routes: uphill resists launch, double bend reverses, final approach gently slows for stopping',()=>{
 const slope=new ContentLesson('cake'),flat=new ContentLesson('cake',{stage:1}),approach=new ContentLesson('cake',{stage:2});slope.begin();flat.begin();approach.begin();slope.input.go=flat.input.go=approach.input.go=true;tick(slope,1);tick(flat,1);assert.ok(slope.speed<flat.speed);assert.equal(slope.grade,.6);
 approach.distance=42;tick(approach,3);assert.equal(approach.approach,true);assert.ok(approach.speed<4.1);assert.ok(approach.speed>3);assert.equal(approach.phase,'playing');approach.input.go=false;approach.input.brake=true;tick(approach,1);assert.equal(approach.speed,0);assert.equal(approach.completed,false);
});
test('R2 tickets: wrong platform can be visited but cannot board; each correct platform boards only after stop',()=>{
 const g=new ContentLesson('tickets');g.begin();
 for(let stage=0;stage<3;stage++){
  const wrong=g.platforms.findIndex(p=>p.name!==g.target.name);g.select(wrong);g.input.go=true;tick(g,6);assert.equal(g.distance,30);assert.equal(g.door(),false);g.release();g.input.brake=true;tick(g,2);assert.equal(g.door(),false);assert.equal(g.hint,'這站不一樣，停穩再換月台。');
  g.select(g.platforms.findIndex(p=>p.name===g.target.name));g.release();g.input.go=true;tick(g,6);assert.equal(g.door(),false);g.release();g.input.brake=true;tick(g,2);assert.equal(g.door(),true);g.pause();tick(g,2);assert.equal(g.boardTime,0);g.paused=false;tick(g,.6);assert.equal(g.phase,'boarding');tick(g,.7);assert.ok(['checkpoint','done'].includes(g.phase));
  if(stage<2)g.next();
 }
 assert.equal(new ContentLesson('tickets',g.snapshot()).completed,true);
});
