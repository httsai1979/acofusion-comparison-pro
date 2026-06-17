import fs from 'node:fs';
const files = ['index.html', 'src/app/init.js'];
const allowed = [
  /ACOFUSION/i,
  /IES|LDT|CBCP|CCT|CRI|FWHM|Flux|Efficacy|Candela|Beam Angle|Tilt|Rotation|Polar|Wallwash|UGR|EN 12464-1|DIALux|Relux|AGi32/,
  /English|Deutsch|Espa.{0,2}ol|S71-3|EVERFINE|TESTDATE|ISSUEDATE|NEARFIELD/
];
const cjk = /[\u3400-\u9FFF]/;
const suspiciousEnglish = /(No files selected|Export All Files|SPECIFICATION SHEET|FILE NAME|TECHNICAL METRICS|SUGGESTED USE|AIMING PREVIEW SETTINGS|SYSTEM REMARKS|Unsupported photometric file type)/;
const stripLineComment = value => {
  const index = value.indexOf('//');
  return index >= 0 ? value.slice(0, index) : value;
};
let hits = [];
for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    const visibleLine = stripLineComment(line.replace(/<!--.*?-->/g, '')).trim();
    if (!visibleLine) return;
    if (/option value="(zh-Hant|zh-Hans|ja|fa)"/.test(visibleLine)) return;
    if (allowed.some(re => re.test(visibleLine))) return;
    if (cjk.test(visibleLine) || suspiciousEnglish.test(visibleLine)) hits.push(file + ':' + (i + 1) + ': ' + visibleLine.slice(0, 180));
  });
}
if (hits.length) {
  console.warn('Hardcoded string candidates:');
  hits.slice(0, 80).forEach(hit => console.warn(hit));
  if (hits.length > 80) console.warn('... +' + (hits.length - 80) + ' more');
} else {
  console.log('No obvious hardcoded UI string candidates.');
}
