import { clone } from '../core/storage.js';
import { normalizeItemTypeAndTableKey } from './item_types.js';

function cleanSpacing(text) {
  return String(text || '')
    .replace(/\s+([.,!?:;])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function removeSeedWord(text) {
  if (typeof text !== 'string') return text;
  return cleanSpacing(text.replace(/\bSeeds?\b/gi, ''));
}

function removeTrailingPeriod(text) {
  return String(text || '').trim().replace(/\.+$/, '');
}

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
    assignIfMissing('plantStageImages');
    assignIfMissing('harvestImage');
    assignIfMissing('rarity');
    assignIfMissing('name');
    assignIfMissing('description');
    assignIfMissing('type');
    assignIfMissing('table_key');
    assignIfMissing('image');
    assignIfMissing('cycleDays');
    assignIfMissing('cycleOffsets');
    assignIfMissing('cycleFamily');
    assignIfMissing('noiseLevel');
    assignIfMissing('shockSensitivity');
    assignIfMissing('rarityProfile');
    assignIfMissing('weatherSensitivity');
    assignIfMissing('identitySummary');
    // Prices are canonical content data (shop economy uses state.shop for produce,
    // but utility/fixed-price purchases read item.price directly). Sync saved items
    // to current content pricing so balance updates apply to existing saves.
    if (Number.isFinite(Number(defaultItem.price))) {
      const normalizedCurrentPrice = Math.max(0, Number(nextItem.price) || 0);
      const normalizedDefaultPrice = Math.max(0, Number(defaultItem.price) || 0);
      if (Math.abs(normalizedCurrentPrice - normalizedDefaultPrice) > 0.0001) {
        if (nextItem === item) nextItem = { ...item };
        nextItem.price = normalizedDefaultPrice;
        changed = true;
      }
    }

    // Backward compatibility: if old saves only have seedIconImage, promote it.
    if (!nextItem.harvestImage && nextItem.seedIconImage) {
      if (nextItem === item) nextItem = { ...item };
      nextItem.harvestImage = nextItem.seedIconImage;
      changed = true;
    }

    const sanitizedName = removeSeedWord(nextItem.name);
    if (typeof sanitizedName === 'string' && sanitizedName && sanitizedName !== nextItem.name) {
      if (nextItem === item) nextItem = { ...item };
      nextItem.name = sanitizedName;
      changed = true;
    }

    // Drop redundant description when it is just the item name.
    if (typeof nextItem.description === 'string') {
      const normalizedName = removeTrailingPeriod(nextItem.name).toLowerCase();
      const normalizedDescription = removeTrailingPeriod(nextItem.description).toLowerCase();
      if (normalizedName && normalizedDescription && normalizedName === normalizedDescription) {
        if (nextItem === item) nextItem = { ...item };
        delete nextItem.description;
        changed = true;
      }
    }

    // Drop redundant seedIconImage when it mirrors harvestImage.
    if (
      typeof nextItem.seedIconImage === 'string'
      && typeof nextItem.harvestImage === 'string'
      && nextItem.seedIconImage.trim() === nextItem.harvestImage.trim()
    ) {
      if (nextItem === item) nextItem = { ...item };
      delete nextItem.seedIconImage;
      changed = true;
    }

    const normalizedTypedItem = normalizeItemTypeAndTableKey(nextItem, 'saved state');
    if (
      normalizedTypedItem.type !== nextItem.type
      || normalizedTypedItem.table_key !== nextItem.table_key
    ) {
      if (nextItem === item) nextItem = { ...item };
      nextItem.type = normalizedTypedItem.type;
      nextItem.table_key = normalizedTypedItem.table_key;
      changed = true;
    }
    if (
      String(nextItem.type || '').toLowerCase() === 'produce'
      && typeof nextItem.harvestImage === 'string'
      && /^items\/[^/]+\.png$/i.test(nextItem.harvestImage.trim())
    ) {
      if (nextItem === item) nextItem = { ...item };
      nextItem.harvestImage = nextItem.harvestImage.replace(/^items\//i, 'items/produce/');
      changed = true;
    }

    return nextItem;
  });
  const hasStableId = (item) => {
    if (!item || typeof item !== 'object') return false;
    const idType = typeof item.id;
    return idType === 'number' || idType === 'string';
  };
  const existingIds = new Set(
    mergedItems
      .filter((item) => hasStableId(item))
      .map((item) => item.id)
  );
  defaultItems.forEach((defaultItem) => {
    if (!hasStableId(defaultItem)) return;
    if (existingIds.has(defaultItem.id)) return;
    mergedItems.push(clone(defaultItem));
    changed = true;
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
  const nextStore = { ...store, cosmetics: mergedCosmetics };
  if (Object.prototype.hasOwnProperty.call(nextStore, 'decorations')) {
    delete nextStore.decorations;
    changed = true;
  }
  if (Object.prototype.hasOwnProperty.call(nextStore, 'crafting')) {
    delete nextStore.crafting;
    changed = true;
  }
  return { store: nextStore, changed };
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
