export const VALID_ITEM_TABLE_KEYS = Object.freeze([
  'produce_market',
  'utility',
  'decorations'
]);

export const ITEM_BEHAVIOR_BY_TYPE = Object.freeze({
  produce: Object.freeze({
    canShareTileSpace: false,
    usesMarketPricing: true,
    isProduce: true,
    wateringMode: 'crop'
  }),
  sprinkler: Object.freeze({
    canShareTileSpace: false,
    usesMarketPricing: false,
    isProduce: false,
    wateringMode: 'refillable'
  }),
  fertiliser: Object.freeze({
    canShareTileSpace: false,
    usesMarketPricing: false,
    isProduce: false,
    wateringMode: 'refillable'
  }),
  decoration: Object.freeze({
    canShareTileSpace: false,
    usesMarketPricing: false,
    isProduce: false,
    wateringMode: 'none'
  })
});

export function getItemTypeKey(item) {
  return String(item?.type || '').trim().toLowerCase();
}

export function getNormalizedItemTableKey(item) {
  const raw = String(item?.table_key || '').trim().toLowerCase();
  if (VALID_ITEM_TABLE_KEYS.includes(raw)) return raw;
  const itemType = getItemTypeKey(item);
  if (itemType === 'produce') return 'produce_market';
  if (itemType === 'decoration') return 'decorations';
  if (itemType) return 'utility';
  return '';
}

export function isProduceItem(item) {
  return getItemTypeKey(item) === 'produce' || getNormalizedItemTableKey(item) === 'produce_market';
}

export function isDecorationItem(item) {
  return getItemTypeKey(item) === 'decoration' || getNormalizedItemTableKey(item) === 'decorations';
}

export function isUtilityItem(item) {
  return !isProduceItem(item) && !isDecorationItem(item) && getNormalizedItemTableKey(item) === 'utility';
}

export function getItemBehavior(item) {
  const behavior = ITEM_BEHAVIOR_BY_TYPE[getItemTypeKey(item)];
  if (behavior) return behavior;
  if (isProduceItem(item)) return ITEM_BEHAVIOR_BY_TYPE.produce;
  if (isDecorationItem(item)) return ITEM_BEHAVIOR_BY_TYPE.decoration;
  return Object.freeze({
    canShareTileSpace: false,
    usesMarketPricing: false,
    isProduce: false,
    wateringMode: 'none'
  });
}

export function normalizeItemTypeAndTableKey(item, sourceLabel = 'items') {
  if (!item || typeof item !== 'object') return item;
  const type = typeof item.type === 'string' && item.type.trim()
    ? item.type.trim()
    : 'produce';
  const normalizedType = type.toLowerCase();
  const rawTableKey = typeof item.table_key === 'string' && item.table_key.trim()
    ? item.table_key.trim().toLowerCase()
    : '';
  let tableKey = rawTableKey;
  if (!VALID_ITEM_TABLE_KEYS.includes(tableKey)) {
    tableKey = normalizedType === 'produce'
      ? 'produce_market'
      : (normalizedType === 'decoration' ? 'decorations' : 'utility');
    if (rawTableKey) {
      console.warn(`[content] Invalid table_key "${rawTableKey}" for ${sourceLabel} item "${item.name || item.id}". Falling back to "${tableKey}".`);
    }
  }
  return {
    ...item,
    type,
    table_key: tableKey
  };
}
