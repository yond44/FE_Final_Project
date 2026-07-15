// src/api/agent.js
import { request, API_BASE, DEMO } from "./client.js";

const analysisEN = () =>
  `Context. The starting point is the current rate path and how much of it is already priced.\n\n` +
  `What the data says. Recent prints lean cautiously constructive. Liquidity is the swing factor, and cross-asset correlation is doing more of the explaining than any single headline.\n\n` +
  `Risks to watch. Central-bank guidance, a stronger dollar, and any crack in credit spreads would be the early tells of a reversal.\n\n` +
  `Bottom line. Constructive but not complacent — size positions for the scenario, not the forecast.`;

const analysisID = () =>
  `Konteks. Titik awalnya adalah arah suku bunga saat ini dan seberapa banyak yang sudah tercermin di harga.\n\n` +
  `Apa kata data. Rilis terbaru cenderung hati-hati namun konstruktif. Likuiditas menjadi faktor penentu, dan korelasi antar-aset lebih menjelaskan ketimbang satu berita tunggal.\n\n` +
  `Risiko yang perlu diperhatikan. Panduan bank sentral, dolar yang menguat, dan retaknya spread kredit akan menjadi sinyal awal pembalikan arah.\n\n` +
  `Kesimpulan. Konstruktif namun tidak lengah — ukur posisi sesuai skenario, bukan sekadar proyeksi.`;

function demoReply(qRaw, lang) {
  const q = qRaw.trim().toLowerCase();
  const id = lang === "id";
  const has = (...w) => w.some((x) => q.includes(x));

  if (has("thank", "thanks", "thx", "makasih", "terima kasih"))
    return {
      type: "gratitude",
      answer: id
        ? "Sama-sama! Ada hal lain seputar pasar atau ekonomi yang ingin dibahas?"
        : "You're welcome! Curious about anything else across markets or the economy?",
    };

  if (
    /^(hi|hey|hello|halo|hai|yo|good (morning|afternoon|evening))\b/.test(q) ||
    has("how are you", "apa kabar")
  )
    return {
      type: "greeting",
      answer: id
        ? "Halo! Saya siap membahas pasar, investasi, atau tren ekonomi. Apa yang ingin Anda tanyakan?"
        : "Hey! I'm ready to discuss markets, investments, or economic trends. What's on your mind?",
    };

  if (
    has(
      "generate question",
      "suggest question",
      "give me question",
      "what should i ask",
      "buat pertanyaan",
      "sarankan pertanyaan",
    )
  )
    return { type: "questions", answer: demoQuestionsFor(qRaw, id) };

  if (q.length < 4)
    return {
      type: "clarify",
      answer: id
        ? "Bisa dijelaskan sedikit lagi? Beri saya pertanyaan tentang ekonomi atau pasar."
        : "Could you say a bit more? Give me a question on economics or markets and I'll dig in.",
    };

  return {
    type: "answer",
    answer: id
      ? `Berikut analisis ringkas untuk "${qRaw.slice(0, 72)}${qRaw.length > 72 ? "…" : ""}":\n\n${analysisID()}`
      : `Here's a focused read on "${qRaw.slice(0, 72)}${qRaw.length > 72 ? "…" : ""}":\n\n${analysisEN()}`,
  };
}

function demoQuestionsFor(text, id) {
  const t = text.toLowerCase();
  const topic = /stock|equit|share|saham/.test(t)
    ? "stocks"
    : /crypto|bitcoin|defi|ethereum|kripto/.test(t)
      ? "crypto"
      : /commodit|gold|oil|komoditas|emas|minyak/.test(t)
        ? "commodities"
        : /invest|portfolio|portofolio/.test(t)
          ? "investment"
          : "economy";
  const banksEN = {
    stocks: [
      "How do company fundamentals drive a stock's valuation?",
      "What sector trends should I watch before buying equities?",
      "How does earnings season move share prices?",
    ],
    crypto: [
      "How does the regulatory environment shape crypto markets?",
      "What drives volatility across major DeFi protocols?",
      "How does crypto compare to traditional assets as a hedge?",
    ],
    commodities: [
      "What are the main price drivers for commodities right now?",
      "How do geopolitical risks feed into commodity prices?",
      "How does inflation correlate with commodity returns?",
    ],
    investment: [
      "How should risk shape my asset allocation?",
      "What does portfolio diversification look like in practice?",
      "How do I match a strategy to my time horizon?",
    ],
    economy: [
      "How do interest rates ripple through the economy?",
      "What does the latest inflation print mean for markets?",
      "How are GDP growth and unemployment connected?",
    ],
  };
  const banksID = {
    stocks: [
      "Bagaimana fundamental perusahaan menentukan valuasi saham?",
      "Tren sektor apa yang perlu diperhatikan sebelum membeli saham?",
      "Bagaimana musim laporan keuangan menggerakkan harga saham?",
    ],
    crypto: [
      "Bagaimana lingkungan regulasi membentuk pasar kripto?",
      "Apa yang mendorong volatilitas di protokol DeFi utama?",
      "Bagaimana kripto dibanding aset tradisional sebagai lindung nilai?",
    ],
    commodities: [
      "Apa pendorong utama harga komoditas saat ini?",
      "Bagaimana risiko geopolitik memengaruhi harga komoditas?",
      "Bagaimana inflasi berkorelasi dengan imbal hasil komoditas?",
    ],
    investment: [
      "Bagaimana profil risiko membentuk alokasi aset saya?",
      "Seperti apa diversifikasi portofolio dalam praktik?",
      "Bagaimana menyesuaikan strategi dengan horizon waktu saya?",
    ],
    economy: [
      "Bagaimana suku bunga memengaruhi perekonomian?",
      "Apa arti rilis inflasi terbaru bagi pasar?",
      "Bagaimana hubungan pertumbuhan PDB dan pengangguran?",
    ],
  };
  const list = (id ? banksID : banksEN)[topic];
  const head = id
    ? `Berikut beberapa pertanyaan menarik untuk mulai mengeksplorasi ${topic}:`
    : `Here are some great questions to start exploring ${topic}:`;
  const tail = id
    ? `\n\nPilih yang paling menarik, atau sebutkan sudut lain tentang ${topic} yang ingin dibahas.`
    : `\n\nPick whichever interests you most, or tell me another angle on ${topic} you'd like to explore.`;
  return head + "\n\n" + list.map((q, i) => `${i + 1}. ${q}`).join("\n") + tail;
}

