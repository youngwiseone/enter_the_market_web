export function getSelectedShopItemInsightDataAction(deps) {
  const {
    state,
    selectedShopItemId,
    getFreePurchaseCount,
    expectedRarityMultiplier,
    rarityMultipliers
  } = deps;

  if (!selectedShopItemId) return null;
  const item = Array.isArray(state.items) ? state.items.find((it) => it.id === selectedShopItemId) : null;
  const shopEntry = Array.isArray(state.shop) ? state.shop.find((entry) => entry.itemId === selectedShopItemId) : null;
  if (!item || !shopEntry) return null;
  const buyPrice = Math.max(0, Number(shopEntry.price) || 0);
  const freeCount = getFreePurchaseCount(selectedShopItemId);
  const effectiveCost = freeCount > 0 ? 0 : buyPrice;
  const expectedSale = buyPrice * expectedRarityMultiplier;
  const guaranteedSale = buyPrice * (rarityMultipliers.common || 1);
  const projectedDelta = expectedSale - effectiveCost;
  const guaranteedDelta = guaranteedSale - effectiveCost;
  const marginPct = effectiveCost > 0 ? ((projectedDelta / effectiveCost) * 100) : 0;
  return {
    itemName: item.name,
    buyPrice,
    effectiveCost,
    freeCount,
    expectedSale,
    guaranteedSale,
    projectedDelta,
    guaranteedDelta,
    marginPct
  };
}

export function getSelectedGridItemInsightDataAction(deps) {
  const {
    state,
    selectedGridCellIndex,
    getPlantGrowthState,
    getGridRarity,
    getRarityMultiplier,
    getActiveFarmSellMultiplier
  } = deps;

  if (selectedGridCellIndex === null) return null;
  if (!Array.isArray(state.gridItems) || selectedGridCellIndex < 0 || selectedGridCellIndex >= state.gridItems.length) return null;
  const itemId = state.gridItems[selectedGridCellIndex];
  if (!itemId) return null;
  const item = Array.isArray(state.items) ? state.items.find((it) => it.id === itemId) : null;
  const shopEntry = Array.isArray(state.shop) ? state.shop.find((entry) => entry.itemId === itemId) : null;
  if (!item || !shopEntry) return null;
  const growth = getPlantGrowthState(item, selectedGridCellIndex);
  const buyPrice = Array.isArray(state.gridPurchasePrice)
    ? Math.max(0, Number(state.gridPurchasePrice[selectedGridCellIndex]) || 0)
    : 0;
  const currentBasePrice = Math.max(0, Number(shopEntry.price) || 0);
  const rarity = growth.isGrown ? (getGridRarity(selectedGridCellIndex) || 'common') : 'unknown';
  const sellMultiplier = growth.isGrown ? getRarityMultiplier(rarity || 'common') : 0;
  const sellNow = growth.isGrown ? (currentBasePrice * sellMultiplier * getActiveFarmSellMultiplier()) : 0;
  const profitNow = sellNow - buyPrice;
  return {
    cellIndex: selectedGridCellIndex,
    itemName: item.name,
    buyPrice,
    currentBasePrice,
    rarity,
    growth,
    canSell: growth.isGrown,
    sellNow,
    profitNow
  };
}
