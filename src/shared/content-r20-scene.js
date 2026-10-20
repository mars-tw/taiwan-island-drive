import {stability as previousStability, observation as previousObservation} from './content-r19-scene.js';
export {pedalState,drivingCue,crossingCue,crossingLocation,crossingTraffic,ticketMismatch,ticketSceneGeometry,ticketDoorState,boardingCue,lessonResult,bendTravel,trafficLabelPosition,landedFriends,completedCrossings,cakeShift,cakeAngle,departLabel,STOP_X,FRONT_RAIL,WHEEL_BOTTOM,DOOR_SILL} from './content-r19-scene.js';

// One bar, one quantity: absolute tray-relative roll. Recovery is a separate
// blue ring driven by the same position, never by an independent timer.
export function stability(g){
 const lean=Math.min(32,Math.abs(g.balanceLean||0)),fill=Math.round(lean/32*100);
 return {...previousStability(g),fill,recovery:100-fill};
}
export function observation(g){return g.crossTime>0?null:previousObservation(g);}

export function queuePosition(door,index,progress,thresholdBottom,width=360,height=550){
 const p=Math.max(0,Math.min(.58,progress));
 // The red-brick surface begins at 52% of the painted scene. Walk across it
 // first, then descend at the door; nobody crosses the carriage side panel.
 const waitingBottom=45.5, across=Math.min(1,p/.26),down=Math.max(0,(p-.26)/.32);
 return {x:[18,50,82][index]+(door-[18,50,82][index])*across,bottom:p>=.58?thresholdBottom:waitingBottom+(thresholdBottom-waitingBottom)*down};
}
