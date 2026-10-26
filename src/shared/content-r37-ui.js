import {playerBox,PLAYER_ART,PLAYER_APPEARANCE,CROSSING_ROADS} from './content-r37-scene.js';
export function renderR37({g,view,scene,appUrl}){
 if(g.kind!=='crossing')return;
 const traffic=scene.querySelector('.crossing-traffic'),line=scene.querySelector('.r33-stop-line');
 traffic.hidden=g.phase!=='playing'||!view.traffic.visible;
 line.hidden=!view.stop.visible||!view.traffic.visible;
 for(const side of ['left','right']){
  let veil=scene.querySelector('.r37-sight[data-side='+side+']');
  if(!veil){veil=document.createElement('div');veil.className='r37-sight';veil.dataset.side=side;veil.innerHTML='<span>'+(side==='left'?'← 看左邊':'看右邊 →')+'</span>';scene.append(veil);}
  const road=CROSSING_ROADS[g.stage];
  veil.style.top=road.top+'%';veil.style.height=(road.bottom-road.top)+'%';
  veil.hidden=!['playing','departing'].includes(g.phase)||view.sides[side].observed;
  veil.setAttribute('aria-label',(side==='left'?'左':'右')+'側還沒看');
 }
 const coach=scene.querySelector('.content-coach'),b=playerBox(view,scene.clientWidth,scene.clientHeight);
 coach.src=appUrl(PLAYER_ART);coach.dataset.appearanceId=PLAYER_APPEARANCE;
 coach.alt='你的深藍色阿路車';
 for(const [key,value] of Object.entries({width:b.width,height:b.height,left:b.centerX-b.width/2,top:b.centerY-b.height/2}))coach.style.setProperty('--r35-player-'+key,value+'px');
 coach.style.rotate=b.angle+'deg';
 let badge=scene.querySelector('.r37-you');
 if(!badge){badge=document.createElement('b');badge.className='r37-you';badge.textContent='你';scene.append(badge);}
 badge.hidden=!['playing','departing'].includes(g.phase);
 badge.style.left=Math.min(scene.clientWidth-16,b.centerX)+'px';badge.style.top=(b.centerY-b.height/2-21)+'px';
 const walker=scene.querySelector('.content-walker');
 if(!walker.hidden){const progress=document.createElement('span');progress.className='r37-cross-progress';progress.setAttribute('role','progressbar');progress.setAttribute('aria-label','走到對岸');progress.setAttribute('aria-valuenow',String(Math.round(view.crossingProgress*100)));progress.style.setProperty('--cross-progress',view.crossingProgress*100+'%');walker.append(progress);}
}
