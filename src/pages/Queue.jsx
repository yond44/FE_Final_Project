import React, { useState, useEffect } from "react";
import { Plus, Sparkles, X, ListChecks, CheckCircle2, ArrowDown } from "lucide-react";
import * as questionsApi from "../api/questions.js";
import { useToast } from "../context/ToastContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import { Input } from "../components/ui/Input.jsx";
import Empty from "../components/ui/Empty.jsx";
import PageHead from "../components/ui/PageHead.jsx";

export default function Queue() {
  const toast = useToast();
  const { t } = useLanguage();
  const [queue, setQueue] = useState([]);
  const [archive, setArchive] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [genBusy, setGenBusy] = useState(false);

  const load = async () => {
    const [q, a] = await Promise.all([questionsApi.list(), questionsApi.archive()]);
    setQueue((q.questions || []).map(questionsApi.norm));
    setArchive(a.archive || []);
  };
  useEffect(() => { load().catch(() => {}); }, []);

  async function add() {
    const t = text.trim();
    if (t.length < 5) return toast.error(t("queue.tooShort"));
    setBusy(true);
    try {
      await questionsApi.add(t);
      setText("");
      await load();
      toast.success(t("queue.added"));
    } catch (e) {
      toast.error(e.message || t("queue.addFail"));
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    setGenBusy(true);
    try {
      await questionsApi.generate();
      await load();
      toast.success(t("queue.generated"));
    } catch (e) {
      toast.error(e.message || t("queue.genFail"));
    } finally {
      setGenBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHead
        eyebrow={t("queue.eyebrow")}
        title={t("queue.title")}
        desc={t("queue.desc")}
      />

      <Card rule className="mt-6 p-4 pl-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder={t("queue.write.ph")}
            className="flex-1"
          />
          <div className="flex gap-2">
            <Button onClick={add} loading={busy}>{!busy && <Plus size={16} />} {t("common.add")}</Button>
            <Button variant="gold" onClick={generate} loading={genBusy}>
              {!genBusy && <Sparkles size={16} />} {t("queue.generate")}
            </Button>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-faint">{t("queue.generateHint")}</p>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* queue */}
        <div className="lg:col-span-3">
          <SectionTitle icon={ListChecks} count={queue.length}>{t("queue.upNext")}</SectionTitle>
          <Card className="mt-2 overflow-hidden">
            {queue.length === 0 ? (
              <Empty icon={ListChecks} title={t("queue.emptyTitle")}>{t("queue.emptyBody")}</Empty>
            ) : (
              <ul>
                {queue.map((qq, i) => (
                  <li key={i} className="group relative flex items-start gap-3 border-b border-line2 px-4 py-3.5 last:border-0 hover:bg-paper/60">
                    <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${i === 0 ? "bg-gold text-white" : "bg-ink text-gold"}`}>
                      {i + 1}
                    </span>
                    <p className="flex-1 text-sm leading-snug text-ink2">{qq}</p>
                    {i === 0 && (
                      <span className="hidden shrink-0 items-center gap-1 rounded-full bg-goldsoft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8a6d12] sm:flex">
                        <ArrowDown size={10} /> {t("queue.nextOut")}
                      </span>
                    )}
                    <button
                      onClick={() => setQueue((q) => q.filter((_, idx) => idx !== i))}
                      className="rounded p-1 text-faint opacity-0 transition group-hover:opacity-100 hover:text-[#b23b2e]"
                    >
                      <X size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* archive */}
        <div className="lg:col-span-2">
          <SectionTitle icon={CheckCircle2} count={archive.length}>{t("queue.archived")}</SectionTitle>
          <Card className="mt-2 overflow-hidden">
            {archive.length === 0 ? (
              <Empty icon={CheckCircle2} title={t("queue.archiveEmptyTitle")}>{t("queue.archiveEmptyBody")}</Empty>
            ) : (
              <ul>
                {archive.map((a, i) => (
                  <li key={i} className="border-b border-line2 px-4 py-3 last:border-0">
                    <p className="text-sm leading-snug text-muted">{questionsApi.norm(a)}</p>
                    {a.at && <span className="mt-0.5 block font-mono text-[10px] text-faint">{a.at}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, count, children }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">
      <Icon size={14} /> {children}
      <span className="rounded-full bg-line2 px-1.5 py-0.5 font-mono text-[10px] text-ink2">{count}</span>
    </div>
  );
}
