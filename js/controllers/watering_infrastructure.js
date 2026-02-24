import { getItemBehavior, isProduceItem } from '../content/item_types.js';

export const SPRINKLER_DEFAULT_CONFIG_BY_LEVEL = Object.freeze({
  1: Object.freeze({ capacity: 4, radius: 1, waterPerCrop: 1, efficiencyLevel: 1 })
});

function getGridSideLength(gridItems) {
  const count = Array.isArray(gridItems) ? gridItems.length : 0;
  if (count <= 0) return 0;
  const side = Math.round(Math.sqrt(count));
  return side > 0 ? side : 0;
}

function getOrthogonalNeighborIndices(cellIndex, gridItems, radius = 1) {
  const side = getGridSideLength(gridItems);
  if (!side) return [];
  const row = Math.floor(cellIndex / side);
  const col = cellIndex % side;
  const neighbors = [];
  const safeRadius = Math.max(1, Math.floor(Number(radius) || 1));
  for (let step = 1; step <= safeRadius; step += 1) {
    if (row - step >= 0) neighbors.push(cellIndex - (side * step));
    if (row + step < side) neighbors.push(cellIndex + (side * step));
    if (col - step >= 0) neighbors.push(cellIndex - step);
    if (col + step < side) neighbors.push(cellIndex + step);
  }
  return neighbors;
}

export function getSprinklerTargetOrderIndices(cellIndex, gridItems, radius = 1) {
  return getOrthogonalNeighborIndices(cellIndex, gridItems, radius)
    .slice()
    .sort((a, b) => a - b);
}

export function getWateringCanLevel(state) {
  const level = Number(state?.toolLevels?.watering) || 1;
  return Math.max(1, Math.floor(level));
}

export function getWateringCanTilesPerEnergy(state) {
  return getWateringCanLevel(state);
}

export function getInfrastructureRefillUnitsPerUse(state) {
  return Math.max(1, getWateringCanTilesPerEnergy(state) * 2);
}

export function getGrowthAccelerationChanceForLevel(levelRaw) {
  const level = Math.max(1, Math.floor(Number(levelRaw) || 1));
  return Math.max(0, Math.min(1, level / 100));
}

export function tryApplyGrowthAccelerationBonus({
  farmState,
  cellIndex,
  item,
  dayNumber,
  toolLevel = 1,
  random = Math.random
}) {
  if (!farmState || !item || !isProduceItem(item)) return false;
  if (!Array.isArray(farmState.gridWateredDay) || !Array.isArray(farmState.gridWateredCount)) return false;
  if (farmState.gridWateredDay[cellIndex] !== dayNumber) return false;
  const growDays = Math.max(0, Number(item.growDays) || 0);
  if (growDays <= 0) return false;
  const wateredCount = Math.max(0, Number(farmState.gridWateredCount[cellIndex]) || 0);
  if (wateredCount >= growDays) return false;
  if ((random?.() ?? Math.random()) >= getGrowthAccelerationChanceForLevel(toolLevel)) return false;
  farmState.gridWateredCount[cellIndex] = wateredCount + 1;
  return true;
}

export function getSprinklerPlacementConfig(meta = null) {
  const level = Math.max(1, Math.floor(Number(meta?.sprinklerLevel) || 1));
  const levelDefaults = SPRINKLER_DEFAULT_CONFIG_BY_LEVEL[level] || SPRINKLER_DEFAULT_CONFIG_BY_LEVEL[1];
  const capacity = Math.max(1, Math.floor(Number(meta?.sprinklerCapacity) || levelDefaults.capacity));
  const radius = Math.max(1, Math.floor(Number(meta?.sprinklerRadius) || levelDefaults.radius));
  const waterPerCrop = Math.max(1, Number(meta?.sprinklerWaterPerCrop) || levelDefaults.waterPerCrop);
  const efficiencyLevel = Math.max(1, Math.floor(Number(meta?.sprinklerEfficiencyLevel) || levelDefaults.efficiencyLevel));
  return { level, capacity, radius, waterPerCrop, efficiencyLevel };
}

