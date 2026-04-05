export function buildIsoDateRangeAround(
  baseIsoDate: string,
  lookbackDays: number,
  lookaheadDays: number,
): { startIso: string; endIso: string } {
  const base = new Date(baseIsoDate);
  const start = new Date(base);
  start.setDate(start.getDate() - lookbackDays);
  const end = new Date(base);
  end.setDate(end.getDate() + lookaheadDays);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}
