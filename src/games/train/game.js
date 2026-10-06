import {ROUTES,LESSONS,VEHICLES,clamp} from './config.js';
import {createPhysics,stepTrain,stoppingDistance} from './physics.js';
export class TrainGame{
  constructor(){this.routeId='coast';this.vehicleId='commuter';this.assisted=true;this.childMode=true;this.start('lesson1');}
  start(id='lesson1',options={}){
    this.lessonId=LESSONS[id]?id:'lesson1';this.routeId=options.route||this.routeId;this.vehicleId=options.vehicle||this.vehicleId;
    this.route=ROUTES[this.routeId]||ROUTES.coast;this.vehicle=VEHICLES[this.vehicleId]||VEHICLES.commuter;this.lesson=LESSONS[this.lessonId];
    this.physics=createPhysics();this.controls={power:false,doors:true,direction:0,throttle:0,brake:7,emergency:false};
    this.paused=false;this.completed=false;this.stopAssist=false;this.elapsed=0;this.stopIndex=0;this.boarding=0;this.serviced=false;this.stops=[];this.infractions=[];this.signalWait=0;this.protectionWait=0;this.signalCleared=false;this.protection=false;this.hint='按「主電源」，讓駕駛台準備好。';this.toast='';this.toastUntil=0;this.maximumSpeed=0;this.overspeedTime=0;this.comfort=0;this.lastDirection=1;return this.getState();
  }
  pause(){this.paused=true;} resume(){if(!this.completed)this.paused=false;} reset(){return this.start(this.lessonId);}
  notify(text){this.toast=text;this.toastUntil=this.elapsed+5;}
  togglePower(){if(Math.abs(this.physics.v)>.2)return this.notify('行駛中保持主電源開啟。先停好再關電源。');this.controls.power=!this.controls.power;}
  prepare(){if(this.controls.emergency)return this.releaseEmergency();if(Math.abs(this.physics.v)>.15)return this.notify('先慢慢停下來，再準備出發。');if(this.serviced){this.toggleDoors();if(this.completed)return;}this.controls.power=true;this.controls.doors=false;this.controls.direction=1;this.controls.brake=0;this.controls.throttle=0;this.stopAssist=false;this.notify('準備好了！按綠色的「開始前進」。');}
  childGo(){if(!this.controls.power||this.controls.doors||this.controls.direction===0)return this.notify('先按「準備出發」，確認電源、車門和方向。');this.stopAssist=false;this.brake(0);this.throttle(2);}
  gentleStop(){this.stopAssist=false;this.throttle(0);this.brake(5);this.notify('正在慢慢煞車，火車要一點時間才會停。');}
  helpStop(){if(!this.controls.power||this.controls.doors)return this.notify('先準備出發，再請教練幫忙停車。');this.stopAssist=true;this.notify('你已開始停車。教練會幫忙調整動力和煞車。');}
  applyStopAssist(){
    if(!this.stopAssist||this.controls.emergency||this.controls.doors)return;
    const red=this.lesson.signals.find(s=>s.type==='red'&&!this.signalCleared),destination=red?red.at-22:this.lesson.stops[this.stopIndex];
    if(destination===undefined)return;const d=destination-this.physics.s,v=Math.abs(this.physics.v);
    if(Math.abs(d)<8&&v<.15){this.controls.throttle=0;this.controls.brake=7;if(!red)this.stopAssist=false;return;}
    const wantedDirection=d<0?-1:1;
    if(this.controls.direction!==wantedDirection){this.controls.throttle=0;this.controls.brake=7;if(v>=.15)return;this.controls.direction=wantedDirection;}
    const target=Math.min(this.limit()/3.6-.9,Math.sqrt(Math.max(0,Math.abs(d)-3)*.55),Math.abs(d)<25?1.9:12,wantedDirection<0?2:12);
    if(v>target+.3||Math.abs(d)<5){this.controls.throttle=0;this.controls.brake=Math.abs(d)<5?7:clamp(Math.ceil((v-target)*1.8+2),2,7);}
    else if(v<target-.35){this.controls.brake=0;this.controls.throttle=Math.abs(d)<25||wantedDirection<0?1:3;}
    else{this.controls.throttle=0;this.controls.brake=0;}
  }
  childHint(){const s=this.getState(),c=s.controls;if(c.emergency)return {text:'火車停穩了，再按「解除」。',action:'child-emergency'};if(!c.power)return {text:'按綠色按鈕，準備出發！',action:'child-prepare'};if(this.serviced)return {text:'乘客上車了！關門，準備出發。',action:'child-doors'};if(c.doors&&Math.abs(s.distance)<=12)return {text:'乘客正在上車，等一下喔。',action:''};if(c.doors)return {text:'先關好車門，準備出發。',action:'child-prepare'};if(s.signal==='red')return {text:Math.abs(s.speed)<.6&&s.signalDistance<70?'紅燈先等一等，綠燈再走。':'看到紅燈，先慢慢停！',action:Math.abs(s.speed)<.6&&s.signalDistance<70?'':'child-help-stop'};if(Math.abs(s.distance)<=12&&Math.abs(s.speed)<.6)return {text:'到站了！打開車門接乘客。',action:'child-doors'};if(this.stopAssist)return {text:'教練幫忙停好，留意前方車站。',action:''};if(s.distance<Math.max(100,s.stoppingDistance+50))return {text:'快到站了！按黃色「幫我停好」。',action:'child-help-stop'};if(Math.abs(s.speed)<.6)return {text:'按綠色按鈕，開始前進！',action:'child-go'};return {text:'火車出發了！看前面，慢慢開。',action:''};}
  direction(value){if(Math.abs(this.physics.v)>.15)return this.notify('先把列車停穩，再改變行進方向。');this.controls.direction=value;this.controls.throttle=0;}
  throttle(value){this.controls.throttle=clamp(Math.round(value),0,5);if(this.controls.throttle>0&&this.controls.doors)this.notify('門還開著，動力不會送到車輪。先確認關門。');}
  brake(value){this.controls.brake=clamp(Math.round(value),0,7);if(value>0)this.controls.throttle=0;}
  emergency(){this.controls.emergency=true;this.controls.throttle=0;this.controls.brake=7;this.notify('緊急煞車已啟動。列車完全停穩後，按「解除」。');}
  releaseEmergency(){if(Math.abs(this.physics.v)>.15)return this.notify('等列車完全停穩，再解除緊急煞車。');this.controls.emergency=false;this.protection=false;this.controls.brake=7;this.notify('保護已解除。先釋放煞車，再平順起步。');}
  toggleDoors(){
    if(Math.abs(this.physics.v)>.15)return this.notify('列車還在動，車門保持鎖定。停穩才可開門。');
    if(!this.controls.doors&&this.controls.brake<3)return this.notify('先把煞車設為第 3 段以上，固定列車再開門。');
    this.controls.doors=!this.controls.doors;this.controls.throttle=0;
    if(this.controls.doors&&Math.abs(this.distanceToStop())<=12){this.boarding=0;this.serviced=false;this.notify('車門已開。乘客上下車中，請等候 4 秒。');}
    else if(this.controls.doors)this.notify('請在停車標前後 12 公尺內停穩，才能完成接客。');
    else if(this.serviced){this.stopIndex++;this.serviced=false;if(this.stopIndex>=this.lesson.stops.length)this.finish();else this.notify('乘客上車了。關門確認完成，準備前往下一站。');}
  }
  distanceToStop(){return (this.lesson.stops[this.stopIndex]??this.lesson.end)-this.physics.s;}
  grade(){return this.route.grade*Math.cos(this.physics.s/140);}
  limit(){if(this.lessonId==='lesson3'&&this.physics.s>500&&this.physics.s<790)return 30;return this.lesson.limit;}
  nextSignal(){if(this.protection&&!this.signalCleared)return this.lesson.signals.find(s=>s.type==='red')||null;return this.lesson.signals.find(s=>s.at>this.physics.s-4)||null;}
  signalAspect(signal){if(!signal)return 'green';return signal.type==='red'&&this.signalCleared?'green':signal.type;}
  update(dt){
    if(this.paused||this.completed)return;
    const step=Number.isFinite(dt)?clamp(dt,0,.05):0;if(step===0)return;this.elapsed+=step;const p=this.physics,c=this.controls;
    const red=this.lesson.signals.find(s=>s.type==='red');
    if(red&&!this.signalCleared){
      const distance=red.at-p.s;
      if(distance>2&&distance<70&&Math.abs(p.v)<.15){this.signalWait+=step;if(this.signalWait>=4){this.signalCleared=true;this.stopAssist=false;this.controls.throttle=0;this.controls.brake=7;this.notify('前方列車已離開，號誌轉綠。確認路線後可以前進。');}}
      else this.signalWait=0;
      if(p.s>=red.at&&!this.protection){this.protection=true;this.controls.emergency=true;this.controls.throttle=0;this.infractions.push('越過紅燈');this.notify('越過紅燈，保護系統正在煞車。停穩後解除，等號誌轉綠。');}
      if(this.protection&&Math.abs(p.v)<.15){this.protectionWait+=step;if(this.protectionWait>=4){this.signalCleared=true;this.notify('列車已停穩，前方列車已離開。號誌轉綠，解除保護後重新起步。');}}
      else this.protectionWait=0;
    }
    const speed=Math.abs(p.v)*3.6;
    if(speed>this.limit()+2){this.overspeedTime+=step;if(this.assisted&&speed>this.limit()+5){this.controls.throttle=0;this.controls.brake=Math.max(3,this.controls.brake);}}
    if(Math.abs(p.a)>1.0)this.comfort+=step;
    this.applyStopAssist();stepTrain(p,c,step,this.vehicle,this.grade());
    this.maximumSpeed=Math.max(this.maximumSpeed,speed);
    if(c.doors&&Math.abs(p.v)<.15&&Math.abs(this.distanceToStop())<=12&&!this.serviced){
      this.boarding+=step;if(this.boarding>=4){this.serviced=true;this.stops.push({station:this.route.stationNames[this.stopIndex],error:Math.abs(this.distanceToStop()),at:this.elapsed});this.notify('乘客上車了！按「關門確認」，完成本站。');}
    }
    this.hint=this.buildHint();
    // The boundary stops further forward travel while leaving a stationary train
    // free to release protection and physically reverse back to the platform.
    const requestsForward=c.direction===1&&c.throttle>0&&c.power&&!c.doors&&c.brake===0;
    if(p.s>this.lesson.end+100&&!c.emergency&&(p.v>.02||requestsForward)){this.emergency();this.notify('已超過終點。停穩後選「後退」，用低速回到停車標。');}
  }
  buildHint(){
    const p=this.physics,c=this.controls,d=this.distanceToStop(),signal=this.nextSignal();
    if(c.emergency)return '停穩後按「解除」，重新確認煞車與號誌。';
    if(!c.power)return '按「主電源」，讓駕駛台準備好。';
    if(this.serviced)return '接客完成，按「關門確認」完成本站。';
    if(c.doors&&Math.abs(d)<=12)return `乘客上下車中，還有 ${Math.max(0,Math.ceil(4-this.boarding))} 秒。`;
    if(c.doors)return '確認乘客都已上車，按「關門確認」。';
    if(c.direction===0)return '選「前進」。方向確認後才釋放煞車。';
    if(signal&&this.signalAspect(signal)==='red'){
      if(signal.at-p.s<70&&Math.abs(p.v)<.15)return `紅燈停車成功。前方列車離開前，還要等 ${Math.max(0,Math.ceil(4-this.signalWait))} 秒。`;
      return `前方 ${Math.max(0,Math.round(signal.at-p.s))} 公尺是紅燈。動力歸零，提早煞車停在燈前。`;
    }
    if(d< -12)return '超過停車標了。停穩，選「後退」，用第 1 段動力慢慢回到停車區。';
    if(Math.abs(d)<=12&&Math.abs(p.v)<.15)return '停得很好！保持煞車第 3 段以上，按「開門接客」。';
    if(d<stoppingDistance(Math.abs(p.v),5,this.vehicle,this.grade())+45&&Math.abs(p.v)>.5)return '接近車站了。動力歸零，煞車第 4～5 段；接近停車標時再微調。';
    if(Math.abs(p.v)<.15&&c.brake>0)return '把煞車滑到 0，等氣壓下降，再把動力加到第 1～2 段。';
    if(Math.abs(p.v)<.15&&c.throttle===0)return '煞車已釋放。動力加到第 1～2 段，讓列車慢慢起步。';
    if(Math.abs(p.v)*3.6>this.limit())return '速度太快。收動力並輕煞車，回到限速內。';
    if(this.lessonId==='lesson3'&&p.s>350&&p.s<500)return '前方限速會降到 30 km/h，提早收動力。';
    return '看前方號誌與限速。收動力後仍會滑行，停車要提早準備。';
  }
  finish(){this.completed=true;this.paused=true;this.controls.throttle=0;this.controls.brake=7;const avg=this.stops.reduce((s,v)=>s+v.error,0)/Math.max(this.stops.length,1);this.score=clamp(Math.round(100-avg*1.2-this.overspeedTime*1.5-this.infractions.length*20-this.comfort),0,100);this.hint='課程完成。你已把乘客平穩送到車站。';}
  getState(){return {lesson:this.lessonId,route:this.routeId,vehicle:this.vehicleId,assisted:this.assisted,childMode:this.childMode,stopAssist:this.stopAssist,paused:this.paused,completed:this.completed,s:this.physics.s,speed:this.physics.v*3.6,acceleration:this.physics.a,pressure:this.physics.pressure,traction:this.physics.traction,controls:{...this.controls},elapsed:this.elapsed,stopIndex:this.stopIndex,stops:[...this.stops],station:this.route.stationNames[this.stopIndex],distance:this.distanceToStop(),signal:this.signalAspect(this.nextSignal()),signalDistance:this.nextSignal()?this.nextSignal().at-this.physics.s:null,signalWait:this.signalWait,signalCleared:this.signalCleared,limit:this.limit(),stoppingDistance:stoppingDistance(Math.abs(this.physics.v),5,this.vehicle,this.grade()),hint:this.hint,toast:this.elapsed<this.toastUntil?this.toast:'',score:this.score||0,infractions:[...this.infractions],overspeedTime:this.overspeedTime,maximumSpeed:this.maximumSpeed};}
}
