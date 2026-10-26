import {CAKE_SUPPORT} from './content-r39-ui.js';
import {observationBox,CROSSING_ROADS} from './content-r35-scene.js';

// Roof coordinates are in the carrier's untransformed frame. Changing lean
// changes only the rigid assembly rotation, never these coordinates or scale.
export function roofSupport(width,height,imageWidth=500,imageHeight=382){
 const fit=Math.min(width/imageWidth,height/imageHeight),w=imageWidth*fit,h=imageHeight*fit;
 return {x:width/2,y:height-h+h*.075,scale:w*.56/200,paintedWidth:w,paintedHeight:h};
}
export function supportCorners(angle){
 const s=CAKE_SUPPORT,a=angle*Math.PI/180,c=Math.cos(a),n=Math.sin(a);
 const corners=[];
 for(const [l,t,r,b] of [[14,158,158,188],[32,101,140,171],[42,78,130,132],[52,39,120,97],[84,2,114,54]]){
  for(const [x,y] of [[l,t],[r,t],[r,b],[l,b]])corners.push({x:(x-s.pivotX)*c-(y-s.pivotY)*n,y:(x-s.pivotX)*n+(y-s.pivotY)*c});
 }
 return corners;
}

export function renderR40({g,view,scene,miniature,cabin}){
 if(g.kind==='cake'){
  const carrier=scene.querySelector('.content-carrier'),car=carrier.querySelector('.content-car'),holder=carrier.querySelector('.content-cake');
  const roof=roofSupport(car.offsetWidth,car.offsetHeight);
  miniature.style.left=(car.offsetLeft+roof.x-holder.offsetLeft-86)+'px';
  miniature.style.top=(car.offsetTop+roof.y-holder.offsetTop-170)+'px';
  miniature.style.setProperty('--r40-roof-fit',String(roof.scale));
  for(const rigid of scene.querySelectorAll('.cake-miniature .cake-rigid,.cake-closeup .cake-rigid')){
   rigid.style.setProperty('transform',`rotate(${view.angle}deg)`,'important');
   rigid.style.setProperty('transform-origin','86px 170px','important');
  }
  miniature.dataset.roofX=String(car.offsetLeft+roof.x);miniature.dataset.roofY=String(car.offsetTop+roof.y);
 }
 if(g.kind==='tickets'){
  const compare=scene.querySelector('.r30-comparison');
  if(compare&&!compare.hidden){
   compare.querySelector('.r33-compare-title').innerHTML='<span></span><b>你的車票</b><span></span><b>這個月台</b><span></span>';
  }
  if(!cabin.hidden){
   const standing=cabin.querySelector('.r35-standing');
   if(standing){
    const percent=Math.round(g.escortStable/.65*100);
    // Keep the existing escort-button ring as the sole circle; the cabin
    // retains its accessible progressbar and a persistent numerical readout.
    standing.querySelector('svg').remove();
    standing.querySelector('b').textContent=percent+'%・'+(g.escortStable>=.65?'站穩了':g.input.escort?'按住站穩':'已暫停');
   }
  }
 }
 if(g.kind==='crossing'){
  // Keep all people on their pavement; arrived/waiting children occupy the
  // lower pavement, below both traffic lanes, instead of covering the car.
  for(const person of scene.querySelectorAll('.crossing-waiting [data-waiting],.crossing-arrived [data-arrived-friend]')){
   const bottom=parseFloat(person.style.bottom),h=scene.clientHeight;
   const lower=100-bottom>.5*100;
   if(lower)person.style.bottom=Math.max(2400/h,Math.min(bottom,100-CROSSING_ROADS[g.stage].bottom-2-person.offsetHeight/h*100))+'%';
  }
  const zoom=scene.querySelector('.r35-observation');
  if(!zoom.hidden){
   // The existing left/right observation cards already reserve safe space
   // outside the crossing. Put the magnified view inside the observed card.
   const card=scene.closest('#content-r1').querySelector(`.r30-side-views section[data-side="${g.focus}"]`);
   card.dataset.zoom='true';card.append(zoom);
   const pane=zoom.querySelector('.r35-zoom-road'),box=observationBox(view,g.stage,pane.clientWidth,pane.clientHeight),im=pane.querySelector('img');
   pane.dataset.laneTop=String(box.laneTop);pane.dataset.laneBottom=String(box.laneBottom);
   if(im)im.style.cssText=`left:${box.x}px!important;top:${box.top}px!important;width:${box.width}px!important;height:${box.height}px!important;scale:${view.traffic.heading==='right'?1:-1} 1`;
   const stop=pane.querySelector('.r35-zoom-stop');stop.style.cssText=`left:${box.stopX}px;top:${box.stopTop}px;height:${box.stopHeight}px`;
  }
 }
}
