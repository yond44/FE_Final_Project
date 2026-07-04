import React from "react";
import { NavLink } from "react-router-dom";
import { MessageSquare, Users, Clock, LogOut, SendHorizonal } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { DEMO } from "../api/client.js";
import LanguageToggle from "./LanguageToggle.jsx";

const NAV = [
  { to: "/", key: "nav.chat", icon: MessageSquare, end: true },
  { to: "/send", key: "nav.send", icon: SendHorizonal },
  { to: "/recipients", key: "nav.recipients", icon: Users },
  { to: "/history", key: "nav.history", icon: Clock },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  return (
    <aside className="sticky top-0 hidden h-screen w-[256px] shrink-0 flex-col border-r border-line bg-paper/80 px-4 py-6 backdrop-blur md:flex">
      <div className="mb-9 px-2">
        <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
          <span className="grid h-4 w-4 place-items-center rounded-sm bg-gold text-[9px] text-white">J</span>
          Jojoba
        </div>
        <h1 className="font-serif text-[1.6rem] font-semibold leading-none text-ink">
          Economic<br /><span className="text-blue">Advisor</span>
        </h1>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ to, key, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive ? "bg-ink text-white shadow-card" : "text-[#46505f] hover:bg-line2"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? "text-gold" : "text-muted group-hover:text-ink"} />
                {t(key)}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">{t("nav.language")}</span>
        </div>
        <LanguageToggle />
      </div>

      <div className="mt-3 rounded-xl border border-line bg-white p-3 shadow-card">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-bluesoft font-serif text-sm font-semibold text-blue">
            {(user?.full_name || user?.username || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-ink">{user?.full_name || user?.username}</div>
            <div className="truncate text-[11px] text-muted">{DEMO ? t("common.demoMode") : user?.email}</div>
          </div>
          <button onClick={logout} title={t("nav.signOut")} className="rounded-lg p-1.5 text-faint hover:bg-line2 hover:text-[#b23b2e]">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
