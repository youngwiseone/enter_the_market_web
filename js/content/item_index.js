export function buildItemsByIdMap(items) {
  const map = new Map();
  if (!Array.isArray(items)) return map;
  items.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    if (typeof item.id !== 'number' && typeof item.id !== 'string') return;
    map.set(String(item.id), item);
  });
  return map;
}
