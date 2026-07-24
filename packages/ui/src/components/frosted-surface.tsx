import {
  forwardRef,
  type HTMLAttributes,
  type PropsWithChildren,
} from "react";

export type FrostedSurfaceVariant = "nav" | "card" | "panel";

export interface FrostedSurfaceProps
  extends PropsWithChildren<HTMLAttributes<HTMLDivElement>> {
  variant?: FrostedSurfaceVariant;
}

export const FrostedSurface = forwardRef<
  HTMLDivElement,
  FrostedSurfaceProps
>(function FrostedSurface(
  { children, className = "", variant = "card", ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={`eq-frosted eq-frosted--${variant} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
});
