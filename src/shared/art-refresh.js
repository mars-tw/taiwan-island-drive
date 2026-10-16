// Local picture-book assets. No external requests, SDKs or progress changes.
import './art-round5.css';
import {appUrl} from './paths.js';
export function artImage(name,alt='',className=''){
  const current=['coach','coach-cheer','car','train','flight','badge','flag','station','ticket','logo','carriage-blue','carriage-orange'].includes(name)||/^passenger-\d-\d$/.test(name);
  const img=document.createElement('img');img.src=appUrl(`art/${current?'r5':'r4'}/${name}.png`);img.alt=alt;img.className=className;img.decoding='async';return img;
}
export function installArt(){
  document.documentElement.classList.add('art-r5');
  const nav=document.querySelector('.academy-nav');
  if(nav)for(const [i,link] of [...nav.querySelectorAll('a')].entries()){
    const label=link.querySelector('span');link.replaceChildren(artImage(['badge','car','train','flight'][i]),label);
  }
  const passport=document.querySelector('.passport-open');if(passport){passport.prepend(artImage('coach'));if(!document.body.dataset.game){const details=document.createElement('span');details.className='student-card-name';passport.append(details);const refresh=()=>{details.textContent=`小小學員 · ${document.querySelector('#star-total')?.textContent||0} 星`;};refresh();addEventListener('studentchange',refresh);}}
  const coach=document.querySelector('.coach-label');
  if(coach)coach.prepend(artImage('coach','阿路教練','coach-avatar'));
  const flightBrand=document.querySelector('body[data-game=flight] #menu .brand');
  if(flightBrand){const tag=document.createElement('div');tag.className='flight-coach';tag.append(artImage('coach','阿路教練'));const text=document.createElement('span');text.textContent='阿路教練陪你飛';tag.append(text);flightBrand.append(tag);}
}
