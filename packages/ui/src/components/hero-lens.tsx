"use client";

import { type HTMLAttributes, type ReactNode } from "react";

import { Glass } from "./glass";
import { GlassMotifField } from "./glass-motif-field";

export interface HeroLensProps extends HTMLAttributes<HTMLDivElement> {
  activated?: boolean;
  children?: ReactNode;
}

/**
 * Showcase lens: a focal Glass element travels across a sharp motif field,
 * refracting a counter-translated aria-hidden copy of the same field so the
 * bent pixels stay registered with the background (segmented-control pattern).
 * The lens and backing share one keyframe timeline; the displacement map is
 * generated once — motion only moves the filter region, never regenerates it.
 */
export function HeroLens({
  activated = false,
  children,
  className = "",
  ...props
}: HeroLensProps) {
  return (
    <div className={`eq-hero-lens ${className}`.trim()} {...props}>
      <GlassMotifField className="eq-hero-lens__field" />
      <Glass
        aria-hidden="true"
        activated={activated}
        className="eq-hero-lens__lens"
        curvature={70}
        strength={44}
        variant="panel"
        refractedContent={
          <div aria-hidden="true" className="eq-hero-lens__backing">
            <GlassMotifField />
          </div>
        }
      />
      {children ? (
        <div className="eq-hero-lens__content">{children}</div>
      ) : null}
    </div>
  );
}
