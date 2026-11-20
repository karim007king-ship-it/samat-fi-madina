// Runtime regression test for language selection, translation fallback, direction and digits.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

function boot(language, browserLanguage = 'fr') {
  const storage = { lang: language };
  let reloads = 0;
  const writtenScripts = [];
  const document = { documentElement: { lang: '', dir: '' }, write(markup) { writtenScripts.push(markup); } };
  const context = vm.createContext({
    window: {}, document, navigator: { language: browserLanguage },
    localStorage: { getItem(k) { return storage[k] ?? null; }, setItem(k,v) { storage[k]=v; } },
    location: { reload() { reloads++; } }, console
  });
  vm.runInContext(fs.readFileSync('i18n.js', 'utf8'), context, { filename: 'i18n.js' });
  vm.runInContext(fs.readFileSync('lang_tn.js', 'utf8'), context, { filename: 'lang_tn.js' });
  if (context.LANG !== 'tn') {
    const selectedBundle = 'lang_' + context.LANG + '.js';
    vm.runInContext(fs.readFileSync(selectedBundle, 'utf8'), context, { filename: selectedBundle });
  }
  return { context, document, storage, writtenScripts, reloads: () => reloads };
}

for (const language of ['tn', 'ar', 'fr', 'en']) {
  const { context, document, storage, writtenScripts, reloads } = boot(language);
  assert.equal(context.LANG, language, 'stored language should be respected');
  assert.equal(document.documentElement.lang, language === 'tn' ? 'ar' : language);
  assert.equal(document.documentElement.dir, language === 'fr' || language === 'en' ? 'ltr' : 'rtl');
  assert.ok(context.TR('ui.start'), 'start label must resolve');
  assert.ok(context.TR('game.title'), 'title must resolve');
  assert.deepEqual(writtenScripts, language === 'tn'
    ? ['<script src="lang_tn.js"></script>']
    : ['<script src="lang_tn.js"></script>', '<script src="lang_' + language + '.js"></script>'],
    'i18n bootstrap must request the fallback bundle and only the selected language bundle');

  // These labels previously remained Arabic in the Studio after switching to French/English.
  const studioLabels = ['ui.importStudio', 'ui.copyStory', 'ui.realImages', 'studio.imageHelp',
    'studio.choose', 'studio.importDisabled', 'studio.importTitle', 'studio.importDisabledHelp',
    'studio.storyHelp', 'studio.copied', 'studio.copyManual', 'studio.copy'];
  for (const key of studioLabels) {
    const value = context.TR(key);
    assert.notEqual(value, key, 'Studio label must resolve: ' + key);
    if (language === 'fr' || language === 'en') {
      assert.doesNotMatch(value, /[\u0600-\u06FF]/, 'Studio label must not leak Arabic script: ' + key);
    }
  }
  assert.equal(context.TR('__missing_key__'), '__missing_key__', 'unknown key should remain explicit');
  assert.equal(typeof context.RX.fear, 'object', 'emotion regex should be available');

  const digits = context.TR('ui.digits');
  const expectedDigits = '123'.replace(/\d/g, d => digits[Number(d)]);
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
assert.equal(defaulted.context.setLang('xx'), false, 'unsupported language changes must be rejected');
assert.equal(defaulted.storage.lang, 'xx', 'rejected language must not overwrite stored preference');
assert.equal(defaulted.reloads(), 0, 'rejected language must not reload the page');
console.log('Language preference fallback checks passed');
