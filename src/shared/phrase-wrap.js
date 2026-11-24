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

/** Escaped HTML for one line of child-facing Chinese text, with <wbr> only between two real (2+ character) words. */
export function phraseHtml(text, { segment = segmenter } = {}) {
  const value = String(text ?? '');
  if (!segment) return esc(value);
  const inside = new Set();
  for (const word of KEEP) for (let at = value.indexOf(word); at >= 0; at = value.indexOf(word, at + 1)) for (let i = 1; i < word.length; i++) inside.add(at + i);
  let out = '', prev = null, pos = 0;
  for (const { segment: piece, isWordLike } of segment.segment(value)) {
    const word = isWordLike && CJK.test(piece);
    if (word && prev && [...prev].length >= 2 && [...piece].length >= 2 && !inside.has(pos)) out += '<wbr>';
    out += esc(piece);
    prev = word ? piece : null;
    pos += piece.length;
  }
  return out;
}
