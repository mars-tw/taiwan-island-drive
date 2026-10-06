import {clamp,VEHICLES} from './config.js';
export function createPhysics(){return {s:0,v:0,a:0,pressure:300,traction:0,brakeCommand:7,delay:0};}
// SI units throughout. Values are original educational parameters, not a real fleet specification.
export function stepTrain(state,controls,dt,vehicle=VEHICLES.commuter,grade=0){
  dt=Number.isFinite(dt)?clamp(dt,0,0.05):0;
  if(dt===0)return state;
  const emergency=controls.emergency;
  const command=emergency?8:controls.brake;
  if(command!==state.brakeCommand){state.brakeCommand=command;state.delay=emergency?0.15:0.65;}
  state.delay=Math.max(0,state.delay-dt);
  const targetPressure=command/8*360;
  if(state.delay<=0){const tau=targetPressure>state.pressure?(emergency?0.65:1.25):1.0;state.pressure+=(targetPressure-state.pressure)*(1-Math.exp(-dt/tau));}
  const permitted=controls.power&&!controls.doors&&controls.direction!==0&&controls.brake===0&&!emergency;
  const speed=Math.abs(state.v);
  const force=permitted?Math.min(vehicle.maxTraction,vehicle.power/Math.max(speed,3))*controls.throttle/5:0;
  state.traction+=(force-state.traction)*(1-Math.exp(-dt/0.75));
  // Resistance: a simplified Davis curve; wheel/rail adhesion caps both traction and braking.
  const adhesion=vehicle.mass*9.81*vehicle.adhesion;
  const drive=Math.min(state.traction,adhesion)*controls.direction;
  const resistance=1500+55*speed+6*speed*speed;
  const normalRatio=Math.min(state.pressure/315,1);
  const extraRatio=Math.max(0,(state.pressure-315)/45);
  const brake=Math.min(vehicle.mass*(normalRatio*vehicle.serviceDecel+extraRatio*(vehicle.emergencyDecel-vehicle.serviceDecel)),adhesion);
  const slope=vehicle.mass*9.81*grade;
  let net=drive-slope;
  if(speed>0.002)net-=(resistance+brake)*Math.sign(state.v);
  else net=Math.sign(net)*Math.max(0,Math.abs(net)-resistance-brake);
  const desired=net/vehicle.mass;
  const jerk=emergency?2.5:0.7;
  state.a+=clamp(desired-state.a,-jerk*dt,jerk*dt);
  const previous=state.v;
  state.v+=state.a*dt;
  if(previous*state.v<0&&brake+resistance>Math.abs(drive-slope)){state.v=0;state.a=0;}
  if(speed<0.035&&brake+resistance>Math.abs(drive-slope)){state.v=0;state.a=0;}
  state.s+=state.v*dt;
  if(state.s<0){state.s=0;state.v=Math.max(0,state.v);}
  return state;
}
export function stoppingDistance(speed,notch=5,vehicle=VEHICLES.commuter,grade=0){
  const decel=Math.max(.12,vehicle.emergencyDecel*(notch/8)+9.81*grade);
  return speed*1.8+speed*speed/(2*decel)+4;
}
