import { isNative,requestNativeMotion,subscribeNativeMotion } from '../../shared/native.js';
const bounded = value => Math.max(-1, Math.min(1, Number.isFinite(value) ? value : 0));

/** Device axes are rotated into the current screen's left/right axis. Degrees. */
export function screenTilt(beta, gamma, screenAngle = 0) {
  if (!Number.isFinite(beta) || !Number.isFinite(gamma) || !Number.isFinite(screenAngle)) return null;
  const angle = screenAngle * Math.PI / 180;
  return gamma * Math.cos(angle) + beta * Math.sin(angle);
}

export function tiltSteering(tilt, neutral = 0, deadzone = 3, fullTurn = 25) {
  if (![tilt, neutral, deadzone, fullTurn].every(Number.isFinite) || fullTurn <= deadzone || deadzone < 0) return 0;
  const difference = ((tilt - neutral + 180) % 360 + 360) % 360 - 180;
  if (Math.abs(difference) <= deadzone) return 0;
  return bounded(Math.sign(difference) * (Math.abs(difference) - deadzone) / (fullTurn - deadzone));
}

/** Exponential filtering gives the same response at different sensor/frame rates. */
export function smoothSteering(previous, target, seconds, response = 0.1) {
  const old = bounded(previous), next = bounded(target);
  if (!Number.isFinite(seconds) || seconds <= 0) return old;
  const factor = 1 - Math.exp(-seconds / Math.max(0.001, Number.isFinite(response) ? response : 0.1));
  return bounded(old + (next - old) * factor);
}

export function combineSteering(left, right, tiltEnabled, tiltValue) {
  if (left || right) return Number(Boolean(right)) - Number(Boolean(left));
  return tiltEnabled ? bounded(tiltValue) : 0;
}

export class TiltController {
  constructor({ host = window, onSteer = () => {}, onStatus = () => {}, onNotice = () => {},nativeMotionBridge={request:requestNativeMotion,subscribe:subscribeNativeMotion} } = {}) {
    this.host = host; this.onSteer = onSteer; this.onStatus = onStatus; this.onNotice = onNotice;
    this.nativeMotionBridge=nativeMotionBridge;this.nativeRemove=null;
    this.enabled = false; this.active = false; this.status = 'off'; this.steer = 0; this.neutral = null;
    this.raw = null; this.lastSample = -Infinity; this.activeSince = Infinity; this.previousFrame = null; this.awaitFresh = true;
    this.pending = false; this.generation = 0; this.raf = 0; this.timeout = 0; this.angle = this.screenAngle();
    this.handleOrientation = this.handleOrientation.bind(this); this.tick = this.tick.bind(this);
    this.handleScreenChange = this.handleScreenChange.bind(this);
  }
  now() { return this.host.performance.now(); }
  screenAngle() {
    const current = this.host.screen?.orientation?.angle ?? this.host.orientation ?? 0;
    return Number.isFinite(Number(current)) ? Number(current) : 0;
  }
  getState() { return { enabled: this.enabled, ready: this.enabled && this.status === 'ready', pending: this.pending,
    status: this.status, active: this.active, steer: this.steer, neutral: this.neutral, angle: this.angle }; }
  notify() { this.onStatus(this.getState()); }

  async enable() {
    if (this.pending || this.enabled) return this.enabled;
    const native=isNative(this.host);
    if (!this.host.isSecureContext&&!native) {
      this.status = 'insecure'; this.notify();
      this.onNotice('手機方向盤需要 HTTPS，請從正式遊戲網址開啟。'); return false;
    }
    const Orientation = this.host.DeviceOrientationEvent;
    if (!Orientation) {
      this.status = 'unsupported'; this.notify();
      this.onNotice('這個瀏覽器不支援方向感測，請繼續使用觸控轉向。'); return false;
    }
    const generation = ++this.generation;
    this.pending = true; this.status = 'permission'; this.notify();
    try {
      // This call must stay synchronous within the initiating button click.
      if(native){
        const permission=await this.nativeMotionBridge.request();
        if(generation!==this.generation)return false;
        if(!permission.granted){this.pending=false;this.status=permission.status||'denied';this.notify();this.onNotice('方向感測尚未開啟，請由家長確認權限，或使用觸控轉向。');return false;}
        const remove=await this.nativeMotionBridge.subscribe(this.handleOrientation);
        if(generation!==this.generation){void remove();return false;}this.nativeRemove=remove;
      }else if (typeof Orientation.requestPermission === 'function') {
        const result = await Orientation.requestPermission();
        if (generation !== this.generation) return false;
        if (result !== 'granted') {
          this.pending = false; this.status = 'denied'; this.notify();
          this.onNotice('方向感測權限未開啟。請允許 Safari 的動作與方向存取，或使用觸控轉向。'); return false;
        }
      }
      if (generation !== this.generation) return false;
      this.pending = false; this.enabled = true; this.status = 'waiting'; this.neutral = null;
      this.raw = null; this.angle = this.screenAngle(); this.lastSample = -Infinity;
      if(!native)this.host.addEventListener('deviceorientation', this.handleOrientation);
      this.host.addEventListener('orientationchange', this.handleScreenChange);
      this.host.screen?.orientation?.addEventListener('change', this.handleScreenChange);
      this.waitForSensor(); this.notify(); this.raf = this.host.requestAnimationFrame(this.tick);
      this.onNotice('雙手握住手機，保持舒服的角度，正在等待方向感測。'); return true;
    } catch (error) {
      if (generation !== this.generation) return false;
      this.pending = false; this.status = 'error'; this.notify();
      this.onNotice(error?.name === 'NotAllowedError'
        ? '請親自點「手機方向盤」並允許動作與方向存取，再試一次。'
        : '無法取得方向感測權限，請檢查瀏覽器設定，或使用觸控轉向。');
      return false;
    }
  }

