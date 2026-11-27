import { RECIPES } from '../content/cooking_chapter.js';
import { normalizeChapter, getChapterOffers, acceptRequest, declineRequest, claimPot, getDeliveryPreview, settleDelivery } from '../state/cooking_chapter.js';
import { resolveResourcePath } from '../content/resource_paths.js';
import { compareCookingSale } from '../controllers/cooking_controller.js?v=90';

const make = (tag, className, text) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
};
function button(text, click, disabled = false) {
  const el = make('button', 'button chapter-button', text);
  el.type = 'button'; el.disabled = disabled; el.onclick = click;
  return el;
}
export function createCookingChapterUi(deps) {
  const { state, cooking, getSelection, getCellSnapshot, commit, renderAll, feedback, showGoals, refreshPortrait } = deps;
  const name = id => state.items.find(i => i.id === id)?.name || `Item ${id}`;
  let lastFeedback = '';
  function transact(fn) {
    if (state.runtimeFlags?.isSellBatchInFlight || state.runtimeFlags?.isRestInProgress) return;
    try {
      commit(fn);
      // A second touch must not fall through a disappearing Give dock onto Rest.
      state.runtimeFlags ||= {};
      state.runtimeFlags.chapterInputCooldownUntil = Date.now() + 400;
    } catch { feedback('Could not save the request. Please try again.'); }
    cooking.cancel(); renderAll();
  }
  function requestText(request) {
    return request.requirements.map(r => `${name(r.itemId)}${r.commonOnly ? ' (common)' : ''} ${request.delivered?.[r.itemId] || 0}/${r.quantity}`).join(' · ');
  }
  function renderRequests() {
    const host = document.getElementById('chapter-requests');
    if (!host) return;
    host.replaceChildren();
    const c = normalizeChapter(state);
    host.append(make('h3', '', 'Friends of the farm'));
    if (c.lastOutcome) host.append(make('p', 'chapter-outcome', c.lastOutcome));
    const offers = c.active ? [c.active] : getChapterOffers(state);
    if (!offers.length) {
      const text = c.stage === 0 ? 'Mina’s first visit arrives at level 4.'
        : c.stage === 2 ? 'Mina is preparing for her restaurant trial. Reach $25,000 cash and discover at least eight crops; your earlier help is remembered.'
        : c.stage === 3 ? 'Mina will return tomorrow with a personal gift.'
        : c.potUnlocked && !c.cookedCount ? 'Try Garden Soup with the pot: one mature carrot and one mature potato. Your first meal will bring new visitors.'
        : 'Visitors will return on another in-game day. You can keep farming.';
      host.append(make('p', '', text));
    }
    offers.forEach(offer => {
      const card = make('section', 'chapter-card');
      card.dataset.requestId = offer.id;
      const img = make('img', 'chapter-portrait'); img.src = resolveResourcePath(offer.portrait); img.alt = offer.speaker; img.width = 72; img.height = 72;
      const copy = make('div', 'chapter-card-copy');
      copy.append(make('strong', '', `${offer.speaker} · ${offer.name || offer.title}`));
      const dialogue = make('details', 'request-dialogue');
      dialogue.append(make('summary', '', 'Read dialogue'), make('p', '', offer.dialogue));
      copy.append(dialogue);
      if (offer.kind === 'gift') {
        copy.append(button('Receive Mina’s pot & recipes', () => transact(() => { const result = claimPot(state); if (result.ok) feedback('Mina’s pot is yours. Select Cook to open the prep board and make Garden Soup.', 'mina', 'excited'); })));
      } else {
        copy.append(make('p', 'chapter-requirements', requestText(offer)));
        copy.append(make('p', '', `${offer.reward ? `$${offer.reward.toFixed(2)} paid once, on full delivery.` : 'A gift to help Mina; no cash payment.'} ${c.active ? `Give by day ${offer.deadlineDay}.` : `${offer.deadlineDays} in-game days after accepting.`} Partial deliveries are welcome.`));
        if (c.active) copy.append(button('Decline remaining request', () => transact(() => { const result = declineRequest(state); feedback(result.message); })));
        else copy.append(button('Accept request', () => transact(() => { const result = acceptRequest(state, offer.id); if (result.ok) feedback(offer.dialogue, offer.person === 'nell' ? 'bea' : offer.person === 'otis' ? 'rowan' : 'mina'); })));
      }
      card.append(img, copy); host.append(card);
    });
  }
  function selectionPreview() {
    const indices = getSelection();
    const cells = indices.map(getCellSnapshot).filter(Boolean);
    const preview = getDeliveryPreview(state, cells);
    preview.eligibleCount = cells.filter(cell => preview.request?.requirements.some(r => r.itemId === cell.itemId && (!r.commonOnly || cell.rarity === 'common'))).length;
    if (indices.length !== cells.length) { preview.ok = false; preview.reason = 'Remove growing or unsuitable items from the selection.'; }
    return { cells, preview, indices };
  }
  function give(cells, requestId, indices) {
    const active = state.player.cookingChapter?.active;
    if (`${active?.id}:${active?.acceptedDay}` !== requestId || getSelection().join(',') !== indices.join(',')) {
      feedback('The request or selection changed. Select again before giving.'); renderAll(); return;
    }
    const person = state.player.cookingChapter.active.person;
    transact(() => {
      const outcome = settleDelivery(state, cells);
      lastFeedback = outcome.message || outcome.reason;
      if (outcome.ok) deps.clearSelection();
      feedback(lastFeedback, outcome.complete ? (person === 'nell' ? 'bea' : person === 'otis' ? 'rowan' : 'mina') : 'player', outcome.complete ? 'excited' : 'neutral');
    });
  }
  function decorateDelivery() {
    document.querySelectorAll('.chapter-delivery, .give-action-button').forEach(el => el.remove());
    document.querySelectorAll('.chapter-split').forEach(el => el.classList.remove('chapter-split'));
    const c = normalizeChapter(state);
    if (!c.active) return;
    const targetId = `${c.active.id}:${c.active.acceptedDay}`;
    const { cells, preview, indices } = selectionPreview();
    const text = `${c.active.speaker}: ${requestText(c.active)}. Selected eligible: ${preview.eligibleCount}/${indices.length}. ${preview.reason}`;
    const panels = Array.from(document.querySelectorAll('#market-insight-panel, [data-insight-panel]'));
    panels.forEach(panel => {
      const note = make('p', 'chapter-delivery', text); panel.append(note);
      let sell = panel.querySelector('[data-sell-action-button]');
      // Even an empty/immature selection shows the disabled Give control.
      if (!sell) {
        sell = button('Sell', null, true);
        const row = make('div', 'chapter-delivery'); row.append(sell); panel.append(row);
      }
      const row = sell.parentElement;
      row.classList.add('chapter-split');
      const giveButton = button(`Give${preview.ok ? ` (${cells.length})` : ''}`, () => give(cells, targetId, indices), !preview.ok || !!state.runtimeFlags?.isSellBatchInFlight);
      giveButton.classList.add('give-action-button'); giveButton.title = preview.reason; row.append(giveButton);
    });
    const dock = document.getElementById('farm-action-dock');
    const sell = document.getElementById('farm-action-button');
    if (dock && sell && document.body.classList.contains('mobile-layout')) {
      dock.classList.add('is-visible', 'chapter-split');
      if (!indices.length) { sell.textContent = 'Sell · select items'; sell.disabled = true; }
      const giveButton = button(`Give${preview.ok ? ` (${cells.length})` : ' · select request items'}`, () => give(cells, targetId, indices), !preview.ok || !!state.runtimeFlags?.isSellBatchInFlight);
      giveButton.classList.add('give-action-button'); giveButton.title = preview.reason; dock.append(giveButton);
    }
  }
  function renderCooking() {
    const host = document.getElementById('cooking-context');
    if (!host) return;
    const previousControl = host.contains(document.activeElement) ? document.activeElement.id : '';
    const kitchenHome = document.getElementById(document.body.classList.contains('mobile-layout') ? 'farm-kitchen-host' : 'desktop-kitchen-host');
    if (kitchenHome && host.parentElement !== kitchenHome) kitchenHome.append(host);
    host.hidden = state.activeTool !== 'pot';
    const outfit = () => button(state.player.cookingOutfit ? 'Remove apron' : 'Wear apron', () => transact(() => { state.player.cookingOutfit = !state.player.cookingOutfit; refreshPortrait(); }));
    const appearance = document.getElementById('appearance-options');
    if (appearance && normalizeChapter(state).potUnlocked) appearance.replaceChildren(outfit());
    if (host.hidden) { host.replaceChildren(); return; }

    const pending = cooking.getPending(), { recipe, cells } = pending;
    const ready = cells.length === recipe.ingredients.length;
    const hasEnergy = Number(state.player.energy) >= 1;
    const busy = !!(state.runtimeFlags?.isSellBatchInFlight || state.runtimeFlags?.isRestInProgress);
    const image = (path, className) => {
      const img = make('img', className);
      img.src = resolveResourcePath(path); img.alt = '';
      return img;
    };
    const header = make('div', 'kitchen-top');
    header.append(image('cooking/pot.png', 'kitchen-pot'));
    const title = make('div', 'kitchen-title');
    title.append(make('strong', '', 'Mina’s kitchen'), make('span', '', 'Prep board'));
    header.append(title);
    const select = make('select'); select.setAttribute('aria-label', 'Choose recipe'); select.id = 'cooking-recipe';
    RECIPES.forEach(r => {
      const option = make('option', '', r.name); option.value = r.id; option.selected = r.id === recipe.id; select.append(option);
    });
    select.onchange = () => { cooking.chooseRecipe(select.value); lastFeedback = ''; renderAll(); };
    header.append(select);

    const remaining = cells.slice();
    const slots = make('ol', 'kitchen-ingredients');
    slots.setAttribute('aria-label', 'Recipe ingredients');
    for (const itemId of recipe.ingredients) {
      const pos = remaining.findIndex(cell => cell.itemId === itemId);
      const filled = pos >= 0;
      if (filled) remaining.splice(pos, 1);
      const item = state.items.find(i => i.id === itemId);
      const slot = make('li', `kitchen-slot${filled ? ' is-filled' : ''}`);
      const asset = item?.harvestImage || item?.image;
      if (asset) slot.append(image(asset, 'kitchen-crop'));
      slot.append(make('span', '', name(itemId)), make('span', 'kitchen-slot-state', filled ? 'Ready' : 'Needed'));
      slots.append(slot);
    }

    const quote = make('div', 'kitchen-quote');
    const status = make('p', 'kitchen-status');
    status.setAttribute('role', 'status');
    if (ready) {
      const comparison = compareCookingSale(cells);
      for (const [label, value] of [['Sell crops', comparison.raw], ['Meal at market', comparison.meal]]) {
        const figure = make('span', 'kitchen-value');
        figure.append(make('span', '', label), make('strong', '', `$${value.toFixed(2)}`));
        quote.append(figure);
      }
      const diff = comparison.difference;
      status.textContent = !hasEnergy ? 'Needs 1 energy. Nothing spent.' : diff === 0 ? 'Same sale value today.' :
        `Meal: $${Math.abs(diff).toFixed(2)} ${diff > 0 ? 'more' : 'less'} today.`;
    } else {
      status.textContent = lastFeedback || 'Pick ripe crops. Nothing spent until you cook.';
    }

    const actions = make('div', 'kitchen-actions');
    const clear = button('Clear', () => { cooking.cancel(); lastFeedback = ''; renderAll(); }, !cells.length);
    clear.id = 'kitchen-clear';
    const cook = button(ready ? 'Cook · 1 energy' : `Cook · ${cells.length}/${recipe.ingredients.length}`, () => {
      const result = cooking.finish();
      if (!result.ok) renderAll();
    }, !ready || !hasEnergy || busy);
    cook.id = 'kitchen-cook';
    actions.append(clear, cook);
    const bottom = make('div', 'kitchen-bottom');
    bottom.append(ready ? quote : status, actions);
    host.replaceChildren(header, slots, bottom, ...(ready ? [status] : []));
    if (previousControl) {
      const restore = document.getElementById(previousControl);
      (restore?.disabled ? select : restore)?.focus({ preventScroll: true });
    }
  }
  function highlight() {
    const c = normalizeChapter(state), pending = cooking.getPending();
    document.querySelectorAll('#grid .grid-cell').forEach(tile => {
      const index = Number(tile.dataset.index), id = state.gridItems[index];
      const eligible = c.active?.requirements.some(r => r.itemId === id && Number(c.active.delivered[r.itemId] || 0) < r.quantity
        && (!r.commonOnly || state.gridRarity[index] === 'common'));
      const item = state.items.find(i => i.id === id);
      const mature = item?.type === 'dish' || (item?.type === 'produce' && deps.getGrowth(item, index).isGrown);
      const remaining = pending.recipe.ingredients.slice();
      pending.cells.forEach(cell => remaining.splice(remaining.indexOf(cell.itemId), 1));
      const cookEligible = state.activeTool === 'pot' && remaining.includes(id) && mature && !pending.cells.some(cell => cell.cellIndex === index);
      tile.classList.toggle('request-eligible', mature && (state.activeTool === 'pot' ? cookEligible : !!eligible));
      if (cookEligible) tile.title = `Add ${name(id)} to ${pending.recipe.name}`;
      tile.classList.toggle('cooking-selected', pending.cells.some(cell => cell.cellIndex === index));
    });
  }
  function render() {
    document.body.classList.toggle('is-cooking', state.activeTool === 'pot');
    renderRequests(); renderCooking(); decorateDelivery(); highlight();
    const c = normalizeChapter(state);
    const pot = document.querySelector('[data-tool="pot"]');
    if (pot) {
      pot.hidden = !c.potUnlocked; pot.disabled = !c.potUnlocked;
      pot.classList.toggle('active', state.activeTool === 'pot');
      const image = pot.querySelector('img');
      image.src = resolveResourcePath(`cooking/pot${!c.potUnlocked ? '_disabled' : state.activeTool === 'pot' ? '_selected' : ''}.png`);
    }
    const hint = document.getElementById('chapter-farm-hint');
    if (hint) {
      const offers = getChapterOffers(state);
      hint.hidden = state.activeTool === 'pot' || !(c.active || offers.length || c.potUnlocked);
      hint.textContent = c.active ? `${c.active.speaker} · ${requestText(c.active)} · Goals` : offers.length ? `${offers[0].speaker} is visiting · Goals` : 'Recipes & requests · Goals';
      hint.onclick = showGoals;
    }
  }
  function note(text) { lastFeedback = text; }
  return { render, note };
}