export function ensureInfrastructureMetaForPlacedItem(item, existingMeta = null) {
  const behavior = getItemBehavior(item);
  if (behavior.wateringMode !== 'refillable') {
    return existingMeta && typeof existingMeta === 'object' ? existingMeta : null;
  }
  const nextMeta = (existingMeta && typeof existingMeta === 'object') ? { ...existingMeta } : {};
  if (!nextMeta.itemType) {
    nextMeta.itemType = String(item?.type || '').trim().toLowerCase() || 'unknown';
  }
  if (!nextMeta.tableKey) {
    nextMeta.tableKey = String(item?.table_key || '').trim().toLowerCase() || 'utility';
  }
  if (nextMeta.itemType === 'sprinkler') {
    const cfg = getSprinklerPlacementConfig(nextMeta);
    nextMeta.sprinklerLevel = cfg.level;
    nextMeta.sprinklerCapacity = cfg.capacity;
    nextMeta.sprinklerRadius = cfg.radius;
    nextMeta.sprinklerWaterPerCrop = cfg.waterPerCrop;
    nextMeta.sprinklerEfficiencyLevel = cfg.efficiencyLevel;
    nextMeta.tankCurrent = Math.max(0, Math.min(cfg.capacity, Number(nextMeta.tankCurrent) || 0));
  } else {
    // Generic refillable utility fallback (future-use for fertiliser variants).
    const capacity = Math.max(1, Math.floor(Number(nextMeta.tankCapacity) || 4));
    nextMeta.tankCapacity = capacity;
    nextMeta.tankCurrent = Math.max(0, Math.min(capacity, Number(nextMeta.tankCurrent) || 0));
  }
  return nextMeta;
}

export function getRefillableTankState(item, meta = null) {
  const behavior = getItemBehavior(item);
  if (behavior.wateringMode !== 'refillable') return null;
  const safeMeta = ensureInfrastructureMetaForPlacedItem(item, meta);
  if (String(item?.type || '').trim().toLowerCase() === 'sprinkler') {
    const cfg = getSprinklerPlacementConfig(safeMeta);
    return {
      current: Math.max(0, Number(safeMeta.tankCurrent) || 0),
      capacity: cfg.capacity
    };
  }
  return {
    current: Math.max(0, Number(safeMeta.tankCurrent) || 0),
    capacity: Math.max(1, Number(safeMeta.tankCapacity) || 4)
  };
}

export function refillRefillablePlacedItem({
  state,
  cellIndex,
  item
}) {
  if (!state || !Array.isArray(state.gridPlacedMeta) || !item) return null;
  const behavior = getItemBehavior(item);
  if (behavior.wateringMode !== 'refillable') return null;

  const meta = ensureInfrastructureMetaForPlacedItem(item, state.gridPlacedMeta[cellIndex]);
  const tank = getRefillableTankState(item, meta);
  if (!tank) return null;
  const current = Math.max(0, Number(tank.current) || 0);
  const capacity = Math.max(1, Number(tank.capacity) || 1);
  if (current >= capacity) {
    state.gridPlacedMeta[cellIndex] = meta;
    return {
      didRefill: false,
      isFull: true,
      addedUnits: 0,
      currentUnits: current,
      capacityUnits: capacity
    };
  }
  const addedUnits = Math.max(1, Math.min(capacity - current, getInfrastructureRefillUnitsPerUse(state)));
  const nextCurrent = Math.min(capacity, current + addedUnits);
  meta.tankCurrent = nextCurrent;
  state.gridPlacedMeta[cellIndex] = meta;
  return {
    didRefill: addedUnits > 0,
    isFull: nextCurrent >= capacity,
    addedUnits,
    currentUnits: nextCurrent,
    capacityUnits: capacity
  };
}

function isCropGrownForDawn(farm, cellIndex, item) {
  const growDays = Math.max(0, Number(item?.growDays) || 0);
  if (growDays <= 0) return true;
  if (!Array.isArray(farm.gridWateredCount)) return false;
  const watered = Math.max(0, Number(farm.gridWateredCount[cellIndex]) || 0);
  return watered >= growDays;
}

