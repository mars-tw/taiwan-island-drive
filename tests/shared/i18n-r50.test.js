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
import { JOURNEYS } from '../../src/shared/journeys.js';
import { MAPS, VEHICLES as CAR_VEHICLES } from '../../src/games/car/config.js';
import { ROUTES, LESSONS, VEHICLES as TRAIN_VEHICLES } from '../../src/games/train/config.js';
import { fill, tx } from '../../src/shared/content-text.js';
import { CONTENT_LESSONS, CAKE_ROUTES, TICKETS, ContentLesson as CoastLessonR1 } from '../../src/shared/content-r1.js';
import { FRIEND_NAMES, PASSENGER_NAMES } from '../../src/shared/content-r15.js';
import { ContentLesson as CoastLesson } from '../../src/shared/content-r24.js';
import * as coastScene from '../../src/shared/content-r25-scene.js';
import { TICKET_STATIONS } from '../../src/shared/content-r22-scene.js';
import { lessonFacts } from '../../src/shared/content-r5-feedback.js';
import { cakeTask, sideWatch } from '../../src/shared/content-r4-scene.js';
import { ticketHint } from '../../src/shared/content-r11-scene.js';

const read = path => readFileSync(path, 'utf8');
const sourceFiles = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? sourceFiles(join(dir, entry.name)) : entry.name.endsWith('.js') ? [join(dir, entry.name).replaceAll('\\', '/')] : []);
const english = (fn) => { setLanguage('en', { persist: false }); try { return fn(); } finally { setLanguage('zh-Hant', { persist: false }); } };
const placeholders = text => [...String(text).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();

// 已完整翻譯的範圍：檔內每一段中文都要有英文。L2、L3 翻完自己的檔就加進來。
const FULLY_TRANSLATED = [
  'src/home.js', 'src/shared/bootstrap.js', 'src/shared/parent-gate.js', 'src/shared/safety-ui.js', 'src/shared/safety-lesson.js',
  'src/shared/academy.js', 'src/shared/academy-ui.js', 'src/shared/passport.js', 'src/shared/lobby-music.js', 'src/shared/language-ui.js',
  // L3a: Car Class, Train Class, Coast Practice and scene rounds r2–r25.
  ...['audio', 'collectibles', 'config', 'game', 'main', 'physics', 'tilt', 'world'].map(name => `src/games/car/${name}.js`),
  ...['audio', 'config', 'game', 'main', 'physics', 'rewards', 'world'].map(name => `src/games/train/${name}.js`),
  'src/shared/journeys.js', 'src/shared/child-display.js', 'src/shared/content-text.js', 'src/shared/content-r1.js', 'src/shared/content-r1-ui.js',
  ...readdirSync('src/shared').filter(name => { const m = /^content-r(\d+)(?:-scene|-ui|-feedback)?\.js$/.exec(name); return m && +m[1] >= 2 && +m[1] <= 25; }).map(name => `src/shared/${name}`),
];
const HTML_SCOPE = { 'index.html': 'all', 'car/index.html': 'all', 'train/index.html': 'all', 'flight/index.html': 'head' };
// 不給玩家看、或刻意不翻的中文（每一條寫原因）。
const NOT_UI = [
  { file: 'src/shared/academy-ui.js', text: '再看看', why: '比對 dispatch 訊息開頭，用來決定要不要顯示，不會顯示在畫面上' },
  { file: 'src/shared/language-ui.js', text: '中文', why: '語言切換鈕固定顯示中文與 English 兩個名稱（translate="no"）' },
  { file: 'src/games/car/game.js', text: '顯示連線中斷，請重新整理遊戲。', why: 'Error 訊息只印到 console；畫面上的提示是 main.js 另一句已翻好的句子' },
  { file: 'src/games/train/main.js', text: '站', why: '接在站名後組成完整站名（藍灣站）再整句 t()，單獨不會顯示' },
  { file: 'src/games/train/world.js', text: '站', why: '同上：3D 站牌把站名接成完整站名後才翻' },
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

test('R50 L3a data shown through t() (trips, car and train choices, Coast Practice names) has English', () => {
  const colors = ['藍', '橘', '綠'], shapes = ['圓形', '三角形', '正方形'];
  const keys = [
    ...JOURNEYS.flatMap(journey => [journey.name, journey.goal, journey.tip, journey.story]),
    ...MAPS.flatMap(map => [map.name, map.tag, map.difficulty, map.description]), ...CAR_VEHICLES.flatMap(vehicle => [vehicle.name, vehicle.category]),
    ...Object.values(ROUTES).flatMap(route => [route.name, route.tag, ...route.stationNames.map(name => name + '站')]), '起點站', '終點站',
    ...Object.values(LESSONS).flatMap(lesson => [lesson.name, lesson.short, lesson.description]), ...Object.values(TRAIN_VEHICLES).flatMap(vehicle => [vehicle.name, vehicle.description]),
    ...Object.values(CONTENT_LESSONS), ...CAKE_ROUTES, ...TICKETS.map(ticket => ticket.name), ...colors.flatMap(color => shapes.map(shape => color + shape)),
    ...Object.values(FRIEND_NAMES), ...PASSENGER_NAMES, ...TICKET_STATIONS, ...Object.values(coastScene.STOP_RULES).flat(),
  ];
  assert.deepEqual(keys.filter(key => !hasTranslation(key)), []);
});

test('R50 L3a Coast Practice: every sentence the lessons build (r1–r25) translates in full', () => {
  // Lesson modules keep Chinese sentences (later rounds compare and rewrite them); the screen
  // translates the finished sentence with tx(). Drive the lessons through many states and check.
  let seed = 11; const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const texts = new Set(), add = value => { if (typeof value === 'string' && value) texts.add(value); };
  const safe = fn => { try { return fn(); } catch { return undefined; } };
  const collect = g => {
    const cue = safe(() => coastScene.drivingCue(g)); add(cue?.text); add(cue?.status);
    for (const value of [safe(() => coastScene.crossingCue(g)), safe(() => coastScene.boardingCue(g)), safe(() => coastScene.lessonResult(g))]) if (value) Object.values(value).forEach(add);
    add(safe(() => coastScene.holdFeedback(g).reason)); add(safe(() => coastScene.stability(g).status)); add(safe(() => coastScene.departLabel(g)));
    add(safe(() => coastScene.ticketMismatch(g))); add(safe(() => coastScene.pedalState(g, cue || { action: 'go' }).text)); add(safe(() => coastScene.observation(g)?.target));
    add(safe(() => coastScene.cakeRoadState(g).label)); add(safe(() => coastScene.crossingDestination(g))); add(safe(() => ticketHint(g, '')));
    for (const fact of safe(() => lessonFacts(g)) || []) { add(fact.text); add(fact.text.replace('出發提醒', '安全提醒')); }
    add(g.hint); add(g.choiceHint); add(g.orderHint); add(safe(() => cakeTask(g))); add(safe(() => sideWatch(g, 'left').label)); add(safe(() => g.target.name));
  };
  const options = { freshObservation: true, visualDeparture: true, releaseRecovery: true, observeTraffic: true, manualDoors: true, visualDelivery: true, strictTurns: true };
  for (const Lesson of [CoastLesson, CoastLessonR1]) for (const kind of ['cake', 'crossing', 'tickets']) for (let stage = 0; stage < 3; stage++) for (let layoutSeed = 0; layoutSeed < 6; layoutSeed++) {
    const g = new Lesson(kind, { stage, layoutSeed }, options); g.balancePractice = kind === 'cake'; g.begin();
    for (let step = 0; step < 500; step++) {
      for (const key of ['go', 'brake', 'left', 'right', 'recover-left', 'recover-right', 'escort']) g.input[key] = random() < 0.3;
      const r = random();
      if (r < 0.15) g.look(random() < 0.5 ? 'left' : 'right'); else if (r < 0.2) g.select(Math.floor(random() * 3)); else if (r < 0.25) g.door();
      else if (r < 0.3) { g.choosePassenger?.(Math.floor(random() * 3)); g.boardFriend?.(); } else if (r < 0.33) g.retractStep(); else if (r < 0.36) g.closeDoor?.();
      else if (r < 0.39) g.departTrain(); else if (r < 0.42) g.depart(); else if (r < 0.45) g.requestFriend(['child', 'bike', 'grandma'][Math.floor(random() * 3)]); else if (r < 0.47) g.next();
      g.update(0.05); if (step % 3 === 0) collect(g);
    }
  }
  assert.ok(texts.size > 120, `collected ${texts.size} sentences`);
  const left = english(() => [...texts].filter(text => HAN.test(tx(text))));
  assert.deepEqual(left, []);
  assert.equal(tx('奶奶正在過街，等到對岸。'), '奶奶正在過街，等到對岸。', 'Chinese mode: tx() returns the sentence unchanged');
  assert.equal(english(() => tx('奶奶正在過街，等到對岸。')), 'Grandma is crossing. Wait until they reach the other side.');
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
    // L3a: Car Class (src/games/car/main.js)
    [t('選擇{name}', { name: t('花蓮・東海岸') }), `選擇${'花蓮・東海岸'}`],
    [t('選擇{category} {name}', { category: t('拉力掀背'), name: t('山岳 RS') }), `選擇${'拉力掀背'} ${'山岳 RS'}`],
    [t('{color}車身', { color: t('雲霧白') }), `${['海洋青', '奶油黃', '雲霧白', '夕陽紅', '石墨灰'][2]}車身`],
    [`${t('海風 GT')} ${t('雙門跑車')}`, '海風 GT 雙門跑車'],
    [t('{label}，速度 {n} 格', { label: t('慢慢開'), n: 2 }), `${'慢慢開'}，速度 ${2} 格`],
    [t('副駕阿路舉左彎牌指路'), `副駕阿路舉${'左'}彎牌指路`],
    [t('副駕阿路舉右彎牌指路'), `副駕阿路舉${'右'}彎牌指路`],
    [t('阿路教練坐在閉合車窗內，繫好安全帶；{cue}', { cue: t('沿著海岸慢慢開') }), '阿路教練坐在閉合車窗內，繫好安全帶；' + '沿著海岸慢慢開'],
    [t('{n} 顆星評等', { n: 2 }), `${2} 顆星評等`],
    [t('收集到 {n} / {total} 顆星星', { n: `<b>${5}</b>`, total: 12 }), `收集到 <b>${5}</b> / ${12} 顆星星`],
    [t('{name} · 大家一起到站了', { name: t('花蓮・東海岸') }), `${'花蓮・東海岸'} · 大家一起到站了`],
    [`${t('花蓮・東海岸')} · ${t('山岳 RS')} · ${(360 / 1000).toFixed(2)} km`, `${'花蓮・東海岸'} · ${'山岳 RS'} · ${(360 / 1000).toFixed(2)} km`],
    [t('個人最快紀錄 {time}', { time: '01:02.3' }), `個人最快紀錄 ${'01:02.3'}`],
    [t('{name}：{tip}', { name: t('海風找星星'), tip: t('按自動油門，再點左右轉向。按住煞車就會減速。') }), `${'海風找星星'}：${'按自動油門，再點左右轉向。按住煞車就會減速。'}`],
    [t('{n} 顆星星', { n: 3 }), `${3} 顆星星`],
    // L3a: Train Class (src/games/train/)
    [t('{route}・去接朋友', { route: t('阿里山森林') }), `${'阿里山森林'}・去接朋友`],
    [t('藍灣' ? '藍灣' + '站' : '終點站'), `${'藍灣' || '終點'}站`],
    [t(undefined ? undefined + '站' : '終點站'), `${undefined || '終點'}站`],
    [t('建議提早煞車距離 {m} m', { m: (37.6).toFixed(0) }), `建議提早煞車距離 ${(37.6).toFixed(0)} m`],
    [t('{n} / 4 就緒', { n: 2 }), `${2} / 4 就緒`],
    [t('{station} 接到乘客！', { station: t('海風站') }), `${'海風'}站 接到乘客！`],
    [t('停車誤差 {m} m', { m: (4.26).toFixed(1) }), `停車誤差 ${(4.26).toFixed(1)} m`],
    [t('無法載入 {file}', { file: 'train.glb' }), `無法載入 ${'train.glb'}`],
    [t('乘客上下車中，還有 {n} 秒。', { n: 3 }), `乘客上下車中，還有 ${3} 秒。`],
    [t('紅燈停車成功。前方列車離開前，還要等 {n} 秒。', { n: 1 }), `紅燈停車成功。前方列車離開前，還要等 ${1} 秒。`],
    [t('前方 {n} 公尺是紅燈。動力歸零，提早煞車停在燈前。', { n: 42 }), `前方 ${42} 公尺是紅燈。動力歸零，提早煞車停在燈前。`],
    // L3a: Coast Practice lessons keep Chinese sentences, filled without translating (content-r*.js)
    [fill('朋友在{side}邊，再看一次。', { side: '左' }), `朋友在${'左'}邊，再看一次。`],
    [fill('{name}先過，等一等。', { name: '奶奶' }), `${'奶奶'}先過，等一等。`],
    [fill('再確認 {checks} 次・等 {waited} 位・出發提醒 {reminders} 次', { checks: 1, waited: 3, reminders: 0 }), `再確認 ${1} 次・等 ${3} 位・出發提醒 ${0} 次`],
    [fill('{side}彎到了，按住{name}。', { side: '右', name: '右轉' }), `${'右'}彎到了，按住${'右轉'}。`],
    [fill('蛋糕偏{lean}，按住{side}邊扶正。', { lean: '右', side: '左' }), `蛋糕偏${'右'}，按住${'左'}邊扶正。`],
    [fill('{side}邊沒車。再看右邊。', { side: '左' }), `${'左'}邊沒車。${'再看右邊。'}`],
    ['藍' + '圓形', `${'藍'}${'圓形'}`],
    ['對岸' + (true ? ' ✓' : ''), `對岸${true ? ' ✓' : ''}`],
    // L3a: Coast Practice screen (content-r1-ui.js)
    [t('獨立・{n}／3 課', { n: 2 }), `獨立・${2}／3 課`],
    [t('第 {n} 站・{name}', { n: 2, name: tx('燈塔彎') }), `第 ${2} 站・` + '燈塔彎'],
    [t('{title}・第 {n}／3 站', { title: t('路口停看等'), n: 2 }), `${'路口停看等'}・第 ${2}／3 站`],
    [t('進行中・第 {n} 站', { n: 2 }), `進行中・第 ${2} 站`],
    [t('{brief}。{tip}', { brief: tx('海風起步坡'), tip: tx(fill('找{name}，陪朋友上車。', { name: '藍圓形' })) }), '海風起步坡' + '。' + `找${'藍圓形'}，陪朋友上車。`],
    [t('{side}看過', { side: t('左邊') }), `${'左邊'}${'看過'}`],
    [t('{side}待確認', { side: t('右邊') }), `${'右邊'}${'待確認'}`],
    [t('輪到{name}', { name: tx('小安') }), `${'輪到'}${'小安'}`],
    [t('選{name}', { name: tx('小晴') }), `選${'小晴'}`],
    [t('{name}已入座', { name: tx('小宇') }), '小宇' + '已入座'],
    [t('{name}已到對側', { name: tx('奶奶') }), '奶奶' + '已到對側'],
    [t('{name}月台', { name: tx('橘三角形') }), `${'橘三角形'}月台`],
    [t('{name}月台的列車', { name: tx('綠正方形') }), `${'綠正方形'}月台的列車`],
    [t('{n} 號月台', { n: 3 }), `${3} 號月台`],
    [t('{n} 號月台 ✓', { n: 1 }), `${1} 號月台 ✓`],
    [t('本站車票：{name}', { name: tx('藍圓形') }), `本站車票：${'藍圓形'}`],
    [t('已到對岸 {n}/3 人', { n: 2 }), `已到對岸 ${2}/3 人`],
    [t('已入座 {n}/3 人', { n: 1 }), `已入座 ${1}/3 人`],
    [t('穩定度 {n}%', { n: 80 }), `穩定度 ${80}%`],
    [t('按住進度 {n}%', { n: 40 }), `按住進度 ${40}%`],
    [t('蛋糕歪向 {arrow}', { arrow: '→' }), `蛋糕歪向 ${'→'}`],
    [t('往{side}扶 {arrow}', { side: t('左'), arrow: '←' }), `往${'左'}扶 ${'←'}`],
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
