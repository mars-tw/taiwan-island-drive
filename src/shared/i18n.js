// R50: one Chinese/English switch for the whole academy.
// The Chinese source sentence is the key. In Chinese mode t() returns it unchanged, so the
// Chinese game never changes; English comes from the dictionaries below. How to use it:
// docs/i18n/README.md. Fixed English words: docs/i18n/GLOSSARY.md.
import EN_CORE from './i18n/en-core.js';
import EN_MATH from './i18n/en-math.js';
import EN_PUZZLES from './i18n/en-puzzles.js';
import EN_CAR from './i18n/en-car.js';
import EN_TRAIN from './i18n/en-train.js';
import EN_FLIGHT from './i18n/en-flight.js';
import EN_SCENES from './i18n/en-scenes.js';

export const LANGUAGES = Object.freeze(['zh-Hant', 'en']);
export const DEFAULT_LANGUAGE = 'zh-Hant';
export const LANGUAGE_KEY = 'island-transport:language:v1';
export const LANGUAGE_EVENT = 'academy:languagechange';
/** Native names. The switch always shows both, so nobody is stuck in a language they cannot read. */
export const LANGUAGE_LABELS = Object.freeze({
  'zh-Hant': Object.freeze({ name: '中文', switchTo: '語言：中文。點一下換成 English', settings: '語言／Language' }),
  en: Object.freeze({ name: 'English', switchTo: 'Language: English. Tap for 中文', settings: '語言／Language' }),
});
const LOCALES = Object.freeze({ 'zh-Hant': 'zh-TW', en: 'en-US' });
const SPEECH = Object.freeze({ 'zh-Hant': 'zh-TW', en: 'en-US' });
export const HAN = /[㐀-䶿一-鿿豈-﫿]/;
const PLACEHOLDER = /\{(\w+)\}/g;

// ---------------------------------------------------------------- dictionaries
const dictionaries = { en: new Map() };
const conflicts = [];
const missing = new Set();
let templates = null; // compiled English template keys for loose matching, rebuilt on demand

/** Adds entries ({'中文原句': 'English'}). The first definition of a key wins; a different
 *  second definition is recorded in getTranslationConflicts() and fails the guard test. */
export function addTranslations(lang, entries, origin = 'runtime') {
  const target = dictionaries[normalizeLanguage(lang)];
  if (!target || !entries) return;
  for (const [key, value] of Object.entries(entries)) {
    if (target.has(key)) { if (JSON.stringify(target.get(key).value) !== JSON.stringify(value)) conflicts.push({ key, kept: target.get(key).origin, ignored: origin }); continue; }
    target.set(key, { value, origin });
  }
  templates = null;
}
for (const [origin, entries] of Object.entries({ core: EN_CORE, math: EN_MATH, puzzles: EN_PUZZLES, car: EN_CAR, train: EN_TRAIN, flight: EN_FLIGHT, scenes: EN_SCENES })) addTranslations('en', entries, origin);
export const getTranslationConflicts = () => conflicts.map(item => ({ ...item }));
export const hasTranslation = (key, lang = 'en') => dictionaries[normalizeLanguage(lang)]?.has(key) === true;
export const translationKeys = (lang = 'en') => [...(dictionaries[normalizeLanguage(lang)]?.keys() || [])];
/** English keys asked for but not found since the page opened (also a quick debugging aid). */
export const getMissingTranslations = () => [...missing];

