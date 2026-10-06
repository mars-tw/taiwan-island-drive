import { speakNative,stopNativeSpeech } from '../../shared/native.js';
/** Native uses installed offline voices; identical instructions remain on screen. */
export class ChildVoice {
 constructor(){this.enabled=true;this.unlocked=false;this.last='';this.lastTime=0;}
 unlock(){this.unlocked=true;}
 say(text,key,force=false){if(!this.enabled||!this.unlocked)return;if(key===this.last)return;const now=performance.now();if(!force&&now-this.lastTime<6000)return;this.last=key;this.lastTime=now;void speakNative(text,{lang:'zh-TW',rate:.8,pitch:1.06});}
 stop(){void stopNativeSpeech();}
 toggle(){this.enabled=!this.enabled;if(!this.enabled)this.stop();return !this.enabled;}
}
