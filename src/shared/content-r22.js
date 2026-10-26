import {ContentLesson as PreviousLesson} from './content-r21.js';
export {FRIEND_NAMES,PASSENGER_NAMES,FRIEND_NUMBERS,LOOK_SEQUENCES} from './content-r21.js';

export class ContentLesson extends PreviousLesson {
 reset(){super.reset();this.recheckTime=2;}
 get trafficActive(){return super.trafficActive||(this.kind==='crossing'&&this.stage===2&&this.crossed===0&&this.lookStep>=2&&this.recheckTime<1.4);}
 look(side){
  const before=this.lookStep;
  super.look(side);
  // The third observation is a fresh look. Its status cannot claim completion
  // while the prompt is asking the player to check it again.
  if(this.stage===2&&before===1&&this.lookStep===2){this.looked.left=false;this.recheckTime=0;}
 }
 update(seconds){
  if(!this.paused&&this.kind==='crossing'&&this.phase==='playing'&&this.recheckTime<1.4)this.recheckTime+=Math.max(0,Math.min(.05,seconds));
  super.update(seconds);
 }
}
