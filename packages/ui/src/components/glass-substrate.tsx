import type { HTMLAttributes } from "react";

export type GlassSubstrateProps = HTMLAttributes<HTMLDivElement>;

export function GlassSubstrate({
  className = "",
  ...props
}: GlassSubstrateProps) {
  return (
    <div
      aria-hidden="true"
      className={`eq-glass-substrate ${className}`.trim()}
      {...props}
    />
  );
}
