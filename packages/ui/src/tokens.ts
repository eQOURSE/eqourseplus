export const designTokens = {
  colors: {
    background: "#F7FAF9",
    foreground: "#232145",
    card: "#FFFFFF",
    secondary: "#EEF5F2",
    muted: "#F2F5F4",
    mutedForeground: "#63607A",
    primary: {
      hsl: "170 82% 32%",
      hex: "#0F9B8E",
    },
    accent: {
      hsl: "165 75% 71%",
      hex: "#7BE8C9",
    },
    navy: "#232145",
    destructive: "#EF4444",
    border: "#E0E8E4",
    ring: "#0F9B8E",
  },
  fonts: {
    body: "Inter, sans-serif",
    heading: "Plus Jakarta Sans, sans-serif",
  },
  gradients: {
    primary:
      "linear-gradient(135deg, hsl(170, 82%, 32%), hsl(165, 75%, 50%))",
  },
  radius: "0.75rem",
  shadows: {
    soft: "0 4px 20px -4px hsl(170 82% 32% / 0.15)",
    card: "0 8px 30px -8px hsl(242 33% 20% / 0.08)",
    elevated: "0 20px 60px -15px hsl(242 33% 20% / 0.12)",
  },
} as const;
