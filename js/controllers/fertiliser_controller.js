import { isProduceItem } from '../content/item_types.js';

export const FERTILISER_ITEM_IDS = Object.freeze({
  waterRetention: 33,
  speedGrow: 34,
  quality: 35
});

export const FERTILISER_STACK_KEYS = Object.freeze([
  'waterRetention',
  'speedGrow',
  'quality'
]);

const EMPTY_STACKS = Object.freeze({
  waterRetention: 0,
  speedGrow: 0,
  quality: 0
});

function toNonNegativeInt(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function cloneStacks(stacks) {
  return {
    waterRetention: toNonNegativeInt(stacks?.waterRetention),
    speedGrow: toNonNegativeInt(stacks?.speedGrow),
    quality: toNonNegativeInt(stacks?.quality)
  };
}

export function isFertiliserItem(item) {
  return String(item?.type || '').trim().toLowerCase() === 'fertiliser';
}

export function getFertiliserTypeKeyForItem(item) {
  if (!isFertiliserItem(item)) return null;
  const id = Number(item?.id);
  if (id === FERTILISER_ITEM_IDS.waterRetention) return 'waterRetention';
  if (id === FERTILISER_ITEM_IDS.speedGrow) return 'speedGrow';
  if (id === FERTILISER_ITEM_IDS.quality) return 'quality';
  const name = String(item?.name || '').toLowerCase();
  if (name.includes('water')) return 'waterRetention';
  if (name.includes('speed') || name.includes('grow')) return 'speedGrow';
  if (name.includes('quality')) return 'quality';
  return null;
}

export function getNormalizedFertiliserStacksFromMeta(meta) {
  if (!meta || typeof meta !== 'object') return cloneStacks(EMPTY_STACKS);
  const stacks = meta.fertiliser?.stacks;
  return cloneStacks(stacks || EMPTY_STACKS);
}

export function getPlantFertiliserStacks(state, cellIndex) {
  const meta = Array.isArray(state?.gridPlacedMeta) ? state.gridPlacedMeta[cellIndex] : null;
  return getNormalizedFertiliserStacksFromMeta(meta);
}

export function hasPlantFertiliser(state, cellIndex) {
  const stacks = getPlantFertiliserStacks(state, cellIndex);
  return (stacks.waterRetention + stacks.speedGrow + stacks.quality) > 0;
}

export function withAppliedPlantFertiliserMeta(existingMeta, fertiliserTypeKey) {
  if (!FERTILISER_STACK_KEYS.includes(fertiliserTypeKey)) return existingMeta ?? null;
  const meta = (existingMeta && typeof existingMeta === 'object') ? { ...existingMeta } : {};
  const stacks = getNormalizedFertiliserStacksFromMeta(existingMeta);
  stacks[fertiliserTypeKey] = toNonNegativeInt(stacks[fertiliserTypeKey]) + 1;
  meta.fertiliser = { ...(meta.fertiliser && typeof meta.fertiliser === 'object' ? meta.fertiliser : {}), stacks };
  return meta;
}

export function getPlantFertiliserEffectsSummary(state, item, cellIndex, rarityRolls = null) {
  const stacks = getPlantFertiliserStacks(state, cellIndex);
  const speedGrowDays = toNonNegativeInt(stacks.speedGrow);
  const waterRetentionDays = toNonNegativeInt(stacks.waterRetention);
  const qualityStacks = toNonNegativeInt(stacks.quality);
  const qualityRolls = Array.isArray(rarityRolls)
    ? transformRarityWeightsForQualityFertiliser(rarityRolls, qualityStacks)
    : null;
  return {
    stacks,
    hasAny: (speedGrowDays + waterRetentionDays + qualityStacks) > 0,
    speedGrowDays,
    waterRetentionDays,
    qualityStacks,
    qualityRolls,
    qualityMythicPercent: Array.isArray(qualityRolls)
      ? Math.max(0, Number(qualityRolls.find((entry) => entry?.rarity === 'mythic')?.weight) || 0)
      : null,
    effectiveGrowDays: getEffectiveGrowDaysForPlant(item, stacks),
    retainedWaterBonusDays: getRetainedWaterBonusDays(state, cellIndex, stacks)
  };
}

export function getEffectiveGrowDaysForPlant(item, stacksOrCount) {
  const baseGrowDays = Math.max(0, Number(item?.growDays) || 0);
  const speedStacks = typeof stacksOrCount === 'number'
    ? toNonNegativeInt(stacksOrCount)
    : toNonNegativeInt(stacksOrCount?.speedGrow);
  return Math.max(0, baseGrowDays - speedStacks);
}

export function getRetainedWaterBonusDays(state, cellIndex, stacksOrCount = null) {
  const stacks = typeof stacksOrCount === 'number'
    ? { waterRetention: stacksOrCount }
    : (stacksOrCount || getPlantFertiliserStacks(state, cellIndex));
  const retentionStacks = toNonNegativeInt(stacks.waterRetention);
  if (retentionStacks <= 0) return 0;
  const wateredCount = Math.max(0, Number(Array.isArray(state?.gridWateredCount) ? state.gridWateredCount[cellIndex] : 0) || 0);
  if (wateredCount <= 0) return 0;
  const lastWateredDay = Number(Array.isArray(state?.gridWateredDay) ? state.gridWateredDay[cellIndex] : NaN);
  const currentDay = Number(state?.player?.day);
  if (!Number.isFinite(lastWateredDay) || !Number.isFinite(currentDay)) return 0;
  const daysSinceLastWatering = Math.max(0, Math.floor(currentDay - lastWateredDay));
  // Base watering covers one day of progress; retention extends after that.
  return Math.max(0, Math.min(retentionStacks, daysSinceLastWatering - 1));
}

export function getPlantGrowthProgressWithFertiliser(state, item, cellIndex) {
  const stacks = getPlantFertiliserStacks(state, cellIndex);
  const wateredCount = Math.max(0, Number(Array.isArray(state?.gridWateredCount) ? state.gridWateredCount[cellIndex] : 0) || 0);
  const wateredToday = Array.isArray(state?.gridWateredDay) && state.gridWateredDay[cellIndex] === state?.player?.day;
  const retainedWaterBonusDays = getRetainedWaterBonusDays(state, cellIndex, stacks);
  const effectiveWateredCount = Math.max(0, wateredCount + retainedWaterBonusDays - (wateredToday ? 1 : 0));
  const effectiveGrowDays = getEffectiveGrowDaysForPlant(item, stacks);
  const isGrown = effectiveWateredCount >= effectiveGrowDays;
  const daysLeft = Math.max(0, effectiveGrowDays - effectiveWateredCount);
  return {
    stacks,
    effectiveWateredCount,
    effectiveGrowDays,
    retainedWaterBonusDays,
    isGrown,
    daysLeft
  };
}

function cloneRarityRolls(rarityRolls) {
  if (!Array.isArray(rarityRolls)) return [];
  return rarityRolls.map((entry) => ({
    rarity: String(entry?.rarity || '').trim().toLowerCase(),
    weight: Math.max(0, Number(entry?.weight) || 0)
  }));
}

export function transformRarityWeightsForQualityFertiliser(rarityRolls, qualityStacks) {
  const stacks = toNonNegativeInt(qualityStacks);
  const rolls = cloneRarityRolls(rarityRolls);
  if (!rolls.length || stacks <= 0) return rolls;

  const order = ['common', 'uncommon', 'rare', 'mythic'];
  const byKey = new Map();
  rolls.forEach((entry) => byKey.set(entry.rarity, entry));
  order.forEach((rarity) => {
    if (!byKey.has(rarity)) byKey.set(rarity, { rarity, weight: 0 });
  });

  for (let stackIndex = 0; stackIndex < stacks; stackIndex += 1) {
    let shiftRemaining = 5;
    const sourceOrder = ['common', 'uncommon', 'rare'];

    for (const source of sourceOrder) {
      if (shiftRemaining <= 0) break;
      const sourceEntry = byKey.get(source);
      const removable = Math.min(shiftRemaining, Math.max(0, Number(sourceEntry?.weight) || 0));
      if (removable <= 0) continue;
      sourceEntry.weight -= removable;
      shiftRemaining -= removable;

      const sourceIdx = order.indexOf(source);
      const recipientKeys = order.slice(Math.max(0, sourceIdx + 1));
      if (!recipientKeys.length) {
        shiftRemaining += removable;
        sourceEntry.weight += removable;
        continue;
      }
      const recipientWeightsTotal = recipientKeys.reduce((sum, rarity) => sum + Math.max(0, Number(byKey.get(rarity)?.weight) || 0), 0);
      let remainingToAdd = removable;
      if (recipientWeightsTotal > 0 && recipientKeys.length > 1) {
        recipientKeys.forEach((rarity, idx) => {
          const entry = byKey.get(rarity);
          if (idx === recipientKeys.length - 1) {
            entry.weight += remainingToAdd;
            remainingToAdd = 0;
            return;
          }
          const share = removable * ((Math.max(0, Number(entry?.weight) || 0)) / recipientWeightsTotal);
          const applied = Math.max(0, Math.min(remainingToAdd, share));
          entry.weight += applied;
          remainingToAdd -= applied;
        });
      } else {
        byKey.get(recipientKeys[0]).weight += removable;
        remainingToAdd = 0;
      }
      if (remainingToAdd > 0) {
        byKey.get(recipientKeys[recipientKeys.length - 1]).weight += remainingToAdd;
      }
    }
    if (shiftRemaining >= 5) {
      // No removable lower-tier weight remains; quality is effectively maxed.
      break;
    }
  }

  const normalized = order.map((rarity) => ({
    rarity,
    weight: Math.max(0, Number(byKey.get(rarity)?.weight) || 0)
  }));
  const total = normalized.reduce((sum, entry) => sum + entry.weight, 0);
  if (total > 0 && Math.abs(total - 100) > 0.0001) {
    const scale = 100 / total;
    normalized.forEach((entry) => {
      entry.weight = entry.weight * scale;
    });
  }
  return normalized;
}

export function getQualityMythicWeight(rarityRolls, qualityStacks) {
  const rolls = transformRarityWeightsForQualityFertiliser(rarityRolls, qualityStacks);
  const mythic = rolls.find((entry) => entry.rarity === 'mythic');
  return Math.max(0, Number(mythic?.weight) || 0);
}

export function canApplyFertiliserToPlant({ state, cellIndex, fertiliserItem, targetItem, rarityRolls }) {
  const fertiliserTypeKey = getFertiliserTypeKeyForItem(fertiliserItem);
  if (!fertiliserTypeKey) {
    return { ok: false, reason: 'not_fertiliser', messageId: 'progress.fertiliser_only_on_plants' };
  }
  if (!targetItem || !isProduceItem(targetItem)) {
    return { ok: false, reason: 'not_plant', messageId: 'progress.fertiliser_only_on_plants' };
  }

  const progress = getPlantGrowthProgressWithFertiliser(state, targetItem, cellIndex);
  const stacks = progress.stacks;
  if (fertiliserTypeKey === 'speedGrow') {
    if (progress.daysLeft <= 1) {
      return { ok: false, reason: 'speed_maxed', messageId: 'progress.fertiliser_speed_maxed' };
    }
    return { ok: true, fertiliserTypeKey, nextStackCount: stacks.speedGrow + 1 };
  }
  if (fertiliserTypeKey === 'waterRetention') {
    const maxUsefulRetention = Math.max(0, progress.daysLeft - 1);
    if (stacks.waterRetention >= maxUsefulRetention) {
      return { ok: false, reason: 'water_retention_maxed', messageId: 'progress.fertiliser_water_retention_maxed' };
    }
    return { ok: true, fertiliserTypeKey, nextStackCount: stacks.waterRetention + 1 };
  }
  if (fertiliserTypeKey === 'quality') {
    const mythicWeight = getQualityMythicWeight(rarityRolls, stacks.quality);
    if (mythicWeight >= 99.999) {
      return { ok: false, reason: 'quality_maxed', messageId: 'progress.fertiliser_quality_maxed' };
    }
    return { ok: true, fertiliserTypeKey, nextStackCount: stacks.quality + 1 };
  }
  return { ok: false, reason: 'unknown', messageId: 'progress.fertiliser_only_on_plants' };
}

export function getFertiliserDisplayLabel(typeKey) {
  if (typeKey === 'waterRetention') return 'Water Retention';
  if (typeKey === 'speedGrow') return 'Speed Grow';
  if (typeKey === 'quality') return 'Quality';
  return 'Fertiliser';
}
