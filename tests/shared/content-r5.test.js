import {finishCrossing} from '../helpers/crossing-actions.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r1.js';
import {lessonFacts} from '../../src/shared/content-r5-feedback.js';
import {boardingPose} from '../../src/shared/content-r3-scene.js';
const tick=(g,s)=>{for(let i=0;i<Math.ceil(s*60);i++)g.update(1/60);};
test('R5 oversteering automatically slows actual speed, then releases allow cake and cream recovery',()=>{
 const g=new ContentLesson('cake');g.begin();g.input.go=true;tick(g,3);const fast=g.speed;
 g.input.right=true;tick(g,.75);assert.ok(g.rough);tick(g,.75);assert.ok(g.speed<fast);assert.ok(g.facts.assists>0);
 g.release();tick(g,4);assert.ok(Math.abs(g.tilt)<9);assert.ok(Math.abs(g.sway)<4);assert.ok(g.facts.recoveries>0);assert.equal(g.phase,'playing');
});
test('R5 no first-station straight-drive shortcut passes the double bend or bay',()=>{
 for(const stage of [1,2]){const g=new ContentLesson('cake',{stage});g.begin();g.input.go=true;tick(g,60);assert.equal(g.completed,false);assert.equal(g.distance,stage===1?29:47);assert.equal(g.bayStopped,false);}
});
test('R5 each ticket stage requires both independent clues and changes the physical correct platform',()=>{
 const correct=[];for(let stage=0;stage<3;stage++){const g=new ContentLesson('tickets',{stage});g.begin();correct.push(g.platforms.findIndex(p=>p.shape===g.target.shape&&p.color===g.target.color));
 assert.ok(g.platforms.some(p=>p.shape===g.target.shape&&p.color!==g.target.color));assert.ok(g.platforms.some(p=>p.color===g.target.color&&p.shape!==g.target.shape));
 for(let i=0;i<3;i++){g.select(i);assert.equal(g.matched,i===correct.at(-1));}}
 assert.equal(new Set(correct).size,3);
});
test('R5 observations and full crossings are factual, not awarded by repeated taps or elapsed time alone',()=>{
 const g=new ContentLesson('crossing');g.begin();tick(g,20);assert.equal(g.facts.waited,0);g.input.brake=true;tick(g,2);g.look('left');g.look('left');assert.equal(g.facts.leftViews,1);tick(g,10);assert.equal(g.canDepart,false);assert.equal(g.facts.waited,0);
 g.look('right');tick(g,.5);assert.equal(g.canDepart,false);finishCrossing(g);assert.equal(g.canDepart,true);assert.equal(g.facts.waited,3);g.depart();g.next();assert.equal(g.facts.leftViews,1);assert.equal(g.looked.left,false);
});
test('R5 wrong stop counted once; reselection preserves train coordinates and records only real correction',()=>{
 const g=new ContentLesson('tickets');g.begin();g.select(1);g.input.go=true;tick(g,6);g.release();g.input.brake=true;tick(g,3);assert.equal(g.facts.wrongStops,1);tick(g,10);assert.equal(g.facts.wrongStops,1);assert.equal(g.door(),false);const x=g.trainX;
 g.select(0);assert.equal(g.trainX,x);assert.equal(g.facts.reselections,1);g.release();g.input.go=true;tick(g,2);assert.ok(g.trainX<x);assert.ok(g.trainX>2);
});
test('R5 visible boarding pace leaves time to see each seat fill and pause still freezes it',()=>{
 const g=new ContentLesson('tickets');g.boardingRate=.3;g.begin();g.select(0);g.input.go=true;tick(g,6);g.release();g.input.brake=true;tick(g,2);g.door();
 for(const expected of [1,2,3]){tick(g,expected===1?1.7:.8);assert.equal([0,1,2].filter(n=>boardingPose(g.boardTime,n).seated).length,expected);assert.equal(g.facts.boarded,0);}
 g.pause();const t=g.boardTime;tick(g,5);assert.equal(g.boardTime,t);g.paused=false;tick(g,1);assert.equal(g.phase,'checkpoint');assert.equal(g.facts.boarded,3);
});
test('R5 two actual ticket play styles produce different persisted outcome facts',()=>{
 function run(detour){const g=new ContentLesson('tickets');g.begin();for(let i=0;i<3;i++){if(detour){g.select(g.platforms.findIndex(p=>p.name!==g.target.name));g.input.go=true;tick(g,6);g.release();g.input.brake=true;tick(g,2);}
 g.select(g.platforms.findIndex(p=>p.name===g.target.name));g.release();g.input.go=true;tick(g,6);g.release();g.input.brake=true;tick(g,2);g.door();tick(g,1.3);if(i<2)g.next();}return new ContentLesson('tickets',JSON.parse(JSON.stringify(g.snapshot())));}
 const direct=run(false),corrected=run(true);assert.equal(direct.completed,true);assert.equal(corrected.completed,true);assert.equal(direct.facts.boarded,9);assert.equal(corrected.facts.boarded,9);assert.equal(direct.facts.reselections,0);assert.equal(corrected.facts.reselections,3);assert.notDeepEqual(lessonFacts(direct),lessonFacts(corrected));assert.equal(corrected.trainX,18);
});
test('R5 fact migration accepts old saves and bounds corrupt numbers without inventing actions',()=>{
 const legacy=new ContentLesson('crossing',{completed:true,stage:2});assert.equal(legacy.facts.waited,0);
 const bad=new ContentLesson('cake',{facts:{recoveries:Infinity,assists:-8,bayStops:'1',boarded:1e8}});assert.equal(bad.facts.recoveries,0);assert.equal(bad.facts.assists,0);assert.equal(bad.facts.bayStops,0);assert.equal(bad.facts.boarded,9999);
});
