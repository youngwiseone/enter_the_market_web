import { clone } from '../core/storage.js';

export function mergeItemAssetsWithDefaults(items, defaultItems) {
  if (!Array.isArray(items) || !Array.isArray(defaultItems)) {
    return { items, changed: false };
  }
  const defaultsById = new Map(defaultItems.map((item) => [item.id, item]));
  let changed = false;
  const mergedItems = items.map((item) => {
    if (!item || typeof item !== 'object') return item;
    const defaultItem = defaultsById.get(item.id);
    if (!defaultItem) return item;
    let nextItem = item;
    const assignIfMissing = (key) => {
      const currentValue = nextItem[key];
      const defaultValue = defaultItem[key];
      const valueMissing = currentValue === undefined || currentValue === null
        || (Array.isArray(currentValue) && currentValue.length === 0);
      if (!valueMissing || defaultValue === undefined || defaultValue === null) return;
      if (nextItem === item) nextItem = { ...item };
      nextItem[key] = Array.isArray(defaultValue) ? [...defaultValue] : defaultValue;
      changed = true;
    };
    assignIfMissing('seedIconImage');
    assignIfMissing('plantStageImages');
    assignIfMissing('harvestImage');
    assignIfMissing('rarity');
    if (!nextItem.seedIconImage && nextItem.harvestImage) {
      if (nextItem === item) nextItem = { ...item };
      nextItem.seedIconImage = nextItem.harvestImage;
      changed = true;
    }
    return nextItem;
  });
  return { items: mergedItems, changed };
}

export function mergeStoreCosmeticsWithDefaults(store, defaultStore) {
  if (!store || typeof store !== 'object' || !defaultStore || typeof defaultStore !== 'object') {
    return { store, changed: false };
  }
  if (!Array.isArray(defaultStore.cosmetics)) {
    return { store, changed: false };
  }
  const savedCosmetics = Array.isArray(store.cosmetics) ? store.cosmetics : [];
  const savedById = new Map(savedCosmetics.map((item) => [item?.id, item]));
  let changed = false;
  const mergedCosmetics = defaultStore.cosmetics.map((defaultItem) => {
    if (!defaultItem || typeof defaultItem !== 'object' || typeof defaultItem.id !== 'string') {
      return defaultItem;
    }
    const saved = savedById.get(defaultItem.id);
    if (!saved || typeof saved !== 'object') {
      changed = true;
      return { ...defaultItem };
    }
    const merged = { ...defaultItem, unlocked: !!saved.unlocked };
    if (
      merged.name !== saved.name
      || merged.type !== saved.type
      || merged.price !== saved.price
    ) {
      changed = true;
    }
    return merged;
  });
  if (!Array.isArray(store.cosmetics) || store.cosmetics.length !== mergedCosmetics.length) {
    changed = true;
  }
  return { store: { ...store, cosmetics: mergedCosmetics }, changed };
}

export function mergeGoalsWithDefaults(goals, defaultGoals) {
  if (!Array.isArray(defaultGoals)) {
    return { goals, changed: false };
  }
  const savedGoals = Array.isArray(goals) ? goals : [];
  const savedById = new Map(savedGoals.map((goal) => [goal?.id, goal]));
  let changed = false;
  const mergedGoals = defaultGoals.map((defaultGoal) => {
    if (!defaultGoal || typeof defaultGoal !== 'object' || typeof defaultGoal.id !== 'string') {
      return defaultGoal;
    }
    const saved = savedById.get(defaultGoal.id);
    if (!saved || typeof saved !== 'object') {
      changed = true;
      return clone(defaultGoal);
    }
    const mergedGoal = clone(defaultGoal);
    if (saved.enabled === false) {
      mergedGoal.enabled = false;
    }
    if (JSON.stringify(saved) !== JSON.stringify(mergedGoal)) {
      changed = true;
    }
    return mergedGoal;
  });
  if (savedGoals.length !== mergedGoals.length) {
    changed = true;
  }
  return { goals: mergedGoals, changed };
}
