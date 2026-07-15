// RAG feature client for the upgraded backend: token streaming, system status,
// and cache maintenance. Everything degrades gracefully — if the streaming
// endpoint isn't reachable, callers fall back to the non-streaming ask(); in
// DEMO mode all of this is simulated in-memory so the UI is fully explorable
// without a backend.
import { request, API_BASE, DEMO, getToken, getApiKey } from "./client.js";
import * as agentApi from "./agent.js";

function authHeader() {
  const t = getToken();
  if (t) return { Authorization: `Bearer ${t}` };
  const k = getApiKey();
  if (k) return { Authorization: `Bearer ${k}` };
  return {};
}

// Parse one SSE block ("event: x\ndata: {...}") into { event, data }.
function parseSSEBlock(block) {
  let event = "message";
  const dataLines = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  let data = null;
  if (dataLines.length) {
    const joined = dataLines.join("\n");
    try {
      data = JSON.parse(joined);
    } catch {
      data = joined;
    }
  }
  return { event, data };
}

// Type of an SSE event — trusts the `event:` line, else infers from payload.
function eventType(event, data) {
  if (event && event !== "message") return event;
  if (data && data.text != null) return "token";
  if (data && data.streaming) return "meta";
  if (data && (data.elapsed_s != null || data.groundedness)) return "done";
  if (data && data.message) return "error";
  return "message";
}

// Replay a finished answer as tokens (DEMO + fallback flavour).
async function simulateStream(text, onToken, { chunk = 4, delay = 16 } = {}) {
  const parts = String(text).split(/(\s+)/);
  for (let i = 0; i < parts.length; i += chunk) {
    onToken?.(parts.slice(i, i + chunk).join(""));
    await new Promise((r) => setTimeout(r, delay));
  }
}

// Create a chat resource and return its id (defensive across id field names).
async function createChat(title) {
  const data = await request("/api/v1/chats", {
    method: "POST",
    body: { title: title || "Chat" },
  });
  return (
    data?.id || data?.chat_id || data?._id || (typeof data === "string" ? data : null)
  );
}

/**
 * Stream an answer token-by-token.
 * - onMeta({ sources }) fires once when retrieval metadata arrives.
 * - onToken(textDelta) fires for every streamed chunk.
 * Resolves to the aggregated result { answer, sources, groundedness, ... }.
 * If streaming is unavailable for any reason, falls back to a single ask().
 */
export async function streamAnswer(
  question,
  { language = "en", filters, thread_id, onMeta, onToken, signal } = {}
) {
  if (DEMO) {
    const r = await agentApi.ask(question, { language, filters });
    onMeta?.({ sources: r.sources || [] });
    if ((r.response_type || "answer") === "answer") await simulateStream(r.answer, onToken);
    else onToken?.(r.answer);
    return { ...r, streamed: true };
  }

  try {
    const chatId = thread_id || (await createChat(question.slice(0, 40)));
    if (!chatId) throw new Error("no chat id");

    const res = await fetch(API_BASE + `/api/v1/chats/${chatId}/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ content: question, language, filters }),
      credentials: "include",
      signal,
    });
    if (!res.ok || !res.body) throw new Error(`stream ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";
    let sources = [];
    let groundedness = null;
    let elapsed = null;

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const block = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        if (!block.trim()) continue;
        const { event, data } = parseSSEBlock(block);
        const type = eventType(event, data);
        if (type === "meta") {
          sources = data?.sources || sources;
          onMeta?.({ sources });
        } else if (type === "token") {
          full += data?.text || "";
          onToken?.(data?.text || "");
        } else if (type === "done") {
          groundedness = data?.groundedness ?? groundedness;
          elapsed = data?.elapsed_s ?? elapsed;
        } else if (type === "error") {
          throw new Error(data?.message || "stream error");
        }
      }
    }

    return {
      question,
      answer: full,
      response_type: "answer",
      sources,
      groundedness,
      processing_time: elapsed ?? undefined,
      thread_id: chatId,
      streamed: true,
      success: true,
      language_detected: language,
      recommendations: [],
    };
  } catch {
    // Graceful fallback — a non-streaming ask still returns a complete answer.
    const r = await agentApi.ask(question, { language, filters, thread_id });
    if ((r.response_type || "answer") === "answer")
      await simulateStream(r.answer, onToken, { chunk: 8, delay: 6 });
    else onToken?.(r.answer);
    return { ...r, streamed: false };
  }
}

// System snapshot: agent + rag + cache + prompt weights.
export async function ragStatus() {
  if (DEMO) {
    return {
      agent: { initialized: true, graph_compiled: true },
      rag: {
        initialized: true,
        collection: "jojoba_economic_data",
        features: {
          hybrid_search: true,
          reranking: true,
          metadata_filtering: true,
          query_rewriting: true,
          context_compression: true,
          adaptive_top_k: true,
          incremental_indexing: true,
          streaming: true,
          observability: false,
          prompt_versioning: true,
          ab_testing: true,
          canary: true,
          retrieval_evaluation: true,
          groundedness: true,
        },
        retrieval: {
          hybrid_alpha: 0.5,
          rerank_model: "Xenova/ms-marco-MiniLM-L-6-v2",
          top_k: 8,
        },
      },
      cache: {
        exact: { hits: 128, misses: 42, size: 96, hit_rate: "75.3%" },
        semantic: { hits: 33, misses: 61, size: 88, hit_rate: "35.1%" },
      },
      prompts: {
        system_en: [
          { version: "v1", weight: 0 },
          { version: "v2", weight: 1 },
        ],
      },
    };
  }
  return request("/api/v1/agent/status");
}

// Clear the RAG answer caches (exact + semantic).
export async function clearCache() {
  if (DEMO) {
    await new Promise((r) => setTimeout(r, 400));
    return { status: "cleared" };
  }
  return request("/api/v1/agent/maintenance/clear-cache", { method: "POST" });
}
