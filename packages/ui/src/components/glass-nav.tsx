import {
  forwardRef,
  type ComponentPropsWithoutRef,
} from "react";

export type GlassNavProps = ComponentPropsWithoutRef<"nav">;

export const GlassNav = forwardRef<HTMLElement, GlassNavProps>(
  function GlassNav({ children, className = "", ...props }, ref) {
    return (
      <nav
        ref={ref}
        className={`eq-glass-nav eq-glass-surface eq-glass-tier-regular ${className}`.trim()}
        data-glass-visual-tier="regular"
        {...props}
      >
        {children}
      </nav>
    );
  },
);
