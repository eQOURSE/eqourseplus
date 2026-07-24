export const MAX_REFRACTION_ELEMENTS = 3;
export const MAX_REFRACTION_WIDTH = 720;
export const MAX_REFRACTION_HEIGHT = 480;
export const MAX_REFRACTION_AREA =
  MAX_REFRACTION_WIDTH * MAX_REFRACTION_HEIGHT;

export type GlassTier = "frosted" | "refraction";
export type RefractionSlot = symbol;

export interface GlassEnvironment {
  isBrowser: boolean;
  supportsSvgFilters: boolean;
  supportsCanvas2d: boolean;
  prefersReducedMotion: boolean;
  isLowEndDevice: boolean;
  disabled: boolean;
  width: number;
  height: number;
  hasRefractionSlot: boolean;
}

interface NavigatorWithHints extends Navigator {
  connection?: {
    saveData?: boolean;
  };
  deviceMemory?: number;
}

let activeRefractionSlots = new Set<RefractionSlot>();

export function resolveGlassTier(environment: GlassEnvironment): GlassTier {
  const {
    disabled,
    hasRefractionSlot,
    height,
    isBrowser,
    isLowEndDevice,
    prefersReducedMotion,
    supportsCanvas2d,
    supportsSvgFilters,
    width,
  } = environment;

  const sourceIsSafe =
    width > 0 &&
    height > 0 &&
    width <= MAX_REFRACTION_WIDTH &&
    height <= MAX_REFRACTION_HEIGHT &&
    width * height <= MAX_REFRACTION_AREA;

  return isBrowser &&
    !disabled &&
    supportsSvgFilters &&
    supportsCanvas2d &&
    !prefersReducedMotion &&
    !isLowEndDevice &&
    hasRefractionSlot &&
    sourceIsSafe
    ? "refraction"
    : "frosted";
}

export function acquireRefractionSlot(): RefractionSlot | null {
  if (activeRefractionSlots.size >= MAX_REFRACTION_ELEMENTS) {
    return null;
  }

  const slot = Symbol("eqourse-refraction-slot");
  activeRefractionSlots.add(slot);
  return slot;
}

export function releaseRefractionSlot(slot: RefractionSlot | null): void {
  if (slot) {
    activeRefractionSlots.delete(slot);
  }
}

export function resetRefractionBudgetForTests(): void {
  activeRefractionSlots = new Set<RefractionSlot>();
}

export function supportsSvgRefraction(): boolean {
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    typeof CSS === "undefined"
  ) {
    return false;
  }

  const supportsFilter =
    CSS.supports("filter", "url(#eqourse-glass-probe)") ||
    CSS.supports("-webkit-filter", "url(#eqourse-glass-probe)");
  const svgNamespace = "http://www.w3.org/2000/svg";
  const filter = document.createElementNS(svgNamespace, "filter");
  const displacement = document.createElementNS(
    svgNamespace,
    "feDisplacementMap",
  );

  return supportsFilter && Boolean(filter) && Boolean(displacement);
}

export function supportsCanvas2d(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  try {
    return Boolean(document.createElement("canvas").getContext("2d"));
  } catch {
    return false;
  }
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function isLowEndDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const hints = navigator as NavigatorWithHints;
  return (
    hints.connection?.saveData === true ||
    (typeof hints.deviceMemory === "number" && hints.deviceMemory <= 4) ||
    (typeof hints.hardwareConcurrency === "number" &&
      hints.hardwareConcurrency <= 4)
  );
}
