import {
  getPlantGrowthProgressWithFertiliser,
  getPlantFertiliserStacks,
  transformRarityWeightsForQualityFertiliser
} from './fertiliser_controller.js';
import { RARITY_ROLLS } from '../sim/rarity.js';

export function createGrowthRuntimeController(deps) {
  const {
    state,
    normalizeRarity,
    getRarityMultiplier,
    getItemCurrentPrice,
    addMessage,
    rollRarity,
    saveToStorage,
    saveState
  } = deps;

  function getPlantGrowthState(item, index) {
    const stageCount = Math.max(1, Number(item?.plantStages) || 1);
    const progress = getPlantGrowthProgressWithFertiliser(state, item, index);
    const growDays = Math.max(0, Number(progress.effectiveGrowDays) || 0);
    if (growDays <= 0) {
      return { stageIndex: stageCount, isGrown: true, daysLeft: 0 };
    }
    const effectiveWateredCount = Math.max(0, Number(progress.effectiveWateredCount) || 0);
    const isGrown = !!progress.isGrown;
    const daysLeft = Math.max(0, Number(progress.daysLeft) || 0);
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
    const itemId = Array.isArray(state.gridItems) ? state.gridItems[index] : null;
    const item = itemId ? state.items.find((it) => it.id === itemId) : null;
    const qualityStacks = item ? getPlantFertiliserStacks(state, index).quality : 0;
    const rarityRolls = qualityStacks > 0
      ? transformRarityWeightsForQualityFertiliser(RARITY_ROLLS, qualityStacks)
      : RARITY_ROLLS;
    const rolled = rollRarity(rarityRolls);
    state.gridRarity[index] = rolled;
    if (typeof saveState === 'function') {
      // Persist full farm state so rarity cannot be rerolled via page refresh.
      saveState();
    } else {
      saveToStorage('gridRarity', state.gridRarity);
    }
    return rolled;
  }

  function addRareGrowthMessage(item, rarity) {
    const normalized = normalizeRarity(rarity);
    if (normalized !== 'rare' && normalized !== 'mythic') return;
    const rarityLabel = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    const multiplier = getRarityMultiplier(normalized);
    const multiplierLabel = Number.isInteger(multiplier) ? String(multiplier) : multiplier.toFixed(2);
    const basePrice = getItemCurrentPrice(item.id);
    addMessage({
      id: 'progress.rare_growth',
      vars: {
        rarityLabel,
        itemName: item.name,
        multiplierLabel,
        basePrice: basePrice.toFixed(2),
        sellPrice: (basePrice * multiplier).toFixed(2)
      },
      meta: { speaker: 'player', emotion: 'excited', category: 'progress', priority: 'high' }
    });
  }

  return {
    getPlantGrowthState,
    getGridRarity,
    assignGridRarity,
    addRareGrowthMessage
  };
}
