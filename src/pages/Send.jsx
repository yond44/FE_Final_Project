import React, { useState, useEffect, useMemo } from "react";
import {
  Send as SendIcon, Search, PenLine, Users2, Check, Phone,
  CheckCircle2, XCircle, Mail, Server
} from "lucide-react";
import * as agentApi from "../api/agent.js";
import * as emailsApi from "../api/emails.js";
import { useToast } from "../context/ToastContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import { Input, Textarea } from "../components/ui/Input.jsx";
import PageHead from "../components/ui/PageHead.jsx";

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// Dedicated manual-send page: type a question, choose recipients (own emails or
// saved contacts), send via the direct API, and see per-recipient results.
export default function Send() {
  const toast = useToast();
  const { lang, t, langName } = useLanguage();

  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState("own"); // 'own' | 'contacts'
  const [contacts, setContacts] = useState([]);
  const [picked, setPicked] = useState(() => new Set());
  const [manual, setManual] = useState("");
  const [filter, setFilter] = useState("");
  const [subject, setSubject] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    emailsApi.list().then((r) => setContacts(r.emails || [])).catch(() => {});
  }, []);

  const toggle = (id) =>
    setPicked((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const filtered = contacts.filter(
    (c) => c.name.toLowerCase().includes(filter.toLowerCase()) || c.email.toLowerCase().includes(filter.toLowerCase())
  );
  const manualList = useMemo(() => manual.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean), [manual]);
  const badManual = manualList.filter((e) => !isEmail(e));

  const recipients = useMemo(() => {
    if (mode === "own") return Array.from(new Set(manualList.filter(isEmail)));
    return Array.from(new Set(contacts.filter((c) => picked.has(c._id)).map((c) => c.email)));
  }, [mode, manualList, contacts, picked]);

  const canSend = question.trim().length >= 5 && recipients.length > 0 && !busy;

  async function submit() {
    if (question.trim().length < 5) return toast.error(t("send.writeFirst"));
    if (!recipients.length) return toast.error(t("send.addRecipient"));
    if (mode === "own" && badManual.length) return toast.error(t("send.notValid", { list: badManual.join(", ") }));

    setBusy(true);
    setResult(null);
    try {
      const data = await agentApi.batchEmail({
        question,
        emails: recipients,
        subject: subject.trim() || undefined,
        language: lang,
        phone,
      });
      const sent = data.sent_count ?? data.recipients ?? recipients.length;
      const failed = data.failed_emails || [];
      setResult({
        ok: true,
        total: data.total_recipients ?? recipients.length,
        sent,
        failed,
        simulated: data.simulated || false,
        recipients,
        message: data.message,
      });
      toast.success(t("send.sent"));
    } catch (e) {
      setResult({ ok: false, error: e.message || t("send.failed"), recipients });
      toast.error(e.message || t("send.failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHead eyebrow={t("send.eyebrow")} title={t("send.title")} desc={t("send.desc")} />

      {/* question */}
      <Card rule className="mt-6 p-5 pl-6">
        <label className="mb-1.5 block text-xs font-semibold text-ink2">{t("send.question")}</label>
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          placeholder={t("send.question.ph")}
          className="min-h-[84px]"
        />
        <p className="mt-1.5 text-[11px] text-faint">{t("send.question.hint", { lang: langName() })}</p>
      </Card>

      {/* recipients */}
      <div className="mt-5">
        <SectionLabel icon={Mail}>{t("send.recipients")}</SectionLabel>
        <Card className="mt-2 p-4">
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-line2/50 p-1">
            <ModeTab active={mode === "own"} onClick={() => setMode("own")} icon={PenLine} label={t("send.myEmails")} sub={t("send.myEmails.sub")} />
            <ModeTab active={mode === "contacts"} onClick={() => setMode("contacts")} icon={Users2} label={t("send.fromContacts")} sub={t("send.fromContacts.sub", { n: contacts.length })} />
          </div>

          {mode === "own" ? (
            <div className="mt-3">
              <Input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder={t("send.emails.ph")}
                hint={t("send.emails.hint")}
              />
              {badManual.length > 0 && (
                <p className="mt-1.5 text-[11px] font-medium text-[#b23b2e]">{t("send.notValid", { list: badManual.join(", ") })}</p>
              )}
            </div>
          ) : (
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aab2bd]" />
                  <input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder={t("send.filterContacts")}
                    className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue"
                  />
                </div>
                <div className="ml-3 flex gap-3">
                  <button onClick={() => setPicked(new Set(filtered.map((c) => c._id)))} className="text-[11px] font-semibold text-blue hover:underline">{t("common.all")}</button>
                  <button onClick={() => setPicked(new Set())} className="text-[11px] font-semibold text-muted hover:underline">{t("common.clear")}</button>
                </div>
              </div>
              <div className="mt-2 max-h-48 space-y-0.5 overflow-y-auto rounded-lg border border-line2 bg-white p-1">
                {filtered.length === 0 && <p className="px-2 py-3 text-xs text-muted">{t("send.noContacts")}</p>}
                {filtered.map((c) => {
                  const on = picked.has(c._id);
                  return (
                    <button
                      key={c._id}
                      onClick={() => toggle(c._id)}
                      className={`flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition ${on ? "bg-bluesoft" : "hover:bg-paper"}`}
                    >
                      <span className={`grid h-4 w-4 place-items-center rounded border ${on ? "border-blue bg-blue text-white" : "border-line bg-white"}`}>
                        {on && <Check size={11} />}
                      </span>
                      <span className="text-sm font-medium text-ink">{c.name}</span>
                      <span className="ml-auto font-mono text-[11px] text-muted">{c.email}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* options */}
      <div className="mt-5">
        <SectionLabel icon={Server}>{t("send.options")}</SectionLabel>
        <Card className="mt-2 grid gap-3 p-4 sm:grid-cols-2">
          <Input
            label={`${t("send.subject")} (${t("common.optional")})`}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t("send.subject.ph")}
          />
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink2">
              <Phone size={12} /> {t("send.phone")} ({t("common.optional")})
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("send.phone.ph")}
              hint={t("send.phone.hint")}
            />
          </div>
        </Card>
      </div>

      {/* submit */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <span className="text-sm text-muted">
          {t("send.recipientCount", { n: recipients.length })} · <span className="font-semibold text-ink">{langName()}</span>
        </span>
        <Button onClick={submit} loading={busy} disabled={!canSend} size="md">
          {!busy && <SendIcon size={16} />} {t("send.submit")}
        </Button>
      </div>

      {/* result */}
      {result && <ResultPanel result={result} t={t} />}
    </div>
  );
}

function ResultPanel({ result, t }) {
  if (!result.ok) {
    return (
      <Card className="mt-5 border-[#f0c9c2] bg-[#fcefec] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#8a3325]">
          <XCircle size={16} /> {t("send.failed")}
        </div>
        <p className="mt-1 text-sm text-[#8a3325]">{result.error}</p>
      </Card>
    );
  }
  return (
    <Card rule className="mt-5 animate-fadeUp p-5 pl-6">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <CheckCircle2 size={17} className="text-blue" /> {t("send.result.sentVia")}
      </div>
      {result.simulated && (
        <p className="mt-2 rounded-lg bg-goldsoft px-3 py-2 text-[12px] text-[#8a6d12]">
          {t("send.result.simulated")}
        </p>
      )}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Metric label={t("send.result.recipients")} value={result.total} />
        <Metric label={t("send.result.sentCount")} value={result.sent} good />
        <Metric label={t("send.result.failedCount")} value={result.failed.length} bad={result.failed.length > 0} />
      </div>
      <div className="mt-3 space-y-1">
        {result.recipients.map((e) => {
          const failed = result.failed.includes(e);
          return (
            <div key={e} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">
              {failed ? <XCircle size={14} className="text-[#b23b2e]" /> : <CheckCircle2 size={14} className="text-blue" />}
              <span className="font-mono text-[12px] text-ink2">{e}</span>
              <span className={`ml-auto text-[11px] font-semibold ${failed ? "text-[#b23b2e]" : "text-blue"}`}>
                {failed ? t("send.result.statusFailed") : t("send.result.statusSent")}
              </span>
            </div>
          );
        })}
      </div>
      {result.message && <p className="mt-2 text-[12px] text-muted">{result.message}</p>}
    </Card>
  );
}

function Metric({ label, value, good, bad }) {
  return (
    <div className={`rounded-lg border p-3 text-center ${bad ? "border-[#f0c9c2] bg-[#fcefec]" : good ? "border-bluesoft bg-bluesoft" : "border-line bg-[#FCFAF5]"}`}>
      <div className={`font-serif text-2xl font-semibold leading-none ${bad ? "text-[#b23b2e]" : good ? "text-blue" : "text-ink"}`}>{value}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">{label}</div>
    </div>
  );
}

function ModeTab({ active, onClick, icon: Icon, label, sub }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition ${active ? "bg-white shadow-card" : "hover:bg-white/60"}`}>
      <span className={`grid h-8 w-8 place-items-center rounded-lg ${active ? "bg-ink text-gold" : "bg-line2 text-muted"}`}>
        <Icon size={16} />
      </span>
      <span>
        <span className={`block text-sm font-semibold ${active ? "text-ink" : "text-muted"}`}>{label}</span>
        <span className="block text-[11px] text-faint">{sub}</span>
      </span>
    </button>
  );
}

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">
      <Icon size={14} /> {children}
    </div>
  );
}
