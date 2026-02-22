export async function runSellSequenceAction(deps) {
  const {
    cells,
    state,
    playSellItemsToButton,
    sellButtonElement = null,
    registerSaleEvent,
    registerItemSalePressure,
    guidedHarvestFlag,
    getTileCenter,
    getHudCenters,
    spawnCoinsForSaleValue,
    emitSellFx,
    xpGainPerSale = 0,
    onStepRendered
  } = deps;

  const result = {
    harvestedCount: 0,
    totalSaleValue: 0,
    totalProfitValue: 0,
    summaryByItem: new Map()
  };
  if (!Array.isArray(cells) || cells.length === 0) {
    return result;
  }

  for (let i = 0; i < cells.length; i += 1) {
    const cell = cells[i];
    const center = typeof getTileCenter === 'function' ? getTileCenter(cell.cellIndex) : null;
    const travelPromise = typeof playSellItemsToButton === 'function'
      ? playSellItemsToButton([cell], sellButtonElement, {
        totalItems: cells.length,
        startIndex: i
      })
      : Promise.resolve();

    const liveItemId = Array.isArray(state.gridItems) ? state.gridItems[cell.cellIndex] : null;
    if (!liveItemId || liveItemId !== cell.itemId) {
      await travelPromise;
      continue;
    }
    const item = (Array.isArray(state.items) ? state.items.find((it) => it.id === liveItemId) : null) || cell.item;
    if (!item) {
      await travelPromise;
      continue;
    }
    const itemId = liveItemId;
    const saleValue = Math.max(0, Number(cell.sellNow) || 0);
    const buyPrice = Math.max(0, Number(cell.buyPrice) || 0);
    const profit = saleValue - buyPrice;
    registerSaleEvent(item.name, saleValue, 1);
    registerItemSalePressure(itemId, 1);
    state.player.cash += saleValue;
    state.goalStats.harvestCount = (state.goalStats.harvestCount || 0) + 1;
    if (state.goalFlags && typeof state.goalFlags === 'object') {
      state.goalFlags[guidedHarvestFlag] = true;
    }
    const harvestKey = String(itemId);
    state.goalStats.itemsHarvested[harvestKey] = (state.goalStats.itemsHarvested[harvestKey] || 0) + 1;
    state.gridItems[cell.cellIndex] = null;
    if (Array.isArray(state.gridPurchasePrice)) state.gridPurchasePrice[cell.cellIndex] = null;
    if (Array.isArray(state.gridRarity)) state.gridRarity[cell.cellIndex] = null;
    if (Array.isArray(state.gridPlantedDay)) state.gridPlantedDay[cell.cellIndex] = null;
    if (Array.isArray(state.gridWateredCount)) state.gridWateredCount[cell.cellIndex] = 0;

    result.totalSaleValue += saleValue;
    result.totalProfitValue += profit;
    result.harvestedCount += 1;
    result.summaryByItem.set(item.name, (result.summaryByItem.get(item.name) || 0) + 1);

    if (typeof emitSellFx === 'function') {
      emitSellFx({
        center,
        rarityRaw: cell.rarity,
        saleValue,
        xpGain: xpGainPerSale
      });
    }

    const hudCenters = typeof getHudCenters === 'function' ? getHudCenters() : [];
    if (
      center
      && hudCenters.length > 0
      && typeof spawnCoinsForSaleValue === 'function'
    ) {
      spawnCoinsForSaleValue(saleValue, center, hudCenters[0]);
    }

    if (typeof onStepRendered === 'function') {
      onStepRendered(cell.cellIndex, i, cells.length);
    }
    await travelPromise;
  }

  return result;
}
