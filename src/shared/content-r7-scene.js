const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Percentages refer to the fixed closeup, so force remains legible as the car recedes.
export function closeupPose(g){
 const x=clamp(g.tierOffset||0,-44,44),v=g.tierVelocity||0;
 return {base:x*.10,middle:x*.52,top:x,lean:clamp(x*.36,-16,16),flag:clamp(x*.8+v*.12,-48,48),bounce:clamp(-Math.abs(v)*.045,-7,0),warning:g.rough||g.assisting};
}
export const crossingSide=who=>who==='bike'?'right':'left';
