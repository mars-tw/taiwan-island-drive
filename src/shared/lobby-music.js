// Optional lobby background music. The track is replaceable: drop a new file at
// LOBBY_TRACK (and credit it in public/CREDITS.md). When the file is missing the
// toggle stays hidden and the lobby works silently.
import { appUrl } from './paths.js';
import { readSettings } from './settings.js';
import { progressStorage } from './student-save.js';

export const LOBBY_TRACK = 'audio/lobby-theme.m4a';
export const MUSIC_PREFERENCE_KEY = 'island-transport:lobby-music:v1';
export const LOBBY_VOLUME = 0.32;

/** Music plays only when sound is on and the family has not switched it off. */
export function shouldPlayMusic({ muted = false, preference = 'on' } = {}) { return !muted && preference !== 'off'; }

/** Dev servers answer missing files with index.html, so require a real audio type. */
export function isAudioResponse(response) { return !!response?.ok && /^audio\//i.test(response.headers?.get?.('content-type') || ''); }

function readPreference() { try { return progressStorage.getItem(MUSIC_PREFERENCE_KEY) === 'off' ? 'off' : 'on'; } catch { return 'on'; } }
function writePreference(value) { try { progressStorage.setItem(MUSIC_PREFERENCE_KEY, value); } catch { /* ignore */ } }

export class LobbyMusic {
  constructor(button) { this.button = button; this.audio = null; this.preference = readPreference(); this.muted = readSettings().muted; this.started = false; }

  async init() {
    if (typeof Audio === 'undefined' || !this.button) return false;
    const url = appUrl(LOBBY_TRACK);
    try { const response = await fetch(url, { method: 'HEAD' }); if (!isAudioResponse(response)) return false; } catch { return false; }
    this.audio = new Audio(url); this.audio.loop = true; this.audio.preload = 'auto'; this.audio.volume = LOBBY_VOLUME;
    this.button.hidden = false; this.sync();
    this.button.addEventListener('click', event => { event.stopPropagation(); this.preference = this.preference === 'off' ? 'on' : 'off'; writePreference(this.preference); this.started = true; this.apply(); });
    const first = () => { if (this.started) return; this.started = true; this.apply(); };
    addEventListener('pointerdown', first, { once: true, passive: true });
    addEventListener('keydown', first, { once: true });
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.audio?.pause(); else this.apply(); });
    addEventListener('pagehide', () => this.audio?.pause());
    return true;
  }
  setMuted(muted) { this.muted = !!muted; this.apply(); }
  apply() {
    this.sync();
    if (!this.audio || !this.started) return;
    if (shouldPlayMusic({ muted: this.muted, preference: this.preference }) && !document.hidden) this.audio.play().catch(() => {});
    else this.audio.pause();
  }
  sync() {
    if (!this.button) return;
    const on = shouldPlayMusic({ muted: this.muted, preference: this.preference });
    this.button.setAttribute('aria-pressed', String(on));
    this.button.setAttribute('aria-label', on ? '關閉大廳音樂' : '播放大廳音樂');
    this.button.textContent = on ? '♪' : '♪̸';
  }
}
