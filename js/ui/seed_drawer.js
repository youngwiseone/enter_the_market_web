import { isProduceItem } from '../content/item_types.js';

export function getSeedDrawerChoices({ state, isShopItemUnlocked, getFreePurchaseCount }) {
  const opening = state.player?.openingTrade;
  if (opening && !opening.lastSale && !opening.completed) return [];
  const names = new Map((state.items || []).filter(isProduceItem).map(item => [item.id, item]));
  return (state.shop || []).flatMap(entry => {
    const item = names.get(entry.itemId);
    const price = Number(entry.price);
    if (!item || !isShopItemUnlocked(item.id) || !Number.isFinite(price) || price < 0) return [];
    const free = getFreePurchaseCount(item.id) > 0;
    return [{ id: item.id, name: item.name, price, free, item }];
  }).sort((a,b) => a.name.localeCompare(b.name));
}

export function renderSeedDrawer(deps) {
  const drawer = document.getElementById('seed-drawer');
  if (!drawer) return;
  const { state, selectShopItem, getShopSeedVisualPath, selectedItemId, isPlantingSeed } = deps;
  const choices = getSeedDrawerChoices(deps);
  drawer.hidden = !choices.length;
  const summary = drawer.querySelector('summary');
  const options = drawer.querySelector('#seed-drawer-list');
  const blocked = state.runtimeFlags?.isSellBatchInFlight || state.runtimeFlags?.isRestInProgress;
  summary.setAttribute('aria-disabled', String(!!blocked));
  summary.onclick = blocked ? event => event.preventDefault() : null;
  if (drawer.hidden || blocked) drawer.open = false;
  const signature = JSON.stringify([selectedItemId, choices.map(({ id, price, free }) => [id,price,free])]);
  if (options.dataset.choices !== signature) {
    options.dataset.choices = signature;
    options.replaceChildren();
    for (const choice of choices) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'seed-drawer-option';
      button.setAttribute('aria-pressed', String(selectedItemId === choice.id));
      const icon = document.createElement('img');
      icon.alt = ''; icon.width = 25; icon.height = 25;
      icon.src = getShopSeedVisualPath(choice.item);
      const name = document.createElement('span');
      name.textContent = choice.name;
      const price = document.createElement('strong');
      price.textContent = choice.free ? 'Free' : `$${choice.price.toFixed(2)}`;
      button.append(icon, name, price);
      button.addEventListener('click', () => {
        if (drawer.hidden || state.runtimeFlags?.isSellBatchInFlight || state.runtimeFlags?.isRestInProgress) return;
        drawer.open = false;
        if (selectedItemId !== choice.id) selectShopItem(choice.id);
        summary.focus({ preventScroll: true });
      });
      options.append(button);
    }
  }
  drawer.classList.toggle('has-seed-in-hand', isPlantingSeed);
  if (drawer.dataset.bound) return;
  drawer.dataset.bound = 'true';
  document.addEventListener('click', event => {
    if (drawer.open && !drawer.contains(event.target)) drawer.open = false;
  }, { capture: true });
  drawer.addEventListener('keydown', event => {
    if (event.key === 'Escape' && drawer.open) {
      event.preventDefault();
      event.stopPropagation();
      drawer.open = false;
      summary.focus();
    }
  });
}
