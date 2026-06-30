import React from "react";

export default function PageHead({ eyebrow, title, desc, action }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-line pb-5">
      <div>
        {eyebrow && (
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            <span className="h-px w-6 bg-gold" />
            {eyebrow}
          </div>
        )}
        <h1 className="font-serif text-[2rem] font-semibold leading-tight text-ink">{title}</h1>
        {desc && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{desc}</p>}
      </div>
      {action}
    </div>
  );
}
