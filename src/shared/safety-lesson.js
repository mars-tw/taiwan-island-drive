// Three transport systems, judged by simulated time and deliberate controls.
import {progressStorage} from './student-save.js';
export const SAFETY_KEY = 'island-transport:safety:v1';
export const SAFETY_STOPS = Object.freeze([
  {mode:'car', name:'路口停看走', rule:'停穩後等綠燈，路口空了再走。'},
  {mode:'train', name:'月台接朋友', rule:'停穩、開門、等候上車，關門後才出發。'},
  {mode:'flight', name:'跑道先看清', rule:'跑道使用中，先等一等；空了再確認出發。'},
].map(Object.freeze));
export function normalizeSafety(value) {
  return {completed:Number.isInteger(value?.completed) && value.completed >= 0 && value.completed <= 3 ? value.completed : 0};
}
export function createSafetyStorage(target = () => progressStorage) {
  let memory = {completed:0}, unsaved = false;
  return {
    read() { if(!unsaved)try { const value=target()?.getItem(SAFETY_KEY); if(value)memory=normalizeSafety(JSON.parse(value)); }catch{} return {...memory}; },
    save(value) { memory=normalizeSafety(value); try { const store=target(); if(!store)throw new Error('Storage unavailable'); store.setItem(SAFETY_KEY,JSON.stringify(memory)); unsaved=false; }catch{unsaved=true;} return !unsaved; },
    get saved() { return !unsaved; },
  };
}
export class SafetyLesson {
  constructor({completed=0, checkpoint=()=>{}}={}) {
    this.completed=normalizeSafety({completed}).completed;
    this.checkpoint=checkpoint;
    this.stage=Math.min(2,this.completed);
    this.phase=this.completed===3?'done':'intro';
    this.paused=false;
    this.resetScene();
  }
  resetScene() {
    this.speed=this.stage<2?12:0; this.braking=false; this.observed=0;
    this.doors=false; this.boarded=false; this.waiting=false; this.message='';
  }
  get clear() { return this.observed>=4; }
  get ready() { return this.stage===0 ? this.speed===0&&this.clear : this.stage===1 ? this.speed===0&&this.boarded&&!this.doors : this.waiting&&this.clear; }
  tick(dt) {
    if(this.paused||this.phase!=='playing'||!Number.isFinite(dt)||dt<=0)return;
    const step=Math.min(dt,.1); // No time credit for tab stalls or background time.
    if(this.stage<2&&this.braking)this.speed=Math.max(0,this.speed-step*8);
    if((this.stage===0&&this.speed===0)||(this.stage===1&&this.doors)||(this.stage===2&&this.waiting))this.observed=Math.min(4,this.observed+step);
    if(this.stage===1&&this.clear)this.boarded=true;
  }
  pause() { this.paused=true; this.braking=false; }
  resume() { this.paused=false; }
  getState() { return {paused:this.paused,completed:this.phase==='done'}; }
  act(action) {
    if(action==='release'){this.braking=false;return false;}
    if(this.paused)return false;
    this.message='';
    if(action==='begin'&&this.phase==='intro'){this.phase='playing';return true;}
    if(action==='next'&&this.phase==='checkpoint'){this.stage++;this.phase='intro';this.resetScene();return true;}
    if(action==='replay'&&this.phase==='done'){this.stage=0;this.phase='intro';this.resetScene();return true;}
    if(this.phase!=='playing')return false;
    if(action==='brake'&&this.stage<2){this.braking=true;return true;}
    if(action==='open'&&this.stage===1){
      if(this.speed>0){this.message='還在移動，請先按住煞車停穩。';return false;}
      this.doors=true;return true;
    }
    if(action==='close'&&this.stage===1){
      if(!this.boarded){this.message='朋友還在上車，車門先保持打開。';return false;}
      this.doors=false;return true;
    }
    if(action==='wait'&&this.stage===2){this.waiting=true;return true;}
    if(action==='depart'){
      if(!this.ready){this.message=this.stage===0?'先停穩，再等綠燈和路口清空。':this.stage===1?'先停穩接客，等朋友上車後關門。':'跑道使用中，先按「等一等」觀察。';return false;}
      this.braking=false;this.completed=Math.max(this.completed,this.stage+1);
      this.phase=this.stage===2?'done':'checkpoint';this.checkpoint({completed:this.completed});return true;
    }
    return false;
  }
}
