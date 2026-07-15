// n8n integration — /api/v1/n8n/* (per-user, JWT-scoped).
// The API key is write-only: it's sent once, stored encrypted server-side, and
// NEVER returned — status only exposes a masked `key_hint`. Deploying a workflow
// wires it to this user's ISOLATED webhook (the backend mints a per-user token),
// so an activated workflow only ever sends to that user's own recipients.
import { request, DEMO } from "./client.js";

// ---- demo store (no backend) ---------------------------------------------
let demo = {
  credential: { connected: false, base_url: null, key_hint: null, verified: false, is_default: false },
  workflows: [],
  available_templates: ["economic-report"],
};
const TEMPLATE_NAMES = { "economic-report": "Daily Economic Report" };

export async function status() {
  if (DEMO) return JSON.parse(JSON.stringify(demo));
  return request("/api/v1/n8n/status");
}

export async function saveCredentials(base_url, api_key) {
  if (DEMO) {
    const hint = "••••" + (api_key || "").slice(-4);
    demo.credential = { connected: true, base_url, key_hint: hint, verified: true, is_default: false };
    return { connected: true, verified: true, key_hint: hint };
  }
  return request("/api/v1/n8n/credentials", { method: "POST", body: { base_url, api_key } });
}

// Mode "default": pakai n8n milik aplikasi. Kredensial ada di .env BACKEND —
// browser hanya mengirim { use_default: true }, tidak pernah melihat key/URL.
export async function useDefaultCredentials() {
  if (DEMO) {
    demo.credential = { connected: true, base_url: null, key_hint: "default", verified: true, is_default: true };
    return { connected: true, verified: true, key_hint: "default", is_default: true };
  }
  return request("/api/v1/n8n/credentials", { method: "POST", body: { use_default: true } });
}

export async function deleteCredentials() {
  if (DEMO) {
    demo = { credential: { connected: false, base_url: null, key_hint: null, verified: false, is_default: false }, workflows: [], available_templates: ["economic-report"] };
    return { success: true };
  }
  return request("/api/v1/n8n/credentials", { method: "DELETE" });
}

export async function deploy(
  workflow_key = "economic-report",
  cron = "0 8 * * *",
  { smtp = null, language = "en", useDefaultSmtp = false } = {}
) {
  if (DEMO) {
    if (!demo.workflows.some((w) => w.workflow_key === workflow_key)) {
      demo.workflows.push({
        workflow_key,
        name: TEMPLATE_NAMES[workflow_key] || workflow_key,
        n8n_workflow_id: "wf_" + Date.now(),
        active: false,
        deployed: true,
        smtp_attached: !!smtp || useDefaultSmtp,
        language,
      });
    }
    return { deployed: true, workflow_key, active: false, smtp_attached: !!smtp || useDefaultSmtp };
  }
  const body = { workflow_key, cron, language, use_default_smtp: useDefaultSmtp };
  if (smtp && !useDefaultSmtp) body.smtp = smtp; // backend membuat credential SMTP di n8n
  return request("/api/v1/n8n/deploy", { method: "POST", body });
}

export async function setActive(workflow_key, active) {
  if (DEMO) {
    demo.workflows = demo.workflows.map((w) => (w.workflow_key === workflow_key ? { ...w, active } : w));
    return { workflow_key, active };
  }
  return request(`/api/v1/n8n/workflows/${workflow_key}/active`, { method: "POST", body: { active } });
}

export async function deleteWorkflow(workflow_key) {
  if (DEMO) {
    demo.workflows = demo.workflows.filter((w) => w.workflow_key !== workflow_key);
    return { success: true, workflow_key };
  }
  return request(`/api/v1/n8n/workflows/${workflow_key}`, { method: "DELETE" });
}

// Friendly label for a template key.
export function templateName(key) {
  return TEMPLATE_NAMES[key] || key;
}
