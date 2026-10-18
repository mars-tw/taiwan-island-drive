import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r1.js';
import {boardingPose,ticketGeometry} from '../../src/shared/content-r3-scene.js';
const tick=(g,s)=>{for(let i=0;i<Math.ceil(s*60);i++)g.update(1/60);};
test('R3 stationary brake produces no fictitious acceleration and flag/cream recover',()=>{
 const g=new ContentLesson('cake');g.begin();g.input.go=true;tick(g,2);g.release();g.input.brake=true;tick(g,.4);assert.ok(g.tilt>20);tick(g,3);
 assert.equal(g.speed,0);assert.equal(g.acceleration,0);assert.ok(Math.abs(g.tilt)<.01);assert.ok(Math.abs(g.sway)<.01);
});
test('R3 three consecutive brake samples differ and a slow stop needs less flag deflection',()=>{
 function braking(launch){const g=new ContentLesson('cake');g.begin();g.input.go=true;tick(g,launch);g.release();g.input.brake=true;const angles=[];for(const s of [.1,.2,.3]){tick(g,s);angles.push(g.tilt);if(launch<1)g.release();}return angles;}
 const hard=braking(2),gentle=braking(.16);assert.ok(hard[2]-hard[0]>15);assert.ok(Math.max(...hard)>25);assert.ok(Math.max(...gentle)<15);
});
test('R3 ticket train moves continuously on one horizontal rail, including wrong-to-right reselection',()=>{
 const g=new ContentLesson('tickets');g.begin();const origin=g.trainX;g.select(2);g.input.go=true;tick(g,2);const moving=g.trainX;assert.ok(moving>origin&&moving<34);assert.equal(g.door(),false);tick(g,4);g.release();g.input.brake=true;tick(g,2);assert.equal(g.trainX,34);assert.equal(g.door(),false);
 g.select(0);assert.equal(g.trainX,34);g.release();g.input.go=true;tick(g,3);assert.ok(g.trainX>2&&g.trainX<34);tick(g,3);g.release();g.input.brake=true;tick(g,2);assert.equal(g.trainX,2);assert.equal(g.door(),true);assert.ok(ticketGeometry(g).door>g.trainX);
});
test('R3 invalid platform index cannot move train or corrupt matching state',()=>{
 const g=new ContentLesson('tickets');g.begin();for(const i of [-1,3,NaN,1.5,'0'])g.select(i);assert.equal(g.selected,-1);assert.equal(g.trainX,-40);assert.equal(g.matched,false);
});
test('R3 boarding trajectories are ordered; seats fill one by one before the next-station gate',()=>{
 assert.equal(boardingPose(.1,0).seated,false);assert.equal(boardingPose(.55,0).seated,true);assert.equal(boardingPose(.55,1).seated,false);assert.equal(boardingPose(.55,2).seated,false);
 assert.equal(boardingPose(1,2).seated,true);assert.equal(boardingPose(0,2,true).seated,true);
 const g=new ContentLesson('tickets');g.begin();g.select(0);g.input.go=true;tick(g,6);g.release();g.input.brake=true;tick(g,2);g.door();tick(g,.8);assert.equal(g.phase,'boarding');g.pause();const t=g.boardTime;tick(g,2);assert.equal(g.boardTime,t);g.paused=false;tick(g,.5);assert.equal(g.phase,'checkpoint');assert.equal(new ContentLesson('tickets',g.snapshot()).stage,1);
});
