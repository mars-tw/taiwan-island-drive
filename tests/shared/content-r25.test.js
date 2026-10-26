import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r24.js';
import {drivingCue,stability,holdFeedback,STOP_RULES,queuePosition} from '../../src/shared/content-r25-scene.js';
test('R25 both wrong directions immediately name the opposite recovery action',()=>{
 for(const balanceLean of [-12,12]){
  const g=new ContentLesson('cake');g.begin();g.balanceLean=balanceLean;g.recoveryActive=true;
  const correct=balanceLean>0?'left':'right';g.input['recover-'+(balanceLean>0?'right':'left')]=true;g.update(.05);
  assert.equal(drivingCue(g).action,'recover-'+correct);assert.match(drivingCue(g).text,correct==='left'?/改按左邊/:/改按右邊/);
  assert.equal(holdFeedback(g).reason,drivingCue(g).text);g.release();g.update(.05);assert.equal(stability(g).status,'等你扶正');
  const lean=g.balanceLean;g.update(.05);assert.equal(g.balanceLean,lean);
 }
});
test('R25 station rule markers distinguish existing stop mechanics within every course',()=>{
 for(const rules of Object.values(STOP_RULES))assert.equal(new Set(rules).size,3);
 assert.match(STOP_RULES.cake[2],/停.*走/);assert.match(STOP_RULES.crossing[1],/右/);assert.match(STOP_RULES.crossing[2],/再看/);
 assert.match(STOP_RULES.tickets[1],/同形不同色/);assert.match(STOP_RULES.tickets[2],/同色不同形/);
});
test('R25 waiting friends keep a foreground waiting line and join the same real door',()=>{
 for(let stage=0;stage<3;stage++)for(let person=0;person<3;person++){
  assert.equal(queuePosition(50,person,0,30,360,550,130,stage).bottom,1);
  assert.equal(queuePosition(50,person,.58,30,360,550,130,stage).x,50);
 }
});
