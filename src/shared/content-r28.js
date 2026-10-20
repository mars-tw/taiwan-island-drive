import {ContentLesson as PreviousLesson} from './content-r27.js';
import {queueFrame} from './content-r10-scene.js';
export {FRIEND_NAMES,PASSENGER_NAMES,FRIEND_NUMBERS} from './content-r27.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// The live R28 simulation is separate from the preserved historical contracts.
export class ContentLesson extends PreviousLesson {
 constructor(kind,saved={},options={}){
  super(kind,saved,options);
  this.visited=Array.isArray(saved.visited)?[...new Set(saved.visited.filter(n=>Number.isInteger(n)&&n>=0&&n<3))]:saved.completed?[0,1,2]:Array.from({length:this.stage},(_,i)=>i);
 }
 reset(){super.reset();this.mistakes={};this.lastMistake='';this.trafficConfirmed=false;this.viewVisit={left:false,right:false};this.escortGate=false;this.escortGateReleased=false;this.recoveryIntro=0;this.forceTarget=0;this.forceLag=0;this.recoveryRate=0;this.restReady=false;this.wasRecovering=false;this.correctionPending=false;}
 get decisionKey(){return [this.kind,this.stage,this.kind==='cake'?(this.recoveryActive?'balance':this.inBend?this.distance>29?'bend2':'bend1':'road'):this.kind==='tickets'?'platform':this.crossed+':'+this.lookStep].join(':');}
 get hintLevel(){return Math.min(3,this.mistakes?.[this.decisionKey]||0);}
 get showHint(){return this.hintLevel>=3;}
 askHint(){this.mistakes[this.decisionKey]=(this.mistakes[this.decisionKey]||0)+1;}
 mistake(){this.askHint();}
 get bend(){const first=[1,-1,1][this.stage]*((this.layoutSeed||0)%2?-1:1);return this.stage===1&&this.distance>29?-first:first;}
 get trafficSource(){const first=this.stage===1?'right':'left';return (this.layoutSeed||0)%2?(first==='left'?'right':'left'):first;}
 get lookSequence(){const first=this.trafficSource,other=first==='left'?'right':'left';return this.stage===2?[first,other,first]:[first,other];}
 get target(){const target=super.target;if(!(this.layoutSeed||0))return target;const colors=['blue','orange','green'],color=colors[(colors.indexOf(target.color)+this.layoutSeed)%3],names={blue:'藍',orange:'橘',green:'綠'};return {...target,color,name:names[color]+{circle:'圓形',triangle:'三角形',square:'正方形'}[target.shape]};}
 get canDepart(){return super.canDepart&&!this.trafficActive&&this.trafficConfirmed;}
 chooseStage(index){if(this.phase!=='ready'||!Number.isInteger(index)||index<0||index>2)return false;this.stage=index;this.reset();return true;}
 snapshot(){const s=super.snapshot();return {...s,stage:this.phase==='checkpoint'?this.nextStage:this.stage,visited:[...(this.visited||[])],contentVersion:28};}
 get nextStage(){return [1,2,3].map(i=>(this.stage+i)%3).find(n=>!this.visited.includes(n))??0;}
 checkpoint(){for(const k of Object.keys(this.skills))this.skills[k]||=this.smooth[k]>.25;this.visited||=[];if(!this.visited.includes(this.stage))this.visited.push(this.stage);this.release();this.completed=this.visited.length===3;this.phase=this.completed?'done':'checkpoint';}
 next(){if(this.phase!=='checkpoint')return;this.stage=this.nextStage;this.reset();this.begin();}
 select(index){const valid=this.kind==='tickets'&&this.phase==='playing'&&!this.paused&&this.speed<=.05&&Number.isInteger(index)&&index>=0&&index<3,previous=this.selected,wasWrong=previous>=0&&!this.matched,count=this.facts.reselections,level=this.hintLevel;super.select(index);if(valid&&wasWrong&&previous!==index&&this.facts.reselections===count)this.facts.reselections++;if(valid&&!this.matched)this.mistakes[this.decisionKey]=level+1;}
 look(side){
  if(this.kind!=='crossing'||this.phase!=='playing'||this.paused||!['left','right'].includes(side))return;
  if(this.speed>.05){this.choiceHint='先停穩，再看。';return;}
  this.focus=side;this.viewVisit[side]=true;
  if(this.trafficActive&&side===this.trafficSource)this.trafficConfirmed=true;
  if(this.friendConfirmed||this.crossTime>0||this.crossed===3){this.choiceHint='';return;}
  if(this.stage===2&&this.lookStep===2&&this.trafficActive){this.choiceHint='來車還沒過完，先等。';return;}
  if(side!==this.lookSequence[this.lookStep]){this.mistake();this.wrongLook=side;this.choiceHint=this.hintLevel===1?'看看還沒確認的那一邊。':`再看${this.lookSequence[this.lookStep]==='left'?'左':'右'}邊。`;return;}
  this.looked[side]=true;this.lookStep++;this.facts[side+'Views']++;this.choiceHint='';this.wrongLook='';
  if(this.stage===2&&this.lookStep===2)this.looked[this.trafficSource]=false;
  if(this.lookStep===this.lookSequence.length){this.friendConfirmed=true;this.confirmDelay=.65;this.facts.confirmations++;}
 }
 depart(){if(this.kind==='crossing'&&!this.canDepart){this.mistake();this.stopNotice=1;this.facts.blockedStarts++;this.choiceHint=this.trafficActive?'還有車，先停住。':'再看清楚，等朋友過完。';return false;}return super.depart();}
 update(seconds){
  if(this.paused)return;const dt=clamp(seconds,0,.05);
  if(this.kind==='cake'){this.updateCake(dt);return;}
  if(this.kind==='tickets'&&this.phase==='boarding'&&this.doorStage==='boarding'){
   const p=queueFrame(this.boardTime,this.boardingIndex).progress;
   if(p>=.69&&!this.escortGateReleased){this.escortGate=true;if(!this.input.escort)this.escortGateReleased=true;return;}
   this.escortGate=false;
   const rate=p<.35?1:p<.82?.48:.72;
   super.update(dt*rate);return;
  }
  const before=this.crossed;super.update(dt);
  if(this.kind==='crossing'&&this.crossed!==before){this.lookStep=0;this.viewVisit={left:false,right:false};}
 }
 boardFriend(){const ok=super.boardFriend();if(ok){this.escortGate=false;this.escortGateReleased=false;}return ok;}
 updateCake(dt){
  if(!['playing','delivering'].includes(this.phase))return;
  if(this.phase==='delivering'){this.departureTime+=dt;if(this.departureTime>=1.5)this.checkpoint();return;}
  const old=this.balanceLean||0,before=this.speed,turn=this.inBend,direction=(this.input.right?1:0)-(this.input.left?1:0),correct=turn&&direction===this.bend;
  const wrong=turn&&direction!==0&&!correct,held=this.input.go||correct;
  if(wrong&&!this.wrongHeld){this.mistake();this.wrongTurnNotice=1.3;}this.wrongHeld=wrong;this.wrongTurnNotice=Math.max(0,this.wrongTurnNotice-dt);
  const resting=this.bayStopped&&!this.bayRestarted;
  const target=this.input.go&&(!turn||correct)?6:correct?4.8:0;
  const accel=this.input.brake?-5.2:resting&&!this.restReady?-5:(target-this.speed)*(held?1.1:.45);
  this.speed=clamp(this.speed+accel*dt,0,6);if(this.speed<.04)this.speed=0;
  this.acceleration=dt?(this.speed-before)/dt:0;this.steer+=(direction-this.steer)*Math.min(1,dt*5);
  // Acceleration changes first; the cake follows after a physical-response lag.
  const uphill=this.stage===0&&this.distance<15;
  this.forceTarget=turn&&correct?-this.bend*Math.max(0,this.speed*this.speed-5)*1.1:uphill?-(Math.max(0,this.acceleration)*2.3+(held&&this.speed<1.6?5:0)):0;
  this.forceLag+=(clamp(this.forceTarget,-30,30)-this.forceLag)*Math.min(1,dt*1.3);
  const recovery=(this.input['recover-right']?1:0)-(this.input['recover-left']?1:0);
  this.recoveryWrong=old*recovery>0;this.recoveryRate=recovery?this.input.brake||this.speed<2?22:8:0;
  let next=old+(this.forceLag-old)*(held&&this.speed>2?2.5:.22)*dt;
  if(recovery&&old*recovery<0)next=Math.sign(old)*Math.max(0,Math.abs(next)-this.recoveryRate*dt);
  else if(recovery&&old*recovery>0)next+=recovery*8*dt;
  if(!held&&this.speed===0&&Math.abs(next)<.5)next=0;
  this.balanceLean=clamp(next,-32,32);this.recoveryActive=Math.abs(this.balanceLean)>=3;
  if(this.recoveryActive&&!this.wasRecovering)this.recoveryIntro=1.8;
  if(recovery&&old*recovery<0&&Math.abs(old)>=3)this.correctionPending=true;
  if(this.correctionPending&&Math.abs(this.balanceLean)<.5){this.balanceLean=0;this.facts.recoveries++;this.recoveryNotice=1.3;this.correctionPending=false;}
  this.wasRecovering=this.recoveryActive;this.recoveryIntro=Math.max(0,this.recoveryIntro-dt);this.recoveryNotice=Math.max(0,(this.recoveryNotice||0)-dt);
  this.tilt=this.balanceLean;this.sway=this.balanceLean*.42;this.flagSway=this.balanceLean;this.fruitSway=this.balanceLean*.5;this.balanceDanger=Math.abs(this.balanceLean)>=18;this.hazardStop=false;this.recoveryLocked=false;
  if(this.speed>1&&this.distance<15)this.smooth.start+=dt;if(correct&&this.speed>0){this.smooth.turn+=dt;this.turns[this.bend>0?'right':'left']+=dt;}if(this.input.brake&&before>.1)this.smooth.stop+=dt;
  if(!wrong&&(!turn||correct)){const nextDistance=this.distance+this.speed*dt;this.distance=Math.min(55,!turn&&this.distance<15?Math.min(15,nextDistance):this.stage===1&&this.distance<=29?Math.min(29.01,nextDistance):turn?Math.min(40,nextDistance):nextDistance);}
  if(this.stage===2&&!this.bayStopped){this.distance=Math.min(47,this.distance);this.bayEntry=clamp((this.distance-40)/7,0,1);if(this.distance>=42&&this.input.brake&&this.speed===0){this.bayStopped=true;this.distance=47;this.bayEntry=1;this.facts.bayStops++;}}
  if(resting&&this.speed===0){this.bayRestTime+=dt;if(this.bayRestTime>=.6){this.balanceLean=this.tilt=this.sway=this.flagSway=this.fruitSway=this.forceLag=0;this.recoveryActive=false;this.restReady=true;}}
  if(resting&&this.restReady&&this.input.go&&!this.input.brake&&this.speed>.3){this.bayRestarted=true;this.facts.bayRestarts++;}
  if(this.distance>=55&&this.speed===0&&Math.abs(this.balanceLean)<.5){this.balanceLean=0;this.phase='delivering';this.departureTime=0;this.release();}
 }
}
