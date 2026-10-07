import assert from 'node:assert/strict';
import { getStableGridSize } from '../../ui/layout_controller.js';
import { getBestReadySellSignal, getGuidancePayloadAction } from '../../controllers/guided_controller.js';
import { getGestureHintContext } from '../../ui/farm_gesture_hints.js';
import { getNextMeaningfulUnlock } from '../../ui/render_goals.js';
import { getQuickRollPreference, setQuickRollPreference, shouldShowCompactRoll, showDailyMarketRollModalAction } from '../../ui/daily_roll_modal.js';
import { attachCoreEventHandlers } from '../../ui/bindings/core_bindings.js';
import { renderSelectedItemInsightAction } from '../../ui/render_market_insight.js';

const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
assert.equal(getQuickRollPreference(), false);
setQuickRollPreference(true);
assert.equal(getQuickRollPreference(), true);
setQuickRollPreference(false);
assert.equal(shouldShowCompactRoll(0, false, false), true);
assert.equal(shouldShowCompactRoll(15, true, false), true);
assert.equal(shouldShowCompactRoll(15, false, true), true);
assert.equal(shouldShowCompactRoll(15, false, false), false);

for (const [panelWidth, availableHeight] of [[470, 318], [585, 318], [600, 192], [320, 270], [560, 510]]) {
  const context = { panelWidth, availableHeight };
  const initial = getStableGridSize(context);
  assert.ok(initial <= panelWidth && initial <= availableHeight);
  assert.equal(getStableGridSize({ ...context, receiptHeight: 180, selectionHeight: 100, guidanceHeight: 220 }), initial);
}
assert.equal(getStableGridSize({ panelWidth: 560, availableHeight: 510 }), 510);

const state = { activeFarmId: 2, player: { energy: 8 }, goalFlags: { selected: true, planted: true, harvest: true, rest: true, profit: true }, gridItems: [2, 6], items: [{ id: 2, name: 'Tomato' }, { id: 6, name: 'Onion' }], shop: [{ itemId: 2, price: 5, priceSum: 3, daysCount: 1 }, { itemId: 6, price: 2.2, priceSum: 2, daysCount: 1 }] };
const snapshots = index => index === 1 ? { isProduce: true, sellNow: 4.4 } : null;
const ready = getBestReadySellSignal(state, snapshots);
assert.equal(ready.itemName, 'Onion');
assert.equal(ready.farmId, 2);
assert.equal(ready.cellIndex, 1);
const guidance = getGuidancePayloadAction({ state, GUIDED_FLAGS: { selected: 'selected', planted: 'planted', harvest: 'harvest', firstRest: 'rest', firstProfit: 'profit' }, getPrimaryGuidedState: () => ({ plantedTiles: 2, harvested: 4 }), countReadyToHarvestTiles: () => 1, getBestBuyOpportunity: () => null, getGridCellSellSnapshot: snapshots });
assert.match(guidance.hint, /ready Onion on Farm 2/);
assert.doesNotMatch(guidance.hint, /Tomato/);
assert.equal(getBestReadySellSignal(state, () => null), null);

assert.equal(getGestureHintContext({ tool: 'pickaxe', hasLockedTiles: true }).id, 'mine');
assert.equal(getGestureHintContext({ tool: 'watering', hasGrowingCrops: true }).id, 'water');
assert.equal(getGestureHintContext({ tool: 'glove', shopItemId: 4, shopItemType: 'produce' }).id, 'plant');
assert.equal(getGestureHintContext({ tool: 'glove', selectedMature: true }).id, 'move');
assert.equal(getGestureHintContext({ tool: 'glove', shopItemId: 50, shopItemType: 'fertiliser' }), null);
assert.match(getNextMeaningfulUnlock({ player: { playerLevel: 15 } }).title, /irrigation/);
assert.match(getNextMeaningfulUnlock({ player: { playerLevel: 20 }, activeFarmId: 2, gridUnlocked: Array(49).fill(true), farms: { 1: { gridUnlocked: [true, false, true] } } }).requirement, /2\/49/);
assert.equal(getNextMeaningfulUnlock({ player: { playerLevel: 20 }, secondFarmPurchased: true }), null);

