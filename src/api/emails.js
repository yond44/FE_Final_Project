// Per-user email recipients — /api/v1/user/emails/* (isolated per authenticated
// user; each user only sees and sends to their OWN list). Replaces the old
// shared /api/v1/emails/* endpoints so recipients are no longer global.
import { request, DEMO } from "./client.js";

let demoEmails = [];

// Normalise a backend email doc so the UI can always rely on `_id`.
function norm(e) {
  return { ...e, _id: e._id || e.id, name: e.name, email: e.email };
}

export async function list() {
  if (DEMO) return { emails: [...demoEmails], count: demoEmails.length };
  const r = await request("/api/v1/user/emails");
  const emails = (r.emails || []).map(norm);
  return { emails, count: r.count ?? emails.length };
}

export async function create(name, email) {
  if (DEMO) {
    if (demoEmails.some((e) => e.email === email)) throw new Error("Email already exists");
    const row = { _id: "e" + Date.now(), name, email };
    demoEmails = [...demoEmails, row];
    return { email: row };
  }
  const r = await request("/api/v1/user/emails", { method: "POST", body: { name, email } });
  return { email: norm(r.email || {}) };
}

// The per-user API has no PUT, so an edit is delete + re-add (id changes).
export async function update(id, name, email) {
  if (DEMO) {
    demoEmails = demoEmails.map((e) => (e._id === id ? { ...e, name, email } : e));
    return { email: demoEmails.find((e) => e._id === id) };
  }
  await remove(id);
  return create(name, email);
}

export async function remove(id) {
  if (DEMO) {
    demoEmails = demoEmails.filter((e) => e._id !== id);
    return { status: "success" };
  }
  return request(`/api/v1/user/emails/${id}`, { method: "DELETE" });
}

// No server-side search on the per-user API — filter the list client-side.
export async function search(q) {
  const { emails } = await list();
  const needle = (q || "").toLowerCase();
  return { results: emails.filter((e) => (e.name + e.email).toLowerCase().includes(needle)) };
}

export async function asString() {
  if (DEMO) return { email_string: demoEmails.map((e) => e.email).join(", "), count: demoEmails.length };
  const r = await request("/api/v1/user/emails/string/export");
  const s = r.email_string || "";
  return { email_string: s, count: s ? s.split(",").length : 0 };
}
