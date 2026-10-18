const clamp=v=>Math.max(0,Math.min(1,v));
// One friend finishes the doorway and aisle before the next friend leaves the queue.
// The existing lesson clock and closed-door dwell remain the completion authority.
export function boardingFrame(time,index,seated=false){
 const progress=clamp((time-.10-index*.28)/.26);
 return {progress,seated:seated||progress>=1,inside:progress>=.6,pose:Math.floor(progress*6)%2};
}
export function passengerPosition(geometry,index,progress){
 const origin=geometry.door-10-index*18;
 return {x:origin+(geometry.door-origin)*clamp(progress/.45),bottom:35.5-clamp((progress-.45)/.15)*10.5};
}
export function aislePosition(progress,index){
 return 76+(13+index*21-76)*clamp((progress-.6)/.4);
}
// Contact, high knee and planted-foot drawings accompany visible forward travel.
export function grandmaFrame(progress){return progress<.34?0:progress<.72?1:2;}
