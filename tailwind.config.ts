import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        caption: "hsl(var(--caption))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          hover: "hsl(var(--primary-hover))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        deadline: "hsl(var(--deadline))",
        "flag-red": "hsl(var(--flag-red))",
        "flag-yellow": "hsl(var(--flag-yellow))",
        "flag-green": "hsl(var(--flag-green))",
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-source-serif)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "fluid-hero": ["clamp(2.5rem, 5vw, 4.5rem)", { lineHeight: "1.1" }],
        "fluid-h1": ["clamp(2rem, 4vw, 3rem)", { lineHeight: "1.15" }],
        "fluid-h2": ["clamp(1.5rem, 3vw, 2rem)", { lineHeight: "1.2" }],
        "fluid-h3": ["clamp(1.25rem, 2vw, 1.5rem)", { lineHeight: "1.3" }],
      },
      boxShadow: {
        sm: "0 1px 2px rgba(15, 23, 42, 0.04)",
        md: "0 4px 12px rgba(15, 23, 42, 0.06)",
        lg: "0 12px 32px rgba(15, 23, 42, 0.08)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
