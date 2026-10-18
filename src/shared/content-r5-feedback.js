// Facts come only from performed actions; no score, rating or reward currency.
export function lessonFacts(g){
 const f=g.facts;
 if(g.kind==='cake')return [{glyph:'right',text:f.recoveries?'有扶正蛋糕':'慢慢送蛋糕'}, {glyph:'brake',text:f.bayStops?'灣位停穩再出發':'練習慢慢停'}, {glyph:'go',text:f.assists?'阿路陪你慢下來':'一路自己照顧'}];
 if(g.kind==='crossing')return [{glyph:'left',text:`看左 ${f.leftViews} 次`},{glyph:'right',text:`看右 ${f.rightViews} 次`},{glyph:'eye',text:`等 ${f.waited} 位朋友`}];
 return [{glyph:'door',text:`${Math.min(3,f.boarded)} 位已坐好`},{glyph:'eye',text:f.reselections?`自己改選 ${f.reselections} 次`:'一次就找對'},{glyph:'brake',text:'形狀、顏色都對上'}];
}
