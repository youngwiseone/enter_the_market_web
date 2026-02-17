export function produceForLevelAction(state, level) {
  const itemsByLevel = {};
  state.items.forEach((it) => {
    if (!it.level) return;
    if (!itemsByLevel[it.level]) itemsByLevel[it.level] = [];
    itemsByLevel[it.level].push(it);
  });
  const results = [];
  const options = [];
  if (level === 1) {
    options.push({ level: 1, minQty: 1, maxQty: 1 });
  } else if (level === 2) {
    options.push({ level: 1, minQty: 1, maxQty: 5 });
    options.push({ level: 2, minQty: 1, maxQty: 1 });
  } else if (level === 3) {
    options.push({ level: 1, minQty: 10, maxQty: 25 });
    options.push({ level: 2, minQty: 1, maxQty: 5 });
    options.push({ level: 3, minQty: 1, maxQty: 1 });
  } else if (level === 4) {
    options.push({ level: 1, minQty: 50, maxQty: 125 });
    options.push({ level: 2, minQty: 10, maxQty: 25 });
    options.push({ level: 3, minQty: 1, maxQty: 5 });
    options.push({ level: 4, minQty: 1, maxQty: 1 });
  } else if (level >= 5) {
    options.push({ level: 1, minQty: 500, maxQty: 625 });
    options.push({ level: 2, minQty: 50, maxQty: 125 });
    options.push({ level: 3, minQty: 10, maxQty: 25 });
    options.push({ level: 4, minQty: 1, maxQty: 5 });
    options.push({ level: 5, minQty: 1, maxQty: 1 });
  }
  const validOptions = options.filter((opt) => Array.isArray(itemsByLevel[opt.level]) && itemsByLevel[opt.level].length > 0);
  if (validOptions.length === 0) {
    return results;
  }
  const opt = validOptions[Math.floor(Math.random() * validOptions.length)];
  const qty = opt.minQty + Math.floor(Math.random() * (opt.maxQty - opt.minQty + 1));
  const choices = itemsByLevel[opt.level];
  const chosen = choices[Math.floor(Math.random() * choices.length)];
  if (chosen) {
    results.push({ itemId: chosen.id, quantity: qty });
  }
  return results;
}

export function addResourceToInventoryAction(deps) {
  const { state, itemId, quantity, addMessage } = deps;
  let remaining = quantity;
  const availableSpace = state.player.capacity - state.player.capacityUsed;
  const itemName = state.items.find((it) => it.id === itemId)?.name || 'items';
  if (availableSpace <= 0) {
    addMessage({
      id: 'warning.storage_full',
      vars: { quantity, itemName }
    });
    return;
  }
  const canAdd = Math.min(remaining, availableSpace);
  if (canAdd < quantity) {
    addMessage({
      id: 'warning.storage_limited',
      vars: { canAdd, itemName, dropped: quantity - canAdd }
    });
  }
  remaining = canAdd;
  let entry = state.inventory.find((e) => e.itemId === itemId);
  if (!entry) {
    entry = { itemId, quantity: 0, avgCost: 0 };
    state.inventory.push(entry);
  }
  const existingCost = entry.avgCost * entry.quantity;
  entry.quantity += remaining;
  entry.avgCost = entry.quantity > 0 ? (existingCost) / entry.quantity : 0;
  state.player.capacityUsed += remaining;
  addMessage({
    id: 'progress.extractor_produced',
    vars: { quantity: remaining, itemName }
  });
}

export function generateNewsEventsAction(deps) {
  const { generateNewsEventsForState, state, defaultNewsEvents, isShopItemUnlocked, saveToStorage } = deps;
  generateNewsEventsForState({
    state,
    defaultNewsEvents,
    isShopItemUnlocked,
    saveToStorage
  });
}
