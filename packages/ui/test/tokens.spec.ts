import { describe, expect, it } from "vitest";

import { designTokens } from "../src";

describe("FR-FND-01 canonical eQOURSE design tokens", () => {
  it("matches DESIGN.md and SPEC.md v2.6", () => {
    expect(designTokens.colors.primary).toEqual({
      hsl: "170 82% 32%",
      hex: "#0F9B8E",
    });
    expect(designTokens.colors.accent).toEqual({
      hsl: "165 75% 71%",
      hex: "#7BE8C9",
    });
    expect(designTokens.colors.navy).toBe("#232145");
    expect(designTokens.colors.background).toBe("#F7FAF9");
    expect(designTokens.radius).toBe("0.75rem");
    expect(designTokens.gradients.primary).toBe(
      "linear-gradient(135deg, hsl(170, 82%, 32%), hsl(165, 75%, 50%))",
    );
    expect(designTokens.fonts).toEqual({
      body: "Inter, sans-serif",
      heading: "Plus Jakarta Sans, sans-serif",
    });
    expect(designTokens.breakpoints.semantic).toEqual({
      mobile: { min: 0, max: 767 },
      tablet: { min: 768, max: 1023 },
      desktop: { min: 1024 },
    });
  });
});

describe("FR-PUB-00B theme surface tokens", () => {
  it("publishes both value ladders while retaining canonical paper", () => {
    expect(designTokens.surfaces).toEqual({
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
    });
  });
});
