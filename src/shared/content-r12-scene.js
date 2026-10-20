import {drivingCue as previousCue} from './content-r10-scene.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// The pedal always names an available action. Release is a physical status,
// not a disabled control; grey is reserved for genuinely blocked controls.
export function pedalState(g,cue){
 if(g.input.go)return {state:cue.release?'release':'held',text:cue.release?'請放開':'踩住踏板'};
 return {state:cue.action==='go'?'ready':'released',text:cue.action==='go'?'按住前進':'踏板'};
}
export function drivingCue(g){
 const cue=previousCue(g);
 if(cue.release)return {...cue,text:'放開放慢，看蛋糕回穩。'};
 if(g.stage===1&&['left','right'].includes(cue.action))return {...cue,text:'沿路面箭頭，輕輕轉。'};
 return cue;
}
// All tiers and flag share one bottom pivot. No independent layer sliding.
export function rigidCakePose(g){return clamp((g.balanceLean||0)*1.55,-29,29);}

// Backgrounds share a zebra band at y=60..69%. Approach and exit stay on
// their pavement; the across-road segment has a constant foot baseline.
export function crossingLocation(who,phase,progress=0){
 const reverse=who==='bike',start=reverse?89:11,end=reverse?11:89;
 if(phase==='waiting')return {x:start,bottom:{child:63,bike:55,grandma:47}[who]};
 if(phase==='arrived')return {x:end,bottom:{child:49,bike:45,grandma:40}[who]};
 const t=clamp(progress,0,1),entry=.18,exit=.82;
 if(t<entry)return {x:start,bottom:({child:63,bike:55,grandma:47}[who])+(35.5-({child:63,bike:55,grandma:47}[who]))*t/entry};
 if(t<=exit)return {x:start+(end-start)*(t-entry)/(exit-entry),bottom:35.5};
 return {x:end,bottom:35.5+(({child:49,bike:45,grandma:40}[who])-35.5)*(t-exit)/(1-exit)};
}
export function ticketSceneGeometry(g){
 const x=g.trainX*.4;
 return {x,door:x+64*.78,markers:[2,18,34].map(v=>v*.4+64*.78)};
}
export function queuePosition(door,index,progress,thresholdBottom){
 const t=clamp(progress/.58,0,1),start=door+12+index*9;
 return {x:start+(door-start)*t,bottom:35+index*5+(thresholdBottom-35-index*5)*t};
}
export function showQueue(g,door){return g.kind==='tickets'&&g.matched&&g.phase==='boarding'&&door.step>0&&g.boardTime<1.01;}
