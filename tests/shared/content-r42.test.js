import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ContentLesson} from '../../src/shared/content-r35.js';
import {LANDING_PROGRESS} from '../../src/shared/content-r41-scene.js';
import {crossingArrivalHint,clearFaceLabel,overlaps,TRAIN_WINDOWS,trainWindow} from '../../src/shared/content-r42-scene.js';

test('R42 every crossing order updates its hint on the exact landing frame and keeps the departure safety gate',()=>{
 for(let stage=0;stage<3;stage++)for(let seed=0;seed<6;seed++)for(let crossed=0;crossed<3;crossed++){
  const g=new ContentLesson('crossing');g.stage=stage;g.layoutSeed=seed;g.reset();g.begin();g.crossed=crossed;
  g.crossTime=(LANDING_PROGRESS-.000001)*g.crossingDuration;assert.equal(crossingArrivalHint(g),'');
  g.crossTime=LANDING_PROGRESS*g.crossingDuration;
  assert.match(crossingArrivalHint(g),crossed===2?/大家都到了/:new RegExp('到了，還有 '+(2-crossed)+' 位'));
  assert.equal(g.canDepart,false);assert.equal(g.depart(),false);
 }
});
test('R42 name avoidance clears another head without moving its paving baseline',()=>{
 const label={x:45,y:70,w:30,h:15},face={x:40,y:45,w:40,h:40},bounds={x:0,y:0,w:150,h:150};
 const result=clearFaceLabel(label,[face],bounds);
 assert.equal(result.y,label.y);assert.equal(overlaps(result,face),false);
 assert.deepEqual(clearFaceLabel(label,[],bounds),label);
});
test('R42 color comparison uses a neutral bar, never a second ticket shape',()=>{
 const css=readFileSync(new URL('../../src/shared/content-r42.css',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../../src/shared/content-r42-ui.js',import.meta.url),'utf8');
 assert.match(css,/\.color-dot\{[^}]*width:34px!important;height:10px!important;border-radius:0!important/s);
 assert.match(ui,/dataset\.sample='color-bar'/);
});
test('R42 exterior passengers are clipped inside three measured train windows',()=>{
 assert.equal(TRAIN_WINDOWS.length,3);
 for(let i=0;i<3;i++){
  const w=TRAIN_WINDOWS[i];assert.ok(w.top>=32&&w.top+w.height<=60);
  assert.ok(w.left>=12&&w.left+w.width<=69);
  if(i)assert.ok(TRAIN_WINDOWS[i-1].left+TRAIN_WINDOWS[i-1].width<w.left);
 }
});
test('R42 reversed platform mirrors each passenger into the same painted window',()=>{
 for(let i=0;i<3;i++){
  const forward=trainWindow(i),reverse=trainWindow(i,true);
  assert.equal(forward.left+reverse.left+forward.width,100);
  assert.equal(reverse.top,forward.top);assert.equal(reverse.height,forward.height);
  assert.equal(reverse.width,forward.width);
 }
});
