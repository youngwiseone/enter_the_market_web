import { getCropAdjustedRarityMultiplier } from './crop_identity.js';

// Keep payment precision unchanged; round only presentation, never each batch total.
export function getCropCostBasis({ buyPrice = 0, placedMeta = null }) {
  const treatment = placedMeta?.fertiliser;
  const hasTreatment = Object.values(treatment?.stacks || {}).some((count) => Number(count) > 0);
  const seedCost = Math.max(0, Number(buyPrice) || 0);
  const treatmentCost = Math.max(0, Number(treatment?.paidCost) || 0);
  return { buyPrice: seedCost, seedCost, treatmentCost, cost: seedCost + treatmentCost,
    historicalCostUnknown: !!treatment?.historicalCostUnknown || (hasTreatment && !Number.isFinite(treatment?.paidCost)) };
}

export function getSaleQuote({ item, marketPrice, buyPrice = 0, treatmentCost = 0, historicalCostUnknown = false, rarity = 'common', getRarityMultiplier, farmMultiplier = 1, isProduce = true }) {
  const seedCost = Math.max(0, Number(buyPrice) || 0);
  const knownTreatmentCost = isProduce ? Math.max(0, Number(treatmentCost) || 0) : 0;
  const cost = seedCost + knownTreatmentCost;
  const ordinaryValue = Math.max(0, Number(isProduce ? item.price : (seedCost || item.price)) || 0);
  const marketValue = isProduce ? Math.max(0, Number(marketPrice) || 0) : ordinaryValue * 0.8;
  const multiplier = isProduce ? getCropAdjustedRarityMultiplier(item, rarity, getRarityMultiplier) : 1;
  const saleValue = marketValue * multiplier * (isProduce ? farmMultiplier : 1);
  return { saleValue, cost, seedCost, treatmentCost: knownTreatmentCost, historicalCostUnknown: !!historicalCostUnknown, profit: saleValue - cost, ordinaryValue, marketEffect: marketValue - ordinaryValue, rarityBonus: marketValue * (multiplier - 1), farmBonus: saleValue - marketValue * multiplier };
}
