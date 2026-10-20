// Runs in the rendered document at every capture; inspects all visible text,
// including scene labels, rather than a hand-picked list of outer HUD boxes.
export function inspectLayout(){
 const root=document.querySelector('#content-r1');
 const visible=e=>{for(let x=e;x&&x!==document.body;x=x.parentElement){const s=getComputedStyle(x);if(x.hidden||s.display==='none'||s.visibility==='hidden'||+s.opacity===0)return false;}return !!e.getClientRects().length;};
 const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
 const area=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y));
 const label=e=>(e.id||e.className?.baseVal||e.className||e.tagName)+':'+(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,50);
 const nodes=new Set(),walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){const t=walker.currentNode,e=t.parentElement;if(!t.textContent.trim()||!visible(e)||e.closest('svg'))continue;nodes.add(e.closest('button')||e);}
 for(const e of root.querySelectorAll('button'))if(visible(e))nodes.add(e);
 for(const e of root.querySelectorAll('.content-force,.cake-timing,.content-road-sign,.ticket-counts,.lesson-route-proof'))if(visible(e)&&e.textContent.trim())nodes.add(e);
 const elements=[...nodes].filter(e=>![...nodes].some(p=>p!==e&&p.contains(e)));
 const labels=elements.map(e=>({element:e,id:label(e),...box(e)}));
 const overlaps=[];
 for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const pixels=area(labels[i],labels[j]);if(pixels>.05)overlaps.push({a:labels[i].id,b:labels[j].id,pixels});}
 const iconOverlaps=[];
 for(const b of root.querySelectorAll('#content-controls button'))if(visible(b)){
  const text=b.querySelector('span');if(!text)continue;
  for(const icon of b.querySelectorAll('svg')){const pixels=area(box(icon),box(text));if(pixels>.05)iconOverlaps.push({button:b.dataset.action,icon:icon.classList.contains('hold-progress')?'progress':'glyph',pixels});}
 }
 const signOcclusion=[];
 for(const img of root.querySelectorAll('.boarding-friend img'))if(visible(img))for(const sign of root.querySelectorAll('[data-platform]'))if(visible(sign)){
  const pixels=area(box(img),box(sign));if(pixels>.05)signOcclusion.push({person:img.closest('[data-friend]').dataset.friend,sign:sign.dataset.platform,pixels});
 }
 const counter=root.querySelector('.ticket-counts'),counterOcclusion=[];
 if(counter&&visible(counter)&&counter.textContent.trim())for(const img of root.querySelectorAll('.boarding-friend img,.ticket-seated img'))if(visible(img)){
  const pixels=area(box(img),box(counter));if(pixels>.05)counterOcclusion.push({person:img.closest('[data-friend]').dataset.friend,pixels});
 }
 const car=root.querySelector('.crossing-traffic'),carLabel=car?.querySelector('b');
 let carOffset=null;if(car&&visible(car)&&visible(carLabel)){const a=box(car),b=box(carLabel);carOffset=Math.abs((a.x+a.right-b.x-b.right)/2);}
 const recovery=[...root.querySelectorAll('[data-action^="recover-"]')].map(e=>({action:e.dataset.action,needed:e.dataset.needed,held:e.dataset.held,background:getComputedStyle(e).backgroundColor}));
 return {labels:labels.map(({element,...rest})=>rest),overlaps,iconOverlaps,signOcclusion,counterOcclusion,carOffset,recovery};
}
