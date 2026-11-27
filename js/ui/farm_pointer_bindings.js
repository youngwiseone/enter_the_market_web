import { installFarmGestureHint, rememberFarmGesture, refreshFarmGestureHint } from './farm_gesture_hints.js';

// In Pointer Events browsers the stroke handles physical input from its
// start. Click is reserved for keyboard/assistive activation, not a second
// action on release (including long holds and ignored additional fingers).
export function shouldUseFarmCellClick(event, hasPointerEvents = typeof globalThis.PointerEvent === 'function') {
  return !hasPointerEvents || (event.detail === 0 && !event.pointerType);
}

export function stopFarmPointerInteractionAction(farmPointerState) {
  farmPointerState.active = false;
  farmPointerState.pointerId = null;
  farmPointerState.processedIndices.clear();
  farmPointerState.startIndex = null;
  farmPointerState.didPromoteStartToBulk = false;
}

export function installFarmPointerHandlersAction(deps) {
  const {
    isFarmActionBlocked,
    getGridIndexFromPointerEvent,
    farmPointerState,
    applyGridActionForIndex,
    stopFarmPointerInteraction,
    shouldPromoteStartToBulk,
    state,
    getSelectedShopItemId,
    getSelectedGridCellIndex
  } = deps;

  const grid = document.getElementById('grid');
  if (!grid) return false;
  if (state) installFarmGestureHint(() => {
    const shopItemId = getSelectedShopItemId?.();
    const item = state.items?.find((candidate) => candidate.id === shopItemId);
    const selected = getSelectedGridCellIndex?.();
    return {
      tool: state.activeTool,
      shopItemId,
      shopItemType: item?.type || 'produce',
      selectedMature: Number.isInteger(selected) && !!state.gridRarity?.[selected],
      hasGrowingCrops: !!state.gridItems?.some((id, index) => id && !state.gridRarity?.[index] && state.items?.find((candidate) => candidate.id === id)?.type === 'produce'),
      hasLockedTiles: !!state.gridUnlocked?.some((unlocked) => !unlocked)
    };
  });
  const applyAction = (index, mode) => {
    if (!state) return applyGridActionForIndex(index, { mode });
    const previous = {
      itemId: state.gridItems?.[index],
      wateredDay: state.gridWateredDay?.[index],
      hits: state.gridMiningHits?.[index],
      unlocked: state.gridUnlocked?.[index],
      selected: getSelectedGridCellIndex?.()
    };
    const result = applyGridActionForIndex(index, { mode });
    if (mode === 'drag') {
      if (!previous.itemId && state.gridItems?.[index]) rememberFarmGesture('plant');
      if (state.gridWateredDay?.[index] !== previous.wateredDay) rememberFarmGesture('water');
      if (state.gridMiningHits?.[index] !== previous.hits || state.gridUnlocked?.[index] !== previous.unlocked) rememberFarmGesture('mine');
    }
    if (Number.isInteger(previous.selected) && previous.selected !== index && previous.itemId == null && state.gridItems?.[index] && !state.gridItems?.[previous.selected]) rememberFarmGesture('move');
    refreshFarmGestureHint();
    return result;
  };

  grid.addEventListener('pointerdown', (event) => {
    if (farmPointerState.active || (event.pointerType === 'touch' && event.isPrimary === false)) {
      event.preventDefault();
      return;
    }
    if (isFarmActionBlocked()) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const index = getGridIndexFromPointerEvent(event);
    if (!Number.isInteger(index)) return;
    farmPointerState.active = true;
    farmPointerState.pointerId = event.pointerId;
    farmPointerState.processedIndices.clear();
    farmPointerState.processedIndices.add(index);
    farmPointerState.startIndex = index;
    farmPointerState.didPromoteStartToBulk = false;
    applyAction(index, 'tap');
    if (typeof grid.setPointerCapture === 'function') {
      try {
        grid.setPointerCapture(event.pointerId);
      } catch (err) {
        // Ignore capture failures; dragging still works via document listeners.
      }
    }
    event.preventDefault();
  });

  document.addEventListener('pointermove', (event) => {
    if (!farmPointerState.active) return;
    if (event.pointerId !== farmPointerState.pointerId) return;
    if (isFarmActionBlocked()) {
      stopFarmPointerInteraction();
      return;
    }
    const index = getGridIndexFromPointerEvent(event);
    if (!Number.isInteger(index)) return;
    if (
      !farmPointerState.didPromoteStartToBulk
      && Number.isInteger(farmPointerState.startIndex)
      && index !== farmPointerState.startIndex
      && typeof shouldPromoteStartToBulk === 'function'
      && shouldPromoteStartToBulk(farmPointerState.startIndex, index)
    ) {
      // First move turns the starting tapped cell into bulk selection.
      applyAction(farmPointerState.startIndex, 'drag');
      farmPointerState.didPromoteStartToBulk = true;
    }
    if (farmPointerState.processedIndices.has(index)) return;
    farmPointerState.processedIndices.add(index);
    applyAction(index, 'drag');
    event.preventDefault();
  }, { passive: false });

  const endPointer = (event) => {
    if (!farmPointerState.active || event.pointerId !== farmPointerState.pointerId) return;
    stopFarmPointerInteraction();
  };
  document.addEventListener('pointerup', endPointer);
  document.addEventListener('pointercancel', endPointer);
  grid.addEventListener('lostpointercapture', (event) => {
    // Ignore a child's implicit capture ending when this grid takes over.
    if (event.target === grid) endPointer(event);
  });
  return true;
}
