// Offline, reversible lessons. No scores, deadlines, failure or reward currency.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const CONTENT_LESSONS={cake:'把蛋糕平穩送到',crossing:'路口停看聽',tickets:'形狀車票，找對月台'};
export const CROSSING_ORDERS=[['child','bike','grandma'],['grandma','child','bike'],['bike','grandma','child']];
export const CROSSING_SECONDS={child:2.1,bike:1.45,grandma:2.4};
export const CAKE_ROUTES=['海風起步坡','燈塔彎・連續彎','榕樹灣・臨停'];
export const TICKETS=[{shape:'circle',color:'blue',name:'藍圓形'},{shape:'triangle',color:'orange',name:'橘三角形'},{shape:'square',color:'green',name:'綠正方形'}];
export class ContentLesson{
 constructor(kind,saved={}){if(!CONTENT_LESSONS[kind])throw Error('Unknown lesson');saved=saved&&typeof saved==='object'?saved:{};this.kind=kind;this.stage=clamp(Number.isFinite(saved.stage)?Math.floor(saved.stage):0,0,2);this.completed=saved.completed===true;this.skills={start:!!saved.skills?.start,turn:!!saved.skills?.turn,stop:!!saved.skills?.stop};this.phase=this.completed?'done':'ready';this.paused=false;this.input={};this.hint='';this.reset();}
 reset(){this.release();this.speed=0;this.distance=0;this.steer=0;this.tilt=0;this.acceleration=0;this.sway=0;this.smooth={start:0,turn:0,stop:0};this.turns={left:0,right:0};this.bayStopped=false;this.bayRestarted=false;this.focus='center';this.looked={left:false,right:false};this.crossed=0;this.crossTime=0;this.selected=-1;this.trainX=-40;this.travelFrom=-40;this.boardTime=0;this.phase=this.completed?'done':'ready';if(this.completed&&this.kind==='tickets'){this.selected=this.platforms.findIndex(p=>p.shape===this.target.shape&&p.color===this.target.color);this.trainX=2+this.selected*16;this.travelFrom=this.trainX;this.distance=30;this.boardTime=1.2;}}
 begin(){if(this.phase!=='ready')return;this.phase='playing';this.speed=this.kind==='crossing'?5:0;}
 release(){this.input={go:false,brake:false,left:false,right:false};}
 pause(){this.paused=true;this.release();}
 snapshot(){return {stage:this.phase==='checkpoint'?this.stage+1:this.stage,completed:this.completed,started:this.phase!=='ready',skills:{...this.skills}};}
 get bend(){return this.stage===1&&this.distance>29?1:[1,-1,1][this.stage];}
 get crossingPerson(){return CROSSING_ORDERS[this.stage][this.crossed];}
 get crossingDuration(){return CROSSING_SECONDS[this.crossingPerson]||2.1;}
 get canDepart(){return this.speed<=.05&&this.looked.left&&this.looked.right&&this.crossed===3;}
 get rough(){return Math.abs(this.tilt)>22;}
 get grade(){return this.kind==='cake'&&this.stage===0&&this.distance<15?.6:0;}
 get approach(){return this.kind==='cake'&&this.stage===2&&this.distance>40;}
 get target(){return TICKETS[this.stage];}
 get platforms(){const t=this.target;return [t,{...t,color:t.color==='blue'?'orange':'blue',name:`${t.color==='blue'?'橘':'藍'}${{circle:'圓形',triangle:'三角形',square:'正方形'}[t.shape]}`},{...t,shape:t.shape==='circle'?'square':'circle',name:`${{blue:'藍',orange:'橘',green:'綠'}[t.color]}${t.shape==='circle'?'正方形':'圓形'}`}].map((_,i,a)=>a[(i+this.stage)%3]);}
 get matched(){const p=this.platforms[this.selected];return !!p&&p.color===this.target.color&&p.shape===this.target.shape;}
 look(side){if(this.kind!=='crossing'||this.phase!=='playing'||this.paused||!['left','right'].includes(side))return;if(this.speed>.05){this.hint='先按住煞車，停穩再看。';return;}this.focus=side;this.looked[side]=true;this.hint=side==='left'?'左邊看清楚了，再看右邊。':'右邊也看看，等朋友過完。';}
 select(index){if(this.kind!=='tickets'||this.phase!=='playing'||this.paused||!Number.isInteger(index)||index<0||index>2)return;if(this.speed>.05){this.hint='先停穩，再選月台。';return;}this.travelFrom=this.trainX;this.selected=index;this.distance=0;this.hint=this.matched?'月台選好了，按住前進。':'再看看車票，形狀和顏色都要一樣。';}
 depart(){if(this.kind!=='crossing'||this.phase!=='playing'||this.paused)return false;if(this.speed>.05||!this.looked.left||!this.looked.right||this.crossed<3){this.hint='停、看左、看右，等朋友過完。';return false;}this.checkpoint();return true;}
 door(){if(this.kind!=='tickets'||this.phase!=='playing'||this.paused)return false;if(!this.matched||this.distance<28||this.speed>.05){this.hint=!this.matched&&this.selected>=0?'這站不一樣，停穩再換月台。':'對好月台，停穩再開門。';return false;}this.phase='boarding';this.release();return true;}
 checkpoint(){for(const k of Object.keys(this.skills))this.skills[k]||=this.smooth[k]>.25;this.release();this.phase=this.stage===2?'done':'checkpoint';this.completed=this.stage===2;}
 next(){if(this.phase!=='checkpoint')return;this.stage++;this.reset();this.begin();}
 update(seconds){if(this.paused||!['playing','boarding'].includes(this.phase))return;const dt=clamp(seconds,0,.05);if(this.phase==='boarding'){this.boardTime+=dt;if(this.boardTime>=1.2)this.checkpoint();return;}
 const before=this.speed,target=this.input.go?(this.approach?4:7):0,accel=this.input.brake?-5:(target-this.speed)*1.4-(this.input.go||this.speed>0?this.grade:0);
 this.speed=clamp(this.speed+accel*dt,0,7);if(this.speed<.04)this.speed=0;
 const targetSteer=(this.input.right?1:0)-(this.input.left?1:0);this.steer+=(targetSteer-this.steer)*Math.min(1,dt*2.5);
 // A held brake at zero speed exerts no acceleration. Read actual motion,
 // including speed clamps, so the flag can settle after the car stops.
 this.acceleration=dt>0?(this.speed-before)/dt:0;
 this.tilt+=(clamp(-this.acceleration*6-this.steer*this.speed*4,-32,32)-this.tilt)*Math.min(1,dt*5);
 this.sway+=(this.tilt*.42-this.sway)*Math.min(1,dt*9);
 if(this.kind==='cake'){
  const turn=this.distance>15&&this.distance<=40;const aligned=!turn||this.steer*this.bend>.25;
  if(this.speed>1&&Math.abs(accel)<5&&this.distance<15)this.smooth.start+=dt;
  if(turn&&aligned&&this.speed>1&&this.speed<6.5)this.smooth.turn+=dt;
  if(this.input.brake&&before>.1&&Math.abs(this.tilt)<29)this.smooth.stop+=dt;
  if(this.stage===1&&turn&&aligned&&this.speed>1)this.turns[this.bend>0?'right':'left']+=dt;
  if(this.stage===2&&this.distance>=42&&this.input.brake&&this.speed===0)this.bayStopped=true;
  if(this.bayStopped&&this.input.go&&!this.input.brake&&this.speed>.3)this.bayRestarted=true;
  // Unsteered bends slow the journey gently; the cake never breaks or disappears.
  this.distance=Math.min(55,this.distance+this.speed*dt*(aligned?1:.3));
  if(this.stage===1){if(this.turns.left<.2)this.distance=Math.min(29,this.distance);else if(this.turns.right<.2)this.distance=Math.min(40,this.distance);}
  if(this.stage===2&&!this.bayStopped)this.distance=Math.min(47,this.distance);
  if(this.distance>=55&&this.speed===0)this.checkpoint();
 }else if(this.kind==='crossing'){
  if(this.speed===0&&this.looked.left&&this.looked.right&&this.crossed<3){this.crossTime+=dt;if(this.crossTime>=this.crossingDuration){this.crossed++;this.crossTime=0;this.hint='';}}
 }else if(this.selected>=0){this.distance=Math.min(30,this.distance+this.speed*dt);this.trainX=this.travelFrom+(2+this.selected*16-this.travelFrom)*this.distance/30;if(this.distance>=28&&!this.matched)this.hint='這站不一樣，停穩再換月台。';}
 }
}
