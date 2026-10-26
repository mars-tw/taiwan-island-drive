import {finishCrossing} from '../helpers/crossing-actions.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r1.js';
import {cakePose,sideWatch,cakeTask} from '../../src/shared/content-r4-scene.js';
const tick=(g,s)=>{for(let i=0;i<Math.ceil(s*60);i++)g.update(1/60);};
test('R4 double bend needs both real steering directions, not time spent driving straight',()=>{
 const g=new ContentLesson('cake',{stage:1});g.begin();g.input.go=true;tick(g,25);assert.equal(g.distance,29);assert.equal(g.turns.left,0);
 g.input.left=true;tick(g,1);assert.ok(g.distance>29);g.input.left=false;tick(g,20);assert.equal(g.distance,40);assert.equal(g.turns.right,0);
 // At the second bend boundary a corrective turn must still count.
 g.input.right=true;tick(g,4);assert.ok(g.turns.right>=.2);assert.ok(g.distance>40);
});
test('R4 bay cannot complete without stopping inside the bay and then restarting',()=>{
 const g=new ContentLesson('cake',{stage:2});g.begin();g.input.go=true;g.input.left=true;tick(g,35);assert.equal(g.distance,47);assert.equal(g.completed,false);assert.equal(g.bayStopped,false);
 g.release();g.input.brake=true;tick(g,2);assert.equal(g.bayStopped,true);assert.equal(g.bayRestarted,false);assert.match(cakeTask(g),/再起步/);
 g.release();g.input.go=true;tick(g,3);assert.equal(g.bayRestarted,true);g.release();g.input.brake=true;tick(g,2);assert.equal(g.completed,true);assert.equal(new ContentLesson('cake',g.snapshot()).completed,true);
});
test('R4 cake, cream, body pitch and road-relative coordinates follow actual motion',()=>{
 const g=new ContentLesson('cake');g.begin();g.input.go=true;tick(g,.4);const a=cakePose(g);assert.ok(a.cake< -10);assert.ok(a.cream< -5);assert.ok(a.pitch<0);tick(g,1);const b=cakePose(g);assert.ok(b.y<a.y);assert.ok(b.scale<a.scale);
 g.release();tick(g,3);assert.ok(Math.abs(cakePose(g).cake)<Math.abs(a.cake));
});
test('R4 side observations show real pending people and reject invalid/moving/paused looks',()=>{
 const g=new ContentLesson('crossing');g.begin();g.look('left');assert.equal(g.focus,'center');g.input.brake=true;tick(g,2);g.look('bad');assert.equal(g.focus,'center');g.look('left');assert.equal(g.focus,'left');assert.deepEqual(sideWatch(g,'left').people,['child','grandma']);assert.deepEqual(sideWatch(g,'right').people,['bike']);assert.equal(g.depart(),false);
 g.pause();g.look('right');assert.equal(g.focus,'left');g.paused=false;g.look('right');assert.equal(g.focus,'right');finishCrossing(g);assert.equal(sideWatch(g,'left').clear,true);assert.equal(sideWatch(g,'right').clear,true);assert.equal(g.depart(),true);assert.equal(new ContentLesson('crossing',g.snapshot()).stage,1);
});
test('R4 tickets keep all three physical seats and selected station through persisted completion',()=>{
 const g=new ContentLesson('tickets');g.begin();for(let i=0;i<3;i++){g.select(g.platforms.findIndex(p=>p.name===g.target.name));g.input.go=true;tick(g,6);assert.equal(g.door(),false);g.release();g.input.brake=true;tick(g,2);assert.equal(g.door(),true);tick(g,1.3);assert.equal(g.selected,g.platforms.findIndex(p=>p.name===g.target.name));if(i<2)g.next();}
 assert.equal(g.completed,true);assert.equal(new ContentLesson('tickets',g.snapshot()).phase,'done');assert.equal(g.snapshot().started,true);
});