// A zero-strength day still opens the settled recap and can continue in the
// same turn, with no slot animation timers. No simulation dependency is invoked.
function node() {
  const children = [];
  return { children, classList: { add() {}, remove() {}, toggle() {} }, appendChild: child => children.push(child), append: (...items) => children.push(...items), setAttribute() {}, querySelector: () => null, querySelectorAll: () => [], style: {}, dataset: {}, addEventListener() {}, parentElement: { insertBefore() {} }, innerHTML: '', textContent: '' };
}
const ids = ['daily-roll-modal', 'daily-roll-results', 'daily-roll-fatigue', 'daily-roll-fatigue-note', 'daily-roll-day-summary-subtitle', 'daily-roll-day-summary-sold', 'daily-roll-day-summary-sales', 'daily-roll-continue', 'daily-roll-reel', 'daily-roll-track'];
const nodes = new Map(ids.map(id => [id, node()]));
globalThis.document = { getElementById: id => nodes.get(id), createElement: node, createTextNode: text => ({ text }) };
globalThis.window = { setTimeout() { throw new Error('Quiet rolls must not wait for animation'); } };
let canContinue = false;
let opened = false;
await showDailyMarketRollModalAction({ rollResult: { picks: [{ itemId: 6, itemName: 'Onion', impactPct: 0 }], byItem: new Map() }, fatiguePercent: 0, getUnlockedRollItems: () => [{ id: 6, name: 'Onion' }], getHarvestImagePath: () => 'onion.png', getCurrentDailyRollAnimationToken: () => 1, incrementDailyRollAnimationToken: () => 1, setDailyRollCanContinue: value => { canContinue = value; }, isDailyRollOpen: () => opened, setDailyRollOpen: value => { opened = value; }, isReduceMotion: () => false });
assert.equal(opened, true);
assert.equal(canContinue, true);
assert.match(nodes.get('daily-roll-fatigue-note').textContent, /Prices, weather and crop growth still update/);
assert.equal(nodes.get('daily-roll-results').children.length, 0);
console.log('UI flow checks passed: stable farm geometry, ready-holdings advice, farm context, next unlocks, contextual controls, remembered quick preference and immediate quiet-day recap.');

// Exercise actual modal event bindings: a preference must not count as a
// backdrop skip/continue, and Space must retain native checkbox behavior.
const handlers = new Map();
const keyHandlers = [];
for (const id of ['reset-game', 'next-day']) nodes.set(id, node());
nodes.get('daily-roll-modal').addEventListener = (type, handler) => handlers.set(type, handler);
document.querySelectorAll = () => [];
document.querySelector = () => null;
document.addEventListener = (type, handler) => { if (type === 'keydown') keyHandlers.push(handler); };
globalThis.Element = class {
  constructor(preference = false) { this.preference = preference; }
  closest(selector) { return this.preference && (selector.includes('daily-roll-quick-option') || selector.includes('input')) ? this : null; }
  getAttribute() { return null; }
};
window.matchMedia = () => ({ matches: true });
let continued = 0;
let skipped = 0;
const noop = () => {};
attachCoreEventHandlers({ state: {}, isDailyRollOpen: () => true, canContinueDailyRoll: () => true, continueDailyRollModal: () => { continued += 1; }, requestDailyRollSkip: () => { skipped += 1; }, installFarmPointerHandlers: noop, getSelectedGridCellIndex: () => null, getSelectedGridCellIndices: () => new Set(), isGoalCelebrationOpen: () => false });
const event = { target: new Element(true), key: ' ', preventDefault() { this.prevented = true; }, stopPropagation: noop };
handlers.get('click')(event);
keyHandlers.forEach(handler => handler(event));
assert.equal(continued, 0);
assert.equal(skipped, 0);
assert.equal(event.prevented, undefined);
handlers.get('click')({ ...event, target: new Element() });
assert.equal(continued, 1);

