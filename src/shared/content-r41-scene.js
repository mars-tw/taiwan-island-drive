import {CROSSING_ROADS,cakeView as previousCakeView} from './content-r35-scene.js';

// Measured on the full-frame R24 paintings, in percent. These strips are
// paving, between the traffic kerb and the mouth of the player's side road.
export const PAVEMENTS=Object.freeze([
 Object.freeze({near:[67.5,73],far:[35,39]}),
 Object.freeze({near:[63.5,70],far:[36,41]}),
 Object.freeze({near:[70,74],far:[45,48.5]}),
]);
export const LANDING_PROGRESS=.82;
const clamp=v=>Math.max(0,Math.min(1,v));
export function pavementLocation(who,phase,progress=0,stage=0,order=['child','bike','grandma']){
 const i=order.indexOf(who),p=clamp(progress),land=PAVEMENTS[stage];
 const startX=[18,50,82][i],endX=[28,72,50][i];
 const near=(land.near[0]+land.near[1])/2,far=(land.far[0]+land.far[1])/2;
 if(phase==='waiting')return {x:startX,y:near};
 if(phase==='arrived')return {x:endX,y:far};
 if(p<.18)return {x:startX+(50-startX)*p/.18,y:near};
 if(p<=LANDING_PROGRESS)return {x:50,y:near+(land.far[1]-near)*(p-.18)/(LANDING_PROGRESS-.18)};
 const after=(p-LANDING_PROGRESS)/(1-LANDING_PROGRESS);
 return {x:50+(endX-50)*after,y:land.far[1]+(far-land.far[1])*after};
}
export function arrivedCount(g){
 return Math.min(3,g.crossed+(g.crossTime>0&&g.crossTime/g.crossingDuration>=LANDING_PROGRESS?1:0));
}
export function wrongSupportText(view,input){
 if(!view.support||!input['recover-'+view.warningSide]||input['recover-'+view.support])return '';
 const lean=view.warningSide==='left'?'左':'右',push=view.support==='left'?'左':'右';
 return `推錯邊了，蛋糕往${lean}歪，要往${push}扶。`;
}
export function cakeHint(view,input){
 return wrongSupportText(view,input)||view.text.replace('亮起的手，','看蛋糕歪哪邊，').replace('亮起的手','看蛋糕歪哪邊，').replace('快到托盤邊，','歪得很大，').replace('推回托盤中央','慢慢扶回正').replace('推回中央','慢慢扶回正');
}
export function cakeView(g){
 const view=previousCakeView(g),text=cakeHint(view,g.input);
 // The status and existing voice button consume the same final sentence.
 return Object.freeze({...view,text});
}
export function observationState(view,side){
 const v=view.sides[side];
 return !v.observed?'unseen':!v.car?'clear':view.traffic.yielding?'stopped':'approaching';
}
export function observationProjection(view,stage,width,height){
 const road=CROSSING_ROADS[stage],upper=view.traffic.lane==='upper';
 // A single crop and transform for all four card states. Paint the car at
 // the same normalized longitudinal coordinate as the main scene.
 const y=p=>(p/100*2.2+(1-2.2)*.57)*height;
 const top=y(upper?road.top:road.center),bottom=y(upper?road.center:road.bottom);
 const h=(bottom-top)*.84;
 return {x:view.traffic.x/100*width,top:(top+bottom-h)/2,width:h*2,height:h,laneTop:top,laneBottom:bottom};
}
