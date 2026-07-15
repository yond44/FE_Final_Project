// Core HTTP client — aligned with the live backend (see main.py route registration).
// IMPORTANT: most routers mount under /api/v1, but the WEBHOOK router mounts under
// /api/webhook (no /api/v1). So paths here include their full prefix, and the base
// URL is just the server ROOT.
//   Set VITE_API_BASE in .env, e.g. VITE_API_BASE=http://127.0.0.1:8000
//   Left empty => DEMO mode (in-memory data, no network).

export const API_BASE = import.meta.env.VITE_API_BASE || "";
export const DEMO = !API_BASE;

// Storage keys (interop with the project's api.ts).
const TOKEN_KEY = "token";
const APIKEY_KEY = "api_key";

export const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
export const setToken = (t) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);
export const getApiKey = () => localStorage.getItem(APIKEY_KEY) || "";
export const setApiKey = (k) =>
  k ? localStorage.setItem(APIKEY_KEY, k) : localStorage.removeItem(APIKEY_KEY);

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function authHeader() {
  const t = getToken();
  if (t) return { Authorization: `Bearer ${t}` };
  const k = getApiKey();
  if (k) return { Authorization: `Bearer ${k}` };
  return {};
}

export async function request(
  path,
  { method = "GET", body, params, auth = true } = {},
) {
  let url = API_BASE + path;
  if (params) {
    const q = new URLSearchParams(
      Object.entries(params).filter(
        ([, v]) => v !== undefined && v !== null && v !== "",
      ),
    ).toString();
    if (q) url += "?" + q;
  }

  const headers = {
    "Content-Type": "application/json",
    ...(auth ? authHeader() : {}),
  };

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });
  } catch {
    throw new ApiError("Network error — is the server reachable?", 0);
  }

  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("user");
    throw new ApiError("Session expired. Please sign in again.", 401);
  }

  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const detail =
      (data && data.detail) ||
      (typeof data === "string" ? data : res.statusText);
    throw new ApiError(detail || "Request failed", res.status);
  }
  return data;
}
