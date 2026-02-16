export const RARITY_TYPES = ['common', 'uncommon', 'rare', 'mythic'];
export const RARITY_ROLLS = [
  { rarity: 'common', weight: 50 },
  { rarity: 'uncommon', weight: 30 },
  { rarity: 'rare', weight: 15 },
  { rarity: 'mythic', weight: 5 }
];

export const RARITY_MULTIPLIERS = {
  common: 1.2,
  uncommon: 1.5,
  rare: 2,
  mythic: 3
};

export const EXPECTED_RARITY_MULTIPLIER = RARITY_ROLLS.reduce((sum, entry) => {
  const multiplier = RARITY_MULTIPLIERS[entry.rarity] ?? 1;
  return sum + (entry.weight * multiplier);
}, 0) / Math.max(1, RARITY_ROLLS.reduce((sum, entry) => sum + entry.weight, 0));

export function normalizeRarity(value) {
  if (typeof value !== 'string') return 'common';
  const trimmed = value.trim().toLowerCase();
  return RARITY_TYPES.includes(trimmed) ? trimmed : 'common';
}

export function rollRarity() {
  const totalWeight = RARITY_ROLLS.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) return 'common';
  let roll = Math.random() * totalWeight;
  for (const entry of RARITY_ROLLS) {
    roll -= entry.weight;
    if (roll <= 0) {
      return entry.rarity;
    }
  }
  return 'common';
}

export function getRarityMultiplier(rarity) {
  const normalized = normalizeRarity(rarity);
  return RARITY_MULTIPLIERS[normalized] ?? RARITY_MULTIPLIERS.common;
}
