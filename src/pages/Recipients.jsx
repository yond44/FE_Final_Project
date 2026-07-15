import React, { useState, useEffect } from "react";
import { Plus, Trash2, Search, Copy, Mail, Pencil, Check, X } from "lucide-react";
import * as emailsApi from "../api/emails.js";
import { useToast } from "../context/ToastContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import { Input } from "../components/ui/Input.jsx";
import Empty from "../components/ui/Empty.jsx";
import PageHead from "../components/ui/PageHead.jsx";

export default function Recipients() {
  const toast = useToast();
  const { t } = useLanguage();
  const [rows, setRows] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => emailsApi.list().then((r) => setRows(r.emails || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const filtered = rows.filter(
    (e) => e.name.toLowerCase().includes(q.toLowerCase()) || e.email.toLowerCase().includes(q.toLowerCase())
  );

  async function add() {
    if (!name.trim() || !email.trim()) return toast.error(t("rec.nameEmailReq"));
    setBusy(true);
    try {
      await emailsApi.create(name.trim(), email.trim());
      setName(""); setEmail("");
      await load();
      toast.success(t("rec.added"));
    } catch (e) {
      toast.error(e.message || t("rec.addFail"));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    const prev = rows;
    setRows((r) => r.filter((e) => e._id !== id));
    try {
      await emailsApi.remove(id);
      toast.success(t("rec.removed"));
    } catch {
      setRows(prev);
      toast.error(t("rec.deleteFail"));
    }
  }

  async function copyAll() {
    try {
      const { email_string } = await emailsApi.asString();
      await navigator.clipboard.writeText(email_string);
      toast.success(t("rec.copied"));
    } catch {
      toast.error(t("rec.copyFail"));
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHead
        eyebrow={t("rec.eyebrow")}
        title={t("rec.title")}
        desc={t("rec.desc")}
        action={
          <Button variant="outline" size="sm" onClick={copyAll}>
            <Copy size={14} /> {t("rec.copyList")}
          </Button>
        }
      />

      <Card className="mt-6 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("rec.name")} />
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder={t("rec.email.ph")}
            type="email"
          />
          <Button onClick={add} loading={busy} className="sm:w-auto">
            {!busy && <Plus size={16} />} {t("rec.addRecipient")}
          </Button>
        </div>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <div className="relative w-full max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aab2bd]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("rec.searchRecipients")}
            className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-bluesoft"
          />
        </div>
        <span className="text-xs font-medium text-muted">{filtered.length} {t("common.of")} {rows.length}</span>
      </div>

      <Card className="mt-3 overflow-hidden">
        {filtered.length === 0 ? (
          <Empty icon={Mail} title={t("rec.emptyTitle")}>{t("rec.emptyBody")}</Empty>
        ) : (
          <ul className="divide-y divide-line2">
            {filtered.map((e) => (
              <li key={e._id} className="flex items-center gap-3 px-4 py-3 hover:bg-paper/60">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-bluesoft font-serif text-sm font-semibold text-blue">
                  {e.name.charAt(0).toUpperCase()}
                </div>
                {editing === e._id ? (
                  <InlineEdit
                    row={e}
                    onCancel={() => setEditing(null)}
                    onSave={async (n, m) => {
                      await emailsApi.update(e._id, n, m);
                      setEditing(null);
                      await load();
                      toast.success(t("rec.updated"));
                    }}
                  />
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink">{e.name}</div>
                      <div className="truncate font-mono text-[12px] text-muted">{e.email}</div>
                    </div>
                    <button onClick={() => setEditing(e._id)} className="rounded-lg p-2 text-faint hover:bg-line2 hover:text-ink">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(e._id)} className="rounded-lg p-2 text-faint hover:bg-[#fcefec] hover:text-[#b23b2e]">
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function InlineEdit({ row, onSave, onCancel }) {
  const [n, setN] = useState(row.name);
  const [m, setM] = useState(row.email);
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-1 items-center gap-2">
      <input value={n} onChange={(e) => setN(e.target.value)} className="w-32 rounded-md border border-line px-2 py-1.5 text-sm outline-none focus:border-blue" />
      <input value={m} onChange={(e) => setM(e.target.value)} className="flex-1 rounded-md border border-line px-2 py-1.5 font-mono text-[12px] outline-none focus:border-blue" />
      <button
        onClick={async () => { setBusy(true); try { await onSave(n.trim(), m.trim()); } finally { setBusy(false); } }}
        disabled={busy}
        className="rounded-lg bg-blue p-2 text-white hover:bg-[#155088]"
      >
        <Check size={15} />
      </button>
      <button onClick={onCancel} className="rounded-lg p-2 text-faint hover:bg-line2"><X size={15} /></button>
    </div>
  );
}
