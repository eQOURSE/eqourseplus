"use client";

import {
  forwardRef,
  useRef,
  type ComponentPropsWithoutRef,
  type PointerEvent,
} from "react";

import {
  isLowEndDevice,
  prefersReducedMotion,
} from "../glass/capabilities";

export type GlassButtonProps = ComponentPropsWithoutRef<"button">;

function canTrackPointer(): boolean {
  return !prefersReducedMotion() && !isLowEndDevice();
}

function updatePointerPosition(event: PointerEvent<HTMLButtonElement>) {
  const bounds = event.currentTarget.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) {
    return;
  }

  const x = Math.min(
    100,
    Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100),
  );
  const y = Math.min(
    100,
    Math.max(0, ((event.clientY - bounds.top) / bounds.height) * 100),
  );

  event.currentTarget.style.setProperty("--glass-pointer-x", `${x}%`);
  event.currentTarget.style.setProperty("--glass-pointer-y", `${y}%`);
}

export const GlassButton = forwardRef<
  HTMLButtonElement,
  GlassButtonProps
>(function GlassButton(
  {
    children,
    className = "",
    onPointerDown,
    onPointerEnter,
    onPointerLeave,
    onPointerMove,
    onPointerUp,
    type = "button",
    ...props
  },
  ref,
) {
  const pointerActive = useRef(false);

  return (
    <button
      ref={ref}
      type={type}
      className={`eq-glass-button eq-glass-surface eq-glass-tier-regular ${className}`.trim()}
      data-glass-visual-tier="regular"
      onPointerEnter={(event) => {
        pointerActive.current = canTrackPointer();
        if (pointerActive.current) {
          updatePointerPosition(event);
        }
        onPointerEnter?.(event);
      }}
      onPointerMove={(event) => {
        if (pointerActive.current) {
          updatePointerPosition(event);
        }
        onPointerMove?.(event);
      }}
      onPointerDown={(event) => {
        pointerActive.current = canTrackPointer();
        if (pointerActive.current) {
          updatePointerPosition(event);
        }
        onPointerDown?.(event);
      }}
      onPointerUp={(event) => {
        pointerActive.current =
          canTrackPointer() && event.currentTarget.matches(":hover");
        onPointerUp?.(event);
      }}
      onPointerLeave={(event) => {
        pointerActive.current = false;
        event.currentTarget.style.setProperty("--glass-pointer-x", "50%");
        event.currentTarget.style.setProperty("--glass-pointer-y", "50%");
        onPointerLeave?.(event);
      }}
      {...props}
    >
      <span className="eq-glass-button__label">{children}</span>
    </button>
  );
});
