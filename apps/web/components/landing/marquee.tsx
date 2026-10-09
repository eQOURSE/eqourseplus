import type { CSSProperties, ReactNode } from "react";

type MarqueeProps = {
  children: ReactNode;
  speed?: string;
  gap?: string;
  reverse?: boolean;
  className?: string;
};

/**
 * CSS-only infinite marquee (two identical tracks). Always decorative:
 * callers expose the same content to assistive tech separately.
 */
export function Marquee({ children, speed = "40s", gap, reverse = false, className = "" }: MarqueeProps) {
  const style = { "--speed": speed, ...(gap ? { "--gap": gap } : {}) } as CSSProperties;
  return (
    <div
      className={`q-marquee${reverse ? " q-marquee--reverse" : ""}${className ? ` ${className}` : ""}`}
      style={style}
      aria-hidden="true"
    >
      <div className="q-marquee__track">{children}</div>
      <div className="q-marquee__track">{children}</div>
    </div>
  );
}
