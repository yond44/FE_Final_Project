import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { DEMO } from "../api/client.js";
import { TICKER } from "../constants.js";
import Button from "../components/ui/Button.jsx";
import { Input, PasswordInput } from "../components/ui/Input.jsx";
import LanguageToggle from "../components/LanguageToggle.jsx";

export function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();
  const nav = useNavigate();
  const loc = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(username, password);
      toast.success(t("auth.signedIn"));
      nav(loc.state?.from || "/", { replace: true });
    } catch (err) {
      toast.error(err.message || t("auth.signInFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title={t("auth.login.title")} subtitle={t("auth.login.subtitle")}>
      <form onSubmit={submit} className="space-y-4">
        <Input label={t("auth.username")} value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t("auth.username.ph")} autoFocus />
        <PasswordInput label={t("auth.password")} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        <Button type="submit" loading={busy} className="w-full">
          {t("auth.signIn")} <ArrowRight size={16} />
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        {t("auth.noAccount")}{" "}
        <Link to="/register" className="font-semibold text-blue hover:underline">
          {t("auth.toRegister")}
        </Link>
      </p>
      {DEMO && <DemoNote />}
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();
  const nav = useNavigate();
  const [form, setForm] = useState({ full_name: "", username: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await register(form);
      toast.success(t("auth.accountCreated"));
      nav("/", { replace: true });
    } catch (err) {
      toast.error(err.message || t("auth.registerFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title={t("auth.register.title")} subtitle={t("auth.register.subtitle")}>
      <form onSubmit={submit} className="space-y-4">
        <Input label={t("auth.fullName")} value={form.full_name} onChange={set("full_name")} placeholder={t("auth.fullName.ph")} autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t("auth.username")} value={form.username} onChange={set("username")} placeholder={t("auth.username.ph")} />
          <Input label={t("auth.email")} type="email" value={form.email} onChange={set("email")} placeholder={t("auth.email.ph")} />
        </div>
        <PasswordInput label={t("auth.password")} value={form.password} onChange={set("password")} placeholder={t("auth.password.choose")} hint={t("auth.password.hint")} />
        <Button type="submit" loading={busy} className="w-full">
          {t("auth.createAccount")} <ArrowRight size={16} />
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        {t("auth.haveAccount")}{" "}
        <Link to="/login" className="font-semibold text-blue hover:underline">
          {t("auth.toLogin")}
        </Link>
      </p>
      {DEMO && <DemoNote />}
    </Shell>
  );
}

function DemoNote() {
  const { t } = useLanguage();
  return (
    <div className="mt-5 rounded-lg border border-gold/40 bg-goldsoft px-3 py-2 text-center text-[12px] text-[#8a6d12]">
      {t("auth.demoNote")}
    </div>
  );
}

// Two-pane auth layout: editorial left, form right. Language toggle lives here so
// the user can pick a language before signing in.
function Shell({ title, subtitle, children }) {
  const { t } = useLanguage();
  const tape = [...TICKER, ...TICKER];
  return (
    <div className="grain min-h-screen bg-paper md:grid md:grid-cols-2">
      {/* left editorial panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 md:flex">
        <div className="relative z-10 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
          <span className="grid h-5 w-5 place-items-center rounded bg-gold text-[10px] text-white">J</span>
          {t("auth.brand")}
        </div>
        <div className="relative z-10">
          <h2 className="font-serif text-[2.7rem] font-semibold leading-[1.05] text-white">
            {t("auth.heroTitle1")}<br />{t("auth.heroTitle2")}<br />{t("auth.heroTitle3and")}<span className="text-gold">{t("auth.heroTitle3")}</span>
          </h2>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-[#9fb0c4]">
            {t("auth.heroBody")}
          </p>
        </div>
        <div className="relative z-10 space-y-1.5 font-mono text-[12px] text-[#7e91a8]">
          {tape.slice(0, 5).map(([s, p, c, up], i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-28 text-[#5f7390]">{s}</span>
              <span className="text-white tnum">{p}</span>
              <span className={up ? "text-[#5fbd8a]" : "text-[#e0876f]"}>{c}</span>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-10 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
      </div>

      {/* right form panel */}
      <div className="relative flex min-h-screen items-center justify-center px-5 py-10">
        {/* language toggle, top-right */}
        <div className="absolute right-5 top-5 w-28">
          <LanguageToggle />
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-7">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold md:hidden">
              <span className="grid h-4 w-4 place-items-center rounded-sm bg-gold text-[9px] text-white">J</span>
              Jojoba
            </div>
            <h1 className="font-serif text-3xl font-semibold text-ink">{title}</h1>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
