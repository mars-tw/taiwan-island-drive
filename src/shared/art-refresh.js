// Local picture-book assets. No external requests, SDKs or progress changes.
import {appUrl} from './paths.js';
export function artImage(name,alt='',className=''){
  const img=document.createElement('img');img.src=appUrl(`art/r4/${name}.png`);img.alt=alt;img.className=className;img.decoding='async';return img;
}
export function installArt(){
  const nav=document.querySelector('.academy-nav');
  if(nav)for(const [i,link] of [...nav.querySelectorAll('a')].entries()){
    const label=link.querySelector('span');link.replaceChildren(artImage(['badge','car','train','flight'][i]),label);
  }
  const passport=document.querySelector('.passport-open');if(passport)passport.prepend(artImage('bag'));
  const coach=document.querySelector('.coach-label');
  if(coach)coach.prepend(artImage('coach','阿路教練','coach-avatar'));
  const flightBrand=document.querySelector('body[data-game=flight] #menu .brand');
  if(flightBrand){const tag=document.createElement('div');tag.className='flight-coach';tag.append(artImage('coach','阿路教練'));const text=document.createElement('span');text.textContent='阿路教練陪你飛';tag.append(text);flightBrand.append(tag);}
}
