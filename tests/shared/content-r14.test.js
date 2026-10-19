import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r1.js';
import {stability,drivingCue,crossingCue,crossingLocation,queuePosition} from '../../src/shared/content-r14-scene.js';
const tick=(g,s)=>{for(let i=0;i<Math.ceil(s*60);i++)g.update(1/60);};
const make=(kind,saved={})=>{const g=new ContentLesson(kind,saved,{releaseRecovery:true,observeTraffic:true,freshObservation:true,visualDeparture:true,manualDoors:true,visualDelivery:true,strictTurns:true});g.balancePractice=kind==='cake';g.boardingRate=.3;g.boardingEnd=1.65;g.begin();return g;};
test('R14 stability is monotonic, symmetric and independent of throttle, danger and assistance',()=>{
 let last=-1;for(let lean=32;lean>=0;lean--){const a=stability({balanceLean:lean}),b=stability({balanceLean:-lean,input:{go:true},balanceDanger:true,assisting:true});assert.deepEqual(a,b);assert.ok(a.fill>=last);last=a.fill;if(lean>=12)assert.equal(a.tone,'orange');if(lean>=3)assert.notEqual(a.tone,'green');}
 assert.deepEqual([20,7,0].map(balanceLean=>stability({balanceLean}).tone),['orange','lime','green']);
});
test('R14 wrong turn cannot move through the bend, release recovers, actual left and right are required',()=>{
 const g=make('cake',{stage:1});g.distance=20;g.speed=3;g.input.go=true;g.input.right=true;tick(g,.6);assert.equal(g.distance,20);assert.ok(g.balanceLean<0);g.release();tick(g,4);assert.ok(Math.abs(g.balanceLean)<3);assert.equal(drivingCue(g).action,'go');
 const before=Math.abs(g.balanceLean);assert.equal(g.wrongTurn('right'),true);assert.ok(Math.abs(g.balanceLean)>before);tick(g,4);assert.equal(g.distance,20);assert.ok(Math.abs(g.balanceLean)<3);
 g.input.go=true;g.input.left=true;tick(g,4);assert.ok(g.turns.left>=.2);assert.equal(g.turns.right,0);assert.ok(g.distance<=40);g.release();g.input.go=true;g.input.right=true;tick(g,6);assert.ok(g.turns.right>=.2);assert.equal(g.distance,55);g.release();g.input.brake=true;tick(g,3);assert.ok(['delivering','checkpoint'].includes(g.phase));tick(g,2);assert.equal(g.phase,'checkpoint');
});
test('R14 each train station needs boarding, retract, closed doors and departure before credit and save',()=>{
 const g=make('tickets');for(let stage=0;stage<3;stage++){
  g.select(g.platforms.findIndex(p=>p.shape!==g.target.shape||p.color!==g.target.color));assert.equal(g.door(),false);g.select(g.platforms.findIndex(p=>p.shape===g.target.shape&&p.color===g.target.color));g.input.go=true;tick(g,7);g.release();g.input.brake=true;tick(g,2);assert.equal(g.door(),true);assert.equal(g.departTrain(),false);tick(g,8);assert.equal(g.boardTime,1.04);assert.equal(g.facts.boarded,stage*3);assert.equal(g.retractStep(),true);assert.equal(g.retractStep(),false);tick(g,3);assert.equal(g.boardTime,1.4);assert.equal(g.departTrain(),true);assert.equal(g.phase,'departing');tick(g,1.2);assert.equal(g.facts.boarded,(stage+1)*3);if(stage<2)g.next();
 }assert.equal(g.completed,true);assert.equal(new ContentLesson('tickets',g.snapshot()).facts.boarded,9);
});
test('R14 crossing instructions follow movement and departure, sidewalk exit is continuous',()=>{
 assert.match(crossingCue({phase:'departing'}).text,/出發中/);
 assert.match(crossingCue({crossTime:.4,crossingPerson:'grandma'}).text,/奶奶正在過街/);
 assert.deepEqual(crossingLocation('child','crossing',1),crossingLocation('child','arrived'));
 assert.equal(crossingLocation('child','arrived').x,92.5);
});
test('R14 queue remains within 80 CSS pixels of the door on phone and iPad, and reaches the sill',()=>{
 for(const width of [242,360,720,1032])for(const door of [20,50,90])for(let n=0;n<3;n++){
  const start=queuePosition(door,n,0,25,width);assert.ok(Math.abs(start.x-door)*width/100<=80);assert.deepEqual(queuePosition(door,n,.58,25,width),{x:door,bottom:25});
 }
});
