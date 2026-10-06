/** Original Taiwan-inspired scaled sightseeing points; not geographical data. */
export const NAVIGATION_POINTS=[{x:0,y:145,z:500},{x:150,y:145,z:1000},{x:260,y:145,z:1510}];
const TOUR={
 coast:[['海岸燈塔',-700,240,2500],['海灣小港',800,260,5700],['海蝕岩島',-600,280,9000]],
 valley:[['稻田河灣',600,220,2500],['縱谷農庄',-700,240,5700],['山谷觀景台',500,300,9000]],
 island:[['白色燈塔',-700,240,2500],['離島小港',700,250,5700],['玄武岩海灣',-500,280,9000]],
 metro:[['都會河岸',700,240,2500],['河灣公園',-700,260,5700],['城市觀景台',600,320,9000]]
};
export function getFlightTargets(mode,map='coast'){
 let points=[];
 if(mode==='navigation')points=NAVIGATION_POINTS.map((p,i)=>({...p,label:`導航圈 ${i+1}`,kind:'ring',radius:100}));
 if(mode==='treasure')points=[[0,160,550],[60,170,1000],[140,160,1450],[220,175,1900],[240,170,2350],[220,180,2800]].map(([x,y,z],i)=>({x,y,z,label:`星星 ${i+1}`,kind:'star',radius:135}));
 if(mode==='mail')points=[{x:-150,y:0,z:1100,label:'第一座郵箱',kind:'mail',radius:180,flightAltitude:125},{x:220,y:0,z:2300,label:'第二座郵箱',kind:'mail',radius:180,flightAltitude:125}];
 if(mode==='tour')points=(TOUR[map]||TOUR.coast).map(([label,x,y,z])=>({label,x,y,z,kind:'landmark',radius:450,dwellSeconds:3}));
 return points.map((p,i)=>({id:`${mode}-${map}-${i+1}`,visited:false,...p}));
}
export function getFlightTarget(mission){return mission.targets?.[mission.passed]||null;}
export function getPilotTarget(mission){const target=getFlightTarget(mission);return target?{...target,y:target.flightAltitude??target.y}:null;}
export function makeReturnRoute(s){
 const side=s.position.x<0?-1:1;
 return [{id:'home-downwind',label:'機場外圍',kind:'home',x:side*1800,y:Math.max(350,Math.min(700,s.position.y)),z:-3500,radius:380},
 {id:'home-base',label:'對準進場方向',kind:'home',x:0,y:280,z:-3500,radius:300},
 {id:'home-final',label:'回到跑道前方',kind:'home',x:0,y:165,z:-2100,radius:240},
 {id:'home-approach',label:'慢慢進場',kind:'home',x:0,y:82,z:-1050,radius:130}];
}
