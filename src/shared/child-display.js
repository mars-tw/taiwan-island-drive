// Child-facing instruments use one consistent meaning, independently of rewards.
export function roadSpeedDisplay(speed) {
  const value=Math.max(0,Number.isFinite(speed)?speed:0);
  return {bars:value<1?0:Math.min(5,Math.ceil(value/30)),label:value<1?'停穩了':value<=60?'慢慢開':value<=120?'前進中':'開得快'};
}
export function childFlightDisplay(state,terrain=0) {
  const clearance=Math.max(0,(state.position?.y||0)-Math.max(0,terrain));
  const height=state.grounded?0:Math.max(1,Math.min(5,Math.ceil(clearance/80)));
  const wind=Math.max(0,Math.min(5,Math.ceil((state.airspeed||0)/12)));
  return {height,wind,label:state.grounded?((state.airspeed||0)>2?'沿跑道前進':'跑道準備中'):'離地飛行',clearance};
}
