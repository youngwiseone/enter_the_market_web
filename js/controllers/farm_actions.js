import { getItemBehavior, isDecorationItem, isProduceItem } from '../content/item_types.js';
import {
  getWateringCanLevel,
  getWateringCanTilesPerEnergy,
  refillRefillablePlacedItem,
  tryApplyGrowthAccelerationBonus
} from './watering_infrastructure.js';

export function mineGridTileAction(deps) {
  const {
    state,
    index,
    farmSecondaryId,
    getActiveFarmMiningEnergyCost,
    consumeEnergy,
    registerDayAction,
    awardPlayerXp,
    xpRewards,
    addMessage,
    evaluateGoals,
    saveState,
    renderAll,
    getTileCenter,
    getGridActionFxTargets,
    spawnBurst,
    spawnRing,
    triggerFxClass,
    showXpGainFeedback
  } = deps;

  if (!Array.isArray(state.gridUnlocked) || index < 0 || index >= state.gridUnlocked.length) return false;
  if (state.gridUnlocked[index]) return false;
  const isRainDay = String(state.weather?.id || '') === 'rain';
  const miningEnergyCost = getActiveFarmMiningEnergyCost() + (isRainDay ? 1 : 0);
  if (!consumeEnergy(miningEnergyCost, 'mine this tile')) return true;
  registerDayAction();
  const mineXpReward = state.activeFarmId === farmSecondaryId ? 40 : xpRewards.mine;
  awardPlayerXp(mineXpReward);
  const currentHits = Array.isArray(state.gridMiningHits) ? (state.gridMiningHits[index] || 0) : 0;
  const nextHits = currentHits + 1;
  const didClear = nextHits >= 10;
  let didMessage = false;
  if (didClear) {
    state.gridUnlocked[index] = true;
    if (Array.isArray(state.gridMiningHits)) state.gridMiningHits[index] = 0;
    addMessage({
      id: 'progress.tile_cleared',
      meta: { speaker: 'player', emotion: 'excited', category: 'progress', priority: 'high' }
    });
    didMessage = true;
  } else if (Array.isArray(state.gridMiningHits)) {
    state.gridMiningHits[index] = nextHits;
    const hitsLeft = Math.max(0, 10 - nextHits);
    addMessage({
      id: 'progress.mining_progress',
      vars: { nextHits, hitsLeft },
      meta: {
        speaker: 'player',
        emotion: 'mining',
        category: 'progress',
        priority: 'normal',
        replaceKey: 'progress:mine'
      }
    });
    didMessage = true;
  }
  evaluateGoals();
  saveState();
  renderAll();
  const center = getTileCenter(index);
  const fxTargets = getGridActionFxTargets(index);
  const gridContainer = fxTargets ? fxTargets.gridContainer : null;
  if (center) {
    if (didClear) {
      spawnBurst({
        x: center.x,
        y: center.y,
        count: 14,
        imgList: ['resources/effects/dust_puff_01.png', 'resources/effects/dust_puff_02.png'],
        speedRange: [20, 70],
        sizeRange: [10, 18],
        gravity: 10,
        lifeRange: [300, 560]
      });
      spawnRing({ x: center.x, y: center.y, radius: 12, color: 'rgba(255,255,255,0.8)', life: 220 });
      if (gridContainer) triggerFxClass(gridContainer, 'fx-camera-nudge');
    } else {
      spawnBurst({
        x: center.x,
        y: center.y,
        count: 6,
        imgList: ['resources/effects/rock_chip_01.png', 'resources/effects/rock_chip_02.png'],
        speedRange: [30, 90],
        sizeRange: [6, 12],
        gravity: 40,
        lifeRange: [200, 420]
      });
      const cell = fxTargets ? fxTargets.cell : null;
      if (cell) triggerFxClass(cell, 'fx-shake');
      const toolButton = fxTargets ? fxTargets.pickaxeToolButton : null;
      if (toolButton) triggerFxClass(toolButton, 'fx-pop');
    }
    showXpGainFeedback(mineXpReward, center);
  }
  return didMessage;
}

