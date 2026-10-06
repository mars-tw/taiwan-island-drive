export const APP_REPOSITORY = 'https://github.com/mars-tw/taiwan-island-drive';
export function resolveAppBase(pageUrl, relativeRoot = './') {
  return new URL(relativeRoot, pageUrl).href;
}
export const APP_BASE = typeof document === 'undefined' ? './'
  : resolveAppBase(document.baseURI, document.querySelector('meta[name="island-app-root"]')?.content || './');
export function appUrl(path = '') { return APP_BASE === './' ? `./${path}` : new URL(path, APP_BASE).href; }
export const assetUrl = appUrl;
