// Question queue endpoints — /api/v1/questions/* (paths match api.ts).
import { request, DEMO } from "./client.js";

let demoQueue = [];
let demoArchive = [];

const norm = (q) => (typeof q === "string" ? q : q.text ?? "");

export async function list(limit = 100) {
  if (DEMO) return { questions: demoQueue.map((t) => ({ text: t })), count: demoQueue.length };
  return request("/api/v1/questions", { params: { limit } });
}

export async function add(text) {
  if (DEMO) {
    demoQueue = [...demoQueue, text];
    return { id: "q" + Date.now() };
  }
  // api.ts: api.post(`/api/v1/questions?text=...`)
  return request("/api/v1/questions", { method: "POST", params: { text } });
}

export async function generate() {
  if (DEMO) {
    await new Promise((r) => setTimeout(r, 650));
    const g = "Sample generated question — connect your API for real output.";
    demoQueue = [...demoQueue, g];
    return { question: { text: g } };
  }
  return request("/api/v1/questions/generate", { method: "POST" });
}

export async function removeNext() {
  if (DEMO) {
    const [first, ...rest] = demoQueue;
    if (first) demoArchive = [{ text: first, at: "today" }, ...demoArchive];
    demoQueue = rest;
    return { status: "success" };
  }
  return request("/api/v1/questions/next", { method: "DELETE" });
}

export async function archive(limit = 100) {
  if (DEMO) return { archive: demoArchive };
  return request("/api/v1/questions/archive", { params: { limit } });
}

export async function stats() {
  if (DEMO) return { stats: { total: demoQueue.length, archived: demoArchive.length } };
  return request("/api/v1/questions/stats");
}

export { norm };
