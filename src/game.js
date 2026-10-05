import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MAPS, VEHICLES, TRACK_LENGTH } from './config.js';
import { IslandWorld, ENVIRONMENTS } from './world.js';
import { DriveAudio } from './audio.js';
import { createPhysicsState, stepPhysics, roadCenter, roadHeading, routeAltitude, calculateScore, timeAttackLimit, clamp } from './physics.js';

const MODEL_NAMES = ['coupe', 'rally', 'suv', 'van', 'palm', 'pine', 'city_tower', 'road_sign'];
const targetPosition = new THREE.Vector3(), targetLook = new THREE.Vector3(), offset = new THREE.Vector3();

function contactTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d'), gradient = ctx.createRadialGradient(64, 64, 14, 64, 64, 62);
  gradient.addColorStop(0, 'rgba(8,17,19,.7)'); gradient.addColorStop(0.55, 'rgba(8,17,19,.38)');
  gradient.addColorStop(1, 'rgba(8,17,19,0)'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

export class Game {
  constructor({ canvas, onUpdate = () => {}, onFinish = () => {}, onReady = () => {}, onError = () => {} }) {
    this.canvas = canvas; this.onUpdate = onUpdate; this.onFinish = onFinish; this.onReady = onReady; this.onError = onError;
    this.input = { steer: 0, throttle: 0, brake: 0, boost: false };
    this.phase = 'menu'; this.mode = 'cruise'; this.mapId = 'coast'; this.vehicleId = 'coupe';
    this.color = VEHICLES[0].color; this.cameraMode = 'chase'; this.quality = 'high'; this.muted = false;
    this.physics = createPhysicsState(); this.countdownRemaining = 0; this.clockTime = 0;
    this.lastTime = 0; this.accumulator = 0; this.lastUpdate = 0; this.menuTime = 0;
    this.assets = {}; this.disposed = false; this.initialized = false; this.vehicleRequest = 0;
    this.cameraLook = new THREE.Vector3(); this.audio = new DriveAudio(); this.frame = this.frame.bind(this);
  }

  get running() { return this.phase === 'running'; }
  get vehicleSpec() { return VEHICLES.find(v => v.id === this.vehicleId) || VEHICLES[0]; }

  async init() {
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true,
        alpha: false, powerPreference: 'high-performance' });
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFShadowMap;
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 1800);
      this.scene.add(this.camera);
      const environment = new RoomEnvironment();
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.environmentTarget = pmrem.fromScene(environment, 0.04);
      this.scene.environment = this.environmentTarget.texture;
      environment.dispose(); pmrem.dispose();
      this.hemi = new THREE.HemisphereLight('#d0e6ef', '#53654a', 1.4); this.scene.add(this.hemi);
      this.sun = new THREE.DirectionalLight('#fff0c9', 3.4); this.sun.castShadow = true;
      this.sun.shadow.mapSize.set(1536, 1536); this.sun.shadow.camera.left = -45; this.sun.shadow.camera.right = 45;
      this.sun.shadow.camera.top = 45; this.sun.shadow.camera.bottom = -45;
      this.sun.shadow.camera.near = 1; this.sun.shadow.camera.far = 230;
      this.sun.shadow.bias = -0.00025; this.sun.shadow.normalBias = 0.025;
      this.scene.add(this.sun, this.sun.target);
      this.fillLight = new THREE.DirectionalLight('#c4e5ee', 0.75); this.fillLight.position.set(-20, 10, -25); this.scene.add(this.fillLight);
      const loader = new GLTFLoader();
      await Promise.all(MODEL_NAMES.map(async name => {
        const model = await loader.loadAsync(`${import.meta.env.BASE_URL}models/${name}.glb`);
        model.scene.traverse(object => {
          if (!object.isMesh) return;
          object.castShadow = true; object.receiveShadow = true; object.geometry.userData.importedAsset = true;
          (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => {
            material.userData.importedAsset = true; material.envMapIntensity = 0.9;
          });
        });
        this.assets[name] = model.scene;
      }));
      if (this.disposed) return;
      this.world = new IslandWorld(this.scene, this.assets); this.world.build(this.mapId);
      this.vehicleRoot = new THREE.Group(); this.scene.add(this.vehicleRoot);
      this.contactMap = contactTexture();
      this.contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 5.8),
        new THREE.MeshBasicMaterial({ map: this.contactMap, transparent: true, depthWrite: false, opacity: 0.72 }));
      this.contactShadow.rotation.x = -Math.PI / 2; this.contactShadow.position.y = 0.028;
      this.vehicleRoot.add(this.contactShadow);
      this.headlights = [];
      for (const x of [-0.65, 0.65]) {
        const light = new THREE.SpotLight('#e3edff', 75, 55, 0.36, 0.55, 1.5);
        light.position.set(x, 0.72, 1.65); light.target.position.set(x, -0.6, 40);
        this.vehicleRoot.add(light, light.target); this.headlights.push(light);
      }
      this.roadGlow = new THREE.PointLight('#ffc583', 0, 19, 2);
      this.roadGlow.position.set(0, 5, 0); this.scene.add(this.roadGlow);
      await this.setVehicle(this.vehicleId); this.applyEnvironment();
      this.resize = () => {
        if (this.disposed) return;
        const bounds = this.canvas.getBoundingClientRect();
        const width = Math.max(1, Math.round(bounds.width || window.innerWidth));
        const height = Math.max(1, Math.round(bounds.height || window.innerHeight));
        this.mobile = width < 760;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality === 'high' ? (this.mobile ? 1.5 : 1.75) : 1));
        this.renderer.setSize(width, height, false); this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
        if (this.phase === 'menu') this.updateCamera(1, true);
      };
      this.observer = new ResizeObserver(this.resize); this.observer.observe(this.canvas); this.resize();
      this.visibilityHandler = () => { if (document.hidden && ['running', 'countdown'].includes(this.phase)) this.pause(); this.lastTime = 0; };
      document.addEventListener('visibilitychange', this.visibilityHandler);
      this.contextLostHandler = event => { event.preventDefault(); this.pause(); this.onError(new Error('顯示連線中斷，請重新整理遊戲。')); };
      this.canvas.addEventListener('webglcontextlost', this.contextLostHandler);
      this.initialized = true; this.placeVehicle(30, -2.7, 0); this.updateCamera(1, true);
      this.renderer.render(this.scene, this.camera);
      this.onUpdate(this.getState()); this.onReady(); this.raf = requestAnimationFrame(this.frame);
      return this;
    } catch (error) {
      this.onError(error); throw error;
    }
  }

  async setMap(id) {
    if (!MAPS.some(m => m.id === id)) throw new Error(`Unknown map: ${id}`);
    this.mapId = id; this.physics = createPhysicsState(); this.returnToMenu();
    if (!this.world) return;
    this.world.build(id); this.world.setQuality(this.quality); this.applyEnvironment();
    this.placeVehicle(30, -2.7, 0); this.updateCamera(1, true); this.onUpdate(this.getState());
  }

  async setVehicle(id) {
    if (!VEHICLES.some(v => v.id === id)) throw new Error(`Unknown vehicle: ${id}`);
    this.vehicleId = id;
    if (!this.vehicleRoot || !this.assets[id]) return;
    const request = ++this.vehicleRequest;
    const car = this.assets[id].clone(true); this.paintMaterials = []; this.wheels = [];
    car.traverse(object => {
      if (object.name.startsWith('Wheel') && !object.parent?.name.startsWith('Wheel')) {
        this.wheels.push({ object, x: object.rotation.x, y: object.rotation.y, front: /F[LR]/.test(object.name) });
      }
      if (!object.isMesh) return;
      const cloneMaterial = material => {
        let cloned;
        if (material.name === 'BodyPaint') {
          cloned = new THREE.MeshPhysicalMaterial({ color: this.color, metalness: 0.42, roughness: 0.27,
            clearcoat: 0.9, clearcoatRoughness: 0.19, envMapIntensity: 1.2 });
          cloned.name = 'BodyPaint'; this.paintMaterials.push(cloned);
        } else {
          cloned = material.clone(); cloned.userData = { ...cloned.userData, importedAsset: false };
          cloned.envMapIntensity = 1.1;
          if (/glass/i.test(material.name)) { cloned.roughness = 0.11; cloned.metalness = 0.24; }
        }
        return cloned;
      };
      object.material = Array.isArray(object.material) ? object.material.map(cloneMaterial) : cloneMaterial(object.material);
      object.castShadow = true; object.receiveShadow = true;
    });
    if (request !== this.vehicleRequest) return;
    if (this.car) {
      this.vehicleRoot.remove(this.car);
      this.car.traverse(object => { if (object.isMesh) (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => m.dispose()); });
    }
    this.car = car; this.vehicleRoot.add(car); this.onUpdate(this.getState());
  }

  setColor(hex) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return;
    this.color = hex; this.paintMaterials?.forEach(material => material.color.set(hex));
  }

  applyEnvironment() {
    const env = ENVIRONMENTS[this.mapId];
    this.renderer.toneMappingExposure = env.exposure;
    this.hemi.color.set(env.skyBottom); this.hemi.groundColor.set(env.ground); this.hemi.intensity = env.ambient;
    this.sun.color.set(env.sun); this.sun.intensity = env.sunIntensity;
    this.fillLight.intensity = this.mapId === 'taipei' ? 0.55 : 0.7;
    this.scene.environmentIntensity = this.mapId === 'taipei' ? 0.6 : 0.9;
    this.headlights?.forEach(light => { light.visible = this.mapId === 'taipei'; });
    if (this.roadGlow) this.roadGlow.intensity = this.mapId === 'taipei' ? 9 : 0;
  }

  start(mode = 'cruise') {
    if (!this.initialized) return;
    this.mode = mode === 'timeattack' ? 'timeattack' : 'cruise'; this.physics = createPhysicsState();
    this.countdownRemaining = 3; this.lastCountdown = 4; this.phase = 'countdown'; this.accumulator = 0;
    this.resetInput(); this.audio.unlock().catch(() => {}); this.placeVehicle(0, this.physics.lateral, 0);
    this.updateCamera(1, true); this.onUpdate(this.getState());
  }
  pause() {
    if (!['running', 'countdown'].includes(this.phase)) return;
    this.resumePhase = this.phase; this.phase = 'paused'; this.resetInput(); this.onUpdate(this.getState());
  }
  resume() {
    if (this.phase !== 'paused') return;
    this.phase = this.resumePhase || 'running'; this.lastTime = 0; this.audio.unlock().catch(() => {}); this.onUpdate(this.getState());
  }
  reset() { this.start(this.mode); }
  returnToMenu() {
    this.phase = 'menu'; this.physics = createPhysicsState(); this.countdownRemaining = 0;
    this.resetInput(); this.onUpdate(this.getState());
  }
  resetInput() { this.input.steer = 0; this.input.throttle = 0; this.input.brake = 0; this.input.boost = false; }
  setCamera(mode) {
    this.cameraMode = mode === 'chase' || mode === 'hood' ? mode : this.cameraMode === 'chase' ? 'hood' : 'chase';
    this.updateCamera(1, true); this.onUpdate(this.getState()); return this.cameraMode;
  }
  setQuality(quality) {
    this.quality = quality === 'low' ? 'low' : 'high';
    if (this.renderer) this.renderer.shadowMap.enabled = this.quality === 'high';
    if (this.sun) this.sun.castShadow = this.quality === 'high';
    this.world?.setQuality(this.quality); this.resize?.();
  }
  setMuted(muted) { this.muted = !!muted; this.audio.setMuted(this.muted); }

  getState() {
    const s = this.physics;
    return { speed: s.speed * 3.6, distance: s.distance, elapsed: s.elapsed, progress: s.distance / TRACK_LENGTH,
      timeLeft: this.mode === 'timeattack' ? Math.max(0, timeAttackLimit(this.vehicleSpec, this.mapId) - s.elapsed) : null,
      score: calculateScore(s), offRoad: s.offRoad, boost: s.boost, phase: this.phase,
      countdown: Math.max(0, Math.ceil(this.countdownRemaining)), mapId: this.mapId, vehicleId: this.vehicleId,
      mode: this.mode, camera: this.cameraMode, quality: this.quality, muted: this.muted, collisions: s.collisions };
  }

  finish(completed) {
    if (this.phase === 'finished') return;
    this.phase = 'finished'; this.resetInput(); this.audio.beep(completed ? 880 : 180, 0.36);
    const result = { elapsed: this.physics.elapsed, score: calculateScore(this.physics), distance: this.physics.distance,
      mode: this.mode, completed, mapId: this.mapId, vehicleId: this.vehicleId };
    this.onUpdate(this.getState()); this.onFinish(result);
  }

  placeVehicle(distance, lateral, yaw) {
    if (!this.vehicleRoot) return;
    const heading = roadHeading(distance, this.mapId);
    this.vehicleRoot.position.set(roadCenter(distance, this.mapId) + lateral * Math.cos(heading),
      routeAltitude(distance, this.mapId) + 0.04, distance - lateral * Math.sin(heading));
    this.vehicleRoot.rotation.y = heading + yaw;
    const slope = (routeAltitude(distance + 1, this.mapId) - routeAltitude(distance - 1, this.mapId)) / 2;
    this.vehicleRoot.rotation.x = -Math.atan(slope);
    if (this.car) {
      this.car.rotation.z = this.phase === 'menu' ? 0 : this.physics.steer * 0.045 * (this.physics.speed / 40);
      this.car.position.y = this.phase === 'menu' ? 0 : Math.sin(distance * 1.8) * (this.physics.offRoad ? 0.024 : 0.003);
      for (const wheel of this.wheels) {
        wheel.object.rotation.x = wheel.x + distance / 0.34;
        wheel.object.rotation.y = wheel.y + (wheel.front ? this.physics.steer * 0.3 : 0);
      }
    }
    const env = ENVIRONMENTS[this.mapId];
    this.sun.position.copy(this.vehicleRoot.position).add(offset.fromArray(env.sunDirection));
    this.sun.target.position.copy(this.vehicleRoot.position);
    this.fillLight.position.copy(this.vehicleRoot.position).add(offset.set(-20, 12, -25));
    this.fillLight.target.position.copy(this.vehicleRoot.position);
    this.fillLight.target.updateMatrixWorld();
    if (this.roadGlow) this.roadGlow.position.copy(this.vehicleRoot.position).add(offset.set(-5, 5, 10));
  }

  updateCamera(dt, snap = false) {
    if (!this.camera || !this.vehicleRoot) return;
    const position = this.vehicleRoot.position, heading = this.vehicleRoot.rotation.y;
    let fov;
    if (this.phase === 'menu') {
      const oceanView = this.mapId === 'coast' || this.mapId === 'kenting' || this.mapId === 'taipei';
      const angle = heading + (oceanView ? -0.62 : 0.62) + Math.sin(this.menuTime * 0.095) * 0.08;
      const radius = this.mobile ? 17.7 : 14.2;
      targetPosition.set(position.x + Math.sin(angle) * radius, position.y + (this.mobile ? 5.2 : 4.6), position.z + Math.cos(angle) * radius);
      targetLook.copy(position).add(offset.set(0, this.mobile ? -1.5 : 0.5, 0));
      if (!this.mobile) {
        // Aim to the left of the model, keeping room for the route title.
        const right = offset.set(Math.cos(angle), 0, -Math.sin(angle));
        targetLook.addScaledVector(right, -2.6); targetPosition.addScaledVector(right, -2.6);
      }
      fov = this.mobile ? 44 : 40;
    } else if (this.cameraMode === 'hood') {
      const height = this.vehicleId === 'van' ? 1.72 : this.vehicleId === 'suv' ? 1.45 : 1.05;
      targetPosition.copy(position).add(offset.set(Math.sin(heading) * 1.15, height, Math.cos(heading) * 1.15));
      targetLook.set(roadCenter(this.physics.distance + 42, this.mapId) + this.physics.lateral,
        routeAltitude(this.physics.distance + 42, this.mapId) + 1.0, this.physics.distance + 42);
      fov = 64;
    } else {
      const distance = 9.2 + this.physics.speed * 0.024;
      targetPosition.copy(position).add(offset.set(-Math.sin(heading) * distance, 4.2, -Math.cos(heading) * distance));
      targetLook.set(roadCenter(this.physics.distance + 15, this.mapId) + this.physics.lateral * 0.7,
        routeAltitude(this.physics.distance + 15, this.mapId) + 1.15, this.physics.distance + 15);
      fov = (this.mobile ? 59 : 55) + (this.input.boost && this.physics.boost > 0.02 ? 5 : 0);
    }
    const lerp = snap ? 1 : 1 - Math.exp(-dt * (this.cameraMode === 'hood' ? 11 : 5));
    this.camera.position.lerp(targetPosition, lerp); this.cameraLook.lerp(targetLook, lerp); this.camera.lookAt(this.cameraLook);
    if (Math.abs(this.camera.fov - fov) > 0.02) { this.camera.fov += (fov - this.camera.fov) * (snap ? 1 : 0.08); this.camera.updateProjectionMatrix(); }
    this.car.visible = this.phase === 'menu' || this.cameraMode !== 'hood';
  }

  frame(timestamp) {
    if (this.disposed) return;
    const dt = this.lastTime ? clamp((timestamp - this.lastTime) / 1000, 0, 0.075) : 0.016;
    this.lastTime = timestamp; this.clockTime += dt;
    if (this.phase === 'countdown') {
      this.countdownRemaining = Math.max(0, this.countdownRemaining - dt);
      const count = Math.ceil(this.countdownRemaining);
      if (count !== this.lastCountdown) { this.lastCountdown = count; this.audio.beep(count ? 440 : 880, count ? 0.1 : 0.2); }
      if (!this.countdownRemaining) { this.phase = 'running'; this.accumulator = 0; }
    } else if (this.phase === 'running') {
      this.accumulator += dt;
      while (this.accumulator >= 1 / 60) {
        this.physics = stepPhysics(this.physics, this.input, this.vehicleSpec, this.mapId, 1 / 60, this.world.obstacles);
        this.accumulator -= 1 / 60;
        if (this.physics.completed) { this.finish(true); break; }
        if (this.mode === 'timeattack' && this.physics.elapsed >= timeAttackLimit(this.vehicleSpec, this.mapId)) { this.finish(false); break; }
      }
    }
    const preview = this.phase === 'menu';
    if (preview) this.menuTime += dt;
    const distance = preview ? 30 : this.physics.distance;
    this.placeVehicle(distance, preview ? -2.7 : this.physics.lateral, preview ? 0 : this.physics.yaw);
    this.updateCamera(dt); this.world.update(distance, this.clockTime, this.camera);
    this.audio.update(this.physics, this.input, this.phase === 'running');
    this.renderer.render(this.scene, this.camera);
    if (timestamp - this.lastUpdate > 45) { this.lastUpdate = timestamp; this.onUpdate(this.getState()); }
    this.raf = requestAnimationFrame(this.frame);
  }

  dispose() {
    this.disposed = true; cancelAnimationFrame(this.raf); this.observer?.disconnect();
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    this.canvas.removeEventListener('webglcontextlost', this.contextLostHandler);
    this.audio.dispose(); this.world?.dispose();
    this.car?.traverse(object => { if (object.isMesh) (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => m.dispose()); });
    const geometries = new Set(), materials = new Set();
    Object.values(this.assets).forEach(asset => asset.traverse(object => {
      if (!object.isMesh) return; geometries.add(object.geometry);
      (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
    }));
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
    this.contactShadow?.geometry.dispose(); this.contactShadow?.material.dispose(); this.contactMap?.dispose();
    this.environmentTarget?.dispose(); this.renderer?.dispose();
  }
}
