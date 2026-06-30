import React, { useMemo, useState, useEffect } from "react";
import { Send, Search, PenLine, Users2, Check } from "lucide-react";
import Modal from "./ui/Modal.jsx";
import Button from "./ui/Button.jsx";
import { Input } from "./ui/Input.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import * as emailsApi from "../api/emails.js";
import * as agentApi from "../api/agent.js";

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// Manual send: deliver an analysis to your own typed emails OR contacts from the database.
export default function SendModal({ payload, onClose }) {
  const toast = useToast();
  const { lang, t, langName } = useLanguage();
  const [mode, setMode] = useState("own"); // 'own' (preference) | 'contacts' (database)
  const [contacts, setContacts] = useState([]);
  const [picked, setPicked] = useState(() => new Set());
  const [manual, setManual] = useState("");
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("");
  const [busy, setBusy] = useState(false);

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
    (c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.email.toLowerCase().includes(q.toLowerCase())
  );

  const manualList = useMemo(
    () => manual.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean),
    [manual]
  );
  const badManual = manualList.filter((e) => !isEmail(e));

  const recipients = useMemo(() => {
    if (mode === "own") return Array.from(new Set(manualList.filter(isEmail)));
    return Array.from(new Set(contacts.filter((c) => picked.has(c._id)).map((c) => c.email)));
  }, [mode, manualList, contacts, picked]);

  async function send() {
    if (!recipients.length) return toast.error(t("send.addRecipient"));
    if (mode === "own" && badManual.length) return toast.error(`Check these addresses: ${badManual.join(", ")}`);
    setBusy(true);
    try {
      await agentApi.batchEmail({
        question: payload.question,
        emails: recipients,
        subject: subject.trim() || undefined,
        language: lang,
      });
      toast.success(t("send.sent"));
      onClose();
    } catch (e) {
      toast.error(e.message || t("send.failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={t("send.title")} subtitle={t("send.desc")} onClose={onClose} width="max-w-lg">
      {/* mode switch */}
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-line2/50 p-1">
        <ModeTab active={mode === "own"} onClick={() => setMode("own")} icon={PenLine} label={t("send.myEmails")} sub={t("send.myEmails.sub")} />
        <ModeTab active={mode === "contacts"} onClick={() => setMode("contacts")} icon={Users2} label={t("send.fromContacts")} sub={t("send.fromContacts.sub", { n: contacts.length })} />
      </div>

      {mode === "own" ? (
        <div className="mt-4">
          <Input
            label={t("send.recipients")}
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="you@email.com, colleague@team.id"
            hint={t("send.emails.hint")}
            autoFocus
          />
          {badManual.length > 0 && (
            <p className="mt-1.5 text-[11px] font-medium text-[#b23b2e]">Not valid: {badManual.join(", ")}</p>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink2">Pick from your contacts</span>
            <div className="flex gap-3">
              <button onClick={() => setPicked(new Set(filtered.map((c) => c._id)))} className="text-[11px] font-semibold text-blue hover:underline">{t("common.all")}</button>
              <button onClick={() => setPicked(new Set())} className="text-[11px] font-semibold text-muted hover:underline">Clear</button>
            </div>
          </div>
          <div className="relative mt-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aab2bd]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("send.filterContacts")}
              className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue"
            />
          </div>
          <div className="mt-2 max-h-44 space-y-0.5 overflow-y-auto rounded-lg border border-line2 bg-white p-1">
            {filtered.length === 0 && <p className="px-2 py-3 text-xs text-muted">No saved contacts. Add them on the Recipients page.</p>}
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

      {/* optional subject */}
      <div className="mt-4">
        <Input
          label={`${t("send.subject")} (${t("common.optional")})`}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={t("send.subject.ph")}
          hint={t("send.emails.hint")}
        />
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-line2 pt-4">
        <span className="text-xs text-muted">
          {t("send.recipientCount", { n: recipients.length })} · 
          <span className="font-semibold text-ink">{langName()}</span>
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={send} loading={busy}>
            {!busy && <Send size={15} />} {t("send.submit")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ModeTab({ active, onClick, icon: Icon, label, sub }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition ${
        active ? "bg-white shadow-card" : "hover:bg-white/60"
      }`}
    >
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
