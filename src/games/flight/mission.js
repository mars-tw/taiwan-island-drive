import { FEET, KNOTS } from './physics.js';
import { RUNWAY } from './config.js';
export const WAYPOINTS=[{x:0,y:145,z:500},{x:150,y:145,z:1000},{x:260,y:145,z:1510}];
export function newMission(mode){return {mode,phase:0,passed:0,complete:false,retry:false,message:'',stableTime:0,score:0};}
export function updateMission(m,s,dt){
  if(m.complete||m.retry)return m;
  if(s.hardLanding){m.retry=true;m.message='接地太重了。這次先練習保持平穩，再試一次。';return m;}
  if(m.mode!=='free'&&s.grounded&&s.everAirborne&&s.groundType!=='runway'){m.retry=true;m.message='我們降在草地了。再練一次，對準白色跑道。';return m;}
  if(m.mode==='takeoff'){
    if(s.takeoffOnRunway===false||s.liftoff?.onRunway===false){m.retry=true;m.score=0;m.message='飛機離開跑道了。回到起點，再試一次。';return m;}
    if(!s.rotationCommanded&&s.position.z>=RUNWAY.end-RUNWAY.lessonStopMargin){m.retry=true;m.score=0;m.message='跑道快到頭了。回到起點，再練習抬頭起飛。';return m;}
    if(s.grounded&&(Math.abs(s.position.x)>=RUNWAY.halfWidth||s.position.z<RUNWAY.start||s.position.z>=RUNWAY.end-RUNWAY.lessonStopMargin)){m.retry=true;m.score=0;m.message='跑道快到頭了。回到起點，再試一次。';return m;}
    if(s.airspeed<4){m.phase=0;m.message='先把襟翼設為 10°，放開煞車，油門慢慢推到 100%。';}
    else if(s.grounded){m.phase=1;m.message=s.airspeed*KNOTS<56?'用方向舵守住中線。等空速到 56 節，再輕拉操縱桿。':'輕拉操縱桿，讓機頭抬起 5～10°。';}
    else{m.phase=2;m.message='已經離地！保持小幅抬頭，收襟翼，爬升到 150 呎。';}
    if(s.takeoffOnRunway===true&&s.rotationCommanded&&s.position.y*FEET>150&&Math.abs(s.bank)<.3){m.stableTime+=dt;if(m.stableTime>2){m.complete=true;m.score=100;m.message='起飛完成！你已經學會用速度建立升力。';}}
  }else if(m.mode==='navigation'){
    const w=WAYPOINTS[m.passed];if(w){const d=Math.hypot(s.position.x-w.x,s.position.y-w.y,s.position.z-w.z);m.message=`飛向第 ${m.passed+1} 個導航圈。轉彎時留意高度，少量傾斜就好。`;if(d<100){m.passed++;m.phase=m.passed;}}
    if(m.passed===WAYPOINTS.length){m.complete=true;m.score=100;m.message='導航完成！傾斜機翼會讓飛機轉彎，也要留意高度。';}
  }else if(m.mode==='landing'){
    m.message=s.grounded?'油門拉到 0%，按住煞車，慢慢停下來。':'沿著燈光對準跑道。空速保持 60～75 節，控制下降；快接地時輕拉。';
    if(s.grounded&&s.touchdown){m.phase=1;if(s.touchdown.onRunway&&s.airspeed<1.5&&s.throttle<.1){m.complete=true;m.score=Math.max(60,100-Math.round(Math.abs(s.touchdown.verticalSpeed)*8));m.message='降落完成！你把飛機帶回跑道，也安全煞停了。';}}
  }else m.message=s.stall?'迎角太大，升力下降。輕推機頭、增加油門，讓氣流回來。':s.grounded?'放開煞車、推油門，從跑道開始探索。':'觀察空速、姿態與高度，試著把機翼保持水平。';
  if(s.position.y>900||Math.abs(s.position.x)>5000||Math.abs(s.position.z)>6000){m.retry=true;m.message='飛出練習區了。我們回到起點再飛一次。';}
  return m;
}