// ---------------------------------------------------------------- language state
export function normalizeLanguage(value) {
  const text = String(value || '').trim().toLowerCase().replaceAll('_', '-');
  if (text === 'en' || text.startsWith('en-')) return 'en';
  if (text === 'zh' || text.startsWith('zh-')) return DEFAULT_LANGUAGE;
  return null;
}
/** First launch: an English device gets English, everything else Traditional Chinese. */
export function detectLanguage(languages = []) {
  const first = Array.isArray(languages) ? languages.find(Boolean) : languages;
  return normalizeLanguage(first) === 'en' ? 'en' : DEFAULT_LANGUAGE;
}
function browserStorage() { try { return globalThis.localStorage ?? null; } catch { return null; } }
function deviceLanguages() { const nav = globalThis.navigator; return nav?.languages?.length ? [...nav.languages] : [nav?.language]; }
/** A saved choice wins; nothing saved means "ask the device"; an unreadable or strange save is Chinese. */
export function resolveStartLanguage({ store = browserStorage(), languages = deviceLanguages() } = {}) {
  if (!store) return DEFAULT_LANGUAGE;
  let saved;
  try { saved = store.getItem(LANGUAGE_KEY); } catch { return DEFAULT_LANGUAGE; }
  if (saved === null || saved === undefined) return detectLanguage(languages);
  return LANGUAGES.includes(saved) ? saved : DEFAULT_LANGUAGE;
}

const hasDocument = () => typeof document !== 'undefined' && !!document.documentElement;
// Node tests have no document: they start in Chinese unless they call initLanguage().
let current = hasDocument() ? resolveStartLanguage() : DEFAULT_LANGUAGE;
const listeners = new Set();
export const getLanguage = () => current;
export const isEnglish = () => current === 'en';
export const getLocale = (lang = current) => LOCALES[normalizeLanguage(lang) || DEFAULT_LANGUAGE];
/** Re-reads the saved choice (or the device) — used at startup and by tests. */
export function initLanguage(options) { current = resolveStartLanguage(options); return current; }
/** Saves the family's choice, updates the page and tells every open screen to redraw. */
export function setLanguage(value, { persist = true, store = browserStorage() } = {}) {
  const next = normalizeLanguage(value);
  if (!next) return current;
  if (persist) try { store?.setItem(LANGUAGE_KEY, next); } catch { /* Private mode still switches for this visit. */ }
  if (next === current) return current;
  current = next;
  applyLanguage();
  for (const listener of [...listeners]) try { listener(current); } catch (error) { console.error(error); }
  if (hasDocument()) document.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: { language: current } }));
  return current;
}
export const toggleLanguage = () => setLanguage(current === 'en' ? DEFAULT_LANGUAGE : 'en');
/** Calls fn(language) after every switch. Returns an unsubscribe function. */
export function onLanguageChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
/** Native builds keep a copy in app preferences; restore it only when the web copy is gone. */
export function restoreLanguageIfMissing(value, store = browserStorage()) {
  try { if (store?.getItem(LANGUAGE_KEY) !== null) return; } catch { return; }
  const next = normalizeLanguage(value?.language);
  if (next) setLanguage(next, { store });
}

// ---------------------------------------------------------------- translate
function interpolate(template, params) {
  if (!params) return template;
  return template.replace(PLACEHOLDER, (whole, name) => Object.hasOwn(params, name) && params[name] !== undefined && params[name] !== null ? String(params[name]) : whole);
}
function resolveEntry(value, params) {
  if (typeof value === 'function') return String(value(params || {}));
  if (value && typeof value === 'object') {
    const count = Number(params?.n ?? params?.count);
    const form = new Intl.PluralRules('en-US').select(Number.isFinite(count) ? count : 0);
    return value[form] ?? value.other ?? '';
  }
  return String(value);
}
/** t('第 {n} 章', {n: 2}). Chinese mode: the key itself (with values filled in). English mode:
 *  the dictionary entry — a string, {one, other} for plurals (uses n or count), or fn(params).
 *  A missing English entry falls back to the Chinese, so nothing ever shows blank. */
export function t(source, params) {
  const key = String(source ?? '');
  if (current !== 'en') return interpolate(key, params);
  const entry = dictionaries.en.get(key);
  if (!entry) { if (HAN.test(key)) missing.add(key); return interpolate(key, params); }
  return interpolate(resolveEntry(entry.value, params), params);
}
/** Lists: 「汽車、火車」 in Chinese, "Car, Train" in English. */
export const joinList = items => items.join(current === 'en' ? ', ' : '、');

