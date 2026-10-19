// Facts come only from performed actions; no score, rating or reward currency.
export function lessonFacts(g){
 const f=g.facts;
 if(g.kind==='cake')return [{glyph:'right',text:`練會扶正 ${f.recoveries} 次`}, {glyph:'brake',text:`灣位停穩 ${f.bayStops} 次・再起步 ${f.bayRestarts} 次`}, {glyph:'go',text:`慢行輔助 ${f.assists} 次`}];
 if(g.kind==='crossing')return [{glyph:'left',text:`先看左 ${f.leftViews} 次`},{glyph:'right',text:`先看右 ${f.rightViews} 次`},{glyph:'eye',text:`再確認 ${f.confirmations||0} 次・等 ${f.waited} 位・出發提醒 ${f.blockedStarts||0} 次`}];
 return [{glyph:'door',text:`${Math.min(3,f.boarded)} 位已坐好`},{glyph:'eye',text:f.reselections?`自己改選 ${f.reselections} 次`:'一次就找對'},{glyph:'brake',text:'形狀、顏色都對上'}];
}
