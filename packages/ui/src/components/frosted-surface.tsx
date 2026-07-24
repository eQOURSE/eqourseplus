import {
  forwardRef,
  type HTMLAttributes,
  type PropsWithChildren,
} from "react";

export type FrostedSurfaceVariant = "nav" | "card" | "panel";
export type FrostedSurfaceGlassTier = "clear" | "regular";

export interface FrostedSurfaceProps
  extends PropsWithChildren<HTMLAttributes<HTMLDivElement>> {
  glassTier?: FrostedSurfaceGlassTier;
  variant?: FrostedSurfaceVariant;
}

export const FrostedSurface = forwardRef<
  HTMLDivElement,
  FrostedSurfaceProps
>(function FrostedSurface(
  {
    children,
    className = "",
    glassTier = "regular",
    variant = "card",
    ...props
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className={`eq-frosted eq-frosted--${variant} eq-glass-surface eq-glass-tier-${glassTier} ${className}`.trim()}
      data-glass-visual-tier={glassTier}
      {...props}
    >
      {children}
    </div>
  );
});
