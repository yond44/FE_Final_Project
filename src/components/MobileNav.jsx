import React from "react";
import { NavLink } from "react-router-dom";
import { MessageSquare, Users, ListChecks, Clock, SendHorizonal } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";

const NAV = [
  { to: "/", key: "nav.m.chat", icon: MessageSquare, end: true },
  { to: "/send", key: "nav.m.send", icon: SendHorizonal },
  { to: "/recipients", key: "nav.m.recipients", icon: Users },
  { to: "/history", key: "nav.m.history", icon: Clock },
];

export default function MobileNav() {
  const { t } = useLanguage();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-paper/95 backdrop-blur md:hidden">
      {NAV.map(({ to, key, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
              isActive ? "text-blue" : "text-muted"
            }`
          }
        >
          <Icon size={19} />
          {t(key)}
        </NavLink>
      ))}
    </nav>
  );
}