export function waterGridTileAction(deps) {
  const {
    state,
    index,
    getPlantGrowthState,
    consumeEnergy,
    registerDayAction,
    awardPlayerXp,
    xpRewards,
    addMessage,
    saveState,
    renderAll,
    getTileCenter,
    getGridActionFxTargets,
    spawnBurst,
    spawnRing,
    triggerFxClass,
    showXpGainFeedback
  } = deps;

  if (!Array.isArray(state.gridWateredDay) || index < 0 || index >= state.gridWateredDay.length) return false;
  const itemId = Array.isArray(state.gridItems) ? state.gridItems[index] : null;
  const item = itemId ? state.items.find((it) => it.id === itemId) : null;
  if (!item) return false;
  const itemBehavior = getItemBehavior(item);
  if (isDecorationItem(item)) {
    addMessage({
      id: 'progress.decoration_cannot_be_watered',
      meta: {
        speaker: 'player',
        emotion: 'watering',
        category: 'progress',
        priority: 'normal',
        replaceKey: 'progress:water'
      }
    });
    const fxTargets = getGridActionFxTargets(index);
    const cell = fxTargets ? fxTargets.cell : null;
    if (cell) triggerFxClass(cell, 'fx-wobble');
    return true;
  }
  if (itemBehavior.wateringMode === 'refillable' && !isProduceItem(item)) {
    const refillPreview = refillRefillablePlacedItem({ state, cellIndex: index, item });
    if (!refillPreview) return false;
    if (!refillPreview.didRefill) {
      addMessage({
        id: 'progress.infrastructure_tank_full',
        vars: { itemName: item.name, currentUnits: refillPreview.currentUnits, capacityUnits: refillPreview.capacityUnits },
        meta: {
          speaker: 'player',
          emotion: 'watering',
          category: 'progress',
          priority: 'normal',
          replaceKey: 'progress:water'
        }
      });
      const fxTargets = getGridActionFxTargets(index);
      const cell = fxTargets ? fxTargets.cell : null;
      if (cell) triggerFxClass(cell, 'fx-wobble');
      return true;
    }
    // Revert preview until energy spend succeeds.
    if (Array.isArray(state.gridPlacedMeta)) {
      const meta = state.gridPlacedMeta[index];
      if (meta && typeof meta === 'object') {
        meta.tankCurrent = Math.max(0, Number(refillPreview.currentUnits) - Number(refillPreview.addedUnits || 0));
      }
    }
    if (!consumeEnergy(1, `refill ${String(item.name || 'infrastructure').toLowerCase()}`)) return true;
    registerDayAction();
    const refillResult = refillRefillablePlacedItem({ state, cellIndex: index, item });
    if (refillResult && refillResult.didRefill) {
      awardPlayerXp(xpRewards.water);
      addMessage({
        id: 'progress.infrastructure_refilled',
        vars: {
          itemName: item.name,
          addedUnits: refillResult.addedUnits,
          currentUnits: refillResult.currentUnits,
          capacityUnits: refillResult.capacityUnits
        },
        meta: {
          speaker: 'player',
          emotion: 'watering',
          category: 'progress',
          priority: 'normal',
          replaceKey: 'progress:water'
        }
      });
      saveState();
      renderAll();
      const center = getTileCenter(index);
      if (center) {
        spawnBurst({
          x: center.x,
          y: center.y,
          count: 10,
          imgList: ['resources/effects/water_drop_01.png', 'resources/effects/water_drop_02.png'],
          speedRange: [20, 60],
          sizeRange: [6, 10],
          gravity: 80,
          lifeRange: [240, 520]
        });
        spawnRing({ x: center.x, y: center.y, radius: 10, color: 'rgba(80,160,255,0.7)', life: 220 });
        const fxTargets = getGridActionFxTargets(index);
        const overlay = fxTargets ? fxTargets.waterOverlay : null;
        if (overlay) triggerFxClass(overlay, 'fx-pop');
        showXpGainFeedback(xpRewards.water, center);
      }
      return true;
    }
    return false;
  }

  const growth = getPlantGrowthState(item, index);
  if (growth.isGrown) {
    addMessage({
      id: 'progress.plant_already_grown_harvest',
      meta: {
        speaker: 'player',
        emotion: 'watering',
        category: 'progress',
        priority: 'normal',
        replaceKey: 'progress:water'
      }
    });
    const fxTargets = getGridActionFxTargets(index);
    const cell = fxTargets ? fxTargets.cell : null;
    if (cell) triggerFxClass(cell, 'fx-wobble');
    return true;
  }

  const wasWateredToday = state.gridWateredDay[index] === state.player.day;
  if (wasWateredToday) {
    const growDays = Math.max(0, Number(item.growDays) || 0);
    const wateredDays = Math.max(0, Number(state.gridWateredCount[index]) || 0);
    const daysLeft = Math.max(0, growDays - wateredDays);
    addMessage({
      id: 'progress.already_watered_today',
      vars: { itemName: item.name, wateredDays, growDays, daysLeft },
      meta: {
        speaker: 'player',
        emotion: 'watering',
        category: 'progress',
        priority: 'normal',
        replaceKey: 'progress:water'
      }
    });
    const fxTargets = getGridActionFxTargets(index);
    const cell = fxTargets ? fxTargets.cell : null;
    if (cell) triggerFxClass(cell, 'fx-wobble');
    return true;
  }

  const manualWaterEnergyCost = 1 / Math.max(1, getWateringCanTilesPerEnergy(state));
  if (!consumeEnergy(manualWaterEnergyCost, 'water this tile')) return true;
  registerDayAction();

  state.gridWateredDay[index] = state.player.day;
  if (Array.isArray(state.gridWateredCount)) {
    state.gridWateredCount[index] = (state.gridWateredCount[index] || 0) + 1;
  }
  tryApplyGrowthAccelerationBonus({
    farmState: state,
    cellIndex: index,
    item,
    dayNumber: state.player.day,
    toolLevel: getWateringCanLevel(state)
  });
  awardPlayerXp(xpRewards.water);

  const growDays = Math.max(0, Number(item.growDays) || 0);
  const wateredDays = Math.max(0, Number(state.gridWateredCount[index]) || 0);
  const daysLeft = Math.max(0, growDays - wateredDays);
  addMessage({
    id: 'progress.watering_progress',
    vars: { itemName: item.name, wateredDays, growDays, daysLeft },
    meta: {
      speaker: 'player',
      emotion: 'watering',
      category: 'progress',
      priority: 'normal',
      replaceKey: 'progress:water'
    }
  });

  saveState();
  renderAll();
  const center = getTileCenter(index);
  if (center) {
    spawnBurst({
      x: center.x,
      y: center.y,
      count: 10,
      imgList: ['resources/effects/water_drop_01.png', 'resources/effects/water_drop_02.png'],
      speedRange: [20, 60],
      sizeRange: [6, 10],
      gravity: 80,
      lifeRange: [240, 520]
    });
    spawnRing({ x: center.x, y: center.y, radius: 10, color: 'rgba(80,160,255,0.7)', life: 220 });
    const fxTargets = getGridActionFxTargets(index);
    const overlay = fxTargets ? fxTargets.waterOverlay : null;
    if (overlay) triggerFxClass(overlay, 'fx-pop');
    showXpGainFeedback(xpRewards.water, center);
  }
  return true;
}
