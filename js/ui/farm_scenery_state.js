// Visual time follows work already spent today, including before energy refills.
// An exhausted farmer always sees night; resting resets the existing day counter.
export function getFarmSceneryPhase(state) {
  const player = state?.player || {};
  const maximum = Math.max(1, Number(player.energyMax) || 1);
  const energy = Math.max(0, Math.min(maximum, Number(player.energy) || 0));
  if (energy === 0) return 'night';
  const spent = Math.max(maximum - energy, Number(state?.dayEnergySpent) || 0);
  const progress = spent / maximum;
  if (progress < 0.25) return 'morning';
  if (progress < 0.5) return 'midday';
  if (progress < 0.75) return 'afternoon';
  return 'evening';
}
