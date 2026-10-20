import {ContentLesson as PreviousLesson} from './content-r17.js';
export {FRIEND_NAMES,PASSENGER_NAMES} from './content-r17.js';

export class ContentLesson extends PreviousLesson {
 reset(){super.reset();this.recoveryLocked=false;}
 update(seconds){
  // Ignore a held pointer until it has actually been released after a tray stop.
  if(this.kind==='cake'&&this.phase==='playing'&&!this.paused){
   if(this.recoveryLocked&&!this.input.go&&!this.input.left&&!this.input.right&&!this.hazardStop)this.recoveryLocked=false;
  }
  super.update(seconds);
  if(this.kind==='cake'&&this.hazardStop)this.recoveryLocked=true;
 }
}
