import {drivingCue as previousDriving,crossingCue as previousCrossing,crossingLocation as previousLocation} from './content-r13-scene.js';
export {pedalState,ticketSceneGeometry,STOP_X,FRONT_RAIL,WHEEL_BOTTOM,DOOR_SILL} from './content-r13-scene.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// The meter has exactly one input: absolute roll. Pedal/assist flags cannot recolor it.
export function stability(g){
 const lean=Math.abs(g.balanceLean||0),fill=Math.round(clamp(1-lean/32,0,1)*100);
 return {fill,tone:lean>=12?'orange':lean>=3?'lime':'green',settled:lean<3};
}
export function drivingCue(g){
 if(g.phase==='delivering')return {action:'',text:'正在送達，等車停到桌邊。'};
 const cue=previousDriving(g);
 if(!cue.release&&['left','right'].includes(cue.action))return {...cue,text:`按住${cue.action==='left'?'左轉':'右轉'}，沿車道慢慢走。`};
 return cue;
}
export function crossingCue(g){
 if(g.phase==='departing')return {action:'',text:'出發中'};
 if(g.crossTime>0)return {action:'',text:`${{child:'小朋友',bike:'腳踏車',grandma:'奶奶'}[g.crossingPerson]}正在過街，等到對岸。`};
 if(g.confirmDelay>0&&!g.trafficActive)return {action:'',text:'朋友準備過街，等一等。'};
 return previousCrossing(g);
}
export function crossingLocation(who,phase,progress=0){
 // At the near edge the curb widens outward. Put the child's feet beyond it.
 const pos=previousLocation(who,phase,progress);
 if(who==='child'&&phase==='arrived')return {x:92.5,bottom:31};
 if(who==='child'&&phase==='crossing'&&progress>.82){const t=clamp((progress-.82)/.18,0,1);return {x:89+3.5*t,bottom:35.5+(31-35.5)*t};}
 return pos;
}
export function queuePosition(door,index,progress,thresholdBottom,width=360){
 const t=clamp(progress/.58,0,1),side=door>65?-1:1;
 // Fixed CSS-pixel spacing stays close on phones AND tablets.
 const offset=(18+index*22)/width*100;
 return {x:door+side*offset*(1-t),bottom:thresholdBottom+(5+index*5)*(1-t)};
}
