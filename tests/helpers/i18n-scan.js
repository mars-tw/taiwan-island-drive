// R50: static scanner for the i18n guard tests. It reads source text only (never runs it).
// - tokenize(): a small JavaScript lexer (strings, template parts, comments, regex literals).
// - translationCalls(): every t('…') / setText(el,'…') / setAttr(el,'name','…') key written as a literal.
// - chineseFragments(): every piece of Chinese text inside string literals, split on HTML tags,
//   so an innerHTML template contributes its visible text and its aria-label/alt/title/placeholder values.
// - htmlFragments(): the same for an .html file (text nodes, those attributes, <title>, meta description).
export const HAN = /[㐀-䶿一-鿿豈-﫿]/;
const KEYWORDS_BEFORE_REGEX = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'instanceof', 'yield', 'await']);

function readQuoted(src, start, quote) {
  let i = start + 1, value = '';
  while (i < src.length && src[i] !== quote) {
    if (src[i] === '\\') { value += unescapeAt(src, i); i += escapeLength(src, i); continue; }
    if (src[i] === '\n') break;
    value += src[i++];
  }
  return { value, end: i + 1 };
}
function escapeLength(src, i) {
  const next = src[i + 1];
  if (next === 'u' && src[i + 2] === '{') return src.indexOf('}', i) - i + 1;
  if (next === 'u') return 6;
  if (next === 'x') return 4;
  return 2;
}
function unescapeAt(src, i) {
  const next = src[i + 1];
  const simple = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };
  if (next in simple) return simple[next];
  if (next === 'u' && src[i + 2] === '{') return String.fromCodePoint(parseInt(src.slice(i + 3, src.indexOf('}', i)), 16));
  if (next === 'u') return String.fromCharCode(parseInt(src.slice(i + 2, i + 6), 16));
  if (next === 'x') return String.fromCharCode(parseInt(src.slice(i + 2, i + 4), 16));
  if (next === '\n') return '';
  return next;
}

/** Tokens: {type:'str'|'tpl'|'id'|'num'|'punct', value, line}. A template becomes one 'tpl'
 *  token with `parts` (static text) and `dynamic` (true when it has ${…}); the tokens of its
 *  expressions are emitted too, so a t('…') inside ${…} is still seen. */
