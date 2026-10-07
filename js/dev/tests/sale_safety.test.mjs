import assert from 'node:assert/strict';
import { createEmptyFarmStateForGrid, normalizeFarmStateForGrid } from '../../state/farm_state.js';
import { applyFarmStateToActiveGridRuntime } from '../../state/farm_runtime.js';
import { withNewCropIdentity } from '../../state/crop_identity.js';
import { getGridCellSellSnapshotAction, applyGridActionForIndexAction } from '../../controllers/grid_interaction_controller.js';
import { sellBulkSelectedGridItemsAction, harvestPlantAction } from '../../controllers/harvest_controller.js';
import { setActiveFarmAction } from '../../controllers/farm_ui_controller.js';
import { nextDayAction } from '../../controllers/day_controller.js';
import { getRarityMultiplier } from '../../sim/rarity.js';
const noop = () => {};
const config = { farmPrimaryId: 1, farmSecondaryId: 2, gridCellCount: 49 };
const item = { id: 6, name: 'Onion', type: 'produce', price: 2, growDays: 6 };
function fixture() {
  const farms = { 1: createEmptyFarmStateForGrid(49), 2: createEmptyFarmStateForGrid(49) };
  for (const farm of Object.values(farms)) for (const index of [0, 1, 2]) {
    farm.gridItems[index] = 6; farm.gridUnlocked[index] = true;
    farm.gridRarity[index] = index === 1 ? 'rare' : 'common';
    farm.gridPurchasePrice[index] = 1.35;
    farm.gridPlacedMeta[index] = withNewCropIdentity({ fertiliser: { stacks: {}, paidCost: 10 } });
    farm.gridWateredCount[index] = farm === farms[1] ? 6 : 0;
  }
  const state = { farms, player: { cash: 100, day: 9, playerXp: 0 }, items: [item], shop: [{ itemId: 6, price: 2.49 }],
    goalStats: { harvestCount: 0, itemsHarvested: {} }, goalFlags: {}, runtimeFlags: {} };
  applyFarmStateToActiveGridRuntime(state, 1, config);
  return state;
}
function depsFor(state) {
  let saved;
  const deps = { state, cellIndex: 0, getPlantGrowthState: (it, i) => ({ isGrown: state.gridWateredCount[i] >= 6 }),
    getGridRarity: i => state.gridRarity[i], assignGridRarity: () => 'common', getRarityMultiplier,
    getActiveFarmSellMultiplier: () => state.activeFarmId === 2 ? 2 : 1,
    registerDayAction: noop, registerSaleEvent: () => { state.totalItemsSold = (state.totalItemsSold || 0) + 1; },
    registerItemSalePressure: noop, guidedHarvestFlag: 'harvest', xpRewards: { harvest: 3 },
    awardPlayerXp: n => { state.player.playerXp += n; }, updateNetWorth: noop,
    evaluateGoals: () => { if (state.goalStats.harvestCount >= 2) state.goalFlags.rewardEligible = true; },
    saveState: () => { saved = JSON.parse(JSON.stringify(state)); }, addMessage: noop, renderAll: noop,
    refreshSellStep: noop, selectedGridCellIndices: new Set([0,1,2]), setSelectedGridCellIndex: noop,
    getSelectedGridCellIndex: () => null, getTileCenter: () => null, getHudCenters: () => [], pulseHud: noop,
    getIsSellBatchInFlight: () => !!state.runtimeFlags.isSellBatchInFlight,
    setIsSellBatchInFlight: flag => { state.runtimeFlags.isSellBatchInFlight = flag; }, getSaved: () => saved };
  deps.getBulkSelectedGridInsightData = () => {
    const cells = [0,1,2].map(cellIndex => getGridCellSellSnapshotAction({ ...deps, cellIndex })).filter(Boolean);
    return { cells, count: cells.length };
  };
  return deps;
}
// Force an active-array change during the first animation, bypassing UI locks:
// only the originating farm's exact instances can settle, with frozen quotes.
{
  const state = fixture(), deps = depsFor(state), untouched = JSON.stringify(state.farms[2]);
  const cells = deps.getBulkSelectedGridInsightData().cells;
  let steps = 0;
  deps.playSellItemsToButton = async () => {
    if (++steps === 1) {
      assert.equal(setActiveFarmAction({ state, farmId: 2 }), false);
      assert.equal(applyGridActionForIndexAction({ state, isFarmActionBlocked: () => false }), false);
      const day = state.player.day; nextDayAction({ state }); assert.equal(state.player.day, day);
      await harvestPlantAction(deps); // Repeated/keyboard single sale cannot re-enter.
      await sellBulkSelectedGridItemsAction(deps);
      applyFarmStateToActiveGridRuntime(state, 2, config);
      state.shop[0].price = 999;
    }
  };
  await sellBulkSelectedGridItemsAction(deps);
  assert.equal(JSON.stringify(state.farms[2]), untouched);
  assert.equal(state.farms[1].gridItems.filter(Boolean).length, 0);
  assert.ok(Math.abs(state.player.cash - (100 + cells.reduce((sum,c) => sum+c.sellNow,0))) < 1e-10);
  assert.equal(state.player.playerXp, 9); assert.equal(state.totalItemsSold, 3);
  assert.equal(state.goalFlags.rewardEligible, true);
}
// Rehydrating the farm object preserves crop identity but replaces its arrays.
// Settlement must resolve that current origin again after presentation starts.
{
  const state = fixture(), deps = depsFor(state);
  let first = true;
  deps.playSellItemsToButton = () => {
    if (first) {
      first = false;
      state.farms[1] = normalizeFarmStateForGrid(JSON.parse(JSON.stringify(state.farms[1])), 49);
      applyFarmStateToActiveGridRuntime(state, 2, config);
    }
    return Promise.resolve();
  };
  await sellBulkSelectedGridItemsAction(deps);
  assert.equal(state.farms[1].gridItems.filter(Boolean).length, 0);
  assert.equal(state.farms[2].gridItems.filter(Boolean).length, 3);
  assert.equal(state.totalItemsSold, 3);
  assert.equal(state.player.playerXp, 9);
}
// Same type at the same location is a different crop; never pay the old quote.
{
  const state = fixture(), deps = depsFor(state);
  deps.playSellItemsToButton = async () => {
    if (!state.gridItems[0] && state.gridItems[1]) {
      state.gridPlacedMeta[1] = withNewCropIdentity({});
    }
  };
  await sellBulkSelectedGridItemsAction(deps);
  assert.equal(state.gridItems[1], 6); assert.equal(state.totalItemsSold, 2);
  assert.equal(state.player.playerXp, 6);
}
// Interruption between paid steps has all cash/removal/counters/XP saved.
for (const interruptAt of [1, 2, 3]) {
  const state = fixture(), deps = depsFor(state);
  const cells = deps.getBulkSelectedGridInsightData().cells;
  let steps = 0;
  deps.playSellItemsToButton = async () => { if (++steps === interruptAt) throw new Error('reload during cosmetic travel'); };
  await assert.rejects(sellBulkSelectedGridItemsAction(deps), /reload/);
  const saved = deps.getSaved();
  assert.equal(saved.totalItemsSold, interruptAt); assert.equal(saved.player.playerXp, interruptAt * 3);
  assert.equal(saved.farms[1].gridItems.filter(Boolean).length, 3 - interruptAt);
  assert.equal(saved.goalFlags.rewardEligible === true, interruptAt >= 2);
  saved.runtimeFlags = {}; saved.farms[1] = normalizeFarmStateForGrid(saved.farms[1],49);
  applyFarmStateToActiveGridRuntime(saved, 1, config);
  await sellBulkSelectedGridItemsAction(depsFor(saved));
  assert.equal(saved.totalItemsSold, 3); assert.equal(saved.player.playerXp, 9);
  assert.ok(Math.abs(saved.player.cash - (100 + cells.reduce((sum,c) => sum+c.sellNow,0))) < 1e-10);
}
// A single interrupted before payment has no economic effect; the lock releases.
{
  const state = fixture(), deps = depsFor(state);
  deps.playSellItemsToButton = async () => { throw new Error('before settlement'); };
  await assert.rejects(harvestPlantAction(deps), /before settlement/);
  assert.equal(state.player.cash,100); assert.equal(state.player.playerXp,0); assert.equal(state.gridItems[0],6);
  assert.equal(state.runtimeFlags.isSellBatchInFlight,false);
  deps.playSellItemsToButton = noop; await harvestPlantAction(deps);
  const paid = state.player.cash; await harvestPlantAction(deps);
  assert.equal(state.player.cash,paid); assert.equal(state.player.playerXp,3);
}
console.log('Sale safety passed: farm/crop identity, frozen quotes, action locks, interruption at every batch step, reload/retry, single-sale interruption and dedupe.');
