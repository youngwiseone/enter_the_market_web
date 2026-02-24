import { emitSellFxAction } from './sell_fx_controller.js';
import { runSellSequenceAction } from './sell_sequence_controller.js';
import { isProduceItem } from '../content/item_types.js';

export async function sellSelectedGridItemAction(deps) {
  const {
    getBulkSelectedGridInsightData,
    sellBulkSelectedGridItems,
    getSelectedGridItemInsightData,
    addMessage,
    harvestPlant,
    sellButtonElement = null
  } = deps;

  const bulkInsight = getBulkSelectedGridInsightData();
  if (bulkInsight && bulkInsight.count > 0) {
    await sellBulkSelectedGridItems(sellButtonElement);
    return;
  }
  const insight = getSelectedGridItemInsightData();
  if (!insight) return;
  if (!insight.canSell) {
    addMessage({ id: 'progress.plant_still_growing' });
    return;
  }
  await harvestPlant(insight.cellIndex, sellButtonElement);
}

export async function sellBulkSelectedGridItemsAction(deps) {
  const {
    state,
    getBulkSelectedGridInsightData,
    registerDayAction,
    registerSaleEvent,
    registerItemSalePressure,
    guidedHarvestFlag,
    awardPlayerXp,
    xpRewards,
    selectedGridCellIndices,
    setSelectedGridCellIndex,
    updateNetWorth,
    evaluateGoals,
    saveState,
    addMessage,
    renderAll,
    refreshSellStep,
    playSellItemsToButton,
    spawnBurst,
    spawnRing,
    spawnFloatingText,
    showXpGainFeedback,
    getTileCenter,
    getHudCenters,
    spawnCoinsForSaleValue,
    pulseHud,
    getIsSellBatchInFlight,
    setIsSellBatchInFlight,
    sellButtonElement = null
  } = deps;

  if (typeof getIsSellBatchInFlight === 'function' && getIsSellBatchInFlight()) return;
  if (typeof setIsSellBatchInFlight === 'function') setIsSellBatchInFlight(true);
  try {
    const bulkInsight = getBulkSelectedGridInsightData();
    if (!bulkInsight || bulkInsight.count <= 0) return;
    registerDayAction();
    const sequenceSummary = await runSellSequenceAction({
      cells: bulkInsight.cells,
      state,
      playSellItemsToButton,
      sellButtonElement,
      registerSaleEvent,
      registerItemSalePressure,
      guidedHarvestFlag,
      getTileCenter,
      getHudCenters,
      spawnCoinsForSaleValue,
      xpGainPerSale: xpRewards.harvest,
      emitSellFx: ({ center, rarityRaw, saleValue, xpGain }) => emitSellFxAction({
        center,
        rarityRaw,
        saleValue,
        xpGain,
        spawnBurst,
        spawnRing,
        spawnFloatingText,
        showXpGainFeedback
      }),
      onStepRendered: () => {
        if (typeof refreshSellStep === 'function') {
          refreshSellStep();
        } else {
          renderAll();
        }
      }
    });
    const {
      harvestedCount,
      totalSaleValue,
      totalProfitValue,
      summaryByItem
    } = sequenceSummary;
    if (!harvestedCount) {
      return;
    }
    const produceSoldCount = Array.isArray(bulkInsight?.cells)
      ? bulkInsight.cells.reduce((sum, cell) => sum + (cell?.isProduce ? 1 : 0), 0)
      : harvestedCount;
    if (produceSoldCount > 0) {
      awardPlayerXp(xpRewards.harvest * produceSoldCount);
    }
    if (typeof pulseHud === 'function') {
      pulseHud(true);
    }
    selectedGridCellIndices.clear();
    setSelectedGridCellIndex(null);
    updateNetWorth();
    evaluateGoals();
    saveState();
    const summaryText = Array.from(summaryByItem.entries()).map(([name, qty]) => `${name} x${qty}`).join(', ');
    const hasNonProduce = Array.isArray(bulkInsight?.cells)
      ? bulkInsight.cells.some((cell) => cell && cell.isProduce === false)
      : false;
    addMessage({
      id: hasNonProduce ? 'progress.sold_selected_items' : 'progress.sold_selected_crops',
      vars: {
        harvestedCount,
        suffix: harvestedCount === 1 ? '' : 's',
        totalSaleValue: totalSaleValue.toFixed(2),
        profitSign: totalProfitValue >= 0 ? '+' : '',
        totalProfitValue: totalProfitValue.toFixed(2),
        summaryText
      },
      meta: { speaker: 'player', emotion: 'money' }
    });
    renderAll();
  } finally {
    if (typeof setIsSellBatchInFlight === 'function') setIsSellBatchInFlight(false);
  }
}

