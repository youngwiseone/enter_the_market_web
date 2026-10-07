// Placement identity travels with metadata through moves, farm snapshots and saves.
let nextIdentity = 0;
export function withNewCropIdentity(meta) {
  const instanceId = globalThis.crypto?.randomUUID?.()
    || `${Date.now().toString(36)}-${(++nextIdentity).toString(36)}-${Math.random().toString(36).slice(2)}`;
  return { ...(meta && typeof meta === 'object' ? meta : {}), instanceId };
}

export function ensureCropInstanceId(state, index) {
  if (!Array.isArray(state.gridPlacedMeta)) state.gridPlacedMeta = Array(state.gridItems.length).fill(null);
  if (!state.gridPlacedMeta[index]?.instanceId) {
    state.gridPlacedMeta[index] = withNewCropIdentity(state.gridPlacedMeta[index]);
  }
  return state.gridPlacedMeta[index].instanceId;
}

export function getSaleOriginFarm(state, cell) {
  if (state.farms?.[cell.farmId]) return state.farms[cell.farmId];
  if (Number(state.activeFarmId || 1) === Number(cell.farmId)) return state;
  return null;
}

export function isSaleCropPresent(state, cell) {
  const farm = getSaleOriginFarm(state, cell);
  return !!farm && !!cell.instanceId
    && farm.gridItems?.[cell.cellIndex] === cell.itemId
    && farm.gridPlacedMeta?.[cell.cellIndex]?.instanceId === cell.instanceId;
}
