import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const langs = ['en','de','es','fa','zh-Hant','zh-Hans','ja'];
const dir = path.join(root, 'src/i18n/locales');
const data = Object.fromEntries(langs.map(lang => [lang, JSON.parse(fs.readFileSync(path.join(dir, lang + '.json'), 'utf8'))]));
const keys = [...new Set(langs.flatMap(lang => Object.keys(data[lang])))].sort();
let failed = false;
for (const lang of langs) {
  const missing = keys.filter(key => !(key in data[lang]));
  const empty = Object.entries(data[lang]).filter(([, value]) => String(value ?? '').trim() === '').map(([key]) => key);
  if (missing.length || empty.length) {
    failed = true;
    console.error(lang, { missing, empty });
  }
}
if (failed) process.exit(1);
console.log('i18n OK:', langs.length + ' languages, ' + keys.length + ' keys');
