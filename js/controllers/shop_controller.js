import {
  consumeSeedBuyStreakMessageId,
  shouldSuppressSeedStandardBuyMessage
} from './seed_buy_streak_controller.js';

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
    addMessage({ id: 'progress.item_not_available' });
    return;
  }
  const shopEntry = state.shop.find((entry) => entry.itemId === itemId);
  const item = state.items.find((it) => it.id === itemId);
  if (!shopEntry || !item) return;
  const freeQty = Math.min(getFreePurchaseCount(itemId), quantity);
  const paidQty = quantity - freeQty;
  const totalCost = shopEntry.price * paidQty;
  if (state.player.cash < totalCost) {
    addMessage({ id: 'progress.insufficient_funds', meta: { speaker: 'merchant', priority: 'normal' } });
    return;
  }
  if (freeQty > 0) {
    consumeFreePurchases(itemId, freeQty);
  }
  registerDayAction();
  state.player.cash -= totalCost;
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
  const streakMessageId = consumeSeedBuyStreakMessageId(state.player.day, itemId, quantity, item);
  const suppressStandardBuyMessage = shouldSuppressSeedStandardBuyMessage(itemId, item);

  if (!suppressStandardBuyMessage) {
    if (freeQty > 0) {
      addMessage({
        id: 'commerce.bought_item_free',
        vars: { quantity, itemName: item.name, totalCost: totalCost.toFixed(2), freeQty }
      });
    } else {
      addMessage({
        id: 'commerce.bought_item',
        vars: { quantity, itemName: item.name, totalCost: totalCost.toFixed(2) }
      });
    }
  }

  if (streakMessageId === 'commerce.buy_streak_seed') {
    addMessage({
      id: 'commerce.buy_streak_seed',
      vars: { itemName: item.name }
    });
  } else if (streakMessageId === 'commerce.buy_streak_seed_mixed') {
    addMessage({ id: 'commerce.buy_streak_seed_mixed' });
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
    addMessage({ id: 'warning.not_enough_to_sell' });
    return;
  }
  const saleValue = shopEntry.price * quantity;
  registerDayAction();
  const item = state.items.find((it) => it.id === itemId);
  registerSaleEvent(item ? item.name : 'Item', saleValue, quantity);
  registerItemSalePressure(itemId, quantity);
  state.player.cash += saleValue;
  invEntry.quantity -= quantity;
  if (invEntry.quantity === 0) {
    const index = state.inventory.indexOf(invEntry);
    state.inventory.splice(index, 1);
  }
  updateNetWorth();
  evaluateGoals();
  saveState();
  addMessage({
    id: 'commerce.sold_item',
    vars: { quantity, itemName: item ? item.name : 'item', saleValue: saleValue.toFixed(2) }
  });
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