export async function harvestPlantAction(deps) {
  const {
    state,
    cellIndex,
    getPlantGrowthState,
    addMessage,
    registerDayAction,
    getGridRarity,
    assignGridRarity,
    getRarityMultiplier,
    getActiveFarmSellMultiplier,
    registerSaleEvent,
    registerItemSalePressure,
    guidedHarvestFlag,
    awardPlayerXp,
    xpRewards,
    updateNetWorth,
    evaluateGoals,
    saveState,
    getSelectedGridCellIndex,
    setSelectedGridCellIndex,
    renderAll,
    getTileCenter,
    spawnBurst,
    spawnRing,
    spawnFloatingText,
    showXpGainFeedback,
    pulseHud,
    getHudCenters,
    spawnCoinsForSaleValue,
    playSellItemsToButton,
    sellButtonElement = null
  } = deps;

  const itemId = state.gridItems[cellIndex];
  if (!itemId) return;
  const item = state.items.find((it) => it.id === itemId);
  if (!item) return;
  const isProduce = isProduceItem(item);
  if (isProduce && !getPlantGrowthState(item, cellIndex).isGrown) {
    addMessage({ id: 'progress.plant_still_growing' });
    return;
  }
  if (typeof playSellItemsToButton === 'function') {
    await playSellItemsToButton([{ cellIndex }], sellButtonElement);
  }
  registerDayAction();
  const shopEntry = state.shop.find((entry) => entry.itemId === itemId);
  const basePrice = isProduce
    ? (shopEntry ? shopEntry.price : 0)
    : Math.max(0, Number(item.price) || 0);
  const buyPrice = Array.isArray(state.gridPurchasePrice)
    ? Math.max(0, Number(state.gridPurchasePrice[cellIndex]) || 0)
    : 0;
  const rarity = isProduce ? (getGridRarity(cellIndex) || assignGridRarity(cellIndex)) : null;
  const multiplier = isProduce ? getRarityMultiplier(rarity) : 0.8;
  const saleValue = isProduce
    ? (basePrice * multiplier * getActiveFarmSellMultiplier())
    : ((buyPrice > 0 ? buyPrice : basePrice) * 0.8);
  const realizedProfit = saleValue - buyPrice;
  registerSaleEvent(item.name, saleValue, 1);
  if (isProduce) {
    registerItemSalePressure(itemId, 1);
  }
  state.player.cash += saleValue;
  if (isProduce) {
    state.goalStats.harvestCount = (state.goalStats.harvestCount || 0) + 1;
  }
  if (isProduce && state.goalFlags && typeof state.goalFlags === 'object') {
    state.goalFlags[guidedHarvestFlag] = true;
  }
  if (isProduce) {
    const harvestKey = String(itemId);
    state.goalStats.itemsHarvested[harvestKey] = (state.goalStats.itemsHarvested[harvestKey] || 0) + 1;
  }
  state.gridItems[cellIndex] = null;
  if (Array.isArray(state.gridPurchasePrice)) {
    state.gridPurchasePrice[cellIndex] = null;
  }
  if (Array.isArray(state.gridRarity)) {
    state.gridRarity[cellIndex] = null;
  }
  if (Array.isArray(state.gridPlacedMeta)) {
    state.gridPlacedMeta[cellIndex] = null;
  }
  if (Array.isArray(state.gridPlantedDay)) {
    state.gridPlantedDay[cellIndex] = null;
  }
  if (Array.isArray(state.gridWateredCount)) {
    state.gridWateredCount[cellIndex] = 0;
  }
  if (isProduce) {
    awardPlayerXp(xpRewards.harvest);
  }
  updateNetWorth();
  evaluateGoals();
  saveState();
  if (isProduce) {
    addMessage({
      id: 'progress.harvested_item_profit',
      vars: {
        itemName: item.name,
        saleValue: saleValue.toFixed(2),
        profitSign: realizedProfit >= 0 ? '+' : '',
        profitValue: realizedProfit.toFixed(2)
      },
      meta: { speaker: 'player', emotion: 'money' }
    });
  } else {
    addMessage({
      id: 'commerce.sold_item',
      vars: {
        quantity: 1,
        itemName: item.name,
        saleValue: saleValue.toFixed(2)
      },
      meta: { speaker: 'player', emotion: 'money' }
    });
  }
  if (getSelectedGridCellIndex() === cellIndex) {
    setSelectedGridCellIndex(null);
  }
  renderAll();
  const center = getTileCenter(cellIndex);
  if (center) {
    emitSellFxAction({
      center,
      rarityRaw: isProduce ? rarity : null,
      saleValue,
      xpGain: isProduce ? xpRewards.harvest : 0,
      spawnBurst,
      spawnRing,
      spawnFloatingText,
      showXpGainFeedback
    });
  }
  pulseHud(true);
  const hudCenters = getHudCenters();
  if (center && hudCenters.length > 0) {
    spawnCoinsForSaleValue(saleValue, center, hudCenters[0]);
  }
}
