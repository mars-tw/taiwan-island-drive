import {drivingCue as previousDriving,holdFeedback as previousHold,stability as previousStability,queuePosition as previousQueue} from './content-r24-scene.js';
export * from './content-r24-scene.js';

export function drivingCue(g){
 const cue=previousDriving(g);
 if(g.recoveryActive)return {...cue,text:g.recoveryWrong?`越扶越歪，改按${g.balanceLean>0?'左':'右'}邊。`:cue.text};
 return cue;
}
export function holdFeedback(g){
 const hold=previousHold(g);
 return g.kind==='cake'&&g.recoveryWrong?{...hold,reason:drivingCue(g).text}:hold;
}
export function stability(g){
 const meter=previousStability(g);
 return g.recoveryActive&&!g.input?.['recover-left']&&!g.input?.['recover-right']?{...meter,status:'等你扶正'}:meter;
}
export function queuePosition(...args){
 const pos=previousQueue(...args);
 const [door,,progress,thresholdBottom]=args,p=Math.max(0,Math.min(.58,progress));
 // Walk through the gap beside the sign, then turn onto the door sill.
 const beside=door+(door<=20?15:-15);
 if(p<.26){const start=previousQueue(...args.slice(0,2),0,...args.slice(3));pos.x=start.x+(beside-start.x)*p/.26;pos.bottom=1;}
 else if(p<.5){pos.x=beside;pos.bottom=1+(thresholdBottom-1)*(p-.26)/.24;}
 else {pos.x=p>=.58?door:beside+(door-beside)*(p-.5)/.08;pos.bottom=thresholdBottom;}
 return pos;
}
export const STOP_RULES={cake:['↑ 慢慢上坡','↰ ↱ 兩個彎','停 → 走・休息灣'],crossing:['← 左邊先來車','→ 右邊先來車','← → ← 再看一次'],tickets:['● 比對形色','▲ 同形不同色','■ 同色不同形']};
