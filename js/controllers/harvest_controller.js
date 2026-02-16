export function sellSelectedGridItemAction(deps) {
  const {
    getBulkSelectedGridInsightData,
    sellBulkSelectedGridItems,
    getSelectedGridItemInsightData,
    addMessage,
    harvestPlant
  } = deps;

  const bulkInsight = getBulkSelectedGridInsightData();
  if (bulkInsight && bulkInsight.count > 0) {
    sellBulkSelectedGridItems();
    return;
  }
  const insight = getSelectedGridItemInsightData();
  if (!insight) return;
  if (!insight.canSell) {
    addMessage('This plant is still growing.');
    return;
  }
  harvestPlant(insight.cellIndex);
}

export function sellBulkSelectedGridItemsAction(deps) {
  const {
    state,
    getBulkSelectedGridInsightData,
    consumeEnergy,
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
    renderAll
  } = deps;

  const bulkInsight = getBulkSelectedGridInsightData();
  if (!bulkInsight || bulkInsight.count <= 0) return;
  if (!consumeEnergy(bulkInsight.count, `harvest ${bulkInsight.count} selected plant${bulkInsight.count === 1 ? '' : 's'}`)) {
    return;
  }
  registerDayAction();
  let totalSaleValue = 0;
  let totalProfitValue = 0;
  let harvestedCount = 0;
  const summaryByItem = new Map();
  bulkInsight.cells.forEach((cell) => {
    const item = cell.item;
    if (!item) return;
    const itemId = cell.itemId;
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
  });
  if (!harvestedCount) {
    return;
  }
  awardPlayerXp(xpRewards.harvest * harvestedCount);
  selectedGridCellIndices.clear();
  setSelectedGridCellIndex(null);
  updateNetWorth();
  evaluateGoals();
  saveState();
  const summaryText = Array.from(summaryByItem.entries()).map(([name, qty]) => `${name} x${qty}`).join(', ');
  addMessage(
    `Sold ${harvestedCount} selected crop${harvestedCount === 1 ? '' : 's'} for $${totalSaleValue.toFixed(2)} (profit ${totalProfitValue >= 0 ? '+' : ''}$${totalProfitValue.toFixed(2)}). ${summaryText}`,
    { speaker: 'player', emotion: 'money' }
  );
  renderAll();
}

export function harvestPlantAction(deps) {
  const {
    state,
    cellIndex,
    getPlantGrowthState,
    addMessage,
    consumeEnergy,
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
    spawnCoinsForSaleValue
  } = deps;

  const itemId = state.gridItems[cellIndex];
  if (!itemId) return;
  const item = state.items.find((it) => it.id === itemId);
  if (!item) return;
  if (!getPlantGrowthState(item, cellIndex).isGrown) {
    addMessage('This plant is still growing.');
    return;
  }
  if (!consumeEnergy(1, 'harvest this plant')) {
    return;
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
  addMessage(
    `Harvested ${item.name} for $${saleValue.toFixed(2)} (profit ${realizedProfit >= 0 ? '+' : ''}$${realizedProfit.toFixed(2)}).`,
    { speaker: 'player', emotion: 'money' }
  );
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
