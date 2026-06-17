# Translation Audit

Generated: 2026-06-17T07:55:50.222Z

## Scope

Audit-only pass for visible UI, report, warning, comparison, aiming, file-library, and export strings. No translations or app logic changes were made.

## Locale Coverage

| Language | Keys | Missing | Empty | Same as English / likely untranslated |
|---|---:|---:|---:|---:|
| en | 136 | 0 | 0 | 0 |
| de | 136 | 0 | 0 | 18 |
| es | 136 | 0 | 0 | 73 |
| fa | 136 | 0 | 0 | 71 |
| zh-Hant | 136 | 0 | 0 | 69 |
| zh-Hans | 136 | 0 | 0 | 69 |
| ja | 136 | 0 | 0 | 73 |

## Main Findings

- Locale files share a mostly complete key shape, but non-English locales still contain English fallback values requiring review.
- Detected 112 hard-coded visible string candidate occurrences across HTML/JS/CSS scan targets.
- Largest gaps are in index.html static markup, runtime warning/audit text, comparison row actions, canvas empty states, CSV/spec TXT/ZIP README export text, and mixed Chinese/English report labels.
- zh-Hans contains several Traditional Chinese values and English fallbacks; zh-Hant also has English fallbacks. Persian uses locale values in places, but export/runtime strings still need i18n coverage.

## Requested Output Files

- missing-i18n-keys.json: missing, empty, extra, and same-as-English key audit.
- hardcoded-strings-report.md: visible hard-coded string candidates grouped by UI/export area.
- current-locales-snapshot.json: complete current locale snapshot for follow-up translation work.

## Next Translation Work

Move hard-coded visible strings into locale keys first, then translate/review existing English fallbacks. Do not treat this audit as approved wording; it intentionally does not rewrite copy.