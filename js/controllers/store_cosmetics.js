export function purchaseCosmeticAction(deps) {
  const {
    state,
    itemId,
    saveState,
    addMessage,
    renderAll
  } = deps;

  const item = state.store.cosmetics.find((c) => c.id === itemId);
  if (!item || item.unlocked) return;
  if (state.player.cash < item.price) {
    addMessage({ id: 'warning.insufficient_cosmetic_funds' });
    return;
  }
  state.player.cash -= item.price;
  item.unlocked = true;
  saveState();
  addMessage({
    id: 'commerce.theme_purchased',
    vars: { itemName: item.name, price: item.price.toFixed(2) }
  });
  renderAll();
}

export function selectCosmeticAction(deps) {
  const {
    state,
    itemId,
    applyTheme,
    saveState,
    addMessage,
    renderAll
  } = deps;

  const item = state.store.cosmetics.find((c) => c.id === itemId);
  if (!item || !item.unlocked) return;
  if (item.id.startsWith('theme-')) {
    state.player.theme = item.id;
    applyTheme(item.id);
  }
  saveState();
  addMessage({
    id: 'commerce.theme_selected',
    vars: { itemName: item.name }
  });
  renderAll();
}

export function craftItemAction(deps) {
  const {
    state,
    recipeId,
    quantity,
    saveState,
    addMessage,
    renderAll
  } = deps;

  const recipe = state.store.crafting.find((r) => r.id === recipeId);
  if (!recipe) return;
  for (const input of recipe.input) {
    const invEntry = state.inventory.find((e) => e.itemId === input.id);
    if (!invEntry || invEntry.quantity < input.qty * quantity) {
      addMessage({ id: 'warning.not_enough_materials' });
      return;
    }
  }
  const outputShopEntry = state.shop.find((s) => s.itemId === recipe.output.id);
  const costPerOutput = outputShopEntry ? outputShopEntry.price * recipe.costMultiplier : 0;
  const totalCost = costPerOutput * recipe.output.qty * quantity;
  if (state.player.cash < totalCost) {
    addMessage({ id: 'warning.insufficient_craft_funds' });
    return;
  }
  for (const input of recipe.input) {
    const invEntry = state.inventory.find((e) => e.itemId === input.id);
    invEntry.quantity -= input.qty * quantity;
    if (invEntry.quantity === 0) {
      const idx = state.inventory.indexOf(invEntry);
      if (idx >= 0) state.inventory.splice(idx, 1);
    }
  }
  let outEntry = state.inventory.find((e) => e.itemId === recipe.output.id);
  if (!outEntry) {
    outEntry = { itemId: recipe.output.id, quantity: 0, avgCost: 0 };
    state.inventory.push(outEntry);
  }
  outEntry.quantity += recipe.output.qty * quantity;
  state.player.cash -= totalCost;
  saveState();
  const outputItem = state.items.find((it) => it.id === recipe.output.id);
  addMessage({
    id: 'commerce.crafted_item',
    vars: {
      quantity: recipe.output.qty * quantity,
      itemName: outputItem ? outputItem.name : 'item',
      totalCost: totalCost.toFixed(2)
    }
  });
  renderAll();
}
