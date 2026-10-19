import {ContentLesson as PreviousLesson} from './content-r16.js';
import {TICKETS} from './content-r1.js';
export {FRIEND_NAMES,PASSENGER_NAMES} from './content-r16.js';

export class ContentLesson extends PreviousLesson {
 get bend(){return super.bend*((this.layoutSeed||0)%2?-1:1);}
 get target(){return TICKETS[(this.stage+(this.layoutSeed||0))%3];}
 reset(){super.reset();this.wrongLook='';}
 look(side){
  if(this.kind==='crossing'&&side==='right'&&!this.looked.left&&this.phase==='playing'&&!this.paused&&this.speed<=.05&&this.crossTime===0&&!this.friendConfirmed){
   this.wrongLook='right';this.choiceHint='你先看了右邊，先看左邊喔。';return;
  }
  super.look(side);if(this.looked.left)this.wrongLook='';
 }
}
