import { readSettings } from '../../shared/settings.js';
import { FlightWorld } from './world.js';
import { FlightAudio } from './audio.js';
import { createState,stepPhysics,snapshot } from './physics.js';
import { newMission,updateMission,missionView } from './mission.js';
import { AIRCRAFT,LESSONS } from './config.js';
import { createChildPilot,startChildPilot,tapChildTurn,startReturnHome,cancelReturnHome,updateChildPilot,createFlightInitialState } from './child-pilot.js';
function pilotOf(game){return game.guidance.pilot||(game.guidance.pilot=createChildPilot(game.state));}
export class FlightGame {
 constructor(canvas,onFrame){
  this.world=new FlightWorld(canvas);this.audio=new FlightAudio();this.controls={pitch:0,roll:0,rudder:0,throttle:0,flaps:0,brake:0};this.keys=new Set();this.mode='menu';this.lesson='takeoff';this.plane='trainer';this.map='coast';this.assist=readSettings().childMode;this.preschool=readSettings().childMode;this.audio.muted=readSettings().muted;this.state=createState();this.guidance={rotate:false,navigate:false,land:false,pilot:createChildPilot(this.state)};this.mission=newMission(this.lesson,this.map);this.onFrame=onFrame;this.last=performance.now();this.accumulator=0;this.bind();requestAnimationFrame(t=>this.frame(t));
 }
 bind(){
  addEventListener('resize',()=>this.world.resize());
  addEventListener('keydown',e=>{
   if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)&&this.mode!=='menu')e.preventDefault();
   if(e.target.matches('input,select'))return;this.keys.add(e.code);if(e.repeat)return;
   if(this.preschool&&this.mode==='playing'&&['ArrowLeft','KeyA','ArrowRight','KeyD'].includes(e.code))this.childTurn(['ArrowLeft','KeyA'].includes(e.code)?-1:1);
   if(e.code==='KeyF'&&this.mode==='playing')this.controls.flaps=(this.controls.flaps+1)%3;
   if(e.code==='KeyP')this.dropMail();
   if(e.code==='KeyC')this.setView(this.world.view==='chase'?'cockpit':'chase');
   if(e.code==='Escape'&&this.mode!=='menu')this.mode==='paused'?this.resume():this.pause();
   if(e.code==='KeyR'&&this.mode!=='menu')this.reset();
  });
  addEventListener('keyup',e=>this.keys.delete(e.code));
  addEventListener('blur',()=>{this.keys.clear();this.controls.pitch=0;this.controls.roll=0;this.controls.rudder=0;if(this.mode==='playing')this.pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.mode==='playing')this.pause();});
 }
 start(lesson=this.lesson,options={}){
  if(typeof lesson==='object'){options=lesson;lesson=options.lesson||'takeoff';}
  this.lesson=LESSONS[lesson]?lesson:'takeoff';this.plane=options.plane||this.plane;this.assist=options.assist??this.assist;this.preschool=options.preschool??this.preschool;this.map=options.map||this.map;
  this.world.setMap(this.map);this.state=createFlightInitialState(this.lesson,this.preschool);this.guidance={rotate:false,navigate:false,land:false,pilot:createChildPilot(this.state)};this.mission=newMission(this.lesson,this.map);
  Object.assign(this.controls,{pitch:0,roll:0,rudder:0,throttle:this.state.throttle,flaps:this.state.flaps,brake:0});this.effectiveControls={...this.controls};this.keys.clear();this.mode='playing';this.accumulator=0;this.world.setView(this.world.view);this.audio.start();return this.getState();
 }
 reset(){return this.start(this.lesson);}
 pause(){if(this.mode==='playing')this.mode='paused';this.audio.update(this.state,false);return this.getState();}
 resume(){if(this.mode==='paused')this.mode='playing';this.keys.clear();this.audio.start();return this.getState();}
 menu(){this.mode='menu';this.keys.clear();this.state=createState();this.guidance={rotate:false,navigate:false,land:false,pilot:createChildPilot(this.state)};this.controls.throttle=0;this.audio.update(this.state,false);}
 setView(v){this.world.setView(v);}
 useStabilization(){const p=this.guidance.pilot;return this.assist===true||Boolean(p?.active&&(this.preschool||p.returning));}
 getMissionView(){return missionView(this.mission,this.state,this.guidance.pilot);}
 getState(){return {mode:this.mode,lesson:this.lesson,plane:this.plane,map:this.map,assist:this.assist,effectiveAssist:this.useStabilization(),preschool:this.preschool,guidance:structuredClone(this.guidance),pilot:structuredClone(this.guidance.pilot||createChildPilot(this.state)),modelLoaded:this.world.loaded,view:this.world.view,controls:{...this.controls,...this.effectiveControls},mission:this.getMissionView(),...snapshot(this.state)};}
 childControl(){
  const p=pilotOf(this);
  if(this.lesson==='mail'&&this.preschool)this.mission.autoDrop=true;
  if(p.returning){cancelReturnHome(p,this.state);return p;}
  if(p.active)return p;
  startChildPilot(p,this.state,this.lesson);this.guidance.rotate=['takeoff','free'].includes(this.lesson);this.guidance.navigate=['navigation','treasure','mail','tour'].includes(this.lesson);this.guidance.land=this.lesson==='landing';if(this.lesson==='mail')this.mission.autoDrop=true;return p;
 }
 childTurn(direction){const p=pilotOf(this);if(!Number.isFinite(direction)||direction===0)return p;if(!p.active)startChildPilot(p,this.state,this.lesson);return tapChildTurn(p,this.state,direction);}
 returnHome(){const p=pilotOf(this);if(!p.returning)startReturnHome(p,this.state);this.keys.clear();this.mode='playing';this.audio.start();return this.getState();}
 dropMail(){if(this.lesson==='mail')this.mission.requestDrop=true;}
 terrainAhead(){
  if(typeof this.world?.terrainHeight!=='function')return 0;
  const s=this.state;const heights=[600,1200,2200].map(d=>this.world.terrainHeight(s.position.x-Math.sin(s.heading)*d,s.position.z+Math.cos(s.heading)*d));return Math.max(0,...heights.filter(Number.isFinite));
 }
 input(dt){
  const k=this.keys,s=this.state,p=pilotOf(this);
  if((this.preschool||p.returning)&&p.active){
   const controls=updateChildPilot(p,s,AIRCRAFT[this.plane],this.mission,dt,{terrainAhead:typeof this.terrainAhead==='function'?this.terrainAhead():0});Object.assign(this.controls,{throttle:controls.throttle,flaps:controls.flaps,brake:controls.brake});return controls;
  }
  // Preschool stays parked until its single start action; manual mode keeps all controls.
  if(this.preschool&&s.grounded&&!p.active)return {pitch:0,roll:0,rudder:0,throttle:0,flaps:1,brake:1};
  const value=(pos,neg)=>(k.has(pos)?1:0)-(k.has(neg)?1:0);let pitch=this.controls.pitch,roll=this.controls.roll,rudder=this.controls.rudder;
  if(k.has('ArrowUp')||k.has('ArrowDown')||k.has('KeyW')||k.has('KeyS'))pitch=value('ArrowDown','ArrowUp')+value('KeyS','KeyW');
  if(k.has('ArrowLeft')||k.has('ArrowRight')||k.has('KeyA')||k.has('KeyD'))roll=value('ArrowRight','ArrowLeft')+value('KeyD','KeyA');
  if(k.has('KeyQ')||k.has('KeyE'))rudder=value('KeyE','KeyQ');
  if(k.has('ShiftLeft')||k.has('ShiftRight'))this.controls.throttle=Math.min(1,this.controls.throttle+dt*.35);
  if(k.has('ControlLeft')||k.has('ControlRight'))this.controls.throttle=Math.max(0,this.controls.throttle-dt*.35);
  return {...this.controls,pitch,roll,rudder,brake:k.has('Space')?1:this.controls.brake};
 }
 frame(t){
  const dt=Math.min(.1,(t-this.last)/1000);this.last=t;
  if(this.mode==='playing'){this.accumulator+=dt;while(this.accumulator>=1/120){
   const c=this.input(1/120);this.effectiveControls=c;stepPhysics(this.state,c,AIRCRAFT[this.plane],1/120,{assist:this.useStabilization(),onRunway:this.world.onRunway(this.state.position)});
   const p=this.guidance.pilot;updateMission(this.mission,this.state,1/120,{progressPaused:p?.returning});this.accumulator-=1/120;
   if((this.mission.complete||this.mission.retry)&&!p?.returning){this.mode='result';break;}
  }}
  this.audio.update(this.state,this.mode==='playing');this.world.render(this.state,this.getMissionView(),dt,this.mode==='menu',this.effectiveControls||this.controls);this.onFrame?.(this.getState());requestAnimationFrame(time=>this.frame(time));
 }
}
