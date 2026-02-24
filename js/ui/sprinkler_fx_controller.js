export function playQueuedSprinklerDawnFxAction(deps) {
  const {
    state,
    renderMarket,
    getTileCenter,
    getGridActionFxTargets,
    triggerFxClass,
    spawnBurst,
    spawnRing
  } = deps;

  const pendingSprinklerEvents = Array.isArray(state?.runtimeFlags?.pendingSprinklerDawnFxEvents)
    ? state.runtimeFlags.pendingSprinklerDawnFxEvents.slice()
    : [];
  const pendingVisualTargets = Array.isArray(state?.runtimeFlags?.pendingSprinklerDawnVisualTargetIndices)
    ? state.runtimeFlags.pendingSprinklerDawnVisualTargetIndices.slice()
    : [];
  if (state?.runtimeFlags && typeof state.runtimeFlags === 'object') {
    state.runtimeFlags.pendingSprinklerDawnFxEvents = [];
    state.runtimeFlags.pendingSprinklerDawnVisualTargetIndices = pendingVisualTargets.slice();
  }
  if (pendingSprinklerEvents.length <= 0) return false;

  if (typeof renderMarket === 'function') {
    renderMarket();
  }
  const sortedEvents = pendingSprinklerEvents.slice().sort((a, b) => a.targetIndex - b.targetIndex);
  const baseStepMs = 40;
  const maxTotalMs = 360;
  const stepMs = sortedEvents.length > 1
    ? Math.max(20, Math.min(baseStepMs, Math.floor(maxTotalMs / (sortedEvents.length - 1))))
    : baseStepMs;

  sortedEvents.forEach((event, sequenceIndex) => {
    const delayMs = stepMs * sequenceIndex;
    window.setTimeout(() => {
      if (state?.runtimeFlags && Array.isArray(state.runtimeFlags.pendingSprinklerDawnVisualTargetIndices)) {
        state.runtimeFlags.pendingSprinklerDawnVisualTargetIndices = state.runtimeFlags.pendingSprinklerDawnVisualTargetIndices
          .filter((index) => index !== event.targetIndex);
      }
      if (typeof renderMarket === 'function') {
        renderMarket();
      }
      const sprinklerCenter = typeof getTileCenter === 'function' ? getTileCenter(event.sprinklerIndex) : null;
      const targetCenter = typeof getTileCenter === 'function' ? getTileCenter(event.targetIndex) : null;
      const targetFxTargets = typeof getGridActionFxTargets === 'function' ? getGridActionFxTargets(event.targetIndex) : null;
      const targetCell = targetFxTargets ? targetFxTargets.cell : null;
      const sprinklerFxTargets = typeof getGridActionFxTargets === 'function' ? getGridActionFxTargets(event.sprinklerIndex) : null;
      const sprinklerCell = sprinklerFxTargets ? sprinklerFxTargets.cell : null;
      if (sprinklerCell && typeof triggerFxClass === 'function') triggerFxClass(sprinklerCell, 'fx-pop');
      if (targetCell && typeof triggerFxClass === 'function') triggerFxClass(targetCell, 'fx-wobble');
      if (targetCenter && typeof spawnBurst === 'function') {
        spawnBurst({
          x: targetCenter.x,
          y: targetCenter.y,
          count: 8,
          imgList: ['resources/effects/water_drop_01.png', 'resources/effects/water_drop_02.png'],
          speedRange: [18, 52],
          sizeRange: [5, 10],
          gravity: 80,
          lifeRange: [180, 360]
        });
      }
      if (targetCenter && typeof spawnRing === 'function') {
        spawnRing({
          x: targetCenter.x,
          y: targetCenter.y,
          radius: 8,
          color: 'rgba(90,170,255,0.65)',
          life: 180
        });
      }
      if (sprinklerCenter && targetCenter && typeof spawnBurst === 'function') {
        const midX = (sprinklerCenter.x + targetCenter.x) / 2;
        const midY = (sprinklerCenter.y + targetCenter.y) / 2;
        spawnBurst({
          x: midX,
          y: midY,
          count: 3,
          imgList: ['resources/effects/water_drop_01.png'],
          speedRange: [8, 24],
          sizeRange: [4, 7],
          gravity: 20,
          lifeRange: [120, 220]
        });
      }
    }, delayMs);
  });

  const finalDelayMs = (stepMs * Math.max(0, sortedEvents.length - 1)) + 90;
  window.setTimeout(() => {
    if (state?.runtimeFlags && typeof state.runtimeFlags === 'object') {
      state.runtimeFlags.pendingSprinklerDawnVisualTargetIndices = [];
    }
    if (typeof renderMarket === 'function') {
      renderMarket();
    }
  }, finalDelayMs);
  return true;
}
