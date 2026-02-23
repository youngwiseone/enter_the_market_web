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
