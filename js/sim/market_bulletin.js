// A dawn price moves in two steps: cycle/weather baseline, then the roll.
// Use actual applied prices, not theoretical shocks (which can hit the floor).
const cents = (value) => Math.round(Number(value.toFixed(2)) * 100);
export function buildMarketBulletin(moves) {
  return moves
    .filter((move) => [move.previous, move.baseline, move.current]
      .every((value) => Number.isFinite(value) && value > 0))
    .map((move) => ({
      ...move,
      cycleCents: cents(move.baseline) - cents(move.previous),
      rollCents: cents(move.current) - cents(move.baseline),
      changeCents: cents(move.current) - cents(move.previous)
    }))
    .filter((move) => move.cycleCents || move.rollCents)
    .sort((a, b) => Math.abs(b.changeCents) / cents(b.previous) - Math.abs(a.changeCents) / cents(a.previous)
      || Math.abs(b.rollCents) - Math.abs(a.rollCents))
    .slice(0, 3);
}

// Today's quote is compared with completed days only, without inventing
// prices for days before the crop was unlocked.
export function getPriorMarketRange(history, itemId, day) {
  const quotes = new Map();
  for (const entry of Array.isArray(history) ? history : []) {
    const quote = Number(entry?.prices?.[itemId]);
    const quoteDay = Number(entry?.day);
    if (Number.isInteger(quoteDay) && quoteDay >= Math.max(1, day - 7) &&
      quoteDay < day && Number.isFinite(quote) && quote > 0) {
      quotes.set(quoteDay, cents(quote));
    }
  }
  const values = [...quotes.values()];
  if (values.length < 3) return null;
  return { low: Math.min(...values), high: Math.max(...values), count: values.length };
}

export function describeMarketRange(range, current) {
  if (!range) return '';
  const amount = cents(current);
  const period = range.count === 7 ? 'previous 7 days' : `${range.count} earlier quotes`;
  const comparison = amount > range.high ? 'Above' : amount < range.low ? 'Below' : 'Within';
  const low = `$${(range.low / 100).toFixed(2)}`;
  const high = `$${(range.high / 100).toFixed(2)}`;
  return `${comparison} recent range · ${range.low === range.high ? low : `${low}–${high}`} (${period})`;
}
