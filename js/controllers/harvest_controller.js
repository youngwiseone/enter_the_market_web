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
    playSellItemsToButton,
    spawnBurst,
    spawnRing,
    spawnFloatingText,
    showXpGainFeedback,
    getTileCenter,
    getHudCenters,
    spawnCoinsForSaleValue,
    pulseHud,
    sellButtonElement = null
  } = deps;

  const bulkInsight = getBulkSelectedGridInsightData();
  if (!bulkInsight || bulkInsight.count <= 0) return;
  registerDayAction();
  let totalSaleValue = 0;
  let totalProfitValue = 0;
  let harvestedCount = 0;
  const summaryByItem = new Map();
  for (let i = 0; i < bulkInsight.cells.length; i += 1) {
    const cell = bulkInsight.cells[i];
    const center = typeof getTileCenter === 'function' ? getTileCenter(cell.cellIndex) : null;
    const travelPromise = typeof playSellItemsToButton === 'function'
      ? playSellItemsToButton([cell], sellButtonElement, {
        totalItems: bulkInsight.cells.length,
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
    totalSaleValue += saleValue;
    totalProfitValue += profit;
    harvestedCount += 1;
    summaryByItem.set(item.name, (summaryByItem.get(item.name) || 0) + 1);
    const hudCenters = typeof getHudCenters === 'function' ? getHudCenters() : [];
    if (center) {
      const rarity = String(cell.rarity || 'common');
      const isRare = rarity === 'rare';
      const isMythic = rarity === 'mythic';
      const sparkleList = isMythic
        ? ['resources/effects/prism_sparkle_01.png', 'resources/effects/prism_sparkle_02.png']
        : ['resources/effects/sparkle_gold_01.png', 'resources/effects/sparkle_gold_02.png'];
      if (typeof spawnBurst === 'function') {
        spawnBurst({
          x: center.x,
          y: center.y - 6,
          count: isMythic ? 14 : (isRare ? 10 : 7),
          imgList: sparkleList,
          speedRange: [20, 62],
          sizeRange: [8, 13],
          gravity: 10,
          lifeRange: [220, 420]
        });
      }
      if ((isRare || isMythic) && typeof spawnRing === 'function') {
        spawnRing({
          x: center.x,
          y: center.y,
          radius: 9,
          color: isMythic ? 'rgba(198,180,255,0.8)' : 'rgba(255,213,100,0.8)',
          life: 180
        });
      }
      if (typeof spawnFloatingText === 'function') {
        spawnFloatingText({
          x: center.x - 12,
          y: center.y - 18,
          text: `+$${saleValue.toFixed(2)}`,
          color: isMythic ? '#c6b4ff' : '#ffe680'
        });
      }
      if (typeof showXpGainFeedback === 'function') {
        showXpGainFeedback(xpRewards.harvest, center, 120);
      }
    }
    if (
      center
      && hudCenters.length > 0
      && typeof spawnCoinsForSaleValue === 'function'
    ) {
      spawnCoinsForSaleValue(saleValue, center, hudCenters[0]);
    }
    // Show tiles clearing as each item sells instead of a single end-of-batch clear.
    renderAll();
    await travelPromise;
  }
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
    const isRare = rarity === 'rare';
    const isMythic = rarity === 'mythic';
    const sparkleList = isMythic
      ? ['resources/effects/prism_sparkle_01.png', 'resources/effects/prism_sparkle_02.png']
      : ['resources/effects/sparkle_gold_01.png', 'resources/effects/sparkle_gold_02.png'];
    const burstCount = isMythic ? 16 : (isRare ? 12 : 8);
    spawnBurst({
      x: center.x,
      y: center.y - 6,
      count: burstCount,
      imgList: sparkleList,
      speedRange: [20, 70],
      sizeRange: [8, 14],
      gravity: 10,
      lifeRange: [240, 520]
    });
    if (isRare || isMythic) {
      spawnRing({
        x: center.x,
        y: center.y,
        radius: 10,
        color: isMythic ? 'rgba(198,180,255,0.8)' : 'rgba(255,213,100,0.8)',
        life: 220
      });
    }
    spawnFloatingText({
      x: center.x - 12,
      y: center.y - 18,
      text: `+$${saleValue.toFixed(2)}`,
      color: isMythic ? '#c6b4ff' : '#ffe680'
    });
    showXpGainFeedback(xpRewards.harvest, center, 340);
  }
  pulseHud(true);
  const hudCenters = getHudCenters();
  if (center && hudCenters.length > 0) {
    spawnCoinsForSaleValue(saleValue, center, hudCenters[0]);
  }
}
