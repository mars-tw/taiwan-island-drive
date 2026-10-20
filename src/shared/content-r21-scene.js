import {boardingCue as previousBoarding,lessonResult as previousResult} from './content-r20-scene.js';
import {FRIEND_NAMES,PASSENGER_NAMES} from './content-r21.js';
export {pedalState,crossingLocation,ticketMismatch,ticketSceneGeometry,queuePosition,ticketDoorState,bendTravel,landedFriends,completedCrossings,cakeShift,cakeAngle,STOP_X,FRONT_RAIL,WHEEL_BOTTOM,DOOR_SILL} from './content-r20-scene.js';
export function crossingTraffic(g){const t=Math.min(1,g.trafficTime/[2.8,3.8,3.2][g.stage]),reverse=g.stage===1;return {x:reverse?83-66*t:17+66*t,top:reverse?27:32,reverse};}
export function observation(g){if(g.focus==='center'||g.crossTime>0||g.crossed===3||g.phase!=='playing')return null;const car=crossingTraffic(g),target=g.trafficActive&&((g.focus==='left')===(car.x<50));return {x:target?car.x:g.focus==='left'?18:82,y:car.top+4,target:target?'來車':'空車道入口'};}
export function trafficLabelPosition(g,width,labelWidth=44){return Math.max(2,Math.min(width-labelWidth-2,crossingTraffic(g).x*width/100-labelWidth/2));}

export function drivingCue(g){
 if(g.phase==='delivering')return {action:'',status:'坐穩了',text:'蛋糕送到了，一起分享。'};
 if(g.recoveryActive)return {action:(g.balanceLean||0)>0?'recover-left':'recover-right',status:'回穩中',text:g.recoveryWrong?'這邊扶不回來，換一邊。':`蛋糕偏${g.balanceLean>0?'右':'左'}，向中央扶。`};
 if(g.wrongTurnNotice>0)return {action:'',status:'傾斜中',text:'方向相反，放開行車鍵再扶正。'};
 if(g.distance>=55||g.stage===2&&g.distance>=42&&!g.bayStopped)return {action:'brake',status:Math.abs(g.balanceLean||0)<3?'坐穩了':'傾斜中',text:g.stage===2&&!g.bayStopped?'休息灣到了。':'終點到了。'};
 if(g.bayStopped&&!g.bayRestarted)return {action:'go',status:'坐穩了',text:'休息好了，路口空了。'};
 return {action:g.inBend?(g.bend>0?'right':'left'):'go',status:Math.abs(g.balanceLean||0)<3?'坐穩了':'傾斜中',text:g.inBend?'前面有彎，看路牌。':g.stage===0?'上坡了，蛋糕會往後偏。':'前方直路，照顧蛋糕。'};
}
export function stability(g){const lean=Math.abs(g.balanceLean||0);return {status:drivingCue(g).status,fill:lean<3?100:100-Math.round(Math.min(32,lean)/32*100)};}
export function crossingCue(g){
 if(g.choiceHint)return {action:'',text:g.choiceHint};
 if(g.phase==='departing')return {action:'',text:'車子出發了，朋友揮揮手。'};
 if(g.speed>.05)return {action:'brake',text:'停止線到了，車子還在動。'};
 if(g.crossed===3)return {action:'depart',text:'大家都到對岸，路口空了。'};
 if(g.crossTime>0)return {action:'',text:`${FRIEND_NAMES[g.crossingPerson]}正在過街，還能看左右。`};
 if(g.friendConfirmed)return {action:'',text:g.trafficActive?'車子通過中，留在線後。':'朋友準備過街。'};
 const side=g.lookSequence[g.lookStep];
 return {action:'look-'+side,text:g.lookStep===0?(g.stage===1?'右邊傳來車聲。':g.stage===2?'看完兩邊，再確認靠近的一邊。':'左邊傳來車聲。'):g.lookStep===2?'左邊還要再確認。':`${g.focus==='left'?'左':'右'}邊看過了，另一邊呢？`};
}
export function departLabel(g){return g.phase==='departing'?'出發中':'出發';}
export function boardingCue(g){
 if(g.doorStage==='boarding')return {action:'escort',hold:true,label:'陪著上車',text:`按住陪${PASSENGER_NAMES[g.boardingIndex]}上車，放開就停。`};
 return previousBoarding(g);
}
export function lessonResult(g){return g.kind==='cake'?{title:'三站完成・蛋糕送到了',learned:'看彎道、扶回中央、臨停再起步。'}:previousResult(g);}
