import { type HTMLAttributes } from "react";

export type GlassMotifFieldVariant = "field" | "compact";

export interface GlassMotifFieldProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  variant?: GlassMotifFieldVariant;
}

/**
 * Sharp-edged, DESIGN.md §13-colored backing content for focal refraction.
 * Refraction is invisible over featureless blur — these hard-edged motifs
 * are what the lens visibly bends. Decorative only, never interactive.
 */
export function GlassMotifField({
  className = "",
  variant = "field",
  ...props
}: GlassMotifFieldProps) {
  return (
    <div
      aria-hidden="true"
      className={`eq-motif-field eq-motif-field--${variant} ${className}`.trim()}
      {...props}
    >
      <span className="eq-motif-field__layer eq-motif-field__layer--wash" />
      <span className="eq-motif-field__layer eq-motif-field__layer--stripes" />
      <span className="eq-motif-field__layer eq-motif-field__layer--grid" />
      <span className="eq-motif-field__layer eq-motif-field__layer--orb eq-motif-field__layer--orb-teal" />
      <span className="eq-motif-field__layer eq-motif-field__layer--orb eq-motif-field__layer--orb-mint" />
      <span className="eq-motif-field__layer eq-motif-field__layer--orb eq-motif-field__layer--orb-sky" />
      <span className="eq-motif-field__layer eq-motif-field__layer--ring" />
    </div>
  );
}
