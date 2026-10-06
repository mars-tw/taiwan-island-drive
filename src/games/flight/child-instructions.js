export function childAction(s){
 const p=s.pilot||s.guidance?.pilot;const mission=s.mission||{};
 if(p?.returning)return ['取消返航','↩',true];
 if(mission.complete)return ['機翼保持平穩','―',false];
 if(!p?.active)return s.lesson==='landing'?['一起降落','↓',true]:s.lesson==='treasure'?['一起找星星','★',true]:s.lesson==='mail'?['出發送郵件','✉',true]:s.lesson==='tour'?['出發看風景','◎',true]:s.lesson==='navigation'?['一起找路','◎',true]:['一起起飛','↗',true];
 if(['accelerating','rotating','climbing'].includes(p.stage))return ['正在起飛','↗',false];
 if(p.stage==='landing')return ['慢慢降落','↓',false];
 if(p.stage==='stopping'||p.stage==='parked')return ['慢慢停好','■',false];
 if(s.lesson==='treasure')return ['繼續找星星','★',false];
 if(s.lesson==='mail')return ['郵件送達中','✉',false];
 if(s.lesson==='tour')return [mission.targetLabel?'飛往'+mission.targetLabel:'一起看風景','◎',false];
 if(s.lesson==='navigation')return ['跟著圓圈飛','◎',false];
 return ['助飛中','―',false];
}
export function childMessage(s){
 const p=s.pilot||s.guidance?.pilot;const mission=s.mission||{};
 if(p?.returning)return p.stage==='landing'?'機場到了，我們慢慢下降。':'我們回機場，想繼續玩就再點一下。';
 if(mission.complete)return mission.message;
 if(p?.terrainClearance)return '山在前面，先往上飛。';
 if(!p?.active)return s.lesson==='landing'?'點一下就降落，不用一直按住。':'點一下就出發，左右也只要點一下。';
 if(p.stage==='accelerating')return '飛機跑起來了，先直直走。';
 if(p.stage==='rotating'||p.stage==='climbing')return '正在起飛！慢慢往上飛。';
 if(p.stage==='landing')return '我們慢慢下降，跑道就在前面。';
 if(p.stage==='stopping'||p.stage==='parked')return '飛機慢慢停下來了。';
 return mission.message||'機翼保持平穩，看看遠方的風景。';
}
