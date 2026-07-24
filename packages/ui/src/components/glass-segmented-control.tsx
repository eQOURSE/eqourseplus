"use client";

import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
} from "react";

import { getNextSegmentIndex } from "../glass/segmented-control";
import { Glass } from "./glass";

export interface GlassSegmentOption<Value extends string = string> {
  label: string;
  value: Value;
}

export interface GlassSegmentedControlProps<
  Value extends string = string,
> extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  onValueChange: (value: Value) => void;
  options: readonly GlassSegmentOption<Value>[];
  value: Value;
  activated?: boolean;
}

type SegmentedStyle = CSSProperties & {
  "--segment-count": number;
  "--segment-index": number;
};

export function GlassSegmentedControl<Value extends string = string>({
  activated = false,
  className = "",
  onFocusCapture,
  onValueChange,
  onPointerEnter,
  options,
  style,
  value,
  ...props
}: GlassSegmentedControlProps<Value>) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [interactionActivated, setInteractionActivated] = useState(false);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const segmentedStyle = useMemo(
    () =>
      ({
        ...style,
        "--segment-count": Math.max(1, options.length),
        "--segment-index": selectedIndex,
      }) satisfies SegmentedStyle,
    [options.length, selectedIndex, style],
  );

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    const nextIndex = getNextSegmentIndex(
      event.key,
      currentIndex,
      options.length,
    );
    if (nextIndex === currentIndex && !["Home", "End"].includes(event.key)) {
      return;
    }

    const nextOption = options[nextIndex];
    if (!nextOption) {
      return;
    }

    event.preventDefault();
    onValueChange(nextOption.value);
    buttonRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      role="radiogroup"
      className={`eq-glass-segmented eq-glass-surface eq-glass-tier-regular ${className}`.trim()}
      data-glass-visual-tier="regular"
      onFocusCapture={(event) => {
        setInteractionActivated(true);
        onFocusCapture?.(event);
      }}
      onPointerEnter={(event) => {
        setInteractionActivated(true);
        onPointerEnter?.(event);
      }}
      style={segmentedStyle}
      {...props}
    >
      {options.length > 0 ? (
        <Glass
          aria-hidden="true"
          activated={activated || interactionActivated}
          className="eq-glass-segmented__lens"
          data-focal-candidate="1"
          strength={24}
          refractedContent={
            <div
              aria-hidden="true"
              className="eq-glass-segmented__backing"
              data-testid="glass-segmented-backing"
            >
              {options.map((option) => (
                <span
                  className="eq-glass-segmented__backing-label"
                  key={option.value}
                >
                  {option.label}
                </span>
              ))}
            </div>
          }
        />
      ) : null}

      <div className="eq-glass-segmented__controls">
        {options.map((option, index) => {
          const selected = index === selectedIndex;

          return (
            <button
              aria-checked={selected}
              className="eq-glass-segmented__control"
              data-state={selected ? "active" : "inactive"}
              key={option.value}
              onClick={() => onValueChange(option.value)}
              onKeyDown={(event) => {
                handleKeyDown(event, index);
              }}
              ref={(node) => {
                buttonRefs.current[index] = node;
              }}
              role="radio"
              tabIndex={selected ? 0 : -1}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
