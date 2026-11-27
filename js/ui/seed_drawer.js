import { isProduceItem } from '../content/item_types.js';
import { getTradingChallengeView } from '../state/trading_challenge.js';

const TOMATO_STARTER_GOAL = 'tomato-first-harvest';

function getFirstSaleSeedReward(state) {
  if (state.goalsClaimed?.[TOMATO_STARTER_GOAL]) return null;
  const goal = state.goals?.find(goal => goal?.id === TOMATO_STARTER_GOAL);
  const reward = goal?.reward?.freePurchases;
  if (!goal || goal.enabled === false || !Number.isInteger(reward?.count) || reward.count < 1) return null;
  return reward;
}

export function getSeedChallengeNote(active, price, freeCount) {
  return active && (freeCount > 0 || price <= 0) ? 'Doesn’t count for Market Timing' : '';
}

export function getSeedDrawerChoices({ state, isShopItemUnlocked, getFreePurchaseCount }) {
  const opening = state.player?.openingTrade;
  if (opening && !opening.lastSale && !opening.completed) return [];
  const names = new Map((state.items || []).filter(isProduceItem).map(item => [item.id, item]));
  const firstSaleReward = getFirstSaleSeedReward(state);
  const challengeActive = getTradingChallengeView(state).status === 'active';
  return (state.shop || []).flatMap(entry => {
    const item = names.get(entry.itemId);
    const price = Number(entry.price);
    if (!item || !isShopItemUnlocked(item.id) || !Number.isFinite(price) || price < 0) return [];
    const freeCount = getFreePurchaseCount(item.id);
    const firstSaleFreeCount = firstSaleReward?.itemId === item.id ? firstSaleReward.count : 0;
    const challengeNote = getSeedChallengeNote(challengeActive, price, freeCount);
    return [{ id: item.id, name: item.name, price, freeCount, firstSaleFreeCount, challengeNote, item }];
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
  const hint = drawer.querySelector('#seed-drawer-hint');
  if (hint) {
    hint.textContent = choices.some(choice => choice.challengeNote)
      ? 'Pay when you plant. Free seeds don’t count for Market Timing.'
      : 'Pick a seed. Pay when you plant.';
  }
  const blocked = state.runtimeFlags?.isSellBatchInFlight || state.runtimeFlags?.isRestInProgress;
  summary.setAttribute('aria-disabled', String(!!blocked));
  summary.onclick = blocked ? event => event.preventDefault() : null;
  if (drawer.hidden || blocked) drawer.open = false;
  const signature = JSON.stringify([selectedItemId, choices.map(({ id, price, freeCount, firstSaleFreeCount, challengeNote }) => [id, price, freeCount, firstSaleFreeCount, challengeNote])]);
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
      price.textContent = choice.freeCount > 0 ? `${choice.freeCount} free` : `$${choice.price.toFixed(2)}`;
      button.append(icon, name, price);
      if (choice.challengeNote) {
        const note = document.createElement('span');
        note.className = 'seed-drawer-reward';
        note.textContent = choice.challengeNote;
        button.append(note);
      }
      if (choice.firstSaleFreeCount) {
        const reward = document.createElement('span');
        reward.className = 'seed-drawer-reward';
        const count = choice.firstSaleFreeCount;
        reward.textContent = `First sale earns ${count} free seed${count === 1 ? '' : 's'}`;
        button.append(reward);
      }
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
