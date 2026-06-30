import React from "react";
import { Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { Login, Register } from "./pages/Auth.jsx";
import Chat from "./pages/Chat.jsx";
import Send from "./pages/Send.jsx";
import Recipients from "./pages/Recipients.jsx";
import Queue from "./pages/Queue.jsx";
import Automation from "./pages/Automation.jsx";
import History from "./pages/History.jsx";
import Ticker from "./components/Ticker.jsx";
import Sidebar from "./components/Sidebar.jsx";
import MobileNav from "./components/MobileNav.jsx";
import { Loader2 } from "lucide-react";

function Protected() {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center bg-paper">
        <Loader2 className="animate-spin text-blue" size={28} />
      </div>
    );
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return <Outlet />;
}

function Layout() {
  return (
    <div className="grain min-h-screen bg-paper">
      <Ticker />
      <div className="mx-auto flex max-w-[1280px]">
        <Sidebar />
        <main className="relative z-10 min-h-[calc(100vh-2.5rem)] flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-8">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route element={<Protected />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Chat />} />
          <Route path="/send" element={<Send />} />
          <Route path="/recipients" element={<Recipients />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/automation" element={<Automation />} />
          <Route path="/history" element={<History />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
