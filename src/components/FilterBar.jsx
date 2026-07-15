import React, { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { RAG_FILTERS } from "../constants.js";
import { useLanguage } from "../context/LanguageContext.jsx";

// Single-select metadata filters (sector / region / topic). Selecting an active
// value clears it. Emits the filter object up via onChange.
export default function FilterBar({ value = {}, onChange }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const active = Object.entries(value).filter(([, v]) => v);

  const pick = (facet, v) => {
    const next = { ...value };
    if (next[facet] === v) delete next[facet];
    else next[facet] = v;
    onChange?.(next);
  };

  const clearAll = () => onChange?.({});

  return (
    <div className="mb-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            open || active.length
              ? "border-blue bg-bluesoft text-blue"
              : "border-line bg-white text-muted hover:border-[#cdbf9d]"
          }`}
          aria-expanded={open}
        >
          <SlidersHorizontal size={13} />
          {t("filter.title")}
          {active.length > 0 && (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-blue px-1 text-[10px] font-semibold text-white">
              {active.length}
            </span>
          )}
        </button>

        {active.map(([facet, v]) => (
          <span
            key={facet}
            className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-[11px] text-ink2"
          >
            <span className="text-faint">{t(`filter.${facet}`)}:</span>
            {t(`filter.${facet}.${v}`)}
            <button
              type="button"
              onClick={() => pick(facet, v)}
              className="text-faint hover:text-ink"
              aria-label={t("filter.remove")}
            >
              <X size={12} />
            </button>
          </span>
        ))}

        {active.length > 1 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] font-medium text-muted underline-offset-2 hover:text-ink hover:underline"
          >
            {t("filter.clear")}
          </button>
        )}
      </div>

      {open && (
        <div className="mt-2 animate-fadeUp space-y-2.5 rounded-xl border border-line bg-white p-3 shadow-card">
          {RAG_FILTERS.map((group) => (
            <div key={group.facet} className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 w-16 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-faint">
                {t(group.labelKey)}
              </span>
              {group.options.map((opt) => {
                const on = value[group.facet] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => pick(group.facet, opt.value)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                      on
                        ? "border-blue bg-blue text-white"
                        : "border-line bg-white text-ink2 hover:border-blue hover:text-blue"
                    }`}
                  >
                    {t(opt.labelKey)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
