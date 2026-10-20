import {drivingCue as previousDriving,crossingCue as previousCrossing,holdFeedback as previousHold,boardingCue as previousBoarding,DOOR_SILL} from './content-r25-scene.js';
import {FRIEND_NAMES,PASSENGER_NAMES} from './content-r24.js';
import {queueFrame} from './content-r10-scene.js';
export * from './content-r25-scene.js';

export function stability(g){
 const lean=Math.abs(g.balanceLean||0),fill=lean===0?100:Math.min(99,100-Math.round(Math.min(32,lean)/32*100));
 const direction=(g.input?.['recover-right']?1:0)-(g.input?.['recover-left']?1:0);
 const status=lean===0?'坐穩了':g.recoveryActive?(direction*(g.balanceLean||0)>0?'越來越歪':direction?'回穩中':'等你扶正'):fill>=95?'快扶正了':'傾斜中';
 return {status,fill};
}
export function drivingCue(g){
 const cue=previousDriving(g);
 if(g.recoveryActive){const side=g.balanceLean>0?'左':'右',status=stability(g).status;return {...cue,status,text:status==='越來越歪'?`越扶越歪，改按${side}邊。`:status==='等你扶正'?`等你扶正，按住${side}邊。`:`向${side}扶，慢慢回中央。`};}
 if(g.bayStopped&&!g.bayRestarted)return {action:g.bayRestTime<.6?'':'go',status:stability(g).status,text:g.bayRestTime<.6?'停穩了，讓蛋糕休息一下。':'休息好了，可以出發了。'};
 if(g.stage===2&&g.distance>=42&&!g.bayStopped)return {action:'brake',status:stability(g).status,text:'休息灣到了，按住煞車停穩。'};
 return {...cue,status:stability(g).status};
}
export function holdFeedback(g){
 if(g.kind==='cake'&&g.recoveryActive)return {...previousHold(g),reason:drivingCue(g).text};
 if(g.kind==='tickets'&&g.phase==='boarding'&&g.doorStage==='boarding')return {...previousHold(g),reason:g.input.escort?'':g.escortStarted?'放開了，朋友等你再按住。':'按住陪上車。'};
 return previousHold(g);
}
export function crossingCue(g){
 if(g.crossTime>0&&g.crossTime/g.crossingDuration>=.82)return {action:'',text:`${FRIEND_NAMES[g.crossingPerson]}到對岸了，等他站好。`};
 if(g.crossTime>0)return {action:'',text:`現在輪到：${FRIEND_NAMES[g.crossingPerson]}。還有人在過街。`};
 return previousCrossing(g);
}
export function boardingCue(g){
 if(g.doorStage==='boarding'&&queueFrame(g.boardTime,g.boardingIndex).seated)return {action:'escort',hold:true,label:'陪他坐穩',text:`${PASSENGER_NAMES[g.boardingIndex]}坐好了，繼續按住陪他坐穩。`};
 return previousBoarding(g);
}

// One continuous path from the waiting line, via the visible step and door,
// into the same window. No second miniature replaces the moving whole body.
export function queuePosition(door,index,progress,thresholdBottom,width=360,height=550,trainHeight=134,stage=0){
 const p=Math.max(0,Math.min(1,progress)),beside=door+(door<35?15:-15),start=[[80,20,50],[20,50,80],[50,20,80]][stage][index];
 const baseline=Math.max(4,20/height*100),lane=baseline+Math.min(6,Math.max(0,thresholdBottom-baseline-1));
 let x=start,bottom=baseline;
 if(p<.16)bottom=baseline+(lane-baseline)*p/.16;
 else if(p<.35){x=start+(beside-start)*(p-.16)/.19;bottom=lane;}
 else if(p<.72){x=beside+(door-beside)*(p-.35)/.37;bottom=lane+(thresholdBottom-lane)*(p-.35)/.37;}
 else {x=door;bottom=thresholdBottom;}
 if(p>.82){
  const t=(p-.82)/.18,reverse=door<35,window=13+index*21;
  const seat=reverse?100-window-16+8.5:window+8.5;
  x=door+64*(seat/100-(reverse?.22:.78))*t;
  bottom=thresholdBottom+(DOOR_SILL-.60)*trainHeight/height*100*t;
 }
 return {x,bottom,surface:p<.35?'platform':p<.72?'step':'sill'};
}
export const STOP_RULES={cake:['慢慢上坡','兩個彎','停穩再起步'],crossing:['左邊先來車','右邊先來車','左邊再確認'],tickets:['比對形色','同形不同色','同色不同形']};
