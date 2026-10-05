import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { roadCenter, roadHeading, routeAltitude } from './physics.js';

export const ENVIRONMENTS = {
  coast: { skyTop: '#5a9dbc', skyBottom: '#d7e5dd', fog: '#b8d6d5', fogNear: 190, fogFar: 610,
    ground: '#799c70', road: '#394348', sun: '#fff0c9', sunIntensity: 3.4, ambient: 1.45,
    sunDirection: [70, 85, 15], water: '#438f9e', waterLight: '#91bfc1', exposure: 1.12 },
  alishan: { skyTop: '#688b99', skyBottom: '#c4d5c9', fog: '#9eb9b0', fogNear: 85, fogFar: 330,
    ground: '#46644b', road: '#414847', sun: '#e6eed4', sunIntensity: 2.4, ambient: 1.35,
    sunDirection: [-45, 80, 40], water: '#456b65', waterLight: '#91aba2', exposure: 1.12 },
  taipei: { skyTop: '#11182d', skyBottom: '#4a4567', fog: '#383a55', fogNear: 150, fogFar: 470,
    ground: '#333541', road: '#252830', sun: '#aaaed6', sunIntensity: 0.75, ambient: 0.95,
    sunDirection: [50, 90, -60], water: '#262638', waterLight: '#61516f', exposure: 1.35 },
  kenting: { skyTop: '#639eb9', skyBottom: '#f8e5c0', fog: '#ecd7b6', fogNear: 215, fogFar: 680,
    ground: '#b4ae7a', road: '#565453', sun: '#ffe1a5', sunIntensity: 3.8, ambient: 1.4,
    sunDirection: [-60, 56, 45], water: '#4a9f9e', waterLight: '#a3d6c7', exposure: 1.14 },
};

const CHUNK = 120;
const TERRAIN_XS = [-310, -240, -175, -125, -85, -55, -32, -19, -9, 0, 9, 15, 24, 37, 60];
const dummy = new THREE.Object3D();
const matrix = new THREE.Matrix4();
const relative = new THREE.Matrix4();
const color = new THREE.Color();
const fract = v => v - Math.floor(v);
const random = n => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
const standard = (color, extras = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extras });

