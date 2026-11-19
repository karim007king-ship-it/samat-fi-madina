import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const sourceFiles = [
  'i18n.js', 'engine.js', 'story.js', 'audio.js', 'studio.js', 'fx.js', 'sw.js',
  'lang_tn.js', 'lang_ar.js', 'lang_fr.js', 'lang_en.js'
];

for (const file of sourceFiles) {
  const source = readFileSync(file, 'utf8');
  new vm.Script(source, { filename: file });
}

const dictionaries = {};
for (const code of ['tn', 'ar', 'fr', 'en']) {
  const sandbox = { window: { LNG: {} } };
  vm.runInNewContext(readFileSync(`lang_${code}.js`, 'utf8'), sandbox, { filename: `lang_${code}.js` });
  dictionaries[code] = sandbox.window.LNG[code].t;
}

const baseKeys = Object.keys(dictionaries.tn);
for (const code of ['ar', 'fr', 'en']) {
  const missing = baseKeys.filter(key => !(key in dictionaries[code]));
  assert.deepEqual(missing, [], `Missing ${code} translations: ${missing.join(', ')}`);
}

for (const file of ['engine.js', 'story.js']) {
  const source = readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  for (const match of source.matchAll(/\bTR\(\s*(['"])([^'"]+)\1\s*\)/g)) {
    assert.ok(match[2] in dictionaries.tn, `Unknown translation key in ${file}: ${match[2]}`);
  }
}

const html = readFileSync('index.html', 'utf8');
const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(match => match[1]);
assert.ok(scripts.indexOf('i18n.js') !== -1 && scripts.indexOf('i18n.js') < scripts.indexOf('story.js'),
  'i18n.js must load before story.js');

const sw = readFileSync('sw.js', 'utf8');
for (const file of ['i18n.js', 'lang_tn.js', 'lang_ar.js', 'lang_fr.js', 'lang_en.js']) {
  assert.ok(sw.includes(`'${file}'`), `Service worker precache is missing ${file}`);
}

console.log(`Validation passed: ${sourceFiles.length} JavaScript files, ${baseKeys.length} translation keys in all 4 languages, literal TR() keys, script order, and service-worker precache.`);
