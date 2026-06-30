import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { dict } from "../i18n/translations.js";

// App-wide language preference (en | id) + translation function.
const LanguageCtx = createContext(null);
export const useLanguage = () => useContext(LanguageCtx);

const KEY = "jojoba_lang";
export const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
];

// Human-readable language name (used inside some strings).
export const langName = (code) => (code === "id" ? "Bahasa Indonesia" : "English");

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem(KEY) || "en");

  useEffect(() => {
    localStorage.setItem(KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const toggle = useCallback(() => setLang((l) => (l === "en" ? "id" : "en")), []);

  // t("key") or t("key", { n: 3, list: "a, b" }) — interpolates {name} tokens.
  const t = useCallback(
    (key, vars) => {
      const table = dict[lang] || dict.en;
      let str = table[key] ?? dict.en[key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) str = str.replaceAll(`{${k}}`, String(v));
      return str;
    },
    [lang]
  );

  return (
    <LanguageCtx.Provider value={{ lang, setLang, toggle, t, langName: () => langName(lang), languages: LANGUAGES }}>
      {children}
    </LanguageCtx.Provider>
  );
}
