import assert from 'node:assert/strict';
import { createEmptyFarmStateForGrid, normalizeFarmStateForGrid } from '../../state/farm_state.js';
import { applyFarmStateToActiveGridRuntime } from '../../state/farm_runtime.js';
import { getPlantGrowthProgressWithFertiliser as progress, withAppliedPlantFertiliserMeta as apply,
  persistRetainedWaterProgress, isPlantWateredForDay, canApplyFertiliserToPlant } from '../../controllers/fertiliser_controller.js';
import { waterGridTileAction } from '../../controllers/farm_actions.js';
import { applyRainWateringToFarm, nextDayAction } from '../../controllers/day_controller.js';
import { applyGridActionForIndexAction, getGridCellSellSnapshotAction } from '../../controllers/grid_interaction_controller.js';
import { runSellSequenceAction } from '../../controllers/sell_sequence_controller.js';
import { applyDawnSprinklersToFarm } from '../../controllers/watering_infrastructure.js';
import { purchaseAndPlaceSelectedAction } from '../../controllers/grid_controller.js';
import { getCropCostBasis, getSaleQuote } from '../../sim/sale_quote.js';
import { getRarityMultiplier, RARITY_ROLLS } from '../../sim/rarity.js';
import { getSelectedGridItemInsightDataAction, getSelectedShopItemInsightDataAction } from '../../ui/market_insight_data.js';
import { mergeItemAssetsWithDefaults } from '../../content/normalizers.js';
const crop = { id: 6, name: 'Onion', type: 'produce', price: 2, growDays: 4 };
const retention = { id: 33, name: 'Water Retention', type: 'fertiliser', price: 10 };
const quality = { id: 35, name: 'Quality', type: 'fertiliser', price: 15 };
const sprinkler = { id: 32, name: 'Sprinkler', type: 'sprinkler', price: 100 };
const noop = () => {};
function fixture() {
  const farm = createEmptyFarmStateForGrid(9);
  farm.gridItems[1] = crop.id; farm.gridUnlocked.fill(true);
  farm.gridPurchasePrice[1] = 1.35; farm.gridWateredCount[1] = 1; farm.gridWateredDay[1] = 1;
  farm.gridPlacedMeta[1] = apply(apply(null, 'waterRetention', 10), 'waterRetention', 10);
  return { ...farm, player: { day: 3, cash: 100, energy: 10 }, items: [crop, retention, quality, sprinkler], shop: [{ itemId: 6, price: 2.49 }] };
}
function actionDeps(state) {
  return { state, index: 1, cellIndex: 1, selectedShopItemId: 35,
    getPlantGrowthState: (item, i) => progress(state, item, i), consumeEnergy: (amount) => { state.player.energy -= amount; return true; },
    registerDayAction: noop, awardPlayerXp: noop, xpRewards: { water: 1, plant: 1 }, addMessage: noop,
    saveState: noop, renderAll: noop, getTileCenter: () => null, getGridActionFxTargets: () => null,
    spawnBurst: noop, spawnRing: noop, triggerFxClass: noop, showXpGainFeedback: noop,
    isShopItemUnlocked: () => true, setSelectedGridCellIndex: noop, updateNetWorth: noop, evaluateGoals: noop };
}
// Earn retained days, then rewater once dry. No backwards progress or repeat gain.
const state = fixture();
assert.equal(progress(state, crop, 1).effectiveWateredCount, 2);
assert.equal(isPlantWateredForDay(state, 1), true);
waterGridTileAction(actionDeps(state)); assert.equal(state.player.energy, 10, 'retained moisture avoids a wasted manual action');
state.player.day = 4; const earnedBefore = progress(state, crop, 1).effectiveWateredCount;
const random = Math.random; Math.random = () => 1;
try { waterGridTileAction(actionDeps(state)); } finally { Math.random = random; }
assert.equal(progress(state, crop, 1).effectiveWateredCount, earnedBefore);
assert.equal(state.gridPlacedMeta[1].growthWater.retainedDays, 2);
waterGridTileAction(actionDeps(state)); assert.equal(state.player.energy, 9);
state.player.day = 5; assert.equal(progress(state, crop, 1).isGrown, true);
// Conservative legacy migration preserves exactly the currently visible earned days.
const legacy = fixture(); legacy.gridPlacedMeta[1] = { fertiliser: { stacks: { waterRetention: 2 } } };
const visible = progress(legacy, crop, 1).effectiveWateredCount;
persistRetainedWaterProgress(legacy, 1); assert.equal(progress(legacy, crop, 1).effectiveWateredCount, visible);
persistRetainedWaterProgress(legacy, 1); assert.equal(progress(legacy, crop, 1).effectiveWateredCount, visible);
// Rain + overlapping sprinklers + repeated input share one day's water.
const rain = fixture(), itemsById = new Map(rain.items.map((item) => [String(item.id), item]));
rain.gridItems[4] = 32; rain.gridPlacedMeta[4] = { tankCurrent: 4 };
applyRainWateringToFarm(rain, 3, itemsById); applyRainWateringToFarm(rain, 3, itemsById);
assert.equal(rain.gridWateredCount[1], 2); assert.equal(progress(rain, crop, 1).effectiveWateredCount, 2);
assert.equal(applyDawnSprinklersToFarm({ farm: rain, dayNumber: 3, itemsById, random: () => 1 }).cropsWatered, 0);
waterGridTileAction(actionDeps(rain)); assert.equal(rain.player.energy, 10);
const irrigated = fixture(); irrigated.gridPlacedMeta[1] = apply(null, 'waterRetention', 10);
irrigated.player.day = 4; irrigated.gridItems[4] = 32; irrigated.gridPlacedMeta[4] = { tankCurrent: 4 };
assert.equal(applyDawnSprinklersToFarm({ farm: irrigated, dayNumber: 4, itemsById, random: () => 1 }).cropsWatered, 1);
assert.equal(applyDawnSprinklersToFarm({ farm: irrigated, dayNumber: 4, itemsById, random: () => 1 }).cropsWatered, 0);
assert.equal(progress(irrigated, crop, 1).effectiveWateredCount, 2);
// Reload, metadata move and farm switching retain maturity, rarity and paid costs.
state.gridRarity[1] = 'rare';
const saved = normalizeFarmStateForGrid(JSON.parse(JSON.stringify(state)), 9);
applyGridActionForIndexAction({ state: { ...saved, items: [crop], player: state.player, activeTool: 'glove' }, index: 2, mode: 'click',
  TOOL_GLOVE: 'glove', TOOL_PICKAXE: 'pickaxe', TOOL_WATERING: 'watering', selectedShopItemId: null,
  isFarmActionBlocked: () => false, getSelectedGridCellIndex: () => 1, getPlantGrowthState: () => ({ isGrown: true }),
  setSelectedGridCellIndex: noop, selectedGridCellIndices: new Set(), saveState: noop, renderMarket: noop });
