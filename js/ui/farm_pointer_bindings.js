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
    shouldPromoteStartToBulk
  } = deps;

  const grid = document.getElementById('grid');
  if (!grid) return false;

  grid.addEventListener('pointerdown', (event) => {
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
    farmPointerState.suppressClickUntil = Date.now() + 260;
    applyGridActionForIndex(index, { mode: 'tap' });
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
    if (farmPointerState.pointerId !== null && event.pointerId !== farmPointerState.pointerId) return;
    if (isFarmActionBlocked()) {
      stopFarmPointerInteraction();
      return;
    }
    const index = getGridIndexFromPointerEvent(event);
    if (!Number.isInteger(index)) return;
    if (
      !farmPointerState.didPromoteStartToBulk
      && Number.isInteger(farmPointerState.startIndex)
      && typeof shouldPromoteStartToBulk === 'function'
      && shouldPromoteStartToBulk(farmPointerState.startIndex)
    ) {
      // First move turns the starting tapped cell into bulk selection.
      applyGridActionForIndex(farmPointerState.startIndex, { mode: 'drag' });
      farmPointerState.didPromoteStartToBulk = true;
    }
    if (farmPointerState.processedIndices.has(index)) return;
    farmPointerState.processedIndices.add(index);
    applyGridActionForIndex(index, { mode: 'drag' });
    event.preventDefault();
  }, { passive: false });

  const endPointer = () => {
    if (!farmPointerState.active) return;
    stopFarmPointerInteraction();
  };
  document.addEventListener('pointerup', endPointer);
  document.addEventListener('pointercancel', endPointer);
  return true;
}
