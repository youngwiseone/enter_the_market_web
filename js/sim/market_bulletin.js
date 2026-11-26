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
