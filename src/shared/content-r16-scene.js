import {drivingCue as previousDriving,crossingCue as previousCrossing,boardingCue as previousBoarding,crossingLocation as previousLocation,stability as previousStability} from './content-r15-scene.js';
import {PASSENGER_NAMES} from './content-r16.js';
export {pedalState,ticketSceneGeometry,ticketDoorState,bendTravel,STOP_X,FRONT_RAIL,WHEEL_BOTTOM,DOOR_SILL} from './content-r15-scene.js';
export function queuePosition(door,index,progress,thresholdBottom,width=360){
 const t=Math.max(0,Math.min(1,progress/.58)),side=door>50?-1:1;
 const step=Math.min(64,(width-70)/2),near=Math.max(side>0?35:35+2*step,Math.min(side>0?width-35-2*step:width-35,door*width/100+side*50));
 const start=(near+side*index*step)/width*100;
 return {x:start+(door-start)*t,bottom:thresholdBottom+4*(1-t)};
}

export function drivingCue(g){
 const held=g.input.go||g.input.left||g.input.right,lean=Math.abs(g.balanceLean||0),side=g.bend>0?'right':'left',name=side==='right'?'右轉':'左轉';
 if(g.phase==='delivering')return {action:'',status:'送到了',text:'蛋糕送到了，一起分享。'};
 if(g.wrongTurnNotice>0)return {action:'',status:'方向相反',release:true,text:'方向相反了，放開再看路。'};
 if(g.hazardStop)return {action:'',status:g.speed>.05?'慢慢停下':'停下回穩',release:true,text:'蛋糕滑到盤邊了，放開等回穩。'};
 if(!held&&lean>=3)return {action:'',status:'回穩中',release:true,text:'已放開，等蛋糕坐穩。'};
 if(g.inBend){
  if(lean>=18)return {action:'',status:'快到盤邊',release:true,text:'快滑到盤邊了，放開一下。'};
  return {action:side,status:held?'轉彎中・很穩':lean<3?'坐穩了':'過彎中',text:!held?`坐穩了，再按${name}繼續。`:`${side==='left'?'左':'右'}彎到了，按住${name}。`};
 }
 const cue=previousDriving(g);return {...cue,status:cue.action==='brake'?'慢慢停穩':cue.release?'回穩中':held?'慢慢前進':'坐穩了'};
}
export function stability(g){
 const meter=previousStability(g),cue=drivingCue(g);
 return {...meter,tone:g.wrongTurnNotice>0||g.hazardStop||Math.abs(g.balanceLean||0)>=18?'orange':'green',status:cue.status};
}
export function crossingCue(g){
 const cue=previousCrossing(g);return {...cue,text:g.choiceHint||cue.text};
}
export function crossingLocation(who,phase,progress=0,stage=0){
 const p=previousLocation(who,phase,progress);
 return {x:stage===1?100-p.x:stage===2?100-p.x:p.x,bottom:p.bottom+[0,6,12][stage]};
}
export function crossingTraffic(g){
 const t=Math.min(1,g.trafficTime/[2.8,3.8,3.2][g.stage]),reverse=g.stage!==0;
 return {x:reverse?78-56*t:22+56*t,top:[43,37,31][g.stage],reverse};
}
export function boardingCue(g){
 if(g.doorStage==='awaiting'){
  const chosen=g.chosenPassenger===g.boardingIndex,name=PASSENGER_NAMES[g.boardingIndex];
  return {action:chosen?'board':'',label:chosen?`請${name}上車`:'先點一位朋友',text:g.choiceHint||(chosen?`選好了，請${name}上車。`:'點月台上的朋友，再邀請上車。')};
 }
 return previousBoarding(g);
}
export function ticketMismatch(g){
 const p=g.platforms[g.selected];if(!p||g.matched)return '';
 return p.shape===g.target.shape?'形狀對了，顏色再看看。':p.color===g.target.color?'顏色對了，形狀再看看。':'再看看形狀和顏色。';
}
export function lessonResult(g){
 if(g.kind==='cake')return {title:'三站完成・蛋糕送到了',learned:'慢慢轉、放開回穩，蛋糕平平送到。'};
 if(g.kind==='crossing')return {title:'三站完成・謝謝你等我們',learned:'三站都看左右，等大家安全過街。'};
 return {title:'三站完成・大家坐好了',learned:'三站都對好車票，讓三位坐好再出發。'};
}
