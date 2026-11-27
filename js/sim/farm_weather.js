export function getMiningEnergyPerHit(baseCost, weatherId) {
  return baseCost + (weatherId === 'rain' ? 1 : 0);
}

export function getMiningWeatherReadout(baseCost, today, tomorrow) {
  const now = getMiningEnergyPerHit(baseCost, today);
  const next = getMiningEnergyPerHit(baseCost, tomorrow);
  const cost = `Mine: ${now} energy per hit`;
  if (today === 'rain') return `${cost} · Muddy ground`;
  if (tomorrow === 'rain') return `${cost} · ${next} in tomorrow’s rain`;
  return cost;
}
