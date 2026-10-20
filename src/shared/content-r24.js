import {ContentLesson as PreviousLesson} from './content-r22.js';
export {FRIEND_NAMES,PASSENGER_NAMES,FRIEND_NUMBERS,LOOK_SEQUENCES} from './content-r22.js';

export class ContentLesson extends PreviousLesson {
 reset(){super.reset();this.wrongRecoveryHeld=false;this.recheckStarted=false;}
 get trafficActive(){
  return this.kind==='crossing'&&this.crossed===0&&((this.observeTraffic&&this.trafficTime<[2.8,3.8,3.2][this.stage])||(this.recheckStarted&&this.recheckTime<3.2));
 }
 look(side){
  if(this.kind==='crossing'&&this.crossed===0&&this.stage===2&&this.lookStep===2&&this.recheckStarted&&this.recheckTime<3.2&&this.phase==='playing'&&!this.paused){this.focus=side;this.choiceHint='車子通過中，留在線後。';return;}
  const before=this.lookStep;super.look(side);
  if(this.crossed>0&&this.stage===2)this.recheckTime=4;
  // Looking right must not teleport an already-visible left-side car back to
  // its entry point. The recheck observes the same continuous traffic pass.
  if(this.stage===2&&before===1&&this.lookStep===2&&!this.recheckStarted){this.recheckStarted=true;this.recheckTime=this.trafficTime;}
 }
 update(seconds){
  if(this.paused)return;
  const dt=Math.max(0,Math.min(.05,seconds)),oldTime=this.recheckTime,waiting=this.recheckStarted&&this.kind==='crossing'&&this.phase==='playing';
  if(this.kind==='cake'&&this.recoveryActive){
   const direction=(this.input['recover-right']?1:0)-(this.input['recover-left']?1:0),wrong=direction*this.balanceLean>0;
   if(wrong&&!this.wrongRecoveryHeld)this.balanceLean=Math.sign(this.balanceLean)*Math.min(32,Math.abs(this.balanceLean)+5);
   this.wrongRecoveryHeld=wrong;
  }else this.wrongRecoveryHeld=false;
  super.update(dt);
  if(waiting)this.recheckTime=oldTime+dt;
  if(this.kind==='crossing'&&this.recheckStarted&&this.recheckTime>=3.2&&this.choiceHint==='車子通過中，留在線後。')this.choiceHint='';
 }
}
