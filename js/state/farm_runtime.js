import {
  createEmptyFarmStateForGrid,
  isFarmStateShapeValidForGrid,
  normalizeFarmStateForGrid
} from './farm_state.js';

function ensureFarmCollection(state, farmPrimaryId, farmSecondaryId, gridCellCount) {
  if (!state.farms || typeof state.farms !== 'object') {
    state.farms = {
      [farmPrimaryId]: createEmptyFarmStateForGrid(gridCellCount),
      [farmSecondaryId]: createEmptyFarmStateForGrid(gridCellCount)
    };
  }
}

export function getFarmStateRuntime(state, farmId, config) {
  const { farmPrimaryId, farmSecondaryId, gridCellCount } = config;
  ensureFarmCollection(state, farmPrimaryId, farmSecondaryId, gridCellCount);
  if (!state.farms[farmId] || !isFarmStateShapeValidForGrid(state.farms[farmId], gridCellCount)) {
    state.farms[farmId] = normalizeFarmStateForGrid(state.farms[farmId], gridCellCount);
  }
  return state.farms[farmId];
}

export function applyFarmStateToActiveGridRuntime(state, farmId, config) {
  const { farmPrimaryId, farmSecondaryId } = config;
  const safeFarmId = Number(farmId) === farmSecondaryId ? farmSecondaryId : farmPrimaryId;
  const farm = getFarmStateRuntime(state, safeFarmId, config);
  state.activeFarmId = safeFarmId;
  state.gridUnlocked = farm.gridUnlocked;
  state.gridItems = farm.gridItems;
  state.gridPlantedDay = farm.gridPlantedDay;
  state.gridWateredDay = farm.gridWateredDay;
  state.gridWateredCount = farm.gridWateredCount;
  state.gridMiningHits = farm.gridMiningHits;
  state.gridRarity = farm.gridRarity;
  state.gridPurchasePrice = farm.gridPurchasePrice;
}

export function getUnlockedTileCountForFarmRuntime(state, farmId, config) {
  const farm = getFarmStateRuntime(state, farmId, config);
  return Array.isArray(farm.gridUnlocked)
    ? farm.gridUnlocked.reduce((sum, value) => sum + (value ? 1 : 0), 0)
    : 0;
}
