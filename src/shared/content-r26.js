import {ContentLesson as PreviousLesson} from './content-r24.js';
export {FRIEND_NAMES,PASSENGER_NAMES,FRIEND_NUMBERS} from './content-r24.js';
export class ContentLesson extends PreviousLesson {
 reset(){super.reset();this.escortStarted=false;this.bayRestTime=0;}
 boardFriend(){const ok=super.boardFriend();if(ok)this.escortStarted=false;return ok;}
 update(seconds){
  if(this.paused)return;
  if(this.input.escort&&this.doorStage==='boarding')this.escortStarted=true;
  if(this.kind==='cake'&&this.bayStopped&&!this.bayRestarted&&!this.recoveryActive){this.bayRestTime+=Math.min(.05,Math.max(0,seconds));if(this.bayRestTime<.6)this.input.go=false;}
  const escort=this.kind==='tickets'&&this.phase==='boarding'&&this.doorStage==='boarding';
  super.update(escort?seconds*Math.min(1,(this.boardingRate||.3)/.3):seconds);
 }
}
