import {drivingCue as legacyDriving,crossingLocation,queuePosition,stability,pedalState,ticketSceneGeometry,STOP_X,FRONT_RAIL,WHEEL_BOTTOM,DOOR_SILL} from './content-r14-scene.js';
import {ticketDoorState as legacyDoors,lessonResult} from './content-r11-scene.js';
import {FRIEND_NAMES,PASSENGER_NAMES} from './content-r15.js';
export {crossingLocation,queuePosition,stability,pedalState,ticketSceneGeometry,STOP_X,FRONT_RAIL,WHEEL_BOTTOM,DOOR_SILL,lessonResult};
export function bendTravel(g){
 if(g.stage!==1)return null;
 const t=g.distance<=29?(g.distance-15)/14:(g.distance-29)/11;
 return Math.sin(Math.max(0,Math.min(1,t))*Math.PI)*(g.distance<=29?-.16:.16);
}
export function drivingCue(g){
 if(g.phase==='delivering')return {action:'',text:'蛋糕送到了，慢慢靠近朋友。'};
 if(g.wrongTurnNotice>0)return {action:'',release:true,text:'方向相反了，放開再看路。'};
 if(g.hazardStop)return {action:'',release:true,text:'蛋糕滑到盤邊了，放開等回穩。'};
 if(!g.input.go&&!g.input.left&&!g.input.right&&Math.abs(g.balanceLean||0)>=3)return {action:'',release:true,text:'已放開，等蛋糕坐穩。'};
 if(g.inBend)return {action:g.bend>0?'right':'left',text:g.bend>0?'右彎到了，按住右轉。':'左彎到了，按住左轉。'};
 return legacyDriving(g);
}
export function crossingCue(g){
 if(g.phase==='departing')return {action:'',state:'出發中',text:'出發中'};
 if(g.speed>0)return {action:'brake',state:'先停下',text:'按住停下，停在線前。'};
 if(g.crossed===3)return {action:'depart',state:'可以出發',text:'朋友都到岸了，可以出發。'};
 const name=FRIEND_NAMES[g.crossingPerson];
 if(g.crossTime>0)return {action:'',state:'正在過街',text:`${name}正在過街，等到對岸。`};
 if(!g.looked.left)return {action:'look-left',state:'看左',text:`${name}先過，先看左邊。`};
 if(!g.looked.right)return {action:'look-right',state:'看右',text:'左邊看過了，再看右邊。'};
 if(g.trafficActive)return {action:'',state:'正在等來車',text:'來車通過中，先等一等。'};
 return {action:'',state:'準備過街',text:`${name}準備過街，等一等。`};
}
export function ticketDoorState(g){
 if(g.phase==='boarding'&&g.doorStage==='close-ready')return {state:'close-ready',open:1,step:0};
 return legacyDoors(g);
}
export function boardingCue(g){
 const name=PASSENGER_NAMES[g.boardingIndex];
 return {
  opening:{action:'',text:'車門打開中，等一等。',label:'正在開門'},
  awaiting:{action:'board',text:`請${name}上車。`,label:`請${name}上車`},
  boarding:{action:'',text:`${name}正在上車。`,label:'正在上車'},
  'retract-ready':{action:'retract',text:'三位坐好了，按收踏階。',label:'收踏階'},
  retracting:{action:'',text:'正在收踏階，門還開著。',label:'正在收踏階'},
  'close-ready':{action:'close-door',text:'踏階收好了，按關門。',label:'關門'},
  closing:{action:'',text:'正在關門，等一等。',label:'正在關門'},
  closed:{action:'train-depart',text:'門關好了，按前進。',label:'前進'}
 }[g.doorStage]||{action:'',text:'',label:''};
}
