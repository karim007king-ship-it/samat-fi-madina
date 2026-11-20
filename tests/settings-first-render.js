// Regression test for the first render of the home and settings screens in every locale.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

function extractFunction(source, name, nextMarker) {
  const start = source.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('Missing function: ' + name);
  const end = source.indexOf(nextMarker, start);
  if (end < 0) throw new Error('Missing end marker for: ' + name);
  return source.slice(start, end).trim();
}

function boot(locale) {
  const storage = { lang: locale };
  const document = {
    documentElement: { lang: '', dir: '' },
    write() {},
    querySelectorAll() { return []; }
  };
  const context = vm.createContext({
    window: {},
    document,
    navigator: { language: locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'ar' },
    localStorage: {
      getItem(key) { return storage[key] ?? null; },
      setItem(key, value) { storage[key] = value; }
    },
    location: { reload() {} },
    console,
    $() { return {}; },
    ov(html) { context.lastOverlay = html || ''; },
    ld() { return null; },
    RMon() { return false; },
    volUI() {},
    setRM() {},
    TS: 24
  });

  for (const file of ['i18n.js', 'lang_tn.js', 'lang_' + locale + '.js', 'story.js']) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  }

  const engine = fs.readFileSync('engine.js', 'utf8');
  vm.runInContext(extractFunction(engine, 'home', '\n\nfunction menuUI'), context);
  vm.runInContext(extractFunction(engine, 'setUI', '\n\n// تصدير/استيراد الحفظ'), context);
  return { context, storage };
}

for (const locale of ['tn', 'ar', 'fr', 'en']) {
  const { context } = boot(locale);

  context.home();
  const home = context.lastOverlay;
  for (const key of ['ui.start', 'ui.importStudio', 'ui.copyStory', 'ui.realImages']) {
    assert.ok(home.includes(context.TR(key)), 'Home screen must render ' + key + ' on first open (' + locale + ')');
  }

  context.setUI();
  const settings = context.lastOverlay;
  for (const key of ['menu.settings', 'ui.language', 'menu.textSpeed', 'menu.slow',
    'menu.normal', 'menu.fast', 'menu.instant', 'menu.volume',
    'menu.reduceMotion', 'menu.back']) {
    assert.ok(settings.includes(context.TR(key)), 'Settings must render ' + key + ' on first open (' + locale + ')');
  }

  for (const key of ['ui.importStudio', 'ui.copyStory', 'ui.realImages']) {
    assert.ok(home.includes(context.TR(key)), 'Studio entry must be localized (' + locale + '): ' + key);
  }

  if (locale === 'fr' || locale === 'en') {
    assert.doesNotMatch(home, /[\u0600-\u06FF]/, 'Home screen leaked Arabic text in ' + locale);
    assert.doesNotMatch(settings, /[\u0600-\u06FF]/, 'Settings screen leaked Arabic text in ' + locale);
  }
  console.log('First-render home/settings localization passed:', locale);
}