function demoSources(q, id, filters) {
  const facet = filters?.sector
    ? `sector:${filters.sector}`
    : filters?.topic
      ? `topic:${filters.topic}`
      : filters?.region
        ? `region:${filters.region}`
        : null;
  const files = id
    ? ["ikhtisar_ekonomi.md", "data_pasar_saham.csv", "ringkasan_komoditas.md"]
    : ["economy_overview.md", "equity_market_data.csv", "commodities_brief.md"];
  const types = ["narrative", "table", "narrative"];
  return files.map((file, i) => ({
    file,
    chunk_type: types[i],
    score: Number((0.82 - i * 0.11).toFixed(2)),
    preview: id
      ? `Kutipan relevan dari ${file}${facet ? ` (${facet})` : ""} untuk "${q.slice(0, 40)}"…`
      : `Relevant excerpt from ${file}${facet ? ` (${facet})` : ""} for "${q.slice(0, 40)}"…`,
  }));
}

export async function ask(
  question,
  { thread_id, channel = "web", language = "en", filters, onToken } = {},
) {
  if (DEMO) {
    await new Promise((r) => setTimeout(r, 650));
    const { type, answer } = demoReply(question, language);
    const isAnswer = type === "answer";
    const id = language === "id";
    return {
      question,
      answer,
      response_type: type,
      processing_time: 0.62,
      sources: isAnswer ? demoSources(question, id, filters) : [],
      recommendations: isAnswer
        ? id
          ? [
              "Apa metrik utama yang perlu dipantau?",
              "Bagaimana tren ini berubah secara historis?",
            ]
          : [
              "What are the key metrics to track?",
              "How has this trend changed historically?",
            ]
        : [],
      groundedness: isAnswer
        ? {
            grounded: true,
            score: 0.86,
            reason: id
              ? "Sebagian besar klaim didukung konteks yang diambil."
              : "Most claims are supported by the retrieved context.",
          }
        : null,
      prompt_version: isAnswer ? "v2" : undefined,
      rewritten_query: isAnswer ? question.trim() : undefined,
      cached: false,
      filters_applied:
        filters && Object.keys(filters).length ? filters : undefined,
      attempts: 1,
      success: true,
      language_detected: language,
    };
  }

  // /api/webhook/ask saves the user question + assistant answer straight to
  // chat_sessions/chat_messages (creating a session on first message) and
  // hands back chat_id, so the caller can reload the thread via the normal
  // chat_routes API (see api/chats.js -> getChat). It answers in one shot
  // rather than over SSE, so there's nothing to stream token-by-token here.
  const result = await request("/api/webhook/ask", {
    method: "POST",
    body: {
      question,
      thread_id,
      language,
    },
  });

  if (onToken && result.answer) {
    onToken(result.answer);
  }

  return {
    ...result,
    chat_id: result.chat_id || result.thread_id || thread_id,
  };
}

export async function batchEmail({
  question,
  emails,
  subject,
  language = "en",
  frequency = "once",
  phone,
}) {
  if (DEMO) {
    await new Promise((r) => setTimeout(r, 800));
    return {
      status: "success",
      batch_id: "demo-" + Date.now(),
      total_recipients: emails.length,
      sent_count: emails.length,
      failed_emails: [],
    };
  }
  return request("/api/v1/agent/batch-email", {
    method: "POST",
    body: {
      question,
      emails,
      subject,
      language,
      frequency,
      phone: phone || undefined,
    },
  });
}

export async function history({
  skip = 0,
  limit = 30,
  status_filter,
  channel,
} = {}) {
  if (DEMO) return { histories: [], count: 0, total: 0 };
  return request("/api/v1/history", {
    params: { skip, limit, status_filter, channel },
  });
}

export async function historyStats(days = 7) {
  if (DEMO) return {};
  return request("/api/v1/history/stats/overview", { params: { days } });
}

export async function status() {
  if (DEMO)
    return {
      agent: { initialized: true, graph_compiled: true },
      rag: { initialized: false },
      cache: { hit_rate: "0%" },
    };
  return request("/api/v1/agent/status");
}

export const automationWebhook = (language = "en") =>
  (API_BASE || "http://host.docker.internal:8000") +
  `/api/webhook/process-next?send_email=true&language=${language}`;
