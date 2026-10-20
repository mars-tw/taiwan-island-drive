import {drivingCue as previousDriving,crossingCue as previousCrossing,boardingCue as previousBoarding} from './content-r23-scene.js';
import {CROSSING_ORDERS} from './content-r1.js';
import {queueFrame} from './content-r10-scene.js';
export * from './content-r23-scene.js';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
// Same signed pose in the inset and on the roof; 20% is 16 degrees.
export function cakeAngle(g){return clamp((g.balanceLean||0)*2.5,-78,78);}
export function stability(g){const lean=Math.abs(g.balanceLean||0);return {status:lean===0?'坐穩了':g.recoveryActive?'回穩中':'傾斜中',fill:lean===0?100:Math.min(99,100-Math.round(Math.min(32,lean)/32*100))};}
export function drivingCue(g){
 const cue=previousDriving(g);
 if(g.recoveryActive)return {...cue,text:g.recoveryWrong?'越扶越歪，換另一邊。':`蛋糕偏${g.balanceLean>0?'右':'左'}，按住${g.balanceLean>0?'左':'右'}邊扶正。`};
 return cue;
}
// Bounds measured on the generated, full-frame paintings: top/bottom/center.
export const CROSSING_ROADS=[{top:40,bottom:66,center:52},{top:42,bottom:62,center:51},{top:49,bottom:69,center:59}];
export function crossingTraffic(g){
 const recheck=g.stage===2&&g.recheckStarted,reverse=!recheck&&g.stage===1,road=CROSSING_ROADS[g.stage];
 const t=clamp((recheck?g.recheckTime:g.trafficTime)/(recheck?3.2:[2.8,3.8,3.2][g.stage]));
 return {x:reverse?114-128*t:-14+128*t,top:reverse?road.top+1:road.center+1,reverse,approaching:false,source:reverse?'right':'left',heading:reverse?'left':'right',recheck};
}
export function observation(g){
 if(g.focus==='center'||g.crossTime>0||g.crossed===3||g.phase!=='playing')return null;
 const car=crossingTraffic(g);return {x:car.x,y:car.top,target:g.trafficActive?'來車':'空車道入口'};
}
export function crossingLocation(who,phase,progress=0,stage=0){
 const i=CROSSING_ORDERS[stage].indexOf(who),road=CROSSING_ROADS[stage],start=road.bottom+9,end=road.top-2,spots=[18,50,82];
 if(phase==='waiting')return {x:spots[i],bottom:100-start};
 if(phase==='arrived')return {x:spots[i],bottom:100-end};
 const p=clamp(progress);
 if(p<.18)return {x:spots[i]+(50-spots[i])*p/.18,bottom:100-start};
 if(p<=.82)return {x:50,bottom:100-(start+(end-start)*(p-.18)/.64)};
 return {x:50+(spots[i]-50)*(p-.82)/.18,bottom:100-end};
}
export function crossingCue(g){
 if(g.phase==='playing'&&g.crossed===3)return {action:'depart',text:'大家都到了，可以出發。'};
 if(g.phase==='playing'&&g.stage===2&&g.lookStep===2&&g.recheckStarted&&!g.friendConfirmed){
  if(g.recheckTime<3.2)return {action:'',text:g.recheckTime<1.4?'左邊又有車，留在線後。':g.recheckTime<2.5?'車子通過中，留在線後。':'車子快離開了，等一等。'};
  return {action:'look-left',text:'車過了，再看一次左邊。'};
 }
 return previousCrossing(g);
}
export function ticketSceneGeometry(g){
 const markers=[20,50,80],index=g.selected<0?2:g.selected,width=64,reverse=index===0,localDoor=reverse?.22:.78,destination=markers[index]-width*localDoor,t=clamp(g.distance/28);
 return {x:g.completed||['boarding','departing','checkpoint','done'].includes(g.phase)?destination:-width+(destination+width)*t,door:g.completed||['boarding','departing','checkpoint','done'].includes(g.phase)?markers[index]:-width+(destination+width)*t+width*localDoor,markers,width,reverse};
}
export function boardingCue(g){
 if(g.doorStage==='boarding'&&queueFrame(g.boardTime,g.boardingIndex).inside)return {action:'escort',hold:true,label:'陪著入座',text:'進門了，繼續按住陪朋友入座。'};
 return previousBoarding(g);
}
export function holdFeedback(g){
 if(g.kind==='cake'){
  const fill=stability(g).fill/100,held=Object.entries(g.input).some(([k,v])=>v&&k!=='escort');
  return {progress:g.recoveryActive?fill:clamp(g.distance/(g.stage===2&&!g.bayStopped?42:55)),state:g.recoveryWrong?'blocked':held?'holding':'paused',reason:g.recoveryWrong?'越扶越歪，換另一邊。':g.recoveryActive&&!held?'放開了，蛋糕停在這裡。':!g.recoveryActive&&Math.abs(g.balanceLean||0)>=3&&held?'先放開行車鍵，才能扶正。':''};
 }
 if(g.kind==='tickets'){
  const progress=queueFrame(g.boardTime,g.boardingIndex).progress;
  if(g.phase==='boarding'&&g.doorStage==='boarding')return {progress,state:g.input.escort?'holding':'paused',reason:g.input.escort?'':'放開了，朋友等你再按住。'};
  if(g.phase==='playing'&&g.selected>=0&&g.distance>=28&&g.speed===0&&!g.matched)return {progress:0,state:'blocked',reason:'車門還沒對準，找一樣的牌子。'};
  if(g.phase==='boarding'&&g.doorStage==='opening')return {progress:0,state:'blocked',reason:'踏階還沒放下，等一等。'};
  return {progress:clamp(g.distance/28),state:'holding',reason:''};
 }
 return {progress:0,state:'',reason:''};
}
