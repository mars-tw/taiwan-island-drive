import {crossingView as previousView,CROSSING_ROADS} from './content-r35-scene.js';
export * from './content-r35-scene.js';
export const PLAYER_APPEARANCE='alu-deep-blue-r11';
export const PLAYER_ART='art/content-r11/car-rear.png';
const clamp=v=>Math.max(0,Math.min(1,v));
export function crossingView(g){
 const v=previousView(g);
 return Object.freeze({...v,traffic:Object.freeze({...v.traffic,visible:v.traffic.active&&v.sides[v.traffic.source].observed}),
  player:Object.freeze({...v.player,appearanceId:PLAYER_APPEARANCE,art:PLAYER_ART}),
  crossingProgress:g.crossTime>0?clamp(g.crossTime/g.crossingDuration):0});
}
// One rear-view drawing throughout: rotate it continuously, never replace it
// with the unrelated side-on traffic car. Its square box shrinks continuously
// to fit the lower lane before the turn finishes.
export function playerBox(view,w,h){
 const t=view.player.joinProgress,e=t*t*(3-2*t),size=Math.min(74,w*.18,h*.18),laneSize=Math.min(38,h*view.player.laneHeight*.64);
 const width=size+(laneSize-size)*e,height=width;
 return Object.freeze({width,height,centerX:w*.60+view.player.across*w*.75,
  centerY:h*.90+(view.player.laneY*h-h*.90)*e,angle:view.player.turn});
}
