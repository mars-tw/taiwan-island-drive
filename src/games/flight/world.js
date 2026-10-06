import {readSettings} from '../../shared/settings.js';
import {assetUrl} from '../../shared/paths.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {MAPS,RUNWAY} from './config.js';
import {WAYPOINTS} from './mission.js';
import {FlightScenery} from './scenery.js';

export function aircraftQuaternion(s){return new THREE.Quaternion().setFromEuler(new THREE.Euler(-s.pitch,-s.heading,s.bank,'YXZ'));}

export class FlightWorld{
 constructor(canvas){
  this.canvas=canvas;this.quality=readSettings().quality;this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.quality==='low'?1:1.6));this.renderer.shadowMap.enabled=this.quality!=='low';this.renderer.shadowMap.type=THREE.PCFShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.1;
  this.scene=new THREE.Scene();const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(this.renderer);this.environmentTarget=pmrem.fromScene(room,.04);this.scene.environment=this.environmentTarget.texture;this.scene.environmentIntensity=.58;room.dispose();pmrem.dispose();
  this.camera=new THREE.PerspectiveCamera(58,1,.08,46000);this.group=new THREE.Group();this.scene.add(this.group);this.scene.add(new THREE.HemisphereLight(0xdce9f0,0x6f7967,1.65));
  const sun=new THREE.DirectionalLight(0xfff0d8,2.6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-95;sun.shadow.camera.right=95;sun.shadow.camera.top=95;sun.shadow.camera.bottom=-95;sun.shadow.camera.near=1;sun.shadow.camera.far=1700;sun.shadow.bias=-.00015;this.scene.add(sun,sun.target);this.sun=sun;
  this.aircraft=new THREE.Group();this.cab=new THREE.Group();this.scene.add(this.aircraft,this.cab);this.aircraft.name='PlayerAircraft';this.cab.name='PlayerCockpit';this.props=[];this.surfaces=[];this.loaded=false;this.view='chase';this.gates=[];this.markerRoot=new THREE.Group();this.scene.add(this.markerRoot);this.markerSignature='';this.viewport={width:1,height:1};this.lastAircraftPosition=new THREE.Vector3(1e9,1e9,1e9);this.modelBounds=new THREE.Box3(new THREE.Vector3(-5.8,0,-4.3),new THREE.Vector3(5.8,3.3,4.3));this.cameraNeedsSnap=true;this.time=0;
  this.parcel=new THREE.Group();this.parcel.name='PhysicalFallingParcel';const parcel=new THREE.Mesh(new THREE.BoxGeometry(2.2,1.6,1.7),new THREE.MeshStandardMaterial({color:0xbfa574,roughness:.85}));this.parcel.add(parcel);const tape=new THREE.Mesh(new THREE.BoxGeometry(.35,1.64,1.74),new THREE.MeshStandardMaterial({color:0xe8dcc0,roughness:.8}));this.parcel.add(tape);this.parcelLabel=this.markerLabel('郵件');this.parcelLabel.scale.set(18,3.4,1);this.parcelLabel.position.y=4;this.parcel.add(this.parcelLabel);this.parcel.visible=false;this.scene.add(this.parcel);
  this.setMap('coast');this.observeStage();this.resize();this.loadAssets();
 }
 async loadAssets(){
  const loader=new GLTFLoader();try{
   const [model,cab]=await Promise.all([loader.loadAsync(assetUrl('models/aircraft.glb')),loader.loadAsync(assetUrl('models/aircraft-cab.glb'))]);model.scene.updateMatrixWorld(true);this.modelBounds.setFromObject(model.scene,true).expandByScalar(.22);this.aircraft.add(model.scene);this.cab.add(cab.scene);
   model.scene.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;}if(/PropellerRoot|^Propeller$/.test(n.name))this.props.push(n);if(/^(AileronLeft|AileronRight|FlapLeft|FlapRight|Elevator|Rudder)$/.test(n.name)){n.userData.rest=n.rotation.clone();this.surfaces.push(n);}});
   cab.scene.traverse(n=>{if(n.isMesh&&n.material?.transparent){n.material.opacity=Math.min(n.material.opacity,.06);n.material.depthWrite=false;}});this.cab.visible=false;this.loaded=true;this.cameraNeedsSnap=true;document.dispatchEvent(new CustomEvent('flight-assets',{detail:{ok:true}}));
  }catch(error){console.error('Aircraft assets unavailable',error);document.dispatchEvent(new CustomEvent('flight-assets',{detail:{ok:false}}));}
 }
 setMap(id){
  if(this.scenery?.id===id)return;
  if(this.scenery){this.group.remove(this.scenery.root);this.scenery.dispose();}
  this.map=MAPS[id]||{...MAPS.coast,id};this.scenery=new FlightScenery(id,this.quality);this.group.add(this.scenery.root);this.extent=this.scenery.extent;this.landmarks=this.scenery.landmarks;this.papi=this.scenery.papi;this.scene.background=new THREE.Color(this.scenery.palette.sky);this.scene.fog=new THREE.Fog(this.scenery.palette.sky,4500,38000);this.markerSignature='';this.cameraNeedsSnap=true;
 }
 terrainHeight(x,z){return this.scenery?.terrainHeight(x,z)||0;}
 onRunway(p){return this.landmarks.filter(l=>l.kind==='airport').some(l=>Math.abs(p.x-l.x)<RUNWAY.halfWidth&&p.z>=l.z-l.runwayLength/2&&p.z<=l.z+l.runwayLength/2);}
 setView(view){this.view=view;this.aircraft.visible=view!=='cockpit';this.cab.visible=view==='cockpit';this.cameraNeedsSnap=true;}
 applyQuality(quality){this.quality=quality;this.renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='low'?1:1.6));this.renderer.shadowMap.enabled=quality!=='low';if(this.scenery){this.scenery.quality=quality;this.scenery.root.traverse(o=>{if(o.isLOD&&o.levels[1])o.levels[1].distance=quality==='low'?3500:6500;});}this.resize();}
 observeStage(){const parent=this.canvas.parentElement;if(parent===this.observedParent)return;this.resizeObserver?.disconnect();this.observedParent=parent;if(typeof ResizeObserver!=='undefined'){this.resizeObserver=new ResizeObserver(()=>this.resize());if(parent)this.resizeObserver.observe(parent);}}
 resize(){
  this.observeStage();const parent=this.canvas.parentElement;if(!parent)return;const w=Math.round(parent.clientWidth),h=Math.round(parent.clientHeight);if(w<=0||h<=0)return;if(this.viewport.width===w&&this.viewport.height===h)return;this.viewport={width:w,height:h};this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.cameraNeedsSnap=true;
 }
 markerLabel(text){const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='#eef4e8';ctx.fillRect(0,0,512,96);ctx.fillStyle='#25434a';ctx.font='bold 35px sans-serif';ctx.textAlign='center';ctx.fillText(text,256,62);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,transparent:true,opacity:.88}));sprite.scale.set(170,32,1);return sprite;}
 starGeometry(radius){const shape=new THREE.Shape();for(let i=0;i<10;i++){const angle=i*Math.PI/5-Math.PI/2,r=i%2?radius*.43:radius,x=Math.cos(angle)*r,y=Math.sin(angle)*r;i?shape.lineTo(x,y):shape.moveTo(x,y);}shape.closePath();return new THREE.ExtrudeGeometry(shape,{depth:3,bevelEnabled:false});}
 updateMarkers(mission,menu){
  const targets=mission?.targets?.length?mission.targets:mission?.mode==='navigation'?WAYPOINTS.map((w,i)=>({...w,id:`nav-${i}`,label:`導航 ${i+1}`,kind:'navigation',radius:70,visited:i<mission.passed})):[];
  const signature=targets.map(t=>`${t.id}:${t.kind}:${t.x}:${t.y}:${t.z}`).join('|');
  if(signature!==this.markerSignature){
   this.markerRoot.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});this.markerRoot.clear();this.gates=[];
   for(const [i,t] of targets.entries()){
    const g=new THREE.Group();g.position.set(t.x,t.y,t.z);const radius=Math.max(35,Math.min(t.radius||75,95));const mat=new THREE.MeshBasicMaterial({color:0xd6b77a,transparent:true,opacity:.85});let marker;
    if(t.kind==='star'||t.kind==='treasure'||!t.kind&&mission?.mode==='treasure'){marker=new THREE.Mesh(this.starGeometry(radius*.34),mat);g.add(marker);const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,1.7,5,40),mat.clone());g.add(ring);}
    else if(t.kind==='delivery'||t.kind==='mail'||!t.kind&&mission?.mode==='mail'){marker=new THREE.Mesh(new THREE.TorusGeometry(Math.min(radius,75),2.6,5,40),mat);marker.rotation.x=-Math.PI/2;marker.position.y=1.2;g.add(marker);const pole=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,105,6),new THREE.MeshBasicMaterial({color:0x95bdc6,transparent:true,opacity:.34}));pole.position.y=52;g.add(pole);}
    else{marker=new THREE.Mesh(new THREE.TorusGeometry(radius,2.5,6,44),mat);g.add(marker);}
    const label=this.markerLabel(t.label||`目的地 ${i+1}`);label.position.y=radius+25;g.add(label);this.markerRoot.add(g);this.gates.push(g);g.userData={targetIndex:i,marker,label,kind:t.kind};
   }this.markerSignature=signature;
  }
  this.markerRoot.visible=!menu;
  this.parcel.visible=!!mission?.activeParcel&&!menu;if(this.parcel.visible){const p=mission.activeParcel.position;this.parcel.position.set(p.x,p.y,p.z);this.parcel.rotation.y=this.time*.65;}
  this.gates.forEach((g,i)=>{const t=targets[i],visited=t?.visited||i<(mission?.passed||0);g.visible=!visited;const current=mission?.target?.id===t?.id||i===(mission?.passed||0);g.userData.marker.material.color.setHex(current?0xffd98f:0xa7cbd0);g.userData.label.material.opacity=current ? .95 : .5;if(g.userData.kind==='treasure'||g.userData.kind==='star')g.userData.marker.rotation.y=this.time*.4;});
 }
 menuDisplayRect(){const stage=this.canvas.getBoundingClientRect(),hero=document.querySelector('#menu .brand')?.getBoundingClientRect();if(hero&&this.viewport.width<720&&this.viewport.height>this.viewport.width)return {left:hero.x-stage.x+10,top:hero.y-stage.y+75,width:hero.width-20,height:150};if(hero)return {left:hero.x-stage.x+14,top:hero.y-stage.y+115,width:Math.min(hero.width-28,this.viewport.width*.48),height:Math.max(140,Math.min(300,this.viewport.height-hero.y+stage.y-150))};return {left:this.viewport.width*.1,top:this.viewport.height*.18,width:this.viewport.width*.8,height:this.viewport.height*.38};}
 chaseDistance(){const size=this.modelBounds.getSize(new THREE.Vector3()),radius=size.length()/2,halfV=THREE.MathUtils.degToRad(this.camera.fov/2),halfH=Math.atan(Math.tan(halfV)*this.camera.aspect);return Math.max(22,radius/Math.sin(Math.min(halfV,halfH)*.77));}
 render(s,mission,dt=0,menu=false,controls={}){
  this.resize();this.time+=Math.max(0,Math.min(dt,.1));this.lastMenu=menu;const q=aircraftQuaternion(s);this.aircraft.position.set(s.position.x,s.position.y,s.position.z);this.aircraft.quaternion.copy(q);this.cab.position.copy(this.aircraft.position);this.cab.quaternion.copy(q);
  for(const prop of this.props)prop.rotation.z+=dt*s.rpm*.105;
  for(const n of this.surfaces){const r=n.userData.rest;if(n.name==='Rudder')n.rotation.y=r.y+(controls.rudder||0)*.3;else n.rotation.x=r.x+(n.name==='FlapLeft'||n.name==='FlapRight'?-s.flaps*Math.PI/18:n.name==='AileronRight'?-(controls.roll||0)*.27:n.name==='AileronLeft'?(controls.roll||0)*.27:(controls.pitch||0)*.3);}
  const groundShadows=this.quality!=='low'&&s.position.y<15;this.sun.castShadow=groundShadows;this.renderer.shadowMap.enabled=groundShadows;this.sun.position.set(s.position.x-310,s.position.y+750,s.position.z+280);this.sun.target.position.copy(this.aircraft.position);this.sun.target.updateMatrixWorld();
  const target=this.modelBounds.getCenter(new THREE.Vector3()).applyQuaternion(q).add(this.aircraft.position),desired=new THREE.Vector3(),distance=this.chaseDistance(),jump=this.lastAircraftPosition.distanceTo(this.aircraft.position)>100;
  if(menu){
   if(this.camera.view?.enabled)this.camera.clearViewOffset();const t=performance.now()*.000075,display=this.menuDisplayRect();this.menuTargetRect=display;this.aircraft.visible=true;this.cab.visible=false;this.aircraft.updateMatrixWorld(true);
   const place=d=>{desired.set(Math.sin(t)*d*.88,d*.31,Math.cos(t)*d*.88).add(target);this.camera.position.copy(desired);this.camera.up.set(0,1,0);this.camera.lookAt(target);this.camera.updateMatrixWorld();};
   place(distance);const preliminary=this.getFraming().bbox,fit=Math.max(preliminary.width/(display.width*.88),preliminary.height/(display.height*.88)),radius=this.modelBounds.getSize(new THREE.Vector3()).length()/2;place(Math.max(radius*1.65,distance*fit));
   const fitted=this.getFraming().bbox;
   this.camera.setViewOffset(this.viewport.width,this.viewport.height,(fitted.left+fitted.right)/2-(display.left+display.width/2),(fitted.top+fitted.bottom)/2-(display.top+display.height/2),this.viewport.width,this.viewport.height);
  }
  else if(this.view==='cockpit'){if(this.camera.view?.enabled)this.camera.clearViewOffset();desired.set(0,1.25,-.8).applyQuaternion(q).add(this.aircraft.position);const ahead=new THREE.Vector3(0,1.28,100).applyQuaternion(q).add(this.aircraft.position);this.camera.position.copy(desired);this.camera.up.set(0,1,0).applyQuaternion(q);this.camera.lookAt(ahead);this.aircraft.visible=false;this.cab.visible=true;}
  else{if(this.camera.view?.enabled)this.camera.clearViewOffset();const heading=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-s.heading);desired.set(0,distance*.22,-distance).applyQuaternion(heading).add(target);desired.y=Math.max(desired.y,this.terrainHeight(desired.x,desired.z)+4);if(this.cameraNeedsSnap||jump)this.camera.position.copy(desired);else this.camera.position.lerp(desired,1-Math.exp(-Math.max(dt,.001)*7));this.camera.up.set(0,1,0);this.camera.lookAt(target);this.aircraft.visible=true;this.cab.visible=false;}
  this.cameraNeedsSnap=false;this.lastAircraftPosition.copy(this.aircraft.position);this.camera.updateMatrixWorld();this.aircraft.updateMatrixWorld(true);this.cab.updateMatrixWorld(true);this.updateMarkers(mission,menu);this.scenery.update(this.time,this.camera);
  const angle=Math.atan2(s.position.y,Math.max(1,210-s.position.z))*180/Math.PI;this.papi.forEach((p,i)=>p.material.color.setHex(angle<[2.5,2.8,3.2,3.5][i]?0xdd5445:0xf8eddf));this.renderer.render(this.scene,this.camera);
 }
 getFraming(){
  const bounds=this.modelBounds.clone().applyMatrix4(this.aircraft.matrixWorld),points=[];for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])points.push(new THREE.Vector3(x,y,z).project(this.camera));const {width,height}=this.viewport;const xs=points.map(p=>(p.x*.5+.5)*width),ys=points.map(p=>(-.5*p.y+.5)*height),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys),inDepth=points.every(p=>p.z>=-1&&p.z<=1),visible=this.loaded&&this.aircraft.visible&&inDepth&&right>0&&bottom>0&&left<width&&top<height,contained=visible&&left>=0&&top>=0&&right<=width&&bottom<=height;const rect=this.canvas.getBoundingClientRect();return {view:this.view,menu:!!this.lastMenu,viewport:{width,height},canvasRect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},bbox:{left,top,right,bottom,width:right-left,height:bottom-top},absoluteBBox:{left:rect.x+left,top:rect.y+top,right:rect.x+right,bottom:rect.y+bottom},visible,contained,inDepth,aircraftVisible:this.aircraft.visible,bounds:'conservative model bounds including moving surfaces'};
 }
  getDebugState(){return {...this.scenery.getDebugState(),viewport:this.viewport,framing:this.getFraming(),menuTargetRect:this.menuTargetRect,loaded:this.loaded,view:this.view,quality:this.quality,drawCalls:this.renderer.info.render.calls,renderedTriangles:this.renderer.info.render.triangles,missionMarkers:this.gates.length,activeMarkers:this.gates.filter(g=>g.visible).length,parcelVisible:this.parcel.visible};}
}
