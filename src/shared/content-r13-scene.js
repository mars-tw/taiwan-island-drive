import {drivingCue as legacyCue} from './content-r12-scene.js';
import {crossingCue as legacyCrossing} from './content-r11-scene.js';

export const STOP_X=[34,62,90];
export const TRAIN_WIDTH=44;
// Registered from the generated 1024x1536 scene and the alpha train artwork.
export const FRONT_RAIL=1186/1536;
export const WHEEL_BOTTOM=.94;
export const DOOR_SILL=.77;
export function ticketSceneGeometry(g,width=360){
 const markers=width<300?[20,50,80]:STOP_X;
 const x=markers[0]-TRAIN_WIDTH*.78+(g.trainX-2)/16*(markers[1]-markers[0]);
 return {x,door:x+TRAIN_WIDTH*.78,markers};
}
export function queuePosition(door,index,progress,thresholdBottom){
 const t=Math.min(1,progress/.58),side=door>65?-1:1;
 const x=door+side*(5+index*6);
 // Walk on the paved platform first, then across the short sill bridge.
 return {x:x+(door-x)*t,bottom:thresholdBottom+5+index*6-(5+index*6)*t};
}
export function pedalState(g,cue){return {state:g.input.go?'held':cue.action==='go'?'ready':'released',text:'踏板'};}
export function drivingCue(g){
 if(!g.releaseRecovery)return legacyCue(g);
 if(g.distance>=55||g.stage===2&&g.distance>=42&&!g.bayStopped)return {action:'brake',text:'按住煞車，慢慢停穩。'};
 if(Math.abs(g.balanceLean||0)>=5){return {action:'',release:true,text:g.input.go?'放開踏板，蛋糕會慢慢回穩。':'等蛋糕回穩，再踩踏板。'};}
 if(g.bayStopped&&!g.bayRestarted)return {action:'go',text:'停穩了，按住踏板再起步。'};
 if(g.distance>15&&g.distance<=40&&g.speed>0)return {action:g.bend>0?'right':'left',text:g.bend>0?'按住右轉，沿車道慢慢走。':'按住左轉，沿車道慢慢走。'};
 return {action:'go',text:'按住踏板，慢慢前進。'};
}
export function crossingCue(g){
 if(g.trafficActive&&g.looked.left&&g.looked.right)return {action:'',text:'來車通過中，先等一等'};
 return legacyCrossing(g);
}
export function crossingLocation(who,phase,progress=0){
 const start=who==='bike'?89:11,end=who==='bike'?11:89;
 const waiting={child:28,bike:49,grandma:47}[who];
 const arrived={child:28,bike:45,grandma:47}[who];
 if(phase==='waiting')return {x:start,bottom:waiting};
 if(phase==='arrived')return {x:end,bottom:arrived};
 const t=Math.max(0,Math.min(1,progress));
 if(t===1)return {x:end,bottom:arrived};
 if(t<.18)return {x:start,bottom:waiting+(35.5-waiting)*t/.18};
 if(t<=.82)return {x:start+(end-start)*(t-.18)/.64,bottom:35.5};
 return {x:end,bottom:35.5+(arrived-35.5)*(t-.82)/.18};
}
