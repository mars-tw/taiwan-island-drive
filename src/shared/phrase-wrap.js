// R49 修正輪：中文說明與提示只在「詞和詞之間」或標點後換行（學院新程式，MIT）。
// 搭配 CSS `word-break: keep-all`：中文字之間預設不能斷，只有標點、空格和這裡插入的 <wbr> 可以斷。
// 瀏覽器內建的斷詞（Intl.Segmenter）常把「分車」「月台」「代幣」切成單字，所以單字段一律黏住左右鄰居，
// 只在兩個至少兩字的詞中間放 <wbr>。沒有 Segmenter 的環境就只靠標點斷行。
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = value => String(value).replace(/[&<>"']/g, c => ESC[c]);
let segmenter = null;
try { segmenter = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('zh-Hant', { granularity: 'word' }) : null; } catch { segmenter = null; }
const CJK = /[\u3400-\u9fff]/;

// 斷詞常切錯、但小朋友看到一定要連在一起的詞（例如「接上／下一節」被切成「上下｜一節」）。
const KEEP = ['下一節', '上一節', '下一題', '下一站', '上一站', '下一班', '一樣多', '一樣重', '一樣長'];
// 上線前小修：顏色＋形狀＋列車／月台是一個名字（「紫色列車」「紅色三角形月台」），整組黏在一起，不能讓第一行只剩「紫色」。
// 名字前面可以換行（「要開到｜紅色三角形月台」），名字裡面不行。顏色、形狀和遊戲的 RAIL_COLORS／RAIL_SHAPES 一致（測試會核對）。
export const LABEL_COLORS = Object.freeze(['藍色', '綠色', '紫色', '紅色', '橘色', '黃色']);
export const LABEL_SHAPES = Object.freeze(['圓形', '三角形', '方形', '星星']);
export const LABEL_NOUNS = Object.freeze(['列車', '月台', '車廂', '箭頭', '牌子']);
const alt = list => list.join('|');
const LABEL = new RegExp(`(${alt(LABEL_COLORS)})?(${alt(LABEL_SHAPES)})?(${alt(LABEL_NOUNS)})?`, 'g');
const PUNCT = /[，、。！？；：,.!?;:\s「」『』（）]/;

/** Escaped HTML for one line of child-facing Chinese text, with <wbr> only between two real (2+ character) words. */
export function phraseHtml(text, { segment = segmenter } = {}) {
  const value = String(text ?? '');
  if (!segment) return esc(value);
  const inside = new Set(), before = new Set();
  for (const word of KEEP) for (let at = value.indexOf(word); at >= 0; at = value.indexOf(word, at + 1)) for (let i = 1; i < word.length; i++) inside.add(at + i);
  for (const m of value.matchAll(LABEL)) {
    if (!m[0] || m.slice(1).filter(Boolean).length < 2) continue; // 至少兩段：顏色＋列車、顏色＋形狀、形狀＋月台…
    const start = m.index, end = start + m[0].length;
    for (let i = start + 1; i < end; i++) inside.add(i);
    const clauseStart = start === 0 || PUNCT.test(value[start - 1]);
    if (!clauseStart && CJK.test(value[start - 1])) before.add(start); // 「要開到｜紅色三角形月台」
    if (clauseStart) inside.add(end); // 句子開頭的名字後面不斷，第一行不會只剩一個名字
  }
  let out = '', prev = null, pos = 0, words = 0;
  for (const { segment: piece, isWordLike } of segment.segment(value)) {
    const word = isWordLike && CJK.test(piece);
    // 第一個 <wbr> 至少要在兩個詞之後，第一行不會只剩一個詞（例如「看看｜車廂的規律」不斷在「看看」後面）。
    if (words >= 2 && !inside.has(pos) && (before.has(pos) || (word && prev && [...prev].length >= 2 && [...piece].length >= 2))) out += '<wbr>';
    out += esc(piece);
    prev = word ? piece : null;
    if (word) words++;
    pos += piece.length;
  }
  return out;
}
