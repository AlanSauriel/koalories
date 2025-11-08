/**
 * Format a number with thousand separators
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-MX').format(Math.round(num));
}

/**
 * Format calories with "kcal" suffix
 */
export function formatCalories(kcal: number): string {
  return `${formatNumber(kcal)} kcal`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
