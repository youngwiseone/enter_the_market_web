export function buyItemAction(deps) {
  const {
    state,
    itemId,
    quantity,
    isShopItemUnlocked,
    addMessage,
    getFreePurchaseCount,
    consumeFreePurchases,
    registerDayAction,
    updateNetWorth,
    evaluateGoals,
    saveState,
    renderAll,
    pulseHud,
    getHudCenters,
    spawnFloatingText
  } = deps;

  if (!isShopItemUnlocked(itemId)) {
    addMessage('This item is not available yet.');
    return;
  }
  const shopEntry = state.shop.find((entry) => entry.itemId === itemId);
  const item = state.items.find((it) => it.id === itemId);
  if (!shopEntry || !item) return;
  if (shopEntry.quantity < quantity) {
    alert('Not enough stock available.');
    return;
  }
  const freeQty = Math.min(getFreePurchaseCount(itemId), quantity);
  const paidQty = quantity - freeQty;
  const totalCost = shopEntry.price * paidQty;
  if (state.player.cash < totalCost) {
    alert('Insufficient funds.');
    return;
  }
  if (freeQty > 0) {
    consumeFreePurchases(itemId, freeQty);
  }
  registerDayAction();
  state.player.cash -= totalCost;
  shopEntry.quantity -= quantity;
  let invEntry = state.inventory.find((entry) => entry.itemId === itemId);
  if (!invEntry) {
    invEntry = { itemId, quantity: 0, avgCost: 0 };
    state.inventory.push(invEntry);
  }
  const existingCost = invEntry.avgCost * invEntry.quantity;
  invEntry.quantity += quantity;
  invEntry.avgCost = (existingCost + totalCost) / invEntry.quantity;
  updateNetWorth();
  evaluateGoals();
  saveState();
  if (freeQty > 0) {
    addMessage(`Bought ${quantity} x ${item.name} for $${totalCost.toFixed(2)} (${freeQty} free).`, { speaker: 'merchant' });
  } else {
    addMessage(`Bought ${quantity} x ${item.name} for $${totalCost.toFixed(2)}.`, { speaker: 'merchant' });
  }
  renderAll();
  pulseHud(false);
  const hudCenters = getHudCenters();
  if (hudCenters.length > 0) {
    spawnFloatingText({
      x: hudCenters[0].x - 16,
      y: hudCenters[0].y - 12,
      text: `-$${totalCost.toFixed(2)}`,
      color: '#ffd3d3'
    });
  }
}

export function sellItemAction(deps) {
  const {
    state,
    itemId,
    quantity,
    registerDayAction,
    registerSaleEvent,
    registerItemSalePressure,
    updateNetWorth,
    evaluateGoals,
    saveState,
    addMessage,
    renderAll,
    pulseHud,
    getHudCenters,
    spawnFloatingText
  } = deps;

  const invEntry = state.inventory.find((entry) => entry.itemId === itemId);
  const shopEntry = state.shop.find((entry) => entry.itemId === itemId);
  if (!invEntry || !shopEntry) return;
  if (invEntry.quantity < quantity) {
    alert('You do not have enough to sell.');
    return;
  }
  const saleValue = shopEntry.price * quantity;
  registerDayAction();
  const item = state.items.find((it) => it.id === itemId);
  registerSaleEvent(item ? item.name : 'Item', saleValue, quantity);
  registerItemSalePressure(itemId, quantity);
  state.player.cash += saleValue;
  shopEntry.quantity += quantity;
  invEntry.quantity -= quantity;
  if (invEntry.quantity === 0) {
    const index = state.inventory.indexOf(invEntry);
    state.inventory.splice(index, 1);
  }
  updateNetWorth();
  evaluateGoals();
  saveState();
  addMessage(`Sold ${quantity} x ${item ? item.name : 'item'} for $${saleValue.toFixed(2)}`, { speaker: 'player', emotion: 'money' });
  renderAll();
  pulseHud(true);
  const hudCenters = getHudCenters();
  if (hudCenters.length > 0) {
    spawnFloatingText({
      x: hudCenters[0].x - 14,
      y: hudCenters[0].y - 12,
      text: `+$${saleValue.toFixed(2)}`,
      color: '#b8ffd0'
    });
  }
}
