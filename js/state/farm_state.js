export function createEmptyFarmStateForGrid(gridCellCount) {
  return {
    gridUnlocked: Array(gridCellCount).fill(false),
    gridItems: Array(gridCellCount).fill(null),
    gridPlantedDay: Array(gridCellCount).fill(null),
    gridWateredDay: Array(gridCellCount).fill(null),
    gridWateredCount: Array(gridCellCount).fill(0),
    gridMiningHits: Array(gridCellCount).fill(0),
    gridRarity: Array(gridCellCount).fill(null),
    gridPurchasePrice: Array(gridCellCount).fill(null),
    gridPlacedMeta: Array(gridCellCount).fill(null)
  };
}

function normalizeFarmArray(rawArray, fallbackValue, gridCellCount) {
  if (!Array.isArray(rawArray)) {
    return Array(gridCellCount).fill(fallbackValue);
  }
  if (rawArray.length >= gridCellCount) {
    return rawArray.slice(0, gridCellCount);
  }
  const padded = rawArray.slice();
  while (padded.length < gridCellCount) {
    padded.push(fallbackValue);
  }
  return padded;
}

export function normalizeFarmStateForGrid(rawFarm, gridCellCount) {
  const base = createEmptyFarmStateForGrid(gridCellCount);
  if (!rawFarm || typeof rawFarm !== 'object') return base;
  return {
    gridUnlocked: normalizeFarmArray(rawFarm.gridUnlocked, false, gridCellCount).map((value) => !!value),
    gridItems: normalizeFarmArray(rawFarm.gridItems, null, gridCellCount),
    gridPlantedDay: normalizeFarmArray(rawFarm.gridPlantedDay, null, gridCellCount),
    gridWateredDay: normalizeFarmArray(rawFarm.gridWateredDay, null, gridCellCount),
    gridWateredCount: normalizeFarmArray(rawFarm.gridWateredCount, 0, gridCellCount).map((value) => Math.max(0, Number(value) || 0)),
    gridMiningHits: normalizeFarmArray(rawFarm.gridMiningHits, 0, gridCellCount).map((value) => Math.max(0, Number(value) || 0)),
    gridRarity: normalizeFarmArray(rawFarm.gridRarity, null, gridCellCount),
    gridPurchasePrice: normalizeFarmArray(rawFarm.gridPurchasePrice, null, gridCellCount)
      .map((value) => (value === null ? null : Math.max(0, Number(value) || 0))),
    gridPlacedMeta: normalizeFarmArray(rawFarm.gridPlacedMeta, null, gridCellCount)
  };
}

export function isFarmStateShapeValidForGrid(farm, gridCellCount) {
  if (!farm || typeof farm !== 'object') return false;
  return Array.isArray(farm.gridUnlocked) && farm.gridUnlocked.length === gridCellCount
    && Array.isArray(farm.gridItems) && farm.gridItems.length === gridCellCount
    && Array.isArray(farm.gridPlantedDay) && farm.gridPlantedDay.length === gridCellCount
    && Array.isArray(farm.gridWateredDay) && farm.gridWateredDay.length === gridCellCount
    && Array.isArray(farm.gridWateredCount) && farm.gridWateredCount.length === gridCellCount
    && Array.isArray(farm.gridMiningHits) && farm.gridMiningHits.length === gridCellCount
    && Array.isArray(farm.gridRarity) && farm.gridRarity.length === gridCellCount
    && Array.isArray(farm.gridPurchasePrice) && farm.gridPurchasePrice.length === gridCellCount
    && Array.isArray(farm.gridPlacedMeta) && farm.gridPlacedMeta.length === gridCellCount;
}
