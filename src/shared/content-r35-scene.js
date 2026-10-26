import {cakeView as oldCake,crossingView as oldCrossing,roadPicture as oldPicture,boardingCue as oldCue,holdFeedback as oldHold,CROSSING_ROADS} from './content-r33-scene.js';
import {queueFrame} from './content-r10-scene.js';
import {PASSENGER_NAMES,STAND_HOLD_SECONDS} from './content-r35.js';
export * from './content-r33-scene.js';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));

export function roadPicture(g,preview=false){
 return g.stage===0?Object.freeze({path:'art/content-r3/cake-slope.webp',mirror:!!(g.layoutSeed%2)}):oldPicture(g,preview);
}
export function cakeView(g){
 const v=oldCake(g),sign=Math.sign(v.angle)||Math.sign(v.shift),support=sign>0?'left':sign<0?'right':'',stopped=g.speed<.05;
 const location=g.stage===2?(v.bayExit===1?'主路':g.distance<40?'前往休息灣':'休息灣'):['海岸坡','燈塔雙彎'][g.stage];
 let text;
 if(g.phase==='delivering')text='蛋糕送到了，一起分享。';
 else if(v.edge)text=stopped?'停住了，推回托盤中央。':'快到托盤邊，煞車一起扶。';
 else if(v.angle)text=stopped?'已停住，亮起的手推回中央。':g.speed>=4?'開太快了，煞車一起扶。':'亮起的手，推回中央。';
 else if(g.stage===2&&g.bayStopped&&!g.bayRestarted)text=g.restReady?'休息灣停好了，按住出灣。':'休息灣停好了，等蛋糕坐穩。';
 else if(stopped)text=g.distance>=55?'分享站停好了。':'已停住，輕踩踏板起步。';
 else if(g.speed>=4)text='開太快了，輕踩煞車。';
 else if(g.stage===2&&v.bayExit===1)text='回到主路了，慢慢前進。';
 else if(g.stage===2&&g.bayRestarted)text='沿出口慢慢離灣。';
 else if(g.stage===2&&g.distance>=40)text='進休息灣，慢慢停。';
 else text=g.inBend?'看路彎向哪邊，慢慢轉。':'輕踩踏板，慢慢前進。';
 return Object.freeze({...v,title:`第 ${g.stage+1} 站・${location}`,text,support,warningSide:sign<0?'left':sign>0?'right':'',roadArt:roadPicture(g),mirrored:roadPicture(g).mirror});
}
export function boardingCue(g){
 if(g.doorStage!=='boarding')return oldCue(g);
 const name=PASSENGER_NAMES[g.boardingIndex];
 if(g.escortWaiting){
  const full=g.escortStable>=STAND_HOLD_SECONDS,paused=!g.input.escort;
  return {action:'escort',hold:true,label:full?'站穩了，繼續走':paused?'再按住，接著站穩':'按住，等圓圈滿',text:full?`${name}站穩了，繼續走。`:paused?`${name}停在門檻，進度留著。`:`陪${name}站穩，等圓圈滿。`};
 }
 return {action:'escort',hold:true,label:g.input.escort?'陪朋友走':'按住陪朋友走',text:`陪${name}${g.escortStop?'走到座位':'走向門檻'}。`};
}
export function holdFeedback(g){
 if(g.kind!=='tickets'||g.doorStage!=='boarding')return oldHold(g);
 return {progress:g.escortWaiting?g.escortStable/STAND_HOLD_SECONDS:queueFrame(g.boardTime,g.boardingIndex).progress,state:g.input.escort?'holding':'paused',reason:boardingCue(g).text,waiting:g.escortWaiting};
}
export function boardingScene(g){
 return Object.freeze([0,1,2].map(index=>{
  const f=queueFrame(g.boardTime,index),p=f.progress,current=index===g.boardingIndex,waiting=current&&g.doorStage==='boarding'&&g.escortWaiting;
  const x=f.seated?[14,40,65][index]:p<=.69?94-8*p/.69:86+([14,40,65][index]-86)*(p-.69)/.31;
  const pose=f.seated?'seated':waiting?(g.escortBump>0?'balancing':'standing'):f.pose;
  return Object.freeze({...f,index,current,x,bottom:27,pose,bump:waiting&&g.escortBump>0,surface:f.seated?'seat':waiting?'threshold':p<.60?'platform':p<=.69?'threshold':'aisle'});
 }));
}
export function crossingView(g){
 const v=oldCrossing(g);
 return Object.freeze({...v,text:g.phase==='departing'?'已出發，沿下方車道前進。':v.text});
}
// A continuous box in scene pixels; changing the source view never changes its
// width at the handoff. The side view matches traffic's lane-sized box exactly.
export function crossingPlayerBox(view,w,h){
 const t=view.player.joinProgress,sideHeight=Math.min(40,h*.075),sideWidth=Math.min(100,w*.28),rearWidth=Math.min(74,w*.18);
 const width=rearWidth+(sideWidth-rearWidth)*t,height=rearWidth+(sideHeight-rearWidth)*t;
 const centerX=w*.60+view.player.across*w*.75,centerY=h*.90+(view.player.laneY*h-h*.90)*t;
 return Object.freeze({width,height,centerX,centerY,scale:1,angle:view.player.profile==='side'?0:view.player.turn});
}
export function observationBox(view,stage,w,h){
 const road=CROSSING_ROADS[stage],upper=view.traffic.lane==='upper';
 // The zoom paints the SAME original image at 220%, positioned 57% down.
 // Project that image's measured lane edges through the identical crop.
 const y=percent=>(percent/100*2.2+(1-2.2)*.57)*h;
 const laneTop=y(upper?road.top:road.center),laneBottom=y(upper?road.center:road.bottom);
 const height=(laneBottom-laneTop)*.84,center=(laneTop+laneBottom)/2;
 return Object.freeze({x:view.traffic.x/100*w,top:center-height/2,width:height*2,height,laneTop,laneBottom,stopX:view.stop.x/100*w,stopTop:laneTop+2,stopHeight:laneBottom-laneTop-4});
}
