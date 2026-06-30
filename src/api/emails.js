// Email contact endpoints — /api/v1/emails/* (paths match api.ts).
import { request, DEMO } from "./client.js";

let demoEmails = [];

export async function list() {
  if (DEMO) return { emails: [...demoEmails], count: demoEmails.length };
  return request("/api/v1/emails");
}

export async function create(name, email) {
  if (DEMO) {
    if (demoEmails.some((e) => e.email === email)) throw new Error("Email already exists");
    const row = { _id: "e" + Date.now(), name, email };
    demoEmails = [...demoEmails, row];
    return { email: row };
  }
  return request("/api/v1/emails", { method: "POST", body: { name, email } });
}

export async function update(id, name, email) {
  if (DEMO) {
    demoEmails = demoEmails.map((e) => (e._id === id ? { ...e, name, email } : e));
    return { email: demoEmails.find((e) => e._id === id) };
  }
  return request(`/api/v1/emails/${id}`, { method: "PUT", body: { name, email } });
}

export async function remove(id) {
  if (DEMO) {
    demoEmails = demoEmails.filter((e) => e._id !== id);
    return { status: "success" };
  }
  return request(`/api/v1/emails/${id}`, { method: "DELETE" });
}

export async function search(q) {
  if (DEMO) return { results: demoEmails.filter((e) => (e.name + e.email).toLowerCase().includes(q.toLowerCase())) };
  return request("/api/v1/emails/search/query", { params: { q } });
}

export async function asString() {
  if (DEMO) return { email_string: demoEmails.map((e) => e.email).join(", "), count: demoEmails.length };
  return request("/api/v1/emails/string/export");
}
