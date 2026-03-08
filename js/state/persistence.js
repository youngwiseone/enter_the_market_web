export function persistFullState(saveFn, state) {
  saveFn('player', state.player);
  saveFn('items', state.items);
  saveFn('shop', state.shop);
  saveFn('inventory', state.inventory);
  saveFn('newsEvents', state.newsEvents);
  saveFn('store', state.store);
  saveFn('newsHistory', state.newsHistory);
  saveFn('goals', state.goals);
  saveFn('goalsClaimed', state.goalsClaimed);
  saveFn('unlockedTools', state.unlockedTools);
  saveFn('unlockedShopItems', state.unlockedShopItems);
  saveFn('freePurchasesByItem', state.freePurchasesByItem);
  saveFn('goalFlags', state.goalFlags);
  saveFn('goalStats', state.goalStats);
  saveFn('dayActionCount', state.dayActionCount);
  saveFn('dayEnergySpent', state.dayEnergySpent);
  saveFn('dailyMarketRollHistory', state.dailyMarketRollHistory);
  saveFn('lastRollFatiguePercent', state.lastRollFatiguePercent);
  saveFn('lastRollImpactMultiplier', state.lastRollImpactMultiplier);
  saveFn('totalItemsSold', state.totalItemsSold);
  saveFn('totalPlaytimeMs', state.totalPlaytimeMs);
  saveFn('lastPriceMovesByItem', state.lastPriceMovesByItem);
  saveFn('dayStartSnapshot', state.dayStartSnapshot);
  saveFn('weather', state.weather);
  saveFn('nextDayWeather', state.nextDayWeather);
  saveFn('daySalesCount', state.daySalesCount);
  saveFn('daySalesTotal', state.daySalesTotal);
  saveFn('dayTopSale', state.dayTopSale);
  saveFn('dayItemSales', state.dayItemSales);
  saveFn('marketPressureByItem', state.marketPressureByItem);
  saveFn('daySummaryHistory', state.daySummaryHistory);
  saveFn('marketHistory', state.marketHistory);
  saveFn('farms', state.farms);
  saveFn('activeFarmId', state.activeFarmId);
  saveFn('secondFarmPurchased', state.secondFarmPurchased);
}

export function persistLegacyPrimaryGridState(saveFn, primaryFarm) {
  saveFn('gridUnlocked', primaryFarm.gridUnlocked);
  saveFn('gridItems', primaryFarm.gridItems);
  saveFn('gridPlantedDay', primaryFarm.gridPlantedDay);
  saveFn('gridWateredDay', primaryFarm.gridWateredDay);
  saveFn('gridWateredCount', primaryFarm.gridWateredCount);
  saveFn('gridMiningHits', primaryFarm.gridMiningHits);
  saveFn('gridRarity', primaryFarm.gridRarity);
  saveFn('gridPurchasePrice', primaryFarm.gridPurchasePrice);
  saveFn('gridPlacedMeta', primaryFarm.gridPlacedMeta);
}
