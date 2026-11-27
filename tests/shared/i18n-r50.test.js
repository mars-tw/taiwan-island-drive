// R50 L1：中英文切換的守門測試。
// 1. 字典沒有漏翻（各線新增的 t()、新增的字典檔會自動納入）。
// 2. 中文模式的字和改前一模一樣。
// 3. 語言偵測、記憶、壞存檔退回中文、<html lang> 同步、語音語言、數字與時間格式。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import * as i18n from '../../src/shared/i18n.js';
import { t, setLanguage, getLanguage, translateText, translationKeys, hasTranslation } from '../../src/shared/i18n.js';
import { translationCalls, chineseFragments, htmlFragments, HAN } from '../helpers/i18n-scan.js';
import { SAFETY_STOPS } from '../../src/shared/safety-lesson.js';
import { ACADEMY_CHAPTERS } from '../../src/shared/academy.js';
import { MODE_NAMES } from '../../src/shared/journeys.js';
import { createNativeRuntime, selectLocalVoice } from '../../src/shared/native.js';

const read = path => readFileSync(path, 'utf8');
const sourceFiles = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? sourceFiles(join(dir, entry.name)) : entry.name.endsWith('.js') ? [join(dir, entry.name).replaceAll('\\', '/')] : []);
const english = (fn) => { setLanguage('en', { persist: false }); try { return fn(); } finally { setLanguage('zh-Hant', { persist: false }); } };
const placeholders = text => [...String(text).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();

// 已完整翻譯的範圍：檔內每一段中文都要有英文。L2、L3 翻完自己的檔就加進來。
const FULLY_TRANSLATED = [
  'src/home.js', 'src/shared/bootstrap.js', 'src/shared/parent-gate.js', 'src/shared/safety-ui.js', 'src/shared/safety-lesson.js',
  'src/shared/academy.js', 'src/shared/academy-ui.js', 'src/shared/passport.js', 'src/shared/lobby-music.js', 'src/shared/language-ui.js',
  // L3b: flight + content-r26..r43 (content-r35-scene.js / content-r35-ui.js are SHA256-locked by R38 and localized at runtime via renderR43)
  'src/games/flight/audio.js', 'src/games/flight/child-instructions.js', 'src/games/flight/child-pilot.js', 'src/games/flight/config.js',
  'src/games/flight/flight-plans.js', 'src/games/flight/game.js', 'src/games/flight/instruments.js', 'src/games/flight/main.js',
  'src/games/flight/mission.js', 'src/games/flight/physics.js', 'src/games/flight/rewards.js', 'src/games/flight/scenery.js',
  'src/games/flight/voice.js', 'src/games/flight/world.js',
  'src/shared/content-r26.js', 'src/shared/content-r26-scene.js', 'src/shared/content-r27.js', 'src/shared/content-r27-scene.js',
  'src/shared/content-r28.js', 'src/shared/content-r28-scene.js', 'src/shared/content-r29.js', 'src/shared/content-r29-scene.js',
  'src/shared/content-r30.js', 'src/shared/content-r30-scene.js', 'src/shared/content-r31.js', 'src/shared/content-r31-scene.js',
  'src/shared/content-r32.js', 'src/shared/content-r32-scene.js', 'src/shared/content-r33.js', 'src/shared/content-r33-scene.js',
  'src/shared/content-r35.js', 'src/shared/content-r37-scene.js', 'src/shared/content-r37-ui.js', 'src/shared/content-r39-ui.js',
  'src/shared/content-r40-ui.js', 'src/shared/content-r41-scene.js', 'src/shared/content-r41-ui.js', 'src/shared/content-r42-scene.js',
  'src/shared/content-r42-ui.js', 'src/shared/content-r43-scene.js', 'src/shared/content-r43-ui.js',
];
const HTML_SCOPE = { 'index.html': 'all', 'car/index.html': 'head', 'train/index.html': 'head', 'flight/index.html': 'all' };
// 不給玩家看、或刻意不翻的中文（每一條寫原因）。
const NOT_UI = [
  { file: 'src/shared/academy-ui.js', text: '再看看', why: '比對 dispatch 訊息開頭，用來決定要不要顯示，不會顯示在畫面上' },
  { file: 'src/shared/language-ui.js', text: '中文', why: '語言切換鈕固定顯示中文與 English 兩個名稱（translate="no"）' },
  // L3b internal string matchers / rewriters
  ...['燈塔', '港', '岩', '農', '觀景'].map(text => ({ file: 'src/games/flight/scenery.js', text, why: '比對 flight-plans 中文地標名以決定 3D 建物類型，不顯示在畫面上' })),
  ...['亮起的手，', '看蛋糕歪哪邊，', '快到托盤邊，', '歪得很大，', '推回托盤中央', '慢慢扶回正', '推回中央'].map(text => ({ file: 'src/shared/content-r39-ui.js', text, why: '改寫 R35 中文句子用的內部片段；改寫後的完整句皆已收進 en-scenes.js' })),
  ...['亮起的手，', '看蛋糕歪哪邊，', '亮起的手', '快到托盤邊，', '歪得很大，', '推回托盤中央', '慢慢扶回正', '推回中央'].map(text => ({ file: 'src/shared/content-r41-scene.js', text, why: '改寫 R35 中文句子用的內部片段；改寫後的完整句皆已收進 en-scenes.js' })),
];

test('R50 every dictionary file is loaded by i18n.js and no key has two different translations', () => {
  const core = read('src/shared/i18n.js');
  const files = readdirSync('src/shared/i18n').filter(name => /^en-.+\.js$/.test(name));
  assert.ok(files.includes('en-core.js'));
  for (const name of files) assert.match(core, new RegExp(`from '\\./i18n/${name.replace('.', '\\.')}'`), `${name} must be imported by src/shared/i18n.js`);
  assert.deepEqual(i18n.getTranslationConflicts(), [], 'the same Chinese key must have one English text across all dictionaries');
});

test('R50 every literal t()/setText()/setAttr() key anywhere in src has English', () => {
  const missing = [];
  let count = 0;
  for (const file of sourceFiles('src')) for (const call of translationCalls(read(file))) {
    count++;
    if (HAN.test(call.key) && !hasTranslation(call.key)) missing.push(`${file}:${call.line} ${call.key}`);
  }
  assert.ok(count >= 50, `scanner found ${count} calls`);
  assert.deepEqual(missing, []);
});

test('R50 fully translated files have English for every Chinese string and no Chinese inside ${} templates', () => {
  const missing = [];
  for (const file of FULLY_TRANSLATED) for (const fragment of chineseFragments(read(file))) {
    if (NOT_UI.some(item => item.file === file && item.text === fragment.text)) continue;
    if (fragment.dynamic) missing.push(`${file}:${fragment.line} Chinese inside a \${} template (use t('… {name} …', params)): ${fragment.text}`);
    else if (!hasTranslation(fragment.text)) missing.push(`${file}:${fragment.line} ${fragment.text}`);
  }
  for (const [file, scope] of Object.entries(HTML_SCOPE)) for (const text of htmlFragments(read(file), { scope })) if (!hasTranslation(text)) missing.push(`${file} ${text}`);
  assert.deepEqual(missing, []);
});

test('R50 data shown through t() (safety stops, academy chapters, mode names) has English', () => {
  const keys = [...SAFETY_STOPS.flatMap(stop => [stop.name, stop.rule]), ...ACADEMY_CHAPTERS.flatMap(chapter => [chapter.name, chapter.story]), ...Object.values(MODE_NAMES)];
  assert.deepEqual(keys.filter(key => !hasTranslation(key)), []);
});

test('R50 English entries are real English with the same {placeholders} as the Chinese key', () => {
  const problems = [];
  for (const key of translationKeys('en')) {
    const value = english(() => t(key, Object.fromEntries(placeholders(key).map(name => [name, 1]))));
    if (!value.trim()) problems.push(`${key}: empty`);
    if (HAN.test(value)) problems.push(`${key}: still Chinese → ${value}`);
    if (/[，。！？：；「」]/.test(value)) problems.push(`${key}: full-width punctuation → ${value}`);
    const forms = [];
    for (const n of [1, 2]) forms.push(english(() => t(key, { ...Object.fromEntries(placeholders(key).map(name => [name, `<${name}>`])), n, count: n })));
    for (const form of forms) for (const name of placeholders(key)) if (name !== 'n' && name !== 'count' && !form.includes(`<${name}>`)) problems.push(`${key}: English lost {${name}}`);
  }
  assert.deepEqual(problems, []);
});

test('R50 the glossary labels are used word for word by every dictionary', () => {
  const doc = read('docs/i18n/GLOSSARY.md');
  const block = doc.slice(doc.indexOf('<!-- glossary:labels:start -->'), doc.indexOf('<!-- glossary:labels:end -->'));
  const rows = block.split('\n').map(line => line.split('|').map(cell => cell.trim())).filter(cells => cells.length > 3 && HAN.test(cells[1]));
  assert.ok(rows.length >= 30, 'glossary label table is present');
  for (const [, zh, en] of rows) if (hasTranslation(zh)) assert.equal(english(() => t(zh)), en, `glossary: ${zh}`);
});

test('R50 Chinese mode returns every key unchanged and fills {placeholders} exactly like the old templates', () => {
  assert.equal(getLanguage(), 'zh-Hant');
  for (const key of translationKeys('en')) {
    assert.equal(t(key), key);
    assert.equal(translateText(key), key);
  }
  // 舊程式組字串的寫法 → 新的 t()，中文輸出必須一字不差。
  const s = { index: 1, next: { name: '海風站接朋友' }, passengers: 4 }, total = 12, coastal = 2, n = 3;
  const golden = [
    [t('第 {n} 章：{name}', { n: s.index + 1, name: s.next.name }), `第 ${s.index + 1} 章：${s.next.name}`],
    [t('繼續：{name}', { name: s.next.name }), `繼續：${s.next.name}`],
    [[t('主線學生證 {done}／4 章 · 獨立海岸 {coastal}／3 課', { done: 1, coastal }), t('數學調度章'), t('已保留小小列車長紀錄')].join(' · '), `主線學生證 1／4 章 · 獨立海岸 ${coastal}／3 課 · 數學調度章 · 已保留小小列車長紀錄`],
    [t('{n}／{total} 位朋友上車', { n, total }), `${n}／${total} 位朋友上車`],
    [t('已完成 {n} 班調度；本次尚未儲存。', { n }), `已完成 ${n} 班調度；本次尚未儲存。`],
    [t('收集到 {n} 顆星星', { n: total }), `收集到 ${total} 顆星星`],
    [t('調度 {n} 人', { n: s.passengers }), `調度 ${s.passengers} 人`],
    [t('山海同行任務 · {task}', { task: t('調度單：前車帶走 {n} 人，停穩接朋友。', { n: s.passengers }) }), `山海同行任務 · 調度單：前車帶走 ${s.passengers} 人，停穩接朋友。`],
    [t('{story} 護照 {done}／12 關。', { story: '海風吹來了！', done: 5 }), '海風吹來了！ 護照 5／12 關。'],
    [t('下一章：{name}', { name: '公路送補給' }), '下一章：公路送補給'],
    [[t('{done}／12 關 · {stars}／36 顆評等星', { done: 4, stars: 9 }), i18n.joinList(['汽車', '火車'].map(mode => t('{mode}章', { mode: t(mode) })))].join(' · '), '4／12 關 · 9／36 顆評等星 · 汽車章、火車章'],
    [t('先完成第 {n} 關', { n: 2 }), '先完成第 2 關'],
    [t('{status}。各課共用星星與本機進度。', { status: [t('山海同行 {n}／4 章', { n: 2 }), t('數學調度章已取得'), t('山海同行章已取得')].join(' · ') }), '山海同行 2／4 章 · 數學調度章已取得 · 山海同行章已取得。各課共用星星與本機進度。'],
    [t('{left} ＋ {right} ＝ ？', { left: 51, right: 77 }), 51 + ' ＋ ' + 77 + ' ＝ ？'],
    [t('接著觀察：第 {n} 站', { n: 2 }), '接著觀察：第 2 站'],
    [t('第 {n} 站／共 3 站', { n: 3 }), '第 3 站／共 3 站'],
    [t('移動速度 {speed} · {state}', { speed: 12, state: t('車門關閉') }), '移動速度 12 · 車門關閉'],
    [t('小小學員 · {n} 星', { n: '7' }), '小小學員 · 7 星'],
  ];
  for (const [now, before] of golden) assert.equal(now, before);
});

// A very small DOM, enough for the page-text helpers.
class FakeText { constructor(value) { this.nodeType = 3; this.nodeValue = value; } }
class FakeElement {
  constructor(tag, attributes = {}, children = []) { this.nodeType = 1; this.tagName = tag.toUpperCase(); this.attributes = new Map(Object.entries(attributes)); this.childNodes = children.map(child => typeof child === 'string' ? new FakeText(child) : child); }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  hasAttribute(name) { return this.attributes.has(name); }
  get textContent() { return this.childNodes.map(node => node.nodeType === 3 ? node.nodeValue : node.textContent).join(''); }
  set textContent(value) { this.childNodes = [new FakeText(value)]; }
  *all() { yield this; for (const child of this.childNodes) if (child.nodeType === 1) yield* child.all(); }
  snapshot() { return [this.tagName, Object.fromEntries(this.attributes), ...this.childNodes.map(node => node.nodeType === 3 ? node.nodeValue : node.snapshot())]; }
}
function fakePage() {
  const meta = new FakeElement('meta', { name: 'description', content: '島嶼交通學院：先停穩、看清楚、再出發。列車數學、停站接客、公路補給與空中找路，在同一張學生證接續。' });
  const html = new FakeElement('html', { lang: 'zh-Hant-TW' });
  const body = new FakeElement('main', {}, [
    new FakeElement('p', { class: 'card' }, ['學著鬆油門、轉彎，', new FakeElement('br'), '沿海岸找星星。']),
    new FakeElement('button', { 'aria-label': '開汽車' }, [' 出發上路 ']),
    new FakeElement('img', { alt: '藍色列車插畫' }),
    new FakeElement('span', { translate: 'no' }, ['中文']),
    new FakeElement('strong', {}, ['收集到 3 顆星星']),
  ]);
  const nav = new FakeElement('nav', {}, [new FakeElement('a', {}, [new FakeElement('span', {}, [])])]);
  const doc = { documentElement: html, title: '島嶼交通學院｜汽車・火車・飛機', querySelector: selector => selector.startsWith('meta') ? meta : null, querySelectorAll: () => [...nav.all(), ...body.all()].filter(el => [...el.attributes.keys()].some(name => name.startsWith('data-i18n') && name !== 'data-i18n-params')), dispatchEvent() {} };
  return { doc, meta, html, body, nav };
}

test('R50 page text: English in place, then Chinese restored exactly (text, attributes, <html lang>, title, description, cloned labels)', () => {
  const { doc, meta, html, body, nav } = fakePage();
  globalThis.document = doc;
  try {
    const before = JSON.stringify([body.snapshot(), html.snapshot(), meta.snapshot(), doc.title]);
    i18n.applyLanguage();
    i18n.bindLocalized(body);
    i18n.setText(nav.childNodes[0].childNodes[0], '回學院');
    assert.equal(JSON.stringify([body.snapshot(), html.snapshot(), meta.snapshot(), doc.title]), before, 'Chinese mode touches nothing');
    const copy = new FakeElement('span', { 'data-i18n': '回學院' }, ['回學院']); // what cloneNode() of the nav label gives
    nav.childNodes.push(copy);
    let heard = null;
    const stop = i18n.onLanguageChange(language => { heard = language; });
    setLanguage('en', { persist: false });
    assert.equal(heard, 'en');
    assert.equal(html.getAttribute('lang'), 'en');
    assert.equal(doc.title, 'Island Transport Academy | Car · Train · Plane');
    assert.match(meta.getAttribute('content'), /^Island Transport Academy: stop, look, then go\./);
    assert.deepEqual(body.childNodes[0].childNodes.map(node => node.nodeValue ?? node.tagName), ['Slow down and turn,', 'BR', 'find stars by the sea.']);
    assert.equal(body.childNodes[1].textContent, " Let's drive ", 'surrounding spaces are kept');
    assert.equal(body.childNodes[1].getAttribute('aria-label'), 'Drive a Car');
    assert.equal(body.childNodes[2].getAttribute('alt'), 'Blue train');
    assert.equal(body.childNodes[3].textContent, '中文', 'translate="no" is left alone');
    assert.equal(body.childNodes[4].textContent, '3 stars collected', 'finished sentences match {placeholder} keys');
    assert.equal(nav.childNodes[0].childNodes[0].textContent, 'Home');
    assert.equal(copy.textContent, 'Home', 'a cloned label switches too');
    // The page changes a text by itself while in English: it becomes the new source.
    body.childNodes[1].childNodes[0].nodeValue = '準備出發';
    i18n.localize(body);
    assert.equal(body.childNodes[1].textContent, 'Get ready');
    body.childNodes[1].childNodes[0].nodeValue = ' 出發上路 ';
    setLanguage('zh-Hant', { persist: false });
    assert.equal(JSON.stringify([body.snapshot(), html.snapshot(), meta.snapshot(), doc.title]), before, 'back in Chinese, every text and attribute is the original');
    assert.equal(copy.textContent, '回學院');
    assert.equal(heard, 'zh-Hant');
    stop(); heard = null;
    setLanguage('en', { persist: false }); setLanguage('zh-Hant', { persist: false });
    assert.equal(heard, null, 'unsubscribed listeners stay quiet');
  } finally { delete globalThis.document; setLanguage('zh-Hant', { persist: false }); }
});

const memoryStore = (initial = {}) => { const map = new Map(Object.entries(initial)); return { map, getItem: key => map.has(key) ? map.get(key) : null, setItem: (key, value) => map.set(key, String(value)) }; };

test('R50 first launch follows the device: English devices get English, every other device Traditional Chinese', () => {
  for (const [languages, expected] of [[['en-US'], 'en'], [['en-GB', 'zh-TW'], 'en'], [['en'], 'en'], [['zh-TW', 'en-US'], 'zh-Hant'], [['zh-CN'], 'zh-Hant'], [['ja-JP', 'en-US'], 'zh-Hant'], [[], 'zh-Hant'], [[undefined], 'zh-Hant']]) {
    assert.equal(i18n.detectLanguage(languages), expected, JSON.stringify(languages));
    assert.equal(i18n.resolveStartLanguage({ store: memoryStore(), languages }), expected);
  }
});

test('R50 the family choice is remembered and wins over the device language', () => {
  const store = memoryStore();
  assert.equal(setLanguage('en', { store }), 'en');
  assert.equal(store.map.get(i18n.LANGUAGE_KEY), 'en');
  assert.equal(i18n.resolveStartLanguage({ store, languages: ['zh-TW'] }), 'en');
  setLanguage('zh-Hant', { store });
  assert.equal(i18n.resolveStartLanguage({ store, languages: ['en-US'] }), 'zh-Hant', 'an English device keeps a saved Chinese choice');
  assert.equal(i18n.initLanguage({ store, languages: ['en-US'] }), 'zh-Hant');
  assert.equal(setLanguage('fr'), 'zh-Hant', 'unknown languages are ignored');
});

test('R50 broken saves quietly fall back to Chinese, and a failing save still switches for this visit', () => {
  const throwing = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  assert.equal(i18n.resolveStartLanguage({ store: throwing, languages: ['en-US'] }), 'zh-Hant');
  assert.equal(i18n.resolveStartLanguage({ store: null, languages: ['en-US'] }), 'zh-Hant');
  for (const bad of ['english', '{"language":"en"}', '', 'EN ', 'ja']) assert.equal(i18n.resolveStartLanguage({ store: memoryStore({ [i18n.LANGUAGE_KEY]: bad }), languages: ['en-US'] }), 'zh-Hant', bad);
  assert.doesNotThrow(() => setLanguage('en', { store: throwing }));
  assert.equal(getLanguage(), 'en');
  setLanguage('zh-Hant', { persist: false });
  // Native app preferences only fill in a missing web copy.
  const store = memoryStore({ [i18n.LANGUAGE_KEY]: 'zh-Hant' });
  i18n.restoreLanguageIfMissing({ language: 'en' }, store);
  assert.equal(getLanguage(), 'zh-Hant');
  const empty = memoryStore();
  i18n.restoreLanguageIfMissing({ language: 'en' }, empty);
  assert.equal(getLanguage(), 'en'); assert.equal(empty.map.get(i18n.LANGUAGE_KEY), 'en');
  setLanguage('zh-Hant', { persist: false });
});

test('R50 English plurals, missing keys and loose matching', () => {
  english(() => {
    assert.equal(t('收集到 {n} 顆星星', { n: 1 }), '1 star collected');
    assert.equal(t('收集到 {n} 顆星星', { n: 0 }), '0 stars collected');
    assert.equal(t('第 {n} 章：{name}', { n: 2, name: t('海風站接朋友') }), 'Chapter 2: Pick Up Friends at Sea Breeze');
    assert.equal(translateText('第 3 章：公路送補給'), 'Chapter 3: Road Supply Run');
    assert.equal(t('這句沒有英文'), '這句沒有英文', 'a missing entry falls back to Chinese, never blank');
    assert.ok(i18n.getMissingTranslations().includes('這句沒有英文'));
    assert.equal(i18n.joinList(['Car', 'Train']), 'Car, Train');
  });
  assert.equal(i18n.joinList(['汽車', '火車']), '汽車、火車');
});

test('R50 numbers, dates and durations follow the language', () => {
  const day = new Date(2026, 10, 24, 15, 5);
  assert.equal(i18n.formatNumber(1234.5), '1,234.5');
  assert.match(i18n.formatDate(day), /2026年11月24日/);
  assert.match(i18n.formatTime(day), /3:05/);
  assert.equal(i18n.formatDuration(75), '1 分 15 秒');
  assert.equal(i18n.formatDuration(9), '9 秒');
  english(() => {
    assert.equal(i18n.getLocale(), 'en-US');
    assert.equal(i18n.formatNumber(1234.5), '1,234.5');
    assert.equal(i18n.formatDate(day), 'November 24, 2026');
    assert.match(i18n.formatTime(day), /^3:05\sPM$/);
    assert.equal(i18n.formatDuration(75), '1 min 15 sec');
  });
});

test('R50 speech language follows the chosen language and never reads Chinese with an English voice', () => {
  assert.equal(i18n.speechLanguage(), 'zh-TW');
  assert.equal(i18n.resolveSpeechLanguage('開門接客'), 'zh-TW');
  assert.equal(i18n.resolveSpeechLanguage('Open doors', undefined, 'en'), 'en-US');
  assert.equal(i18n.resolveSpeechLanguage('開門接客', undefined, 'en'), 'zh-TW', 'untranslated Chinese is still read in Chinese');
  assert.equal(i18n.resolveSpeechLanguage('Open doors', 'zh-TW', 'en'), 'en-US', 'older callers that still pass zh-TW get English for English text');
  assert.equal(i18n.resolveSpeechLanguage('開門接客', 'zh-TW', 'en'), 'zh-TW');
  assert.equal(i18n.resolveSpeechLanguage('OK', 'zh-TW', 'zh-Hant'), 'zh-TW', 'Chinese mode is unchanged');
  const voice = (lang, localService = true) => ({ lang, localService, name: lang });
  assert.equal(selectLocalVoice([voice('en-GB'), voice('en-US'), voice('zh-TW')], 'en-US').index, 1);
  assert.equal(selectLocalVoice([voice('en_AU'), voice('zh-TW')], 'en-US').index, 0);
  assert.equal(selectLocalVoice([voice('en-US', false), voice('zh-TW')], 'en-US'), null, 'network voices are never used');
  assert.equal(selectLocalVoice([voice('zh-CN'), voice('zh-TW')], 'zh-TW').index, 1);
});

const nativeHost = () => ({ Capacitor: { isNativePlatform: () => true, getPlatform: () => 'ios' }, document: { body: { dataset: {} }, querySelectorAll: () => [], addEventListener() {} }, location: { assign() {} }, speechSynthesis: { cancel() {} } });
test('R50 native speech uses an English voice in English and stays quiet without one', async () => {
  let spoken = null;
  const voices = list => async () => ({ getSupportedVoices: async () => ({ voices: list }), isLanguageSupported: async () => ({ supported: true }), speak: async options => { spoken = options; } });
  const englishRuntime = createNativeRuntime({ host: nativeHost(), language: () => 'en', loadPlugin: voices([{ lang: 'zh-TW', localService: true }, { lang: 'en-US', localService: true }]) });
  assert.equal((await englishRuntime.speak('Hold the brake')).spoken, true);
  assert.equal(spoken.lang, 'en-US'); assert.equal(spoken.voice, 1);
  spoken = null;
  const noEnglish = createNativeRuntime({ host: nativeHost(), language: () => 'en', loadPlugin: voices([{ lang: 'zh-TW', localService: true }]) });
  const result = await noEnglish.speak('Hold the brake');
  assert.deepEqual([result.spoken, result.reason, spoken, noEnglish.getStatus().speech], [false, 'no-local-voice', null, 'text-only']);
  assert.equal((await noEnglish.speak('按住煞車')).spoken, true, 'Chinese text still uses the Chinese voice');
  assert.equal(spoken.lang, 'zh-TW');
});

test('R50 browser speech: English voice when there is one, silence (no error) when the device has none', async () => {
  const browserHost = list => { const host = { document: { body: { dataset: {} }, querySelectorAll: () => [] }, said: [] }; host.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } }; host.speechSynthesis = { cancel() {}, getVoices: () => list, speak: u => host.said.push(u) }; return host; };
  const withEnglish = browserHost([{ lang: 'zh-TW' }, { lang: 'en-US', name: 'Samantha' }]);
  assert.equal((await createNativeRuntime({ host: withEnglish, language: () => 'en' }).speak('Wait')).spoken, true);
  assert.deepEqual([withEnglish.said[0].lang, withEnglish.said[0].voice.name], ['en-US', 'Samantha']);
  const chineseOnly = browserHost([{ lang: 'zh-TW' }]);
  const quiet = await createNativeRuntime({ host: chineseOnly, language: () => 'en' }).speak('Wait');
  assert.deepEqual([quiet.spoken, quiet.reason, chineseOnly.said.length], [false, 'no-voice-for-language', 0]);
  const chinese = browserHost([{ lang: 'zh-TW' }]);
  await createNativeRuntime({ host: chinese }).speak('等一等');
  assert.equal(chinese.said[0].lang, 'zh-TW', 'Chinese mode keeps the old browser voice choice');
});

test('R50 the switch is on the home page and in Parent Settings, child-sized, and never clears progress', () => {
  const home = read('src/home.js'), ui = read('src/shared/language-ui.js'), css = read('src/shared/language.css'), boot = read('src/shared/bootstrap.js');
  assert.match(home, /document\.querySelector\('\.home-header \.header-tools'\)\.before\(createLanguageToggle\(\)\)/);
  assert.match(home, /\$\('family-title'\)\.after\(createLanguageSetting\(\)\)/);
  assert.match(css, /\.language-toggle\{[^}]*min-width:60px;min-height:60px/);
  assert.match(css, /\.language-choice button\{min-width:60px;min-height:60px/);
  assert.match(ui, /toggleLanguage\(\)/);
  assert.doesNotMatch(ui + home, /location\.reload|removeItem\(|saveStudent|updateStudentSection/, 'switching only redraws text');
  assert.match(boot, /applyLanguage\(\);/, 'every page syncs <html lang>, title and description');
  assert.match(boot, /syncNativePreferences\(\{key:LANGUAGE_KEY/, 'the native app keeps a copy of the choice');
});
