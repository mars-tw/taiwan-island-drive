import {drivingCue as previousDriving,crossingCue as previousCrossing,crossingTraffic as previousTraffic} from './content-r21-scene.js';
import {crossingLocation as previousLocation} from './content-r17-scene.js';
import {FRIEND_NAMES} from './content-r22.js';
export {pedalState,ticketMismatch,ticketDoorState,boardingCue,lessonResult,bendTravel,observation,trafficLabelPosition,completedCrossings,departLabel,STOP_X,FRONT_RAIL,WHEEL_BOTTOM,DOOR_SILL} from './content-r21-scene.js';
export const TICKET_STATIONS=['海風站','榕樹站','燈塔站'];
export function cakeAngle(g){return Math.max(-52,Math.min(52,(g.balanceLean||0)*1.9));}
export function cakeShift(g){return Math.max(-10,Math.min(10,(g.balanceLean||0)/32*10));}
export function stability(g){const fill=100-Math.round(Math.min(32,Math.abs(g.balanceLean||0))/32*100);return {status:drivingCue(g).status,fill};}
export function drivingCue(g){
 const c=previousDriving(g);
 if(g.wrongTurnNotice>0&&!g.recoveryActive)return {...c,text:`這裡是${g.bend<0?'左':'右'}彎喔，再選一次。`};
 if(g.bayStopped&&!g.bayRestarted&&!g.recoveryActive)return {...c,text:'休息好了，可以出發了。'};
 return c;
}
export function landedFriends(g){return Math.min(3,g.crossed+(g.crossTime>0&&g.crossTime/g.crossingDuration>=.82?1:0));}
export function crossingLocation(who,phase,progress=0,stage=0){
 const p=previousLocation(who,phase,progress,stage);
 // Every waiting person keeps a stable place. Existing arrivals remain visible
 // while the current walker continues along the far pavement.
 return p;
}
export function crossingCue(g){
 if(g.phase==='playing'&&g.crossTime>0&&g.crossTime/g.crossingDuration>=.82)return {action:'',text:`${FRIEND_NAMES[g.crossingPerson]}到對岸了。`};
 if(g.arrivalNotice>0&&!g.choiceHint)return {action:'',text:`${FRIEND_NAMES[g.lastArrived]}到對岸了。`};
 if(g.stage===2&&g.lookStep===2&&!g.friendConfirmed&&!g.choiceHint)return {action:'look-left',text:'左邊又有車，請再看左邊。'};
 return previousCrossing(g);
}
export function crossingTraffic(g){
 if(g.stage===2&&g.lookStep>=2&&g.recheckTime<1.4)return {x:50,top:32+Math.min(1,g.recheckTime/1.4)*27,reverse:false,approaching:true};
 const t=previousTraffic(g);
 // The car turns into the same branch that contains the zebra crossing.
 const p=Math.min(1,g.trafficTime/[2.8,3.8,3.2][g.stage]);
 return p<.48?{...t,x:g.stage===1?83-33*p/.48:17+33*p/.48,top:32,approaching:false}:{...t,x:50,top:32+(p-.48)/.52*27,approaching:true};
}
export function ticketSceneGeometry(g){
 const markers=[20,50,80],index=g.selected<0?2:g.selected,reverse=index===0,width=index===1?64:90;
 const localDoor=reverse?.22:.78,destination=markers[index]-width*localDoor;
 const t=Math.max(0,Math.min(1,g.distance/28));
 const x=g.completed||['boarding','departing','checkpoint','done'].includes(g.phase)?destination:-width+(destination+width)*t;
 return {x,door:x+width*localDoor,markers,width,reverse};
}
export function queuePosition(door,index,progress,thresholdBottom,width=360,height=550,trainHeight=134,stage=0){
 const p=Math.max(0,Math.min(.58,progress)),start=stage===1?[18,40,62]:stage===2?[38,60,82]:[18,50,82];
 const across=Math.min(1,p/.26),down=Math.max(0,(p-.26)/.32);
 return {x:start[index]+(door-start[index])*across,bottom:p>=.58?thresholdBottom:45.5+(thresholdBottom-45.5)*down};
}