function compiledTemplates() {
  if (templates) return templates;
  templates = [];
  for (const key of dictionaries.en.keys()) {
    if (!key.includes('{')) continue;
    const names = [];
    const pattern = key.split(/(\{\w+\})/).map(part => { const m = /^\{(\w+)\}$/.exec(part); if (m) { names.push(m[1]); return '(.+?)'; } return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('');
    if (names.length && HAN.test(key.replace(PLACEHOLDER, ''))) templates.push({ key, names, regex: new RegExp(`^${pattern}$`, 's') });
  }
  return templates;
}
/** Translates finished Chinese text (used for static page text): an exact key first, then a
 *  key with {placeholders} whose fixed parts match. Values that are Chinese are translated too. */
export function translateText(text) {
  const raw = String(text ?? '');
  if (current !== 'en' || !HAN.test(raw)) return raw;
  const lead = /^\s*/.exec(raw)[0], tail = /\s*$/.exec(raw.slice(lead.length))[0];
  const body = raw.slice(lead.length, raw.length - tail.length);
  if (dictionaries.en.has(body)) return lead + t(body) + tail;
  for (const { key, names, regex } of compiledTemplates()) {
    const match = regex.exec(body);
    if (!match) continue;
    const params = {};
    names.forEach((name, index) => { const value = match[index + 1]; params[name] = HAN.test(value) ? translateText(value) : value; });
    return lead + t(key, params) + tail;
  }
  missing.add(body);
  return raw;
}

// ---------------------------------------------------------------- formatting
export function formatNumber(value, options) { try { return new Intl.NumberFormat(getLocale(), options).format(value); } catch { return String(value); } }
export function formatDate(date, options = { year: 'numeric', month: 'long', day: 'numeric' }) { try { return new Intl.DateTimeFormat(getLocale(), options).format(date); } catch { return String(date); } }
export function formatTime(date, options = { hour: 'numeric', minute: '2-digit' }) { try { return new Intl.DateTimeFormat(getLocale(), options).format(date); } catch { return String(date); } }
/** 75 → 「1 分 15 秒」 / "1 min 15 sec"; under a minute only the seconds. */
export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0)), m = Math.floor(seconds / 60), s = seconds % 60;
  if (current === 'en') return m ? `${m} min ${s} sec` : `${s} sec`;
  return m ? `${m} 分 ${s} 秒` : `${s} 秒`;
}

// ---------------------------------------------------------------- speech
export const speechLanguage = (lang = current) => SPEECH[normalizeLanguage(lang) || DEFAULT_LANGUAGE];
/** The voice language for one sentence. Chinese text is never read by an English voice; English
 *  text in English mode is read in English even when an older caller still passes lang:'zh-TW'. */
export function resolveSpeechLanguage(text, requested, language = current) {
  const hasHan = HAN.test(String(text ?? ''));
  const wanted = requested || speechLanguage(language);
  if (hasHan) return /^zh/i.test(wanted) ? wanted : SPEECH[DEFAULT_LANGUAGE];
  if (/^zh/i.test(wanted) && normalizeLanguage(language) === 'en') return SPEECH.en;
  return wanted;
}

// ---------------------------------------------------------------- page text
const ATTRIBUTES = Object.freeze(['aria-label', 'alt', 'title', 'placeholder']);
const MARKED = ['[data-i18n]', ...ATTRIBUTES.map(name => `[data-i18n-${name}]`)].join(',');
const textRecords = new WeakMap(), attributeRecords = new WeakMap();
const boundRoots = new Set();
const pageSource = { captured: false, lang: '', title: '', description: '' };

function readParams(element) { try { const raw = element.getAttribute('data-i18n-params'); return raw ? JSON.parse(raw) : undefined; } catch { return undefined; } }
/** Puts translated text on an element and remembers the key on the element itself, so copies
 *  made with cloneNode() keep switching language too. */
export function setText(element, key, params) {
  if (!element) return element;
  element.setAttribute('data-i18n', key);
  if (params) element.setAttribute('data-i18n-params', JSON.stringify(params)); else element.removeAttribute('data-i18n-params');
  element.textContent = t(key, params);
  return element;
}
/** Same as setText for one attribute: setAttr(button, 'aria-label', '關閉').
 *  (Keys stored on elements cannot take {params}; redraw such labels yourself on onLanguageChange.) */
