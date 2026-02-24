import { isProduceItem, getNormalizedItemTableKey } from '../content/item_types.js';
import { ensureInfrastructureMetaForPlacedItem } from './watering_infrastructure.js';

export function getGridUnlockCostAction(state) {
  const unlockedCount = Array.isArray(state.gridUnlocked)
    ? state.gridUnlocked.reduce((sum, value) => sum + (value ? 1 : 0), 0)
    : 0;
  return 10 * Math.pow(2, unlockedCount);
}

export function purchaseGridSlotAction(deps) {
  const {
    state,
    index,
    getGridUnlockCost,
    consumeEnergy,
    registerDayAction,
    evaluateGoals,
    saveState,
    addMessage,
    renderAll
  } = deps;
  if (!Array.isArray(state.gridUnlocked) || index < 0 || index >= state.gridUnlocked.length) return;
  if (state.gridUnlocked[index]) return;
  const cost = getGridUnlockCost();
  if (state.player.cash < cost) {
    addMessage({
      id: 'warning.insufficient_funds_slot',
      vars: { cost: cost.toFixed(2) },
      meta: {
        speaker: 'player',
        emotion: 'wrong',
        category: 'progress',
        priority: 'high'
      }
    });
    return;
  }
  if (!consumeEnergy(1, 'unlock a grid slot')) return;
  registerDayAction();
  state.player.cash -= cost;
  state.gridUnlocked[index] = true;
  evaluateGoals();
  saveState();
  addMessage({ id: 'progress.purchased_grid_slot', vars: { cost: cost.toFixed(2) } });
  renderAll();
}

export function placeItemOnGridAction(deps) {
  const {
    state,
    itemId,
    cellIndex,
    consumeEnergy,
    registerDayAction,
    awardPlayerXp,
    xpRewards,
    saveState,
    addMessage,
    renderAll,
    getTileCenter,
    getGridActionFxTargets,
    spawnBurst,
    triggerFxClass,
    showXpGainFeedback
  } = deps;
  if (!state.gridUnlocked[cellIndex] || state.gridItems[cellIndex]) return;
  const item = state.items.find((it) => it.id === itemId);
  if (!item) return;
  if (!consumeEnergy(1, 'plant a seed')) return;
  registerDayAction();

  const invEntry = Array.isArray(state.inventory)
    ? state.inventory.find((entry) => entry.itemId === itemId)
    : null;
  const perUnitCost = Math.max(0, Number(invEntry?.avgCost) || 0);
  state.gridItems[cellIndex] = itemId;
  if (Array.isArray(state.gridPurchasePrice)) {
    state.gridPurchasePrice[cellIndex] = perUnitCost;
  }
  if (Array.isArray(state.gridPlacedMeta)) {
    state.gridPlacedMeta[cellIndex] = isProduceItem(item)
      ? null
      : ensureInfrastructureMetaForPlacedItem(item, {
        tableKey: getNormalizedItemTableKey(item),
        itemType: String(item.type || '').trim().toLowerCase() || 'unknown'
      });
  }
  if (Array.isArray(state.gridRarity)) {
    state.gridRarity[cellIndex] = null;
  }
  if (Array.isArray(state.gridPlantedDay)) {
    state.gridPlantedDay[cellIndex] = isProduceItem(item) ? state.player.day : null;
  }
  if (Array.isArray(state.gridWateredCount)) {
    if (isProduceItem(item)) {
      const wateredToday = Array.isArray(state.gridWateredDay) && state.gridWateredDay[cellIndex] === state.player.day;
      state.gridWateredCount[cellIndex] = wateredToday ? 1 : 0;
    } else {
      state.gridWateredCount[cellIndex] = 0;
    }
  }
  if (isProduceItem(item) && String(state.weather?.id || '') === 'rain') {
    if (Array.isArray(state.gridWateredDay)) state.gridWateredDay[cellIndex] = state.player.day;
    if (Array.isArray(state.gridWateredCount)) state.gridWateredCount[cellIndex] = 1;
  }

  awardPlayerXp(xpRewards.plant);
  saveState();
  addMessage({ id: 'progress.placed_item_on_grid', vars: { itemName: item.name } });
  renderAll();

  const center = getTileCenter(cellIndex);
  if (!center) return;
  spawnBurst({
    x: center.x,
    y: center.y + 6,
    count: 6,
    imgList: ['resources/effects/dust_puff_01.png', 'resources/effects/dust_puff_02.png'],
    speedRange: [10, 40],
    sizeRange: [8, 14],
    gravity: 30,
    lifeRange: [220, 460]
  });
  const fxTargets = getGridActionFxTargets(cellIndex);
  const cell = fxTargets ? fxTargets.cell : null;
  if (cell) triggerFxClass(cell, 'fx-pop');
  showXpGainFeedback(xpRewards.plant, center);
}

export function removeItemFromGridAction(deps) {
  const {
    state,
    cellIndex,
    getSelectedGridCellIndex,
    setSelectedGridCellIndex,
    saveState,
    addMessage,
    renderAll
  } = deps;
  const itemId = state.gridItems[cellIndex];
  if (!itemId) return;
  const item = state.items.find((it) => it.id === itemId);
  if (!item) return;
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
  saveState();
  addMessage({ id: 'progress.removed_item_from_grid', vars: { itemName: item.name } });
  if (getSelectedGridCellIndex() === cellIndex) {
    setSelectedGridCellIndex(null);
  }
  renderAll();
}

export function countReadyToHarvestTilesAction(state, getPlantGrowthState) {
  if (!Array.isArray(state.gridItems)) return 0;
  let count = 0;
  state.gridItems.forEach((itemId, index) => {
    if (!itemId) return;
    const item = state.items.find((it) => it.id === itemId);
    if (!item) return;
    if (!isProduceItem(item)) return;
    if (getPlantGrowthState(item, index).isGrown) {
      count += 1;
    }
  });
  return count;
}
