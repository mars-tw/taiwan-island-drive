import {drivingCue as oldDriving,crossingCue as oldCrossing,boardingCue as oldBoarding,carGround as oldGround,crossingLocation as oldLocation,crossingTraffic as oldTraffic,holdFeedback as oldHold,lessonResult as oldResult} from './content-r27-scene.js';
import {queueFrame} from './content-r10-scene.js';
export * from './content-r27-scene.js';
export function cakeAngle(g){return Math.max(-28,Math.min(28,(g.balanceLean||0)*.875));}
export function cakeShift(){return 0;}
export function drivingCue(g){
 if(g.phase==='delivering')return {action:'',text:'蛋糕送到了，一起分享。'};
 if(g.bayStopped&&!g.bayRestarted)return {action:g.restReady?'go':'',text:g.restReady?'坐穩100%，可以出發。':'停妥了，讓蛋糕休息。'};
 if(g.stage===2&&g.distance>=42&&!g.bayStopped)return {action:'brake',text:'慢慢進灣，煞車停進格子。'};
 if(g.distance>=55)return {action:'brake',text:'到家了，煞車再扶穩。'};
 if(g.recoveryIntro>0)return {action:g.balanceLean>0?'recover-left':'recover-right',text:'蛋糕歪了，減速一起扶。'};
 if(g.recoveryActive)return {action:g.balanceLean>0?'recover-left':'recover-right',text:g.recoveryWrong?'越扶越歪，看看蛋糕。':g.input.brake?'減速了，扶正更快。':'先減速，再慢慢扶。'};
 if(g.wrongTurnNotice>0)return {action:g.bend>0?'right':'left',text:g.hintLevel===1?'看看路彎向哪邊。':`路往${g.bend>0?'右':'左'}彎。`};
 return {...oldDriving(g),text:g.inBend?'看路牌，慢慢轉彎。':'輕踩踏板，照顧蛋糕。'};
}
export function crossingCue(g){if(g.stopNotice>0)return {action:'',text:g.choiceHint};if(g.choiceHint)return {action:'look-'+g.lookSequence[g.lookStep],text:g.choiceHint};if(g.stage===2&&g.lookStep===2&&!g.friendConfirmed)return {action:g.trafficActive?'':'look-'+g.trafficSource,text:g.trafficActive?'車還在路上，等一等。':`車過了，再看${g.trafficSource==='left'?'左':'右'}邊。`};return oldCrossing(g);}
export function crossingTraffic(g){const p=oldTraffic(g),t=Math.min(1,g.trafficTime/[2.8,3.8,3.2][g.stage]),reverse=g.trafficSource==='right';return {...p,x:reverse?114-128*t:-14+128*t,source:g.trafficSource,heading:reverse?'left':'right',reverse,top:({0:52,1:51,2:59}[g.stage])+1};}
export function crossingLocation(who,phase,progress=0,stage=0,order){
 const i=(order||['child','bike','grandma']).indexOf(who),x=[13,37,83][i],road=[{top:40,bottom:66},{top:42,bottom:62},{top:49,bottom:69}][stage],start=road.bottom+(stage===1?7:4),end=road.top-2;
 if(phase==='waiting')return {x,bottom:100-start};if(phase==='arrived')return {x:[16,39,82][i],bottom:100-end};
 const p=Math.max(0,Math.min(1,progress));if(p<.18)return {x:x+(50-x)*p/.18,bottom:100-start};if(p<=.82)return {x:50,bottom:100-(start+(end-start)*(p-.18)/.64)};return {x:50+([16,39,82][i]-50)*(p-.82)/.18,bottom:100-end};
}
export function carGround(g){if(g.stage!==2)return oldGround(g);const t=g.bayRestarted?Math.min(1,(g.distance-47)/8):0,enter=g.bayStopped?1:Math.max(0,Math.min(1,(g.distance-40)/7));return {x:.22*enter-.30*t,y:-.07-.15*enter-.15*t,scale:.68-.14*enter};}
export function boardingCue(g){if(g.doorStage==='awaiting'&&g.chosenPassenger<0)return {action:'',label:'點一位朋友',text:'點朋友，邀他上車。'};if(g.doorStage==='boarding'){const p=queueFrame(g.boardTime,g.boardingIndex).progress;return {action:'escort',hold:true,label:g.escortGate&&!g.escortGateReleased?'放開看看門檻':!g.input.escort&&g.escortStarted?'再按住陪他':'陪著上車',text:g.escortGate&&!g.escortGateReleased?'門檻到了，放開看看。':!g.input.escort&&g.escortStarted?'已停住，再按住陪他。':p<.35?'沿月台走，按住陪他。':p<.82?'慢慢跨門檻。':'進走道了，陪他坐下。'};}return oldBoarding(g);}
export function holdFeedback(g){if(g.kind==='cake')return {progress:Math.max(0,1-Math.abs(g.balanceLean||0)/32),state:Object.values(g.input).some(Boolean)?'holding':'paused',reason:''};if(g.kind==='tickets'&&g.doorStage==='boarding')return {progress:queueFrame(g.boardTime,g.boardingIndex).progress,state:g.input.escort&&!g.escortGate?'holding':'paused',reason:boardingCue(g).text};return oldHold(g);}
export function stageBrief(g,stage=g.stage){const seed=g.layoutSeed||0,reverse=seed%2,cake=[`上坡・${reverse?'左':'右'}彎`,`${reverse?'右→左':'左→右'}・慢慢轉`,'進灣・停妥・離灣'];const source=(stage===1)!==!!reverse?'右':'左';return g.kind==='cake'?cake[stage]:g.kind==='crossing'?`${source}來車${stage===2?'・再看一次':''}`:['形狀＋顏色','同形・找顏色','同色・找形狀'][stage];}
export function lessonResult(g){const r=oldResult(g);if(g.kind==='crossing'){const reverse=(g.layoutSeed||0)%2;r.learned=`${reverse?'右':'左'}來車・${reverse?'左':'右'}來車・離場再看。安全停住 ${g.facts.blockedStarts} 次。`;}return r;}
