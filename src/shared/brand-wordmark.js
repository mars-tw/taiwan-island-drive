// Home page wordmark. Chinese keeps public/art/r8/logo.png. English uses logo-en.png.
export const BRAND_WORDMARK_ZH = './art/r8/logo.png';
export const BRAND_WORDMARK_EN = './art/r8/logo-en.png';

/** zh-Hant and zh-TW stay on the original file. Only English swaps the picture. */
export function brandWordmarkSrc(language) {
  return language === 'en' ? BRAND_WORDMARK_EN : BRAND_WORDMARK_ZH;
}

/** Points .brand-wordmark at the picture for this language. Same src is left untouched. */
export function applyBrandWordmark(root, language) {
  const mark = root?.querySelector?.('.brand-wordmark');
  if (!mark) return mark;
  const next = brandWordmarkSrc(language);
  if (mark.getAttribute('src') !== next) mark.setAttribute('src', next);
  return mark;
}
