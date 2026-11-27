// R50: the home wordmark picture follows the language. Chinese stays on logo.png.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyBrandWordmark, brandWordmarkSrc, BRAND_WORDMARK_EN, BRAND_WORDMARK_ZH } from '../../src/shared/brand-wordmark.js';
import { getLanguage, onLanguageChange, setLanguage } from '../../src/shared/i18n.js';

function page(src = BRAND_WORDMARK_ZH) {
  const attributes = new Map([['src', src]]);
  const mark = {
    getAttribute: name => (attributes.has(name) ? attributes.get(name) : null),
    setAttribute: (name, value) => attributes.set(name, String(value)),
  };
  return { mark, root: { querySelector: selector => (selector === '.brand-wordmark' ? mark : null) } };
}

test('R50 the home wordmark uses logo-en.png in English and logo.png in Chinese', () => {
  assert.equal(brandWordmarkSrc('en'), BRAND_WORDMARK_EN);
  assert.equal(brandWordmarkSrc('zh-Hant'), BRAND_WORDMARK_ZH);
  assert.equal(brandWordmarkSrc('zh-TW'), BRAND_WORDMARK_ZH, 'zh-TW is the Chinese locale and keeps the original picture');
  const { mark, root } = page();
  const stop = onLanguageChange(language => applyBrandWordmark(root, language));
  try {
    applyBrandWordmark(root, getLanguage());
    assert.equal(mark.getAttribute('src'), './art/r8/logo.png');
    assert.equal(getLanguage(), 'zh-Hant');
    setLanguage('en', { persist: false });
    assert.equal(mark.getAttribute('src'), './art/r8/logo-en.png');
    setLanguage('zh-TW', { persist: false });
    assert.equal(getLanguage(), 'zh-Hant');
    assert.equal(mark.getAttribute('src'), './art/r8/logo.png');
    setLanguage('en', { persist: false });
    setLanguage('zh-Hant', { persist: false });
    assert.equal(mark.getAttribute('src'), './art/r8/logo.png');
  } finally {
    stop();
    setLanguage('zh-Hant', { persist: false });
  }
  const home = readFileSync('src/home.js', 'utf8');
  const html = readFileSync('index.html', 'utf8');
  assert.match(home, /function syncWordmark\(\) \{ applyBrandWordmark\(document, getLanguage\(\)\)/);
  assert.match(home, /syncWordmark\(\);\s*onLanguageChange\(\(\) => \{ showSettings\(\); showRewards\(\); music\.sync\(\); syncWordmark\(\); \}\)/);
  assert.match(html, /class="brand-wordmark" src="\.\/art\/r8\/logo\.png"/);
  assert.equal(readFileSync('public/art/r8/logo-en.png').subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
});
