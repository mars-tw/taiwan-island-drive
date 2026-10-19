import {drivingCue as previousDriving,stability as previousStability,crossingCue as previousCrossing,lessonResult as previousResult} from './content-r17-scene.js';
import {FRIEND_NAMES} from './content-r18.js';
export {pedalState,boardingCue,crossingLocation,queuePosition,ticketSceneGeometry,ticketMismatch,ticketDoorState,bendTravel,STOP_X,FRONT_RAIL,WHEEL_BOTTOM,DOOR_SILL} from './content-r17-scene.js';

export function drivingCue(g){
 if(g.hazardStop)return {action:'',release:true,status:g.speed>.05?'慢慢停下':'等待回穩',text:'放開，等蛋糕回中央。'};
 if(g.inBend&&(g.wrongHeld||g.wrongTurnNotice>0))return {action:'',release:true,status:'方向相反',text:'方向相反，放開看路。'};
 const c=previousDriving(g);
 if(!g.inBend&&g.wrongTurnNotice>0)return {action:'',release:true,status:'直路',text:'現在是直路，放開就好。'};
 return c;
}
export function stability(g){const m=previousStability(g);return {...m,tone:g.inBend&&g.wrongHeld?'orange':m.tone,status:drivingCue(g).status};}
export function crossingTraffic(g){
 const t=Math.min(1,g.trafficTime/[2.8,3.8,3.2][g.stage]),reverse=(g.stage!==0)!==!!((g.layoutSeed||0)%2);
 return {x:reverse?83-66*t:17+66*t,top:reverse?27:32,reverse};
}
export function observation(g){
 if(g.focus==='center'||g.crossTime>0||g.crossed===3||g.phase!=='playing')return null;
 const car=crossingTraffic(g),target=g.trafficActive&&((g.focus==='left')===(car.x<50));
 return {x:target?car.x:g.focus==='left'?18:82,y:car.top+4,target:target?'來車':'空車道入口'};
}
export function trafficLabelPosition(g,width,labelWidth=44){
 const x=crossingTraffic(g).x*width/100,ring=observation(g),offset=width*.13+6;
 const candidates=[x+offset,x-offset-labelWidth,...(ring?[(ring.x+13)*width/100+4,(ring.x-13)*width/100-labelWidth-4]:[])];
 const clear=left=>left>=2&&left+labelWidth<=width-2&&(!ring||left+labelWidth<=width*(ring.x-13)/100-2||left>=width*(ring.x+13)/100+2);
 return candidates.find(clear)??Math.max(2,Math.min(width-labelWidth-2,candidates[0]));
}
export function landedFriends(g){return Math.min(3,g.crossed+(g.crossTime>0&&g.crossTime/g.crossingDuration>=.82?1:0));}
export function completedCrossings(g){return g.completed?3:Math.min(3,g.stage+(landedFriends(g)===3?1:0));}
export function crossingCue(g){
 if(g.choiceHint)return {...previousCrossing(g),text:g.choiceHint};
 if(g.crossTime>0&&g.crossTime/g.crossingDuration>=.82)return {action:'',state:'已到岸',text:`${FRIEND_NAMES[g.crossingPerson]}到了，走到空位。`};
 if(g.phase==='playing'&&g.crossTime===0&&g.focus!=='center'&&g.crossed<3){
  const cue=previousCrossing(g),o=observation(g),side=g.focus==='left'?'左':'右';
  return {...cue,text:o.target==='來車'?`${side}邊有車，先等一等。`:`${side}邊沒車。${!g.looked.right?'再看右邊。':g.trafficActive?'另一邊有車，繼續等。':'等朋友過街。'}`};
 }
 return previousCrossing(g);
}
export function lessonResult(g){return g.kind==='tickets'?{title:'三站完成・大家坐好了',learned:'三站對好票、坐好、關門，出發了。'}:previousResult(g);}
