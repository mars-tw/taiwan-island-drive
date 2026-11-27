// R50: text helpers for Coast Practice and the scene rounds (content-r*).
// Lesson and scene modules keep returning the Chinese sentence: later rounds compare and rewrite
// those sentences (replace, startsWith, name swaps), and the tests read them. Screens translate the
// finished sentence last with tx(). Sentences with values are written as one key with {names}, so
// the dictionary (src/shared/i18n/en-scenes.js) can match the whole sentence.
import {translateText} from './i18n.js';
/** fill('第 {n} 站', {n: 2}) → '第 2 站'. Always Chinese; it never translates. */
export const fill=(text,params={})=>String(text).replace(/\{(\w+)\}/g,(whole,name)=>params[name]===undefined||params[name]===null?whole:String(params[name]));
/** Finished Chinese text → the current language (Chinese mode: unchanged; English text: unchanged). */
export const tx=text=>text===undefined||text===null?text:translateText(String(text));
