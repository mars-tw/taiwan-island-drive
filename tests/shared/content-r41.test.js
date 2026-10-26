import test from 'node:test';
import assert from 'node:assert/strict';
import {PAVEMENTS,LANDING_PROGRESS,pavementLocation,arrivedCount,wrongSupportText,observationState,observationProjection,cakeView} from '../../src/shared/content-r41-scene.js';
import {ContentLesson} from '../../src/shared/content-r35.js';
import {crossingView} from '../../src/shared/content-r35-scene.js';

test('R41 every waiting/arrived friend in all three stations and mirrored orders stands on paving',()=>{
 for(let stage=0;stage<3;stage++)for(const seed of [0,1]){
  const g=new ContentLesson('crossing');g.stage=stage;g.layoutSeed=seed;g.reset();g.begin();
  for(const who of ['grandma','child','bike'])for(const phase of ['waiting','arrived']){
   const point=pavementLocation(who,phase,0,stage,g.crossingOrder),strip=PAVEMENTS[stage][phase==='waiting'?'near':'far'];
   assert.ok(point.y>=strip[0]&&point.y<=strip[1]);
   assert.equal(point.x,(phase==='waiting'?[18,50,82]:[28,72,50])[g.crossingOrder.indexOf(who)]);
  }
 }
});
test('R41 foot reaches far paving exactly when visible arrival count increments; end-of-walk never counts twice',()=>{
 for(let stage=0;stage<3;stage++)for(const crossed of [0,1,2]){
  const g=new ContentLesson('crossing');g.stage=stage;g.begin();g.crossed=crossed;
  for(const p of [0,.18,.4,.819999,.82,.820001,.9,.999]){
   g.crossTime=p*g.crossingDuration;
   const point=pavementLocation(g.crossingPerson,'crossing',p,stage,g.crossingOrder);
   assert.equal(arrivedCount(g),crossed+(p>=LANDING_PROGRESS?1:0));
   assert.equal(point.y<=PAVEMENTS[stage].far[1]+1e-9,p>=LANDING_PROGRESS);
  }
  g.crossed++;g.crossTime=0;assert.equal(arrivedCount(g),crossed+1);
 }
});
test('R41 left/right wrong pushes explicitly name the opposite support, clear immediately on correct input',()=>{
 for(const lean of ['left','right']){
  const support=lean==='left'?'right':'left',view={warningSide:lean,support};
  assert.equal(wrongSupportText(view,{['recover-'+lean]:true}),`推錯邊了，蛋糕往${lean==='left'?'左':'右'}歪，要往${support==='left'?'左':'右'}扶。`);
  assert.equal(wrongSupportText(view,{['recover-'+support]:true}),'');
  assert.equal(wrongSupportText(view,{}),'');
 }
});
test('R41 observation has exactly four stable states and uses the main car longitudinal position',()=>{
 const g=new ContentLesson('crossing');g.begin();
 for(let stage=0;stage<3;stage++)for(const side of ['left','right'])for(const state of ['unseen','clear','approaching','stopped']){
  g.stage=stage;const original=crossingView(g);
  const view={...original,traffic:{...original.traffic,x:32,lane:'lower',yielding:state==='stopped'},sides:{[side]:{observed:state!=='unseen',car:['approaching','stopped'].includes(state)}}};
  assert.equal(observationState(view,side),state);
  const box=observationProjection(view,stage,160,72);assert.equal(box.x,51.2);
  assert.ok(box.top>=box.laneTop&&box.top+box.height<=box.laneBottom);
 }
});
test('R41 the final visible hint and existing voice source change immediately on wrong/correct pushes',()=>{
 const g=new ContentLesson('cake');g.begin();g.balanceLean=-24;g.traySlide=-24;
 g.input['recover-left']=true;assert.match(cakeView(g).text,/推錯邊了.*往右扶/);
 g.input['recover-left']=false;g.input['recover-right']=true;
 assert.doesNotMatch(cakeView(g).text,/推錯邊|亮起的手/);
});
