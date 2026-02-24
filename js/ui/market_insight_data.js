import { isProduceItem, getNormalizedItemTableKey } from '../content/item_types.js';
import { getRefillableTankState, getSprinklerPlacementConfig } from '../controllers/watering_infrastructure.js';

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
  if (!item) return null;
  const isProduce = isProduceItem(item);
  const tableKey = getNormalizedItemTableKey(item);
  if (!isProduce) {
    const buyPrice = Math.max(0, Number(item.price) || 0);
    const resaleValue = buyPrice * 0.8;
    const sprinklerConfig = String(item.type || '').trim().toLowerCase() === 'sprinkler'
      ? getSprinklerPlacementConfig(null)
      : null;
    return {
      isProduce: false,
      tableKey,
      itemType: String(item.type || '').trim().toLowerCase(),
      itemName: item.name,
      description: String(item.description || '').trim(),
      buyPrice,
      effectiveCost: buyPrice,
      freeCount: 0,
      expectedSale: resaleValue,
      guaranteedSale: resaleValue,
      projectedDelta: resaleValue - buyPrice,
      guaranteedDelta: resaleValue - buyPrice,
      resaleValue,
      resaleRatePct: 80,
      sprinklerLevel: sprinklerConfig ? sprinklerConfig.level : null,
      sprinklerRadius: sprinklerConfig ? sprinklerConfig.radius : null,
      sprinklerEfficiencyLevel: sprinklerConfig ? sprinklerConfig.efficiencyLevel : null,
      marginPct: buyPrice > 0 ? -20 : 0
    };
  }
  if (!shopEntry) return null;
  const buyPrice = Math.max(0, Number(shopEntry.price) || 0);
  const freeCount = getFreePurchaseCount(selectedShopItemId);
  const effectiveCost = freeCount > 0 ? 0 : buyPrice;
  const expectedSale = buyPrice * expectedRarityMultiplier;
  const guaranteedSale = buyPrice * (rarityMultipliers.common || 1);
  const projectedDelta = expectedSale - effectiveCost;
  const guaranteedDelta = guaranteedSale - effectiveCost;
  const marginPct = effectiveCost > 0 ? ((projectedDelta / effectiveCost) * 100) : 0;
  return {
    isProduce: true,
    tableKey,
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
  if (!item) return null;
  const isProduce = isProduceItem(item);
  const tableKey = getNormalizedItemTableKey(item);
  const growth = getPlantGrowthState(item, selectedGridCellIndex);
  const buyPrice = Array.isArray(state.gridPurchasePrice)
    ? Math.max(0, Number(state.gridPurchasePrice[selectedGridCellIndex]) || 0)
    : 0;
  if (!isProduce) {
    const fallbackBase = Math.max(0, Number(item.price) || 0);
    const sellNow = Math.max(0, (buyPrice > 0 ? buyPrice : fallbackBase) * 0.8);
    const placedMeta = Array.isArray(state.gridPlacedMeta) ? state.gridPlacedMeta[selectedGridCellIndex] : null;
    const tankState = getRefillableTankState(item, placedMeta);
    const sprinklerConfig = String(item.type || '').trim().toLowerCase() === 'sprinkler'
      ? getSprinklerPlacementConfig(placedMeta)
      : null;
    return {
      cellIndex: selectedGridCellIndex,
      isProduce: false,
      tableKey,
      itemType: String(item.type || '').trim().toLowerCase(),
      itemName: item.name,
      buyPrice,
      currentBasePrice: fallbackBase,
      rarity: 'n/a',
      growth: { isGrown: true, daysLeft: 0 },
      canSell: true,
      sellNow,
      profitNow: sellNow - buyPrice,
      resaleRatePct: 80,
      tankCurrent: tankState ? tankState.current : null,
      tankCapacity: tankState ? tankState.capacity : null,
      sprinklerLevel: sprinklerConfig ? sprinklerConfig.level : null,
      sprinklerRadius: sprinklerConfig ? sprinklerConfig.radius : null,
      sprinklerEfficiencyLevel: sprinklerConfig ? sprinklerConfig.efficiencyLevel : null
    };
  }
  if (!shopEntry) return null;
  const currentBasePrice = Math.max(0, Number(shopEntry.price) || 0);
  const rarity = growth.isGrown ? (getGridRarity(selectedGridCellIndex) || 'common') : 'unknown';
  const sellMultiplier = growth.isGrown ? getRarityMultiplier(rarity || 'common') : 0;
  const sellNow = growth.isGrown ? (currentBasePrice * sellMultiplier * getActiveFarmSellMultiplier()) : 0;
  const profitNow = sellNow - buyPrice;
  return {
    cellIndex: selectedGridCellIndex,
    isProduce: true,
    tableKey,
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
