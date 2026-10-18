import {CROSSING_ORDERS} from './content-r1.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Coordinates derive only from live distance, steering and acceleration.
export function cakePose(g){
 const p=clamp(g.distance/55,0,1),bend=g.stage===1?Math.sin(p*Math.PI*2)*-.10:g.stage===2&&g.distance>=40?.14:0;
 return {x:bend+g.steer*.025,y:-p*.48,scale:1-p*.24,pitch:clamp(-g.acceleration*.8,-6,6)+g.steer*2,cake:clamp(g.tilt*.65,-22,22),cream:clamp(g.sway*2.4,-30,30),fruit:clamp((g.fruitSway||0)*2.8,-36,36),flag:clamp((g.flagSway||0)*1.5,-45,45),bend:clamp(g.tilt*.25,-8,8)};
}
export function sideWatch(g,side){
 const people=CROSSING_ORDERS[g.stage].filter((who,i)=>(who==='bike'?'right':'left')===side&&i>=g.crossed);
 return {people,clear:people.length===0,label:side==='left'?'左邊':'右邊'};
}
export function cakeTask(g){
 if(g.stage===1)return g.distance<=29&&g.turns.left<.2?'← 先練左彎':g.distance<=40&&g.turns.right<.2?'再練右彎 →':'左右都練好了';
 if(g.stage===2)return !g.bayStopped?'臨停灣：先停穩':!g.bayRestarted?'停穩了：再起步':'再起步，送到桌邊';
 return g.distance<15?'按住起步・放開放慢':'起步坡：慢慢前進';
}
