export function getDishSaleQuote(placedMeta) {
  const dish = placedMeta?.dish;
  if (!dish) return null;
  const saleValue = Math.max(0, Number(dish.saleValue) || 0);
  const cost = Math.max(0, Number(dish.cost) || 0);
  return { saleValue, cost, seedCost: Math.max(0, Number(dish.seedCost) || 0),
    treatmentCost: Math.max(0, Number(dish.treatmentCost) || 0),
    historicalCostUnknown: !!dish.historicalCostUnknown, profit: saleValue - cost,
    ordinaryValue: saleValue, marketEffect: 0, rarityBonus: 0, farmBonus: 0 };
}
