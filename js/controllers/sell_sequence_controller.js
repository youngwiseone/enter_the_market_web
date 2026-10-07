import { recordOpeningSale } from '../state/opening_state.js';
import { getSaleOriginFarm, isSaleCropPresent } from '../state/crop_identity.js';
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
    onStepRendered,
    onStepSettled
  } = deps;

  const result = {
    harvestedCount: 0,
    produceSoldCount: 0,
    totalSaleValue: 0,
    totalProfitValue: 0,
    summaryByItem: new Map(),
    settledCells: []
  };
  if (!Array.isArray(cells) || cells.length === 0) {
    return result;
  }

  for (let i = 0; i < cells.length; i += 1) {
    const cell = cells[i];
    if (!isSaleCropPresent(state, cell)) continue;
    const center = Number(state.activeFarmId || 1) === Number(cell.farmId) && typeof getTileCenter === 'function' ? getTileCenter(cell.cellIndex) : null;
    // Capture the visible crop before rendering its paid removal. Travel starts
    // now, but no await can interrupt the synchronous economic settlement below.
    let travelPromise = Promise.resolve();
    if (typeof playSellItemsToButton === 'function') {
      try {
        travelPromise = playSellItemsToButton([cell], sellButtonElement, { totalItems: cells.length, startIndex: i });
      } catch {
        // A cosmetic failure must not prevent a valid sale from settling.
      }
    }
    if (!isSaleCropPresent(state, cell)) { await travelPromise; continue; }
    const farm = getSaleOriginFarm(state, cell);
    const liveItemId = farm.gridItems[cell.cellIndex];
    const item = (Array.isArray(state.items) ? state.items.find((it) => it.id === liveItemId) : null) || cell.item;
    if (!item) {
      continue;
    }
    const itemId = liveItemId;
    const saleValue = Math.max(0, Number(cell.sellNow) || 0);
    const buyPrice = Math.max(0, Number(cell.buyPrice) || 0);
    const profit = saleValue - buyPrice;
    const itemType = String(item.type || '').trim().toLowerCase();
    const tableKey = String(item.table_key || '').trim().toLowerCase();
    const isProduce = cell.isProduce !== undefined
      ? !!cell.isProduce
      : (itemType === 'produce' || tableKey === 'produce_market');
    registerSaleEvent(item.name, saleValue, 1);
    if (isProduce) {
      registerItemSalePressure(itemId, 1);
    }
    state.player.cash += saleValue;
    if (isProduce) recordOpeningSale(state, buyPrice, saleValue, cell.quote);
    if (isProduce) {
      state.goalStats.harvestCount = (state.goalStats.harvestCount || 0) + 1;
    }
    if (isProduce && state.goalFlags && typeof state.goalFlags === 'object') {
      state.goalFlags[guidedHarvestFlag] = true;
    }
    if (isProduce && state.goalStats && state.goalStats.itemsHarvested) {
      const harvestKey = String(itemId);
      state.goalStats.itemsHarvested[harvestKey] = (state.goalStats.itemsHarvested[harvestKey] || 0) + 1;
    }
    const cropMeta = farm.gridPlacedMeta?.[cell.cellIndex];
    farm.gridItems[cell.cellIndex] = null;
    if (Array.isArray(farm.gridPurchasePrice)) farm.gridPurchasePrice[cell.cellIndex] = null;
    if (Array.isArray(farm.gridRarity)) farm.gridRarity[cell.cellIndex] = null;
    if (Array.isArray(farm.gridPlantedDay)) farm.gridPlantedDay[cell.cellIndex] = null;
    if (Array.isArray(farm.gridWateredCount)) farm.gridWateredCount[cell.cellIndex] = 0;
    // Water belongs to the empty soil for today's planting; crop progress is removed above.
    if (Array.isArray(farm.gridPlacedMeta)) farm.gridPlacedMeta[cell.cellIndex] = null;

    result.totalSaleValue += saleValue;
    result.totalProfitValue += profit;
    result.harvestedCount += 1;
    if (isProduce) result.produceSoldCount += 1;
    result.summaryByItem.set(item.name, (result.summaryByItem.get(item.name) || 0) + 1);
    result.settledCells.push(cell);
    // Economic rewards and persistence complete synchronously before any cosmetic await.
    if (typeof onStepSettled === 'function') onStepSettled({ cell, cropMeta, isProduce, saleValue, buyPrice, profit });

    if (typeof emitSellFx === 'function') {
      emitSellFx({
        center,
        rarityRaw: isProduce ? cell.rarity : null,
        saleValue,
        xpGain: isProduce ? xpGainPerSale : 0
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
