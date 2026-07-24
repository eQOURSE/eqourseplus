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
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1400px",
    semantic: {
      mobile: { min: 0, max: 767 },
      tablet: { min: 768, max: 1023 },
      desktop: { min: 1024 },
    },
  },
  motion: {
    durations: {
      micro: "0.2s",
      hover: "0.3s",
      transform: "0.4s",
      scaleIn: "0.6s",
      reveal: "0.7s",
      entrance: "0.8s",
    },
    easings: {
      standard: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      entrance: "cubic-bezier(0.16, 1, 0.3, 1)",
      spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      gelPress: "cubic-bezier(0.5, 1.8, 0.4, 0.9)",
      linear: "linear",
    },
  },
  ambient: {
    teal: "#0F9B8E",
    mint: "#7BE8C9",
    navy: "#232145",
    skyBlue: "#38bdf8",
    teal300: "#5eead4",
  },
  glass: {
    regular: {
      light: "rgba(255,255,255,0.55)",
      dark: "rgba(35,45,70,0.45)",
      blur: "18px",
    },
    clear: {
      light: "rgba(255,255,255,0.25)",
      dark: "rgba(35,45,70,0.25)",
      blur: "8px",
    },
    focal: {
      blur: "24px",
    },
    specularMaxAlpha: 0.25,
    rimMaxAlpha: 0.18,
  },
} as const;

export const responsiveTokens = designTokens.breakpoints;
export const motionTokens = designTokens.motion;
