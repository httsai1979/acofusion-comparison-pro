import en from "./en.json";
import de from "./de.json";
import es from "./es.json";
import fa from "./fa.json";
import zhHant from "./zh-Hant.json";
import zhHans from "./zh-Hans.json";
import ja from "./ja.json";

export const locales = {
  en,
  de,
  es,
  fa,
  "zh-Hant": zhHant,
  "zh-Hans": zhHans,
  ja,
  zh: zhHant
};

export const languageOptions = [
  ["en", "English"],
  ["de", "Deutsch"],
  ["es", "Español"],
  ["fa", "فارسی"],
  ["zh-Hant", "繁體中文"],
  ["zh-Hans", "简体中文"],
  ["ja", "日本語"]
];