// Planting uses the contextual row for Cancel, preserving the separate Rest.
for (const id of ['farm-panel', 'farm-action-dock', 'farm-action-button']) nodes.set(id, node());
nodes.get('farm-action-dock').classList.contains = () => false;
document.body = { classList: { contains: name => name === 'mobile-layout', toggle: noop } };
window.getComputedStyle = () => ({ display: 'flex' });
let cancelled = 0;
renderSelectedItemInsightAction({ getBulkSelectedGridInsightData: () => null, getSelectedGridItemInsightData: () => null, getSelectedShopItemInsightData: () => ({ itemName: 'Carrot', isProduce: true }), clearShopSelection: () => { cancelled += 1; } });
assert.match(nodes.get('farm-action-button').textContent, /Cancel planting/);
nodes.get('farm-action-button').onclick();
assert.equal(cancelled, 1);
console.log('Modal preference click/keyboard binding and separate planting cancel action checks passed.');

// Individual historical-cost disclosures must render with no bulk selection;
// ready and retained-water states retain their distinct contextual actions.
nodes.set('market-insight-panel', node());
const cropInsight = { cellIndex: 1, itemName: 'Onion', isProduce: true, buyPrice: 1.35, currentBasePrice: 2.49, rarity: 'common', growth: { isGrown: true, daysLeft: 0 }, canSell: true, sellNow: 2.49, profitNow: -8.86, quote: { ordinaryValue: 1.35, marketEffect: 1.14, rarityBonus: 0, farmBonus: 0, cost: 11.35, profit: -8.86, historicalCostUnknown: true } };
renderSelectedItemInsightAction({ getBulkSelectedGridInsightData: () => null, getSelectedGridItemInsightData: () => cropInsight, getSelectedShopItemInsightData: () => null, isSellBatchInFlight: true });
const flattenedText = node => [node.textContent || '', ...node.children.flatMap(child => child && typeof child === 'object' ? flattenedText(child) : String(child))];
const receiptText = flattenedText(nodes.get('market-insight-panel')).join(' ');
assert.match(receiptText, /Known-cost profit/);
assert.match(receiptText, /Older treatment costs are unknown/);
assert.match(receiptText, /11\.35/);
assert.equal(nodes.get('farm-action-button').textContent, 'Selling…');
assert.equal(nodes.get('farm-action-button').disabled, true);
renderSelectedItemInsightAction({ getBulkSelectedGridInsightData: () => null, getSelectedGridItemInsightData: () => ({ ...cropInsight, canSell: false, growth: { isGrown: false, daysLeft: 1 }, wateredToday: false, waterRetainedToday: true }), getSelectedShopItemInsightData: () => null });
assert.match(nodes.get('farm-action-button').textContent, /Moisture retained/);
assert.doesNotMatch(nodes.get('farm-action-button').textContent, /Needs water/);
console.log('Historical-cost disclosure, treatment basis, selling guard and retained-water contextual rendering checks passed.');
nodes.set('market-insight-panel', node());
renderSelectedItemInsightAction({ getBulkSelectedGridInsightData: () => null, getSelectedGridItemInsightData: () => null, getSelectedShopItemInsightData: () => ({ isProduce: false, itemType: 'fertiliser', itemName: 'Quality Fertiliser', buyPrice: 15, description: 'Stacks before maturity; cannot change quality once revealed.' }) });
const treatmentText = flattenedText(nodes.get('market-insight-panel')).join(' ');
assert.match(treatmentText, /1 energy/);
assert.match(treatmentText, /This crop/);
assert.match(treatmentText, /Consumed on application/);
assert.match(treatmentText, /Stacks before maturity/);
assert.doesNotMatch(treatmentText, /Resale/);
console.log('Consumable treatment usage, duration, stacking and upfront energy/cash disclosure checks passed.');
