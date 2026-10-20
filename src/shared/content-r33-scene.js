import {cakeView as oldCake,crossingView as oldCrossing,boardingScene as oldBoarding,boardingCue as oldCue,holdFeedback as oldHold,roadPicture as oldPicture,CROSSING_ROADS} from './content-r32-scene.js';
import {queueFrame} from './content-r10-scene.js';
import {PASSENGER_NAMES} from './content-r33.js';
export * from './content-r32-scene.js';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export function roadPicture(g,preview=false){
 if(g.stage===2)return {path:'art/content-r33/bay-panorama.webp',mirror:!!(g.layoutSeed%2)};
 return oldPicture(g,preview);
}
export function cakeView(g){
 const v=oldCake(g),exit=g.stage===2&&g.bayRestarted?clamp((g.distance-47)/7.5):0;
 const pose={...v.pose,x:g.stage===2?(.045+.13*exit)*(g.layoutSeed%2?-1:1):.17+v.pose.x*.2,y:g.stage===2?-.16-.02*exit:v.pose.y,scale:g.stage===2?.64+.12*exit:.76};
 const speed=g.speed<.05?'已停住':g.speed<2?'慢速':g.speed<4?'中速':'高速';
 const fill=Math.min(v.fill,Math.round(100-Math.abs(v.shift)/32*96)),tone=fill<30?'red':fill<80?'yellow':'green';
 return Object.freeze({...v,fill,tone,pose:Object.freeze(pose),ground:pose,roofShift:v.shift*1.8,roadArt:roadPicture(g),bayExit:exit,bayPan:(1-exit)*100,
  text:exit>0&&exit<1?'沿出口慢慢離灣。':exit===1?'回到主路了，慢慢前進。':v.text,
  speedText:`車速：${speed}・傾角 ${Math.abs(v.angle)}°`,status:'',mirrored:roadPicture(g).mirror});
}
export function crossingView(g){
 const v=oldCrossing(g),t=v.traffic;
 const stopX=t.source==='left'?32:68;
 const afterYield=clamp((g.newTrafficTime-.3)/2.9);
 const traffic=Object.freeze({...t,x:g.newTraffic?(t.source==='left'?15+70*afterYield:85-70*afterYield):t.x,top:CROSSING_ROADS[g.stage].center-10});
 const sides=Object.freeze(Object.fromEntries(Object.entries(v.sides).map(([s,c])=>[s,Object.freeze({...c,check:c.car?(t.yielding?'等朋友過街':'等車通過'):c.check})])));
 const text=g.safetyNotice>0&&g.choiceHint?g.choiceHint:v.text;
 return Object.freeze({...v,text,note:text,sides,traffic,stop:Object.freeze({x:stopX,top:traffic.top-1,height:7,visible:t.active&&t.yielding})});
}
export function boardingScene(g){return Object.freeze(oldBoarding(g).map(f=>Object.freeze({...f,x:f.seated?[14,40,65][f.index]:f.x,bottom:f.seated?27:f.bottom,pose:f.seated?'seated':f.current&&g.escortWaiting?'standing':f.pose,bump:f.current&&g.escortBump>0})));}
export function boardingCue(g){
 if(g.doorStage!=='boarding')return oldCue(g);
 const name=PASSENGER_NAMES[g.boardingIndex],place=g.escortStop===0?'門檻':'走道';
 return {action:'escort',hold:true,label:g.escortWaiting?(g.escortStable>=.65?'站穩了，再按住走':g.escortBump>0?'太早了，先放開':'放開，等站穩'):'按住陪朋友走',text:g.escortWaiting?(g.escortStable>=.65?`${name}站穩了，繼續陪同。`:g.escortBump>0?`${name}晃了一下，停在${place}。`:`到${place}了，放開等${name}站穩。`):`陪${name}走到座位。`};
}
export function holdFeedback(g){if(g.kind!=='tickets'||g.doorStage!=='boarding')return oldHold(g);return {progress:queueFrame(g.boardTime,g.boardingIndex).progress,state:g.input.escort&&!g.escortWaiting?'holding':'paused',reason:boardingCue(g).text};}
