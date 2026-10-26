// Local picture-book assets. No external requests, SDKs or progress changes.
import './art-round5.css';
import './art-round6.css';
import './art-round7.css';
import './art-round8.css';
import {appUrl} from './paths.js';
export function artImage(name,alt='',className=''){
  const r8={logo:'logo',badge:'coast-star','coast-sign':'coast-sign',panel:'ocean-ticket','train-platform':'train-platform','coach-safe-window':'coach-safe-window'};
  const newest=['coach-straight','coach-turn','coach-reward','coach-radio','panel','turn-sign','car-rear','flight-rear','finish-flag','badge','logo'].includes(name);
  const latest=['coach','coach-cheer','car','train','flight','badge','route-badge','mail-badge','confetti','ticket','logo'].includes(name)||/^(coupe|rally|suv|van)-[0-4]$/.test(name);
  const current=['coach','coach-cheer','car','train','flight','badge','flag','station','ticket','logo','carriage-blue','carriage-orange'].includes(name)||/^passenger-\d-\d$/.test(name);
  const img=document.createElement('img');img.src=appUrl(r8[name]?`art/r8/${r8[name]}.png`:`art/${newest?'r7':latest?'r6':current?'r5':'r4'}/${name}.png`);img.alt=alt;img.className=className;img.decoding='async';return img;
}
export function installArt(){
  document.documentElement.classList.add('art-r5','art-r6','art-r7','art-r8');
  const nav=document.querySelector('.academy-nav');
  if(nav)for(const [i,link] of [...nav.querySelectorAll('a')].entries()){
    const label=link.querySelector('span');if(i===0)label.textContent='回學院';link.replaceChildren(artImage(['route-badge','car-rear','train','flight-rear'][i]),label);
  }
  const passport=document.querySelector('.passport-open');if(passport){passport.prepend(artImage('coach'));if(!document.body.dataset.game){const details=document.createElement('span');details.className='student-card-name';passport.append(details);const refresh=()=>{details.textContent=`小小學員 · ${document.querySelector('#star-total')?.textContent||0} 星`;};refresh();addEventListener('studentchange',refresh);}}
  const coach=document.querySelector('.coach-label');
  if(coach)coach.prepend(artImage('coach','阿路教練','coach-avatar'));
  const flightBrand=document.querySelector('body[data-game=flight] #menu .brand');
  if(flightBrand){const tag=document.createElement('div');tag.className='flight-coach';tag.append(artImage('coach','阿路教練'));const text=document.createElement('span');text.textContent='阿路教練陪你飛';tag.append(text);flightBrand.append(tag);}
  if(flightBrand){const tools=document.createElement('div');tools.className='flight-menu-tools';const extra=document.querySelector('.extra-activities'),parent=document.querySelector('.parent-settings');parent.before(tools);tools.append(extra,parent);extra.querySelector('summary').textContent='更多玩法';parent.querySelector('summary').textContent='家長設定';extra.addEventListener('toggle',()=>extra.querySelector('summary').textContent=extra.open?'尋寶／郵差':'更多玩法');parent.addEventListener('toggle',()=>{if(parent.open)extra.open=false;});}
  if(document.body.dataset.game==='car'){
    const intro=document.querySelector('#menu .intro'),hero=document.createElement('div');hero.className='car-hero';
    const picture=artImage('coupe-0','海風 GT 雙門跑車','car-preview-image');picture.id='car-preview-image';hero.append(picture,artImage('coach','阿路教練陪你開車','car-menu-coach'));
    const label=document.createElement('div');label.className='car-hero-label';label.append(document.querySelector('#vehicle-name'),document.querySelector('#vehicle-category'));hero.append(label);intro.append(hero);
    const settings=document.querySelector('#settings-button');settings.setAttribute('aria-label','家長駕駛設定');hero.append(settings);
    const hudCoach=document.createElement('div');hudCoach.className='drive-coach';hudCoach.dataset.pose='straight';hudCoach.append(artImage('coach-safe-window','阿路教練在完整車窗內繫好安全帶'));const cue=document.createElement('span');cue.textContent='一起沿海岸前進';hudCoach.append(cue);document.querySelector('#hud').append(hudCoach);
    const speed=document.createElement('div');speed.className='speed-steps';speed.setAttribute('role','meter');speed.setAttribute('aria-label','行車速度');speed.setAttribute('aria-valuemin','0');speed.setAttribute('aria-valuemax','5');speed.innerHTML='<span>慢慢開</span><div>'+Array.from({length:5},()=>'<i></i>').join('')+'</div>';document.querySelector('.speedometer').append(speed);
    // Secondary equipment stays available in the existing pause surface.
    const equipment=document.createElement('div');equipment.className='pause-equipment';document.querySelector('#pause-overlay .overlay-card').append(equipment);equipment.append(document.querySelector('.tilt-toolbar'),document.querySelector('#camera-button'));
    const star=document.querySelector('#hud-stars>b');star.replaceChildren(artImage('badge'));
    const selected=window.__islandDrive?.getSelected();if(selected){const row=['#3b9297','#eece89','#edeeee','#cf725b','#3c4351'].indexOf(selected.paint);picture.src=appUrl(`art/r6/${selected.vehicleId}-${row}.png`);}
  }
  if(document.body.dataset.game==='flight'){
    const hudCoach=document.createElement('div');hudCoach.className='flying-coach';hudCoach.append(artImage('coach-radio','阿路教練透過無線電指引當前目標'));document.querySelector('.lesson-prompt').prepend(hudCoach);
    document.querySelector('.flight-top .top-actions').prepend(document.querySelector('#instrument-toggle'));
  }
}
