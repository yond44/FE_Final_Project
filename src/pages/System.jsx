import React, { useState, useEffect, useCallback } from "react";
import { Activity, RefreshCw, Trash2, Database, Layers, GitBranch, CheckCircle2, Circle, Loader2 } from "lucide-react";
import * as rag from "../api/rag.js";
import { RAG_FEATURES } from "../constants.js";
import { useToast } from "../context/ToastContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import PageHead from "../components/ui/PageHead.jsx";

const GROUPS = ["retrieval", "generation", "quality", "ops"];

export default function System() {
  const toast = useToast();
  const { t } = useLanguage();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStatus(await rag.ragStatus());
    } catch {
      toast.error(t("sys.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    load();
  }, [load]);

  const clearCache = async () => {
    setClearing(true);
    try {
      await rag.clearCache();
      toast.success(t("sys.cacheCleared"));
      load();
    } catch {
      toast.error(t("sys.cacheClearFailed"));
    } finally {
      setClearing(false);
    }
  };

  const features = status?.rag?.features || null;
  const retrieval = status?.rag?.retrieval || {};
  const cache = status?.cache || {};
  const prompts = status?.prompts || {};
  const ragUp = status?.rag?.initialized;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHead
        eyebrow={t("sys.eyebrow")}
        title={t("sys.title")}
        desc={t("sys.desc")}
        action={
          <Button variant="outline" size="sm" onClick={load} loading={loading}>
            <RefreshCw size={14} /> {t("sys.refresh")}
          </Button>
        }
      />

      {loading && !status ? (
        <div className="grid place-items-center py-24">
          <Loader2 className="animate-spin text-blue" size={26} />
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {/* status strip */}
          <div className="flex flex-wrap gap-2">
            <Pill ok={status?.agent?.initialized} label={t("sys.agent")} />
            <Pill ok={ragUp} label={t("sys.rag")} />
            {status?.rag?.collection && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 font-mono text-[11px] text-muted">
                <Database size={12} className="text-gold" /> {status.rag.collection}
              </span>
            )}
          </div>

          {/* features */}
          <Card rule className="p-5 pl-6">
            <SectionTitle icon={Activity}>{t("sys.features")}</SectionTitle>
            <div className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {GROUPS.map((group) => {
                const items = RAG_FEATURES.filter((f) => f.group === group);
                if (!items.length) return null;
                return (
                  <div key={group}>
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                      {t(`feat.group.${group}`)}
                    </div>
                    <ul className="space-y-2">
                      {items.map((f) => {
                        const on = features ? !!features[f.key] : true;
                        return (
                          <li key={f.key} className="flex items-start gap-2">
                            {on ? (
                              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#2f7d5b]" />
                            ) : (
                              <Circle size={15} className="mt-0.5 shrink-0 text-faint" />
                            )}
                            <div>
                              <div className={`text-sm font-medium ${on ? "text-ink2" : "text-faint"}`}>
                                {t(f.labelKey)}
                              </div>
                              <div className="text-[11px] leading-snug text-muted">{t(f.descKey)}</div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* two-tier cache + retrieval config */}
          <div className="grid gap-5 md:grid-cols-2">
            <Card className="p-5">
              <SectionTitle icon={Database}>{t("sys.cache")}</SectionTitle>
              <p className="mt-1 text-[11px] text-muted">{t("sys.cache.sub")}</p>
              <div className="mt-3 space-y-2.5">
                <CacheRow label={t("sys.cache.exact")} data={cache.exact} />
                <CacheRow label={t("sys.cache.semantic")} data={cache.semantic} />
              </div>
              <Button variant="outline" size="sm" className="mt-4" onClick={clearCache} loading={clearing}>
                <Trash2 size={14} /> {t("sys.clearCache")}
              </Button>
            </Card>

            <Card className="p-5">
              <SectionTitle icon={Layers}>{t("sys.retrieval")}</SectionTitle>
              <p className="mt-1 text-[11px] text-muted">{t("sys.retrieval.sub")}</p>
              <dl className="mt-3 space-y-2 text-sm">
                <ConfigRow k={t("sys.retrieval.alpha")} v={fmt(retrieval.hybrid_alpha)} />
                <ConfigRow k={t("sys.retrieval.topk")} v={fmt(retrieval.top_k)} />
                <ConfigRow k={t("sys.retrieval.rerank")} v={retrieval.rerank_model || "—"} mono />
              </dl>
            </Card>
          </div>

          {/* prompt registry (A/B + canary weights) */}
          {Object.keys(prompts).length > 0 && (
            <Card className="p-5">
              <SectionTitle icon={GitBranch}>{t("sys.prompts")}</SectionTitle>
              <p className="mt-1 text-[11px] text-muted">{t("sys.prompts.sub")}</p>
              <div className="mt-3 space-y-3">
                {Object.entries(prompts).map(([family, versions]) => (
                  <div key={family}>
                    <div className="mb-1 font-mono text-xs text-ink2">{family}</div>
                    <div className="space-y-1.5">
                      {(versions || []).map((v) => {
                        const pct = Math.round((v.weight ?? 0) * 100);
                        return (
                          <div key={v.version} className="flex items-center gap-3">
                            <span className="w-8 font-mono text-xs text-muted">{v.version}</span>
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-line2">
                              <div
                                className={`h-full rounded-full ${pct > 0 ? "bg-blue" : ""}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-10 text-right font-mono text-xs text-muted">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function fmt(v) {
  return v === undefined || v === null || v === "" ? "—" : String(v);
}

function Pill({ ok, label }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold"
      style={
        ok
          ? { color: "#2f7d5b", background: "#eaf5ee", borderColor: "#cfe7d7" }
          : { color: "#9a6b12", background: "#FBF3DE", borderColor: "#ecd9a8" }
      }
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: ok ? "#2f7d5b" : "#9a6b12" }} />
      {label}
    </span>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gold">
      <Icon size={14} /> {children}
    </div>
  );
}

function CacheRow({ label, data }) {
  const d = data || {};
  const rate = d.hit_rate ?? computeRate(d.hits, d.misses);
  return (
    <div className="flex items-center justify-between rounded-lg border border-line2 bg-[#fcfbf7] px-3 py-2">
      <span className="text-xs font-medium text-ink2">{label}</span>
      <div className="flex items-center gap-3 font-mono text-[11px] text-muted">
        <span>{rate ?? "—"}</span>
        <span className="text-faint">·</span>
        <span>{d.size != null ? `${d.size} keys` : "—"}</span>
      </div>
    </div>
  );
}

function computeRate(hits, misses) {
  if (hits == null || misses == null) return null;
  const total = hits + misses;
  if (!total) return "0%";
  return `${((hits / total) * 100).toFixed(1)}%`;
}

function ConfigRow({ k, v, mono }) {
  return (
    <div className="flex items-center justify-between border-b border-line2 pb-2 last:border-0 last:pb-0">
      <dt className="text-muted">{k}</dt>
      <dd className={`text-ink2 ${mono ? "font-mono text-[11px]" : "font-medium"}`}>{v}</dd>
    </div>
  );
}
