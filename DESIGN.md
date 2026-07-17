# eQOURSE Design System — Complete Reference

> **Purpose:** This document is the single source of truth for every design decision in the current `eqourse.com` website. Use it to replicate the exact look and feel on the new **eQOURSE+** platform while adding enhanced motion-graphic capabilities.

---

## Table of Contents

1. [Color Palette](#1-color-palette)
2. [Typography](#2-typography)
3. [Gradients](#3-gradients)
4. [Shadows & Elevation](#4-shadows--elevation)
5. [Border Radius & Spacing](#5-border-radius--spacing)
6. [Glassmorphism & Surface Effects](#6-glassmorphism--surface-effects)
7. [Animation Library](#7-animation-library)
8. [Component Patterns](#8-component-patterns)
9. [Icon System](#9-icon-system)
10. [Responsive Breakpoints & Layout](#10-responsive-breakpoints--layout)
11. [Accessibility & Reduced Motion](#11-accessibility--reduced-motion)
12. [Enhanced Animations for eQOURSE+](#12-enhanced-animations-for-eqourse)

---

## 1. Color Palette

All colors are stored as HSL triplets in CSS custom properties. This means every component references a token, not a raw color value.

### Light Mode (`:root`)

| Token | HSL Value | Hex Approx. | Usage |
|:---|:---|:---|:---|
| `--background` | `160 30% 98%` | `#f7faf9` | Page background |
| `--foreground` | `242 33% 20%` | `#232145` | Body text, headings |
| `--card` | `0 0% 100%` | `#ffffff` | Card surfaces |
| `--card-foreground` | `242 33% 20%` | `#232145` | Card text |
| **`--primary`** | **`170 82% 32%`** | **`#0f9b8e`** | **Primary brand teal** |
| `--primary-foreground` | `0 0% 100%` | `#ffffff` | Text on primary |
| `--secondary` | `160 25% 95%` | `#eef5f2` | Light teal tint |
| `--muted` | `160 15% 96%` | `#f2f5f4` | Muted backgrounds |
| `--muted-foreground` | `242 15% 45%` | `#63607a` | Secondary/placeholder text |
| **`--accent`** | **`165 75% 71%`** | **`#7be8c9`** | **Accent mint green** |
| `--destructive` | `0 84% 60%` | `#ef4444` | Error/destructive actions |
| `--border` | `160 15% 90%` | `#e0e8e4` | Borders & dividers |
| `--ring` | `170 82% 32%` | `#0f9b8e` | Focus rings |
| **`--navy`** | **`242 33% 25%`** | **`#2b2856`** | **Dark navy (hero, footer)** |

### Dark Mode (`.dark`)

| Token | HSL Value | Hex Approx. | Usage |
|:---|:---|:---|:---|
| `--background` | `242 33% 8%` | `#0e0d1b` | Page background |
| `--foreground` | `160 20% 95%` | `#eef5f2` | Body text |
| `--primary` | `170 82% 38%` | `#14b8a6` | Primary teal (brighter) |
| `--accent` | `165 75% 55%` | `#3dcbb0` | Accent green |
| `--border` | `242 20% 20%` | `#2d2a47` | Borders |

### Hardcoded Accent Colors (Used Inline)

| Color | HSL / Hex | Where Used |
|:---|:---|:---|
| Sky blue | `hsl(200, 85%, 50%)` / `#38bdf8` | AI Data sections, AI badges, chip-bar fills |
| Teal-300 | `hsl(170, 82%, 65%)` / `#5eead4` | Hero badge text, ISO labels |
| Teal-400 | `#2dd4bf` | Content capability chip-bar, progress fills |
| Yellow-400 | `#facc15` | Star ratings |
| Footer bg | `#232145` | Footer section |
| Hero overlay | `hsl(242, 33%, 10%-14%)` at 70-85% opacity | Hero dark gradient |

---

## 2. Typography

### Font Stack

| Role | Font Family | Weights Used | Import |
|:---|:---|:---|:---|
| **Body** | `Inter` | 300, 400, 500, 600, 700, 800, 900 | Google Fonts |
| **Headings** | `Plus Jakarta Sans` | 400, 500, 600, 700, 800 | Google Fonts |

### Tailwind Config

```ts
fontFamily: {
  sans: ['Inter', 'sans-serif'],
  heading: ['Plus Jakarta Sans', 'sans-serif'],
}
```

### Heading Scale (Used Across Components)

| Element | Classes Used | Example |
|:---|:---|:---|
| Hero h1/h2 | `text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1]` | Main homepage headline |
| Section h2 | `text-3xl md:text-4xl font-bold` | "Why Choose eQOURSE?" |
| Card h3 | `font-heading font-semibold text-foreground` | Card titles |
| Section labels | `text-sm font-semibold tracking-wider uppercase text-primary` | "Our Impact", "Why eQOURSE" |
| Body text | `text-sm text-muted-foreground leading-relaxed` | Card descriptions |
| Micro labels | `text-[10px] uppercase tracking-[0.14em]` | Stats labels, badge subtitles |
| Tags | `text-[10px] font-bold uppercase tracking-widest` | Category tags |

### Text Gradient Effect

```css
.text-gradient {
  background-clip: text;
  -webkit-text-fill-color: transparent;
  background-image: linear-gradient(135deg, hsl(170, 82%, 32%), hsl(165, 75%, 50%));
}
```

---

## 3. Gradients

| Name | CSS Value | Usage |
|:---|:---|:---|
| **`--gradient-primary`** | `linear-gradient(135deg, hsl(170, 82%, 32%), hsl(165, 75%, 50%))` | Primary buttons, icon backgrounds, text gradient |
| **`--gradient-hero`** | `linear-gradient(135deg, hsl(242, 33%, 18%), hsl(242, 30%, 28%))` | Service page hero backgrounds |
| **`--gradient-card`** | `linear-gradient(145deg, hsl(0, 0%, 100%), hsl(160, 20%, 97%))` | Card surfaces (subtle) |
| Hero overlay | `linear-gradient(135deg, hsl(242 33% 10%/0.85), hsl(242 33% 14%/0.7), hsl(170 60% 14%/0.65))` | Dark hero overlay on video |
| Footer-to-top | `linear-gradient(to top, rgba(10,12,28,0.55) 0%, transparent 100%)` | Hero bottom fade |
| Glassmorphism panel | `linear-gradient(160deg, rgba(15,18,35,0.55), rgba(15,40,40,0.45))` | Hero info card |

---

## 4. Shadows & Elevation

| Token | CSS Value | Usage |
|:---|:---|:---|
| `--shadow-soft` | `0 4px 20px -4px hsl(170 82% 32% / 0.15)` | Primary buttons, icon containers |
| `--shadow-card` | `0 8px 30px -8px hsl(242 33% 20% / 0.08)` | Standard card elevation |
| `--shadow-elevated` | `0 20px 60px -15px hsl(242 33% 20% / 0.12)` | Modals, hero panels, floating badges |

### Neon Card Hover Effect

```css
.neon-card {
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              box-shadow 0.4s ease,
              border-color 0.4s ease;
}
.neon-card:hover {
  transform: translateY(-6px);
  box-shadow:
    0 0 15px hsl(170 82% 32% / 0.3),
    0 0 40px hsl(170 82% 32% / 0.15),
    0 0 80px hsl(170 82% 32% / 0.07);
  border-color: hsl(170 82% 45% / 0.5);
}
```

### Glow Border (Gradient outline on hover)

```css
.glow-border::after {
  content: '';
  position: absolute;
  inset: -2px;
  background: var(--gradient-primary);
  border-radius: inherit;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.glow-border:hover::after { opacity: 0.5; }
```

---

## 5. Border Radius & Spacing

| Token | Value | Usage |
|:---|:---|:---|
| `--radius` | `0.75rem` (12px) | Base radius for buttons, inputs |
| `lg` | `var(--radius)` = 12px | Cards, modals |
| `md` | `calc(var(--radius) - 2px)` = 10px | Inner elements |
| `sm` | `calc(var(--radius) - 4px)` = 8px | Tags, small chips |
| Hero panels | `rounded-3xl` (24px) | Hero glassmorphism cards |
| Pill buttons | `rounded-full` (9999px) | Tab switchers, CTA pills, badges |
| Icon containers | `rounded-lg` (8px) or `rounded-xl` (12px) | Icon backgrounds |

### Container

```ts
container: {
  center: true,
  padding: "2rem",
  screens: { "2xl": "1400px" },
}
```

### Section Spacing

| Pattern | Classes |
|:---|:---|
| Full sections | `py-16 sm:py-24` |
| Heading to content | `mb-8 sm:mb-12` or `mb-10 sm:mb-14` |
| Card internal padding | `p-4` to `p-6` |
| Grid gaps | `gap-4` to `gap-12` |

---

## 6. Glassmorphism & Surface Effects

### Glass (Light - Navbar, floating elements)

```css
.glass {
  backdrop-filter: blur(12px);
  background: hsl(0 0% 100% / 0.8);
  border: 1px solid hsl(0 0% 100% / 0.3);
}
```

### Glass Dark (Hero panels, dark contexts)

```css
.glass-dark {
  backdrop-filter: blur(14px);
  background: hsl(242 33% 12% / 0.55);
  border: 1px solid hsl(170 82% 50% / 0.2);
}
```

### Hero Panel Glassmorphism (Inline style)

```ts
{
  background: "linear-gradient(160deg, rgba(15,18,35,0.55), rgba(15,40,40,0.45))",
  backdropFilter: "blur(20px) saturate(140%)",
  boxShadow: "0 30px 80px -20px rgba(0,0,0,0.55)",
}
```

### Dot Grid Overlay (Background texture)

```css
background-image: radial-gradient(circle, hsl(170 82% 60%) 1px, transparent 1px);
background-size: 40px 40px;
opacity: 0.04;
```

---

## 7. Animation Library

### Core Motion Classes

| Class | Keyframe | Duration | Easing | Usage |
|:---|:---|:---|:---|:---|
| `.animate-float` | `float` | `6s` infinite | ease-in-out | Background blobs |
| `.animate-float-delayed` | `float` | `6s` infinite (2s delay) | ease-in-out | Secondary blobs |
| `.animate-slide-up` | `slideUp` | `0.8s` forwards | ease-out | Entrance reveal |
| `.animate-slide-up-delayed` | `slideUp` | `0.8s` (0.2s delay) | ease-out | Staggered entrance |
| `.animate-slide-up-delayed-2` | `slideUp` | `0.8s` (0.4s delay) | ease-out | Third stagger |
| `.animate-fade-in-up` | `fadeInUp` | `0.8s` forwards | cubic-bezier(0.16,1,0.3,1) | Premium entrance |
| `.animate-scale-in` | `scaleIn` | `0.6s` forwards | cubic-bezier(0.16,1,0.3,1) | Scale-up entrance |
| `.animate-scroll-left` | `scrollLeft` | `30s` linear infinite | linear | Client logo marquee |
| `.animate-rotate-loop` | `rotateLoop` | `20s` linear infinite | linear | Decorative rotation |
| `.animate-dash-flow` | `dashFlow` | `2.3s` linear infinite | linear | SVG path animation |
| `.animate-draw-line` | `drawLine` | `1.4s` forwards | ease-out | SVG line draw |

### Scroll-Triggered Reveal

```css
.reveal-up {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.reveal-up.visible {
  opacity: 1;
  transform: translateY(0);
}

.reveal-scale {
  opacity: 0;
  transform: translateY(16px) scale(0.96);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.reveal-scale.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}
```

### Crossfade Toggle (Panels)

```css
.process-section-panel {
  max-height: 0; opacity: 0; visibility: hidden;
  transform: translateY(14px);
  transition:
    max-height 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    opacity 0.4s ease,
    transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.process-section-panel--active {
  max-height: 2000px; opacity: 1; visibility: visible;
  transform: translateY(0);
}
```

### Specialty Animations

| Animation | Duration | Purpose |
|:---|:---|:---|
| `heroCTAPulse` | `2.4s` infinite | Pulsing glow ring on hero CTA |
| `heroCTABounce` | `1.6s` infinite | Gentle bounce on chevron icon |
| `chipBarFill` | `2.8s` linear | Progress bar fill in hero chips |
| `cubeRot` | variable (`--rot-speed`, default 10s) | 3D cube rotation |
| `wbDraw` | variable (`--draw-speed`, default 4.5s) | SVG whiteboard stroke drawing |
| `charBob` | walk cycle | 2D character bob for illustrations |
| `mgFloat1/2/3` | varied | Motion graphic floating shapes |
| `kineticType` | multi-phase | Kinetic typography entrance/exit |
| `why-scroll-up` | `35s` linear infinite | Vertical auto-scroll marquee |
| `shimmer` | loading shimmer | Skeleton loading effect |

### Hover Transitions Used Throughout

```css
/* Standard interactive element */
transition-all duration-300

/* Buttons */
hover:opacity-90 hover:scale-105 transition-all

/* Cards */
hover:bg-primary/5 hover:text-primary transition-colors

/* Icon containers on hover */
group-hover:bg-gradient-primary transition-all duration-300
```

---

## 8. Component Patterns

### 8.1 Section Header Pattern

Every section follows this exact pattern:

```jsx
<span className="text-sm font-semibold tracking-wider uppercase text-primary">
  Section Label
</span>
<h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-2">
  Heading with <span className="text-gradient">Accent</span>
</h2>
```

### 8.2 Card Pattern (Standard)

```jsx
<article className="group p-4 rounded-xl bg-card border border-border/50
                    hover:border-primary/30 neon-card transition-all duration-300">
  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center
                  group-hover:bg-gradient-primary transition-all duration-300">
    <Icon className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
  </div>
  <h3 className="font-heading font-semibold text-foreground">Title</h3>
  <p className="text-sm text-muted-foreground leading-relaxed">Description</p>
  <p className="text-xs text-primary/60 font-medium">Tags</p>
</article>
```

### 8.3 Hero Pattern (Service Pages)

- **Background:** `bg-gradient-hero` (navy gradient) with floating teal blobs + dot grid overlay
- **Layout:** 2-column grid (`lg:grid-cols-2`)
- **Left:** Badge pill → h1 (white + text-gradient accent) → subtitle → CTA button → stat strip
- **Right:** Rounded-3xl image/video panel with floating glassmorphism badges (rotating chip + bottom badge)
- **CTA Button:** `bg-gradient-primary border-0 shadow-soft hover:opacity-90 hover:scale-[1.02]`

### 8.4 Tab Switcher (Pill Style)

```jsx
<div className="inline-flex items-center gap-1 p-1 rounded-full bg-card border border-border/50">
  <button className={active
    ? "bg-gradient-primary text-primary-foreground shadow-soft"
    : "text-muted-foreground hover:text-foreground"
  }>
```

### 8.5 Badge / Chip Pattern

```jsx
<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                bg-primary/10 border border-primary/20">
  <Icon className="w-4 h-4 text-primary" />
  <span className="text-sm font-semibold text-primary">Label</span>
</div>
```

### 8.6 Stats Display

```jsx
<div className="text-2xl md:text-3xl font-bold text-gradient">{value}</div>
<div className="text-xs text-white/60 mt-1">{label}</div>
```

### 8.7 CTA Section (Full-width with video background)

- Background: looping crossfade video (two `<video>` elements with JS-controlled opacity swap)
- Overlay: `bg-foreground/15` or `/40`
- Content: centered heading (white) + subtitle + two buttons (gradient primary + glass outline)

### 8.8 Footer

- Background: `#232145` (navy)
- 7-column grid on desktop
- Brand section: logo + description + ISO badges + social icons (round, bordered, hover lift)
- Link style: `text-sm text-white/80 hover:text-primary`
- Heading style: `font-bold text-lg uppercase tracking-wider border-b-2 border-primary/80 text-white`

### 8.9 Marquee / Auto-Scroll

- Vertical: `animation: why-scroll-up 35s linear infinite; pause on hover`
- Horizontal: JS `requestAnimationFrame` scroll at 0.5px/frame, pause on touch/hover

---

## 9. Icon System

| Library | Usage |
|:---|:---|
| **Lucide React** | All UI icons (primary icon set) |

### Icon Container Sizes

| Size | Classes | Usage |
|:---|:---|:---|
| Small | `w-9 h-9 rounded-lg` | Mobile cards, sub-service items |
| Medium | `w-10 h-10 rounded-lg` | Standard cards |
| Large | `w-11 h-11 rounded-xl` | Hero panel headers |
| Social | `w-10 h-10 rounded-full border border-white/20 bg-white/5` | Footer social icons |

---

## 10. Responsive Breakpoints & Layout

### Tailwind Breakpoints (Default)

| Breakpoint | Min Width |
|:---|:---|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1400px (container max) |

### Layout Patterns

| Pattern | Desktop | Tablet | Mobile |
|:---|:---|:---|:---|
| Hero | 12-col grid (7+5) | Stack | Stack |
| Services | 3-col grid | 2-col | 1-col |
| Footer | 7-col grid | 2-col | 1-col |
| Stats | Flex row with dividers | Flex wrap | 4-col grid |
| Cards | Grid | Grid | Horizontal scroll strip |
| Mega menu | Multi-panel flyout | — | Accordion |

---

## 11. Accessibility & Reduced Motion

### `prefers-reduced-motion: reduce`

All animations are disabled:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-float, .animate-slide-up, .animate-rotate-loop,
  .animate-dash-flow, .animate-draw-line, .animate-fade-in-up,
  .animate-scale-in, .hero-chip-bar {
    animation: none !important;
  }
  .reveal-up, .reveal-scale {
    opacity: 1 !important;
    transform: none !important;
  }
}
```

### Other Accessibility Practices

- `sr-only` class for screen-reader-only headings (e.g., hero h1)
- `aria-label` on interactive sections, navigation landmarks, social links
- `aria-hidden="true"` on decorative videos and blobs
- Semantic HTML: `<section>`, `<nav>`, `<article>`, `<footer>`
- Focus-visible rings: `focus-visible:ring-2 focus-visible:ring-primary/60`

---

## 12. Enhanced Animations for eQOURSE+

> [!TIP]
> The current site already has a rich animation vocabulary. For the new platform, you can extend it with these **additional** effects while keeping the same color palette, easing curves, and timing philosophy.

### Recommended Additions

| Animation | Description | Implementation |
|:---|:---|:---|
| **Stagger Grid Reveal** | Cards fade-in one by one (50-100ms stagger per card) | Use `animation-delay` with CSS `nth-child` or Framer Motion `staggerChildren` |
| **Number Counter (Smooth)** | Smooth interpolated count-up for dashboard stats | Already exists (`CountUpValue`). Upgrade to use `requestAnimationFrame` with easeOutExpo |
| **Parallax Scroll** | Subtle vertical parallax on hero background layers | CSS `transform: translateY(calc(var(--scroll) * 0.3))` driven by scroll listener |
| **Morphing Icons** | Icons smoothly transition between states (e.g., menu → close) | Use Framer Motion `AnimatePresence` + `layoutId` |
| **Skeleton Shimmer** | Loading states with gradient shimmer sweep | Already exists (`shimmer` keyframe). Apply to dashboard loading states |
| **Micro-interactions** | Button click ripple, toggle spring, progress bar pulse | CSS `@keyframes ripple` with pseudo-element + spring easing |
| **Page Transitions** | Crossfade between routes with slide direction | Framer Motion `AnimatePresence` wrapping `<Routes>` |
| **Lottie Illustrations** | Replace static SVG illustrations with animated Lottie files | `lottie-react` library for hero decorations and empty states |
| **Cursor Trail** | Subtle teal glow following mouse on hero sections | CSS `radial-gradient` positioned via `mousemove` listener |
| **Scroll Progress Bar** | Thin teal bar at top showing page scroll progress | Fixed `div` with width driven by `scrollY / scrollHeight` |

### Easing Curves to Use

| Curve | CSS | When |
|:---|:---|:---|
| **Standard ease** | `ease` or `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Most transitions |
| **Decelerate (entrance)** | `cubic-bezier(0.16, 1, 0.3, 1)` | `fadeInUp`, `scaleIn` |
| **Spring** | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Button bounces, toggle pops |
| **Linear** | `linear` | Marquees, continuous rotation |

### Timing Philosophy

- **Entrance animations:** 0.6–0.8s with stagger offsets of 0.1–0.2s
- **Hover transitions:** 0.3s standard, 0.4s for transforms with shadows
- **Continuous loops:** 6s for gentle float, 20–35s for marquee/rotation
- **Micro-interactions:** 0.15–0.25s (immediate feel)
