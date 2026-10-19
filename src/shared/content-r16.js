import {ContentLesson as PreviousLesson,PASSENGER_NAMES} from './content-r15.js';
export {FRIEND_NAMES,PASSENGER_NAMES} from './content-r15.js';

export class ContentLesson extends PreviousLesson {
 reset(){super.reset();this.chosenPassenger=-1;this.choiceHint='';}
 look(side){
  if(this.kind!=='crossing'||this.paused||this.phase!=='playing'||this.speed>.05||this.crossTime>0||this.friendConfirmed||this.crossed===3)return;
  if(side==='right'&&!this.looked.left){this.choiceHint='先看左邊，再看右邊。';return;}
  this.choiceHint='';super.look(side);
 }
 choosePassenger(index){
  if(this.paused||this.phase!=='boarding'||this.doorStage!=='awaiting'||!Number.isInteger(index)||index<0||index>2)return false;
  if(index!==this.boardingIndex){this.chosenPassenger=-1;this.choiceHint=`${PASSENGER_NAMES[this.boardingIndex]}先上車，再輪到你。`;return false;}
  this.chosenPassenger=index;this.choiceHint='';return true;
 }
 boardFriend(){
  if(this.chosenPassenger!==this.boardingIndex)return false;
  const ok=super.boardFriend(this.chosenPassenger);if(ok)this.chosenPassenger=-1;return ok;
 }
 update(seconds){
  if(this.kind!=='cake'){super.update(seconds);return;}
  // R15 keeps the safety stop and input contract. Lower the early outward
  // roll so a correct short press feels safe; only a sustained hold adds risk.
  const before=this.turnHold||0,old=this.balanceLean||0,active=this.phase==='playing'&&!this.paused;
  super.update(seconds);
  if(!active||this.wrongHeld||this.hazardStop)return;
  const correct=this.inBend&&((this.input.right?1:0)-(this.input.left?1:0))===this.bend;
  if(correct){
   const dt=Math.max(0,Math.min(.05,seconds)),desired=-this.bend*(Math.min(9,this.speed*2.6)+Math.max(0,before-1.8)*12);
   this.balanceLean=Math.max(-32,Math.min(32,old+(desired-old)*3*dt));
   this.balanceDanger=Math.abs(this.balanceLean)>=18;this.tilt=this.balanceLean;this.sway=this.balanceLean*.42;this.flagSway=this.balanceLean;
  }
 }
}
