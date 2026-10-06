/** SI translational flight model with aerodynamic lift/drag, body attitude rates,
 * coordinated bank turn, rudder side force, stall and ground tyre contact.
 * Model +Z faces forward; a camera looking +Z sees world -X on its right.
 * Body right is therefore local -X, up +Y, forward +Z. heading 0 = +Z,
 * positive heading turns clockwise toward world -X (east on the compass).
 * Model parameters are original educational approximations, not POH data. */
export const G = 9.80665, KNOTS = 1.943844492, FEET = 3.280839895;
export const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
export const wrap = n=>Math.atan2(Math.sin(n),Math.cos(n));
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const len=v=>Math.hypot(v.x,v.y,v.z);
const norm=v=>{const l=len(v)||1;return {x:v.x/l,y:v.y/l,z:v.z/l};};
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});

export function createState(mode='takeoff',plane={}) {
  const flying=mode==='navigation'||mode==='landing';
  return {position:{x:0,y:mode==='landing'?82:mode==='navigation'?145:0,z:mode==='landing'?-1050:mode==='navigation'?120:70},velocity:{x:0,y:mode==='landing'?-2.4:0,z:flying?34:0},heading:0,pitch:mode==='landing'?-0.02:0.04,bank:0,pitchRate:0,rollRate:0,yawRate:0,throttle:mode==='landing'?0.22:flying?0.64:0,flaps:mode==='landing'?2:0,brake:0,grounded:!flying,everAirborne:flying,takeoffOnRunway:null,firstLiftoff:null,liftoff:null,rotationCommanded:false,time:0,airspeed:flying?34:0,alpha:0,lift:0,drag:0,stall:false,touchdown:null,hardLanding:false,rpm:650,groundType:'runway',wind:{x:0,y:0,z:0},...plane};
}

export function liftCoefficient(alpha,flaps=0,plane={cl0:.25,clAlpha:5.15,stallAngle:.285}) {
  const critical=plane.stallAngle, a=Math.abs(alpha);
  const linear=plane.cl0+plane.clAlpha*alpha+flaps*0.24;
  if(a<=critical) return linear;
  // A post-stall wing loses lift smoothly instead of preserving unlimited CL.
  return linear*Math.max(0.12,Math.exp(-(a-critical)*8));
}

