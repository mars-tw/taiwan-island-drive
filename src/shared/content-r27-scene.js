import {drivingCue as previousDriving,crossingCue as previousCrossing,boardingCue as previousBoarding,queuePosition as previousQueue,ticketSceneGeometry as previousGeometry,lessonResult as previousResult} from './content-r26-scene.js';
import {carGround as previousGround} from './content-r10-scene.js';
import {FRIEND_NAMES} from './content-r27.js';
export * from './content-r26-scene.js';
const names=text=>text.replaceAll('小朋友',FRIEND_NAMES.child).replaceAll('腳踏車',FRIEND_NAMES.bike).replaceAll('奶奶',FRIEND_NAMES.grandma);
export function drivingCue(g){return previousDriving(g);}
export function crossingCue(g){
 if(g.stopNotice>0)return {action:'',text:g.choiceHint||(g.trafficActive?'還有車，先停住。':'朋友還在路上，先停住。')};
 if(g.choiceHint&&g.wrongLook)return {action:'look-'+g.lookSequence[g.lookStep],text:names(g.choiceHint)};
 const cue=previousCrossing(g);return {...cue,text:names(cue.text)};
}
export function boardingCue(g){return previousBoarding(g);}
export function cakeRoadState(g){const shape=g.inBend?(g.bend<0?'left':'right'):g.stage===0?'uphill':'left';return {shape,label:g.stage===2&&g.distance>=40?'休息灣':{left:'左彎',right:'右彎',uphill:'上坡'}[shape]};}
export function carGround(g){
 const pose=previousGround(g);
 if(g.stage===2){const t=Math.max(0,Math.min(1,(g.distance-38)/9));return {...pose,x:.30*t,y:-.04-.20*t,scale:.76-.14*t};}
 return pose;
}
export function crossingLocation(who,phase,progress=0,stage=0,order){
 const orders=order||[['child','bike','grandma'],['grandma','child','bike'],['bike','grandma','child']][stage],i=orders.indexOf(who),spots=[12,27,84],endSpots=[15,43,82],roads=[{top:40,bottom:66},{top:42,bottom:62},{top:49,bottom:69}],road=roads[stage],start=road.bottom+7,end=road.top-3;
 if(phase==='waiting')return {x:spots[i],bottom:100-start};
 if(phase==='arrived')return {x:endSpots[i],bottom:100-end};
 const p=Math.max(0,Math.min(1,progress));
 if(p<.18)return {x:spots[i]+(50-spots[i])*p/.18,bottom:100-start};
 if(p<=.82)return {x:50,bottom:100-(start+(end-start)*(p-.18)/.64)};
 return {x:50+(endSpots[i]-50)*(p-.82)/.18,bottom:100-end};
}
export function ticketSceneGeometry(g){
 const geometry=previousGeometry(g);
 if(g.selected<0)return {...geometry,x:18,door:67.92,reverse:false};
 return geometry;
}
export function queuePosition(door,index,progress,thresholdBottom,width=360,height=550,trainHeight=134,stage=0){
 // One shared waiting area below the numbered signs; an explicit six-part path.
 const pos=previousQueue(door,index,progress,thresholdBottom,width,height,trainHeight,stage);
 const start=(width<330?[18,42,66]:[22,42,62])[index],old=[[80,20,50],[20,50,80],[50,20,80]][stage][index],p=Math.max(0,Math.min(1,progress));
 if(p<.35)pos.x+= (start-old)*(p<.16?1:1-(p-.16)/.19);
 if(p>.82)pos.bottom=thresholdBottom;
 return {...pos,surface:p<.16?'waiting':p<.35?'platform':p<.72?'step':p<.82?'door':p<1?'aisle':'seat'};
}
export function lessonResult(g){const result=previousResult(g);return {...result,learned:g.kind==='cake'?`上坡輕起步・彎道扶正・入灣停穩。扶正 ${g.facts.recoveries} 次。`:g.kind==='crossing'?`左來車・右來車・離場再看。安全停住 ${g.facts.blockedStarts} 次。`:`比形色・同形找顏色・同色找形狀。改選 ${g.facts.reselections} 次。`};}
