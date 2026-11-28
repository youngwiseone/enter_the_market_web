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

const { getCurrentGazette, hydrateDaySalesState, recordDaySummary } = await import('../../state/day_sales_state.js');
const { persistFullState } = await import('../../state/persistence.js');
const { persistResetState } = await import('../../state/reset_persistence.js');
const legacyTakings = { day: 9, itemsSold: 2, salesTotal: 3.25 };
const saved = new Map([['daySummaryHistory', JSON.stringify([legacyTakings])]]);
const save = (key, value) => saved.set(key, JSON.stringify(value));
const load = (key, fallback) => typeof saved.get(key) === 'string' ? JSON.parse(saved.get(key)) : fallback;
const trading = { player: { day: 10, cash: 77 }, shop: [{ itemId: 1, price: 1.31 }] };
hydrateDaySalesState(trading, load);
assert.equal(getCurrentGazette(trading), null, 'a legacy summary does not recreate the issue');

const dawn = { day: 10, itemsSold: 4, salesTotal: 7, marketBulletin: [
  { ...rows[1], priorRange: range }
] };
trading.player.day = 11;
recordDaySummary(trading, dawn);
const beforeRead = JSON.stringify(trading);
assert.deepEqual(getCurrentGazette(trading), dawn);
assert.deepEqual(getCurrentGazette(trading), dawn);
assert.equal(JSON.stringify(trading), beforeRead, 'reading the issue cannot change money, prices or day');
persistFullState(save, trading);
const reloaded = { player: load('player'), shop: load('shop') };
hydrateDaySalesState(reloaded, load);
assert.deepEqual(getCurrentGazette(reloaded), dawn, 'reopen the same conflicting cycle/roll moves after reload');
assert.equal(describeMarketRange(getCurrentGazette(reloaded).marketBulletin[0].priorRange, 1.31),
  'Above recent range · $1.22–$1.30 (3 earlier quotes)');

reloaded.player.day++;
assert.equal(getCurrentGazette(reloaded), null, 'never pass off a stale issue as today’s');
recordDaySummary(reloaded, { day: 11, itemsSold: 0, salesTotal: 0, marketBulletin: [] });
assert.deepEqual(reloaded.daySummaryHistory[1], { day: 10, itemsSold: 4, salesTotal: 7 });
assert.deepEqual(getCurrentGazette(reloaded).marketBulletin, [], 'steady days still have an issue');
assert.equal(getCurrentGazette({ player: { day: 2 }, daySummaryHistory: [{ day: 1, marketBulletin: [null] }] }), null);

reloaded.daySummaryHistory = [];
persistResetState(save, reloaded);
hydrateDaySalesState(reloaded, load);
assert.equal(getCurrentGazette(reloaded), null, 'reset does not carry the prior run’s paper forward');
