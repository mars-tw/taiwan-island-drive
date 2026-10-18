import assert from 'node:assert/strict';
// R7 requires an explicit directional observation before every friend starts.
export function finishCrossing(g){
 while(g.crossed<3){assert.equal(g.needsDecision,true);g.look(g.decisionSide);assert.equal(g.friendConfirmed,true);const before=g.crossed;for(let i=0;i<Math.ceil((g.crossingDuration+.7)*60);i++)g.update(1/60);assert.equal(g.crossed,before+1);}
}
