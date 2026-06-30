/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      colors: {
        paper: "#FBF9F4",
        ink: "#0F1A2E",
        ink2: "#1e2a3a",
        gold: "#C8962A",
        goldsoft: "#FBF3DE",
        blue: "#1A5C9E",
        bluesoft: "#EEF3FB",
        line: "#E6E0D4",
        line2: "#F0EEE7",
        muted: "#6b7685",
        faint: "#a99e83",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,26,46,0.04), 0 4px 16px rgba(15,26,46,0.04)",
        lift: "0 8px 30px rgba(15,26,46,0.10)",
      },
      keyframes: {
        ticker: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        fadeUp: { "0%": { opacity: 0, transform: "translateY(6px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        pulse2: { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.4 } },
      },
      animation: {
        ticker: "ticker 40s linear infinite",
        fadeUp: "fadeUp .35s ease both",
        pulse2: "pulse2 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
