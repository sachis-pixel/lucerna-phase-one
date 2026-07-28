import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Named to match the Lucerna Workbench sibling app's design tokens.
        ink: "#191322",
        alert: "#B8432A", // ember
        guardian: "#4C7A5E", // verdant
        parchment: "#F1EAD8", // paper
        arcane: "#241B33", // inkSoft
        brass: "#D9A441" // gold
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        rune: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      keyframes: {
        shake: { "0%,100%": { transform: "translateX(0)" }, "20%,60%": { transform: "translateX(-8px)" }, "40%,80%": { transform: "translateX(8px)" } },
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        pulseglow: { "0%,100%": { opacity: "0.6" }, "50%": { opacity: "1" } },
        revealIn: {
          "0%": { opacity: "0", transform: "translateY(14px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" }
        },
        popIn: {
          "0%": { opacity: "0", transform: "scale(0.5) rotate(-8deg)" },
          "60%": { opacity: "1", transform: "scale(1.15) rotate(4deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(0)" }
        }
      },
      animation: {
        shake: "shake 0.4s ease-in-out 2",
        floaty: "floaty 3s ease-in-out infinite",
        pulseglow: "pulseglow 1.6s ease-in-out infinite",
        revealIn: "revealIn 450ms cubic-bezier(0.16,1,0.3,1) both",
        popIn: "popIn 500ms cubic-bezier(0.16,1,0.3,1) both"
      }
    }
  },
  plugins: []
};
export default config;
