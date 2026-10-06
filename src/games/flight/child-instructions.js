import { AIRCRAFT } from './config.js';
export function childAction(s){
 if(s.lesson==='landing')return s.grounded?['按住慢慢停','■',true]:s.guidance.land?['慢慢往下降','↓',false]:['一起降落','↓',true];
 if(s.lesson==='navigation')return s.guidance.navigate?['跟著金色圈','◎',false]:['一起找路','◎',true];
 if(s.lesson==='takeoff'&&!s.rotationCommanded)return s.airspeed<AIRCRAFT[s.plane].rotateSpeed?['油門推大','＋',s.throttle<.95]:['抬頭起飛','↗',true];
 if(s.grounded)return s.airspeed<AIRCRAFT[s.plane].rotateSpeed?['油門推大','＋',s.throttle<.95]:['抬頭起飛','↗',true];
 return ['機翼保持平穩','―',false];
}
export function childMessage(s){
 if(s.lesson==='landing')return s.grounded?'按住慢慢停，讓飛機停下來。':s.guidance.land?'我們慢慢下降。看，跑道就在前面。':'按一起降落，我們回到跑道。';
 if(s.lesson==='navigation')return s.guidance.navigate?`看金色圓圈！我們要飛過第 ${Math.min(3,s.mission.passed+1)} 個。`:'按一起找路，跟著金色圓圈飛。';
 if(s.grounded||(s.lesson==='takeoff'&&!s.rotationCommanded))return s.airspeed<AIRCRAFT[s.plane].rotateSpeed?'把油門推大，等飛機跑快一點。':'飛機夠快了！按抬頭起飛。';
 return '起飛了！機翼保持平穩，往上飛。';
}