const switcher = { farms: { 1: saved, 2: createEmptyFarmStateForGrid(9) }, player: { day: 5 } };
const config = { farmPrimaryId: 1, farmSecondaryId: 2, gridCellCount: 9 };
applyFarmStateToActiveGridRuntime(switcher, 2, config); applyFarmStateToActiveGridRuntime(switcher, 1, config);
assert.equal(progress(switcher, crop, 2).isGrown, true); assert.equal(switcher.gridRarity[2], 'rare');
assert.equal(switcher.gridPlacedMeta[2].fertiliser.paidCost, 20);
// The complete Rest path captures retained growth on both farms, including a
// quiet dry day when no manual or automatic watering occurs.
const resting = fixture(); resting.player.day = 2; resting.player.week = 1; resting.player.energyMax = 10;
resting.farms = { 1: normalizeFarmStateForGrid(resting, 9), 2: normalizeFarmStateForGrid(JSON.parse(JSON.stringify(resting)), 9) };
applyFarmStateToActiveGridRuntime(resting, 1, config);
resting.nextDayWeather = { id: 'sunny' };
nextDayAction({ state: resting, updateNetWorth: noop, playDayTransition: noop, syncGuidedUnlocks: noop,
  getCurrentDaySnapshot: () => ({ day: resting.player.day, cash: resting.player.cash }), isShopItemUnlocked: () => true,
  getFatigueFromEnergy: () => ({ fatiguePercent: 0, impactMultiplier: 0, impactPercent: 0, energySpent: 0, energyMax: 10 }),
  formatEnergyValue: String, addMessage: noop, updateMarketPressureForNextDay: noop, generateDailyMarketRoll: () => ({ picks: [] }),
  getDailyRollSummaryText: () => '', showDailyMarketRollModal: noop, ensurePlayerProgressState: noop, resetLowEnergyNoticeDay: noop,
  ensureShopEntryMarketFields: noop, isShopEntryPriceRecoveryActive: () => false, applyShopEntryPriceRecoveryStep: noop,
  applyDailyMarketRollToShop: noop, emitEconomyAlert: noop, upsertCurrentMarketHistorySnapshot: noop,
  getBestRollOpportunityText: () => '', generateDailyTip: noop, evaluateGoals: noop, saveState: noop, renderAll: noop });
