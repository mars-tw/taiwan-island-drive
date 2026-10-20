import {ContentLesson as PreviousLesson} from './content-r29.js';
export {FRIEND_NAMES,PASSENGER_NAMES,FRIEND_NUMBERS} from './content-r29.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class ContentLesson extends PreviousLesson {
 reset(){super.reset();this.newTraffic=false;this.newTrafficTime=0;this.staleSide='';this.refreshes=0;}
 get initialTrafficSource(){const first=this.stage===1?'right':'left';return this.layoutSeed%2?(first==='left'?'right':'left'):first;}
 get trafficSource(){return this.newTraffic?(this.initialTrafficSource==='left'?'right':'left'):this.initialTrafficSource;}
 get trafficActive(){return this.kind==='crossing'&&(this.newTraffic?this.newTrafficTime<3.2:this.observeTraffic&&this.trafficTime<[2.8,3.8,3.2][this.stage]);}
 get lookSequence(){return [this.trafficSource,this.trafficSource==='left'?'right':'left'];}
 get canDepart(){return this.kind==='crossing'&&this.speed===0&&this.crossed===3&&!this.trafficActive&&!this.staleSide&&this.looked.left&&this.looked.right&&this.trafficConfirmed;}
 get showHint(){return this.kind==='tickets'?false:super.showHint;}
 look(side){
  if(this.kind!=='crossing')return super.look(side);
  if(this.phase!=='playing'||this.paused||!['left','right'].includes(side))return;
  if(this.speed>.05){this.choiceHint='先煞車停穩，再看。';return;}
  this.focus=side;this.viewVisit[side]=true;this.facts[side+'Views']++;
  if(this.staleSide===side&&this.trafficActive){this.choiceHint='新車還在，等車過了再看。';return;}
  if(this.staleSide&&side!==this.staleSide){this.choiceHint='另一邊有新車，再看'+(this.staleSide==='left'?'左':'右')+'邊。';return;}
  this.looked[side]=true;this.choiceHint='';this.wrongLook='';
  if(side===this.trafficSource)this.trafficConfirmed=true;
  if(side===this.staleSide){this.staleSide='';this.refreshes++;}
  this.lookStep=Number(this.looked.left)+Number(this.looked.right);
  if(this.looked.left&&this.looked.right&&!this.trafficActive&&!this.staleSide){this.friendConfirmed=true;this.confirmDelay=.45;this.facts.confirmations++;}
 }
 depart(){
  if(this.kind==='crossing'&&!this.canDepart){this.facts.blockedStarts++;this.choiceHint=this.staleSide?'新車來了，再看'+(this.staleSide==='left'?'左':'右')+'邊。':this.trafficActive?'還有車，先等。':this.crossed<3?'等朋友到對岸。':'先看清兩邊。';return false;}
  return super.depart();
 }
 update(seconds){
  if(this.kind!=='crossing')return super.update(seconds);
  if(this.paused)return;
  const dt=clamp(seconds,0,.05);
  if(this.phase==='departing'){this.departureTime+=dt;if(this.departureTime>=1.5)this.checkpoint();return;}
  if(this.phase!=='playing')return;
  this.speed=clamp(this.speed+(this.input.brake?-5:-this.speed*.45)*dt,0,7);if(this.speed<.04)this.speed=0;
  if(this.speed>0)return;
  if(!this.newTraffic&&(this.looked.left||this.looked.right))this.trafficTime+=dt;
  if(this.crossed<3&&this.crossTime===0&&!this.friendConfirmed&&!this.trafficActive&&!this.staleSide&&this.looked.left&&this.looked.right){this.friendConfirmed=true;this.confirmDelay=.45;}
  // The approaching car yields at the line while the current friend crosses.
  if(this.newTraffic)this.newTrafficTime=Math.min(3.2,this.newTrafficTime+(this.crossTime>0&&this.crossed===0?Math.max(0,Math.min(dt,.3-this.newTrafficTime)):dt));
  if(!this.newTraffic&&this.crossed===0&&this.crossTime>=this.crossingDuration*.26){
   this.newTraffic=true;this.newTrafficTime=0;this.staleSide=this.trafficSource;
   this.looked[this.staleSide]=false;this.trafficConfirmed=false;this.friendConfirmed=false;
   this.choiceHint='新車接近，等朋友過，再看'+(this.staleSide==='left'?'左':'右')+'邊。';
  }
  if(this.crossTime>0||this.friendConfirmed&&!this.trafficActive&&!this.staleSide){
   if(this.confirmDelay>0){this.confirmDelay=Math.max(0,this.confirmDelay-dt);return;}
   this.crossTime+=dt;
   if(this.crossTime>=this.crossingDuration){
    this.crossed++;this.facts.waited++;this.crossTime=0;this.friendConfirmed=false;this.lookStep=0;
    if(this.crossed<3){this.looked={left:false,right:false};this.viewVisit={left:false,right:false};}
    if(!this.staleSide)this.choiceHint='';
   }
  }
 }
 snapshot(){return {...super.snapshot(),contentVersion:30};}
}