  waitForSensor() {
    this.host.clearTimeout(this.timeout);
    this.timeout = this.host.setTimeout(() => {
      if (this.enabled && this.status === 'waiting') {
        this.disable('unavailable'); this.onNotice('沒有收到方向感測資料，已切回觸控轉向。請檢查手機感測器與瀏覽器權限。');
      }
    }, 5000);
  }
  handleOrientation(event) {
    if (!this.enabled) return;
    const angle = this.screenAngle();
    if (angle !== this.angle) this.handleScreenChange();
    const raw = screenTilt(event.beta, event.gamma, this.angle);
    if (raw === null) return;
    this.raw = raw; this.lastSample = this.now();
    if (this.active) this.awaitFresh = false;
    if (this.neutral === null) {
      this.neutral = raw; this.status = 'ready'; this.resetSteer(); this.host.clearTimeout(this.timeout); this.notify();
      this.onNotice('方向盤已回正。左右傾斜手機轉向，右手按油門；偏了可點「回正」。');
    }
  }
  handleScreenChange() {
    if (!this.enabled) return;
    const angle = this.screenAngle();
    if (angle === this.angle && this.neutral === null) return;
    this.angle = angle; this.neutral = null; this.raw = null; this.lastSample = -Infinity;
    this.status = 'waiting'; this.resetSteer(); this.waitForSensor(); this.notify();
  }
  calibrate() {
    if (!this.enabled || this.raw === null || this.now() - this.lastSample > 1000) {
      this.onNotice('還沒有新的方向感測資料，請移動一下手機後再回正。'); return false;
    }
    this.neutral = this.raw; this.resetSteer(); this.notify(); this.onNotice('已回正，現在的握持角度就是直行。'); return true;
  }
  setActive(active) {
    const next = Boolean(active);
    if (this.active === next) return;
    this.active = next; this.activeSince = next ? this.now() : Infinity; this.awaitFresh = true; this.resetSteer(); this.notify();
  }
  resetSteer() { this.steer = 0; this.previousFrame = null; this.onSteer(0); }
  tick(timestamp) {
    if (!this.enabled) return;
    const seconds = this.previousFrame === null ? 0 : Math.max(0, (timestamp - this.previousFrame) / 1000);
    this.previousFrame = timestamp;
    const fresh = !this.awaitFresh && this.lastSample >= this.activeSince && this.now() - this.lastSample < 600;
    const target = this.active && this.status === 'ready' && fresh ? tiltSteering(this.raw, this.neutral) : 0;
    const value = this.active && fresh ? smoothSteering(this.steer, target, seconds) : 0;
    if (Math.abs(value - this.steer) > 0.0001 || (value === 0 && this.steer !== 0)) {
      this.steer = value; this.onSteer(value);
    }
    this.raf = this.host.requestAnimationFrame(this.tick);
  }
  disable(status = 'off') {
    ++this.generation; this.enabled = false; this.pending = false; this.status = status; this.neutral = null; this.raw = null;
    this.host.clearTimeout(this.timeout); this.host.cancelAnimationFrame(this.raf);
    const removal=this.nativeRemove?.();removal?.catch?.(()=>{});this.nativeRemove=null;
    this.host.removeEventListener('deviceorientation', this.handleOrientation);
    this.host.removeEventListener('orientationchange', this.handleScreenChange);
    this.host.screen?.orientation?.removeEventListener('change', this.handleScreenChange);
    this.resetSteer(); this.notify();
  }
  dispose() { this.disable(); }
}
