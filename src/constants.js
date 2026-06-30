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
