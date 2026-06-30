import React from "react";
import { useLanguage } from "../context/LanguageContext.jsx";

// Compact EN/ID segmented switch. `compact` renders a slimmer version for mobile.
export default function LanguageToggle({ compact = false }) {
  const { lang, setLang } = useLanguage();
  return (
    <div className={`inline-flex items-center rounded-lg border border-line bg-white p-0.5 ${compact ? "" : "w-full"}`}>
      {[
        ["en", "EN"],
        ["id", "ID"],
      ].map(([code, label]) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`flex-1 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
            lang === code ? "bg-ink text-white" : "text-muted hover:text-ink"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
