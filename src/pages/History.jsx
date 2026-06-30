import React, { useState, useEffect } from "react";
import { Mail, Clock, Globe, Layers, Inbox } from "lucide-react";
import * as agentApi from "../api/agent.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import Card from "../components/ui/Card.jsx";
import Empty from "../components/ui/Empty.jsx";
import PageHead from "../components/ui/PageHead.jsx";

const channelMeta = {
  webhook_queue: { labelKey: "hist.chAutomated", className: "bg-bluesoft text-blue", Icon: Globe },
  n8n: { labelKey: "hist.chAutomated", className: "bg-bluesoft text-blue", Icon: Globe },
  webhook: { labelKey: "hist.chAutomated", className: "bg-bluesoft text-blue", Icon: Globe },
  batch_email: { labelKey: "hist.chBatch", className: "bg-goldsoft text-[#8a6d12]", Icon: Layers },
  batch: { labelKey: "hist.chBatch", className: "bg-goldsoft text-[#8a6d12]", Icon: Layers },
  web: { labelKey: "hist.chChat", className: "bg-line2 text-muted", Icon: Mail },
  api: { labelKey: "hist.chApi", className: "bg-line2 text-muted", Icon: Mail },
};
const fallbackChannel = { labelKey: "hist.chOther", className: "bg-line2 text-muted", Icon: Mail };

export default function History() {
  const { t } = useLanguage();
  const [items, setItems] = useState(null);

  useEffect(() => {
    agentApi
      .history({ limit: 30 })
      .then((r) => {
        // /api/v1/history returns { histories: [...] }; tolerate other shapes too.
        const rows = r.histories || r.logs || r.queries || [];
        setItems(
          rows.map((q) => ({
            question: q.question || q.text || "(untitled)",
            at: q.created_at || q.timestamp || q.sent_at || q.date || "",
            recipients: q.recipient_count ?? (Array.isArray(q.recipients) ? q.recipients.length : q.recipients) ?? 0,
            time: q.processing_time ?? q.time,
            channel: q.channel || "web",
            success: (q.status ? q.status === "sent" || q.status === "success" : q.success !== false),
          }))
        );
      })
      .catch(() => setItems([]));
  }, []);

  const total = items?.length || 0;
  const delivered = items?.reduce((s, i) => s + (i.recipients || 0), 0) || 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHead eyebrow={t("hist.eyebrow")} title={t("hist.title")} desc={t("hist.desc")} />

      {items && items.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MiniStat label={t("hist.analyses")} value={total} />
          <MiniStat label={t("hist.delivered")} value={delivered} />
          <MiniStat label={t("hist.avgTime")} value={`${(items.reduce((s, i) => s + (i.time || 0), 0) / Math.max(total, 1)).toFixed(1)}s`} />
        </div>
      )}

      <Card className="mt-4 overflow-hidden">
        {items === null ? (
          <div className="space-y-px">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4">
                <div className="h-3 flex-1 animate-pulse2 rounded bg-line2" />
                <div className="h-3 w-16 animate-pulse2 rounded bg-line2" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <Empty icon={Inbox} title={t("hist.emptyTitle")}>{t("hist.emptyBody")}</Empty>
        ) : (
          <ul className="divide-y divide-line2">
            {items.map((it, i) => {
              const meta = channelMeta[it.channel] || fallbackChannel;
              const Icon = meta.Icon;
              return (
                <li key={i} className="flex items-center gap-4 px-4 py-3.5 hover:bg-paper/60">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}>
                        <Icon size={10} /> {t(meta.labelKey)}
                      </span>
                      {!it.success && <span className="text-[10px] font-semibold text-[#b23b2e]">{t("hist.failed")}</span>}
                    </div>
                    <div className="mt-1 truncate text-sm font-medium text-ink">{it.question}</div>
                    <div className="font-mono text-[11px] text-faint">{it.at}</div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 font-mono text-[11px] text-muted">
                    {it.time != null && (
                      <span className="flex items-center gap-1"><Clock size={11} /> {Number(it.time).toFixed(1)}s</span>
                    )}
                    {it.recipients > 0 && (
                      <span className="flex items-center gap-1"><Mail size={11} /> {it.recipients}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <Card className="px-4 py-3.5">
      <div className="font-serif text-2xl font-semibold leading-none text-ink">{value}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">{label}</div>
    </Card>
  );
}
