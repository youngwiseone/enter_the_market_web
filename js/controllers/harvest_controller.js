import { emitSellFxAction } from './sell_fx_controller.js';
import { runSellSequenceAction } from './sell_sequence_controller.js';

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
    awardPlayerXp(xpRewards.harvest * harvestedCount);
    if (typeof pulseHud === 'function') {
      pulseHud(true);
    }
    selectedGridCellIndices.clear();
    setSelectedGridCellIndex(null);
    updateNetWorth();
    evaluateGoals();
    saveState();
    const summaryText = Array.from(summaryByItem.entries()).map(([name, qty]) => `${name} x${qty}`).join(', ');
    addMessage({
      id: 'progress.sold_selected_crops',
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
  if (!getPlantGrowthState(item, cellIndex).isGrown) {
    addMessage({ id: 'progress.plant_still_growing' });
    return;
  }
  if (typeof playSellItemsToButton === 'function') {
    await playSellItemsToButton([{ cellIndex }], sellButtonElement);
  }
  registerDayAction();
  const shopEntry = state.shop.find((entry) => entry.itemId === itemId);
  const basePrice = shopEntry ? shopEntry.price : 0;
  const buyPrice = Array.isArray(state.gridPurchasePrice)
    ? Math.max(0, Number(state.gridPurchasePrice[cellIndex]) || 0)
    : 0;
  const rarity = getGridRarity(cellIndex) || assignGridRarity(cellIndex);
  const multiplier = getRarityMultiplier(rarity);
  const saleValue = basePrice * multiplier * getActiveFarmSellMultiplier();
  const realizedProfit = saleValue - buyPrice;
  registerSaleEvent(item.name, saleValue, 1);
  registerItemSalePressure(itemId, 1);
  state.player.cash += saleValue;
  state.goalStats.harvestCount = (state.goalStats.harvestCount || 0) + 1;
  if (state.goalFlags && typeof state.goalFlags === 'object') {
    state.goalFlags[guidedHarvestFlag] = true;
  }
  const harvestKey = String(itemId);
  state.goalStats.itemsHarvested[harvestKey] = (state.goalStats.itemsHarvested[harvestKey] || 0) + 1;
  state.gridItems[cellIndex] = null;
  if (Array.isArray(state.gridPurchasePrice)) {
    state.gridPurchasePrice[cellIndex] = null;
  }
  if (Array.isArray(state.gridRarity)) {
    state.gridRarity[cellIndex] = null;
  }
  if (Array.isArray(state.gridPlantedDay)) {
    state.gridPlantedDay[cellIndex] = null;
  }
  if (Array.isArray(state.gridWateredCount)) {
    state.gridWateredCount[cellIndex] = 0;
  }
  awardPlayerXp(xpRewards.harvest);
  updateNetWorth();
  evaluateGoals();
  saveState();
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
  if (getSelectedGridCellIndex() === cellIndex) {
    setSelectedGridCellIndex(null);
  }
  renderAll();
  const center = getTileCenter(cellIndex);
  if (center) {
    emitSellFxAction({
      center,
      rarityRaw: rarity,
      saleValue,
      xpGain: xpRewards.harvest,
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
