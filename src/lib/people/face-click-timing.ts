/** Delay single-click so double-click can cancel it (face wheel spokes). */
export function scheduleSingleClick(
  timerRef: { current: ReturnType<typeof setTimeout> | null },
  action: () => void,
  delayMs = 280,
): void {
  if (timerRef.current) clearTimeout(timerRef.current);
  timerRef.current = setTimeout(() => {
    timerRef.current = null;
    action();
  }, delayMs);
}

export function cancelSingleClick(
  timerRef: { current: ReturnType<typeof setTimeout> | null },
): void {
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}
