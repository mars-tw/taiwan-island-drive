import {fill} from './content-text.js';
// Facts come only from performed actions; no score, rating or reward currency.
export function lessonFacts(g){
 const f=g.facts;
 if(g.kind==='cake')return [{glyph:'right',text:fill('練會回穩 {n} 次',{n:f.recoveries})}, {glyph:'brake',text:fill('灣位停穩 {stops} 次・再起步 {restarts} 次',{stops:f.bayStops,restarts:f.bayRestarts})}, {glyph:'go',text:fill('慢行輔助 {n} 次',{n:f.assists})}];
 if(g.kind==='crossing')return [{glyph:'left',text:fill('先看左 {n} 次',{n:f.leftViews})},{glyph:'right',text:fill('先看右 {n} 次',{n:f.rightViews})},{glyph:'eye',text:fill('再確認 {checks} 次・等 {waited} 位・出發提醒 {reminders} 次',{checks:f.confirmations||0,waited:f.waited,reminders:f.blockedStarts||0})}];
 return [{glyph:'door',text:fill('{n} 位已坐好',{n:Math.min(3,f.boarded)})},{glyph:'eye',text:f.reselections?fill('自己改選 {n} 次',{n:f.reselections}):'一次就找對'},{glyph:'brake',text:'形狀、顏色都對上'}];
}
