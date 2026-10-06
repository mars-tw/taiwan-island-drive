import * as THREE from 'three';
import {getFlightTargets} from './flight-plans.js';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=(a,b,n)=>{const t=clamp((n-a)/(b-a),0,1);return t*t*(3-2*t);};
const random=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const gaussian=(x,z,cx,cz,sx,sz,h)=>h*Math.exp(-((x-cx)**2/(sx*sx)+(z-cz)**2/(sz*sz)));
const material=(color,roughness=.9)=>new THREE.MeshStandardMaterial({color,roughness});
const EXTENT=Object.freeze({xMin:-18000,xMax:18000,zMin:-18000,zMax:18000,width:36000,depth:36000,unit:'metre'});
const PALETTES={
 coast:{sky:0xbfcdd3,water:0x3b6d7b,low:0x7d8b69,forest:0x536657,rock:0x7b817b,sand:0xc1b698},
 valley:{sky:0xc7d0d0,water:0x51757b,low:0x83916d,forest:0x4e6353,rock:0x81877c,sand:0xb6ac8c},
 island:{sky:0xc0d5da,water:0x347c8b,low:0x999d77,forest:0x687c67,rock:0x747872,sand:0xd2c4a4},
 metro:{sky:0xbdcbd1,water:0x476e7c,low:0x7d8b70,forest:0x526755,rock:0x808782,sand:0xbdb394}
};

