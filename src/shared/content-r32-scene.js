import {cakeView as oldCake,crossingView as oldCrossing,boardingCue as oldBoarding,holdFeedback as oldHold,ticketSceneGeometry as oldGeometry,carGround as oldGround,cakeAngle,CROSSING_ROADS} from './content-r31-scene.js';
import {queueFrame} from './content-r10-scene.js';
import {PASSENGER_NAMES} from './content-r32.js';
export * from './content-r31-scene.js';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export function roadPicture(g,preview=false){
 const bending=g.stage===1||!preview&&g.inBend;
 return Object.freeze({path:bending?'art/content-r19/cake-bends.webp':g.stage===2?'art/content-r28/cake-bay.webp':'art/content-r3/cake-slope.webp',mirror:bending?g.bend>0:!!((g.layoutSeed||0)%2)});
}
export function cakeShift(g){return g.traySlide||0;}
export function carGround(g){
 if(g.stage!==2){const p=oldGround(g);return {...p,x:clamp(p.x,-.10,.10),y:clamp(p.y,-.12,0),scale:.82};}
 const entry=clamp((g.distance-40)/7),exit=g.bayRestarted?clamp((g.distance-47)/8):0;
 return {x:(.055*entry-.095*exit)*((g.layoutSeed||0)%2?-1:1),y:-.025-.035*entry-.055*exit,scale:.80};
}
export function cakeView(g){
 const old=oldCake(g),angle=cakeAngle(g),slide=cakeShift(g),edge=Math.abs(slide)>24;
 const pose={...old.pose,...carGround(g)},road={...old.road};
 if(g.stage===2&&g.distance>=40)road.shape=(g.layoutSeed||0)%2?'right':'left';
 let text=old.text,status=old.status;
 if(g.practice){
  text=edge?'滑到托盤邊了，試著救回來。':g.recoveryWrong?'越扶越歪了，換個方法。':Math.abs(slide)>8?'蛋糕滑動了，看看車速。':angle?'看蛋糕歪哪邊，自己扶。':g.inBend?(g.speed===0?'踏板和轉向可以一起按。':'看路彎向哪邊，自己試試。'):g.distance>=55?'分享站到了，自己停穩。':old.id==='parked'?'休息好了，自己慢慢出灣。':g.stage===2&&g.distance>=42&&!g.bayStopped?'進灣了，自己決定何時停。':'輕踩或放開，看看蛋糕。';
 }
 if(edge)status='快到托盤邊';else if(Math.abs(slide)>8)status='蛋糕滑動了';
 return Object.freeze({...old,title:g.practice?`第 ${g.stage+1} 站・${['海岸坡','燈塔雙彎','休息灣'][g.stage]}`:old.title,pose:Object.freeze(pose),ground:carGround(g),shift:slide,edge,status,text,road,
  fill:angle===0?100:old.fill,highlight:g.practice?'':old.highlight,action:g.practice?'':old.action,
  roadArt:roadPicture(g),mirrored:roadPicture(g).mirror});
}
export function crossingView(g){
 const old=oldCrossing(g),side=g.trafficSource,time=g.newTraffic?g.newTrafficTime:g.trafficTime,total=g.newTraffic?3.2:[2.8,3.8,3.2][g.stage];
 const yielding=g.newTraffic&&g.crossTime>0&&g.crossed===0;
 const t=clamp(time/total),travel=yielding?clamp(time/.3)*.16:clamp((t-.09)/.91)*.84+.16;
 const x=side==='left'?4+92*travel:96-92*travel;
 const traffic=Object.freeze({...old.traffic,x,top:CROSSING_ROADS[g.stage].center-5,yielding,motion:yielding?'讓行':t<.28?'接近':t>.78?'離開':'通過'});
 const sides=Object.freeze(Object.fromEntries(Object.entries(old.sides).map(([s,v])=>[s,Object.freeze({...v,road:v.car?(yielding?'車停在線前':'車正在'+traffic.motion):'路面淨空'})])));
 let text=old.text;
 if(yielding)text='車在線前等，朋友先過。';
 if(g.practice&&g.safetyNotice>0&&g.choiceHint)text=g.choiceHint;
 return Object.freeze({...old,text,note:text,action:g.practice?'':old.action,sides,traffic,player:Object.freeze({...old.player,forward:old.player.forward*1.65})});
}
export function boardingCue(g){
 if(g.doorStage==='awaiting'){const name=PASSENGER_NAMES[g.boardingIndex];return {action:g.chosenPassenger>=0?'board':'',label:g.chosenPassenger>=0?`邀${name}上車`:`點${name}的車票`,text:`輪到${name}，${g.chosenPassenger>=0?'邀請上車。':'點亮框。'}`};}
 const old=oldBoarding(g);return {...old,text:old.text?.replaceAll('他','朋友'),label:old.label?.replaceAll('他','朋友')};
}
export function holdFeedback(g){const h=oldHold(g);return g.kind==='tickets'?{...h,reason:h.reason?.replaceAll('他','朋友')}:h;}
// The door, aisle and cushion are fixed landmarks in the generated cabin art.
// Position and seating both derive from this one projection, never a text label.
export function boardingScene(g){
 return Object.freeze([0,1,2].map(index=>{
  const f=queueFrame(g.boardTime,index,false),p=f.progress,seat=15+index*25;
  const x=p<.35?96-10*p/.35:p<.72?86-4*(p-.35)/.37:p<.82?82-9*(p-.72)/.10:73+(seat-73)*(p-.82)/.18;
  const bottom=p<.72?21: p<.96?24:24+14*(p-.96)/.04;
  return Object.freeze({index,progress:p,seated:f.seated,x,bottom,pose:f.pose,surface:p<.35?'platform':p<.72?'threshold':p<1?'aisle':'seat',current:index===g.boardingIndex});
 }));
}
export function ticketSceneGeometry(g,w){
 const geometry=oldGeometry(g,w);
 if(g.phase!=='playing')return geometry;
 const index=g.selected<0?2:g.selected,local=geometry.reverse?.22:.78;
 const destination=geometry.markers[index]-geometry.width*local,t=clamp(g.distance/28),x=6+(destination-6)*t;
 return {...geometry,x,door:x+geometry.width*local};
}
