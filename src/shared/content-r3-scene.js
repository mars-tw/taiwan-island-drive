const clamp01=v=>Math.max(0,Math.min(1,v));
export const PLATFORM_X=[15,50,85];
export const TRAIN_WIDTH=64;
export function boardingPose(time,index,seated=false){
 const progress=clamp01((time-index*.24)/.48);
 return {progress,seated:seated||progress>=1,pose:Math.floor(time*5)%2};
}
export function ticketGeometry(lesson){
 const x=lesson.trainX;
 return {x,door:x+TRAIN_WIDTH*.84,queue:PLATFORM_X[Math.max(0,lesson.selected)]};
}
