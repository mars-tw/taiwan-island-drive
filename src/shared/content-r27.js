import {ContentLesson as PreviousLesson} from './content-r26.js';
import {CROSSING_ORDERS} from './content-r1.js';
export {PASSENGER_NAMES,FRIEND_NUMBERS} from './content-r26.js';
export const FRIEND_NAMES={child:'小安',bike:'小柏',grandma:'阿嬤'};

export class ContentLesson extends PreviousLesson {
 reset(){super.reset();this.decisionTime=0;this.hintRequested=false;this.hintKey='';this.stopNotice=0;this.bayEntry=0;}
 begin(){super.begin();this.decisionTime=0;this.hintRequested=false;this.hintKey='';}
 get crossingOrder(){const order=CROSSING_ORDERS[this.stage],shift=(this.layoutSeed||0)%3;return order.map((_,i)=>order[(i+shift)%3]);}
 get crossingPerson(){return this.crossingOrder[this.crossed];}
 get showHint(){return this.hintRequested||(this.stage<2&&this.decisionTime>=2);}
 askHint(){this.hintRequested=true;}
 select(index){super.select(index);if(index>=0&&!this.matched)this.askHint();}
 look(side){super.look(side);if(this.choiceHint)this.askHint();}
 depart(){
  if(this.kind==='crossing'&&this.phase==='playing'&&!this.canDepart){this.stopNotice=1.2;this.askHint();this.facts.blockedStarts++;this.choiceHint=this.trafficActive?'還有車，先停住。':'朋友還在路上，先停住。';return false;}
  return super.depart();
 }
 update(seconds){
  if(this.paused)return;
  const dt=Math.max(0,Math.min(.05,seconds));
  if(this.stopNotice>0){this.stopNotice=Math.max(0,this.stopNotice-dt);if(!this.stopNotice)this.choiceHint='';return;}
  if(this.kind==='cake'&&this.recoveryActive){const d=(this.input['recover-right']?1:0)-(this.input['recover-left']?1:0);if(d*this.balanceLean>0)this.askHint();}
  super.update(dt);
  if(this.kind==='cake'&&this.stage===2&&this.distance>=40)this.bayEntry=Math.min(1,this.bayEntry+dt*.65);
  // Rest means the whole cake has settled, not just that a timer elapsed.
  if(this.kind==='cake'&&this.bayStopped&&!this.bayRestarted&&!this.recoveryActive&&this.bayRestTime>=.6){
   this.balanceLean=this.tilt=this.sway=this.fruitSway=this.flagSway=0;
   this.tierOffset=this.tierVelocity=0;
  }
  const key=[this.stage,this.recoveryActive,this.inBend,this.bayStopped,this.bayRestarted,this.doorStage,this.selected,this.crossed,this.lookStep].join(':');
  if(key!==this.hintKey){this.hintKey=key;this.decisionTime=0;}
  this.decisionTime+=dt;
 }
}
