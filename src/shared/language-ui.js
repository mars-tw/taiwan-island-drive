// R50: the two places a family switches language — the home-page button and Parent Settings.
// Both always show 中文 and English, so a child or parent can find their way back.
import './language.css';
import { LANGUAGE_LABELS, DEFAULT_LANGUAGE, getLanguage, setLanguage, toggleLanguage, onLanguageChange, setText } from './i18n.js';

/** One button: 「中文／English」, the current language highlighted; a tap switches to the other. */
export function createLanguageToggle({ id = 'language-toggle' } = {}) {
  const button = document.createElement('button');
  button.type = 'button'; button.id = id; button.className = 'utility-button language-toggle';
  button.setAttribute('translate', 'no');
  button.innerHTML = '<span lang="zh-Hant">中文</span><i aria-hidden="true">／</i><span lang="en">English</span>';
  const sync = language => {
    button.dataset.language = language;
    button.setAttribute('aria-label', LANGUAGE_LABELS[language].switchTo);
    for (const span of button.querySelectorAll('span[lang]')) span.classList.toggle('is-current', (span.lang === 'en') === (language === 'en'));
  };
  button.addEventListener('click', () => { toggleLanguage(); });
  onLanguageChange(sync); sync(getLanguage());
  return button;
}

/** A Parent Settings row with two choices. Picking one also remembers it as the family's choice. */
export function createLanguageSetting() {
  const row = document.createElement('div');
  row.className = 'family-row family-language'; row.setAttribute('role', 'group'); row.setAttribute('aria-labelledby', 'family-language-label');
  row.innerHTML = `<span><b id="family-language-label" translate="no">${LANGUAGE_LABELS[DEFAULT_LANGUAGE].settings}</b><small></small></span><div class="language-choice" translate="no"><button type="button" data-language-choice="zh-Hant" lang="zh-Hant">中文</button><button type="button" data-language-choice="en" lang="en">English</button></div>`;
  setText(row.querySelector('small'), '切換後畫面立刻換字，進度不會清除。');
  const buttons = [...row.querySelectorAll('[data-language-choice]')];
  const sync = language => { for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.languageChoice === language)); };
  for (const button of buttons) button.addEventListener('click', () => { setLanguage(button.dataset.languageChoice); sync(getLanguage()); });
  onLanguageChange(sync); sync(getLanguage());
  return row;
}
