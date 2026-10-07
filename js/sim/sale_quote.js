import { getCropAdjustedRarityMultiplier } from './crop_identity.js';

// Keep payment precision unchanged; round only presentation, never each batch total.
export function getSaleQuote({ item, marketPrice, buyPrice = 0, rarity = 'common', getRarityMultiplier, farmMultiplier = 1, isProduce = true }) {
  const cost = Math.max(0, Number(buyPrice) || 0);
  const ordinaryValue = Math.max(0, Number(isProduce ? item.price : (cost || item.price)) || 0);
  const marketValue = isProduce ? Math.max(0, Number(marketPrice) || 0) : ordinaryValue * 0.8;
  const multiplier = isProduce ? getCropAdjustedRarityMultiplier(item, rarity, getRarityMultiplier) : 1;
  const saleValue = marketValue * multiplier * (isProduce ? farmMultiplier : 1);
  return { saleValue, cost, profit: saleValue - cost, ordinaryValue, marketEffect: marketValue - ordinaryValue, rarityBonus: marketValue * (multiplier - 1), farmBonus: saleValue - marketValue * multiplier };
}