assert.equal(resting.player.day, 3);
assert.equal(resting.farms[1].gridPlacedMeta[1].growthWater.retainedDays, 1);
assert.equal(resting.farms[2].gridPlacedMeta[1].growthWater.retainedDays, 1);
// Cost is actual acquisition spending. New costs are recorded; historical costs stay unknown.
const treated = apply(null, 'waterRetention', 10);
const costBasis = getCropCostBasis({ buyPrice: 1.35, placedMeta: treated });
const quote = getSaleQuote({ item: crop, marketPrice: 2.49 / getRarityMultiplier('common'), ...costBasis, getRarityMultiplier });
assert.equal(quote.cost, 11.35); assert.ok(Math.abs(quote.profit + 8.86) < 1e-10);
assert.equal(quote.historicalCostUnknown, false);
const oldCosts = apply(legacy.gridPlacedMeta[1], 'quality', 15);
assert.equal(getCropCostBasis({ buyPrice: 1.35, placedMeta: oldCosts }).historicalCostUnknown, true);
assert.equal(getCropCostBasis({ buyPrice: 1.35, placedMeta: oldCosts }).treatmentCost, 15);
const purchased = fixture(); purchased.gridPlacedMeta[1] = null; purchased.gridWateredCount[1] = 1;
purchaseAndPlaceSelectedAction({ ...actionDeps(purchased), selectedShopItemId: 33 });
assert.equal(purchased.player.cash, 90); assert.equal(purchased.gridPlacedMeta[1].fertiliser.paidCost, 10);
retention.price = 99; assert.equal(getCropCostBasis({ buyPrice: 1.35, placedMeta: purchased.gridPlacedMeta[1] }).cost, 11.35);
retention.price = 10;
const preview = getSelectedGridItemInsightDataAction({ state: purchased, selectedGridCellIndex: 1, getPlantGrowthState: () => ({ isGrown: true }), getGridRarity: () => 'common', getRarityMultiplier, getActiveFarmSellMultiplier: () => 1 });
assert.equal(preview.profitNow, preview.quote.saleValue - 11.35);
const saleCell = getGridCellSellSnapshotAction({ state: purchased, cellIndex: 1, getPlantGrowthState: () => ({ isGrown: true }), getGridRarity: () => 'common', getRarityMultiplier, getActiveFarmSellMultiplier: () => 1 });
assert.equal(saleCell.profitNow, preview.profitNow); assert.equal(saleCell.quote.cost, 11.35);
purchased.goalStats = { harvestCount: 0, itemsHarvested: {} }; purchased.goalFlags = {};
const paidBatch = await runSellSequenceAction({ state: purchased, cells: [saleCell], registerSaleEvent: noop, registerItemSalePressure: noop });
assert.equal(paidBatch.totalProfitValue, preview.profitNow);
// Quality fails before either payment or energy; unresolved stacking still works.
for (const resolved of ['mature', 'cached']) {
  const target = fixture(); target.gridPlacedMeta[1] = null;
  target.gridWateredCount[1] = resolved === 'mature' ? 4 : 1;
  target.gridRarity[1] = resolved === 'cached' ? 'common' : null;
  purchaseAndPlaceSelectedAction(actionDeps(target));
  assert.equal(target.player.cash, 100); assert.equal(target.player.energy, 10);
}
const growing = fixture(); growing.gridPlacedMeta[1] = apply(null, 'quality', 15);
const valid = canApplyFertiliserToPlant({ state: growing, cellIndex: 1, targetItem: crop, fertiliserItem: quality, rarityRolls: RARITY_ROLLS });
assert.equal(valid.ok, true); assert.equal(valid.nextStackCount, 2);
// Farm 2 seeds use the same sale multiplier as mature crop quotes.
const seedInsight = (multiplier) => getSelectedShopItemInsightDataAction({ state: fixture(), selectedShopItemId: 6, getFreePurchaseCount: () => 0, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, mythic: 4 }, getActiveFarmSellMultiplier: () => multiplier });
assert.equal(seedInsight(2).expectedSale, seedInsight(1).expectedSale * 2);
assert.equal(seedInsight(2).guaranteedSale, seedInsight(1).guaranteedSale * 2);
assert.equal(mergeItemAssetsWithDefaults([{ ...quality, description: 'future behavior' }], [{ ...quality, description: 'Real effect' }]).items[0].description, 'Real effect');
console.log('Growth/cost regression checks passed: retention, rain/sprinkler/manual dedupe, migration, moves/farms, actual costs, historical limitation, quality payment rejection, Farm 2 estimates.');
