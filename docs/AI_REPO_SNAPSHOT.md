# AI Repo Snapshot

Repo: https://github.com/httsai1979/acofusion-comparison-pro.git
Generated: 2026-06-17

## 1. Folder Tree (Max Depth 3)

```text
docs/
  deployment/NETLIFY_DEPLOYMENT_NOTES.md
  i18n/
    additional-i18n-key-suggestions.en.json
    current-locales-snapshot.json
    hardcoded-strings-report.md
    input-*.json
    missing-i18n-keys.json
    translation-audit.md
    translation-pack-README.md
  scope/README_SCOPE_AND_LIMITS.md
  codex-apply-i18n-prompt.md
public/
  assets/logo/ACOfusion_logo.jpg
  assets/samples/
  favicon.svg
scripts/
  check-hardcoded-strings.js
  check-i18n.js
  validate-build.js
src/
  app/events.js, init.js, state.js
  charts/footprintSvg.js, polarCanvas.js, polarOverlay.js
  config/brand.js, constants.js
  export/exportCsv.js, exportReadme.js, exportReportText.js, exportZip.js
  i18n/index.js, languageNames.js, locales/
  locales/
  parsers/iesParser.js, ldtParser.js
  photometry/aiming.js, auditRules.js, calculations.js, classification.js
  styles/components.css, layout.css, main.css, print.css, tables.css
  ui/renderAimingPreview.js, renderAudit.js, renderComparison.js, renderExport.js, renderFileLibrary.js, renderSingleReport.js
  utils/dom.js, escape.js, file.js, format.js
  main.js
index.html
netlify.toml
package.json
package-lock.json
```

## 2. package.json

Scripts:
```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "check:i18n": "node scripts/check-i18n.js",
  "check:hardcoded": "node scripts/check-hardcoded-strings.js",
  "validate": "npm run check:i18n && npm run build"
}
```

Dependencies:
```json
{ "vite": "latest", "jszip": "latest" }
```

Dev dependencies: none.

## 3. Entry Points

- HTML entry: `index.html`
- Vite module entry: `src/main.js`
- Actual app entry: `src/app/init.js`
- i18n entry: `src/i18n/index.js`
- Language names: `src/i18n/languageNames.js`
- Style entry: `src/styles/main.css`
- Brand config: `src/config/brand.js`

## 4. Main UI Modules / Files

- Active runtime/UI: `src/app/init.js`
- App shell modules: `src/app/events.js`, `src/app/state.js`
- UI module files: `src/ui/renderFileLibrary.js`, `renderSingleReport.js`, `renderComparison.js`, `renderAimingPreview.js`, `renderAudit.js`, `renderExport.js`

## 5. Parser Files

- `src/parsers/iesParser.js`
- `src/parsers/ldtParser.js`
- Note: active parser logic appears still wired through `src/app/init.js`; parser files are lightweight placeholders/comments.

## 6. Photometry / Calculation Files

- `src/photometry/calculations.js`
- `src/photometry/classification.js`
- `src/photometry/aiming.js`
- `src/photometry/auditRules.js`
- Note: active photometry/aiming/audit logic appears still concentrated in `src/app/init.js`.

## 7. Export Files

- `src/export/exportZip.js`
- `src/export/exportCsv.js`
- `src/export/exportReadme.js`
- `src/export/exportReportText.js`
- Note: active ZIP/export behavior appears still wired through `src/app/init.js`.

## 8. i18n Files and Languages

- Entry: `src/i18n/index.js`
- Language names: `src/i18n/languageNames.js`
- Locales: `src/i18n/locales/en.json`, `de.json`, `es.json`, `fa.json`, `zh-Hant.json`, `zh-Hans.json`, `ja.json`
- Languages: `en` English, `de` Deutsch, `es` Español, `fa` ?????, `zh-Hant` ????, `zh-Hans` ????, `ja` ???
- Current i18n check: `7 languages, 250 keys`.

## 9. Current Known Issues

UI/UX:
- Large active UI implementation remains concentrated in `src/app/init.js`.
- Several `src/ui/*` modules exist but do not appear to own active rendering logic yet.

I18n:
- Locale files are present and key-complete per `npm run check:i18n`.
- Further human review may still be needed for translation quality and terminology consistency.

Hard-coded strings:
- `npm run check:hardcoded` reports no obvious hard-coded UI string candidates.
- Technical strings, comments, metadata, file names, units, and brand names remain intentionally untranslated.

Netlify/build:
- `netlify.toml` uses build command `npm run build` and publish directory `dist`.
- Build currently passes.

Folder organisation:
- Target folders exist.
- Active logic is not fully modularized; many modules are placeholders while `src/app/init.js` remains very large.
- Empty legacy folder `src/locales/` remains in the tree.

## 10. Build Result

Command: `npm run build`

```text
vite v8.0.16 building client environment for production...
? 17 modules transformed.
dist/index.html                  41.44 kB ¦ gzip:  7.94 kB
dist/assets/index-DYvI9r-V.css   13.38 kB ¦ gzip:  3.61 kB
dist/assets/index-BCuCmMC-.js   254.78 kB ¦ gzip: 71.03 kB
? built in 337ms
```

## 11. Preview Result

Command: `npm run preview -- --host 127.0.0.1 --port 4180`

```text
HTTP 200 on http://127.0.0.1:4180
Vite preview served successfully.
```

## 12. Top 20 Files by Size

```text
130295  src/app/init.js
 71312  docs/i18n/current-locales-snapshot.json
 41344  index.html
 31316  package-lock.json
 23549  docs/i18n/hardcoded-strings-report.md
 18829  public/assets/logo/ACOfusion_logo.jpg
 16357  src/styles/main.css
 16080  src/i18n/locales/fa.json
 15177  src/i18n/locales/es.json
 14669  src/i18n/locales/de.json
 14168  src/i18n/locales/ja.json
 13918  src/i18n/locales/en.json
 12738  src/i18n/locales/zh-Hant.json
 12735  src/i18n/locales/zh-Hans.json
  8266  docs/i18n/input-fa.json
  7900  docs/i18n/missing-i18n-keys.json
  6971  docs/i18n/input-ja.json
  6726  docs/i18n/input-es.json
  6473  docs/i18n/input-de.json
  5960  docs/i18n/input-en.json
```