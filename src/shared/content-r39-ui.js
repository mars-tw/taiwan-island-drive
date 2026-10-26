// R39 changes cake presentation only; the R35 physics and other lessons stay intact.
export const CAKE_SUPPORT = Object.freeze({
 width:180,height:180,pivotX:86,pivotY:170,
 baseLeft:32,baseRight:140,baseBottom:171,
 trayLeft:14,trayRight:158,trayTop:170,trayHeight:18,rimWidth:10,
});

export function cakeControls(view,previous='drive'){
 const tilted=Math.abs(view.angle)>=3||view.edge||view.stopped&&view.angle!==0;
 const recovering=previous==='support'&&(view.angle!==0||Math.abs(view.shift)>=.5);
 const mode=tilted||recovering?'support':'drive';
 return {mode,actions:['go','brake',...(mode==='support'?['recover-left','recover-right']:['left','right'])]};
}

const sessions=new WeakMap();
export function renderR39({g,view,dialog,scene,miniature,closeup}){
 if(g.kind!=='cake')return;
 let session=sessions.get(g);
 if(!session){session={mode:'drive',tutorialUsed:false};sessions.set(g,session);}
 // The existing rigid cake is now the sole rotating parent of BOTH the cake
 // and tray. No independent slide can pull the base outside the tray.
 for(const stack of [miniature,closeup]){
  const rigid=stack.querySelector('.cake-rigid');
  if(!rigid.querySelector('.r33-tray')){
   const tray=stack.querySelector('.r33-tray')||document.createElement('div');
   tray.className='r33-tray';tray.setAttribute('aria-hidden','true');rigid.prepend(tray);
  }
  rigid.style.setProperty('--r39-angle',view.angle+'deg');
 }
 const controls=cakeControls({...view,stopped:g.speed<.05},session.mode);session.mode=controls.mode;
 scene.dataset.cakeControls=controls.mode;
 dialog.dataset.cakeControls=controls.mode;
 const firstTutorial=!g.practice&&g.stage===0&&g.previousSeed===undefined&&!session.tutorialUsed;
 if(view.support&&g.input['recover-'+view.support])session.tutorialUsed=true;
 const guided=firstTutorial&&!session.tutorialUsed;
 dialog.dataset.cakeTutorial=String(guided);
 for(const b of dialog.querySelectorAll('#content-controls [data-action]')){
  const action=b.dataset.action;
  if(['go','brake','left','right','recover-left','recover-right'].includes(action)){
   b.hidden=g.phase==='playing'&&!controls.actions.includes(action);
   b.disabled=b.hidden;
   if(b.hidden)g.input[action]=false;
  }
  if(action.startsWith('recover-')){
   b.dataset.correct=String(guided&&action==='recover-'+view.support);
   // Feedback follows the press; neither challenge button reveals the answer.
   b.dataset.needed='false';
  }
 }
 // A neutral challenge must not continue to tell the child to find a lit hand.
 if(g.phase==='playing'){
  const text=view.text.replace('亮起的手，','看蛋糕歪哪邊，').replace('快到托盤邊，','歪得很大，').replace('推回托盤中央','慢慢扶回正').replace('推回中央','慢慢扶回正');
  dialog.querySelector('#content-hint').textContent=text;scene.dataset.stateText=text;
 }
}
