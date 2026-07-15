import React, { useState, useEffect, useCallback } from "react";
import {
  Workflow, Mail, ListChecks, Server, Plug, Trash2, RefreshCw,
  ShieldCheck, ShieldAlert, Loader2, Zap, Rocket, Link2,
} from "lucide-react";
import * as n8nApi from "../api/n8n.js";
import * as emailsApi from "../api/emails.js";
import * as questionsApi from "../api/questions.js";
import { useToast } from "../context/ToastContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import Card from "../components/ui/Card.jsx";
import PageHead from "../components/ui/PageHead.jsx";
import Button from "../components/ui/Button.jsx";
import { Input, PasswordInput } from "../components/ui/Input.jsx";

const STEPS = [
  ["auto.step1", "auto.step1d", Zap],
  ["auto.step2", "auto.step2d", ListChecks],
  ["auto.step3", "auto.step3d", Workflow],
  ["auto.step4", "auto.step4d", Mail],
];

const SCHEDULES = [
  { cron: "0 8 * * *", labelKey: "auto.sched.daily" },
  { cron: "0 * * * *", labelKey: "auto.sched.hourly" },
  { cron: "0 */6 * * *", labelKey: "auto.sched.six" },
  // 6-field cron (with seconds) — n8n's schedule trigger supports it. Test only.
  { cron: "*/30 * * * * *", labelKey: "auto.sched.test30" },
];

