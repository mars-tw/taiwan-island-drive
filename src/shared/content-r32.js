import {ContentLesson as PreviousLesson} from './content-r31.js';
export {FRIEND_NAMES,PASSENGER_NAMES,FRIEND_NUMBERS} from './content-r31.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class ContentLesson extends PreviousLesson {
 constructor(kind,saved={},options={}){super(kind,saved,options);this.practice=saved.practice===true;}
 reset(){super.reset();this.traySlide=0;this.edgeRescues=0;this.wasAtEdge=false;this.safetyNotice=0;}
 depart(){const ok=super.depart();if(!ok&&this.kind==='crossing')this.safetyNotice=2.5;return ok;}
 look(side){super.look(side);if(this.kind==='crossing'&&this.speed>.05)this.safetyNotice=2.5;}
 update(seconds){
  const dt=clamp(seconds,0,.05),active=!this.paused&&this.phase==='playing',oldLean=this.balanceLean||0;
  super.update(seconds);
  if(!active)return;
  this.safetyNotice=Math.max(0,this.safetyNotice-dt);
  if(this.kind!=='cake')return;
  // A bounded, recoverable slide on the tray, driven by the same lean/speed.
  // No timer, lost cake, elimination or score. Braking reduces slide momentum.
  const support=(this.input['recover-right']?1:0)-(this.input['recover-left']?1:0);
  if(support*oldLean>0){this.balanceLean=clamp(oldLean+support*12*dt,-32,32);this.tilt=this.balanceLean;this.sway=this.balanceLean*.42;this.flagSway=this.balanceLean;this.fruitSway=this.balanceLean*.5;}
  const lean=this.balanceLean||0;
  if(Math.abs(lean)>12&&this.speed>2.4&&!this.input.brake)this.traySlide+=Math.sign(lean)*(Math.abs(lean)-12)*this.speed*.16*dt;
  if(this.recoveryWrong)this.traySlide+=Math.sign(lean)*15*dt;
  if(this.input.brake||this.speed<1.5){const recovery=support*lean<0?19:8;this.traySlide=Math.sign(this.traySlide)*Math.max(0,Math.abs(this.traySlide)-recovery*dt);}
  this.traySlide=clamp(this.traySlide,-32,32);
  if(Math.abs(this.traySlide)<.001)this.traySlide=0;
  if(Math.abs(this.traySlide)>24)this.wasAtEdge=true;
  if(this.wasAtEdge&&Math.abs(this.traySlide)<.5&&Math.abs(lean)<.5){this.edgeRescues++;this.wasAtEdge=false;}
  if(this.phase==='delivering'&&Math.abs(this.traySlide)>.5){this.phase='playing';this.departureTime=0;}
 }
 snapshot(){return {...super.snapshot(),practice:this.practice,contentVersion:32};}
}
