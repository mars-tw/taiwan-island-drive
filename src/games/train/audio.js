export class TrainAudio{
  constructor(){this.enabled=false;this.ctx=null;}
  unlock(){if(!this.ctx){this.ctx=new AudioContext();this.osc=this.ctx.createOscillator();this.osc.type='sawtooth';this.filter=this.ctx.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=180;this.gain=this.ctx.createGain();this.gain.gain.value=0;this.osc.connect(this.filter).connect(this.gain).connect(this.ctx.destination);this.osc.start();}this.ctx.resume();this.enabled=true;}
  update(speed,paused){if(!this.ctx)return;this.osc.frequency.setTargetAtTime(25+Math.abs(speed)*1.2,this.ctx.currentTime,.2);this.gain.gain.setTargetAtTime(this.enabled&&!paused?Math.min(.035,Math.abs(speed)*.001):0,this.ctx.currentTime,.2);}
  horn(){if(!this.ctx)this.unlock();const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.frequency.value=310;o.type='triangle';g.gain.value=.13;o.connect(g).connect(this.ctx.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+.6);o.stop(this.ctx.currentTime+.65);}
  toggle(){if(!this.ctx)this.unlock();else this.enabled=!this.enabled;}
}