export function applyDawnSprinklersToFarm({
  farm,
  itemsById,
  dayNumber,
  random = Math.random
}) {
  const summary = {
    sprinklerCount: 0,
    activeSprinklerCount: 0,
    cropsWatered: 0,
    waterUnitsConsumed: 0,
    bonusGrowthTriggers: 0,
    waterUnitsRemaining: 0,
    events: [],
    emptyAtDawnCount: 0
  };
  if (!farm || typeof farm !== 'object') return summary;
  if (
    !Array.isArray(farm.gridItems)
    || !Array.isArray(farm.gridWateredDay)
    || !Array.isArray(farm.gridWateredCount)
    || !Array.isArray(farm.gridPlacedMeta)
  ) {
    return summary;
  }

  for (let i = 0; i < farm.gridItems.length; i += 1) {
    const itemId = farm.gridItems[i];
    if (!itemId) continue;
    const item = itemsById.get(String(itemId));
    if (!item || String(item.type || '').trim().toLowerCase() !== 'sprinkler') continue;
    summary.sprinklerCount += 1;
    const meta = ensureInfrastructureMetaForPlacedItem(item, farm.gridPlacedMeta[i]);
    const cfg = getSprinklerPlacementConfig(meta);
    let tankCurrent = Math.max(0, Math.min(cfg.capacity, Number(meta.tankCurrent) || 0));
    const neighbors = getSprinklerTargetOrderIndices(i, farm.gridItems, cfg.radius);
    let hasEligibleDryCrop = false;
    for (let n = 0; n < neighbors.length; n += 1) {
      const targetIndex = neighbors[n];
      const targetItemId = farm.gridItems[targetIndex];
      if (!targetItemId) continue;
      const targetItem = itemsById.get(String(targetItemId));
      if (!targetItem || !isProduceItem(targetItem)) continue;
      if (farm.gridWateredDay[targetIndex] === dayNumber) continue;
      if (isCropGrownForDawn(farm, targetIndex, targetItem)) continue;
      hasEligibleDryCrop = true;
      break;
    }
    if (hasEligibleDryCrop && tankCurrent < cfg.waterPerCrop) {
      summary.emptyAtDawnCount += 1;
    }
    let sprinklerWateredAny = false;
    for (let n = 0; n < neighbors.length; n += 1) {
      const targetIndex = neighbors[n];
      if (tankCurrent < cfg.waterPerCrop) break;
      const targetItemId = farm.gridItems[targetIndex];
      if (!targetItemId) continue;
      const targetItem = itemsById.get(String(targetItemId));
      if (!targetItem || !isProduceItem(targetItem)) continue;
      if (farm.gridWateredDay[targetIndex] === dayNumber) continue;
      if (isCropGrownForDawn(farm, targetIndex, targetItem)) continue;

      farm.gridWateredDay[targetIndex] = dayNumber;
      farm.gridWateredCount[targetIndex] = Math.max(0, Number(farm.gridWateredCount[targetIndex]) || 0) + 1;
      tankCurrent -= cfg.waterPerCrop;
      summary.waterUnitsConsumed += cfg.waterPerCrop;
      summary.cropsWatered += 1;
      sprinklerWateredAny = true;
      summary.events.push({
        sprinklerIndex: i,
        targetIndex,
        waterUsed: cfg.waterPerCrop
      });

      if (tryApplyGrowthAccelerationBonus({
        farmState: farm,
        cellIndex: targetIndex,
        item: targetItem,
        dayNumber,
        toolLevel: cfg.level,
        random
      })) {
        summary.bonusGrowthTriggers += 1;
      }
    }
    meta.tankCurrent = Math.max(0, Math.min(cfg.capacity, tankCurrent));
    meta.lastSprinklerActivationDay = dayNumber;
    farm.gridPlacedMeta[i] = meta;
    summary.waterUnitsRemaining += Math.max(0, Number(meta.tankCurrent) || 0);
    if (sprinklerWateredAny) {
      summary.activeSprinklerCount += 1;
    }
  }

  return summary;
}

export function refillSprinklersForRainToFull({ farm, itemsById }) {
  const summary = {
    sprinklersRefilled: 0,
    waterUnitsAdded: 0
  };
  if (!farm || typeof farm !== 'object') return summary;
  if (!Array.isArray(farm.gridItems) || !Array.isArray(farm.gridPlacedMeta)) return summary;
  for (let i = 0; i < farm.gridItems.length; i += 1) {
    const itemId = farm.gridItems[i];
    if (!itemId) continue;
    const item = itemsById.get(String(itemId));
    if (!item || String(item.type || '').trim().toLowerCase() !== 'sprinkler') continue;
    const meta = ensureInfrastructureMetaForPlacedItem(item, farm.gridPlacedMeta[i]);
    const cfg = getSprinklerPlacementConfig(meta);
    const current = Math.max(0, Math.min(cfg.capacity, Number(meta.tankCurrent) || 0));
    if (current >= cfg.capacity) {
      farm.gridPlacedMeta[i] = meta;
      continue;
    }
    summary.sprinklersRefilled += 1;
    summary.waterUnitsAdded += (cfg.capacity - current);
    meta.tankCurrent = cfg.capacity;
    farm.gridPlacedMeta[i] = meta;
  }
  return summary;
}
