import {ContentLesson as PreviousLesson,FRIEND_NAMES} from './content-r32.js';
import {queueFrame} from './content-r10-scene.js';
export {FRIEND_NAMES,PASSENGER_NAMES,FRIEND_NUMBERS} from './content-r32.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const BOARDING_STOPS=Object.freeze([.69,.86]);

export class ContentLesson extends PreviousLesson {
 reset(){super.reset();this.escortStop=0;this.escortWaiting=false;this.escortStable=0;this.escortBump=0;this.escortMistakes=0;this.escortWasHeld=false;}
 boardFriend(){const ok=super.boardFriend();if(ok){this.escortStop=0;this.escortWaiting=false;this.escortStable=0;this.escortBump=0;this.escortWasHeld=false;}return ok;}
 depart(){
  const ok=super.depart();
  if(!ok&&this.kind==='crossing'){
   this.choiceHint=this.speed>.05?'先煞車停穩。':this.crossTime>0?`等${FRIEND_NAMES[this.crossingPerson]}走到對岸。`:this.trafficActive?`${this.trafficSource==='left'?'左':'右'}邊有車，先等。`:this.staleSide?`車過了，再看${this.staleSide==='left'?'左':'右'}邊。`:this.crossed<3?`等${FRIEND_NAMES[this.crossingPerson]}過街。`:'再看清楚兩邊。';
  }return ok;
 }
 update(seconds){
  const dt=clamp(seconds,0,.05);if(this.paused)return;
  if(this.kind==='tickets'&&this.phase==='boarding'&&this.doorStage==='boarding'){
   this.escortBump=Math.max(0,this.escortBump-dt);
   const newPress=this.input.escort&&!this.escortWasHeld;this.escortWasHeld=!!this.input.escort;
   const start=.1+this.boardingIndex*.31;
   if(this.escortWaiting){
    if(this.input.escort){if(this.escortStable<.65){this.escortStable=0;if(newPress){this.escortBump=.45;this.escortMistakes++;}return;}this.escortWaiting=false;this.escortStop++;this.escortStable=0;}
    else {this.escortStable=Math.min(.65,this.escortStable+dt);return;}
   }
   if(!this.input.escort)return;
   this.holdGuideSeen=true;
   const anchor=BOARDING_STOPS[this.escortStop];
   const p=queueFrame(this.boardTime,this.boardingIndex).progress,next=Math.min(1,p+dt*.27);
   if(anchor!==undefined&&next>=anchor){this.boardTime=start+anchor*.29;this.escortWaiting=true;this.escortGate=true;this.escortGateReleased=false;this.escortStable=0;return;}
   this.boardTime=start+next*.29;
   if(next>=1){this.boardTime=this.boardingIndex===2?1.04:.1+(this.boardingIndex+1)*.31;this.boardingIndex++;this.boardingActive=false;this.doorStage=this.boardingIndex===3?'retract-ready':'awaiting';}
   return;
  }
  super.update(seconds);
  if(this.kind==='cake'&&this.stage===2&&this.distance>=40&&this.distance<54.5){this.speed=Math.min(this.speed,1.65);}
 }
 snapshot(){return {...super.snapshot(),contentVersion:33};}
}
