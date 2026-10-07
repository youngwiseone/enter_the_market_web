import { getGridCellSellSnapshotAction } from './grid_interaction_controller.js';
import { recordTradingChallengeSale } from '../state/trading_challenge.js';
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

  if (state.runtimeFlags?.isSellBatchInFlight || state.runtimeFlags?.isRestInProgress || (typeof getIsSellBatchInFlight === 'function' && getIsSellBatchInFlight())) return;
  state.runtimeFlags = state.runtimeFlags || {};
  state.runtimeFlags.isSellBatchInFlight = true;
  if (typeof setIsSellBatchInFlight === 'function') setIsSellBatchInFlight(true);
  try {
    const bulkInsight = getBulkSelectedGridInsightData();
    if (!bulkInsight || bulkInsight.count <= 0) return;
    registerDayAction();
    saveState(); // Persist lazy identities on legacy crops before the first settlement.
    renderAll();
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
      onStepSettled: (settlement) => {
        settleSaleRewards(deps, settlement);
      },
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
    if (harvestedCount > 0) {
      const combined = { ordinaryValue: 0, marketEffect: 0, rarityBonus: 0, farmBonus: 0 };
      sequenceSummary.settledCells.forEach(cell => Object.keys(combined).forEach(key => { combined[key] += Number(cell.quote?.[key]) || 0; }));
      combined.historicalCostUnknown = sequenceSummary.settledCells.some(cell => cell.quote?.historicalCostUnknown);
      state.player.lastTrade = { cost: totalSaleValue - totalProfitValue, saleValue: totalSaleValue, profit: totalProfitValue, quote: combined };
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
        profitLabel: sequenceSummary.settledCells.some(cell => cell.quote?.historicalCostUnknown) ? 'known-cost profit' : 'profit',
        profitSign: totalProfitValue >= 0 ? '+' : '−',
        totalProfitValue: Math.abs(totalProfitValue).toFixed(2),
        summaryText
      },
      meta: { speaker: 'player', emotion: 'money' }
    });
    renderAll();
  } finally {
    state.runtimeFlags.isSellBatchInFlight = false;
    renderAll();
    if (typeof setIsSellBatchInFlight === 'function') setIsSellBatchInFlight(false);
  }
}

// Called synchronously for every paid crop, before presentation can be interrupted.
function settleSaleRewards(deps, { cell, cropMeta, isProduce, saleValue, buyPrice, profit }) {
  const { state, awardPlayerXp, xpRewards, updateNetWorth, evaluateGoals, saveState } = deps;
  state.player.lastTrade = { cost: buyPrice, saleValue, profit, quote: cell.quote };
  if (isProduce) {
    recordTradingChallengeSale(state, { cropMeta, cropId: cell.instanceId, revenue: saleValue,
      farmMultiplier: cell.farmMultiplier, costBasis: buyPrice,
      costBasisKnown: !!cell.quote && !cell.quote.historicalCostUnknown });
    awardPlayerXp(xpRewards.harvest);
  }
  updateNetWorth();
  evaluateGoals();
  saveState();
}

export async function harvestPlantAction(deps) {
  const { state, cellIndex, addMessage, getPlantGrowthState, getGridRarity, assignGridRarity,
    registerDayAction, saveState, renderAll, playSellItemsToButton, sellButtonElement = null,
    getSelectedGridCellIndex, setSelectedGridCellIndex, getTileCenter, getHudCenters,
    spawnCoinsForSaleValue, spawnBurst, spawnRing, spawnFloatingText, showXpGainFeedback,
    pulseHud, xpRewards } = deps;
  if (state.runtimeFlags?.isSellBatchInFlight || state.runtimeFlags?.isRestInProgress) return;
  const itemId = state.gridItems[cellIndex];
  const item = state.items.find(it => it.id === itemId);
  if (!item) return;
  const isProduce = isProduceItem(item);
  if (isProduce && !getPlantGrowthState(item, cellIndex).isGrown) {
    addMessage({ id: 'progress.plant_still_growing' });
    return;
  }
  state.runtimeFlags = state.runtimeFlags || {};
  state.runtimeFlags.isSellBatchInFlight = true;
  try {
    if (isProduce && !getGridRarity(cellIndex)) assignGridRarity(cellIndex);
    const cell = getGridCellSellSnapshotAction({ ...deps, cellIndex });
    if (!cell) return;
    saveState();
    // A single sale still pays after travel; the immutable snapshot is revalidated at settlement.
    renderAll();
    if (typeof playSellItemsToButton === 'function') await playSellItemsToButton([cell], sellButtonElement);
    registerDayAction();
    const result = await runSellSequenceAction({ ...deps, cells: [cell], playSellItemsToButton: null,
      onStepSettled: settlement => settleSaleRewards(deps, settlement),
      xpGainPerSale: xpRewards.harvest,
      emitSellFx: payload => emitSellFxAction({ ...payload, spawnBurst, spawnRing, spawnFloatingText, showXpGainFeedback })
    });
    if (!result.harvestedCount) return;
    addMessage({ id: isProduce ? 'progress.harvested_item_profit' : 'commerce.sold_item',
      vars: { itemName: item.name, quantity: 1, saleValue: cell.sellNow.toFixed(2),
        profitLabel: cell.quote?.historicalCostUnknown ? 'known-cost profit' : 'profit',
        profitSign: cell.profitNow >= 0 ? '+' : '−', profitValue: Math.abs(cell.profitNow).toFixed(2) },
      meta: { speaker: 'player', emotion: 'money' } });
    if (getSelectedGridCellIndex() === cellIndex) setSelectedGridCellIndex(null);
    pulseHud(true);
  } finally {
    state.runtimeFlags.isSellBatchInFlight = false;
    renderAll();
  }
}
