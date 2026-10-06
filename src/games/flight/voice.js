/** Browser speech is optional; identical short instructions remain on screen. */
export class ChildVoice {
 constructor(){this.enabled=true;this.unlocked=false;this.last='';this.lastTime=0;}
 unlock(){this.unlocked=true;}
 say(text,key,force=false){if(!this.enabled||!this.unlocked||!('speechSynthesis'in window))return;if(key===this.last)return;const now=performance.now();if(!force&&now-this.lastTime<6000)return;this.last=key;this.lastTime=now;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='zh-TW';u.rate=.8;u.pitch=1.06;const voice=speechSynthesis.getVoices().find(v=>v.lang==='zh-TW')||speechSynthesis.getVoices().find(v=>v.lang.startsWith('zh'));if(voice)u.voice=voice;speechSynthesis.speak(u);}
 stop(){if('speechSynthesis'in window)speechSynthesis.cancel();}
 toggle(){this.enabled=!this.enabled;if(!this.enabled)this.stop();return !this.enabled;}
}