export default function Automation() {
  const toast = useToast();
  const { t } = useLanguage();

  const [st, setSt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [busyKey, setBusyKey] = useState(null);
  const [recipients, setRecipients] = useState(0);
  const [queued, setQueued] = useState(0);

  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [connMode, setConnMode] = useState("default");   // "default" | "custom"
  const [template, setTemplate] = useState("economic-report");
  const [cron, setCron] = useState("0 8 * * *");
  const [emailLang, setEmailLang] = useState("en");       // bahasa email workflow
  const [smtpMode, setSmtpMode] = useState("default");     // "default" | "custom" | "none"

  // Optional SMTP block — when filled, the backend creates the credential on
  // the user's n8n and attaches it to the Email Send node at deploy time.
  const [smtpOpen, setSmtpOpen] = useState(false);
  const [smtp, setSmtp] = useState({ host: "", port: "465", user: "", password: "", from_email: "" });
  const smtpFilled = smtp.host.trim() && smtp.user.trim() && smtp.password.trim();
  const setSmtpField = (k) => (e) => setSmtp((s) => ({ ...s, [k]: e.target.value }));

  const load = useCallback(async () => {
    try {
      const s = await n8nApi.status();
      setSt(s);
      const tpls = s?.available_templates || [];
      if (tpls.length && !tpls.includes(template)) setTemplate(tpls[0]);
    } catch {
      toast.error(t("auto.n8n.loadFailed"));
    } finally {
      setLoading(false);
    }
    emailsApi.list().then((r) => setRecipients((r.emails || []).length)).catch(() => {});
    questionsApi.list().then((r) => setQueued((r.questions || []).length)).catch(() => {});
  }, [toast, t, template]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cred = st?.credential || {};
  const connected = !!cred.connected;
  const workflows = st?.workflows || [];
  const templates = st?.available_templates?.length ? st.available_templates : ["economic-report"];

  async function connect() {
    if (connMode === "custom" && (!baseUrl.trim() || !apiKey.trim())) return;
    setSaving(true);
    try {
      const r = connMode === "default"
        ? await n8nApi.useDefaultCredentials()
        : await n8nApi.saveCredentials(baseUrl.trim(), apiKey.trim());
      setApiKey("");
      if (r.verified === false || r.warning) toast.info(t("auto.n8n.unverifiedToast"));
      else toast.success(t("auto.n8n.savedToast"));
      await load();
    } catch (e) {
      toast.error(e.message || t("auto.n8n.connectFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    setSaving(true);
    try {
      await n8nApi.deleteCredentials();
      toast.info(t("auto.n8n.disconnectedToast"));
      await load();
    } catch (e) {
      toast.error(e.message || t("auto.n8n.connectFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function deployWf() {
    setDeploying(true);
    try {
      const smtpBody = smtpMode === "custom" && smtpFilled
        ? {
            host: smtp.host.trim(),
            port: Number(smtp.port) || 465,
            user: smtp.user.trim(),
            password: smtp.password,
            secure: (Number(smtp.port) || 465) === 465,
            from_email: smtp.from_email.trim() || smtp.user.trim(),
          }
        : null;
      const r = await n8nApi.deploy(template, cron, {
        smtp: smtpBody,
        language: emailLang,
        useDefaultSmtp: smtpMode === "default",
      });
      // Write-only secret: never keep the password in state after deploy.
      setSmtp((s) => ({ ...s, password: "" }));
      toast.success(r.smtp_attached ? t("auto.n8n.deployedSmtpToast") : t("auto.n8n.deployedToast"));
      await load();
    } catch (e) {
      toast.error(e.message || t("auto.n8n.deployFailed"));
    } finally {
      setDeploying(false);
    }
  }

  async function toggle(key, next) {
    setBusyKey(key);
    setSt((s) => ({ ...s, workflows: s.workflows.map((w) => (w.workflow_key === key ? { ...w, active: next } : w)) }));
    try {
      await n8nApi.setActive(key, next);
      toast.success(next ? t("auto.n8n.activatedToast") : t("auto.n8n.deactivatedToast"));
      await load();
    } catch (e) {
      toast.error(e.message || t("auto.n8n.toggleFailed"));
      await load();
    } finally {
      setBusyKey(null);
    }
  }

  async function removeWf(key) {
    setBusyKey(key);
    try {
      await n8nApi.deleteWorkflow(key);
      toast.info(t("auto.n8n.removedToast"));
      await load();
    } catch (e) {
      toast.error(e.message || t("auto.n8n.toggleFailed"));
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHead eyebrow={t("auto.eyebrow")} title={t("auto.title")} desc={t("auto.desc")} />

      {loading && !st ? (
        <div className="grid place-items-center py-24">
          <Loader2 className="animate-spin text-blue" size={26} />
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {/* connection */}
          <Card rule className="p-5 pl-6">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gold">
              <Plug size={14} /> {t("auto.n8n.connTitle")}
            </div>

            {connected ? (
              <div className="mt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ color: "#2f7d5b", background: "#eaf5ee" }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2f7d5b]" /> {t("auto.n8n.connected")}
                  </span>
                  {cred.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-[11px] text-muted">
                      <ShieldCheck size={12} className="text-[#2f7d5b]" /> {t("auto.n8n.verified")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-[11px] text-muted">
                      <ShieldAlert size={12} className="text-[#9a6b12]" /> {t("auto.n8n.unverified")}
                    </span>
                  )}
                </div>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Server size={13} className="text-faint" />
                    <span className="break-all font-mono text-[12px] text-ink2">
                      {cred.is_default ? t("auto.n8n.managedLabel") : (cred.base_url || "—")}
                    </span>
                  </div>
                  {!cred.is_default && (
                    <div className="flex items-center gap-2">
                      <Link2 size={13} className="text-faint" />
                      <span className="font-mono text-[12px] text-muted">{t("auto.n8n.keyHint")}: {cred.key_hint || "••••"}</span>
                    </div>
                  )}
                </dl>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={load} loading={loading}>
                    <RefreshCw size={14} /> {t("auto.n8n.refresh")}
                  </Button>
                  <Button variant="danger" size="sm" onClick={disconnect} loading={saving}>
                    {t("auto.n8n.disconnect")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-muted">{t("auto.n8n.connSub")}</p>

                {/* pilih mode: default (dikelola aplikasi) vs custom (n8n sendiri) */}
                <div className="flex gap-1.5">
                  {["default", "custom"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setConnMode(m)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        connMode === m
                          ? "border-blue bg-bluesoft text-blue"
                          : "border-line bg-white text-muted hover:border-[#cdbf9d]"
                      }`}
                    >
                      {t(m === "default" ? "auto.n8n.modeDefault" : "auto.n8n.modeCustom")}
                    </button>
                  ))}
                </div>

                {connMode === "default" ? (
                  <p className="rounded-lg border border-line2 bg-[#fcfbf7] px-3 py-2.5 text-[12px] leading-relaxed text-muted">
                    {t("auto.n8n.defaultInfo")}
                  </p>
                ) : (
                  <>
                    <Input
                      label={t("auto.n8n.baseUrl")}
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="http://host.docker.internal:5678"
                    />
                    <PasswordInput
                      label={t("auto.n8n.apiKey")}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={t("auto.n8n.apiKeyPh")}
                      hint={t("auto.n8n.secNote")}
                    />
                  </>
                )}

                <Button
                  variant="gold"
                  onClick={connect}
                  loading={saving}
                  disabled={connMode === "custom" && (!baseUrl.trim() || !apiKey.trim())}
                >
                  <Plug size={15} /> {t(connMode === "default" ? "auto.n8n.useDefault" : "auto.n8n.connect")}
                </Button>
              </div>
            )}
          </Card>

          {/* stats */}
          <Card className="overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-line2 bg-[#FCFAF5]">
              <Stat label={t("auto.n8n.recipients")} value={recipients} />
              <Stat label={t("auto.statQueue")} value={queued} />
              <Stat label={t("auto.n8n.activeCount")} value={workflows.filter((w) => w.active).length} gold />
            </div>
            <p className="border-t border-line2 px-4 py-2.5 text-center text-[11px] text-muted">
              {t("auto.n8n.recipientsNote")}
            </p>
          </Card>

          {/* workflows */}
          <div>
            <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">
              <Rocket size={14} /> {t("auto.n8n.wfTitle")}
            </h2>

            {!connected ? (
              <Card className="mt-3 p-5 text-center text-sm text-muted">{t("auto.n8n.connectFirst")}</Card>
            ) : (
              <>
                <Card className="mt-3 p-4">
                  <p className="mb-3 text-[13px] text-muted">{t("auto.n8n.wfSub")}</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <label className="flex-1 text-xs">
                      <span className="mb-1 block font-medium text-ink2">{t("auto.n8n.template")}</span>
                      <select
                        value={template}
                        onChange={(e) => setTemplate(e.target.value)}
                        className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-bluesoft"
                      >
                        {templates.map((k) => (
                          <option key={k} value={k}>{n8nApi.templateName(k)}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex-1 text-xs">
                      <span className="mb-1 block font-medium text-ink2">{t("auto.n8n.schedule")}</span>
                      <select
                        value={cron}
                        onChange={(e) => setCron(e.target.value)}
                        className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-bluesoft"
                      >
                        {SCHEDULES.map((s) => (
                          <option key={s.cron} value={s.cron}>{t(s.labelKey)}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex-1 text-xs">
                      <span className="mb-1 block font-medium text-ink2">{t("auto.n8n.emailLang")}</span>
                      <select
                        value={emailLang}
                        onChange={(e) => setEmailLang(e.target.value)}
                        className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-bluesoft"
                      >
                        <option value="en">{t("auto.n8n.lang.en")}</option>
                        <option value="id">{t("auto.n8n.lang.id")}</option>
                      </select>
                    </label>
                    <Button onClick={deployWf} loading={deploying} className="shrink-0">
                      <Rocket size={15} /> {t("auto.n8n.deploy")}
                    </Button>
                  </div>

                  {/* optional SMTP credential, created on the user's n8n at deploy */}
                  {/* pengirim email: default (dikelola) / custom / atur nanti */}
                  <div className="mt-3">
                    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {t("auto.n8n.senderTitle")}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        ["default", "auto.n8n.senderDefault"],
                        ["custom", "auto.n8n.senderCustom"],
                        ["none", "auto.n8n.senderNone"],
                      ].map(([m, key]) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => { setSmtpMode(m); setSmtpOpen(m === "custom"); }}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            smtpMode === m
                              ? "border-blue bg-bluesoft text-blue"
                              : "border-line bg-white text-muted hover:border-[#cdbf9d]"
                          }`}
                        >
                          {t(key)}
                        </button>
                      ))}
                    </div>
                    {smtpMode === "default" && (
                      <p className="mt-2 text-[11px] text-muted">{t("auto.n8n.senderDefaultInfo")}</p>
                    )}
                    {smtpMode === "none" && (
                      <p className="mt-2 text-[11px] text-muted">{t("auto.n8n.senderNoneInfo")}</p>
                    )}
                  </div>
                  {smtpMode === "custom" && smtpOpen && (
                    <div className="mt-2 space-y-2.5 rounded-lg border border-line2 bg-[#fcfbf7] p-3">
                      <p className="text-[11px] leading-relaxed text-muted">{t("auto.n8n.smtpSub")}</p>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        <Input label={t("auto.n8n.smtpHost")} value={smtp.host} onChange={setSmtpField("host")} placeholder="smtp.gmail.com" />
                        <Input label={t("auto.n8n.smtpPort")} value={smtp.port} onChange={setSmtpField("port")} placeholder="465" inputMode="numeric" />
                        <Input label={t("auto.n8n.smtpUser")} value={smtp.user} onChange={setSmtpField("user")} placeholder="you@gmail.com" />
                        <PasswordInput label={t("auto.n8n.smtpPass")} value={smtp.password} onChange={setSmtpField("password")} placeholder={t("auto.n8n.smtpPassPh")} />
                        <Input label={t("auto.n8n.smtpFrom")} value={smtp.from_email} onChange={setSmtpField("from_email")} placeholder={smtp.user || "you@gmail.com"} />
                      </div>
                      <p className="text-[10px] text-faint">{t("auto.n8n.smtpNote")}</p>
                    </div>
                  )}
                </Card>

                <ul className="mt-3 space-y-2.5">
                  {workflows.length === 0 && (
                    <Card className="p-5 text-center text-sm text-muted">{t("auto.n8n.noWorkflows")}</Card>
                  )}
                  {workflows.map((w) => (
                    <li key={w.workflow_key}>
                      <Card className="flex items-center gap-3 p-4">
                        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${w.active ? "bg-blue text-white" : "bg-line2 text-muted"}`}>
                          <Workflow size={17} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-ink">{w.name || n8nApi.templateName(w.workflow_key)}</div>
                          <div className="mt-0.5 flex items-center gap-2 text-[11px]">
                            <span className={w.active ? "font-medium text-[#2f7d5b]" : "text-faint"}>
                              {w.active ? t("auto.n8n.active") : t("auto.n8n.inactive")}
                            </span>
                            {w.smtp_attached && (
                              <span className="inline-flex items-center gap-1 text-[#2f7d5b]">
                                <Mail size={10} /> {t("auto.n8n.smtpReady")}
                              </span>
                            )}
                            {w.n8n_workflow_id && (
                              <span className="font-mono text-faint">· {String(w.n8n_workflow_id).slice(0, 10)}</span>
                            )}
                          </div>
                        </div>

                        <Switch
                          on={w.active}
                          busy={busyKey === w.workflow_key}
                          onChange={(next) => toggle(w.workflow_key, next)}
                          labelOn={t("auto.n8n.deactivate")}
                          labelOff={t("auto.n8n.activate")}
                        />
                        <button
                          onClick={() => removeWf(w.workflow_key)}
                          disabled={busyKey === w.workflow_key}
                          className="grid h-9 w-9 place-items-center rounded-lg text-faint hover:bg-[#fcefec] hover:text-[#b23b2e] disabled:opacity-40"
                          aria-label={t("auto.n8n.remove")}
                        >
                          <Trash2 size={15} />
                        </button>
                      </Card>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* how it runs */}
          <div>
            <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">
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
          </div>
        </div>
      )}
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

function Switch({ on, busy, onChange, labelOn, labelOff }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={on ? labelOn : labelOff}
      disabled={busy}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${on ? "bg-blue" : "bg-line2"} disabled:opacity-50`}
    >
      <span
        className={`inline-block transform rounded-full bg-white shadow transition ${on ? "translate-x-6" : "translate-x-1"}`}
        style={{ height: "1.05rem", width: "1.05rem" }}
      />
    </button>
  );
}
