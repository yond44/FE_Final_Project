// Auth endpoints — /api/v1/auth/* (paths match api.ts).
import { request, setToken, DEMO } from "./client.js";

const DEMO_USER = {
  id: "demo",
  username: "guest",
  email: "",
  full_name: "Guest",
  role: "user",
};

export async function login(username, password) {
  if (DEMO) {
    if (!username || !password) throw new Error("Enter a username and password");
    setToken("demo-token");
    return { user: DEMO_USER };
  }
  const res = await request("/api/v1/auth/login", {
    method: "POST",
    auth: false,
    body: { username, password },
  });
  if (res?.access_token) setToken(res.access_token);
  return res;
}

export async function register(payload) {
  if (DEMO) {
    setToken("demo-token");
    return { ...DEMO_USER, ...payload };
  }
  return request("/api/v1/auth/register", { method: "POST", auth: false, body: payload });
}

export async function me() {
  if (DEMO) return DEMO_USER;
  return request("/api/v1/auth/me");
}

export async function logout() {
  try {
    if (!DEMO) await request("/api/v1/auth/logout", { method: "POST" });
  } finally {
    setToken(null);
  }
}

export async function loginHistory(limit = 10) {
  if (DEMO) return { history: [] };
  return request("/api/v1/auth/login-history", { params: { limit } });
}
