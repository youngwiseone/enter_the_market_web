export function purchaseFixedPriceItemAction(deps) {
  const {
    state,
    itemId,
    registerDayAction,
    updateNetWorth,
    evaluateGoals,
    saveState,
    addMessage,
    renderAll,
    pulseHud,
    getHudCenters,
    spawnFloatingText
  } = deps;

  const item = Array.isArray(state.items) ? state.items.find((it) => it && it.id === itemId) : null;
  if (!item) return;
  const price = Math.max(0, Number(item.price) || 0);
  if (state.player.cash < price) {
    addMessage({ id: 'progress.insufficient_funds', meta: { speaker: 'merchant', priority: 'normal' } });
    return;
  }

  registerDayAction();
  state.player.cash -= price;
  let invEntry = Array.isArray(state.inventory) ? state.inventory.find((entry) => entry.itemId === itemId) : null;
  if (!invEntry) {
    invEntry = { itemId, quantity: 0, avgCost: 0 };
    if (!Array.isArray(state.inventory)) state.inventory = [];
    state.inventory.push(invEntry);
  }
  const existingCost = (Number(invEntry.avgCost) || 0) * (Number(invEntry.quantity) || 0);
  invEntry.quantity = Math.max(0, Number(invEntry.quantity) || 0) + 1;
  invEntry.avgCost = invEntry.quantity > 0 ? (existingCost + price) / invEntry.quantity : 0;

  updateNetWorth();
  evaluateGoals();
  saveState();
  addMessage({
    id: 'commerce.bought_item',
    vars: { quantity: 1, itemName: item.name || 'item', totalCost: price.toFixed(2) }
  });
  renderAll();
  if (typeof pulseHud === 'function') pulseHud(false);
  const hudCenters = typeof getHudCenters === 'function' ? getHudCenters() : [];
  if (hudCenters.length > 0 && typeof spawnFloatingText === 'function') {
    spawnFloatingText({
      x: hudCenters[0].x - 16,
      y: hudCenters[0].y - 12,
      text: `-$${price.toFixed(2)}`,
      color: '#ffd3d3'
    });
  }
}

export function purchaseDecorationAction(deps) {
  const {
    state,
    decorationId,
    updateNetWorth,
    evaluateGoals,
    saveState,
    addMessage,
    renderAll
  } = deps;

  const list = Array.isArray(state?.store?.decorations) ? state.store.decorations : [];
  const entry = list.find((decoration) => decoration && decoration.id === decorationId);
  if (!entry || entry.unlocked) return;
  const price = Math.max(0, Number(entry.price) || 0);
  if (state.player.cash < price) {
    addMessage({ id: 'progress.insufficient_funds', meta: { speaker: 'merchant', priority: 'normal' } });
    return;
  }
  state.player.cash -= price;
  entry.unlocked = true;
  updateNetWorth();
  evaluateGoals();
  saveState();
  addMessage({
    id: 'commerce.bought_item',
    vars: { quantity: 1, itemName: entry.name || 'decoration', totalCost: price.toFixed(2) }
  });
  renderAll();
}

