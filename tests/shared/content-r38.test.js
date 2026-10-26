import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ContentLesson} from '../../src/shared/content-r35.js';
import {crossingView,crossingPlayerBox,CROSSING_ROADS} from '../../src/shared/content-r35-scene.js';

test('R38 protects exact R35 cake, ticket and crossing presentation modules',()=>{
 // R35 db8bbe9 hashes are fixed evidence; CI need not fetch Git history.
 for(const [file,hash] of Object.entries({
  'src/shared/content-r35.js':'a0ae6b128fee45bccb2eae6b8cfa4bdf6bc770bdaee0d0f8d7e491f932e78bb9',
  'src/shared/content-r35-scene.js':'62fc2dcb5612107234e9f110fd9ec3e42f18fa9e92aa16fff06b8155692d598c',
  'src/shared/content-r35-ui.js':'d9b08de29c0fba32af5aa12173327fbbfb40de0361a1717ef145fd43aca4e806'})){
  assert.equal(createHash('sha256').update(readFileSync(file,'utf8').replace(/\r\n/g,'\n')).digest('hex'),hash);
 }
 const ui=readFileSync('src/shared/content-r1-ui.js','utf8');
 assert.doesNotMatch(ui,/import .*content-r37|renderR37\(/);
 assert.match(ui,/cakeView,crossingView,boardingScene,roadPicture\} from '\.\/content-r35-scene.js'/);
});

test('R38 unobserved cards never conclude traffic state, including moving and paused input',()=>{
 for(let stage=0;stage<3;stage++)for(let layoutSeed=0;layoutSeed<6;layoutSeed++){
  const g=new ContentLesson('crossing',{stage,layoutSeed},{observeTraffic:true});g.begin();
  const unknown=()=>{for(const v of Object.values(crossingView(g).sides)){
   assert.equal(v.observed,false);assert.equal(v.car,false);assert.equal(v.confirmed,false);
   assert.equal(v.road,'還沒看');assert.doesNotMatch(v.road+v.check,/淨空|有車|來車|通過|離開|✓/);
  }};
  g.speed=1;g.look('left');unknown();g.speed=0;g.paused=true;g.look('right');unknown();
  g.paused=false;g.look(g.trafficSource);const seen=crossingView(g).sides[g.trafficSource];
  assert.equal(seen.observed,true);assert.equal(seen.car,true);assert.equal(seen.confirmed,false);
 }
});

test('R38 R35 joined car matches traffic dimensions, faces right and stays in its right-hand lane',()=>{
 for(let stage=0;stage<3;stage++)for(const [w,h] of [[284,230],[354,490],[736,750],[800,170]]){
  const g=new ContentLesson('crossing',{stage});g.begin();g.phase='departing';let last;
  for(let i=0;i<=150;i++){
   g.departureTime=i*.01;const v=crossingView(g),b=crossingPlayerBox(v,w,h);
   if(last)assert.ok(Math.hypot(b.centerX-last.centerX,b.centerY-last.centerY)<w*.04,'continuous position');
   last=b;
   if(i>=60){const road=CROSSING_ROADS[stage];assert.equal(v.player.profile,'side');assert.equal(v.player.heading,'right');assert.equal(b.angle,0);
    assert.equal(b.width,Math.min(100,w*.28));assert.ok(Math.abs(b.height-Math.min(40,h*.075))<1e-10);
    assert.ok(b.centerY-b.height/2>=h*road.center/100);assert.ok(b.centerY+b.height/2<=h*road.bottom/100);
   }
  }
 }
});
