export type SegmentedControlNavigationKey =
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "End"
  | "Home";

export function getNextSegmentIndex(
  key: string,
  currentIndex: number,
  optionCount: number,
): number {
  if (optionCount <= 0) {
    return 0;
  }

  const safeIndex = Math.min(
    optionCount - 1,
    Math.max(0, currentIndex),
  );

  switch (key as SegmentedControlNavigationKey) {
    case "ArrowDown":
    case "ArrowRight":
      return (safeIndex + 1) % optionCount;
    case "ArrowLeft":
    case "ArrowUp":
      return (safeIndex - 1 + optionCount) % optionCount;
    case "Home":
      return 0;
    case "End":
      return optionCount - 1;
    default:
      return safeIndex;
  }
}
