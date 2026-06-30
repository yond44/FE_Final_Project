import React, { useState, useEffect } from "react";
import { Power, Copy, Globe, Workflow, Mail, ListChecks, Zap, Server, Key } from "lucide-react";
import * as agentApi from "../api/agent.js";
import * as emailsApi from "../api/emails.js";
import * as questionsApi from "../api/questions.js";
import { useToast } from "../context/ToastContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import Card from "../components/ui/Card.jsx";
import PageHead from "../components/ui/PageHead.jsx";

const STEPS = [
  ["auto.step1", "auto.step1d", Zap],
  ["auto.step2", "auto.step2d", ListChecks],
  ["auto.step3", "auto.step3d", Workflow],
  ["auto.step4", "auto.step4d", Mail],
];

export default function Automation() {
  const toast = useToast();
  const { lang, t } = useLanguage();
  const [armed, setArmed] = useState(false);
  const [recipients, setRecipients] = useState(0);
  const [queued, setQueued] = useState(0);
  const webhook = agentApi.automationWebhook(lang);

  useEffect(() => {
    emailsApi.list().then((r) => setRecipients((r.emails || []).length)).catch(() => {});
    questionsApi.list().then((r) => setQueued((r.questions || []).length)).catch(() => {});
  }, []);

  const copy = (t) => {
    navigator.clipboard?.writeText(t);
    toast.success(t("auto.copied"));
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHead
        eyebrow={t("auto.eyebrow")}
        title={t("auto.title")}
        desc={t("auto.desc")}
      />

      {/* master switch */}
      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 grid h-10 w-10 place-items-center rounded-xl ${armed ? "bg-blue text-white" : "bg-line2 text-muted"}`}>
              <Power size={19} />
            </div>
            <div>
              <div className="font-serif text-lg font-semibold text-ink">{t("auto.briefingTitle")}</div>
              <p className="mt-0.5 max-w-md text-sm text-muted">
                {t("auto.briefingSub")}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setArmed((a) => !a);
              toast[armed ? "info" : "success"](armed ? t("auto.pausedToast") : t("auto.armedToast"));
            }}
            className={`flex h-10 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-semibold transition ${
              armed ? "bg-blue text-white shadow-card" : "bg-ink text-white hover:bg-[#1a2741]"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${armed ? "animate-pulse2 bg-[#7fe0aa]" : "bg-[#8aa0bd]"}`} />
            {armed ? t("auto.armed") : t("auto.paused")}
          </button>
        </div>
        <div className="grid grid-cols-3 divide-x divide-line2 border-t border-line2 bg-[#FCFAF5]">
          <Stat label={t("auto.statRecipients")} value={recipients} />
          <Stat label={t("auto.statQueue")} value={queued} />
          <Stat label={t("auto.statMode")} value={t("auto.modeAuto")} gold />
        </div>
      </Card>

      {/* how it runs */}
      <h2 className="mt-8 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">
        <Workflow size={14} /> {t("auto.howTitle")}
      </h2>
      <ol className="mt-3 space-y-2.5">
        {STEPS.map(([titleKey, descKey, Icon], i) => (
          <li key={i}>
            <Card className="flex items-start gap-3.5 p-4">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink text-gold">
                <Icon size={17} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-faint">0{i + 1}</span>
                  <span className="text-sm font-semibold text-ink">{t(titleKey)}</span>
                </div>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{t(descKey)}</p>
              </div>
            </Card>
          </li>
        ))}
      </ol>

      {/* webhook config */}
      <h2 className="mt-8 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">
        <Globe size={14} /> {t("auto.webhookTitle")}
      </h2>
      <Card rule className="mt-3 p-5 pl-6">
        <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-ink2">
          <Server size={13} /> {t("auto.endpoint")}
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg bg-ink px-3 py-2.5 font-mono text-[12px] text-[#cfe0f2]">{webhook}</code>
          <button onClick={() => copy(webhook)} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-white hover:border-[#cdbf9d]">
            <Copy size={15} />
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <KV icon={Key} k="Header" v="X-API-Key: your_API_key" onCopy={() => copy("X-API-Key: your_API_key")} />
          <KV k="send_email" v="true → emails the whole list" />
          <KV k="Empty queue" v="auto-generates a question" />
          <KV k="Returns" v="question · response · queue_remaining" />
        </div>

        <p className="mt-4 rounded-lg bg-bluesoft px-3.5 py-3 text-[13px] leading-relaxed text-blue">
          {t("auto.tip")}
        </p>
      </Card>
    </div>
  );
}

function Stat({ label, value, gold }) {
  return (
    <div className="px-4 py-5 text-center">
      <div className={`font-serif text-[1.7rem] font-semibold leading-none ${gold ? "text-gold" : "text-ink"}`}>{value}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">{label}</div>
    </div>
  );
}

function KV({ icon: Icon, k, v, onCopy }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-line bg-[#FCFAF5] px-3 py-2.5">
      <span className="flex items-center gap-1.5 text-xs text-muted">
        {Icon && <Icon size={12} />} {k}
      </span>
      <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink2">
        {v}
        {onCopy && (
          <button onClick={onCopy} className="text-faint hover:text-blue"><Copy size={11} /></button>
        )}
      </span>
    </div>
  );
}
