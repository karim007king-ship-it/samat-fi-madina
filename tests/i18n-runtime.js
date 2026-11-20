// Runtime regression test for language selection, translation fallback, direction and digits.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

function boot(language, browserLanguage = 'fr') {
  const storage = { lang: language };
  let reloads = 0;
  const document = { documentElement: { lang: '', dir: '' }, write() {} };
  const context = vm.createContext({
    window: {}, document, navigator: { language: browserLanguage },
    localStorage: { getItem(k) { return storage[k] ?? null; }, setItem(k,v) { storage[k]=v; } },
    location: { reload() { reloads++; } }, console
  });
  for (const file of ['i18n.js', 'lang_tn.js', 'lang_' + language + '.js']) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  }
  return { context, document, storage, reloads: () => reloads };
}

for (const language of ['tn', 'ar', 'fr', 'en']) {
  const { context, document, storage, reloads } = boot(language);
  assert.equal(context.LANG, language, 'stored language should be respected');
  assert.equal(document.documentElement.lang, language === 'tn' ? 'ar' : language);
  assert.equal(document.documentElement.dir, language === 'fr' || language === 'en' ? 'ltr' : 'rtl');
  assert.ok(context.TR('ui.start'), 'start label must resolve');
  assert.ok(context.TR('game.title'), 'title must resolve');
  assert.equal(context.TR('__missing_key__'), '__missing_key__', 'unknown key should remain explicit');
  assert.equal(typeof context.RX.fear, 'object', 'emotion regex should be available');

  const digits = context.TR('ui.digits');
  const expectedDigits = '123'.replace(/\\d/g, d => digits[Number(d)]);
  assert.equal(context.D(123), expectedDigits, 'digits must use the selected language');
  if (language !== 'tn') {
    const fallbackKey = 'ui.start';
    const fallbackValue = context.LNG.tn.t[fallbackKey];
    delete context.LNG[language].t[fallbackKey];
    assert.equal(context.TR(fallbackKey), fallbackValue, 'missing translation must fall back to Tunisian');
  }
  context.setLang('fr');
  assert.equal(storage.lang, 'fr', 'setLang must persist the selected language');
  assert.equal(reloads(), 1, 'setLang must reload the page');
  console.log('Runtime language checks passed:', language);
}

const invalid = boot('xx', 'en');
assert.equal(invalid.context.LANG, 'en', 'unsupported stored language should use browser language');
const defaulted = boot('xx', 'de');
assert.equal(defaulted.context.LANG, 'tn', 'unsupported language should default to Tunisian');
console.log('Language preference fallback checks passed');
