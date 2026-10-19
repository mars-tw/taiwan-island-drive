import {cakeFeedback} from './content-r7-scene.js';
const clamp=v=>Math.max(0,Math.min(1,v));

// One source for the spoken instruction, highlighted control and dashboard.
export function drivingCue(g){
 if(g.distance>=55)return {action:'brake',text:'到了，按住煞車。'};
 if(g.stage===2&&g.distance>=42&&!g.bayStopped)return {action:'brake',text:'臨停灣到了，按住煞車。'};
 if(g.bayStopped&&!g.bayRestarted)return {action:'go',text:'停穩了，按住踏板再起步。'};
 if(g.speed===0)return {action:'go',text:'按住踏板起步。'};
 if(g.distance<.25&&g.input?.go)return {action:'go',text:'踩住了，慢慢起步。'};
 const f=cakeFeedback(g);
 if(g.balancePractice&&(g.balanceDanger||Math.abs(g.balanceLean||0)>=18))return {action:f.direction,release:true,text:`蛋糕歪了！放開放慢，輕輕${f.direction==='left'?'左':'右'}轉扶正。`};
 if(!f.settled)return {action:f.direction,release:true,text:`鬆踏板，輕輕${f.direction==='left'?'左':'右'}轉。`};
 if(g.distance>15&&g.distance<=40)return {action:g.bend>0?'right':'left',text:`輕輕${g.bend>0?'右':'左'}轉。`};
 return {action:'go',text:'按住踏板，慢慢前進。'};
}

// All three phases use a shared CSS box and foot baseline, never a resized icon.
export function crossingLocation(who,phase,progress=0){
 const start=who==='bike'?82:18,end=who==='bike'?18:82;
 const waiting=who==='grandma'?31:55,arrived={child:6,bike:58,grandma:31}[who];
 return {x:phase==='waiting'?start:phase==='arrived'?end:start+(end-start)*clamp(progress),bottom:phase==='waiting'?waiting:phase==='arrived'?arrived:waiting+(31-waiting)*clamp(progress/.25)};
}

export function queueFrame(time,index,seated=false){
 const progress=clamp((time-.10-index*.31)/.29);
 return {progress,seated:seated||progress>=1,inside:seated||progress>=.72,pose:Math.floor(progress*8)%2};
}
export function queuePosition(door,index,progress,thresholdBottom){
 const t=clamp(progress/.58),start=door+14+index*13;
 return {x:start+(door-start)*t,bottom:35+index*5+(thresholdBottom-35-index*5)*t};
}
export function carGround(g){
 // Stay in the broad foreground lane; the old -48% projection reached the sea.
 const p=clamp(g.distance/55);
 return g.balancePractice?{x:g.stage===1?Math.sin(p*Math.PI*2)*-.08:g.stage===2&&g.distance>=40?.25:0,y:g.stage===2&&g.distance>=40?-.12:-p*.08,scale:g.stage===2&&g.distance>=40?.65:.8-p*.10}:{x:g.stage===1?Math.sin(p*Math.PI*2)*-.08:g.stage===2&&g.distance>=40?.12:0,y:-p*.08,scale:1-p*.10};
}
