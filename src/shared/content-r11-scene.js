const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// Input, palette and text describe the same physical pedal state.
export function pedalState(g,cue){
 if(g.input.go)return {state:cue.release?'release':'held',text:cue.release?'請放開':'踩住中'};
 return g.distance>0?{state:'released',text:'已放開'}:{state:'ready',text:'按住起步'};
}
export function crossingCue(g){
 if(g.speed>0)return {action:'brake',text:'先停下'};
 if(g.crossed===3)return {action:'depart',text:'可以出發'};
 if(g.crossTime>0||g.confirmDelay>0)return {action:'',text:'等朋友到對岸'};
 if(!g.looked.left)return {action:'look-left',text:'← 先看左邊'};
 if(!g.looked.right)return {action:'look-right',text:'→ 再看右邊'};
 if(!g.friendConfirmed)return {action:`look-${g.decisionSide}`,text:`${g.decisionSide==='left'?'←':'→'} 再確認朋友`};
 return {action:'',text:'請朋友慢慢過'};
}
// Passengers finish at t=1.01. Retract step, THEN slide door shut, THEN confirm.
export function ticketDoorState(g){
 if(g.phase!=='boarding')return {state:'closed',open:0,step:0};
 const t=g.boardTime;
 if(t<.06)return {state:'opening',open:clamp(t/.06,0,1),step:0};
 if(t<1.04)return {state:'open',open:1,step:1};
 if(t<1.20)return {state:'retracting',open:1,step:clamp((1.20-t)/.16,0,1)};
 if(t<1.40)return {state:'closing',open:clamp((1.40-t)/.20,0,1),step:0};
 return {state:'closed',open:0,step:0};
}
export function ticketSceneGeometry(g){
 // Generated train doorway is 78% along its body. A numbered stop marker
 // is placed directly below this sill, rather than between two stations.
 const x=g.trainX*.4,door=x+50*.78;
 return {x,door,markers:[2,18,34].map(v=>v*.4+50*.78)};
}
export function ticketHint(g,fallback){
 if(g.kind!=='tickets')return fallback;
 if(g.phase==='boarding'){const {state}=ticketDoorState(g);return state==='retracting'?'大家坐好，先收踏階。':state==='closing'?'踏階收好了，再關門。':state==='closed'?'三位坐好了，門關好了 ✓':'朋友慢慢上車，等一等。';}
 if(g.phase==='playing'&&g.selected>=0&&!g.matched&&g.distance>=28&&g.speed===0)return '形狀或顏色不同，點別的站牌。';
 return fallback;
}
export function cakeStatus(g){
 const lean=Math.abs(g.balancePractice?g.balanceLean:g.tilt);
 return lean>=18||g.balanceDanger?'danger':lean>=5?'leaning':'steady';
}
export function lessonResult(g){
 const f=g.facts;
 if(g.kind==='cake')return {title:'三站完成・蛋糕送到了',learned:'會放開放慢，也會停穩再起步',detail:f.recoveries?`全程扶正 ${f.recoveries} 次，蛋糕回穩了。`:'蛋糕坐穩了，和朋友一起分享。',practice:f.assists?'下次試試提早放開，少用慢行幫忙。':'下次試試用更小的轉向扶正。'};
 if(g.kind==='crossing')return {title:'三站完成・謝謝你等我們',learned:`${f.waited} 位朋友都等到了`,detail:f.blockedStarts?'每位都重新看左右，提醒後再安全出發。':'每位都重新看左右，等到岸才出發。',practice:'下次試試自己認出哪一側還有朋友。'};
 return {title:'三站完成・大家坐好了',learned:`形狀和顏色都對上，${f.boarded} 位坐好了`,detail:f.reselections?`全程自己改選 ${f.reselections} 次，再停穩開門。`:'全程停對月台，等大家坐好再關門。',practice:'下次先看形狀，再確認顏色。'};
}
