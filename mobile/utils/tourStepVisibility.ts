export function getFirstPuzzleIndex<T>(
  steps: T[],
  isPuzzleStep: (step: T) => boolean
): number {
  return steps.findIndex(isPuzzleStep);
}

export function getStepsThroughFirstPuzzle<T>(
  steps: T[],
  isPuzzleStep: (step: T) => boolean
): T[] {
  const firstPuzzleIndex = getFirstPuzzleIndex(steps, isPuzzleStep);

  if (firstPuzzleIndex === -1) {
    return steps;
  }

  return steps.slice(0, firstPuzzleIndex + 1);
}

export function isAfterFirstPuzzle<T>(
  steps: T[],
  index: number,
  isPuzzleStep: (step: T) => boolean
): boolean {
  const firstPuzzleIndex = getFirstPuzzleIndex(steps, isPuzzleStep);

  return firstPuzzleIndex !== -1 && index > firstPuzzleIndex;
}
