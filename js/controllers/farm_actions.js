export function mineGridTileAction(deps) {
  const {
    state,
    index,
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
  awardPlayerXp(xpRewards.mine);
  const currentHits = Array.isArray(state.gridMiningHits) ? (state.gridMiningHits[index] || 0) : 0;
  const nextHits = currentHits + 1;
  const didClear = nextHits >= 10;
  let didMessage = false;
  if (didClear) {
    state.gridUnlocked[index] = true;
    if (Array.isArray(state.gridMiningHits)) state.gridMiningHits[index] = 0;
    addMessage('Cleared a tile.', { speaker: 'player', emotion: 'excited', category: 'progress', priority: 'high' });
    didMessage = true;
  } else if (Array.isArray(state.gridMiningHits)) {
    state.gridMiningHits[index] = nextHits;
    const hitsLeft = Math.max(0, 10 - nextHits);
    addMessage(`Mining progress: ${nextHits}/10 hits (${hitsLeft} left).`, {
      speaker: 'player',
      emotion: 'mining',
      category: 'progress',
      priority: 'normal',
      replaceKey: 'progress:mine'
    });
    didMessage = true;
  }
  evaluateGoals();
  saveState();
  renderAll();
  const center = getTileCenter(index);
  const gridContainer = document.getElementById('grid-container');
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
      const cell = document.getElementById('grid')?.children[index];
      if (cell) triggerFxClass(cell, 'fx-shake');
      const toolButton = document.querySelector('.tool-button[data-tool=\"pickaxe\"]');
      if (toolButton) triggerFxClass(toolButton, 'fx-pop');
    }
    showXpGainFeedback(xpRewards.mine, center);
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
    addMessage('This plant is already grown. Harvest it instead.', {
      speaker: 'player',
      emotion: 'watering',
      category: 'progress',
      priority: 'normal',
      replaceKey: 'progress:water'
    });
    const cell = document.getElementById('grid')?.children[index];
    if (cell) triggerFxClass(cell, 'fx-wobble');
    return true;
  }

  const wasWateredToday = state.gridWateredDay[index] === state.player.day;
  if (wasWateredToday) {
    const growDays = Math.max(0, Number(item.growDays) || 0);
    const wateredDays = Math.max(0, Number(state.gridWateredCount[index]) || 0);
    const daysLeft = Math.max(0, growDays - wateredDays);
    addMessage(
      `Already watered today. ${item.name} progress: ${wateredDays}/${growDays} days (${daysLeft} left).`,
      {
        speaker: 'player',
        emotion: 'watering',
        category: 'progress',
        priority: 'normal',
        replaceKey: 'progress:water'
      }
    );
    const cell = document.getElementById('grid')?.children[index];
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
  addMessage(`Watering progress: ${item.name} ${wateredDays}/${growDays} days (${daysLeft} left).`, {
    speaker: 'player',
    emotion: 'watering',
    category: 'progress',
    priority: 'normal',
    replaceKey: 'progress:water'
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
    const cell = document.getElementById('grid')?.children[index];
    const overlay = cell ? cell.querySelector('img.grid-overlay[src*=\"water.png\"]') : null;
    if (overlay) triggerFxClass(overlay, 'fx-pop');
    showXpGainFeedback(xpRewards.water, center);
  }
  return true;
}
