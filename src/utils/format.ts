export function pluralize(value: number, singular: string, plural: string) {
  return value > 1 ? plural : singular;
}

export function compactNumber(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(value >= 10_000_000_000 ? 0 : 1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return String(value);
}

export function formatCountLabel(value: number, singular: string, plural: string) {
  return `${compactNumber(value)} ${pluralize(value, singular, plural)}`;
}
