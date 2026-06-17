Apply completed professional i18n translations.

Repo:
https://github.com/httsai1979/acofusion-comparison-pro.git

Input files:
- en.json
- de.json
- es.json
- fa.json
- zh-Hant.json
- zh-Hans.json
- ja.json
- additional-i18n-key-suggestions.en.json

Goal:
Replace incomplete locale values and move remaining visible hard-coded UI/export/warning strings into i18n.

Rules:
- Do not machine-translate. Use the supplied locale JSON values exactly.
- Do not change IES/LDT parsers, photometric calculations, comparison logic, aiming calculations, export file structure, or UI layout unless needed to wire i18n.
- Keep technical abbreviations unchanged: IES, LDT, CBCP, CCT, CRI, FWHM, Flux, Efficacy, Candela, Beam Angle, Tilt, Rotation, Polar Curve, Wallwash, UGR, EN 12464-1, DIALux, Relux, AGi32.
- Persian UI text should be RTL; numbers, units, file names, product codes, metadata, URLs and emails remain LTR.

Tasks:
1. Replace current locale dictionaries/files with the seven provided JSON files.
2. Keep the same key structure for all languages.
3. Replace hard-coded visible strings listed in hardcoded-strings-report.md with existing i18n keys where a matching key already exists.
4. For warning/audit/export strings that do not yet have keys, add new keys using additional-i18n-key-suggestions.en.json as the English base, then create corresponding translations in all six non-English locale files using the same professional terminology style as the supplied JSON.
5. Apply i18n to:
   header, file library, upload/search, tabs, Single Report, Comparison, Aiming Preview, Audit, Export, table headers, buttons, tooltips, empty states, toasts, parser warnings, audit warnings, ZIP README, CSV metadata/header, spec report and printable/exportable reports.
6. Do not translate file names, product codes, metadata values, units, URLs, emails or brand names.
7. Run:
   npm run build
   npm run preview
8. Verify all seven language switches work and no missing keys are displayed.
9. Commit changes:
   Complete professional i18n translations

Output:
- Short summary only
- List changed files
- List unresolved hard-coded strings only if any
- Do not paste full code
- Use minimal tokens
