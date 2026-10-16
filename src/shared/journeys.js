// Playable short outings. Progress is separate from R1's collected-star wallet.
import {progressStorage} from './student-save.js';
export const PASSPORT_KEY = 'island-transport:passport:v1';
export const MODE_NAMES = Object.freeze({car:'汽車',train:'火車',flight:'飛機'});
export const JOURNEYS = Object.freeze([
  {id:'car-1',mode:'car',name:'海風找星星',goal:'開 360 公尺，找找路上的星星',tip:'按自動油門，再點左右轉向。按住煞車就會減速。',story:'海風吹來了！第一枚公路章收好了。',map:'coast',distance:360},
  {id:'car-2',mode:'car',name:'椰子樹兜風',goal:'開 600 公尺，試著收集更多星星',tip:'星星在兩側，輕輕按左右，沿著路面開。',story:'繞過椰子樹，帶著星星回家。',map:'kenting',distance:600},
  {id:'car-3',mode:'car',name:'城市小司機',goal:'開 850 公尺，沿著路燈前進',tip:'看到彎道先鬆油門，也可以按住煞車。',story:'路燈亮了，城市章也亮了！',map:'taipei',distance:850},
  {id:'car-4',mode:'car',name:'森林彎彎路',goal:'開 1100 公尺，完成山路旅程',tip:'慢慢轉彎就好，沒有倒數計時。',story:'穿過森林，四枚公路章都收齊了！',map:'alishan',distance:1100},
  {id:'train-1',mode:'train',name:'海風站接朋友',goal:'停靠 1 站，開門等乘客上車',tip:'準備出發 → 開始前進 → 幫我停好 → 開門接客。',story:'朋友上車了！關門後，第一趟接客完成。',route:'coast',lesson:'outing1'},
  {id:'train-2',mode:'train',name:'城市兩站行',goal:'連續停靠 2 站，記得關門再走',tip:'每站都要開門等 4 秒，再關門出發。',story:'河畔和星光站的朋友都到了！',route:'city',lesson:'outing2'},
  {id:'train-3',mode:'train',name:'紅燈等一等',goal:'紅燈前停好，綠燈再去接客',tip:'先按幫我停好，等綠燈，再按開始前進。',story:'你等了綠燈，大家平安到站！',route:'coast',lesson:'outing3'},
  {id:'train-4',mode:'train',name:'森林三站遊',goal:'停靠 3 站，把朋友送進森林',tip:'一站一站來，跟著黃色停車提示。',story:'杉林、雲霧、森林站，三站都到齊了！',route:'forest',lesson:'outing4'},
  {id:'flight-1',mode:'flight',name:'第一份空中寶藏',goal:'找到 2 顆星星',tip:'已經在空中了，點左右可轉彎，助飛會帶你找星星。',story:'兩顆星星帶回來了，尋寶章亮起來！',map:'coast',lesson:'treasure',targets:2},
  {id:'flight-2',mode:'flight',name:'小島送信',goal:'送達 1 份郵件',tip:'助飛會對準郵箱，自動把信送下去。',story:'小島收到你的信了！',map:'island',lesson:'mail',targets:1},
  {id:'flight-3',mode:'flight',name:'河灣看風景',goal:'探訪 1 個景點，平穩飛過',tip:'靠近景點後，平穩看 3 秒就能蓋章。',story:'河灣裡有稻田，觀景章收好了。',map:'valley',lesson:'tour',targets:1},
  {id:'flight-4',mode:'flight',name:'城市尋寶隊',goal:'找到 4 顆星星',tip:'跟著金色星星飛，想休息就按暫停。',story:'四顆星星都找到了，你是空中尋寶隊員！',map:'metro',lesson:'treasure',targets:4},
].map(Object.freeze));
export const journeyById = id => JOURNEYS.find(journey=>journey.id===id);
export const journeysFor = mode => JOURNEYS.filter(journey=>journey.mode===mode);
const fresh = () => ({ratings:{}});
let memory = fresh(), unsaved = false;
const listeners = new Set();
function storage(){return progressStorage;}
export function normalizePassport(value){
  const result=fresh();
  for(const journey of JOURNEYS){const n=value?.ratings?.[journey.id];if(Number.isInteger(n)&&n>=1&&n<=3)result.ratings[journey.id]=n;}
  return result;
}
export function readPassport(){
  try{const saved=storage()?.getItem(PASSPORT_KEY);memory=normalizePassport(saved?JSON.parse(saved):{});}catch{ /* Retain this session's progress. */ }
  return {ratings:{...memory.ratings}};
}
export function isJourneyOpen(id,passport=readPassport()){
  const journey=journeyById(id);if(!journey)return false;
  const chapters=journeysFor(journey.mode),index=chapters.indexOf(journey);
  return index===0||Boolean(passport.ratings[chapters[index-1].id]);
}
export function completeJourney(id,rating){
  const passport=readPassport(),journey=journeyById(id);
  if(!journey||!isJourneyOpen(id,passport)||!Number.isInteger(rating)||rating<1||rating>3)return false;
  const previous=passport.ratings[id]||0;
  if(rating<=previous)return false;
  passport.ratings[id]=rating;memory=normalizePassport(passport);
  try{const target=storage();if(!target)throw new Error('No storage');target.setItem(PASSPORT_KEY,JSON.stringify(memory));unsaved=false;}catch{unsaved=true;}
  for(const listener of listeners)listener(readPassport());
  return true;
}
export function passportSummary(passport=readPassport()){
  const completed=JOURNEYS.filter(journey=>passport.ratings[journey.id]).length;
  const stars=Object.values(passport.ratings).reduce((sum,rating)=>sum+rating,0);
  const badges=Object.keys(MODE_NAMES).filter(mode=>journeysFor(mode).every(journey=>passport.ratings[journey.id]));
  return {completed,stars,badges};
}
export function nextJourney(id,passport=readPassport()){
  const journey=journeyById(id);if(!journey)return null;
  const chapters=journeysFor(journey.mode);return chapters[chapters.indexOf(journey)+1]||null;
}
export function requestedJourney(mode,search=globalThis.location?.search||''){
  const journey=journeyById(new URLSearchParams(search).get('journey'));
  return journey?.mode===mode&&isJourneyOpen(journey.id)?journey:null;
}
export function subscribePassport(listener){listeners.add(listener);return()=>listeners.delete(listener);}
export function resetPassportForTest(){memory=fresh();unsaved=false;try{storage()?.removeItem(PASSPORT_KEY);}catch{}}
