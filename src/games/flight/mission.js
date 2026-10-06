import { FEET,KNOTS,G } from './physics.js';
import { RUNWAY,MAP_EXTENT } from './config.js';
import { NAVIGATION_POINTS,getFlightTargets,getFlightTarget } from './flight-plans.js';
export const WAYPOINTS=NAVIGATION_POINTS;
export function newMission(mode,map='coast'){
 const targets=getFlightTargets(mode,map);return {mode,map,phase:0,stage:'ready',passed:0,total:targets.length||(mode==='free'?0:1),progress:0,targets,complete:false,retry:false,message:'',stableTime:0,score:0,events:[],eventSequence:0,activeParcel:null,dropCount:0,autoDrop:false,requestDrop:false};
}
function event(m,type,label,s){m.events.push({id:++m.eventSequence,type,label,time:s.time});if(m.events.length>8)m.events.shift();}
function finish(m,text){m.complete=true;m.passed=m.total;m.progress=1;m.score=100;m.stage='complete';m.message=text;}
function updateParcel(m,s,dt){
 const p=m.activeParcel;if(!p)return;
 p.age+=dt;p.velocity.y-=G*dt;for(const axis of ['x','y','z'])p.position[axis]+=p.velocity[axis]*dt;
 if(p.position.y<=0){const target=m.targets.find(t=>t.id===p.targetId);const hit=target&&Math.hypot(p.position.x-target.x,p.position.z-target.z)<target.radius;
  if(hit){target.visited=true;m.passed++;event(m,'mail',target.label,s);m.message='郵件送到了！飛向下一座郵箱。';}else{m.message='郵件落遠了。我們繞回來，再送一次。';event(m,'mail-missed','再試一次',s);}
  m.activeParcel=null;m.requestDrop=false;
 }
}
export function predictedMailImpact(s){const fall=(s.velocity.y+Math.sqrt(s.velocity.y*s.velocity.y+2*G*Math.max(0,s.position.y)))/G;return {x:s.position.x+s.velocity.x*fall,z:s.position.z+s.velocity.z*fall,time:fall};}
function mailDelivery(m,s){
 const target=getFlightTarget(m);if(!target||m.activeParcel)return;
 const impact=predictedMailImpact(s);const error=Math.hypot(impact.x-target.x,impact.z-target.z);
 if((m.autoDrop||m.requestDrop)&&!s.grounded&&s.position.y>=60&&s.position.y<=220&&Math.abs(s.bank)<.3&&error<target.radius*.68){
  m.activeParcel={id:'parcel-'+(++m.dropCount),targetId:target.id,position:{...s.position},velocity:{...s.velocity},age:0};m.stage='dropping';m.message='郵件出發了！看它慢慢落到郵箱。';event(m,'mail-drop',target.label,s);
 }
}
export function updateMission(m,s,dt,{progressPaused=false}={}){
 dt=Number.isFinite(dt)?Math.max(0,Math.min(dt,1/30)):0;
 updateParcel(m,s,dt);if(m.complete||m.retry)return m;
 if(progressPaused)return m;
 if(s.hardLanding){m.retry=true;m.message='接地太重了。慢慢下降，再試一次。';return m;}
 if(m.mode!=='free'&&s.grounded&&s.everAirborne&&s.groundType!=='runway'){m.retry=true;m.message='我們降在草地了。回到起點，再試一次。';return m;}
 if(m.mode==='takeoff'){
  if(s.takeoffOnRunway===false||s.liftoff?.onRunway===false){m.retry=true;m.score=0;m.message='飛機離開跑道了。回到起點，再試一次。';return m;}
  if(!s.rotationCommanded&&s.position.z>=RUNWAY.end-RUNWAY.lessonStopMargin){m.retry=true;m.score=0;m.message='跑道快到頭了。回到起點，再練習抬頭起飛。';return m;}
  if(s.grounded&&(Math.abs(s.position.x)>=RUNWAY.halfWidth||s.position.z<RUNWAY.start||s.position.z>=RUNWAY.end-RUNWAY.lessonStopMargin)){m.retry=true;m.score=0;m.message='跑道快到頭了。回到起點，再試一次。';return m;}
  if(s.airspeed<4){m.phase=0;m.stage='preparing';m.message='準備好了。點一下，我們一起起飛。';}
  else if(s.grounded){m.phase=1;m.stage='accelerating';m.message=s.airspeed*KNOTS<56?'飛機跑起來了，先直直走。':'速度夠了，我們輕輕抬頭。';}
  else{m.phase=2;m.stage='climbing';m.message='起飛了！慢慢往上飛。';}
  m.progress=Math.min(.98,Math.max(0,s.position.y*FEET/150));
  if(s.takeoffOnRunway===true&&s.rotationCommanded&&s.position.y*FEET>150&&Math.abs(s.bank)<.3){m.stableTime+=dt;if(m.stableTime>2)finish(m,'起飛完成！我們一起飛上天空了。');}
 }else if(m.mode==='navigation'||m.mode==='treasure'||m.mode==='tour'){
  const target=getFlightTarget(m);m.stage='flying';
  if(target){const distance=Math.hypot(s.position.x-target.x,s.position.y-target.y,s.position.z-target.z);
   m.message=m.mode==='treasure'?'飛向'+target.label+'，寶藏就在前面。':m.mode==='tour'?'飛向'+target.label+'，看看那裡的風景。':'飛向第 '+(m.passed+1)+' 個金色圓圈。';
   if(distance<target.radius){m.stableTime+=dt;if(m.mode!=='tour'||(Math.abs(s.bank)<.35&&m.stableTime>=target.dwellSeconds)){target.visited=true;m.passed++;m.phase=m.passed;m.stableTime=0;event(m,m.mode==='treasure'?'star':m.mode==='tour'?'landmark':'ring',target.label,s);}}
   else m.stableTime=0;
  }
  m.progress=m.total?m.passed/m.total:0;
  if(m.passed===m.total)finish(m,m.mode==='treasure'?'六份寶藏都找到了！':m.mode==='tour'?'三個景點都看到了。這趟旅程完成了！':'金色圓圈都飛過了！');
 }else if(m.mode==='mail'){
  m.stage=m.activeParcel?'dropping':'delivering';const target=getFlightTarget(m);m.message=m.activeParcel?'郵件慢慢落下來了。':target?'飛向'+target.label+'，把郵件送過去。':'郵件都送到了。';mailDelivery(m,s);m.phase=m.passed;m.progress=m.passed/m.total;
  if(m.passed===m.total)finish(m,'兩份郵件都送到了！');
 }else if(m.mode==='landing'){
  m.stage=s.grounded?'stopping':'landing';m.message=s.grounded?'慢慢停下來，這次不用一直按住。':'對準跑道，我們慢慢下降。';m.progress=s.grounded?.85:Math.max(0,Math.min(.8,.8-s.position.y/120));
  if(s.grounded&&s.touchdown){m.phase=1;if(s.touchdown.onRunway&&s.airspeed<1.5&&s.throttle<.1){finish(m,'降落完成！飛機安全停好了。');m.score=Math.max(60,100-Math.round(Math.abs(s.touchdown.verticalSpeed)*8));}}
 }else {m.stage=s.grounded?'ready':'exploring';m.message=s.stall?'機頭太高了，輕輕往下。':s.grounded?'點一下就起飛。':'看看遠方的風景，想回家就按返航。';}
 if(s.position.y>MAP_EXTENT.maxAltitude||Math.abs(s.position.x)>MAP_EXTENT.halfSize||Math.abs(s.position.z)>MAP_EXTENT.halfSize){m.retry=true;m.message='到了地圖邊緣。回到起點，再飛一趟。';}
 return m;
}
export function missionView(m,s,pilot){
 const view=structuredClone(m);let target=getFlightTarget(m);
 if(pilot?.returning){view.returning=true;view.targets=pilot.returnRoute.map((t,i)=>({...t,visited:i<pilot.returnIndex}));view.total=view.targets.length;view.passed=pilot.returnIndex;view.progress=view.total?view.passed/view.total:0;target=view.targets[view.passed]||null;view.message=pilot.stage==='landing'?'回到機場了，慢慢下降。':'我們正在回機場。再點一下，可以取消返航。';view.complete=false;}
 else view.returning=false;
 view.stage=pilot?.active?pilot.stage:view.stage;if(pilot?.terrainClearance&&!pilot.returning)view.message='山在前面，先往上飛。';view.target=target?{...target}:null;view.targetLabel=target?.label||(pilot?.stage==='landing'?'機場跑道':m.mode==='free'?'自由探索':m.mode==='landing'?'機場跑道':m.mode==='takeoff'?'起飛跑道':'任務完成');
 view.targetDistance=target?Math.hypot(s.position.x-target.x,s.position.y-(target.flightAltitude??target.y),s.position.z-target.z):0;
 return view;
}
