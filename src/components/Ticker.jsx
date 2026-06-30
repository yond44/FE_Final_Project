import React from "react";
import { TICKER } from "../constants.js";

// Signature element: a quiet broadsheet ticker tape across the very top.
// Illustrative figures — labelled as such — not a live market feed.
export default function Ticker() {
  const row = [...TICKER, ...TICKER];
  return (
    <div className="relative z-10 overflow-hidden border-b border-ink/10 bg-ink">
      <div className="flex w-max animate-ticker whitespace-nowrap py-2">
        {row.map(([sym, px, chg, up], i) => (
          <span key={i} className="mx-5 inline-flex items-center gap-2 font-mono text-[12px] tracking-tight">
            <span className="text-[#8aa0bd]">{sym}</span>
            <span className="text-white tnum">{px}</span>
            <span className={up ? "text-[#5fbd8a] tnum" : "text-[#e0876f] tnum"}>{chg}</span>
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-ink to-transparent" />
    </div>
  );
}
