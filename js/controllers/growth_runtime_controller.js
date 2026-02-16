export function createGrowthRuntimeController(deps) {
  const {
    state,
    normalizeRarity,
    getRarityMultiplier,
    getItemCurrentPrice,
    addMessage,
    rollRarity,
    saveToStorage
  } = deps;

  function getEffectiveWateredCount(index) {
    const wateredCount = Array.isArray(state.gridWateredCount) ? (state.gridWateredCount[index] || 0) : 0;
    const wateredToday = Array.isArray(state.gridWateredDay) && state.gridWateredDay[index] === state.player.day;
    return Math.max(0, wateredCount - (wateredToday ? 1 : 0));
  }

  function getPlantGrowthState(item, index) {
    const stageCount = Math.max(1, Number(item?.plantStages) || 1);
    const growDays = Math.max(0, Number(item?.growDays) || 0);
    if (growDays <= 0) {
      return { stageIndex: stageCount, isGrown: true, daysLeft: 0 };
    }
    const effectiveWateredCount = getEffectiveWateredCount(index);
    const isGrown = effectiveWateredCount >= growDays;
    const daysLeft = Math.max(0, growDays - effectiveWateredCount);
    let stageIndex = 1;
    if (stageCount > 1 && !isGrown) {
      const progress = Math.max(0, Math.min(0.9999, effectiveWateredCount / growDays));
      stageIndex = 1 + Math.floor(progress * (stageCount - 1));
    } else if (isGrown) {
      stageIndex = stageCount;
    }
    return { stageIndex, isGrown, daysLeft };
  }

  function getGridRarity(index) {
    if (!Array.isArray(state.gridRarity)) return null;
    const rarity = state.gridRarity[index];
    if (!rarity) return null;
    return normalizeRarity(rarity);
  }

  function assignGridRarity(index) {
    if (!Array.isArray(state.gridRarity)) return null;
    const existing = getGridRarity(index);
    if (existing) return existing;
    const rolled = rollRarity();
    state.gridRarity[index] = rolled;
    saveToStorage('gridRarity', state.gridRarity);
    return rolled;
  }

  function addRareGrowthMessage(item, rarity) {
    const normalized = normalizeRarity(rarity);
    if (normalized !== 'rare' && normalized !== 'mythic') return;
    const rarityLabel = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    const multiplier = getRarityMultiplier(normalized);
    const multiplierLabel = Number.isInteger(multiplier) ? String(multiplier) : multiplier.toFixed(2);
    const basePrice = getItemCurrentPrice(item.id);
    addMessage(
      `1x ${rarityLabel} ${item.name} grown! Worth ${multiplierLabel}x buy price ($${basePrice.toFixed(2)} -> $${(basePrice * multiplier).toFixed(2)}).`,
      { speaker: 'player', emotion: 'excited', category: 'progress', priority: 'high' }
    );
  }

  return {
    getPlantGrowthState,
    getGridRarity,
    assignGridRarity,
    addRareGrowthMessage
  };
}
