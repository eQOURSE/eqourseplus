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
      light:
        "linear-gradient(180deg,rgba(255,255,255,0.34) 0%,rgba(255,255,255,0.10) 45%,rgba(255,255,255,0.22) 100%)",
      dark:
        "linear-gradient(180deg,rgba(255,255,255,0.13) 0%,rgba(35,45,70,0.20) 45%,rgba(255,255,255,0.07) 100%)",
      blur: "14px",
    },
    clear: {
      light: "rgba(255,255,255,0.25)",
      dark: "rgba(35,45,70,0.25)",
      blur: "8px",
    },
    focal: {
      blur: "4px",
      light:
        "linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))",
      dark:
        "linear-gradient(180deg,rgba(255,255,255,0.08),rgba(35,45,70,0.14))",
    },
    specularMaxAlpha: 0.4,
    hairlineMaxAlpha: 0.95,
    rimMaxAlpha: 0.18,
  },
  surfaces: {
    paper: {
      hsl: "160 30% 98%",
      hex: "#F7FAF9",
    },
    light: {
      sunken: "168 22% 88%",
      background: "168 26% 93%",
      card: "0 0% 100%",
      elevated: "0 0% 100%",
    },
    dark: {
      sunken: "242 30% 5%",
      background: "242 34% 7%",
      card: "242 24% 12%",
      elevated: "242 22% 15%",
    },
  },
} as const;

export const responsiveTokens = designTokens.breakpoints;
export const motionTokens = designTokens.motion;
