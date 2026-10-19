import {drivingCue as previousDriving,stability as previousStability,crossingCue as previousCrossing,crossingTraffic,ticketDoorState as previousDoors} from './content-r18-scene.js';
import {FRIEND_NAMES} from './content-r19.js';
export {pedalState,boardingCue,crossingLocation,queuePosition,ticketSceneGeometry,ticketMismatch,bendTravel,lessonResult,STOP_X,FRONT_RAIL,WHEEL_BOTTOM,DOOR_SILL,crossingTraffic} from './content-r18-scene.js';

export function drivingCue(g){
 if(g.hazardStop||g.recoveryLocked)return {action:'',release:true,status:'回穩中',text:'放開，等蛋糕回中央。'};
 const cue=previousDriving(g);
 if((g.stage>0||g.layoutSeed)&&['left','right'].includes(cue.action))return {...cue,text:'看彎道路牌，選一邊轉。'};
 return cue;
}
export function stability(g){return {...previousStability(g),status:drivingCue(g).status};}
export function cakeShift(g){return Math.max(-36,Math.min(36,(g.balanceLean||0)/32*36));}
export function cakeAngle(g){return Math.max(-18,Math.min(18,(g.balanceLean||0)*.65));}
// A fixed view of one cake and one tray, independent of the inset's scale.
export function ticketDoorState(g){
 if(g.phase==='boarding'&&g.doorStage==='retract-ready')return {state:'open',open:1,step:1};
 return previousDoors(g);
}
export function landedFriends(g){return g.crossed;}
export function completedCrossings(g){return g.completed?3:Math.min(3,g.stage+(g.crossed===3?1:0));}
export function observation(g){
 if(g.focus==='center'||g.crossed===3||g.phase!=='playing')return null;
 const car=crossingTraffic(g),target=g.trafficActive&&((g.focus==='left')===(car.x<50));
 return {x:target?car.x:g.focus==='left'?18:82,y:car.top+4,target:target?'來車':'空車道入口'};
}
export function trafficLabelPosition(g,width,labelWidth=44){return Math.max(2,Math.min(width-labelWidth-2,crossingTraffic(g).x*width/100-labelWidth/2));}
export function crossingCue(g){
 if(g.crossTime>0)return {action:'',state:'等朋友到岸',text:g.crossTime/g.crossingDuration>=.82?'沿對岸走到空位，再換下一位。':`${FRIEND_NAMES[g.crossingPerson]}正在過街，等到對岸。`};
 const cue=previousCrossing(g);
 if(g.arrivalNotice>0)return {...cue,text:`${FRIEND_NAMES[g.lastArrived]}到空位了。`};
 return cue;
}
export function departLabel(g){
 if(g.phase==='departing')return '出發';
 if(g.canDepart)return '出發';
 if(g.speed>.05)return '先停下';
 if(!g.looked.left)return '先看左';
 if(!g.looked.right)return '再看右';
 return g.trafficActive?'等車通過':'等朋友到岸';
}
