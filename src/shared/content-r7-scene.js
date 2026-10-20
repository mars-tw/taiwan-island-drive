const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Percentages refer to the fixed closeup, so force remains legible as the car recedes.
export function closeupPose(g){
 const x=clamp(g.balancePractice?(g.balanceLean||0)*1.4:g.tierOffset||0,-44,44),v=g.balancePractice?0:g.tierVelocity||0;
 return {base:x*.10,middle:x*.52,top:x,lean:clamp(x*.36,-16,16),flag:clamp(x*.8+v*.12,-48,48),bounce:clamp(-Math.abs(v)*.045,-7,0),warning:g.balancePractice?!!g.balanceDanger:g.rough||g.assisting};
}
export const crossingSide=who=>who==='bike'?'right':'left';
// Both visible arrows use the same countersteer direction, opposite to live lean.
export function cakeFeedback(g){
 if(g.balancePractice){const lean=g.balanceLean||0;return {settled:Math.abs(lean)<3,direction:Math.abs(lean)<3?'':lean<0?'right':'left',fill:Math.max(0,Math.round(100-Math.abs(lean)/32*100))};}
 const settled=Math.abs(g.tilt)<5&&Math.abs(g.tierOffset||0)<4&&Math.abs(g.tierVelocity||0)<12;
 const lean=Math.abs(g.tilt)>5?g.tilt:g.tierOffset||0;
 return {settled,direction:settled?'':lean<0?'right':'left',fill:settled?100:Math.max(0,Math.round(100-Math.min(1,Math.max(Math.abs(g.tilt)/32,Math.abs(g.tierOffset||0)/44))*100))};
}
// Waiting feet are above the zebra. Only confirmed friends enter the roadway.
export function crossingPose(g){
 const p=clamp(g.crossTime/g.crossingDuration,0,1),right=g.crossingPerson==='bike';
 const start=g.crossingPerson==='grandma'?57:39;
 return {x:right?85-p*70:g.crossingPerson==='grandma'?20+p*60:15+p*70,bottom:p<.25?start-p/.25*(start-29):p>.82?29+(p-.82)/.18*10:29};
}
