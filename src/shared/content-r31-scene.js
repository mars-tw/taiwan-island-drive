import {cakeStage as previousStage,cakeRoadState as previousRoad,stability as previousStability,cakeAngle,carGround,bendTravel,cakeShift,stageBrief,boardingCue as previousBoarding,crossingTraffic as previousTraffic,CROSSING_ROADS,STOP_RULES} from './content-r30-scene.js';
import {cakePose} from './content-r4-scene.js';
import {FRIEND_NAMES,PASSENGER_NAMES} from './content-r31.js';
import {t} from './i18n.js';
export * from './content-r30-scene.js';

// Rendering takes one immutable projection per frame. No text component is
// allowed to invent an independent interpretation of speed, lean or traffic.
export function cakeView(g){
 const stage=previousStage(g),angle=cakeAngle(g),meter=previousStability(g),road=previousRoad(g);
 if(stage.id==='slowing')meter.status=t(g.input.brake?'煞車減速中':'蛋糕歪了');
 // R50: the R30 status is already in the chosen language; compare it the same way.
 if(!g.input['recover-left']&&!g.input['recover-right']&&meter.status===t('扶正中'))meter.status=t('蛋糕歪了');
 const speed=g.speed<.05?'已停住':g.speed<2?'低速':g.speed<4?'中速':'高速';
 const moving=g.phase==='playing'&&g.speed>.05;
 const pose={...cakePose(g),...carGround(g)};if(g.stage===1)pose.x=bendTravel(g);
 return Object.freeze({id:stage.id,name:stage.name,station:stageBrief(g),title:t('第 {n} 站・{name}',{n:g.stage+1,name:stage.name}),rule:t(STOP_RULES.cake[g.stage]),action:stage.action,text:stage.text,status:meter.status,fill:meter.fill,angle,pose:Object.freeze(pose),shift:cakeShift(g),
  speedText:t('車速：{speed}・傾角 {deg}°',{speed:t(speed),deg:Math.abs(angle)}),road,ground:carGround(g),leanColor:angle?'#d54a32':'#237b43',
  wobble:moving?Math.sin(g.distance*4)*Math.min(4,g.speed*.65):0,carTurn:g.inBend?g.steer*10:0,travel:g.distance*18,speedLines:moving?Math.min(3,Math.ceil(g.speed/2)):0,
  goLabel:t(stage.id==='parked'?'按住出灣':stage.id==='leaving'?'按住離灣':'踏板'),highlight:g.phase==='playing'?stage.action:''});
}
export function crossingView(g){
 const active=g.trafficActive,side=g.trafficSource,stale=g.staleSide;
 const sides=Object.fromEntries(['left','right'].map(s=>{const observed=!!(g.looked[s]||g.viewVisit?.[s]),car=observed&&active&&side===s,confirmed=!!g.looked[s]&&!car&&stale!==s;
  // The scene may contain traffic; an unvisited thumbnail knows only that
  // the child has not looked. All later projections retain this boundary.
  return [s,Object.freeze({observed,car,confirmed,stale:stale===s,road:t(!observed?'還沒看':car?(g.newTraffic&&g.crossTime>0?'車在線前等':'有車通過'):'路面淨空'),check:t(!observed?'○ 還沒看':car?'等車過':stale===s?'↻ 要重看':confirmed?'✓ 我看過了':'○ 還沒看')})];}));
 let id='waiting',action='',text=t('看清楚了，讓朋友先過。');
 if(g.phase==='departing'){id='departing';text=t('路面淨空，慢慢出發。');}
 else if(g.speed>.05){id='stopping';action='brake';text=t('按住煞車，停在線前。');}
 else if(stale){id=active?'new-car':'recheck';action=active?'':'look-'+stale;text=t(active?(stale==='left'?'新車來了，先等；再看左邊。':'新車來了，先等；再看右邊。'):stale==='left'?'車過了，再看左邊。':'車過了，再看右邊。');}
 else if(g.crossTime>0){id='crossing';text=t('等{name}到對岸。',{name:t(FRIEND_NAMES[g.crossingPerson])});}
 else if(active){id='traffic';text=t('有車通過，等一等。');}
 else if(!sides.left.confirmed||!sides.right.confirmed){id='observe';text=t('看清兩邊，再讓朋友過。');}
 else if(g.canDepart){id='ready';action='depart';text=t('路面淨空，可以出發。');}
 const progress=Math.min(1,(g.newTraffic?g.newTrafficTime:g.trafficTime)/(g.newTraffic?3.2:[2.8,3.8,3.2][g.stage]));
 // Keep the complete car inside the same-side lane while it yields, then let
 // it cross the actual road. Both thumbnails and the scene use this object.
 const x=side==='left'?12+76*progress:88-76*progress;
 const traffic={...previousTraffic(g),active,x,top:CROSSING_ROADS[g.stage].center-5,source:side,heading:side==='left'?'right':'left',reverse:side==='right',recheck:g.newTraffic};
 const departure=g.phase==='departing'?Math.min(1,(g.departureTime||0)/1.5):0;
 const player=Object.freeze({across:Math.max(0,(departure-.4)/.6)*.8,forward:Math.min(1,departure/.4)*.25,turn:Math.min(1,Math.max(0,(departure-.3)/.25))*90});
 return Object.freeze({id,action,text,note:text,title:t('第 {n} 站・{name}',{n:g.stage+1,name:stageBrief(g)}),station:stageBrief(g),sides:Object.freeze(sides),traffic:Object.freeze(traffic),player,ready:g.canDepart,route:g.canDepart||g.phase==='departing'});
}
export function cakeStage(g){return cakeView(g);}
export function drivingCue(g){return cakeView(g);}
export function stability(g){const v=cakeView(g);return {status:v.status,fill:v.fill};}
export function crossingCue(g){return crossingView(g);}
export function departReasons(g){return [crossingView(g).note];}
export function crossingTraffic(g){return crossingView(g).traffic;}
export function boardingCue(g){
 if(g.doorStage==='awaiting'){
  const name=t(PASSENGER_NAMES[g.chosenPassenger>=0?g.chosenPassenger:g.boardingIndex]);
  return g.chosenPassenger>=0?{action:'board',label:t('邀{name}上車',{name}),text:t('輪到{name}，邀他上車。',{name})}:{action:'',label:t('點{name}的車票',{name}),text:t('點{name}，邀他上車。',{name})};
 }
 return previousBoarding(g);
}
