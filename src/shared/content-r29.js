import {ContentLesson as PreviousLesson} from './content-r28.js';
export {FRIEND_NAMES,PASSENGER_NAMES,FRIEND_NUMBERS} from './content-r28.js';
export class ContentLesson extends PreviousLesson {
 constructor(kind,saved={},options={}){super(kind,saved,options);this.layoutSeed=Number.isInteger(saved.layoutSeed)?Math.abs(saved.layoutSeed)%6:0;}
 reset(){super.reset();this.standStillTime=0;this.holdGuideSeen??=false;}
 boardFriend(){const result=super.boardFriend();if(result)this.standStillTime=0;return result;}
 update(seconds){
  if(this.paused)return;
  if(this.kind==='tickets'&&this.phase==='boarding'&&this.doorStage==='boarding'){
   if(this.input.escort)this.holdGuideSeen=true;
   if(this.escortGate&&!this.escortGateReleased)return super.update(seconds);
   if(this.escortGateReleased&&this.standStillTime<.45){
    if(!this.input.escort)this.standStillTime+=Math.min(.05,Math.max(0,seconds));
    return;
   }
  }
  super.update(seconds);
 }
 snapshot(){return {...super.snapshot(),contentVersion:29};}
}
