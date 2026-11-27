import {drivingCue as previousDriving,crossingTraffic as previousTraffic,boardingCue as previousBoarding,carGround as previousGround,cakeRoadState as previousRoad} from './content-r29-scene.js';
import {FRIEND_NAMES} from './content-r30.js';
import {t} from './i18n.js';
export * from './content-r29-scene.js';

export function cakeAngle(g){return Math.round(Math.max(-28,Math.min(28,(g.balanceLean||0)*.875)));}
export function stability(g){const angle=Math.abs(cakeAngle(g)),support=(g.input?.['recover-right']?1:0)-(g.input?.['recover-left']?1:0);return {fill:angle===0?100:Math.max(0,100-Math.round(angle/28*100)),status:t(angle===0?'坐穩了':g.recoveryWrong?'換邊扶':support*(g.balanceLean||0)<0?'扶正中':'蛋糕歪了')};}
export function cakeStage(g){
 if(['done','checkpoint','delivering'].includes(g.phase))return {id:'delivered',name:t('送到了'),action:'',text:t('蛋糕送到了，一起分享。')};
 if(g.stage===2&&g.bayStopped&&!g.bayRestarted)return g.restReady?{id:'parked',name:t('休息灣・準備出灣'),action:'go',text:t('坐穩了，按住踏板出灣。')}:{id:'resting',name:t('休息灣・停穩休息'),action:'',text:t('車停妥了，讓蛋糕坐穩。')};
 if(g.stage===2&&g.bayRestarted&&g.distance<55)return g.distance>=54.5?{id:'main-road',name:t('已回主路・向前開'),action:'go',text:t('已回主路，按住踏板向前。')}:{id:'leaving',name:t('離開休息灣'),action:'go',text:t('按住踏板，慢慢離開格子。')};
 if(g.stage===2&&g.distance>=42&&!g.bayStopped)return {id:'bay-braking',name:t('休息灣・煞車停穩'),action:'brake',text:t('開進格子了，按住煞車停穩。')};
 if(g.distance>=55){if(g.speed>.05)return {id:'destination-braking',name:t('分享站・煞車停穩'),action:'brake',text:t('到分享站了，按住煞車。')};if(cakeAngle(g))return {id:'destination-steady',name:t('分享站・扶正蛋糕'),action:g.balanceLean>0?'recover-left':'recover-right',text:t(g.balanceLean>0?'車停穩了，向左扶蛋糕。':'車停穩了，向右扶蛋糕。')};}
 if(Math.abs(cakeAngle(g))>=3){if(g.speed>=2&&!g.input.brake)return {id:'slowing',name:t('先減速'),action:'brake',text:t('蛋糕歪了，按住煞車減速。')};return {id:'steadying',name:t('扶正蛋糕'),action:g.balanceLean>0?'recover-left':'recover-right',text:t(g.balanceLean>0?'向左扶，讓蛋糕回正。':'向右扶，讓蛋糕回正。')};}
 return {id:g.inBend?'turning':'starting',name:t(g.inBend?(g.bend>0?'右彎・慢慢轉':'左彎・慢慢轉'):['海岸坡・起步','燈塔路・起步','前往休息灣'][g.stage]),action:g.inBend?(g.bend>0?'right':'left'):'go',text:t(g.inBend?(g.bend>0?'按住右轉，慢慢過彎。':'按住左轉，慢慢過彎。'):'按住踏板，平順起步。')};
}
export function drivingCue(g){return g.kind==='cake'?cakeStage(g):previousDriving(g);}
export function carGround(g){if(g.stage!==2)return previousGround(g);const t=g.bayRestarted?Math.min(1,(g.distance-47)/7.5):0,e=g.bayStopped?1:Math.max(0,Math.min(1,(g.distance-40)/7));return {x:.22*e-.52*t,y:-.07-.15*e-.29*t,scale:.68-.14*e};}
export function cakeRoadState(g){return g.stage===2&&g.bayRestarted?{shape:'left',label:t(g.distance>=54.5?'已回主路':'離開休息灣')}:previousRoad(g);}
export function crossingCue(g){
 if(g.phase==='departing')return {action:'',text:t('路面淨空，慢慢出發。')};
 if(g.speed>.05)return {action:'brake',text:t('按住煞車，停在線前。')};
 if(g.staleSide){const left=g.staleSide==='left';return {action:g.trafficActive?'':'look-'+g.staleSide,text:t(g.trafficActive?(left?'新車接近，先等；再看左邊。':'新車接近，先等；再看右邊。'):left?'車過了，再看左邊。':'車過了，再看右邊。')};}
 if(g.crossTime>0)return {action:'',text:t('等{name}到對岸。',{name:t(FRIEND_NAMES[g.crossingPerson])})};
 if(g.trafficActive)return {action:'look-'+g.trafficSource,text:t(g.trafficSource==='left'?'看左邊的來車，等一等。':'看右邊的來車，等一等。')};
 for(const side of ['left','right'])if(!g.looked[side])return {action:'look-'+side,text:t(side==='left'?'自己看左邊，確認路況。':'自己看右邊，確認路況。')};
 return {action:g.canDepart?'depart':'',text:t(g.canDepart?'路面淨空，可以出發。':'看清楚了，讓朋友先過。')};
}
export function departReasons(g){if(g.canDepart)return [t('路面淨空，可以出發')];if(g.speed>.05)return [t('先煞車停穩')];if(g.staleSide)return [t(g.staleSide==='left'?'新車來了・再看左邊':'新車來了・再看右邊')];if(g.trafficActive)return [t('還有一台車・先等')];if(g.crossTime>0)return [t('等{name}到對岸',{name:t(FRIEND_NAMES[g.crossingPerson])})];for(const side of ['left','right'])if(!g.looked[side])return [t(side==='left'?'再看左邊':'再看右邊')];return [t('還有{n}位朋友要過街',{n:3-g.crossed})];}
export function crossingTraffic(g){const p=previousTraffic(g),t=Math.min(1,(g.newTraffic?g.newTrafficTime:g.trafficTime)/(g.newTraffic?3.2:[2.8,3.8,3.2][g.stage])),right=g.trafficSource==='left';return {...p,x:right?-14+128*t:114-128*t,source:g.trafficSource,heading:right?'right':'left',reverse:!right,recheck:g.newTraffic};}
export function ticketDifference(g){const t=g.selected<0?null:g.platforms[g.selected];return {shape:!!t&&t.shape===g.target.shape,color:!!t&&t.color===g.target.color,selected:!!t};}
export function ticketMismatch(g){const d=ticketDifference(g);return t(!d.shape?'形狀不同，再比輪廓。':!d.color?'顏色不同，再看票色。':'形狀、顏色都一樣。');}
export function boardingCue(g){if(g.doorStage==='awaiting')return {action:g.chosenPassenger>=0?'board':'',label:t(g.chosenPassenger>=0?'邀他上車':'點一位朋友'),text:g.chosenPassenger>=0?t('輪到{name}，按下邀他上車。',{name:t(['小安','小晴','小宇'][g.chosenPassenger])}):t('點朋友的大車票，再邀他上車。')};return previousBoarding(g);}
export function stageBrief(g,stage=g.stage){return t(g.kind==='cake'?['海岸坡','燈塔雙彎','休息灣'][stage]:g.kind==='crossing'?['海風路口','榕樹路口','燈塔路口'][stage]:['海風站','榕樹站','花園站'][stage]);}
