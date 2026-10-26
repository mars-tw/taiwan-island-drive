import {drivingCue as previousDriving,boardingCue as previousBoarding,stageBrief as previousBrief,queuePosition as previousQueue,ticketSceneGeometry,holdFeedback as previousHold} from './content-r28-scene.js';
import {queueFrame} from './content-r10-scene.js';
import {FRIEND_NAMES} from './content-r29.js';
export * from './content-r28-scene.js';
export const STOP_RULES={cake:['慢慢上坡','兩個彎','停穩再起步'],crossing:['看清兩邊','看清兩邊','離場再看'],tickets:['形狀、顏色都一樣','形狀、顏色都一樣','形狀、顏色都一樣']};
export function stageBrief(g,stage=g.stage){return g.kind==='tickets'?['比形狀和顏色','再比形狀和顏色','兩樣都要相同'][stage]:previousBrief(g,stage);}
export function drivingCue(g){
 if(g.bayRestarted&&g.distance<55)return {action:'go',text:g.distance<51?'按住踏板，慢慢離開格子。':'回到主路，慢慢向前。'};
 if(g.bayStopped&&g.restReady&&!g.bayRestarted)return {action:'go',text:'蛋糕坐穩了，按住踏板出灣。'};
 if(g.recoveryActive&&g.speed<2&&!g.recoveryWrong&&!g.input.brake)return {action:g.balanceLean>0?'recover-left':'recover-right',text:'慢慢向中間扶，蛋糕會坐穩。'};
 return previousDriving(g);
}
export function departReasons(g){
 if(g.canDepart)return ['路面淨空，可以出發'];
 const reasons=[];
 if(g.speed>.05)reasons.push('先停穩');
 if(g.trafficActive)reasons.push('還有一台車');
 if(g.crossTime>0)reasons.push('等'+FRIEND_NAMES[g.crossingPerson]+'到對岸');
 else if(g.crossed<3)reasons.push('還有'+(3-g.crossed)+'位朋友');
 for(const side of ['left','right'])if(!g.looked[side])reasons.push('再看'+(side==='left'?'左':'右')+'邊');
 if(!g.trafficConfirmed&&!g.trafficActive)reasons.push('先確認來車');
 return reasons;
}
export function crossingLocation(who,phase,progress=0,stage=0,order=['child','bike','grandma']){
 const i=order.indexOf(who),startX=[50,14,86][i],endX=[14,86,50][i],road=[{top:40,bottom:66},{top:42,bottom:62},{top:49,bottom:69}][stage],start=road.bottom+(stage===1?7:4),end=road.top-2,p=Math.max(0,Math.min(1,progress));
 if(phase==='waiting')return {x:startX,bottom:100-start};
 if(phase==='arrived')return {x:endX,bottom:100-end};
 if(p<.18)return {x:startX+(50-startX)*p/.18,bottom:100-start};
 if(p<=.82)return {x:50,bottom:100-(start+(end-start)*(p-.18)/.64)};
 return {x:50+(endX-50)*(p-.82)/.18,bottom:100-end};
}
export function boardingCue(g){
 if(g.doorStage!=='boarding')return previousBoarding(g);
 const original=previousBoarding(g);
 if(g.escortGate&&!g.escortGateReleased)return {...original,text:'到門邊先放開，等他站穩。'};
 if(g.escortGateReleased&&g.standStillTime<.45)return {...original,text:'放開等一等，讓朋友站穩。'};
 if(queueFrame(g.boardTime,g.boardingIndex).progress>=.35&&!g.escortGateReleased)return {...original,text:'到門邊先放開，等他站穩。'};
 if(!g.holdGuideSeen)return {...original,text:'手指按住，陪朋友走；到門邊放開。'};
 return original;
}
export function holdFeedback(g){
 if(g.kind==='tickets'&&g.doorStage==='boarding')return {progress:queueFrame(g.boardTime,g.boardingIndex).progress,state:g.input.escort&&!g.escortGate&&(!g.escortGateReleased||g.standStillTime>=.45)?'holding':'paused',reason:boardingCue(g).text};
 return previousHold(g);
}
// Final aisle position and seated window share the exact same world coordinate.
export function queuePosition(door,index,progress,thresholdBottom,width=360,height=550,trainHeight=134,stage=0){
 const pos=previousQueue(door,index,progress,thresholdBottom,width,height,trainHeight,stage);
 if(progress>.82){const reverse=door<35,geometry=ticketSceneGeometry({selected:reverse?0:2,stage,distance:28,speed:0},width),t=Math.min(1,(progress-.82)/.18),seat=reverse?100-(13+index*21)-16+8:13+index*21+8;
  pos.x=door+geometry.width*(seat-(reverse?22:78))/100*t;
  pos.surface=progress<1?'aisle':'seat';
 }
 return pos;
}
