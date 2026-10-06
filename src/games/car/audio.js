/** Original synthesised audio; no external recording or music dependency. */
export class DriveAudio {
  constructor() { this.context = null; this.muted = false; this.active = false; this.lastCollision = 0; }
  async unlock() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
      const ctx = this.context;
      this.master = ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.23; this.master.connect(ctx.destination);
      this.engine = ctx.createOscillator(); this.engine.type = 'sawtooth';
      this.lowEngine = ctx.createOscillator(); this.lowEngine.type = 'triangle';
      this.engineGain = ctx.createGain(); this.engineGain.gain.value = 0;
      this.filter = ctx.createBiquadFilter(); this.filter.type = 'lowpass'; this.filter.frequency.value = 240;
      this.engine.connect(this.filter); this.lowEngine.connect(this.filter);
      this.filter.connect(this.engineGain); this.engineGain.connect(this.master);
      this.engine.start(); this.lowEngine.start();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
      this.wind = ctx.createBufferSource(); this.wind.buffer = buffer; this.wind.loop = true;
      this.windFilter = ctx.createBiquadFilter(); this.windFilter.type = 'lowpass'; this.windFilter.frequency.value = 450;
      this.windGain = ctx.createGain(); this.windGain.gain.value = 0;
      this.wind.connect(this.windFilter); this.windFilter.connect(this.windGain); this.windGain.connect(this.master); this.wind.start();
    }
    if (this.context.state === 'suspended') await this.context.resume();
    this.active = true;
  }
  update(state, input, running) {
    if (!this.context) return;
    const t = this.context.currentTime, speed = state.speed || 0;
    const rpm = 33 + (speed % 13) * 4.4 + input.throttle * 18;
    this.engine.frequency.setTargetAtTime(rpm, t, 0.08);
    this.lowEngine.frequency.setTargetAtTime(rpm * 0.5, t, 0.08);
    this.filter.frequency.setTargetAtTime(175 + speed * 10 + input.throttle * 210, t, 0.15);
    this.engineGain.gain.setTargetAtTime(running ? 0.08 + input.throttle * 0.055 : 0, t, 0.12);
    this.windGain.gain.setTargetAtTime(running ? Math.min(0.09, speed * 0.002) + (state.offRoad ? 0.035 : 0) : 0, t, 0.15);
    if (state.collision && t - this.lastCollision > 0.5) { this.lastCollision = t; this.beep(65, 0.15, 'triangle', 0.5); }
  }
  beep(frequency = 660, duration = 0.12, type = 'sine', volume = 0.17) {
    if (!this.context) return;
    const ctx = this.context, osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain); gain.connect(this.master); osc.start(); osc.stop(ctx.currentTime + duration);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.setTargetAtTime(muted ? 0 : 0.23, this.context.currentTime, 0.04);
  }
  dispose() {
    if (!this.context) return;
    this.engine.stop(); this.lowEngine.stop(); this.wind.stop(); this.context.close(); this.context = null;
  }
}
