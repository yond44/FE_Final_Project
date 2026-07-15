import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, Shield, FileText, ChevronDown, Zap, Database, Search } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";

// Normalise the many possible groundedness shapes into { score, grounded, reason }.
function readGroundedness(g) {
  if (!g) return null;
  const score =
    g.score ?? g.groundedness_score ?? g.grounded_ratio ?? (g.grounded ? 0.9 : 0.4);
  const grounded = g.grounded ?? score >= 0.5;
  const reason = g.reason || g.explanation || g.detail || "";
  return { score: Number(score), grounded, reason };
}

function groundTone(score) {
  if (score >= 0.75) return { color: "#2f7d5b", bg: "#eaf5ee", Icon: ShieldCheck, key: "insight.ground.high" };
  if (score >= 0.5) return { color: "#9a6b12", bg: "#FBF3DE", Icon: Shield, key: "insight.ground.mid" };
  return { color: "#b23b2e", bg: "#fcefec", Icon: ShieldAlert, key: "insight.ground.low" };
}

// Pull display fields out of a source dict regardless of backend shape.
function readSource(s) {
  const m = s.metadata || {};
  return {
    file: s.file || s.file_name || s.source || m.file_name || m.file || "source",
    type: s.chunk_type || s.type || m.chunk_type || "",
    score: s.score ?? s.relevance ?? s.rerank_score,
    preview: s.preview || s.text || s.snippet || s.content || "",
  };
}

export default function AnswerInsights({ m }) {
  const { t } = useLanguage();
  const [openSources, setOpenSources] = useState(false);

  const g = readGroundedness(m.groundedness);
  const sources = Array.isArray(m.sources) ? m.sources : [];
  const rewritten =
    m.rewrittenQuery && m.question && m.rewrittenQuery.trim() !== m.question.trim()
      ? m.rewrittenQuery
      : null;

  const hasBadges = g || m.promptVersion || m.cached || m.streamed || sources.length;
  if (!hasBadges && !rewritten) return null;

  const gt = g ? groundTone(g.score) : null;

  return (
    <div className="mt-2.5 space-y-2">
      {/* signal badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        {g && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold"
            style={{ color: gt.color, background: gt.bg }}
            title={g.reason || undefined}
          >
            <gt.Icon size={12} />
            {t(gt.key)} · {Math.round(g.score * 100)}%
          </span>
        )}
        {m.promptVersion && (
          <span className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2 py-1 font-mono text-[11px] text-muted">
            <Zap size={11} className="text-gold" /> {t("insight.prompt")} {m.promptVersion}
          </span>
        )}
        {m.cached && (
          <span className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2 py-1 text-[11px] text-muted">
            <Database size={11} className="text-blue" /> {t("insight.cached")}
          </span>
        )}
        {m.streamed && (
          <span className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2 py-1 text-[11px] text-muted">
            {t("insight.streamed")}
          </span>
        )}
      </div>

      {/* query rewriting */}
      {rewritten && (
        <div className="flex items-start gap-1.5 text-[11px] text-muted">
          <Search size={12} className="mt-0.5 shrink-0 text-faint" />
          <span>
            {t("insight.rewritten")} <span className="italic text-ink2">"{rewritten}"</span>
          </span>
        </div>
      )}

      {/* sources */}
      {sources.length > 0 && (
        <div className="rounded-lg border border-line2 bg-[#fcfbf7]">
          <button
            type="button"
            onClick={() => setOpenSources((o) => !o)}
            className="flex w-full items-center gap-2 px-3 py-2 text-[11px] font-semibold text-ink2"
          >
            <FileText size={12} className="text-gold" />
            {t("insight.sources", { n: sources.length })}
            <ChevronDown
              size={13}
              className={`ml-auto text-faint transition ${openSources ? "rotate-180" : ""}`}
            />
          </button>
          {openSources && (
            <ul className="space-y-1.5 border-t border-line2 px-3 py-2.5">
              {sources.map((s, i) => {
                const src = readSource(s);
                return (
                  <li key={i} className="text-[11px] leading-relaxed">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-ink2">{src.file}</span>
                      {src.type && (
                        <span className="rounded bg-line2 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-faint">
                          {src.type}
                        </span>
                      )}
                      {src.score != null && (
                        <span className="ml-auto font-mono text-faint">
                          {Number(src.score).toFixed(2)}
                        </span>
                      )}
                    </div>
                    {src.preview && <p className="mt-0.5 text-muted">{src.preview}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
