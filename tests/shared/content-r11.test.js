import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r1.js';
import {cakeFeedback} from '../../src/shared/content-r7-scene.js';
import {pedalState,crossingCue,ticketDoorState,ticketHint,lessonResult} from '../../src/shared/content-r11-scene.js';
const tick=(g,s)=>{for(let i=0;i<Math.ceil(s*60);i++)g.update(1/60);};
const cake=()=>{const g=new ContentLesson('cake');g.balancePractice=true;g.begin();return g;};
test('R11 cake accumulated imbalance needs direction-sensitive correction; random tapping never resets lean',()=>{
 const g=cake();g.input.go=true;for(let i=0;i<180&&g.balanceLean> -18;i++)g.update(1/60);assert.ok(g.balanceLean<= -18);const start=g.balanceLean;
 const wrong=cake();wrong.input.go=true;for(let i=0;i<180&&wrong.balanceLean> -18;i++)wrong.update(1/60);wrong.input.left=true;tick(wrong,.3);assert.ok(wrong.balanceLean<start);
 g.input.go=false;g.input.right=true;tick(g,.3);assert.ok(Math.abs(g.balanceLean)<Math.abs(start));
 g.input.right=false;tick(g,.05);assert.notEqual(g.balanceLean,0);assert.equal(g.facts.recoveries,0);
 for(let n=0;n<180&&!g.facts.recoveries;n++){g.input.right=g.balanceLean< -3;g.input.left=g.balanceLean>3;g.update(1/60);}
 assert.ok(g.facts.recoveries>0);assert.ok(Math.abs(g.balanceLean)<3);assert.equal(cakeFeedback(g).settled,true);
 const saved=new ContentLesson('cake',JSON.parse(JSON.stringify(g.snapshot())));assert.equal(saved.facts.recoveries,g.facts.recoveries);
 assert.equal(pedalState(g,{release:true}).text,'已放開');g.input.go=true;assert.deepEqual(pedalState(g,{release:true}),{state:'release',text:'請放開'});
});
test('R11 each of nine friends clears observations, highlights the missing side, completes and saves',()=>{
 const g=new ContentLesson('crossing',{}, {freshObservation:true});g.begin();
 for(let s=0;s<3;s++){g.input.brake=true;tick(g,2);for(let n=0;n<3;n++){
  assert.deepEqual(g.looked,{left:false,right:false});assert.equal(crossingCue(g).action,'look-left');g.look('left');assert.equal(crossingCue(g).action,'look-right');assert.equal(g.depart(),false);assert.equal(g.crossed,n);g.look('right');g.look(g.decisionSide);tick(g,3.5);assert.equal(g.crossed,n+1);
 }assert.equal(g.depart(),true);if(s<2)g.next();}
 const saved=new ContentLesson('crossing',JSON.parse(JSON.stringify(g.snapshot())));assert.equal(saved.completed,true);assert.equal(saved.facts.waited,9);assert.match(lessonResult(saved).learned,/9 位/);
});
test('R11 short random taps cannot reset imbalance and results reflect actual assisted or reminded actions',()=>{
 const g=cake();g.input.go=true;for(let i=0;i<180&&g.balanceLean> -18;i++)g.update(1/60);
 let seed=41;for(let i=0;i<18;i++){seed=(seed*1664525+1013904223)>>>0;const before=g.balanceLean;g.input.left=!!(seed&1);g.input.right=!!(seed&2);assert.equal(g.balanceLean,before);g.update(1/120);assert.ok(Math.abs(g.balanceLean-before)<1);assert.ok(Math.abs(g.balanceLean)>5);}
 assert.equal(g.facts.recoveries,0);assert.ok(g.facts.assists>0);
 const plain=new ContentLesson('cake',{completed:true}),assisted=new ContentLesson('cake',g.snapshot());assert.notEqual(lessonResult(plain).practice,lessonResult(assisted).practice);
 const patient=new ContentLesson('crossing',{completed:true,facts:{waited:9}}),reminded=new ContentLesson('crossing',{completed:true,facts:{waited:9,blockedStarts:1}});assert.notEqual(lessonResult(patient).detail,lessonResult(reminded).detail);
 const direct=new ContentLesson('tickets',{completed:true,facts:{boarded:9}}),changed=new ContentLesson('tickets',{completed:true,facts:{boarded:9,reselections:1}});assert.notEqual(lessonResult(direct).detail,lessonResult(changed).detail);
});
test('R11 tickets retract the step before closing; wrong station stays shut; nine seated survive reload',()=>{
 const g=new ContentLesson('tickets');g.boardingRate=.3;g.boardingEnd=1.65;g.begin();
 for(let s=0;s<3;s++){g.select(g.platforms.findIndex(p=>p.name!==g.target.name));assert.equal(g.door(),false);assert.deepEqual(ticketDoorState(g),{state:'closed',open:0,step:0});g.select(g.platforms.findIndex(p=>p.name===g.target.name));g.input.go=true;tick(g,7);g.release();g.input.brake=true;tick(g,2);assert.equal(g.door(),true);tick(g,3.6);assert.equal(ticketDoorState(g).state,'retracting');assert.equal(ticketDoorState(g).open,1);assert.match(ticketHint(g,''),/先收踏階/);tick(g,.5);assert.equal(ticketDoorState(g).step,0);assert.equal(ticketDoorState(g).state,'closing');assert.doesNotMatch(ticketHint(g,''),/門關好了/);tick(g,2);assert.equal(g.phase,s===2?'done':'checkpoint');if(s<2)g.next();}
 const saved=new ContentLesson('tickets',JSON.parse(JSON.stringify(g.snapshot())));assert.equal(saved.completed,true);assert.equal(saved.facts.boarded,9);assert.match(lessonResult(saved).learned,/9 位/);
});
