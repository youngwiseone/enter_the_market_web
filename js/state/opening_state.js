// Only an explicitly new storage namespace receives the introductory exception.
export const SAVE_EVIDENCE_KEYS = ['player', 'items', 'shop', 'inventory', 'newsEvents', 'store', 'newsHistory', 'goals', 'goalsClaimed', 'unlockedTools', 'unlockedShopItems', 'freePurchasesByItem', 'goalFlags', 'goalStats', 'dayActionCount', 'dayEnergySpent', 'dailyMarketRollHistory', 'lastRollFatiguePercent', 'lastRollImpactMultiplier', 'totalItemsSold', 'totalPlaytimeMs', 'lastPriceMovesByItem', 'dayStartSnapshot', 'weather', 'nextDayWeather', 'daySalesCount', 'daySalesTotal', 'dayTopSale', 'dayItemSales', 'marketPressureByItem', 'daySummaryHistory', 'marketHistory', 'farms', 'activeFarmId', 'secondFarmPurchased', 'activeTool', 'grid', 'gridUnlocked', 'gridItems', 'gridPlantedDay', 'gridWateredDay', 'gridWateredCount', 'gridMiningHits', 'gridRarity', 'gridPurchasePrice', 'gridPlacedMeta'];
export function isFreshStorage(load) {
  return SAVE_EVIDENCE_KEYS.every(key => load(key, null) === null);
}
export function beginOpening(state, primaryFarm) {
  state.player.openingTrade = { carrotAvailable: true };
  primaryFarm.gridUnlocked[24] = true;
  state.unlockedTools = { ...state.unlockedTools, watering: true };
}
export function takeIntroCropMeta(state, item) {
  if (Number(item?.id) !== 4 || !state.player?.openingTrade?.carrotAvailable) return null;
  state.player.openingTrade.carrotAvailable = false;
  return { introductoryGrowDays: 2 };
}
export function recordOpeningSale(state, cost, saleValue, quote = null) {
  state.player.lastTrade = { cost, saleValue, profit: saleValue - cost, quote };
  const opening = state.player?.openingTrade;
  if (!opening || opening.completed) return;
  opening.payoffDismissed = false;
  opening.lastSale = { cost, saleValue, profit: saleValue - cost };
  if (saleValue > cost) opening.completed = true;
}
