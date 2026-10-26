import test from 'node:test';
import assert from 'node:assert/strict';
import {CAKE_SUPPORT as s,cakeControls} from '../../src/shared/content-r39-ui.js';
import {ContentLesson} from '../../src/shared/content-r35.js';
import {cakeView} from '../../src/shared/content-r35-scene.js';

test('R39 contact stays inside the same rotating tray at ±14°, ±27°, maximum ±28°',()=>{
 for(const angle of [-28,-27,-14,0,14,27,28]){
  const a=angle*Math.PI/180,c=Math.cos(a),n=Math.sin(a);
  const rotate=(x,y)=>({x:s.pivotX+(x-s.pivotX)*c-(y-s.pivotY)*n,y:s.pivotY+(x-s.pivotX)*n+(y-s.pivotY)*c});
  const start=rotate(s.trayLeft+s.rimWidth,s.trayTop),end=rotate(s.trayRight-s.rimWidth,s.trayTop);
  const length=Math.hypot(end.x-start.x,end.y-start.y);
  for(const x of [s.baseLeft,s.baseRight]){
   const p=rotate(x,s.baseBottom),along=((p.x-start.x)*c+(p.y-start.y)*n);
   const gap=-(p.x-start.x)*n+(p.y-start.y)*c;
   assert.ok(along>0&&along<length,'the entire base lies between both rims');
   assert.ok(gap>=0&&gap<=1.001,'at most 1px of overlap, never an air gap');
  }
 }
});

test('R39 contextual controls keep all six existing actions reachable with at most four at once',()=>{
 const all=new Set();let mode='drive';
 for(const v of [{angle:0,shift:0},{angle:14,shift:3},{angle:2,shift:1},{angle:0,shift:0},{angle:-27,shift:-32},{angle:-28,shift:-32}]){
  const next=cakeControls(v,mode);mode=next.mode;assert.equal(next.actions.length,4);
  next.actions.forEach(a=>all.add(a));assert.ok(next.actions.includes('brake'));
  if(Math.abs(v.angle)>=8)assert.ok(next.actions.includes('recover-left')&&next.actions.includes('recover-right'));
 }
 assert.deepEqual([...all].sort(),['brake','go','left','recover-left','recover-right','right']);
});

test('R39 uses the existing ±28° maximum and retains tolerant brake rescue physics',()=>{
 for(const sign of [-1,1]){
  const g=new ContentLesson('cake');g.begin();g.balanceLean=sign*32;g.traySlide=sign*32;
  assert.equal(cakeView(g).angle,sign*28);g.input.brake=true;g.input[sign>0?'recover-left':'recover-right']=true;
  for(let i=0;i<600;i++)g.update(1/60);
  assert.equal(g.balanceLean,0);assert.equal(g.traySlide,0);assert.equal(g.phase,'playing');
 }
});
