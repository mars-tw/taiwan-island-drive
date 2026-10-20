import {ContentLesson as PreviousLesson} from './content-r18.js';
export {FRIEND_NAMES,PASSENGER_NAMES} from './content-r18.js';

export class ContentLesson extends PreviousLesson {
 reset(){super.reset();this.arrivalNotice=0;this.lastArrived='';}
 look(side){
  // Once the ordered first observations are complete, looking remains a real
  // action while waiting. It never confirms another friend or changes counts.
  if(this.kind==='crossing'&&this.phase==='playing'&&!this.paused&&this.speed<=.05&&['left','right'].includes(side)&&this.looked.left&&this.looked.right){this.focus=side;this.choiceHint='';return;}
  super.look(side);
 }
 update(seconds){
  if(this.paused)return;
  const before=this.crossed,who=this.crossingPerson;
  super.update(seconds);
  if(this.kind==='cake'&&this.phase==='playing'){
   const held=this.input.go||this.input.left||this.input.right;
   if(!held&&Math.abs(this.balanceLean||0)>=3)this.recoveryLocked=true;
   if(!held&&!this.hazardStop&&Math.abs(this.balanceLean||0)<3)this.recoveryLocked=false;
  }
  this.arrivalNotice=Math.max(0,this.arrivalNotice-Math.min(.05,Math.max(0,seconds)));
  if(this.kind==='crossing'&&this.crossed>before){this.lastArrived=who;this.arrivalNotice=.85;}
 }
}