export function setAttr(element, name, key) {
  if (!element) return element;
  element.setAttribute(`data-i18n-${name}`, key);
  element.setAttribute(name, t(key));
  return element;
}
function applyMarked(element) {
  if (element.hasAttribute('data-i18n')) { const text = t(element.getAttribute('data-i18n'), readParams(element)); if (element.textContent !== text) element.textContent = text; }
  for (const name of ATTRIBUTES) { const key = element.getAttribute(`data-i18n-${name}`); if (key !== null) { const text = t(key); if (element.getAttribute(name) !== text) element.setAttribute(name, text); } }
}
function localizeValue(record, value, write) {
  // A value changed by the page itself since our last write becomes the new source.
  if (!record.has || value !== record.applied) { if (!HAN.test(value || '')) { record.has = false; return; } record.source = value; record.has = true; }
  const out = translateText(record.source);
  if (out !== value) write(out);
  record.applied = out;
}
function skip(element) { return element.getAttribute?.('translate') === 'no' || element.hasAttribute?.('data-i18n-skip') || ['SCRIPT', 'STYLE', 'TEMPLATE', 'CANVAS', 'SVG', 'svg'].includes(element.tagName); }
function walk(node) {
  if (node.nodeType === 3) {
    let record = textRecords.get(node); if (!record) { record = {}; textRecords.set(node, record); }
    localizeValue(record, node.nodeValue, out => { node.nodeValue = out; });
    return;
  }
  if (node.nodeType !== 1 || skip(node)) return;
  if (node.hasAttribute('data-i18n') || ATTRIBUTES.some(name => node.hasAttribute(`data-i18n-${name}`))) applyMarked(node);
  let records = attributeRecords.get(node);
  for (const name of ATTRIBUTES) {
    if (node.hasAttribute(`data-i18n-${name}`) || !node.hasAttribute(name)) continue;
    if (!records) { records = {}; attributeRecords.set(node, records); }
    const record = records[name] || (records[name] = {});
    localizeValue(record, node.getAttribute(name), out => node.setAttribute(name, out));
  }
  if (node.hasAttribute('data-i18n')) return; // its text is owned by the key
  for (const child of [...node.childNodes]) walk(child);
}
/** One-off: translates the static Chinese text under root (text, aria-label, alt, title, placeholder). */
export function localize(root) { if (root) walk(root); return root; }
/** Keeps root translated: now and after every switch. For HTML written in the page or in an
 *  innerHTML template. Text that the page later changes by itself is picked up again. */
export function bindLocalized(root) { if (!root) return () => {}; boundRoots.add(root); walk(root); return () => boundRoots.delete(root); }

function capturePage() {
  if (pageSource.captured || !hasDocument()) return;
  pageSource.captured = true;
  pageSource.lang = document.documentElement.getAttribute('lang') || 'zh-Hant';
  pageSource.title = document.title;
  pageSource.description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
}
/** Updates <html lang>, <title>, the meta description and every marked/bound element. Chinese
 *  restores the page's own original values exactly. */
export function applyLanguage() {
  if (!hasDocument()) return;
  capturePage();
  const english = current === 'en';
  document.documentElement.setAttribute('lang', english ? 'en' : pageSource.lang);
  const title = english ? translateText(pageSource.title) : pageSource.title;
  if (document.title !== title) document.title = title;
  const meta = document.querySelector('meta[name="description"]');
  if (meta && pageSource.description) meta.setAttribute('content', english ? translateText(pageSource.description) : pageSource.description);
  for (const element of document.querySelectorAll(MARKED)) applyMarked(element);
  for (const root of boundRoots) walk(root);
}

if (hasDocument() && typeof window !== 'undefined') {
  // Another tab or page of the academy switched: follow it without saving again.
  window.addEventListener('storage', event => { if (event.key === LANGUAGE_KEY) setLanguage(resolveStartLanguage(), { persist: false }); });
}
