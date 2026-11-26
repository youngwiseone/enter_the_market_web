import assert from 'node:assert/strict';
import { buildMarketBulletin } from '../../sim/market_bulletin.js';
import { applyDailyMarketRollToShopState, getDailyRollSummaryTextState, getBestRollOpportunityTextState } from '../../sim/daily_roll.js';

const rows = buildMarketBulletin([
  { itemName: 'Steady', previous: 2, baseline: 2, current: 2 },
  { itemName: 'Carrot', previous: 1, baseline: 1.4, current: 1.2 },
  { itemName: 'Chilli', previous: 10, baseline: 10, current: 1 },
  { itemName: 'Onion', previous: 3, baseline: 3.3, current: 3 },
  { itemName: 'Unknown', previous: 0, baseline: 1, current: 1 },
  { itemName: 'Missing baseline', previous: 1, current: 2 }
]);
assert.deepEqual(rows.map(({ itemName, cycleCents, rollCents, changeCents }) =>
  [itemName, cycleCents, rollCents, changeCents]), [
  ['Chilli', 0, -900, -900],
  ['Carrot', 40, -20, 20],
  ['Onion', 30, -30, 0]
]);
const effects = { byItem: new Map([[1, { itemName: 'Chilli', adjustedImpactPct: -156, hits: 4 }]]) };
const state = { shop: [{itemId: 1, price: 10}] };
applyDailyMarketRollToShopState({ state, rollResult: effects, isShopItemUnlocked: () => true, ensureShopEntryMarketFields: () => {} });
assert.equal(state.shop[0].price, 1);
assert.match(getDailyRollSummaryTextState(effects, 75), /Chilli -90% x4/);
assert.equal(getBestRollOpportunityTextState(effects), 'No crops got an upward roll.');
assert.deepEqual(buildMarketBulletin([]), []);

const {getPriorMarketRange, describeMarketRange} = await import('../../sim/market_bulletin.js');
const past = [
  { day: 1, prices: { 1: 10 } },
  { day: 3, prices: { 1: 1.25 } },
  { day: 4, prices: { 1: 1.30 } },
  { day: 5, prices: { 1: 1.22 } },
  { day: 6, prices: { 2: 20 } },
  { day: 10, prices: { 1: 9 } },
  { day: 11, prices: { 1: 8 } }
];
const range = getPriorMarketRange(past, 1, 10);
assert.deepEqual(range, { low: 122, high: 130, count: 3 });
assert.equal(describeMarketRange(range, 1.31), 'Above recent range · $1.22–$1.30 (3 earlier quotes)');
assert.match(describeMarketRange(range, 1.3), /^Within recent range/);
assert.match(describeMarketRange(range, 1.21), /^Below recent range/);
assert.equal(getPriorMarketRange(past, 2, 10), null);
assert.equal(getPriorMarketRange(null, 1, 10), null);
