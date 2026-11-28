// A cosmetic cue only. Rarity and the ready badge still settle in the render
// that first discovers a mature crop, even if the Gazette covers the farm.
export function createCropReadyFx({ state, frame, isFarmVisible, getCell, isReduceMotion }) {
  const pending = new Map();
  let day = null;
  let scheduled = false;

  function resetForNewDay() {
    if (state.player.day === day) return;
    day = state.player.day;
    pending.clear();
  }

  function queue(index, itemId) {
    resetForNewDay();
    const farm = state.activeFarmId;
    if (!pending.has(farm)) pending.set(farm, new Map());
    pending.get(farm).set(index, { itemId, instanceId: state.gridPlacedMeta?.[index]?.instanceId });
  }

  function schedule() {
    resetForNewDay();
    if (!pending.size || scheduled) return;
    scheduled = true;
    frame(() => {
      scheduled = false;
      resetForNewDay();
      const farm = state.activeFarmId;
      const crops = pending.get(farm);
      if (!crops || !isFarmVisible()) return;
      pending.delete(farm);
      if (isReduceMotion()) return;
      for (const [index, { itemId, instanceId }] of crops) {
        const cell = getCell(index);
        if (state.gridItems?.[index] === itemId
          && state.gridPlacedMeta?.[index]?.instanceId === instanceId
          && cell?.dataset.fieldCrop === 'ready') {
          cell.classList.add('crop-just-ready');
        }
      }
    });
  }
  return { queue, schedule };
}
