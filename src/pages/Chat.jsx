import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Mail, Loader2, RotateCcw } from "lucide-react";
import { THEMES } from "../constants.js";
import * as agentApi from "../api/agent.js";
import { useToast } from "../context/ToastContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import Card from "../components/ui/Card.jsx";
import { Textarea } from "../components/ui/Input.jsx";
import SendModal from "../components/SendModal.jsx";
import LanguageToggle from "../components/LanguageToggle.jsx";

export default function Chat() {
  const toast = useToast();
  const { lang, t } = useLanguage();
  const [messages, setMessages] = useState([{ role: "ai", text: t("chat.welcome") }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showThemes, setShowThemes] = useState(true);
  const [sendPayload, setSendPayload] = useState(null);
  const endRef = useRef(null);
  const taRef = useRef(null);

  // Keep the welcome bubble in sync with the chosen language while the thread is fresh.
  useEffect(() => {
    setMessages((m) => (m.length === 1 && m[0].role === "ai" ? [{ role: "ai", text: t("chat.welcome") }] : m));
  }, [lang, t]);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, busy]);

  function autosize() {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput("");
    setShowThemes(false);
    setMessages((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    requestAnimationFrame(autosize);
    try {
      const r = await agentApi.ask(q, { channel: "web", language: lang });
      const isAnswer = (r.response_type || "answer") === "answer";
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: r.answer,
          // Footer + "Email this" only make sense for a real analysis.
          meta: isAnswer ? { time: r.processing_time, sources: (r.sources || []).length } : null,
          recs: r.recommendations || [],
          question: q,
        },
      ]);
    } catch (e) {
      setMessages((m) => [...m, { role: "ai", error: true, text: e.message || t("chat.error") }]);
      toast.error(t("chat.requestFailed"));
    } finally {
      setBusy(false);
    }
  }

  // Phrasing matches prompts.py detect_question_request → routes to the
  // backend's QuestionGenerator for the mapped topic.
  const suggest = (theme) =>
    send(`Suggest some questions about ${theme.topic}.`);

  return (
    <div className="mx-auto flex h-[calc(100vh-9.5rem)] max-w-3xl flex-col md:h-[calc(100vh-7rem)]">
      <div className="flex items-end justify-between border-b border-line pb-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            <span className="h-px w-6 bg-gold" /> {t("chat.eyebrow")}
          </div>
          <h1 className="font-serif text-[2rem] font-semibold leading-tight text-ink">{t("chat.title")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="md:hidden">
            <LanguageToggle compact />
          </div>
          <button
            onClick={() => {
              setMessages([{ role: "ai", text: t("chat.welcome") }]);
              setShowThemes(true);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-muted hover:border-[#cdbf9d]"
          >
            <RotateCcw size={13} /> {t("chat.newThread")}
          </button>
        </div>
      </div>

      <div className="-mx-1 flex-1 space-y-4 overflow-y-auto px-1 py-5">
        {messages.map((m, i) => (
          <Bubble key={i} m={m} t={t} onSend={() => setSendPayload({ question: m.question, answer: m.text })} onRec={(r) => send(r)} />
        ))}

        {busy && (
          <div className="flex items-center gap-2 pl-1 text-sm text-muted">
            <Loader2 size={15} className="animate-spin text-blue" /> {t("chat.analyzing")}
          </div>
        )}

        {showThemes && <ThemesCard onPick={suggest} t={t} />}
        <div ref={endRef} />
      </div>

      {/* composer */}
      <div className="pt-2">
        <div className="flex items-end gap-2 rounded-2xl border border-line bg-white p-2 shadow-card focus-within:border-blue focus-within:ring-2 focus-within:ring-bluesoft">
          <Textarea
            ref={taRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autosize();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder={t("chat.composer.ph")}
            className="max-h-36 border-0 bg-transparent px-2 py-2 shadow-none focus:ring-0"
          />
          <button
            onClick={() => send()}
            disabled={busy || !input.trim()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink text-white transition hover:bg-[#1a2741] disabled:opacity-40"
            aria-label="Send message"
          >
            <Send size={17} />
          </button>
        </div>
      </div>

      {sendPayload && <SendModal payload={sendPayload} onClose={() => setSendPayload(null)} />}
    </div>
  );
}

function Bubble({ m, t, onSend, onRec }) {
  const isUser = m.role === "user";
  if (isUser)
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] animate-fadeUp rounded-2xl rounded-tr-md bg-ink px-4 py-3 text-sm leading-relaxed text-white">
          {m.text}
        </div>
      </div>
    );

  return (
    <div className="flex animate-fadeUp justify-start">
      <div className="max-w-[88%]">
        <div
          className={`rounded-2xl rounded-tl-md px-4 py-3.5 text-sm leading-relaxed shadow-card ${
            m.error ? "border border-[#f0c9c2] bg-[#fcefec] text-[#8a3325]" : "border-l-[3px] border-blue bg-white text-ink2"
          }`}
        >
          <div className="whitespace-pre-wrap">{m.text}</div>
          {m.meta && (
            <div className="mt-3 flex items-center gap-4 border-t border-line2 pt-2.5 font-mono text-[11px] text-muted">
              <span>⏱ {Number(m.meta.time || 0).toFixed(2)}s</span>
              <span>📚 {m.meta.sources} {t("chat.sources")}</span>
              <button onClick={onSend} className="ml-auto flex items-center gap-1.5 font-sans font-semibold text-blue hover:underline">
                <Mail size={13} /> {t("chat.emailThis")}
              </button>
            </div>
          )}
        </div>
        {m.recs?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {m.recs.map((r, i) => (
              <button
                key={i}
                onClick={() => onRec(r)}
                className="rounded-full border border-line bg-white px-3 py-1.5 text-xs text-muted transition hover:border-blue hover:text-blue"
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ThemesCard({ onPick, t }) {
  return (
    <Card rule className="animate-fadeUp p-5 pl-6">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gold">
        <Sparkles size={14} /> {t("chat.themesTitle")}
      </div>
      <p className="mt-1.5 text-sm text-muted">
        {t("chat.themesSub")}
      </p>
      <div className="mt-3.5 flex flex-wrap gap-2">
        {THEMES.map((theme) => {
          const Icon = theme.icon;
          return (
            <button
              key={theme.labelKey}
              onClick={() => onPick(theme)}
              className="group flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-[13px] font-medium text-ink2 transition hover:-translate-y-0.5 hover:border-blue hover:text-blue hover:shadow-card"
            >
              <Icon size={14} className="text-gold group-hover:text-blue" /> {t(theme.labelKey)}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
