import { TrendingUp, LineChart, Coins, Layers, Building2, Globe, Briefcase } from "lucide-react";

// Themes shown in the chat composer. `labelKey` is a translation key (see i18n);
// `topic` maps to the backend's QuestionGenerator topics.
export const THEMES = [
  { labelKey: "theme.economy", topic: "economy", icon: TrendingUp },
  { labelKey: "theme.stocks", topic: "stocks", icon: LineChart },
  { labelKey: "theme.crypto", topic: "crypto", icon: Coins },
  { labelKey: "theme.commodities", topic: "commodities", icon: Layers },
  { labelKey: "theme.corporate", topic: "stocks", icon: Building2 },
  { labelKey: "theme.geopolitics", topic: "economy", icon: Globe },
  { labelKey: "theme.portfolio", topic: "investment", icon: Briefcase },
];

// Metadata-filter facets for the chat composer. Each selection is sent to the
// backend as metadata.filters and narrows retrieval (hybrid search honours the
// same filter on both the dense and BM25 sides).
export const RAG_FILTERS = [
  {
    facet: "sector",
    labelKey: "filter.sector",
    options: [
      { value: "banking", labelKey: "filter.sector.banking" },
      { value: "energy", labelKey: "filter.sector.energy" },
      { value: "technology", labelKey: "filter.sector.technology" },
      { value: "consumer", labelKey: "filter.sector.consumer" },
    ],
  },
  {
    facet: "region",
    labelKey: "filter.region",
    options: [
      { value: "indonesia", labelKey: "filter.region.indonesia" },
      { value: "asia", labelKey: "filter.region.asia" },
      { value: "global", labelKey: "filter.region.global" },
    ],
  },
  {
    facet: "topic",
    labelKey: "filter.topic",
    options: [
      { value: "stocks", labelKey: "filter.topic.stocks" },
      { value: "macro", labelKey: "filter.topic.macro" },
      { value: "commodities", labelKey: "filter.topic.commodities" },
      { value: "crypto", labelKey: "filter.topic.crypto" },
    ],
  },
];

// The 14 advanced RAG capabilities, grouped for the System page. `key` matches
// the flags returned by /agent/status → rag.features.
export const RAG_FEATURES = [
  { key: "hybrid_search", labelKey: "feat.hybrid", descKey: "feat.hybrid.d", group: "retrieval" },
  { key: "reranking", labelKey: "feat.rerank", descKey: "feat.rerank.d", group: "retrieval" },
  { key: "metadata_filtering", labelKey: "feat.filter", descKey: "feat.filter.d", group: "retrieval" },
  { key: "adaptive_top_k", labelKey: "feat.adaptive", descKey: "feat.adaptive.d", group: "retrieval" },
  { key: "query_rewriting", labelKey: "feat.rewrite", descKey: "feat.rewrite.d", group: "generation" },
  { key: "context_compression", labelKey: "feat.compress", descKey: "feat.compress.d", group: "generation" },
  { key: "streaming", labelKey: "feat.stream", descKey: "feat.stream.d", group: "generation" },
  { key: "prompt_versioning", labelKey: "feat.prompt", descKey: "feat.prompt.d", group: "generation" },
  { key: "ab_testing", labelKey: "feat.ab", descKey: "feat.ab.d", group: "generation" },
  { key: "canary", labelKey: "feat.canary", descKey: "feat.canary.d", group: "generation" },
  { key: "groundedness", labelKey: "feat.ground", descKey: "feat.ground.d", group: "quality" },
  { key: "retrieval_evaluation", labelKey: "feat.eval", descKey: "feat.eval.d", group: "quality" },
  { key: "observability", labelKey: "feat.trace", descKey: "feat.trace.d", group: "ops" },
  { key: "incremental_indexing", labelKey: "feat.incr", descKey: "feat.incr.d", group: "ops" },
];

// Decorative ticker tape for the top strip (illustrative, not live market data).
export const TICKER = [
  ["IDX COMPOSITE", "7,243.18", "+0.62%", true],
  ["USD/IDR", "16,180", "-0.14%", false],
  ["BRENT", "$82.40", "+1.05%", true],
  ["BTC", "$71,920", "+2.31%", true],
  ["GOLD", "$2,388", "+0.40%", true],
  ["US 10Y", "4.21%", "+3bp", false],
  ["S&P 500", "5,612", "+0.48%", true],
  ["ETH", "$3,840", "+1.77%", true],
];
