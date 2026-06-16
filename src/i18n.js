import en from "./locales/en.json";
import de from "./locales/de.json";
import es from "./locales/es.json";
import fa from "./locales/fa.json";
import zhHant from "./locales/zh-Hant.json";
import zhHans from "./locales/zh-Hans.json";
import ja from "./locales/ja.json";

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
