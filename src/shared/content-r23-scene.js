import {drivingCue as previousDriving,crossingCue as previousCrossing,landedFriends} from './content-r22-scene.js';
export * from './content-r22-scene.js';

// These names describe the actual artwork, including the left-curving bay exit.
export function cakeRoadState(g){
 const shape=g.inBend?(g.bend<0?'left':'right'):g.stage===0?'uphill':'left';
 return {shape,label:{left:'左彎',right:'右彎',uphill:'上坡'}[shape]};
}
export function drivingCue(g){
 const c=previousDriving(g),road=cakeRoadState(g);
 if(c.action==='go'&&!(g.bayStopped&&!g.bayRestarted))return {...c,text:`前方${road.label}，照顧蛋糕。`};
 if(g.inBend&&c.action===road.shape)return {...c,text:`前方${road.label}，看路牌。`};
 return c;
}
export function crossingTraffic(g){
 const recheck=g.stage===2&&g.lookStep>=2&&g.recheckTime<1.4;
 const reverse=!recheck&&g.stage===1,t=Math.max(0,Math.min(1,(recheck?g.recheckTime:g.trafficTime)/(recheck?1.4:[2.8,3.8,3.2][g.stage])));
 return {x:recheck?12+30*t:reverse?86-72*t:14+72*t,top:reverse?27:32,reverse,approaching:false,source:reverse?'right':'left',heading:reverse?'left':'right',recheck};
}
export function observation(g){
 if(g.focus==='center'||g.crossTime>0||g.crossed===3||g.phase!=='playing')return null;
 const car=crossingTraffic(g),target=g.trafficActive&&((g.focus==='left')===(car.x<50));
 return {x:target?car.x:g.focus==='left'?18:82,y:car.top+4,target:target?'來車':'空車道入口'};
}
export function trafficLabelPosition(g,width,labelWidth=44){return Math.max(2,Math.min(width-labelWidth-2,crossingTraffic(g).x*width/100-labelWidth/2));}
export function crossingDestination(g){return `對岸${landedFriends(g)===3?' ✓':''}`;}
export function crossingCue(g){
 if(g.phase==='playing'&&g.stage===2&&g.lookStep===2&&!g.friendConfirmed&&!g.choiceHint&&(!g.trafficActive||g.recheckTime>=1.4))return {action:'look-left',text:'左邊還要再確認。'};
 const c=previousCrossing(g);
 if(!g.choiceHint&&g.crossTime>0&&g.crossTime/g.crossingDuration<.18)return {...c,text:`${{child:'小朋友',bike:'腳踏車',grandma:'奶奶'}[g.crossingPerson]}準備過街。`};
 return c;
}

// The visible door and step face the camera. Put the platform on that SAME
// side. Waiting feet stay on the foreground paving, then climb to the sill.
export function boardingGeometry(sill,height){
 const stepHeight=Math.max(12,Math.min(54,height*.085));
 // The art has a transparent edge; overlap the paving by 14px so the last
 // painted tread visibly touches it as well as the CSS boxes touching.
 return {stepHeight,platformTop:sill+stepHeight-14,waitingBottom:3};
}
export function queuePosition(door,index,progress,thresholdBottom,width=360,height=550,trainHeight=134,stage=0){
 const p=Math.max(0,Math.min(.72,progress)),start=stage===1?[18,43,70]:stage===2?[30,56,82]:[18,50,82];
 const across=Math.min(1,p/.26),up=Math.max(0,Math.min(1,(p-.26)/.32));
 const bottom=3+(thresholdBottom-3)*up,sill=height*(1-thresholdBottom/100),ground=boardingGeometry(sill,height);
 return {x:start[index]+(door-start[index])*across,bottom,surface:height*(1-bottom/100)>=ground.platformTop?'platform':p<.58?'step':'sill'};
}
