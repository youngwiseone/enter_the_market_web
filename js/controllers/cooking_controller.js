import { RECIPES } from '../content/cooking_chapter.js';
import { isSaleCropPresent } from '../state/crop_identity.js';
import { withNewCropIdentity } from '../state/crop_identity.js';
import { getCropAdjustedRarityMultiplier } from '../sim/crop_identity.js';
import { getRarityMultiplier, RARITY_TYPES } from '../sim/rarity.js';
import { normalizeChapter } from '../state/cooking_chapter.js';

// A meal has a frozen value: 115% of the sum of base crop values, including
// each crop's own rarity curve and source farm exactly once. Market peaks are
// deliberately excluded. Display rarity is floor(mean tier), never a multiplier.
export function quoteRecipe(cells) {
  const sum = key => cells.reduce((n, cell) => n + (Number(cell.quote?.[key]) || 0), 0);
  const saleValue = cells.reduce((n, cell) => n + Number(cell.item.price)
    * getCropAdjustedRarityMultiplier(cell.item, cell.rarity, getRarityMultiplier)
    * (Number(cell.farmMultiplier) || 1), 0) * 1.15;
  const cost = sum('cost');
  return { saleValue, cost, seedCost: sum('seedCost'), treatmentCost: sum('treatmentCost'),
    historicalCostUnknown: cells.some(cell => !!cell.quote?.historicalCostUnknown), profit: saleValue - cost,
    rarity: RARITY_TYPES[Math.floor(cells.reduce((n, c) => n + Math.max(0, RARITY_TYPES.indexOf(c.rarity)), 0) / cells.length)] };
}

export function clearConsumedCell(farm, index) {
  for (const field of ['gridItems', 'gridPurchasePrice', 'gridRarity', 'gridPlantedDay', 'gridPlacedMeta']) {
    if (Array.isArray(farm[field])) farm[field][index] = null;
  }
  if (Array.isArray(farm.gridWateredCount)) farm.gridWateredCount[index] = 0;
  // Today's water stays with soil, matching normal sale settlement.
}

export function createCookingController(deps) {
  const { state, getCellSnapshot, onFeedback = () => {}, onCooked = () => {},
    registerDayAction = () => {}, awardCookingXp = () => {}, commit = fn => { fn(); deps.saveState?.(); } } = deps;
  let recipeId = RECIPES[0].id;
  let cells = [];
  let context = null;
  const contextKey = () => `${state.activeFarmId || 1}:${state.player.day}:${state.activeTool}:${state.player.cookingChapter?.active?.id || ''}:${state.player.cookingChapter?.active?.acceptedDay || ''}`;
  function cancel() { cells = []; context = null; }
  function sync() { if (context !== null && context !== contextKey()) cancel(); }
  function getRecipe() { return RECIPES.find(r => r.id === recipeId) || RECIPES[0]; }
  function chooseRecipe(id) { if (!RECIPES.some(r => r.id === id)) return false; cancel(); recipeId = id; return true; }
  function getPending() { sync(); return { recipe: getRecipe(), cells: cells.slice() }; }
  function getPreview() { sync(); return cells.length ? quoteRecipe(cells) : null; }
  function reject(message) { onFeedback(message); return { ok: false, message }; }
  function tap(index) {
    sync();
    if (state.activeTool !== 'pot' || !normalizeChapter(state).potUnlocked) return reject('Mina will teach you to use her pot.');
    if (state.runtimeFlags?.isSellBatchInFlight || state.runtimeFlags?.isRestInProgress) return reject('Wait for the current action to finish.');
    const cell = getCellSnapshot(index);
    if (!cell || cell.item?.type !== 'produce') return reject('Choose a mature ingredient from this recipe.');
    if (cells.some(c => c.instanceId === cell.instanceId)) return reject('That ingredient is already in the pot.');
    const recipe = getRecipe();
    const required = recipe.ingredients.filter(id => id === cell.itemId).length;
    if (!required || cells.filter(c => c.itemId === cell.itemId).length >= required) return reject('This recipe needs different ingredients.');
    if (cells.some(c => !isSaleCropPresent(state, c) || Number(c.farmId) !== Number(state.activeFarmId || 1))) {
      cancel(); return reject('The ingredients changed. Start the recipe again.');
    }
    const next = [...cells, cell];
    if (next.length < recipe.ingredients.length) {
      cells = next; context = contextKey();
      return { ok: true, complete: false };
    }
    if ((Number(state.player.energy) || 0) < 1) return reject('Cooking needs 1 energy. Rest or cancel; nothing has been consumed.');
    const quote = quoteRecipe(next);
    // Revalidate the complete set before any mutation. Settlement has no await.
    if (next.some(c => !isSaleCropPresent(state, c))) { cancel(); return reject('The ingredients changed. Start again.'); }
    try {
      commit(() => {
        next.forEach(c => clearConsumedCell(state, c.cellIndex));
        state.gridItems[index] = recipe.dishId;
        state.gridPurchasePrice[index] = quote.cost;
        state.gridRarity[index] = quote.rarity;
        state.gridPlacedMeta[index] = withNewCropIdentity({ dish: { ...quote, recipeId: recipe.id,
          inputs: next.map(c => ({ itemId: c.itemId, instanceId: c.instanceId, farmId: c.farmId,
            rarity: c.rarity, farmMultiplier: c.farmMultiplier, cost: c.quote?.cost || 0,
            seedCost: c.quote?.seedCost || 0, treatmentCost: c.quote?.treatmentCost || 0,
            historicalCostUnknown: !!c.quote?.historicalCostUnknown })) } });
        state.player.energy -= 1;
        state.dayEnergySpent = (Number(state.dayEnergySpent) || 0) + 1;
        normalizeChapter(state).cookedCount += 1;
        registerDayAction();
        awardCookingXp(2);
      });
    } catch { cancel(); return reject('Could not save the meal. Ingredients are safe; try again.'); }
    cancel();
    try { onCooked({ recipe, index, quote, inputs: next }); } catch { /* Cosmetic feedback cannot undo a settled meal. */ }
    return { ok: true, complete: true, index, quote };
  }
  return { tap, cancel, chooseRecipe, getPending, getPreview };
}
