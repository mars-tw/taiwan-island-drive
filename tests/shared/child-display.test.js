import test from 'node:test';
import assert from 'node:assert/strict';
import {roadSpeedDisplay,childFlightDisplay} from '../../src/shared/child-display.js';
test('speed instrument never describes a full-speed car as slow, regardless of reward',()=>{
 assert.equal(roadSpeedDisplay(180).label,'開得快');assert.equal(roadSpeedDisplay(180).bars,5);
 assert.equal(roadSpeedDisplay(45).label,'慢慢開');assert.equal(roadSpeedDisplay(0).label,'停穩了');
 assert.deepEqual(roadSpeedDisplay(NaN),roadSpeedDisplay(0));
});
test('flight height is clearance over terrain; grounded flight cannot light altitude bars',()=>{
 const mountain={grounded:false,position:{y:500},airspeed:36};
 assert.equal(childFlightDisplay(mountain,480).height,1);assert.equal(childFlightDisplay(mountain,0).height,5);
 const grounded=childFlightDisplay({...mountain,grounded:true},480);assert.equal(grounded.height,0);assert.equal(grounded.label,'沿跑道前進');
 assert.equal(childFlightDisplay({...mountain,airspeed:0,grounded:true}).label,'跑道準備中');
});
