import {ContentLesson as PreviousLesson} from './content-r19.js';
export {FRIEND_NAMES,PASSENGER_NAMES} from './content-r19.js';

export const FRIEND_NUMBERS={child:1,bike:2,grandma:3};
export const LOOK_SEQUENCES=[['left','right'],['right','left'],['left','right','left']];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class ContentLesson extends PreviousLesson {
 reset(){super.reset();this.recoveryActive=false;this.recoveryWrong=false;this.lookStep=0;}
 get platforms(){
  // Keep both a same-shape decoy and a same-colour decoy, with a different
  // correct position at each stop. Replay shifts all three again.
  const p=super.platforms,shift=(this.stage+1)%3;
  return p.map((_,i)=>p[(i+shift)%3]);
 }
 get lookSequence(){return LOOK_SEQUENCES[this.stage];}
 look(side){
  if(this.kind!=='crossing'||this.phase!=='playing'||this.paused||!['left','right'].includes(side))return;
  if(this.speed>.05){this.choiceHint='車還在動，先停穩。';return;}
  this.focus=side;
  if(this.friendConfirmed||this.crossTime>0||this.crossed===3){this.choiceHint='';return;}
  const expected=this.lookSequence[this.lookStep];
  if(side!==expected){this.wrongLook=side;this.choiceHint=this.stage===1?'右邊先有車，再看看。':this.stage===2&&this.lookStep===2?'左邊還要再確認。':'左邊先有車，再看看。';return;}
  this.wrongLook='';this.choiceHint='';this.looked[side]=true;this.lookStep++;this.facts[side+'Views']++;
  if(this.lookStep===this.lookSequence.length){this.friendConfirmed=true;this.facts.confirmations++;this.confirmDelay=.65;}
 }
 depart(){const ok=super.depart();if(!ok)this.choiceHint=this.speed>.05?'車還在動。':this.crossed<3?'朋友還在路上，車子留在線後。':'左右還沒看清楚。';return ok;}
 boardFriend(){const ok=super.boardFriend();if(ok)this.input.escort=false;return ok;}
 update(seconds){
  if(this.paused)return;
  const dt=clamp(seconds,0,.05);
  if(this.kind==='tickets'&&this.phase==='boarding'&&this.doorStage==='boarding'&&!this.input.escort)return;
  if(this.kind==='cake'&&this.phase==='playing'){
   const held=this.input.go||this.input.left||this.input.right;
   if(this.recoveryActive||(!held&&Math.abs(this.balanceLean||0)>=3)){
    this.recoveryActive=true;this.recoveryLocked=false;this.speed=0;
    const old=this.balanceLean||0,direction=(this.input['recover-right']?1:0)-(this.input['recover-left']?1:0);
    this.recoveryWrong=direction!==0&&old*direction>0;
    if(old*direction<0)this.balanceLean=Math.sign(old)*Math.max(0,Math.abs(old)-18*dt);
    if(Math.abs(this.balanceLean)<.5){this.balanceLean=0;this.recoveryActive=false;this.hazardStop=false;this.turnHold=0;this.wrongHeld=false;this.wrongTurnNotice=0;this.facts.recoveries++;this.recoveryNotice=1.5;this.release();}
    this.tilt=this.balanceLean;this.sway=this.balanceLean*.42;this.flagSway=this.balanceLean;
    return;
   }
  }
  const crossed=this.crossed;
  super.update(dt);
  if(this.kind==='cake'){
   this.recoveryLocked=false;
   if(this.hazardStop){this.recoveryActive=true;this.release();this.speed=0;}
  }
  if(this.kind==='crossing'&&this.crossed!==crossed){this.lookStep=0;this.choiceHint='';this.wrongLook='';}
 }
}
