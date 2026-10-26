import {crossingArrivalHint,clearFaceLabel,trainWindow} from './content-r42-scene.js';
const trainAnchors=new WeakMap();

export function renderR42({g,view,dialog,scene,miniature,closeup}){
 if(g.kind==='cake'){
  // One inherited value drives the painted tray and every cake layer in both
  // views. Keep the older upright reference disabled so it cannot mask lean.
  scene.style.setProperty('--r42-cake-angle',view.angle+'deg');
  for(const stack of [miniature,closeup]){
   stack.querySelector('.cake-rigid').style.setProperty('transform','rotate(var(--r42-cake-angle))','important');
   stack.dataset.actualAngle=String(view.angle);
  }
  // Physics can release its recovery latch while the finger still holds the
  // pedal. Keep the physical press visible until pointerup/cancel/blur.
  const brake=dialog.querySelector('[data-action=brake]');
  if(brake)brake.dataset.held=String(!!g.input.brake||brake.getAttribute('aria-pressed')==='true');
 }
 if(g.kind==='crossing'){
  const people=[...scene.querySelectorAll('[data-waiting],[data-arrived-friend],.content-walker')].filter(e=>!e.hidden&&e.getClientRects().length);
  const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};};
  const bounds=rect(scene);
  for(const person of people){
   const label=person.querySelector('.friend-number');
   // These source families share the 400px pose canvas. This generous face
   // band covers the entire head (including the hat), rather than its center.
   const faces=people.filter(e=>e!==person).map(e=>{const b=rect(e.querySelector('img'));return {x:b.x+b.w*.18,y:b.y,w:b.w*.64,h:b.h*.55};});
   const before=rect(label),after=clearFaceLabel(before,faces,bounds);
   label.style.setProperty('margin-left',(after.x-before.x)+'px','important');
   if(after.y!==before.y)label.style.setProperty('margin-top',(after.y-before.y)+'px','important');
  }
  const text=crossingArrivalHint(g);
  if(text){dialog.querySelector('#content-hint').textContent=text;scene.dataset.semanticStatus=text;scene.dataset.stateText=text;}
 }
 if(g.kind==='tickets'){
  const compare=dialog.querySelector('.r30-comparison'),work=dialog.querySelector('.content-work');
  if(innerWidth>innerHeight&&innerHeight<=520&&g.phase==='playing'){
   if(compare.parentElement!==work)work.prepend(compare);
   compare.querySelector('.r33-compare-title').innerHTML='<span></span><b>你的車票</b><span></span><b>這個月台</b><span></span>';
  }else if(compare.parentElement!==scene)scene.append(compare);
  for(const swatch of compare.querySelectorAll('.r32-compare-row .color-dot')){
   swatch.dataset.sample='color-bar';swatch.setAttribute('aria-label',({green:'綠色',blue:'藍色',orange:'橘色'})[swatch.dataset.color]||'待選顏色');
  }
  // All exterior phases share the exact same car, scale and track. Only x
  // advances at departure. Keep this projection independent of the work panel.
  const vehicle=scene.querySelector('.ticket-vehicle');
  const key=g.stage+':'+innerWidth+':'+innerHeight;
  let anchor=trainAnchors.get(g);
  if(!anchor||anchor.key!==key||g.phase==='playing'){
   anchor={key,rail:scene.clientHeight*(innerWidth<=360&&innerHeight>innerWidth?.80:.76)};trainAnchors.set(g,anchor);
  }
  const rail=anchor.rail,width=scene.clientWidth*.64,height=width/2.42;
  vehicle.style.setProperty('width',width+'px','important');
  vehicle.style.setProperty('height',height+'px','important');
  vehicle.style.setProperty('top',(rail-height*.94)+'px','important');
  // Retain the existing approach/departure path and selected platform stop.
  vehicle.style.setProperty('left',(+vehicle.dataset.x*scene.clientWidth/100)+'px','important');
  vehicle.dataset.r42Car='blue-yellow-single';
  const signs=scene.querySelectorAll('.content-stations button');
  for(const sign of signs){
   // Existing targets remain 60px or larger; lift the whole sign clear of
   // the roof, rather than masking a window with an opaque ticket.
   const top=rail-height*.94-6-sign.offsetHeight;
   sign.style.setProperty('top',Math.max(0,top)+'px','important');
   sign.style.setProperty('translate','0 0','important');
  }
  for(const seat of scene.querySelectorAll('.ticket-seated')){
   const w=trainWindow(+seat.dataset.friend,vehicle.dataset.reverse==='true');
   seat.style.cssText=`left:${w.left}%!important;top:${w.top}%!important;width:${w.width}%!important;height:${w.height}%!important;`;
  }
 }
}
