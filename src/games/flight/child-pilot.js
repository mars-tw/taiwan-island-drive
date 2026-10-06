import { clamp,wrap,createState } from './physics.js';
import { getPilotTarget,makeReturnRoute } from './flight-plans.js';
export function createFlightInitialState(mode,preschool=true){const s=createState(['treasure','mail','tour'].includes(mode)?'navigation':mode);if(preschool&&s.grounded)s.flaps=1;return s;}

export function createChildPilot(s){return {active:false,mode:'free',stage:'ready',targetHeading:s.heading,targetAltitude:Math.max(160,s.position.y),takeoffHeading:s.heading,turnRemaining:0,turnDirection:0,queuedTurn:0,returning:false,returnIndex:0,returnRoute:[],throttle:s.throttle,terrainClearance:false};}
export function startChildPilot(p,s,mode){p.active=true;p.mode=mode;p.returning=false;p.turnRemaining=0;p.takeoffHeading=s.heading;p.targetHeading=s.heading;p.targetAltitude=Math.max(160,s.position.y);p.stage=mode==='landing'?(s.grounded?'stopping':'landing'):(s.grounded?'accelerating':'cruise');return p;}
export function tapChildTurn(p,s,direction){
 if(!Number.isFinite(direction)||direction===0)return p;
 if(!p.active)startChildPilot(p,s,'free');
 const turn=Math.sign(direction)*25*Math.PI/180;
 if(s.grounded||p.stage==='accelerating'||p.stage==='rotating'){p.queuedTurn=clamp(p.queuedTurn+turn,-.65,.65);return p;}
 if(p.mode!=='free'&&p.turnRemaining>0&&p.turnDirection===Math.sign(direction))return p;
 const candidate=wrap(p.targetHeading+turn);p.targetHeading=wrap(s.heading+clamp(wrap(candidate-s.heading),-.7,.7));p.turnRemaining=p.mode==='free'?7:4;p.turnDirection=Math.sign(direction);return p;
}
export function startReturnHome(p,s){p.active=true;p.returning=true;p.returnIndex=0;p.returnRoute=makeReturnRoute(s);p.turnRemaining=0;p.stage=s.grounded?'stopping':'returning';return p;}
export function cancelReturnHome(p,s){p.returning=false;p.returnRoute=[];p.returnIndex=0;p.targetHeading=s.heading;p.targetAltitude=Math.max(160,s.position.y);p.stage=s.grounded?'accelerating':'cruise';p.active=true;return p;}
export function updateChildPilot(p,s,plane,mission,dt,context={}){
 dt=Number.isFinite(dt)?clamp(dt,0,1/30):0;
 if(!p.active)return null;
 let target=getPilotTarget(mission);
 if(p.returning){
  target=p.returnRoute[p.returnIndex]||null;
  if(target){const distance=Math.hypot(s.position.x-target.x,s.position.z-target.z);const aligned=p.returnIndex<3||Math.abs(wrap(s.heading))<.2;if(distance<target.radius&&Math.abs(s.position.y-target.y)<(p.returnIndex<3?120:45)&&aligned){p.returnIndex++;target=p.returnRoute[p.returnIndex]||null;if(!target)p.stage='landing';}}
 }
 const controls={pitch:0,roll:0,rudder:0,throttle:p.throttle,flaps:0,brake:0};
 if(p.stage==='stopping'||(p.stage==='landing'&&s.grounded)){
  p.stage='stopping';p.throttle=0;controls.throttle=0;controls.brake=1;controls.flaps=2;
  if(s.airspeed<1.5){p.stage='parked';p.active=false;p.returning=false;}
  return controls;
 }
 if(p.stage==='landing'){
  p.throttle=clamp(.35+(31-s.airspeed)*.015,.12,.58);controls.throttle=p.throttle;controls.flaps=2;const sink=s.position.y<10?-.65:-1.8;controls.pitch=clamp((sink-s.velocity.y)*.05,-.14,.12);
  controls.roll=clamp(-s.bank*.8+s.position.x*.001,-.2,.2);controls.rudder=clamp(-s.heading*.5+s.position.x*.003,-.15,.15);
  return controls;
 }
 if(p.stage==='accelerating'||p.stage==='rotating'){
  p.throttle=Math.min(1,p.throttle+dt*.55);controls.throttle=p.throttle;controls.flaps=1;
  controls.rudder=clamp(wrap(p.takeoffHeading-s.heading)*1.8+s.position.x*.02,-.22,.22);
  if(s.airspeed>=plane.rotateSpeed)p.stage='rotating';
  if(p.stage==='rotating')controls.pitch=clamp((.15-s.pitch)*3-s.pitchRate*.6,-.3,.3);
  if(!s.grounded&&s.position.y>8){p.stage='climbing';p.targetHeading=wrap(p.takeoffHeading+p.queuedTurn);p.queuedTurn=0;}
  return controls;
 }
 if(p.stage==='climbing'){
  p.throttle=1;controls.throttle=1;controls.pitch=clamp((.15-s.pitch)*3-s.pitchRate*.6,-.3,.3);
  controls.roll=clamp(wrap(p.targetHeading-s.heading)*.9-s.bank*.8,-.2,.2);
  if(s.position.y>85){p.stage='cruise';p.targetAltitude=160;}
  return controls;
 }
 if(p.turnRemaining>0){p.turnRemaining=Math.max(0,p.turnRemaining-dt);}
 else if(target){p.targetHeading=Math.atan2(-(target.x-s.position.x),target.z-s.position.z);}
 let altitude=target?.y??p.targetAltitude;
 p.terrainClearance=false;
 const clearance=p.returning&&p.returnIndex>=2?30:140;
 if(Number.isFinite(context.terrainAhead)&&context.terrainAhead+clearance>altitude){altitude=Math.min(1500,context.terrainAhead+clearance);p.terrainClearance=true;}
 p.targetAltitude=altitude;
 const desiredBank=clamp(wrap(p.targetHeading-s.heading)*.9,-.3,.3);
 controls.roll=clamp((desiredBank-s.bank)*2.1-s.rollRate*.38+s.bank*.37,-.45,.45);
 controls.pitch=clamp((altitude-s.position.y)*.002-s.velocity.y*.04,-.24,.24);
 const desiredSpeed=mission.mode==='mail'?36:40;
 p.throttle=clamp(.64+(desiredSpeed-s.airspeed)*.027,.3,.88);controls.throttle=p.throttle;
 const flowHeading=Math.atan2(-s.velocity.x,s.velocity.z);controls.rudder=clamp(-wrap(s.heading-flowHeading)*.3,-.08,.08);
 return controls;
}