export function stepPhysics(s,c,plane,dt,{assist=true,groundHeight=0,onRunway=true}={}) {
  dt=Number.isFinite(dt)?clamp(dt,0,1/30):0;if(!dt)return s;
  s.time+=dt;s.throttle=clamp(c.throttle??s.throttle,0,1);s.flaps=clamp(c.flaps??s.flaps,0,2);s.brake=clamp(c.brake??0,0,1);
  const elevator=clamp(c.pitch||0,-1,1),aileron=clamp(c.roll||0,-1,1),rudder=clamp(c.rudder||0,-1,1);
  const air={x:s.velocity.x-s.wind.x,y:s.velocity.y-s.wind.y,z:s.velocity.z-s.wind.z};
  const speed=len(air),direction=norm(air),horizontal=Math.hypot(air.x,air.z),gamma=Math.atan2(air.y,Math.max(.1,horizontal));
  const flowHeading=Math.atan2(-air.x,air.z),slip=wrap(s.heading-flowHeading);
  // A cambered wing may naturally float just above the runway at high speed.
  // A deliberate elevator command still counts if the wheels just lifted.
  if(speed>=plane.rotateSpeed*.76&&elevator>.025)s.rotationCommanded=true;
  const alpha=wrap(s.pitch-gamma),rho=1.225*Math.exp(-Math.max(0,s.position.y)/8500),q=.5*rho*speed*speed;
  const controlAuthority=clamp((speed+12)/42,.22,1.3);
  let trim=.055-s.flaps*.026;
  if(assist&&!s.grounded){
    // Assistance only applies restoring moments; it never translates the airplane.
    const required=plane.mass*G/(Math.max(100,q*plane.wingArea)*Math.max(.55,Math.cos(s.bank)));
    trim=clamp((required-plane.cl0-s.flaps*.24)/plane.clAlpha,-.03,.20);
  }
  s.pitchRate+=(elevator*1.05*controlAuthority+(trim-alpha)*(assist?3.6:1.4)-s.pitchRate*2.5)*dt;
  s.rollRate+=(aileron*1.65*controlAuthority-s.rollRate*2.6-(assist?s.bank*.8:0))*dt;
  s.pitch=clamp(s.pitch+s.pitchRate*dt,-1.05,1.05);s.bank=wrap(s.bank+s.rollRate*dt);
  if(assist)s.bank=clamp(s.bank,-.85,.85);
  if(s.grounded){
    const steering=(rudder+aileron*.65)*clamp(speed/10,0,1)*.48;
    s.yawRate+=(steering-s.yawRate)*Math.min(1,dt*8);
    s.bank*=Math.max(0,1-dt*8);
    // Ground pitch is limited by the wheels; sufficient airflow permits rotation.
    s.pitch=clamp(s.pitch,0,speed>plane.rotateSpeed*.76?.23:.045);
  }else{
    const coordinated=G*Math.tan(clamp(s.bank,-1.12,1.12))/Math.max(20,speed);
    s.yawRate+=(coordinated+rudder*.28*controlAuthority-slip*.45-s.yawRate)*dt*3;
  }
  s.heading=wrap(s.heading+s.yawRate*dt);
  const forward={x:-Math.sin(s.heading)*Math.cos(s.pitch),y:Math.sin(s.pitch),z:Math.cos(s.heading)*Math.cos(s.pitch)};
  const right={x:-Math.cos(s.heading),y:0,z:-Math.sin(s.heading)};
  const up0=norm(cross(right,direction));
  const liftDir={x:up0.x*Math.cos(s.bank)+right.x*Math.sin(s.bank),y:up0.y*Math.cos(s.bank),z:up0.z*Math.cos(s.bank)+right.z*Math.sin(s.bank)};
  const cl=liftCoefficient(alpha,s.flaps,plane),lift=q*plane.wingArea*cl;
  const stalled=Math.abs(alpha)>plane.stallAngle&&speed>8;
  const cd=plane.cd0+.053*cl*cl+s.flaps*.028+(stalled?.16:0);
  const drag=q*plane.wingArea*cd;
  const thrust=plane.thrust*s.throttle*Math.max(.3,1-speed/(plane.maxSpeed*1.8));
  const sideForce=-dot(air,right)*plane.mass*(s.grounded?3.4:.38)+rudder*q*plane.wingArea*.09;
  let ax=(forward.x*thrust+liftDir.x*lift-direction.x*drag+right.x*sideForce)/plane.mass;
  let ay=(forward.y*thrust+liftDir.y*lift-direction.y*drag)/plane.mass-G;
  let az=(forward.z*thrust+liftDir.z*lift-direction.z*drag+right.z*sideForce)/plane.mass;
  if(s.grounded){
    const friction=(onRunway?.018:.07)*G+s.brake*(onRunway?5.8:3.8);
    if(horizontal>0.02){ax-=air.x/Math.max(.1,horizontal)*Math.min(friction,horizontal/dt);az-=air.z/Math.max(.1,horizontal)*Math.min(friction,horizontal/dt);}
    if(ay<=.18){ay=0;s.velocity.y=0;}else{
      // Preserve the actual first liftoff surface; later touchdown and bounces
      // must not replace it or turn a grass departure into runway credit.
      s.liftoff={position:{...s.position},onRunway,time:s.time};
      if(!s.everAirborne){s.takeoffOnRunway=onRunway;s.firstLiftoff=structuredClone(s.liftoff);}
      s.grounded=false;s.everAirborne=true;
    }
  }
  s.velocity.x+=ax*dt;s.velocity.y+=ay*dt;s.velocity.z+=az*dt;
  s.position.x+=s.velocity.x*dt;s.position.y+=s.velocity.y*dt;s.position.z+=s.velocity.z*dt;
  if(s.position.y<=groundHeight){
    if(!s.grounded&&s.everAirborne){
      s.touchdown={verticalSpeed:s.velocity.y,speed:len(s.velocity),bank:s.bank,pitch:s.pitch,onRunway,time:s.time};
      s.hardLanding=s.velocity.y < -4.2||Math.abs(s.bank)>.35;
    }
    s.position.y=groundHeight;s.velocity.y=0;s.grounded=true;
    s.pitch=clamp(s.pitch,0,.22);s.bank*=Math.max(0,1-dt*10);
  }
  s.airspeed=speed;s.alpha=alpha;s.lift=lift;s.drag=drag;s.stall=stalled;s.rpm=650+2050*s.throttle;s.groundType=onRunway?'runway':'grass';
  return s;
}

export function snapshot(s){return {altitudeFeet:Math.max(0,s.position.y)*FEET,airspeedKnots:s.airspeed*KNOTS,verticalSpeedFpm:s.velocity.y*FEET*60,headingDegrees:((s.heading*180/Math.PI)%360+360)%360,pitchDegrees:s.pitch*180/Math.PI,bankDegrees:s.bank*180/Math.PI,...structuredClone(s)};}
