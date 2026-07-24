import type { Config } from "tailwindcss";

import { designTokens } from "../../packages/ui/src/tokens";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  darkMode: ["class"],
  theme: {
    screens: {
      sm: designTokens.breakpoints.sm,
      md: designTokens.breakpoints.md,
      lg: designTokens.breakpoints.lg,
      xl: designTokens.breakpoints.xl,
      "2xl": designTokens.breakpoints["2xl"],
    },
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": designTokens.breakpoints["2xl"] },
    },
    extend: {
      backgroundImage: {
        "gradient-primary": designTokens.gradients.primary,
      },
      borderRadius: {
        lg: designTokens.radius,
        md: `calc(${designTokens.radius} - 2px)`,
        sm: `calc(${designTokens.radius} - 4px)`,
      },
      boxShadow: designTokens.shadows,
      colors: {
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        background: "hsl(var(--background) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        navy: "hsl(var(--navy) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        ring: "hsl(var(--ring) / <alpha-value>)",
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
      },
      fontFamily: {
        heading: ["Plus Jakarta Sans", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