export class FlightScenery {
 constructor(id='coast',quality='high'){
  this.id=PALETTES[id]?id:'coast';this.palette=PALETTES[this.id];this.quality=quality;this.extent=EXTENT;this.root=new THREE.Group();this.root.name=`TaiwanLandscape_${this.id}`;this.papi=[];this.waveUniform={value:0};this.tourTargets=getFlightTargets('tour',this.id);this.activityLandmarks=[];
  this.landmarks=[
   {id:'home-airport',label:'島嶼主機場',kind:'airport',x:0,y:0,z:900,runwayLength:1800},
   {id:'valley-airport',label:this.id==='island'?'西島小機場':'縱谷小機場',kind:'airport',x:-7600,y:0,z:8000,runwayLength:1000},
   {id:'east-airport',label:this.id==='island'?'南島機場':'海灣機場',kind:'airport',x:8500,y:0,z:-7500,runwayLength:1100},
   {id:'harbor',label:this.id==='metro'?'河口港區':'藍灣港口',kind:'harbor',x:1450,y:0,z:6000},
   {id:'observation',label:this.id==='metro'?'城市觀景塔':'山海觀景區',kind:'viewpoint',x:-1150,y:20,z:9300}
  ];
  this.buildTerrain();this.buildSea();this.buildFields();this.buildRoads();this.buildSettlements();this.buildTrees();this.buildAirport(this.landmarks[0],true);this.buildAirport(this.landmarks[1]);this.buildAirport(this.landmarks[2]);this.buildLandmarks();this.buildActivityLandmarks();
 }
 coastX(z){let x=1800+650*Math.sin(z/3300)+350*Math.sin(z/1300);if(this.id==='coast')x-=gaussian(0,z,0,5700,1,850,1350)+gaussian(0,z,0,9000,1,1600,2600);return x;}
 riverX(z){const points=[[-18000,-900],[2500,this.tourTargets[0].x-120],[5700,this.tourTargets[1].x+130],[9000,this.tourTargets[2].x-220],[18000,-600]];for(let i=1;i<points.length;i++){if(z<=points[i][0]){const a=points[i-1],b=points[i];return a[1]+(b[1]-a[1])*smooth(a[0],b[0],z);}}return -600;}
 terrainHeight(x,z){
  const coast=this.coastX(z);let h;
  if(this.id==='island'){
   h=-12;
   for(const [cx,cz,rx,rz,height] of [[0,800,3800,6200,68],[-7600,8000,3500,3000,140],[8500,-7500,3500,3400,115],[8200,9000,3100,4100,120],[-11000,-8500,3000,4200,155]]){
    const r=Math.sqrt(((x-cx)/rx)**2+((z-cz)/rz)**2);h=Math.max(h,(1-smooth(.58,1.12,r))*height-9);
   }
  }else{
   const shore=1-smooth(coast-280,coast+220,x);
   const ridge=gaussian(x,z,-7000,-7000,4400,4300,970)+gaussian(x,z,-9500,5500,4500,4900,1250)+gaussian(x,z,-6300,13800,3700,4600,1000);
   const east=this.id==='valley'?gaussian(x,z,8400,4200,3900,9000,820):0;
   const foothill=(Math.sin(x/730)*Math.cos(z/990)+Math.sin(z/480+x/850)*.42)*36;
   h=(ridge+east+Math.max(2,foothill))*shore-10*(1-shore);
   if(this.id==='coast'||this.id==='metro')h=Math.max(h,gaussian(x,z,8500,-7500,2500,2600,115)-9);
  }
  // A natural low coastal/valley corridor contains all lessons, return legs and
  // delivery targets. Mountains remain outside this original training route.
  const corridor=(1-smooth(1600,2800,Math.abs(x)))*(1-smooth(10800,13400,z))*smooth(-5500,-4000,z);
  if(h>0)h=h*(1-corridor*.96);
  if(this.id!=='island'&&x<this.coastX(z)-100)h=Math.max(0,h);
  for(const airport of this.landmarks.slice(0,3)){
   const dx=(x-airport.x)/720,dz=(z-airport.z)/(airport.runwayLength/2+700);const r=Math.sqrt(dx*dx+dz*dz);h*=smooth(.85,1.9,r);
  }
  if(this.id==='valley'||this.id==='metro'){
   const river=this.riverX(z);const bank=1-smooth(65,145,Math.abs(x-river));
   if(Math.abs(x)>350&&z>-5000&&z<15500)h-=bank*3;
  }
  return h;
 }
 terrainColor(x,z,h){
  const p=this.palette,c=new THREE.Color();
  const nearAirport=this.landmarks.slice(0,3).some(a=>Math.abs(x-a.x)<1200&&Math.abs(z-a.z)<a.runwayLength/2+900);
  if(h<1.5&&nearAirport)c.setHex(p.low);
  else if(h<1.5&&this.id!=='island'&&x<this.coastX(z)-320)c.setHex(p.low);
  else if(h<1.5)c.setHex(p.sand).lerp(new THREE.Color(p.low),smooth(-1,10,h));
  else if(h<420)c.setHex(p.low).lerp(new THREE.Color(p.forest),smooth(40,420,h));
  else c.setHex(p.forest).lerp(new THREE.Color(p.rock),smooth(530,1300,h));
  const variation=.96+.08*Math.sin(x/311)*Math.cos(z/239)+.025*Math.sin((x+z)/57);c.multiplyScalar(variation);return c;
 }
 buildTerrain(){
  const segments=144,geometry=new THREE.PlaneGeometry(36000,36000,segments,segments);geometry.rotateX(-Math.PI/2);const a=geometry.attributes.position,colors=new Float32Array(a.count*3);
  for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i),h=this.terrainHeight(x,z),c=this.terrainColor(x,z,h);a.setY(i,h);colors.set([c.r,c.g,c.b],i*3);}geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.computeVertexNormals();
  const terrain=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));terrain.name='Smooth36kmTerrain';terrain.receiveShadow=true;this.root.add(terrain);this.terrain=terrain;
 }
 buildSea(){
  const geometry=new THREE.PlaneGeometry(40000,40000,64,64);geometry.rotateX(-Math.PI/2);const a=geometry.attributes.position,colors=new Float32Array(a.count*3),deep=new THREE.Color(this.palette.water),shallow=new THREE.Color(0x7aa8a1);
  for(let i=0;i<a.count;i++){const h=this.terrainHeight(a.getX(i),a.getZ(i)),c=deep.clone().lerp(shallow,1-smooth(-9,-1,h));colors.set([c.r,c.g,c.b],i*3);}geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.39,metalness:.16});mat.onBeforeCompile=shader=>{shader.uniforms.flightWaterTime=this.waveUniform;shader.vertexShader='uniform float flightWaterTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.y += 0.22*sin(position.x*0.017+flightWaterTime*0.34)+0.12*cos(position.z*0.023-flightWaterTime*0.21);');};
  const water=new THREE.Mesh(geometry,mat);water.position.y=-.68;water.name='DepthGradedSea';this.root.add(water);this.water=water;
 }
 batchBoxes(name,items,mat){const geometry=new THREE.BoxGeometry(1,1,1);const mesh=new THREE.InstancedMesh(geometry,mat,items.length);const object=new THREE.Object3D();items.forEach((item,i)=>{object.position.set(item.x,item.y,item.z);object.scale.set(item.w,item.h,item.d??item.w);object.rotation.set(0,item.angle||0,0);object.updateMatrix();mesh.setMatrixAt(i,object.matrix);});mesh.name=name;mesh.computeBoundingSphere();this.root.add(mesh);return mesh;}
 batchPlanes(name,items,mat){const geometry=new THREE.PlaneGeometry(1,1);geometry.rotateX(-Math.PI/2);const mesh=new THREE.InstancedMesh(geometry,mat,items.length),object=new THREE.Object3D();items.forEach((item,i)=>{object.position.set(item.x,item.y,item.z);object.scale.set(item.w,1,item.d);object.rotation.set(0,item.angle||0,0);object.updateMatrix();mesh.setMatrixAt(i,object.matrix);});mesh.name=name;mesh.computeBoundingSphere();this.root.add(mesh);return mesh;}
 buildFields(){
  const groups=[[],[],[],[]];for(let i=0;i<1300;i++){const x=-12000+random(i+19)*15000,z=-14000+random(i+919)*28000,h=this.terrainHeight(x,z);if(h<-.2||h>35||this.landmarks.slice(0,3).some(a=>Math.abs(x-a.x)<250&&Math.abs(z-a.z)<a.runwayLength/2+400))continue;groups[i%4].push({x,y:h+.18,z,w:90+random(i+151)*170,d:140+random(i+47)*260,angle:Math.floor(random(i+68)*4)*Math.PI/2});}
  const colors=[0x7d8b62,0x90996c,0xa6a085,0x788d70];groups.forEach((g,i)=>this.batchPlanes('FarmlandParcel_'+i,g,material(colors[i])));
 }
 ribbon(name,points,width,mat){const positions=[],indices=[];for(let i=0;i<points.length;i++){const p=points[i],prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],d=new THREE.Vector3(next.x-prev.x,0,next.z-prev.z).normalize(),side=new THREE.Vector3(d.z,0,-d.x).multiplyScalar(width/2);for(const sign of [-1,1])positions.push(p.x+side.x*sign,p.y,p.z+side.z*sign);if(i>0){const a=i*2;indices.push(a-2,a,a-1,a-1,a,a+1);}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,mat);mesh.name=name;this.root.add(mesh);return mesh;}
 buildRoads(){
  const road=material(0x646d69),river=material(0x527e87,.35);const main=[],coastal=[],stream=[];
  for(let z=-17500;z<=17500;z+=220){const x=650+250*Math.sin(z/2500),c=this.coastX(z)-430,r=this.riverX(z);main.push({x,y:Math.max(.15,this.terrainHeight(x,z)+.25),z});coastal.push({x:c,y:Math.max(.15,this.terrainHeight(c,z)+.25),z});stream.push({x:r,y:-.38,z});}
  this.ribbon('ValleyRoad',main,12,road);if(this.id!=='island')this.ribbon('CoastalRoad',coastal,9,road);if(this.id==='valley'||this.id==='metro')this.ribbon('MeanderingRiver',stream,125,river);
  const bridges=[];for(const z of [-2000,3600,8000,12000]){const x=this.riverX(z);bridges.push({x,y:3.3,z,w:190,h:.7,d:11});}if(this.id==='valley'||this.id==='metro')this.batchBoxes('RiverBridges',bridges,material(0x9ca39a));
 }
 windowMaterial(){
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#a6b1ae';ctx.fillRect(0,0,64,128);for(let y=6;y<128;y+=15)for(let x=5;x<64;x+=14){ctx.fillStyle=(x+y)%3===0?'#627b83':'#7d9398';ctx.fillRect(x,y,9,9);}const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshStandardMaterial({map:texture,roughness:.64,metalness:.12});
 }
 buildSettlements(){
  const buildings=[],roofs=[],roads=[],windowSides=[];const urban=this.id==='metro';const count=urban?740:220;
  for(let i=0;i<count;i++){const block=i%2;const x=(block?-3600:2800)+(Math.floor(i/18)%18-9)*95+random(i+2)*18,z=3800+Math.floor(i/324)*4700+(i%18)*102,h=this.terrainHeight(x,z);if(h<0||h>70)continue;const w=20+random(i+4)*32,d=20+random(i+5)*34,height=urban?12+Math.pow(random(i+6),2)*94:7+random(i+6)*16;buildings.push({x,y:h+height/2,z,w,h:height,d});roofs.push({x,y:h+height+.3,z,w:w+1,h:.6,d:d+1});windowSides.push({x:x-w/2-.06,y:h+height/2,z,w:.03,h:height*.92,d:d*.9});}
  this.batchBoxes('TownBuildingFacades',buildings,this.windowMaterial());this.batchBoxes('TownRoofLines',roofs,material(0x7b817b));this.batchBoxes('GlassWindowSides',windowSides,material(0x526f7b,.33));
  for(const x of [-4700,-3900,-3100,1850,2650,3450])roads.push({x,y:this.terrainHeight(x,6300)+.15,z:6300,w:14,h:.15,d:7000});this.batchBoxes('TownStreetGrid',roads,material(0x717773));
 }
 buildTrees(){
  const foliage=material(this.palette.forest),trunk=material(0x756a56);for(let quadrant=0;quadrant<4;quadrant++){
   const positions=[];for(let i=0;i<680;i++){const seed=i+quadrant*680,x=(quadrant%2?-1:1)*(1800+random(seed+10)*15000),z=(quadrant<2?-1:1)*(random(seed+201)*17500),h=this.terrainHeight(x,z);if(h<2||h>1100)continue;positions.push({x,z,y:h,height:9+random(seed+601)*11,width:5+random(seed+401)*5});}
   if(!positions.length)continue;const center=new THREE.Vector3((quadrant%2?-1:1)*8500,0,(quadrant<2?-1:1)*8500),lod=new THREE.LOD();lod.position.copy(center);const near=new THREE.Group(),far=new THREE.Group();
   for(const [parent,detail] of [[near,1],[far,0]]){const mesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,detail),foliage,positions.length),object=new THREE.Object3D();positions.forEach((p,i)=>{object.position.set(p.x-center.x,p.y+p.height*.62,p.z-center.z);object.scale.set(p.width,p.height*.52,p.width*.85);object.rotation.y=i*.73;object.updateMatrix();mesh.setMatrixAt(i,object.matrix);});mesh.computeBoundingSphere();parent.add(mesh);}
   const stems=new THREE.InstancedMesh(new THREE.CylinderGeometry(.45,.65,1,5),trunk,positions.length),dummy=new THREE.Object3D();positions.forEach((p,i)=>{dummy.position.set(p.x-center.x,p.y+p.height*.25,p.z-center.z);dummy.scale.set(1,p.height*.5,1);dummy.updateMatrix();stems.setMatrixAt(i,dummy.matrix);});near.add(stems);lod.addLevel(near,0);lod.addLevel(far,this.quality==='low'?3500:6500);lod.name='ForestCanopyLOD_'+quadrant;this.root.add(lod);
  }
 }
 runwayLabel(text,x,z,size=12){const c=document.createElement('canvas');c.width=256;c.height=256;const ctx=c.getContext('2d');ctx.clearRect(0,0,256,256);ctx.fillStyle='#e7e6db';ctx.font='bold 175px sans-serif';ctx.textAlign='center';ctx.fillText(text,128,206);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.13,z);this.root.add(mesh);}
 buildAirport(airport,primary=false){
  const x=airport.x,center=airport.z,length=airport.runwayLength,start=center-length/2,end=center+length/2,asphalt=material(0x474f50),white=material(0xe0e1d8),earth=material(0xa5a68a),concrete=material(0xa2aaa7);
  const pavement=[{x,y:-.025,z:center,w:48,h:.13,d:length},{x:x-70,y:.06,z:center-290,w:18,h:.1,d:length*.48},{x:x-110,y:.06,z:start+140,w:120,h:.1,d:145},{x:x-43,y:.06,z:start+140,w:62,h:.1,d:14}];this.batchBoxes(airport.id+'_Pavement',pavement,asphalt).receiveShadow=true;
  this.batchBoxes(airport.id+'_SafetyMargins',[{x:x-46,y:-.02,z:center,w:40,h:.04,d:length+160},{x:x+46,y:-.02,z:center,w:40,h:.04,d:length+160}],earth);
  const marks=[{x:x-23.6,y:.08,z:center,w:.5,h:.02,d:length},{x:x+23.6,y:.08,z:center,w:.5,h:.02,d:length}];for(let z=start+70;z<end-70;z+=72)marks.push({x,y:.08,z,w:.9,h:.025,d:32});for(const threshold of [start+22,end-35])for(let offset=-18;offset<=18;offset+=6)marks.push({x:x+offset,y:.09,z:threshold,w:3.2,h:.02,d:28});for(const z of [start+290,end-290])for(const off of [-12,12])marks.push({x:x+off,y:.09,z,w:5,h:.02,d:28});this.batchBoxes(airport.id+'_WhiteMarkings',marks,white);
  this.runwayLabel('36',x,start+80);this.runwayLabel('18',x,end-90);
  const terminal=[{x:x-145,y:6.1,z:start+160,w:54,h:12,d:32},{x:x-145,y:12.4,z:start+160,w:60,h:.8,d:37},{x:x-94,y:14,z:start+265,w:9,h:28,d:9}],glass=[{x:x-145,y:6,z:start+143.9,w:44,h:7,d:.15},{x:x-94,y:29,z:start+265,w:17,h:5,d:17}];this.batchBoxes(airport.id+'_Terminal',terminal,concrete);this.batchBoxes(airport.id+'_AirportGlazing',glass,material(0x4b6977,.23));
  const geo=new THREE.SphereGeometry(.55,6,4),lights=[];for(let z=start;z<=end;z+=60)for(const side of [-27,27])lights.push({x:x+side,y:.45,z});if(primary)for(let z=-550;z<0;z+=36)lights.push({x,y:.4,z});const lm=new THREE.InstancedMesh(geo,new THREE.MeshBasicMaterial({color:0xf7dca0}),lights.length),dummy=new THREE.Object3D();lights.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.updateMatrix();lm.setMatrixAt(i,dummy.matrix);});this.root.add(lm);
  if(primary){for(let i=0;i<4;i++){const p=new THREE.Mesh(new THREE.BoxGeometry(1.4,.55,1.4),new THREE.MeshBasicMaterial({color:0xffffff}));p.position.set(-36-i*2,.65,210);this.root.add(p);this.papi.push(p);}this.batchBoxes('WindsockMast',[{x:53,y:5,z:190,w:.18,h:10,d:.18}],concrete);const sock=new THREE.Mesh(new THREE.CylinderGeometry(.8,.48,4.4,10),material(0xbf7856));sock.rotation.z=Math.PI/2;sock.position.set(55.2,10,190);this.root.add(sock);}
 }
 buildLandmarks(){
  const harbor=this.landmarks[3],piers=[],containers=[];for(let i=0;i<4;i++)piers.push({x:harbor.x+110+i*95,y:.5,z:harbor.z+80,w:36,h:1.1,d:320});for(let i=0;i<52;i++)containers.push({x:harbor.x-90+(i%8)*16,y:2.7+Math.floor(i/32)*2.6,z:harbor.z-85+Math.floor(i/8)*9,w:12,h:2.6,d:5});this.batchBoxes('HarborConcretePiers',piers,material(0xa6aaa1));this.batchBoxes('HarborContainerYard',containers,material(0x858d89));
  const p=this.landmarks[4],height=this.id==='metro'?108:28,base=this.terrainHeight(p.x,p.z);this.batchBoxes('ObservationLandmark',[{x:p.x,y:base+height/2,z:p.z,w:this.id==='metro'?18:9,h:height,d:18},{x:p.x,y:base+height+4,z:p.z,w:26,h:8,d:25},{x:p.x,y:base+height+16,z:p.z,w:1.4,h:24,d:1.4}],material(0xa5ada9));this.batchBoxes('ObservationGlazing',[{x:p.x,y:base+height+4,z:p.z-12.6,w:23,h:6,d:.2}],material(0x496976,.25));p.y=base+height+20;
 }
 batchCylinders(name,items,mat,vertices=10){const m=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,vertices),mat,items.length),d=new THREE.Object3D();items.forEach((p,i)=>{d.position.set(p.x,p.y,p.z);d.scale.set(p.w/2,p.h,(p.d||p.w)/2);d.rotation.set(0,p.angle||0,0);d.updateMatrix();m.setMatrixAt(i,d.matrix);});m.name=name;m.computeBoundingSphere();this.root.add(m);return m;}
 buildActivityLandmarks(){
  const white=[],red=[],metal=[],glazing=[],piers=[],roofs=[],rocks=[],green=[],mailBodies=[];
  for(const t of this.tourTargets){const ground=Math.max(0,this.terrainHeight(t.x,t.z));let kind='';
   if(t.label.includes('燈塔')){kind='lighthouse';white.push({x:t.x,y:ground+17,z:t.z,w:12,h:34});metal.push({x:t.x,y:ground+36,z:t.z,w:16,h:4});glazing.push({x:t.x,y:ground+37,z:t.z,w:12,h:5});red.push({x:t.x,y:ground+41,z:t.z,w:16,h:3});piers.push({x:t.x,y:ground+.3,z:t.z,w:46,h:.6,d:46});}
   else if(t.label.includes('港')){kind='harbor';for(let i=0;i<3;i++)piers.push({x:t.x+70+i*65,y:.5,z:t.z+70,w:23,h:1.2,d:220});piers.push({x:t.x-75,y:ground+.35,z:t.z,w:160,h:.7,d:230});for(let i=0;i<20;i++)roofs.push({x:t.x-125+(i%5)*22,y:ground+2.3,z:t.z-75+Math.floor(i/5)*23,w:18,h:4.6,d:14});for(let i=0;i<4;i++){metal.push({x:t.x+85+i*70,y:4.3,z:t.z-45,w:4,h:8.6});red.push({x:t.x+85+i*70,y:7.8,z:t.z-35,w:30,h:1.3,d:4});}}
   else if(t.label.includes('岩')){kind='basalt-islet';for(let i=0;i<38;i++){const a=i*2.399,r=18+Math.sqrt(i)*13,height=10+random(i+13)*24;rocks.push({x:t.x+Math.cos(a)*r,y:height/2-.6,z:t.z+Math.sin(a)*r,w:20+random(i+23)*10,h:height,angle:a});}}
   else if(t.label.includes('農')){kind='farm-village';for(let i=0;i<9;i++){piers.push({x:t.x+(i%3-1)*44,y:ground+4,z:t.z+(Math.floor(i/3)-1)*46,w:28,h:8,d:24});roofs.push({x:t.x+(i%3-1)*44,y:ground+8.4,z:t.z+(Math.floor(i/3)-1)*46,w:31,h:.9,d:27});}}
   else if(t.label.includes('觀景')){kind='observatory';const height=this.id==='metro'?95:25;metal.push({x:t.x,y:ground+height/2,z:t.z,w:this.id==='metro'?18:8,h:height});piers.push({x:t.x,y:ground+height+3,z:t.z,w:28,h:6,d:25});glazing.push({x:t.x,y:ground+height+3,z:t.z,w:26,h:4});}
   else{kind='river-park';piers.push({x:t.x,y:ground+.3,z:t.z,w:190,h:.6,d:25});for(let i=0;i<10;i++){green.push({x:t.x-80+i*17,y:ground+5,z:t.z+24,w:8,h:10});}roofs.push({x:t.x,y:ground+7,z:t.z+65,w:26,h:2,d:26});}
   this.activityLandmarks.push({id:t.id,label:t.label,kind,x:t.x,y:ground,z:t.z,height:kind==='lighthouse'?44:kind==='observatory'?100:kind==='basalt-islet'?34:12});
  }
  for(const t of getFlightTargets('mail',this.id)){const ground=Math.max(0,this.terrainHeight(t.x,t.z));piers.push({x:t.x,y:ground+.025,z:t.z,w:82,h:.05,d:82});metal.push({x:t.x,y:ground+1.4,z:t.z,w:.25,h:2.8});mailBodies.push({x:t.x,y:ground+2.8,z:t.z,w:2.2,h:1.25,d:1.45});red.push({x:t.x+1.05,y:ground+3.1,z:t.z,w:.12,h:.55,d:.25});this.activityLandmarks.push({id:t.id,label:t.label,kind:'mailbox',x:t.x,y:ground,z:t.z,height:3.5});}
  if(white.length)this.batchCylinders('TourLighthouseWhite',white,material(0xdfdfd2),20);if(red.length)this.batchBoxes('TourSafetyRed',red,material(0xa86754));if(metal.length)this.batchCylinders('TourStructuralMetal',metal,material(0x7e8987),12);if(glazing.length)this.batchCylinders('TourLanternAndObservationGlass',glazing,material(0x577985,.22),18);if(piers.length)this.batchBoxes('TourHarborAndParks',piers,material(0xacafa3));if(roofs.length)this.batchBoxes('TourRoofAndContainers',roofs,material(0x7e8c88));if(rocks.length)this.batchCylinders('TourBasaltIslandColumns',rocks,material(0x727b78),6);if(green.length)this.batchCylinders('TourParkTrees',green,material(0x687f62),8);this.batchBoxes('PhysicalMailboxes',mailBodies,material(0x4d7c89));
 }
 update(time,camera){this.waveUniform.value=time;this.root.traverse(o=>{if(o.isLOD)o.update(camera);});}
 dispose(){const geometries=new Set(),materials=new Set(),textures=new Set();this.root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);if(m.map)textures.add(m.map);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());this.root.clear();}
 getDebugState(){let meshes=0,instances=0,triangles=0;this.root.traverse(o=>{if(o.isMesh){meshes++;if(o.isInstancedMesh)instances+=o.count;const g=o.geometry;triangles+=(g.index?g.index.count:g.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);}});return {map:this.id,extent:this.extent,landmarks:this.landmarks,activityLandmarks:this.activityLandmarks,meshObjects:meshes,instances,geometryTriangles:triangles,terrainVertices:this.terrain.geometry.attributes.position.count};}
}
