import {bendTravel as previousTravel,stability as previousStability} from './content-r16-scene.js';
import {CROSSING_ORDERS} from './content-r1.js';
export {pedalState,drivingCue,crossingCue,ticketMismatch,ticketDoorState,boardingCue,lessonResult,STOP_X,FRONT_RAIL,WHEEL_BOTTOM,DOOR_SILL} from './content-r16-scene.js';
export function bendTravel(g){const x=previousTravel(g);return x===null?null:x*((g.layoutSeed||0)%2?-1:1);}
export function stability(g){const m=previousStability(g);return g.hazardStop?{...m,fill:Math.max(18,m.fill),status:g.speed>.05?'慢慢停下':'等待回穩'}:m;}
export function crossingTraffic(g){
 const t=Math.min(1,g.trafficTime/[2.8,3.8,3.2][g.stage]),reverse=(g.stage!==0)!==!!((g.layoutSeed||0)%2);
 return {x:reverse?91-82*t:9+82*t,top:reverse?27:32,reverse};
}
export function crossingLocation(who,phase,progress=0,stage=0){
 // The group waits on one curb. Fill the far curb from front to back so
 // nobody walks through a waiting or already-arrived friend.
 const index=CROSSING_ORDERS[stage].indexOf(who),start=stage===1?88:12,end=100-start;
 const bottom=[40,22,4][index],arrived=[4,22,40][index];
 if(phase==='waiting')return {x:start,bottom};
 if(phase==='arrived')return {x:end,bottom:arrived};
 const p=Math.max(0,Math.min(1,progress));
 if(p<.18)return {x:start,bottom:bottom+(40-bottom)*p/.18};
 if(p<=.82)return {x:start+(end-start)*(p-.18)/.64,bottom:40};
 return {x:end,bottom:40+(arrived-40)*(p-.82)/.18};
}
export function observation(g){
 if(g.focus==='center'||g.crossTime>0||g.crossed===3||g.phase!=='playing')return null;
 const traffic=crossingTraffic(g),side=g.focus==='left'?18:82;
 const target=g.trafficActive&&((g.focus==='left')===(traffic.x<50));
 return {x:target?Math.max(16,Math.min(84,traffic.x)):side,y:traffic.top+4,target:target?'來車':'空車道入口'};
}
export function ticketSceneGeometry(g,width=360){
 const markers=width<300?[20,50,80]:[20,50,80];
 const t=Math.max(0,Math.min(1,g.distance/28)),x=g.completed||['boarding','departing','checkpoint','done'].includes(g.phase)?5:-15+20*t;
 return {x,door:x+90*.78,markers};
}
export function queuePosition(door,index,progress,thresholdBottom,width=360,height=550,trainHeight=134){
 const t=Math.max(0,Math.min(1,progress/.58)),start=[18,50,82][index];
 // Wait above the train, then walk down the platform towards the same door.
 const waitingBottom=thresholdBottom+trainHeight*.77/height*100+6;
 return {x:start+(door-start)*t,bottom:waitingBottom+(thresholdBottom-waitingBottom)*t};
}
