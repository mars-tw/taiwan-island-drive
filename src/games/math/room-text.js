// R50 L2：數學遊戲室與火車謎題的中英文切換小工具（學院新程式，MIT）。
// 規則：出題、判斷對錯、存進狀態或回傳的句子一律保持中文（程式和測試會比對、解析這些中文），
// 畫面顯示和唸出來的時候才換成目前的語言。
//  - zh('請讓 {n} 位乘客上車。', { n })：只把值填進中文句子，永遠回傳中文（給出題與回饋的邏輯用）。
//  - tx(中文句子)：顯示前把一整句中文換成目前語言。先找一模一樣的 key，再找帶 {參數} 的句型
//    （數學、謎題字典優先，固定字越多的句型越先比），參數裡的中文也會再換一次；其他字典交給 translateText。
//    中文模式原樣回傳，所以中文畫面一個字都不變。
import { t, isEnglish, hasTranslation, translateText, HAN } from '../../shared/i18n.js';
import EN_MATH from '../../shared/i18n/en-math.js';
import EN_PUZZLES from '../../shared/i18n/en-puzzles.js';

const PLACEHOLDER = /\{(\w+)\}/g;

/** Fills {names} in a Chinese source sentence. Never translates. */
export function zh(template, params = {}) {
  return String(template ?? '').replace(PLACEHOLDER, (whole, name) => Object.hasOwn(params, name) && params[name] !== undefined && params[name] !== null ? String(params[name]) : whole);
}

let patterns = null;
function compiled() {
  if (patterns) return patterns;
  patterns = [];
  for (const key of [...Object.keys(EN_MATH), ...Object.keys(EN_PUZZLES)]) {
    if (!key.includes('{')) continue;
    const names = [];
    const source = key.split(/(\{\w+\})/).map(part => {
      const m = /^\{(\w+)\}$/.exec(part);
      if (m) { names.push(m[1]); return '(.+?)'; }
      return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('');
    const fixed = key.replace(PLACEHOLDER, '');
    // Only sentences with Chinese in their fixed part: '{name}，{description}' must not swallow other text.
    if (names.length && HAN.test(fixed)) patterns.push({ key, names, fixed: fixed.length, regex: new RegExp(`^${source}$`, 's') });
  }
  // The most specific sentence wins: more fixed text first, then fewer placeholders.
  patterns.sort((a, b) => b.fixed - a.fixed || a.names.length - b.names.length);
  return patterns;
}

/** Finished Chinese text (from the game logic or data) in the current language. */
export function tx(text) {
  const raw = String(text ?? '');
  if (!isEnglish() || !HAN.test(raw)) return raw;
  const lead = /^\s*/.exec(raw)[0], tail = /\s*$/.exec(raw.slice(lead.length))[0];
  const body = raw.slice(lead.length, raw.length - tail.length);
  if (hasTranslation(body)) return lead + t(body) + tail;
  for (const { key, names, regex } of compiled()) {
    const match = regex.exec(body);
    if (!match) continue;
    const params = {};
    names.forEach((name, index) => { const value = match[index + 1]; params[name] = HAN.test(value) ? tx(value) : value; });
    return lead + t(key, params) + tail;
  }
  return translateText(raw);
}
