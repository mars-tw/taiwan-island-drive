import test from 'node:test';
import assert from 'node:assert/strict';
import {roofSupport,supportCorners} from '../../src/shared/content-r40-ui.js';
import {ContentLesson} from '../../src/shared/content-r35.js';

test('R40 roof pivot is angle-independent and entire cake/tray stays within the painted car width',()=>{
 for(const [w,h] of [[90,70],[160,100],[240,150],[480,300]]){
  const roof=roofSupport(w,h);
  for(let angle=-28;angle<=28;angle+=.25)for(const p of supportCorners(angle)){
   const x=roof.x+p.x*roof.scale;
   assert.ok(x>=w/2-roof.paintedWidth*.38&&x<=w/2+roof.paintedWidth*.38,`${angle}: supported within car silhouette`);
  }
  assert.equal(roof.x,w/2);assert.ok(roof.y>=0&&roof.y<h);
 }
});

test('R40 presentation preserves all lesson save/restore contracts',()=>{
 for(const kind of ['cake','crossing','tickets']){
  const g=new ContentLesson(kind);g.begin();
  const saved=g.snapshot(),restored=new ContentLesson(kind,saved);restored.begin();
  assert.deepEqual(restored.snapshot(),saved);
 }
});
