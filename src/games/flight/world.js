import { readSettings } from '../../shared/settings.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MAPS, BASE, RUNWAY } from './config.js';
import { WAYPOINTS } from './mission.js';
export function aircraftQuaternion(s){return new THREE.Quaternion().setFromEuler(new THREE.Euler(-s.pitch,-s.heading,s.bank,'YXZ'));}

export class FlightWorld {
  constructor(canvas){
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,readSettings().quality==='low'?1:1.6));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.16;
    this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(58,1,.07,14000);this.group=new THREE.Group();this.scene.add(this.group);
    this.scene.add(new THREE.HemisphereLight(0xe5f4ff,0x7f886f,2.1));const sun=new THREE.DirectionalLight(0xfff4dc,2.4);sun.position.set(-150,220,80);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=50;sun.shadow.camera.bottom=-50;sun.shadow.camera.near=1;sun.shadow.camera.far=460;sun.shadow.bias=-.0002;this.scene.add(sun);this.sun=sun;
    this.aircraft=new THREE.Group();this.cab=new THREE.Group();this.scene.add(this.aircraft,this.cab);this.props=[];this.surfaces=[];this.loaded=false;this.view='chase';this.gates=[];
    this.setMap('coast');this.resize();this.loadAssets();
  }
  async loadAssets(){
    const loader=new GLTFLoader();
    try{const [model,cab]=await Promise.all([loader.loadAsync(`${BASE}models/aircraft.glb`),loader.loadAsync(`${BASE}models/aircraft-cab.glb`)]);this.aircraft.add(model.scene);this.cab.add(cab.scene);model.scene.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;}if(/PropellerRoot|^Propeller$/.test(n.name))this.props.push(n);if(/^(AileronLeft|AileronRight|FlapLeft|FlapRight|Elevator|Rudder)$/.test(n.name)){n.userData.rest=n.rotation.clone();this.surfaces.push(n);}});cab.scene.traverse(n=>{if(n.isMesh&&n.material?.transparent){n.material.opacity=Math.min(n.material.opacity,.06);n.material.depthWrite=false;}});this.cab.visible=false;this.loaded=true;document.dispatchEvent(new CustomEvent('flight-assets',{detail:{ok:true}}));}
    catch(error){console.error('Aircraft assets unavailable',error);document.dispatchEvent(new CustomEvent('flight-assets',{detail:{ok:false}}));}
  }
  mat(color,roughness=.85){return new THREE.MeshStandardMaterial({color,roughness});}
  box(x,y,z,w,h,d,material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.receiveShadow=true;this.group.add(mesh);return mesh;}
  label(text,width,height){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#f1eee0';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#263840';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 120px sans-serif';ctx.fillText(text,512,132);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:tex}));m.rotation.x=-Math.PI/2;return m;}
  setMap(id){
    this.map=MAPS[id]||MAPS.coast;const map=this.map;
    while(this.group.children.length){const o=this.group.children[0];this.group.remove(o);o.traverse(n=>{n.geometry?.dispose();if(n.material){for(const m of Array.isArray(n.material)?n.material:[n.material]){m.map?.dispose();m.dispose();}}});}
    this.scene.background=new THREE.Color(map.sky);this.scene.fog=new THREE.FogExp2(map.sky,.00012);this.gates=[];
    const sea=this.mat(map.sea,.34),grass=this.mat(map.grass),asphalt=this.mat(0x384247),white=this.mat(0xf1f1da),black=this.mat(0x273236);
    this.box(0,-7,1200,19000,10,19000,sea);
    this.box(id==='island'?-260:-1700,-3.2,1200,id==='island'?1900:5000,6,12500,grass);
    const runway=this.box(0,-.08,900,48,.20,1800,asphalt);runway.name='Runway';
    this.box(-24,.045,900,.5,.04,1800,white);this.box(24,.045,900,.5,.04,1800,white);
    for(let z=70;z<1740;z+=72)this.box(0,.07,z,.9,.025,32,white);
    for(const threshold of [18,1740])for(let x=-18;x<=18;x+=6)this.box(x,.06,threshold,3.2,.03,30,white);
    for(const z of [290,1510]){this.box(-12,.07,z,5,.04,30,white);this.box(12,.07,z,5,.04,30,white);}
    const r0=this.label('36',12,12);r0.position.set(0,.095,80);this.group.add(r0);const r1=this.label('18',12,12);r1.position.set(0,.095,1710);r1.rotation.z=Math.PI;this.group.add(r1);
    const lightmat=new THREE.MeshBasicMaterial({color:0xffe0a3});const lightgeo=new THREE.SphereGeometry(.6,6,4);
    const lights=new THREE.InstancedMesh(lightgeo,lightmat,100);let i=0;const dummy=new THREE.Object3D();for(let z=0;z<1800;z+=60)for(const x of [-28,28]){dummy.position.set(x,.5,z);dummy.updateMatrix();lights.setMatrixAt(i++,dummy.matrix);}for(let z=-600;z<0;z+=35){dummy.position.set(0,.4,z);dummy.updateMatrix();lights.setMatrixAt(i++,dummy.matrix);}lights.count=i;this.group.add(lights);
    // Four PAPI lamps provide a real 3-degree visual glideslope cue.
    this.papi=[];for(let p=0;p<4;p++){const l=this.box(-36-p*2,.65,210,1.4,.6,1.4,new THREE.MeshBasicMaterial({color:0xffffff}));this.papi.push(l);}
    this.box(-76,.04,400,21,.1,520,asphalt);this.box(-47,.04,135,75,.1,20,asphalt);this.box(-110,.04,130,120,.1,120,asphalt);
    this.box(-150,8,190,55,16,38,this.mat(0xe4dcc5));this.box(-150,16.3,190,60,1,43,this.mat(0x60828a));this.box(-150,6,169,29,12,.3,black);
    this.box(-99,15,262,9,30,9,this.mat(0xd7d6c8));this.box(-99,30,262,18,6,18,this.mat(0x314f5e));this.box(-99,34,262,20,1,20,this.mat(0xe4dcc5));
    for(let h=0;h<5;h++)this.box(-98,8+h*4,257.2,6,1.8,.2,this.mat(0x8ac6d6));
    // Windsock, contrasting fields and distant settlements give scale and motion.
    this.box(53,5,190,.18,10,.18,this.mat(0xe3e3d7));const sock=new THREE.Mesh(new THREE.ConeGeometry(1,5,10),this.mat(0xd86940));sock.rotation.z=-Math.PI/2;sock.position.set(55.3,10,190);this.group.add(sock);
    for(let a=0;a<48;a++){const x=-180-(a%8)*160,z=-300+Math.floor(a/8)*490;this.box(x,-.13,z,145,.1,445,this.mat([0x94a57b,0x758c65,0xb6b18c,0x92a57c][a%4]));}
    const mountains=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,7),this.mat(map.mountains),50);for(let m=0;m<50;m++){const side=m%2===0?-1:1;dummy.position.set(side*(id==='valley'?1350:2100)+(Math.sin(m*2.1)*500),90+(m%5)*55,-1200+Math.floor(m/2)*420);dummy.scale.set(350+(m%4)*90,180+(m%5)*110,430+(m%3)*90);dummy.rotation.y=m*.48;dummy.updateMatrix();mountains.setMatrixAt(m,dummy.matrix);}this.group.add(mountains);
    const trees=new THREE.InstancedMesh(new THREE.ConeGeometry(2.5,10,5),this.mat(0x3e6654),240);for(let t=0;t<240;t++){const x=-180-(t%15)*90,z=-1100+Math.floor(t/15)*325;dummy.position.set(x,5,z);dummy.scale.set(1,1+(t%3)*.23,1);dummy.rotation.y=t;dummy.updateMatrix();trees.setMatrixAt(t,dummy.matrix);}this.group.add(trees);
    const clouds=new THREE.InstancedMesh(new THREE.SphereGeometry(1,7,5),new THREE.MeshBasicMaterial({color:0xf7f7ed,transparent:true,opacity:.84}),35);for(let k=0;k<35;k++){dummy.position.set(Math.sin(k*7.2)*3100,500+(k%4)*120,-2100+(k%9)*750);dummy.scale.set(120+(k%3)*55,25+(k%2)*20,65);dummy.rotation.y=k;dummy.updateMatrix();clouds.setMatrixAt(k,dummy.matrix);}this.group.add(clouds);
    for(const [j,w] of WAYPOINTS.entries()){const ring=new THREE.Mesh(new THREE.TorusGeometry(70,3.2,7,36),new THREE.MeshBasicMaterial({color:0xe5ad59,transparent:true,opacity:.75}));ring.position.set(w.x,w.y,w.z);this.group.add(ring);this.gates.push(ring);const dot=new THREE.Mesh(new THREE.SphereGeometry(4,8,6),new THREE.MeshBasicMaterial({color:0xffe4a2}));dot.position.set(w.x,w.y-73,w.z);this.group.add(dot);dot.visible=false;}
  }
  onRunway(p){return Math.abs(p.x)<RUNWAY.halfWidth&&p.z>=RUNWAY.start&&p.z<=RUNWAY.end;}
  setView(view){this.view=view;this.aircraft.visible=view!=='cockpit';this.cab.visible=view==='cockpit';}
  applyQuality(quality){this.renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='low'?1:1.6));this.resize();}
  resize(){const rect=this.renderer.domElement.getBoundingClientRect();const w=rect.width||innerWidth,h=rect.height||innerHeight;this.viewport={width:w,height:h};this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
  render(s,mission,dt=0,menu=false,controls={}){
    const q=aircraftQuaternion(s);
    this.aircraft.position.set(s.position.x,s.position.y,s.position.z);this.aircraft.quaternion.copy(q);this.cab.position.copy(this.aircraft.position);this.cab.quaternion.copy(q);
    for(const p of this.props)p.rotation.z+=dt*s.rpm*.105;
    for(const n of this.surfaces){const r=n.userData.rest;if(n.name==='Rudder')n.rotation.y=r.y+(controls.rudder||0)*.3;else n.rotation.x=r.x+(n.name==='FlapLeft'||n.name==='FlapRight'?-s.flaps*Math.PI/18:n.name==='AileronRight'?-(controls.roll||0)*.27:n.name==='AileronLeft'?(controls.roll||0)*.27:(controls.pitch||0)*.3);}
    this.sun.position.set(s.position.x-150,s.position.y+220,s.position.z+80);this.sun.target.position.copy(this.aircraft.position);this.sun.target.updateMatrixWorld();
    const target=new THREE.Vector3(),desired=new THREE.Vector3();
    if(menu){const t=performance.now()*.00011;desired.set(s.position.x+Math.sin(t)*13+8,s.position.y+4.5,s.position.z+Math.cos(t)*13-8);target.copy(this.aircraft.position).add(new THREE.Vector3(0,1.4,0));this.camera.position.copy(desired);this.camera.up.set(0,1,0);this.camera.lookAt(target);this.aircraft.visible=true;this.cab.visible=false;}
    else if(this.view==='cockpit'){desired.set(0,1.25,-.8).applyQuaternion(q).add(this.aircraft.position);target.set(0,1.28,100).applyQuaternion(q).add(this.aircraft.position);this.camera.position.copy(desired);this.camera.up.set(0,1,0).applyQuaternion(q);this.camera.lookAt(target);}
    else{desired.set(0,6,-20).applyQuaternion(q).add(this.aircraft.position);this.camera.position.lerp(desired,Math.min(1,dt*6||1));target.set(0,2,28).applyQuaternion(q).add(this.aircraft.position);this.camera.up.set(0,1,0);this.camera.lookAt(target);}
    this.gates.forEach((r,i)=>{r.visible=!menu&&mission?.mode==='navigation'&&i>=mission.passed;r.material.color.set(i===mission?.passed?0xffd28c:0x92cbd4);});
    const angle=Math.atan2(s.position.y,Math.max(1,210-s.position.z))*180/Math.PI;
    this.papi.forEach((p,i)=>p.material.color.set(angle<[2.5,2.8,3.2,3.5][i]?0xff4534:0xfff2da));
    // Keep the menu airplane inside the portrait display window above the cards.
    const {width,height}=this.viewport;const portraitMenu=menu&&width<720&&height>width;
    if(portraitMenu){if(!this.camera.view?.enabled||this.camera.view.fullHeight!==height||this.camera.view.fullWidth!==width)this.camera.setViewOffset(width,height,0,height*.22,width,height);}
    else if(this.camera.view?.enabled)this.camera.clearViewOffset();
    this.renderer.render(this.scene,this.camera);
  }
}
