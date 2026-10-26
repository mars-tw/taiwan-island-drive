import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r35.js';
import {crossingView,playerBox,PLAYER_ART,PLAYER_APPEARANCE,CROSSING_ROADS} from '../../src/shared/content-r37-scene.js';
import * as R35 from '../../src/shared/content-r35-scene.js';
import * as R37 from '../../src/shared/content-r37-scene.js';
test('R37 cake and ticket exports are the identical R35 functions',()=>{
 for(const name of ['cakeView','roadPicture','boardingScene','boardingCue','holdFeedback'])assert.equal(R37[name],R35[name]);
});
test('R37 main traffic stays hidden until its source is observed, across every station and replay',()=>{
 for(let stage=0;stage<3;stage++)for(let layoutSeed=0;layoutSeed<6;layoutSeed++){
  const g=new ContentLesson('crossing',{stage,layoutSeed},{observeTraffic:true});g.begin();g.speed=0;
  const source=g.trafficSource,other=source==='left'?'right':'left';
  assert.equal(crossingView(g).traffic.visible,false);assert.equal(crossingView(g).sides[source].car,false);
  g.look(other);assert.equal(crossingView(g).traffic.visible,false);
  g.look(source);assert.equal(crossingView(g).traffic.visible,true);assert.equal(crossingView(g).sides[source].car,true);
  g.trafficTime=100;assert.equal(crossingView(g).traffic.visible,false);
  // A newly arriving car invalidates safety confirmation, never grants it.
  g.trafficTime=0;g.newTraffic=true;g.staleSide=source;g.looked[source]=false;
  assert.equal(crossingView(g).sides[source].confirmed,false);
 }
});
test('R37 player identity and source remain constant; departure follows a continuous lane-fitting path',()=>{
 for(let stage=0;stage<3;stage++)for(const [w,h] of [[284,230],[354,490],[736,750],[800,170]]){
  const g=new ContentLesson('crossing',{stage});g.begin();let last;
  for(const phase of ['playing','departing','checkpoint','done'])for(let n=0;n<=150;n++){
   Object.assign(g,{phase,departureTime:n*.01});const v=crossingView(g),b=playerBox(v,w,h);
   assert.equal(v.player.appearanceId,PLAYER_APPEARANCE);assert.equal(v.player.art,PLAYER_ART);
   if(phase==='departing'){
    if(last)assert.ok(Math.hypot(b.centerX-last.centerX,b.centerY-last.centerY)<w*.04,'no position jump');
    if(n>=60){const road=CROSSING_ROADS[stage],radians=b.angle*Math.PI/180,extent=(Math.abs(Math.sin(radians))+Math.abs(Math.cos(radians)))*b.height/2;assert.ok(b.centerY-extent>=h*road.center/100);assert.ok(b.centerY+extent<=h*road.bottom/100);}
    last=b;
   }
  }
 }
});
test('R37 walking progress reflects actual crossing time and arrival count, without advancing it',()=>{
 const g=new ContentLesson('crossing');g.begin();
 for(const expected of [0,.2,.5,1]){g.crossTime=expected*g.crossingDuration;const crossed=g.crossed;assert.equal(crossingView(g).crossingProgress,expected);assert.equal(g.crossed,crossed);}
});
