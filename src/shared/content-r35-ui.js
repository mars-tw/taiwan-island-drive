import {boardingScene,holdFeedback,crossingPlayerBox,observationBox} from './content-r35-scene.js';
import {PASSENGER_NAMES} from './content-r35.js';

export function renderR35({g,view,dialog,scene,miniature,closeup,cabin,sideView,image,shape}){
 if(g.kind==='cake'){
  const side=view.warningSide;
  for(const tray of scene.querySelectorAll('.r33-tray')){tray.dataset.warning=side;tray.dataset.edge=String(view.edge);}
  closeup.dataset.warningSide=side;scene.dataset.support=view.support;scene.dataset.stateAngle=String(view.angle);
  // The carrier may translate and scale, but never rotates the cake's frame.
  // Thus CSS rotation, visible vertical reference and degree readout agree.
  for(const b of dialog.querySelectorAll('[data-action^="recover-"]')){
   const push=b.dataset.action.slice(8),correct=push===view.support;
   if(!b.querySelector('.r35-push'))b.querySelector('.steady-icon').outerHTML=`<div class="steady-icon r35-push">${image('art/content-r35/push-hand.png','單手從側邊推向中央')}<svg viewBox="0 0 40 24" aria-hidden="true"><path d="M3 12H34M25 3l10 9-10 9" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;
   b.dataset.push=push;b.dataset.correct=String(correct);b.dataset.wrong=String(!correct&&!!g.input[b.dataset.action]&&!!view.support);
   b.querySelector('span').textContent=push==='right'?'推向右':'推向左';
  }
 }
 if(g.kind==='tickets'&&!cabin.hidden){
  const frames=boardingScene(g),moving=g.doorStage==='boarding',h=holdFeedback(g);
  const waiting=frames.filter(f=>!f.seated&&!(f.current&&moving));
  cabin.innerHTML=`<div class="r33-cabin-caption">${g.selected+1} 號月台 ${shape(g.target)}<span>${g.target.name}車票</span></div><div class="r35-queue"><span>月台等候</span>${waiting.map(f=>`<button data-passenger="${f.index}" aria-label="選${PASSENGER_NAMES[f.index]}" ${f.index===g.boardingIndex?'':'disabled'}>${image('art/content-r33/passenger-'+(f.index+1)+'-standing.png',PASSENGER_NAMES[f.index]+'在月台等候')}<b>${PASSENGER_NAMES[f.index]}</b></button>`).join('')}${!waiting.length?'<b>朋友都進車廂了</b>':''}</div><div class="r32-cabin-art">${image('art/content-r32/train-cabin.webp','右側月台連到門檻，左側是三個座位')}${frames.filter(f=>f.seated||f.current&&moving).map(f=>`<div class="r32-cabin-friend" data-cabin-friend="${f.index}" data-surface="${f.surface}" data-seated="${f.seated}" data-bump="${f.bump}" data-pose="${f.pose}" style="left:${f.x}%;bottom:${f.bottom}%">${image(f.pose==='balancing'?'art/content-r35/passenger-'+(f.index+1)+'-balancing.png':f.seated||f.pose==='standing'?'art/content-r33/passenger-'+(f.index+1)+'-'+f.pose+'.png':'art/r5/passenger-'+(f.index+1)+'-'+f.pose+'.png',PASSENGER_NAMES[f.index]+(f.seated?'坐好了':f.pose==='balancing'?'扶門框停住':f.pose==='standing'?'雙腳站穩':'走進車廂'))}<b>${PASSENGER_NAMES[f.index]}${f.seated?' ✓':''}</b></div>`).join('')}</div><div class="r35-standing" data-waiting="${!!g.escortWaiting&&moving}" data-paused="${!g.input.escort}" data-full="${g.escortStable>=.65}" role="progressbar" aria-label="門檻站穩" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(g.escortStable/.65*100)}"><svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="29"/><circle class="r35-standing-fill" pathLength="100" cx="36" cy="36" r="29" style="stroke-dasharray:${g.escortStable/.65*100} 100"/><text x="36" y="43" text-anchor="middle">${g.escortStable>=.65?'✓':!g.input.escort?'Ⅱ':Math.round(g.escortStable/.65*100)+'%'}</text></svg><b>${g.escortStable>=.65?'站穩了':!g.input.escort?'放開暫停，進度留著':'按住站穩'}</b></div>`;
  // The entire lesson scene is now the cabin; exterior people are hidden by
  // CSS. Each visible person occurs exactly once, in queue, doorway or seat.
  scene.dataset.boardingWaits=String(g.boardingWaits);
 }
 if(g.kind==='tickets'&&g.phase==='playing'){
  const label=scene.querySelector('.r33-compare-title');if(label)label.textContent='這班三位，用同一種車票';
 }
 let zoom=scene.querySelector('.r35-observation');
 if(!zoom){zoom=document.createElement('div');zoom.className='r35-observation';scene.append(zoom);}
 zoom.hidden=g.kind!=='crossing'||g.phase!=='playing'||g.focus==='center'||g.canDepart||g.observationZoom<=0;
 if(g.kind==='crossing'){
  const coach=scene.querySelector('.content-coach'),b=crossingPlayerBox(view,scene.clientWidth,scene.clientHeight);
  coach.style.setProperty('--r35-player-width',b.width+'px');coach.style.setProperty('--r35-player-height',b.height+'px');
  coach.style.setProperty('--r35-player-left',b.centerX-b.width/2+'px');coach.style.setProperty('--r35-player-top',b.centerY-b.height/2+'px');
  coach.style.translate='none';coach.style.scale='1';coach.style.rotate=b.angle+'deg';
  if(!zoom.hidden){
   const side=g.focus,t=view.traffic,car=view.sides[side].car;
   zoom.dataset.side=side;zoom.setAttribute('aria-label',(side==='left'?'左':'右')+'側放大觀察');
   zoom.innerHTML=`<b>${side==='left'?'← 看左邊':'看右邊 →'}・${view.sides[side].road}</b><div class="r35-zoom-road">${car?image('art/content-r29/traffic-car.webp',t.heading==='right'?'下方車道向右來車':'上方車道向左來車'):''}<i class="r35-zoom-stop" ${view.stop.visible&&car?'':'hidden'}></i><span>${view.sides[side].check}</span></div>`;
   zoom.querySelector('.r35-zoom-road').style.backgroundImage=getComputedStyle(scene.querySelector('.crossing-panorama'),'::before').backgroundImage;
   const pane=zoom.querySelector('.r35-zoom-road'),box=observationBox(view,g.stage,pane.clientWidth,pane.clientHeight);
   pane.dataset.laneTop=String(box.laneTop);pane.dataset.laneBottom=String(box.laneBottom);pane.dataset.lane=t.lane;
   const im=zoom.querySelector('img');if(im)im.style.cssText=`left:${box.x}px;top:${box.top}px;width:${box.width}px;height:${box.height}px;scale:${t.heading==='right'?1:-1} 1`;
   const stop=zoom.querySelector('.r35-zoom-stop');stop.style.cssText=`left:${box.stopX}px;top:${box.stopTop}px;height:${box.stopHeight}px`;
  }
  // Show why the four controls are grey after the child starts the car.
  if(g.phase==='departing'){
   const label=dialog.querySelector('[data-action=depart] span');if(label)label.textContent='已出發';
   scene.querySelector('.content-scene-cue').textContent=view.title+'・已出發';
  }
 }
}
