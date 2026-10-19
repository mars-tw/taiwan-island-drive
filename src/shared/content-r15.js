import {ContentLesson as PreviousLesson} from './content-r1.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const FRIEND_NAMES={child:'小朋友',bike:'腳踏車',grandma:'奶奶'};
export const PASSENGER_NAMES=['小安','小晴','小宇'];

// Keep the historical simulation contract for older lessons/tests. The live
// lessons use explicit player decisions instead of advancing a timed playlist.
export class ContentLesson extends PreviousLesson{
 constructor(kind,saved={},options={}){
  super(kind,saved,options);
  this.layoutSeed=Number.isInteger(saved?.layoutSeed)?Math.abs(saved.layoutSeed)%3:0;
  // The superclass restores a completed train before the layout seed exists.
  if(this.completed&&kind==='tickets')this.reset();
 }
 reset(){
  super.reset();this.hazardStop=false;this.wrongTurnNotice=0;this.wrongHeld=false;
  this.turnHold=0;this.boardingIndex=0;this.boardingActive=false;this.doorStage='closed';
 }
 snapshot(){return {...super.snapshot(),layoutSeed:this.layoutSeed};}
 get platforms(){const p=super.platforms,seed=this.layoutSeed||0;return p.map((_,i)=>p[(i+seed)%3]);}
 get inBend(){return this.kind==='cake'&&this.distance>=15&&this.distance<40;}
 look(side){
  if(this.kind!=='crossing'||this.phase!=='playing'||this.paused||this.speed>.05||this.crossTime>0||this.friendConfirmed||this.crossed===3)return;
  if(side!==(this.looked.left?'right':'left'))return;
  this.focus=side;this.looked[side]=true;this.facts[side+'Views']++;
  if(this.looked.left&&this.looked.right){this.friendConfirmed=true;this.facts.confirmations++;this.confirmDelay=.65;}
  this.hint='';
 }
 door(){
  if(!super.door())return false;
  this.boardTime=0;this.boardingIndex=0;this.boardingActive=false;this.doorStage='opening';return true;
 }
 boardFriend(index=this.boardingIndex){
  if(this.paused||this.phase!=='boarding'||this.doorStage!=='awaiting'||index!==this.boardingIndex)return false;
  this.boardingActive=true;this.doorStage='boarding';return true;
 }
 retractStep(){
  if(this.paused||this.phase!=='boarding'||this.doorStage!=='retract-ready')return false;
  this.stepRequested=true;this.doorStage='retracting';return true;
 }
 closeDoor(){
  if(this.paused||this.phase!=='boarding'||this.doorStage!=='close-ready')return false;
  this.doorStage='closing';return true;
 }
 departTrain(){
  if(this.paused||this.doorStage!=='closed')return false;
  return super.departTrain();
 }
 wrongTurn(side){
  if(!this.inBend||this.phase!=='playing'||this.paused||!['left','right'].includes(side)||(side==='right'?1:-1)===this.bend)return false;
  this.speed=0;this.balanceLean=-this.bend*Math.min(32,Math.abs(this.balanceLean||0)+12);
  this.wrongTurnNotice=1.5;this.wrongHeld=true;this.balanceCorrected=true;return true;
 }
 update(seconds){
  if(this.paused||!['playing','boarding','departing','delivering'].includes(this.phase))return;
  const dt=clamp(seconds,0,.05);
  if(this.phase==='boarding'){
   if(this.doorStage==='opening'){
    this.boardTime=Math.min(.1,this.boardTime+dt*.3);
    if(this.boardTime===.1)this.doorStage='awaiting';
   }else if(this.doorStage==='boarding'){
    const end=this.boardingIndex===2?1.04:.1+(this.boardingIndex+1)*.31;
    this.boardTime=Math.min(end,this.boardTime+dt*.3);
    if(this.boardTime===end){this.boardingIndex++;this.boardingActive=false;this.doorStage=this.boardingIndex===3?'retract-ready':'awaiting';}
   }else if(this.doorStage==='retracting'){
    this.boardTime=Math.min(1.2,this.boardTime+dt*.3);
    if(this.boardTime===1.2)this.doorStage='close-ready';
   }else if(this.doorStage==='closing'){
    this.boardTime=Math.min(1.4,this.boardTime+dt*.3);
    if(this.boardTime===1.4)this.doorStage='closed';
   }
   return;
  }
  if(this.phase==='departing'||this.phase==='delivering'){
   this.departureTime+=dt;
   if(this.departureTime>=1.5){if(this.kind==='tickets')this.facts.boarded+=3;this.checkpoint();}
   return;
  }
  if(this.kind!=='cake'){super.update(dt);return;}
  const old=this.balanceLean||0,before=this.speed,turn=this.inBend;
  const direction=(this.input.right?1:0)-(this.input.left?1:0);
  const wrong=turn&&direction!==0&&direction!==this.bend;
  const correct=turn&&direction===this.bend;
  if(wrong&&!this.wrongHeld)this.wrongTurn(direction>0?'right':'left');
  if(!wrong)this.wrongHeld=false;
  this.wrongTurnNotice=Math.max(0,this.wrongTurnNotice-dt);
  const held=this.input.go||this.input.left||this.input.right;
  if(this.hazardStop&&!held&&Math.abs(old)<3){this.hazardStop=false;this.turnHold=0;}
  if(correct&&held&&!this.hazardStop)this.turnHold+=dt;
  if(!held)this.turnHold=Math.max(0,this.turnHold-dt*2);
  const advancing=turn?correct&&!wrong:this.input.go;
  const target=advancing&&!this.hazardStop?(turn?3.6:this.approach?4:6):0;
  const acceleration=this.input.brake?-6:this.hazardStop?-3:(target-this.speed)*1.8;
  this.speed=clamp(this.speed+acceleration*dt,0,6);if(this.speed<.04)this.speed=0;
  if(wrong)this.speed=0;
  this.acceleration=(this.speed-before)/Math.max(dt,.0001);
  this.steer+=(direction-this.steer)*Math.min(1,dt*5);
  if(!wrong){
   const outward=-this.bend;
   const desired=!held?0:this.hazardStop?(Math.sign(old)||outward)*32:
    correct?outward*(Math.min(22,this.speed*5.6)+Math.max(0,this.turnHold-1.8)*10):
    this.stage===0&&this.distance<15?-this.acceleration*3.2:0;
   this.balanceLean=clamp(old+(desired-old)*(held?3:1.7)*dt,-32,32);
  }
  if(Math.abs(this.balanceLean)>=24&&!this.hazardStop){this.hazardStop=true;this.facts.assists++;this.balanceCorrected=true;}
  this.assisting=this.hazardStop;this.balanceDanger=Math.abs(this.balanceLean)>=18;
  if(Math.abs(old)>=5&&!held)this.balanceCorrected=true;
  if(this.balanceCorrected&&Math.abs(old)>=3&&Math.abs(this.balanceLean)<3){this.facts.recoveries++;this.balanceCorrected=false;this.recoveryNotice=1.5;}
  this.recoveryNotice=Math.max(0,(this.recoveryNotice||0)-dt);
  this.tilt=this.balanceLean;this.sway=this.balanceLean*.42;this.flagSway=this.balanceLean;
  if(this.speed>1&&this.distance<15)this.smooth.start+=dt;
  if(correct&&this.speed>1&&!this.hazardStop){this.smooth.turn+=dt;this.turns[this.bend>0?'right':'left']+=dt;}
  if(this.input.brake&&before>.1)this.smooth.stop+=dt;
  if(this.stage===2&&this.distance>=42&&this.input.brake&&this.speed===0&&!this.bayStopped){this.bayStopped=true;this.facts.bayStops++;}
  if(this.bayStopped&&this.input.go&&!this.input.brake&&this.speed>.3&&!this.bayRestarted){this.bayRestarted=true;this.facts.bayRestarts++;}
  // A direction decision is required at both bend entries, including while
  // coasting. An incorrect key can never carry residual velocity forward.
  if(!wrong&&!this.hazardStop&&(!turn||correct)){
   const next=this.distance+this.speed*dt;
   this.distance=Math.min(55,!turn&&this.distance<15?Math.min(15,next):this.stage===1&&this.distance<=29?Math.min(29.01,next):turn?Math.min(40,next):next);
  }
  if(this.stage===2&&!this.bayStopped)this.distance=Math.min(47,this.distance);
  if(this.distance>=55&&this.speed===0&&!held&&Math.abs(this.balanceLean)<3){this.phase='delivering';this.departureTime=0;this.release();}
 }
}
