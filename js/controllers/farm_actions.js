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
  const miningEnergyCost = getActiveFarmMiningEnergyCost();
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

  if (!consumeEnergy(1, 'water this tile')) return true;
  registerDayAction();

  state.gridWateredDay[index] = state.player.day;
  if (Array.isArray(state.gridWateredCount)) {
    state.gridWateredCount[index] = (state.gridWateredCount[index] || 0) + 1;
  }
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
