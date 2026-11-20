// Runtime regression test for language selection, translation fallback, direction and digits.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

for (const language of ['tn', 'ar', 'fr', 'en']) {
  const storage = { lang: language };
  const document = { documentElement: { lang: '', dir: '' }, write() {} };
  const context = vm.createContext({
    window: {}, document, navigator: { language: 'fr' },
    localStorage: { getItem(k) { return storage[k] ?? null; }, setItem(k,v) { storage[k]=v; } },
    location: { reload() {} }, console
  });
  for (const file of ['i18n.js', 'lang_tn.js', 'lang_' + language + '.js']) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  }
  assert.equal(context.LANG, language, 'selected language should be respected');
  assert.equal(document.documentElement.dir, language === 'fr' || language === 'en' ? 'ltr' : 'rtl');
  assert.ok(context.TR('ui.start'), 'start label must resolve');
  assert.ok(context.TR('game.title'), 'title must resolve');
  assert.equal(context.TR('__missing_key__'), '__missing_key__', 'unknown key should remain explicit');
  assert.equal(typeof context.RX.fear, 'object', 'emotion regex should be available');
  assert.equal(typeof context.D(123), 'string', 'digits formatter should return text');
  console.log('Runtime language checks passed:', language);
}
