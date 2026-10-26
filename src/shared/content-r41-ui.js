import {pavementLocation,arrivedCount,wrongSupportText,observationState,observationProjection,LANDING_PROGRESS,PAVEMENTS} from './content-r41-scene.js';

// Alpha canvas foot baselines are shared by each pose family (400px canvas).
// The geometry verifier independently reads the actual source alpha pixels.
function place(person,pos,scene){
 const im=person.querySelector('img'),bike=im.getAttribute('src').includes('bike-walk');
 const sourceW=bike?384:420,sourceH=bike?384:400;
 const alphaBottom=bike?384:im.getAttribute('src').includes('waiting')?380:375;
 const fit=Math.min(person.clientWidth/sourceW,person.clientHeight/sourceH);
 const gap=(sourceH-alphaBottom)*fit;
 person.style.left=pos.x+'%';
 person.style.bottom=((100-pos.y)*scene.clientHeight/100-gap)+'px';
 // Nested percentage layers and object-fit can have fractional box sizes.
 // Align the painted alpha baseline, rather than the rounded clientHeight.
 const b=im.getBoundingClientRect(),s=scene.getBoundingClientRect();
 const actualFit=Math.min(b.width/sourceW,b.height/sourceH);
 const actualFoot=b.bottom-(sourceH-alphaBottom)*actualFit;
 const target=s.y+scene.clientTop+scene.clientHeight*pos.y/100;
 person.style.bottom=(parseFloat(person.style.bottom)+actualFoot-target)+'px';
 person.dataset.footX=String(pos.x);person.dataset.footY=String(pos.y);
}
export function renderR41({g,view,dialog,scene,sideView}){
 if(g.kind==='cake'&&g.phase==='playing'){
  const text=wrongSupportText(view,g.input);
  if(text){dialog.querySelector('#content-hint').textContent=text;scene.dataset.stateText=text;}
  // Reuse the six contextual buttons; only four are visible. The two modes
  // occupy exactly the same grid cells, so a held pedal never moves.
  for(const b of dialog.querySelectorAll('#content-controls [data-action]')){
   const col={left:1,'recover-left':1,right:2,'recover-right':2,go:3,brake:4}[b.dataset.action];
   if(col){b.style.setProperty('grid-column',String(col),'important');b.style.setProperty('grid-row','1','important');}
  }
 }
 if(g.kind!=='crossing')return;
 for(const person of scene.querySelectorAll('[data-waiting],[data-arrived-friend]')){
  const waiting=!!person.dataset.waiting;
  place(person,pavementLocation(person.dataset.waiting||person.dataset.arrivedFriend,waiting?'waiting':'arrived',0,g.stage,g.crossingOrder),scene);
 }
 const walker=scene.querySelector('.content-walker'),p=g.crossTime/g.crossingDuration;
 if(!walker.hidden){
  place(walker,pavementLocation(g.crossingPerson,'crossing',p,g.stage,g.crossingOrder),scene);
  walker.dataset.landed=String(p>=LANDING_PROGRESS);
 }
 for(const person of scene.querySelectorAll('[data-waiting],[data-arrived-friend],.content-walker[data-landed=true]')){
  const name=person.querySelector('.friend-number');if(!name)continue;
  const strip=PAVEMENTS[g.stage][person.dataset.waiting?'near':'far'],s=scene.getBoundingClientRect();
  const target=s.y+scene.clientTop+(strip[1]-.2)*scene.clientHeight/100;
  const current=parseFloat(getComputedStyle(name).bottom)||0;
  name.style.setProperty('bottom',(current+name.getBoundingClientRect().bottom-target)+'px','important');
 }
 const landed=arrivedCount(g);
 scene.dataset.arrivedCount=String(landed);
 scene.querySelector('.content-observe').textContent=`已到對岸 ${landed}/3 人`;
 // Both cards always use the same original-road crop. The old expiring
 // magnifier can no longer replace a stopped-car card with a different view.
 const zoom=dialog.querySelector('.r35-observation');if(zoom)zoom.hidden=true;
 if(sideView.hidden)return;
 for(const card of sideView.querySelectorAll('section[data-side]')){
  const side=card.dataset.side,state=observationState(view,side),thumb=card.querySelector('.r32-road-thumb');
  card.dataset.observationState=state;
  card.querySelector('b').textContent=(side==='left'?'← 左邊':'右邊 →')+'・'+({unseen:'還沒看',approaching:'車正在接近',stopped:'車停在線前',clear:'路面淨空'}[state]);
  thumb.style.setProperty('background-image',state==='unseen'?'none':getComputedStyle(scene.querySelector('.crossing-panorama'),'::before').backgroundImage,'important');
  const box=observationProjection(view,g.stage,thumb.clientWidth,thumb.clientHeight),im=thumb.querySelector('img');
  thumb.dataset.laneTop=String(box.laneTop);thumb.dataset.laneBottom=String(box.laneBottom);
  thumb.style.setProperty('--r41-stop-x',view.stop.x+'%');
  thumb.style.setProperty('--r41-stop-top',(box.laneTop+2)+'px');
  thumb.style.setProperty('--r41-stop-height',Math.max(0,box.laneBottom-box.laneTop-4)+'px');
  if(im){im.style.cssText=`left:${box.x}px!important;top:${box.top}px!important;width:${box.width}px!important;height:${box.height}px!important;scale:${view.traffic.heading==='right'?1:-1} 1!important`;}
 }
}