function noiseTexture(kind = 'asphalt') {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(128, 128);
  for (let i = 0; i < 128 * 128; i++) {
    const value = kind === 'asphalt' ? 140 + random(i) * 34 : 184 + random(i) * 50;
    image.data[i * 4] = image.data[i * 4 + 1] = image.data[i * 4 + 2] = value;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.repeat.set(3, 10);
  return texture;
}

function windowTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 256;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#202736'; ctx.fillRect(0, 0, 128, 256);
  for (let row = 0; row < 20; row++) for (let col = 0; col < 8; col++) {
    const r = random(row * 39 + col * 7);
    ctx.fillStyle = r > 0.64 ? '#d9b980' : r > 0.5 ? '#6aafb3' : '#293442';
    ctx.fillRect(col * 16 + 5, row * 13 + 4, 7, 7);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function cloudTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 96;
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < 10; i++) {
    const x = 30 + i * 20; const y = 40 + Math.sin(i) * 10; const r = 27 + random(i) * 14;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(255,255,255,.7)'); grad.addColorStop(0.6, 'rgba(255,255,255,.35)');
    grad.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = grad;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return new THREE.CanvasTexture(canvas);
}

function ribbon(mapId, start, end, offset, width, height = 0.02, terrain = false) {
  const vertices = [], indices = [], uv = [];
  const steps = Math.ceil((end - start) / 4);
  for (let i = 0; i <= steps; i++) {
    const z = start + (end - start) * i / steps;
    const angle = roadHeading(z, mapId);
    for (const side of [-1, 1]) {
      const x = offset + side * width / 2;
      vertices.push(roadCenter(z, mapId) + x * Math.cos(angle),
        routeAltitude(z, mapId) + height + (terrain ? Math.sin(z * 0.03 + x) * 0.01 : 0),
        z - x * Math.sin(angle));
      uv.push(side < 0 ? 0 : 1, i / steps);
    }
    if (i < steps) { const a = i * 2; indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(indices); geo.computeVertexNormals();
  return geo;
}

function terrainHeight(mapId, z, x) {
  let y = routeAltitude(z, mapId) - 0.09;
  if (mapId === 'coast') {
    if (x < -19) y += Math.pow((-x - 19) / 5.8, 0.95) * (0.72 + Math.sin(z / 98 + x / 150) * 0.28);
    if (x > 12) y = Math.max(-2.1, y - (x - 12) * 0.37);
  } else if (mapId === 'alishan') {
    if (Math.abs(x) > 12) y += (Math.abs(x) - 12) * (x < 0 ? 0.25 : 0.035)
      * (0.72 + Math.sin(z / 85 + x / 115) * 0.32);
  } else if (mapId === 'kenting') {
    if (x < -20) y += Math.sin(z / 110 + x / 155) * 3 + (-x - 20) * 0.065;
    if (x > 15) y = Math.max(-1.8, y - (x - 15) * 0.16);
  }
  return y;
}

/** Match the actual terrain triangles, rather than the unsampled height formula. */
function terrainSurfaceHeight(mapId, z, x) {
  const z0 = Math.floor(z / 6) * 6, z1 = z0 + 6, v = (z - z0) / 6;
  const centerLerp = roadCenter(z0, mapId) * (1 - v) + roadCenter(z1, mapId) * v;
  const localX = x + roadCenter(z, mapId) - centerLerp;
  let index = TERRAIN_XS.findIndex((value, i) => i < TERRAIN_XS.length - 1 && localX <= TERRAIN_XS[i + 1]);
  if (index < 0) index = TERRAIN_XS.length - 2;
  const x0 = TERRAIN_XS[index], x1 = TERRAIN_XS[index + 1];
  const u = Math.max(0, Math.min(1, (localX - x0) / (x1 - x0)));
  const y00 = terrainHeight(mapId, z0, x0), y10 = terrainHeight(mapId, z0, x1);
  const y01 = terrainHeight(mapId, z1, x0), y11 = terrainHeight(mapId, z1, x1);
  return u + v <= 1 ? y00 + (y10 - y00) * u + (y01 - y00) * v
    : y11 + (y01 - y11) * (1 - u) + (y10 - y11) * (1 - v);
}

function terrainGeometry(mapId, start, end) {
  const v = [], colors = [], indices = [];
  const settings = ENVIRONMENTS[mapId];
  const base = new THREE.Color(settings.ground);
  const xs = TERRAIN_XS;
  const steps = 20;
  for (let zi = 0; zi <= steps; zi++) {
    const z = start + (end - start) * zi / steps;
    for (let xi = 0; xi < xs.length; xi++) {
      const x = xs[xi], y = terrainHeight(mapId, z, x);
      v.push(roadCenter(z, mapId) + x, y, z);
      color.copy(base).multiplyScalar(0.91 + 0.11 * Math.sin(z / 50 + x / 23));
      if ((mapId === 'coast' && x > 18) || (mapId === 'kenting' && x > 12)) color.set('#d2bf95');
      colors.push(color.r, color.g, color.b);
      if (zi < steps && xi < xs.length - 1) {
        const a = zi * xs.length + xi, b = a + xs.length;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

/** Instances each mesh part of a Blender model. Geometry/materials stay shared. */
function instanceAsset(template, placements, group, castShadow = true) {
  if (!template || !placements.length) return;
  template.updateMatrixWorld(true);
  const rootInverse = template.matrixWorld.clone().invert();
  template.traverse(part => {
    if (!part.isMesh) return;
    relative.multiplyMatrices(rootInverse, part.matrixWorld);
    const local = relative.clone();
    const instances = new THREE.InstancedMesh(part.geometry, part.material, placements.length);
    instances.castShadow = castShadow; instances.receiveShadow = true;
    for (let i = 0; i < placements.length; i++) {
      const p = placements[i]; dummy.position.set(p.x, p.y, p.z); dummy.rotation.set(0, p.rotation || 0, 0);
      dummy.scale.setScalar(p.scale || 1); dummy.updateMatrix();
      matrix.multiplyMatrices(dummy.matrix, local); instances.setMatrixAt(i, matrix);
    }
    instances.instanceMatrix.needsUpdate = true; instances.computeBoundingSphere(); group.add(instances);
  });
}

function boxes(geometry, material, placements, group, castShadow = true) {
  const mesh = new THREE.InstancedMesh(geometry, material, placements.length);
  mesh.castShadow = castShadow; mesh.receiveShadow = true;
  placements.forEach((p, i) => {
    dummy.position.set(p.x, p.y, p.z); dummy.rotation.set(0, p.rotation || 0, 0);
    dummy.scale.set(p.sx || 1, p.sy || 1, p.sz || 1); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
    if (p.color) mesh.setColorAt(i, color.set(p.color));
  });
  mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); group.add(mesh); return mesh;
}

export class IslandWorld {
  constructor(scene, assets) {
    this.scene = scene; this.assets = assets; this.root = new THREE.Group(); scene.add(this.root);
    this.chunks = []; this.clouds = []; this.obstacles = []; this.mapId = 'coast';
    this.textures = { asphalt: noiseTexture(), gravel: noiseTexture('gravel'), windows: windowTexture(), cloud: cloudTexture() };
    this.geometry = {
      box: new THREE.BoxGeometry(1, 1, 1), pole: new THREE.CylinderGeometry(0.09, 0.13, 1, 6),
      rock: new THREE.DodecahedronGeometry(1, 0), grass: new THREE.ConeGeometry(0.4, 1.2, 3),
    };
    this.materials = {
      terrain: standard('#ffffff', { vertexColors: true }), rock: standard('#929188', { flatShading: true }),
      road: standard('#394348', { map: this.textures.asphalt, roughness: 0.96 }),
      gravel: standard('#bdb7a0', { map: this.textures.gravel }),
      white: standard('#eee7d1'), yellow: standard('#e5bd63'), steel: standard('#c1c5bd', { metalness: 0.6, roughness: 0.5 }),
      post: standard('#747a73', { metalness: 0.5, roughness: 0.6 }), grass: standard('#648058'),
      sidewalk: standard('#7e7d81', { roughness: 0.9 }), lamp: standard('#ffe7b6', { emissive: '#ffe1a4', emissiveIntensity: 2 }),
      buildings: standard('#ffffff', { map: this.textures.windows, emissiveMap: this.textures.windows,
        emissive: '#8ba1b2', emissiveIntensity: 0.82, roughness: 0.45, metalness: 0.15 }),
      neon: standard('#9edcdd', { emissive: '#66cad4', emissiveIntensity: 2.4 }),
    };
    this.createSky(); this.createWater(); this.createClouds(); this.createFinishGate();
  }

  createSky() {
    this.skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, uniforms: {
        top: { value: new THREE.Color() }, bottom: { value: new THREE.Color() },
        sun: { value: new THREE.Color() }, sunDirection: { value: new THREE.Vector3() }, night: { value: 0 },
      },
      vertexShader: `varying vec3 direction; void main(){direction=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec3 direction; uniform vec3 top,bottom,sun,sunDirection; uniform float night;
        void main(){vec3 dir=normalize(direction); float h=pow(max(dir.y,0.),.58);
          vec3 col=mix(bottom,top,h); float alignment=max(dot(dir,normalize(sunDirection)),0.);
          col+=sun*pow(alignment,38.)*.18*(1.-night); col+=sun*pow(alignment,1800.)*.8;
          gl_FragColor=vec4(col,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1600, 24, 12), this.skyMaterial);
    this.sky.renderOrder = -10; this.sky.frustumCulled = false; this.root.add(this.sky);
  }

  createWater() {
    this.waterMaterial = new THREE.ShaderMaterial({ uniforms: {
      time: { value: 0 }, deep: { value: new THREE.Color() }, shallow: { value: new THREE.Color() },
      fogColor: { value: new THREE.Color() }, fogNear: { value: 180 }, fogFar: { value: 650 }, night: { value: 0 },
    }, vertexShader: `varying vec3 wp; void main(){wp=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}`,
    fragmentShader: `varying vec3 wp; uniform float time,fogNear,fogFar,night; uniform vec3 deep,shallow,fogColor;
      void main(){float wave=sin(wp.x*.47+wp.z*.062+time*.5)*sin(wp.z*.18-wp.x*.041-time*.35);
      float ripple=pow(max(wave,0.),6.); vec3 col=mix(deep,shallow,.14+wave*.08);
      col+=vec3(.38,.43,.37)*ripple*.19*(1.-night);
      float d=length(wp-cameraPosition); col=mix(col,fogColor,smoothstep(fogNear,fogFar,d));
      gl_FragColor=vec4(col,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
    });
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(1800, 6000), this.waterMaterial);
    this.water.rotation.x = -Math.PI / 2; this.water.position.set(870, -1, 1000); this.root.add(this.water);
  }

  createClouds() {
    const geometry = new THREE.PlaneGeometry(180, 62);
    this.cloudMaterial = new THREE.MeshBasicMaterial({ map: this.textures.cloud, transparent: true,
      opacity: 0.48, depthWrite: false, color: '#ffffff', fog: true });
    for (let i = 0; i < 10; i++) {
      const cloud = new THREE.Mesh(geometry, this.cloudMaterial);
      cloud.position.set(-430 + i * 100, 100 + random(i * 3) * 40, -220 + random(i) * 650);
      cloud.scale.setScalar(0.7 + random(i * 5) * 0.7); this.clouds.push(cloud); this.root.add(cloud);
    }
  }

  createFinishGate() {
    this.finish = new THREE.Group(); this.root.add(this.finish);
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 96;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#213c42'; ctx.fillRect(0, 0, 512, 96);
    ctx.font = '700 45px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#eee7d3'; ctx.fillText('FINISH  /  2.4 KM', 256, 63);
    for (let i = 0; i < 32; i++) { ctx.fillStyle = i % 2 ? '#eee7d3' : '#213c42'; ctx.fillRect(i * 16, 0, 16, 12); }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const banner = new THREE.Mesh(new THREE.BoxGeometry(14, 2.3, 0.15), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 }));
    banner.position.y = 7.7; this.finish.add(banner);
    for (const x of [-7.3, 7.3]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 9, 8), this.materials.post);
      post.position.set(x, 4.5, 0); this.finish.add(post);
    }
  }

  build(mapId) {
    this.mapId = mapId; this.obstacles = [];
    for (const { group } of this.chunks) {
      this.root.remove(group);
      group.traverse(object => { if (object.userData.ownedGeometry) object.geometry.dispose(); if (object.isInstancedMesh) object.dispose(); });
    }
    this.chunks = [];
    const e = ENVIRONMENTS[mapId];
    this.scene.fog = new THREE.Fog(e.fog, e.fogNear, e.fogFar);
    this.skyMaterial.uniforms.top.value.set(e.skyTop); this.skyMaterial.uniforms.bottom.value.set(e.skyBottom);
    this.skyMaterial.uniforms.sun.value.set(e.sun); this.skyMaterial.uniforms.sunDirection.value.fromArray(e.sunDirection);
    this.skyMaterial.uniforms.night.value = mapId === 'taipei' ? 1 : 0;
    this.waterMaterial.uniforms.deep.value.set(e.water); this.waterMaterial.uniforms.shallow.value.set(e.waterLight);
    this.waterMaterial.uniforms.fogColor.value.set(e.fog); this.waterMaterial.uniforms.fogNear.value = e.fogNear;
    this.waterMaterial.uniforms.fogFar.value = e.fogFar; this.waterMaterial.uniforms.night.value = mapId === 'taipei' ? 1 : 0;
    this.water.visible = mapId === 'coast' || mapId === 'kenting';
    this.cloudMaterial.opacity = mapId === 'taipei' ? 0.11 : mapId === 'alishan' ? 0.35 : 0.6;
    this.materials.road.color.set(e.road);
    this.materials.road.roughness = mapId === 'taipei' ? 0.28 : 0.88;
    this.materials.grass.color.set(mapId === 'alishan' ? '#48674b' : mapId === 'kenting' ? '#898d57' : '#738b61');
    this.materials.rock.color.set(mapId === 'coast' ? '#8c9186' : '#9a9384');
    for (let start = -360; start < 2760; start += CHUNK) this.createChunk(start);
    this.finish.position.set(roadCenter(2400, mapId), routeAltitude(2400, mapId), 2400);
    this.finish.rotation.y = roadHeading(2400, mapId);
    this.update(30, 0, null);
  }

  addRibbon(group, start, end, offset, width, material, height = 0.025) {
    const object = new THREE.Mesh(ribbon(this.mapId, start, end, offset, width, height), material);
    object.userData.ownedGeometry = true; object.receiveShadow = true; group.add(object); return object;
  }

  createChunk(start) {
    const map = this.mapId, end = start + CHUNK, group = new THREE.Group(); this.root.add(group);
    this.chunks.push({ start, end, group });
    const ground = new THREE.Mesh(terrainGeometry(map, start, end), this.materials.terrain);
    ground.receiveShadow = true; ground.userData.ownedGeometry = true; group.add(ground);
    this.addRibbon(group, start, end, 0, 12, this.materials.road);
    for (const side of [-1, 1]) {
      this.addRibbon(group, start, end, side * 6.45, 0.85, this.materials.gravel, 0.005);
      this.addRibbon(group, start, end, side * 5.72, 0.12, this.materials.white, 0.037);
      if (map === 'taipei') {
        this.addRibbon(group, start, end, side * 10.8, 8.2, this.materials.sidewalk, 0.17);
        this.addRibbon(group, start, end, side * 6.76, 0.2, this.materials.white, 0.2);
      }
    }
    const markerSegments = [];
    for (let z = start; z < end; z += 12) {
      for (const x of [-0.16, 0.16]) markerSegments.push(ribbon(map, z, z + 6, x, 0.09, 0.038));
    }
    const markerGeometry = mergeGeometries(markerSegments);
    markerSegments.forEach(geometry => geometry.dispose());
    const markers = new THREE.Mesh(markerGeometry, this.materials.yellow);
    markers.userData.ownedGeometry = true; markers.receiveShadow = true; group.add(markers);
    if (map !== 'taipei') this.addRails(group, start, end);
    if (map === 'taipei') this.addCity(group, start, end);
    else this.addNature(group, start, end);
    this.addLamps(group, start, end);
    if (start >= 0 && start % 240 === 0 && this.assets.road_sign) {
      const z = start + 62, offset = -9.2;
      instanceAsset(this.assets.road_sign, [{ x: roadCenter(z, map) + offset, y: routeAltitude(z, map), z,
        rotation: Math.PI + roadHeading(z, map), scale: 1 }], group);
      this.obstacles.push({ z, lateral: offset, radius: 0.65 });
    }
  }

  addRails(group, start, end) {
    const posts = [], rails = [], reflectors = [];
    for (let z = start; z < end; z += 6) {
      for (const side of [-1, 1]) {
        const h = roadHeading(z + 3, this.mapId), x = roadCenter(z + 3, this.mapId) + side * 7.6;
        const y = routeAltitude(z + 3, this.mapId);
        rails.push({ x, y: y + 0.83, z: z + 3, rotation: h, sx: 0.12, sy: 0.3, sz: 6.1 });
        posts.push({ x, y: y + 0.4, z: z + 3, sx: 0.12, sy: 0.8, sz: 0.12 });
        if (z % 18 === 0) reflectors.push({ x: x - side * 0.1, y: y + 0.87, z: z + 3, sx: 0.06, sy: 0.13, sz: 0.2 });
      }
    }
    boxes(this.geometry.box, this.materials.steel, rails, group, false);
    boxes(this.geometry.box, this.materials.post, posts, group, false);
    if (reflectors.length) boxes(this.geometry.box, this.materials.white, reflectors, group, false);
  }

  addNature(group, start, end) {
    const pines = [], palms = [], rocks = [], grasses = [];
    const map = this.mapId;
    const count = map === 'alishan' ? 27 : map === 'kenting' ? 9 : 8;
    for (let i = 0; i < count; i++) {
      const z = start + random(start + i * 23) * CHUNK;
      const side = map === 'coast' ? -1 : map === 'kenting' ? (i % 3 === 0 ? 1 : -1) : (i % 2 ? 1 : -1);
      const offset = side * (12 + random(start + i * 11) * (side > 0 ? 8 : 40));
      const y = terrainSurfaceHeight(map, z, offset) - 0.035;
      const placement = { x: roadCenter(z, map) + offset, y, z, rotation: random(i * 54 + start) * Math.PI * 2,
        scale: map === 'alishan' ? 0.75 + random(i * 21 + start) * 0.65 : 0.82 + random(i + start) * 0.4 };
      if (map === 'alishan' || map === 'coast') pines.push(placement); else palms.push(placement);
    }
    instanceAsset(this.assets.pine, pines, group); instanceAsset(this.assets.palm, palms, group);
    for (let i = 0; i < 15; i++) {
      const z = start + random(i * 65 + start) * CHUNK; const side = i % 2 ? -1 : 1;
      const offset = side * (10 + random(i * 72 + start) * (side < 0 ? 22 : 10));
      const scale = 0.4 + random(i * 53 + start) * (map === 'coast' ? 3.6 : 1.5);
      rocks.push({ x: roadCenter(z, map) + offset, y: terrainSurfaceHeight(map, z, offset) + scale * 0.28, z,
        sx: scale * 1.6, sy: scale, sz: scale * 1.2, rotation: random(i + start) * 5 });
    }
    for (let i = 0; i < 34; i++) {
      const z = start + random(i * 93 + start) * CHUNK, offset = (i % 2 ? -1 : 1) * (8.4 + random(i * 31 + start) * 4);
      const height = 0.3 + random(i * 23) * 0.45;
      grasses.push({ x: roadCenter(z, map) + offset, y: terrainSurfaceHeight(map, z, offset) + height * 0.55, z,
        sx: 0.6 + random(i) * 0.8, sy: height, sz: 0.8, rotation: random(i + start) * 6 });
    }
    boxes(this.geometry.rock, this.materials.rock, rocks, group);
    boxes(this.geometry.grass, this.materials.grass, grasses, group, false);
  }

  addCity(group, start, end) {
    const buildings = [], neon = [];
    for (let i = 0; i < 18; i++) {
      const z = start + (i % 9) * 14 + random(start + i * 35) * 6;
      const side = i < 9 ? -1 : 1; const offset = side * (21 + random(i * 77 + start) * 25);
      const h = 10 + random(i * 19 + start) * 43; const w = 7 + random(i * 12 + start) * 8;
      const x = roadCenter(z, this.mapId) + offset, y = routeAltitude(z, this.mapId);
      buildings.push({ x, y: y + h / 2, z, sx: w, sy: h, sz: 11 + random(i * 5 + start) * 7,
        color: i % 3 === 0 ? '#bfc8d1' : i % 3 === 1 ? '#9ca9c1' : '#c4b6c8' });
      neon.push({ x: x - side * w * 0.51, y: y + 5, z, sx: 0.08, sy: 0.11, sz: 7 });
    }
    boxes(this.geometry.box, this.materials.buildings, buildings, group);
    boxes(this.geometry.box, this.materials.neon, neon, group, false);
    if ((start === 120 || start === -240 || start === 960) && this.assets.city_tower) {
      const z = start === -240 ? -165 : start + 67;
      instanceAsset(this.assets.city_tower, [{ x: roadCenter(z, this.mapId) + (start === -240 ? 89 : 67),
        y: routeAltitude(z, this.mapId), z, rotation: 0, scale: 1 }], group);
    }
  }

  addLamps(group, start, end) {
    const poles = [], arms = [], heads = [], bulbs = [];
    const spacing = this.mapId === 'taipei' ? 24 : 60;
    for (let z = start + 12; z < end; z += spacing) {
      if (z >= 20 && z <= 50) continue;
      for (const side of this.mapId === 'taipei' ? [-1, 1] : [-1]) {
        const offset = side * (this.mapId === 'taipei' ? 7.8 : 9.1);
        const x = roadCenter(z, this.mapId) + offset, y = routeAltitude(z, this.mapId);
        poles.push({ x, y: y + 3.2, z, sx: 1, sy: 6.4, sz: 1 });
        arms.push({ x: x - side * 0.95, y: y + 6.3, z, sx: 2, sy: 0.13, sz: 0.13 });
        heads.push({ x: x - side * 1.85, y: y + 6.23, z, sx: 0.6, sy: 0.18, sz: 0.9 });
        bulbs.push({ x: x - side * 1.85, y: y + 6.12, z, sx: 0.46, sy: 0.03, sz: 0.72 });
        this.obstacles.push({ z, lateral: offset, radius: 0.22 });
      }
    }
    boxes(this.geometry.pole, this.materials.post, poles, group, false);
    boxes(this.geometry.box, this.materials.post, [...arms, ...heads], group, false);
    if (this.mapId === 'taipei') boxes(this.geometry.box, this.materials.lamp, bulbs, group, false);
  }

  update(distance, time, camera) {
    const visible = ENVIRONMENTS[this.mapId].fogFar + 90;
    for (const chunk of this.chunks) chunk.group.visible = chunk.end > distance - 240 && chunk.start < distance + visible;
    this.sky.position.set(roadCenter(distance, this.mapId), 0, distance);
    this.waterMaterial.uniforms.time.value = time;
    this.finish.visible = distance > 1850;
    for (let i = 0; i < this.clouds.length; i++) {
      const cloud = this.clouds[i]; cloud.position.z = distance - 180 + random(i) * 680;
      cloud.position.x = -430 + i * 100 + Math.sin(time * 0.012 + i) * 14;
      if (camera) cloud.quaternion.copy(camera.quaternion);
    }
  }

  setQuality(quality) {
    const high = quality === 'high';
    this.clouds.forEach((cloud, i) => { cloud.visible = high || i % 2 === 0; });
    this.root.traverse(object => {
      if (object.isMesh && object !== this.sky) {
        if (object.userData.originalCastShadow === undefined) object.userData.originalCastShadow = object.castShadow;
        object.castShadow = high && object.userData.originalCastShadow;
      }
    });
  }

  dispose() {
    this.scene.remove(this.root);
    const geometries = new Set(), materials = new Set();
    this.root.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
      if (object.isInstancedMesh) object.dispose();
    });
    // Imported Blender geometry belongs to the asset cache and is disposed by Game.
    Object.values(this.geometry).forEach(g => geometries.add(g));
    geometries.forEach(g => { if (!g.userData.importedAsset) g.dispose(); });
    materials.forEach(m => { if (!m.userData.importedAsset) m.dispose(); });
    Object.values(this.textures).forEach(t => t.dispose());
  }
}