export function tokenize(src) {
  const tokens = [];
  const templates = []; // open templates: {token, depth}
  let depth = 0, i = 0, line = 1;
  const last = () => tokens[tokens.length - 1];
  const regexAllowed = () => {
    const prev = last();
    if (!prev) return true;
    if (prev.type === 'punct') return !(prev.value === ')' || prev.value === ']');
    if (prev.type === 'id') return KEYWORDS_BEFORE_REGEX.has(prev.value);
    return false;
  };
  function readTemplate(token) {
    let part = '';
    while (i < src.length) {
      const c = src[i];
      if (c === '\\') { part += unescapeAt(src, i); i += escapeLength(src, i); continue; }
      if (c === '`') { token.parts.push(part); i++; return; }
      if (c === '$' && src[i + 1] === '{') { token.parts.push(part); token.dynamic = true; i += 2; depth++; templates.push({ token, depth }); return; }
      if (c === '\n') line++;
      part += c; i++;
    }
    token.parts.push(part);
  }
  while (i < src.length) {
    const c = src[i];
    if (c === '\n') { line++; i++; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (c === '/' && src[i + 1] === '/') { const end = src.indexOf('\n', i); i = end < 0 ? src.length : end; continue; }
    if (c === '/' && src[i + 1] === '*') { const end = src.indexOf('*/', i + 2); const stop = end < 0 ? src.length : end + 2; line += (src.slice(i, stop).match(/\n/g) || []).length; i = stop; continue; }
    if (c === '"' || c === "'") { const { value, end } = readQuoted(src, i, c); tokens.push({ type: 'str', value, line }); i = end; continue; }
    if (c === '`') { const token = { type: 'tpl', parts: [], dynamic: false, line }; tokens.push(token); i++; readTemplate(token); continue; }
    if (c === '}' && templates.length && templates[templates.length - 1].depth === depth) { const { token } = templates.pop(); depth--; i++; readTemplate(token); continue; }
    if (c === '/' && regexAllowed()) {
      i++; let inClass = false;
      while (i < src.length) { const r = src[i]; if (r === '\\') { i += 2; continue; } if (r === '[') inClass = true; else if (r === ']') inClass = false; else if (r === '/' && !inClass) break; else if (r === '\n') break; i++; }
      i++; while (/[a-z]/i.test(src[i] || '')) i++;
      tokens.push({ type: 'regex', value: '', line }); continue;
    }
    const id = /^[A-Za-z_$À-￿][\w$À-￿]*/.exec(src.slice(i, i + 200));
    if (id) { tokens.push({ type: 'id', value: id[0], line }); i += id[0].length; continue; }
    const num = /^\d[\w.]*/.exec(src.slice(i, i + 40));
    if (num) { tokens.push({ type: 'num', value: num[0], line }); i += num[0].length; continue; }
    if (c === '{') depth++;
    if (c === '}') depth--;
    tokens.push({ type: 'punct', value: c, line }); i++;
  }
  return tokens;
}

const staticText = token => token.type === 'str' ? token.value : token.type === 'tpl' && !token.dynamic ? token.parts.join('') : null;

/** Literal keys handed to the translation helpers. Each item: {key, line, helper}. */
export function translationCalls(src) {
  const tokens = tokenize(src), found = [];
  for (let k = 0; k < tokens.length - 2; k++) {
    const token = tokens[k], prev = tokens[k - 1];
    if (token.type !== 'id' || tokens[k + 1].value !== '(') continue;
    if (prev && prev.type === 'punct' && prev.value === '.') continue; // obj.t(…) is someone else's method
    if (prev && prev.type === 'id' && prev.value === 'function') continue;
    const argIndex = { t: 0, setText: 1, setAttr: 2 }[token.value];
    if (argIndex === undefined) continue;
    // Walk to the requested argument at nesting depth 0.
    let j = k + 2, arg = 0, nest = 0;
    while (j < tokens.length && arg < argIndex) {
      const v = tokens[j].value;
      if (tokens[j].type === 'punct' && '([{'.includes(v)) nest++;
      else if (tokens[j].type === 'punct' && ')]}'.includes(v)) { if (nest === 0) break; nest--; }
      else if (tokens[j].type === 'punct' && v === ',' && nest === 0) arg++;
      j++;
    }
    if (arg !== argIndex || !tokens[j]) continue;
    const key = staticText(tokens[j]);
    if (key !== null && (tokens[j + 1]?.value === ',' || tokens[j + 1]?.value === ')')) found.push({ key, line: tokens[j].line, helper: token.value });
  }
  return found;
}

const TRANSLATED_ATTRIBUTES = /\s(?:aria-label|alt|title|placeholder|label)\s*=\s*(["'])(.*?)\1/g;
/** Visible text pieces of an HTML-ish string (tags removed) plus translated attribute values. */
export function splitMarkup(text) {
  const pieces = [];
  for (const tag of text.match(/<[^>]*>/g) || []) for (const m of tag.matchAll(TRANSLATED_ATTRIBUTES)) pieces.push(m[2]);
  for (const piece of text.split(/<[^>]*>/)) pieces.push(piece);
  return pieces.map(piece => piece.replace(/&nbsp;/g, ' ').trim()).filter(piece => HAN.test(piece));
}

/** Chinese text inside string literals. Template parts of a dynamic template are reported with
 *  dynamic:true — in a fully translated file such text must be rewritten as t('… {name} …', params). */
export function chineseFragments(src) {
  const out = [];
  for (const token of tokenize(src)) {
    if (token.type === 'str') for (const text of splitMarkup(token.value)) out.push({ text, line: token.line, dynamic: false });
    if (token.type === 'tpl') for (const part of token.parts) for (const text of splitMarkup(part)) out.push({ text, line: token.line, dynamic: token.dynamic });
  }
  return out;
}

/** Chinese text of an HTML page: text nodes, translated attributes, <title>, meta description.
 *  `scope: 'head'` limits the scan to <title> and the description (the page body belongs to another line). */
export function htmlFragments(html, { scope = 'all' } = {}) {
  const out = [];
  const title = /<title>([^<]*)<\/title>/.exec(html);
  if (title && HAN.test(title[1])) out.push(title[1].trim());
  const description = /<meta name="description" content="([^"]*)"/.exec(html);
  if (description && HAN.test(description[1])) out.push(description[1].trim());
  if (scope === 'head') return out;
  const body = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  out.push(...splitMarkup(body));
  return out;
}
