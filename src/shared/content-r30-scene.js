import {drivingCue as previousDriving,crossingTraffic as previousTraffic,boardingCue as previousBoarding,carGround as previousGround,cakeRoadState as previousRoad} from './content-r29-scene.js';
import {FRIEND_NAMES} from './content-r30.js';
export * from './content-r29-scene.js';

export function cakeAngle(g){return Math.round(Math.max(-28,Math.min(28,(g.balanceLean||0)*.875)));}
export function stability(g){const angle=Math.abs(cakeAngle(g)),support=(g.input?.['recover-right']?1:0)-(g.input?.['recover-left']?1:0);return {fill:angle===0?100:Math.max(0,100-Math.round(angle/28*100)),status:angle===0?'坐穩了':g.recoveryWrong?'換邊扶':support*(g.balanceLean||0)<0?'扶正中':'蛋糕歪了'};}
export function cakeStage(g){
 if(['done','checkpoint','delivering'].includes(g.phase))return {id:'delivered',name:'送到了',action:'',text:'蛋糕送到了，一起分享。'};
 if(g.stage===2&&g.bayStopped&&!g.bayRestarted)return g.restReady?{id:'parked',name:'休息灣・準備出灣',action:'go',text:'坐穩了，按住踏板出灣。'}:{id:'resting',name:'休息灣・停穩休息',action:'',text:'車停妥了，讓蛋糕坐穩。'};
 if(g.stage===2&&g.bayRestarted&&g.distance<55)return g.distance>=54.5?{id:'main-road',name:'已回主路・向前開',action:'go',text:'已回主路，按住踏板向前。'}:{id:'leaving',name:'離開休息灣',action:'go',text:'按住踏板，慢慢離開格子。'};
 if(g.stage===2&&g.distance>=42&&!g.bayStopped)return {id:'bay-braking',name:'休息灣・煞車停穩',action:'brake',text:'開進格子了，按住煞車停穩。'};
 if(g.distance>=55){if(g.speed>.05)return {id:'destination-braking',name:'分享站・煞車停穩',action:'brake',text:'到分享站了，按住煞車。'};if(cakeAngle(g))return {id:'destination-steady',name:'分享站・扶正蛋糕',action:g.balanceLean>0?'recover-left':'recover-right',text:'車停穩了，向'+(g.balanceLean>0?'左':'右')+'扶蛋糕。'};}
 if(Math.abs(cakeAngle(g))>=3){if(g.speed>=2&&!g.input.brake)return {id:'slowing',name:'先減速',action:'brake',text:'蛋糕歪了，按住煞車減速。'};return {id:'steadying',name:'扶正蛋糕',action:g.balanceLean>0?'recover-left':'recover-right',text:'向'+(g.balanceLean>0?'左':'右')+'扶，讓蛋糕回正。'};}
 return {id:g.inBend?'turning':'starting',name:g.inBend?(g.bend>0?'右彎・慢慢轉':'左彎・慢慢轉'):['海岸坡・起步','燈塔路・起步','前往休息灣'][g.stage],action:g.inBend?(g.bend>0?'right':'left'):'go',text:g.inBend?'按住'+(g.bend>0?'右':'左')+'轉，慢慢過彎。':'按住踏板，平順起步。'};
}
export function drivingCue(g){return g.kind==='cake'?cakeStage(g):previousDriving(g);}
export function carGround(g){if(g.stage!==2)return previousGround(g);const t=g.bayRestarted?Math.min(1,(g.distance-47)/7.5):0,e=g.bayStopped?1:Math.max(0,Math.min(1,(g.distance-40)/7));return {x:.22*e-.52*t,y:-.07-.15*e-.29*t,scale:.68-.14*e};}
export function cakeRoadState(g){return g.stage===2&&g.bayRestarted?{shape:'left',label:g.distance>=54.5?'已回主路':'離開休息灣'}:previousRoad(g);}
export function crossingCue(g){
 if(g.phase==='departing')return {action:'',text:'路面淨空，慢慢出發。'};
 if(g.speed>.05)return {action:'brake',text:'按住煞車，停在線前。'};
 if(g.staleSide)return {action:g.trafficActive?'':'look-'+g.staleSide,text:g.trafficActive?'新車接近，先等；再看'+(g.staleSide==='left'?'左':'右')+'邊。':'車過了，再看'+(g.staleSide==='left'?'左':'右')+'邊。'};
 if(g.crossTime>0)return {action:'',text:'等'+FRIEND_NAMES[g.crossingPerson]+'到對岸。'};
 if(g.trafficActive)return {action:'look-'+g.trafficSource,text:'看'+(g.trafficSource==='left'?'左':'右')+'邊的來車，等一等。'};
 for(const side of ['left','right'])if(!g.looked[side])return {action:'look-'+side,text:'自己看'+(side==='left'?'左':'右')+'邊，確認路況。'};
 return {action:g.canDepart?'depart':'',text:g.canDepart?'路面淨空，可以出發。':'看清楚了，讓朋友先過。'};
}
export function departReasons(g){if(g.canDepart)return ['路面淨空，可以出發'];if(g.speed>.05)return ['先煞車停穩'];if(g.staleSide)return ['新車來了・再看'+(g.staleSide==='left'?'左':'右')+'邊'];if(g.trafficActive)return ['還有一台車・先等'];if(g.crossTime>0)return ['等'+FRIEND_NAMES[g.crossingPerson]+'到對岸'];for(const side of ['left','right'])if(!g.looked[side])return ['再看'+(side==='left'?'左':'右')+'邊'];return ['還有'+(3-g.crossed)+'位朋友要過街'];}
export function crossingTraffic(g){const p=previousTraffic(g),t=Math.min(1,(g.newTraffic?g.newTrafficTime:g.trafficTime)/(g.newTraffic?3.2:[2.8,3.8,3.2][g.stage])),right=g.trafficSource==='left';return {...p,x:right?-14+128*t:114-128*t,source:g.trafficSource,heading:right?'right':'left',reverse:!right,recheck:g.newTraffic};}
export function ticketDifference(g){const t=g.selected<0?null:g.platforms[g.selected];return {shape:!!t&&t.shape===g.target.shape,color:!!t&&t.color===g.target.color,selected:!!t};}
export function ticketMismatch(g){const d=ticketDifference(g);return !d.shape?'形狀不同，再比輪廓。':!d.color?'顏色不同，再看票色。':'形狀、顏色都一樣。';}
export function boardingCue(g){if(g.doorStage==='awaiting')return {action:g.chosenPassenger>=0?'board':'',label:g.chosenPassenger>=0?'邀他上車':'點一位朋友',text:g.chosenPassenger>=0?'輪到'+['小安','小晴','小宇'][g.chosenPassenger]+'，按下邀他上車。':'點朋友的大車票，再邀他上車。'};return previousBoarding(g);}
export function stageBrief(g,stage=g.stage){return g.kind==='cake'?['海岸坡','燈塔雙彎','休息灣'][stage]:g.kind==='crossing'?['海風路口','榕樹路口','燈塔路口'][stage]:['海風站','榕樹站','花園站'][stage];}
