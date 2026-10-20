import {finishCrossing} from '../helpers/crossing-actions.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson,CROSSING_ORDERS} from '../../src/shared/content-r1.js';
import {cakePose} from '../../src/shared/content-r4-scene.js';
import {lessonFacts} from '../../src/shared/content-r5-feedback.js';
import {boardingPose} from '../../src/shared/content-r3-scene.js';
const tick=(g,s)=>{for(let i=0;i<Math.ceil(s*60);i++)g.update(1/60);};
test('R6 cream, fruit and flag have distinct delayed force responses and settle',()=>{
 const g=new ContentLesson('cake');g.begin();g.input.go=true;tick(g,3);g.input.right=true;tick(g,1);
 const p=cakePose(g);assert.ok(Math.abs(p.cream)>15);assert.ok(Math.abs(p.fruit)>15);assert.notEqual(p.cream,p.fruit);assert.notEqual(p.flag,p.cake);
 g.release();tick(g,8);const settled=cakePose(g);for(const k of ['cream','fruit','flag','cake'])assert.ok(Math.abs(settled[k])<1,k);
});
test('R6 previous crossing order cannot override the current first friend',()=>{
 for(const stage of [1,2]){const g=new ContentLesson('crossing',{stage});g.begin();g.input.brake=true;tick(g,2);g.look('left');g.look('right');
 assert.equal(g.requestFriend(CROSSING_ORDERS[stage-1][0]),false);assert.equal(g.crossed,0);assert.equal(g.crossingPerson,CROSSING_ORDERS[stage][0]);assert.ok(g.orderHint);assert.equal(g.requestFriend(g.crossingPerson),true);assert.equal(g.orderHint,'');finishCrossing(g);assert.equal(g.canDepart,true);}
});
test('R6 early departure is factual feedback, survives save and differs from patient waiting',()=>{
 function run(early){const g=new ContentLesson('crossing');g.begin();for(let s=0;s<3;s++){g.input.brake=true;tick(g,2);g.look('left');if(early)assert.equal(g.depart(),false);g.look('right');finishCrossing(g);assert.equal(g.depart(),true);if(s<2)g.next();}return new ContentLesson('crossing',JSON.parse(JSON.stringify(g.snapshot())));}
 const patient=run(false),reminded=run(true);assert.equal(patient.completed,true);assert.equal(reminded.facts.waited,9);assert.equal(reminded.facts.blockedStarts,3);assert.notDeepEqual(lessonFacts(patient),lessonFacts(reminded));
});
test('R6 boarding has a visible open-door waiting interval and conserves people',()=>{
 assert.equal(boardingPose(.04,0).progress,0);
 for(const [time,expected] of [[.46,[false,false,false]],[.49,[true,false,false]],[.75,[true,true,false]],[.97,[true,true,true]]])assert.deepEqual([0,1,2].map(n=>boardingPose(time,n).seated),expected);
 assert.ok(boardingPose(.46,0).progress>.9);assert.equal(boardingPose(.46,0).seated,false);assert.equal(boardingPose(.49,0).seated,true);
});
test('R6 cake summary reports actual counts instead of a generic completion phrase',()=>{
 const a=new ContentLesson('cake',{completed:true,facts:{recoveries:2,assists:4,bayStops:1,bayRestarts:1}}),b=new ContentLesson('cake',{completed:true});
 assert.match(lessonFacts(a)[0].text,/2/);assert.match(lessonFacts(a)[1].text,/1/);assert.match(lessonFacts(a)[2].text,/4/);assert.notDeepEqual(lessonFacts(a),lessonFacts(b));
});
