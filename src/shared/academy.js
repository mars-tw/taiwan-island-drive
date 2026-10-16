import {readStudent,saveStudent,updateStudentSection} from './student-save.js';
import {dispatchAction,dispatchLesson,normalizeDispatch} from '../games/math/dispatch.js';
export const ACADEMY_CHAPTERS=Object.freeze([
  {id:'math',name:'列車數學課',story:'海風站要接朋友去山海教室。先把同一班乘客裝滿、分車，再算前車帶走幾人。'},
  {id:'train-1',name:'海風站接朋友',story:'拿著調度單，停穩、開門，把朋友接到轉運站。'},
  {id:'car-1',name:'公路送補給',story:'朋友已到轉運站，開車把教室補給帶過海岸公路。'},
  {id:'flight-1',name:'空中找路標',story:'補給送到了，起飛找兩顆星星路標，帶大家找到山海教室。'},
]);
const count=n=>Number.isSafeInteger(n)&&n>=0&&n<=9999?n:0;
export function readAcademy(){const a=readStudent().sections.academy||{};return {dispatch:normalizeDispatch(a.dispatch),delivered:count(a.delivered),awarded:count(a.awarded),imported:typeof a.imported==='string'?a.imported:null,archive:typeof a.archive==='string'?a.archive:null};}
export function academySummary(record=readStudent()){
  const a=record.sections.academy||{},ratings=record.sections.passport?.ratings||{};
  const done=[normalizeDispatch(a.dispatch).completed>0,...ACADEMY_CHAPTERS.slice(1).map(c=>!!ratings[c.id])];
  let index=done.findIndex(value=>!value);if(index<0)index=ACADEMY_CHAPTERS.length;
  return {index,done,next:ACADEMY_CHAPTERS[index]||null,passengers:count(a.delivered),badge:index===4,mathBadge:done[0]};
}
export function performDispatch(action,level='small'){
  const record=readStudent(),a=readAcademy(),previous=a.dispatch.completed;
  const result=dispatchAction(a.dispatch,action,level);a.dispatch=result.state;
  if(result.state.completed>previous){
    const q=dispatchLesson(result.state.active.level,previous);a.delivered=q.front;
    // Imported completion is historical; only newly played dispatches earn stars.
    const rewards=record.sections.rewards||{};
    record.sections.rewards={...rewards,train:Math.min(99999,(Number(rewards.train)||0)+1)};
    a.awarded=Math.min(9999,a.awarded+1);
  }
  record.sections.academy=a;saveStudent(record);return result;
}
export function decodeTrainBackup(text){
  if(typeof text!=='string'||text.length>262144)throw Error('備份太大，請選擇小小列車長匯出的備份。');
  let data;try{data=JSON.parse(text);}catch{throw Error('備份不是可讀的 JSON。');}
  if(data?.format!=='taiwan-train-math.backup'||data.version!==1||data.passport?.version!==1||!(data.session===null||typeof data.session==='string'))throw Error('這不是支援的小小列車長備份。');
  const dispatch=normalizeDispatch(data.passport.dispatch);
  const raw=data.passport.dispatch;
  if(raw&&(dispatch.completed!==raw.completed||Boolean(dispatch.active)!==Boolean(raw.active)||dispatch.active&&['level','phase','front','rear'].some(k=>dispatch.active[k]!==raw.active[k])))throw Error('調度進度不完整，尚未匯入。');
  return {dispatch,archive:text};
}
export function importTrainBackup(text){
  const decoded=decodeTrainBackup(text),a=readAcademy();
  if(a.dispatch.active&&a.dispatch.active.phase!=='done'&&decoded.dispatch.completed>a.dispatch.completed)throw Error('這班還在調度，請先完成，再匯入較新的備份。');
  // One source identity, max-count merge: repeat backups never mint rewards.
  if(!a.imported&&a.dispatch.completed===0&&!a.dispatch.active)a.dispatch=decoded.dispatch;
  else if(decoded.dispatch.completed>a.dispatch.completed){a.dispatch=decoded.dispatch;}
  a.imported='taiwan-train-math.v1';a.archive=decoded.archive;
  if(a.dispatch.completed&&a.dispatch.active?.phase==='done')a.delivered=a.dispatch.active.front;
  updateStudentSection('academy',a);return a;
}
