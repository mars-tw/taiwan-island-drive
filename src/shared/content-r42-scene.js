import {arrivedCount} from './content-r41-scene.js';

export const TRAIN_WINDOWS=Object.freeze([
 Object.freeze({left:12.5,top:32,width:13.5,height:27}),
 Object.freeze({left:33.5,top:32,width:13.5,height:27}),
 Object.freeze({left:54.5,top:32,width:13.5,height:27}),
]);
export function trainWindow(index,reverse=false){
 const window=TRAIN_WINDOWS[index];
 return {...window,left:reverse?100-window.left-window.width:window.left};
}
export function crossingArrivalHint(g){
 if(g.kind!=='crossing'||g.phase!=='playing')return '';
 const count=arrivedCount(g);
 if(count===3)return g.canDepart?'大家都到了，可以出發。':'大家都到了，再看一次左右。';
 if(count>g.crossed||g.crossTime===0&&g.crossed>0){
  const who=count>g.crossed?g.crossingPerson:g.crossingOrder[g.crossed-1];
  return `${{grandma:'阿嬤',child:'小安',bike:'小柏'}[who]}到了，還有 ${3-count} 位。`;
 }
 return '';
}
export function overlaps(a,b){
 return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
}
// Keep the original foot-aligned label unless it would cover another face.
// The horizontal search stays at the same height, including on arrival paving.
export function clearFaceLabel(label,faces,bounds){
 const valid=b=>b.x>=bounds.x&&b.x+b.w<=bounds.x+bounds.w&&b.y>=bounds.y&&b.y+b.h<=bounds.y+bounds.h&&!faces.some(f=>overlaps(b,f));
 if(valid(label))return label;
 for(let d=4;d<bounds.w;d+=4)for(const sign of [-1,1]){
  const b={...label,x:label.x+sign*d};if(valid(b))return b;
 }
 for(let d=4;d<bounds.h;d+=4){const b={...label,y:label.y-d};if(valid(b))return b;}
 return label;
}
