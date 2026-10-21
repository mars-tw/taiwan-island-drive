import {ContentLesson as PreviousLesson} from './content-r33.js';
import {queueFrame} from './content-r10-scene.js';
export {FRIEND_NAMES,PASSENGER_NAMES,FRIEND_NUMBERS} from './content-r33.js';

export const BOARDING_STOP=.69;
export const STAND_HOLD_SECONDS=.65;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class ContentLesson extends PreviousLesson {
 reset(){super.reset();this.escortReadyTime=0;this.boardingWaits=0;this.observationZoom=0;}
 look(side){super.look(side);if(this.kind==='crossing'&&this.speed<=.05&&this.phase==='playing'&&!this.paused&&['left','right'].includes(side))this.observationZoom=1.4;}
 boardFriend(){const ok=super.boardFriend();if(ok)this.escortReadyTime=0;return ok;}
 update(seconds){
  if(this.paused)return;
  if(this.kind==='crossing')this.observationZoom=Math.max(0,this.observationZoom-clamp(seconds,0,.05));
  if(this.kind!=='tickets'||this.phase!=='boarding'||this.doorStage!=='boarding')return super.update(seconds);
  const dt=clamp(seconds,0,.05),held=!!this.input.escort;
  this.escortBump=Math.max(0,this.escortBump-dt);
  if(this.escortWaiting){
   // One rule, one stop per passenger: hold to fill, release to freeze.
   // Neither walking nor the standing meter advances while released.
   if(!held){
    if(this.escortWasHeld&&this.escortStable<STAND_HOLD_SECONDS){this.escortBump=.6;this.escortMistakes++;}
    this.escortWasHeld=false;return;
   }
   this.escortWasHeld=true;
   if(this.escortStable<STAND_HOLD_SECONDS){this.escortStable=Math.min(STAND_HOLD_SECONDS,this.escortStable+dt);return;}
   // Briefly display the full ring and planted-feet pose before continuing.
   this.escortReadyTime+=dt;if(this.escortReadyTime<.25)return;
   this.escortWaiting=false;this.escortStop=1;
  }
  this.escortWasHeld=held;if(!held)return;
  this.holdGuideSeen=true;
  const start=.1+this.boardingIndex*.31,p=queueFrame(this.boardTime,this.boardingIndex).progress,next=Math.min(1,p+dt*.27);
  if(this.escortStop===0&&next>=BOARDING_STOP){
   this.boardTime=start+BOARDING_STOP*.29;this.escortWaiting=true;this.escortStable=0;this.escortReadyTime=0;this.boardingWaits++;return;
  }
  this.boardTime=start+next*.29;
  if(next>=1){
   this.boardTime=this.boardingIndex===2?1.04:.1+(this.boardingIndex+1)*.31;
   this.boardingIndex++;this.boardingActive=false;this.doorStage=this.boardingIndex===3?'retract-ready':'awaiting';
  }
 }
 // The save protocol remains compatible with existing completed journeys.
 snapshot(){return {...super.snapshot(),contentVersion:33};}
}
