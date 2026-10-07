import assert from 'node:assert/strict';
import { createEmptyFarmStateForGrid } from '../../state/farm_state.js';
import { applyFarmStateToActiveGridRuntime } from '../../state/farm_runtime.js';
import { withNewCropIdentity } from '../../state/crop_identity.js';
import { normalizeChapter, getChapterOffers, acceptRequest, declineRequest, getDeliveryPreview, settleDelivery, claimPot } from '../../state/cooking_chapter.js';
import { createCookingController, quoteRecipe } from '../../controllers/cooking_controller.js';
import { createChapterCommit, recoverChapterSettlement, refreshChapterJournal, finishChapterJournal, CHAPTER_JOURNAL_KEY } from '../../state/chapter_settlement.js';
import { getGridCellSellSnapshotAction } from '../../controllers/grid_interaction_controller.js';
import { getSelectedGridItemInsightDataAction } from '../../ui/market_insight_data.js';
import { runSellSequenceAction } from '../../controllers/sell_sequence_controller.js';
import { harvestPlantAction, sellBulkSelectedGridItemsAction } from '../../controllers/harvest_controller.js';
import { getRarityMultiplier } from '../../sim/rarity.js';

const config = { farmPrimaryId: 1, farmSecondaryId: 2, gridCellCount: 49 };
function fixture() {
  const state = { farms: { 1: createEmptyFarmStateForGrid(49), 2: createEmptyFarmStateForGrid(49) },
    player: { day: 100, playerLevel: 30, cash: 30000, energy: 10, playerXp: 0 },
    items: Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `Crop ${i + 1}`, type: 'produce', price: i + 1, growDays: 6 })),
    shop: [], goalStats: { harvestCount: 20, itemsHarvested: {} }, goalsClaimed: {}, unlockedTools: {}, runtimeFlags: {}, activeTool: 'pot' };
  state.items.push({ id: 101, name: 'Garden Soup', type: 'dish', price: 8 });
  applyFarmStateToActiveGridRuntime(state, 1, config);
  normalizeChapter(state);
  return state;
}
function plant(state, index, itemId, rarity = 'common') {
  state.gridItems[index] = itemId;
  state.gridUnlocked[index] = true;
  state.gridWateredCount[index] = 6;
  state.gridRarity[index] = rarity;
  state.gridPurchasePrice[index] = 1;
  state.gridPlacedMeta[index] = withNewCropIdentity({});
}
function cell(state, index) {
  const itemId = state.gridItems[index], item = state.items.find(i => i.id === itemId);
  if (!item || (item.type === 'produce' && state.gridWateredCount[index] < 6)) return null;
  return { itemId, item, cellIndex: index, farmId: state.activeFarmId, instanceId: state.gridPlacedMeta[index]?.instanceId,
    rarity: state.gridRarity[index], farmMultiplier: state.activeFarmId === 2 ? 2 : 1,
    quote: { cost: 3, seedCost: 1, treatmentCost: 2, historicalCostUnknown: index === 0 } };
}
const clone = state => JSON.parse(JSON.stringify(state));
function reload(state) { const copy = clone(state); applyFarmStateToActiveGridRuntime(copy, copy.activeFarmId, config); return copy; }

// Missing chapter fields on advanced saves never complete or reset old progress.
{
  const state = fixture(), old = clone(state.goalStats);
  assert.equal(normalizeChapter(state).stage, 0);
  assert.equal(getChapterOffers(state)[0].id, 'mina-experiment');
  assert.deepEqual(state.goalStats, old);
  state.player.playerLevel = 1; assert.equal(getChapterOffers(state).length, 0);
}
// Strict selected inputs, partial persistence, no market counting, once-only story progress.
{
  let state = fixture(); acceptRequest(state, 'mina-experiment');
  for (let i = 0; i < 4; i++) plant(state, i, 4);
  plant(state, 4, 2);
  const before = clone(state.farms);
  assert.equal(getDeliveryPreview(state, [cell(state, 0), cell(state, 4)]).ok, false);
  assert.equal(settleDelivery(state, [0,1,2,3].map(i => cell(state, i))).ok, false);
  assert.deepEqual(state.farms, before);
  const first = cell(state, 0);
  assert.equal(settleDelivery(state, [first]).complete, false);
  assert.equal(settleDelivery(state, [first]).ok, false);
  state = reload(state);
  assert.equal(state.player.cookingChapter.active.delivered[4], 1);
  assert.equal(settleDelivery(state, [cell(state, 1), cell(state, 2)]).complete, true);
  assert.equal(state.player.cookingChapter.stage, 1);
  assert.equal(state.player.cash, 30000);
  assert.equal(state.goalStats.harvestCount, 20);
  assert.equal(state.player.playerXp, 0);
  assert.equal(settleDelivery(state, []).ok, false);
  state.player.day++; acceptRequest(state, 'mina-supper');
  declineRequest(state); assert.equal(state.player.cookingChapter.stage, 1);
  state.player.day++; acceptRequest(state, 'mina-supper');
  state.player.day += 25; normalizeChapter(state);
  assert.equal(state.player.cookingChapter.stage, 1); assert.equal(state.player.cookingChapter.active, null);
}
// Restaurant offer locks payment, partial delivery pays only upon completion.
// Already donated story ingredients survive either harmless refusal or expiry.
for (const ending of ['decline', 'expire']) {
  let state = fixture(); acceptRequest(state, 'mina-experiment');
  plant(state, 0, 4); settleDelivery(state, [cell(state, 0)]);
  if (ending === 'decline') declineRequest(state);
  else { state.player.day += 25; normalizeChapter(state); }
  state = reload(state); state.player.day++;
  assert.equal(normalizeChapter(state).storyDelivered['mina-experiment'][4], 1);
  assert.equal(acceptRequest(state, 'mina-experiment').ok, true);
  assert.equal(normalizeChapter(state).active.delivered[4], 1);
  plant(state,1,4); plant(state,2,4);
  assert.equal(settleDelivery(state,[cell(state,1),cell(state,2)]).complete,true);
  assert.equal(normalizeChapter(state).stage,1);
}
// Repeat dialogue follows that person's completed meals, never other visitors or decline.
{
  const state = fixture(), c = normalizeChapter(state);
  Object.assign(c,{stage:4,potUnlocked:true,cookedCount:1,restaurantDay:9999});
  const first = getChapterOffers(state).find(o => o.id === 'nell-soup').dialogue;
  acceptRequest(state,'nell-soup'); declineRequest(state); state.player.day++;
  assert.equal(getChapterOffers(state).find(o => o.id === 'nell-soup').dialogue,first);
  acceptRequest(state,'otis-stew'); plant(state,0,102);
  state.items.push({id:102,name:'Tomato Stew',type:'dish',price:12});
  settleDelivery(state,[cell(state,0)]); state.player.day++;
  assert.equal(getChapterOffers(state).find(o => o.id === 'nell-soup').dialogue,first);
  acceptRequest(state,'nell-soup'); plant(state,1,101); settleDelivery(state,[cell(state,1)]);
  state.player.day++;
  assert.notEqual(getChapterOffers(state).find(o => o.id === 'nell-soup').dialogue,first);
  assert.equal(c.visits.nell,1); assert.equal(c.visits.otis,1);
}
// Complete every story request from an advanced legacy save before earning the gift.
{
  let state = fixture(); state.unlockedShopItems = Object.fromEntries(state.items.filter(i => i.type === 'produce').map(i => [i.id, true]));
  for (let stage = 0; stage < 3; stage++) {
    const offer = getChapterOffers(state)[0];
    assert.ok(offer, `story stage ${stage} remains available to advanced saves`);
    assert.equal(acceptRequest(state, offer.id).ok, true);
    let index = 0;
    for (const req of offer.requirements) for (let n = 0; n < req.quantity; n++) plant(state, index++, req.itemId);
    assert.equal(settleDelivery(state, Array.from({ length: index }, (_, i) => cell(state, i))).complete, true);
    state = reload(state);
    assert.equal(normalizeChapter(state).stage, stage + 1);
    state.player.day++;
  }
  assert.equal(getChapterOffers(state)[0].kind, 'gift');
  assert.equal(claimPot(state).ok, true);
  assert.equal(state.unlockedTools.pot, true);
  assert.deepEqual(normalizeChapter(state).knownRecipes, [101,102,103]);
}
{
  let state = fixture(); const chapter = normalizeChapter(state);
  chapter.stage = 3; chapter.readyDay = state.player.day;
  assert.equal(claimPot(state).ok, true); assert.equal(claimPot(state).ok, false);
  chapter.cookedCount = 1; state.player.day += 8;
  const offer = getChapterOffers(state).find(o => o.kind === 'restaurant');
  assert.ok(offer.requirements.reduce((n, r) => n + r.quantity, 0) <= 12);
  acceptRequest(state, offer.id);
  let index = 0;
  for (const req of offer.requirements) for (let i = 0; i < req.quantity; i++) plant(state, index++, req.itemId);
  settleDelivery(state, [cell(state, 0)]); assert.equal(state.player.cash, 30000);
  state = reload(state);
  const finalCells = Array.from({ length: index - 1 }, (_, i) => cell(state, i + 1));
  assert.equal(settleDelivery(state, finalCells).reward, offer.reward);
  assert.equal(settleDelivery(state, finalCells).ok, false);
  assert.equal(state.player.cash, 30000 + offer.reward);
  assert.equal(getChapterOffers(state).length, 0);
}
function cookingFixture() {
  const state = fixture(); Object.assign(normalizeChapter(state), { stage: 4, potUnlocked: true, knownRecipes: [101,102,103] });
  let saved = null, reactions = 0;
  const controller = createCookingController({ state, getCellSnapshot: i => cell(state, i),
    saveState: () => { saved = clone(state); }, onCooked: () => reactions++,
    awardCookingXp: n => { state.player.playerXp += n; } });
  return { state, controller, saved: () => saved, reactions: () => reactions };
}
// Full board, exact final cell, carried costs, single energy/XP, no recooking.
{
  const f = cookingFixture(), { state, controller } = f;
  for (let i = 0; i < 49; i++) plant(state, i, 6);
  plant(state, 0, 4, 'rare'); plant(state, 48, 5, 'mythic');
  const expected = quoteRecipe([cell(state, 0), cell(state, 48)]);
  assert.equal(controller.tap(0).complete, false);
  const untouched = clone(state.farms);
  assert.equal(controller.tap(0).ok, false); assert.equal(controller.tap(1).ok, false);
  assert.deepEqual(state.farms, untouched);
  assert.equal(controller.tap(48).complete, true);
  assert.equal(state.gridItems[0], null); assert.equal(state.gridItems[48], 101);
  assert.equal(state.gridItems.filter(Boolean).length, 48);
  assert.equal(state.gridPlacedMeta[48].dish.cost, 6);
  assert.equal(state.gridPlacedMeta[48].dish.saleValue, expected.saleValue);
  assert.equal(state.gridPlacedMeta[48].dish.rarity, 'rare');
  assert.equal(state.gridPlacedMeta[48].dish.historicalCostUnknown, true);
  assert.equal(state.player.energy, 9); assert.equal(state.dayEnergySpent, 1);
  assert.equal(state.player.playerXp, 2); assert.equal(state.goalStats.harvestCount, 20);
  assert.equal(controller.tap(48).ok, false); assert.equal(f.reactions(), 1);
  assert.equal(f.saved().farms[1].gridItems[48], 101);
}
// Cancellation and context changes are free; identity replacement rejects settlement.
// Real quote/insight and single/bulk settlement retain frozen dish basis without bonuses twice.
for (const mode of ['sequence', 'single', 'bulk']) {
  const { state, controller } = cookingFixture();
  for (const [i,id] of [[0,4],[1,5],[2,4],[3,5]]) plant(state,i,id,i % 2 ? 'mythic' : 'rare');
  controller.tap(0); const first = controller.tap(1);
  controller.tap(2); const second = controller.tap(3);
  let loaded = reload(state);
  // Market/farm/rarity presentation changes cannot upgrade the frozen meal quote.
  loaded.items.find(i => i.id === 101).price = 99999;
  loaded.shop.push({ itemId: 101, price: 999999 });
  const noop = () => {};
  const deps = { state: loaded, getPlantGrowthState: () => ({ isGrown: false }), getGridRarity: i => loaded.gridRarity[i],
    getRarityMultiplier, getActiveFarmSellMultiplier: () => 99, registerDayAction: noop,
    registerSaleEvent: () => { loaded.totalItemsSold = (loaded.totalItemsSold || 0) + 1; },
    registerItemSalePressure: () => { throw new Error('Dish must not pressure produce market'); },
    guidedHarvestFlag: 'harvest', awardPlayerXp: n => { loaded.player.playerXp += n; }, xpRewards: { harvest: 100 },
    updateNetWorth: noop, evaluateGoals: noop, saveState: noop, renderAll: noop, addMessage: noop,
    setSelectedGridCellIndex: noop, getSelectedGridCellIndex: () => null, getTileCenter: () => null,
    getHudCenters: () => [], pulseHud: noop, selectedGridCellIndices: new Set([1,3]) };
  const snapshots = [1,3].map(cellIndex => getGridCellSellSnapshotAction({ ...deps, cellIndex }));
  snapshots.forEach((snapshot,i) => {
    const insight = getSelectedGridItemInsightDataAction({ ...deps, selectedGridCellIndex: snapshot.cellIndex });
    const cooked = i === 0 ? first : second;
    assert.equal(snapshot.sellNow, cooked.quote.saleValue);
    assert.equal(snapshot.buyPrice, cooked.quote.cost);
    assert.equal(snapshot.quote.historicalCostUnknown, cooked.quote.historicalCostUnknown);
    assert.deepEqual(insight.quote, snapshot.quote);
    assert.equal(insight.profitNow, snapshot.profitNow);
    assert.equal(insight.canSell, true); assert.equal(insight.isDish, true);
  });
  const beforeCash = loaded.player.cash, beforeXp = loaded.player.playerXp;
  if (mode === 'sequence') {
    const result = await runSellSequenceAction({ ...deps, cells: snapshots, xpGainPerSale: 100 });
    assert.equal(result.produceSoldCount, 0);
    assert.equal(result.totalProfitValue, snapshots.reduce((n,s) => n+s.profitNow,0));
  } else if (mode === 'single') {
    for (const cellIndex of [1,3]) await harvestPlantAction({ ...deps, cellIndex });
  } else {
    await sellBulkSelectedGridItemsAction({ ...deps, getBulkSelectedGridInsightData: () => ({ count: 2, cells: snapshots }) });
  }
  assert.ok(Math.abs(loaded.player.cash - beforeCash - snapshots.reduce((n,s) => n+s.sellNow,0)) < 1e-9);
  assert.equal(loaded.player.playerXp, beforeXp);
  assert.equal(loaded.goalStats.harvestCount, 20);
  assert.equal(loaded.totalItemsSold, 2);
  assert.equal(loaded.gridItems[1], null); assert.equal(loaded.gridItems[3], null);
  const paid = loaded.player.cash;
  await runSellSequenceAction({ ...deps, cells: snapshots });
  assert.equal(loaded.player.cash, paid);
}
for (const change of ['cancel', 'tool', 'farm', 'day', 'request', 'reaccept', 'identity', 'energy']) {
  const { state, controller } = cookingFixture(); plant(state, 0, 4); plant(state, 1, 5);
  if (change === 'reaccept') normalizeChapter(state).active = { id:'same-request', acceptedDay:99, requirements:[],deadlineDay:999 };
  controller.tap(0);
  if (change === 'cancel') controller.cancel();
  if (change === 'tool') state.activeTool = 'glove';
  if (change === 'farm') applyFarmStateToActiveGridRuntime(state, 2, config);
  if (change === 'day') state.player.day++;
  if (change === 'request') normalizeChapter(state).active = { id: 'new', requirements: [], deadlineDay: 999 };
  if (change === 'reaccept') normalizeChapter(state).active.acceptedDay = 100;
  if (change === 'identity') state.gridPlacedMeta[0] = withNewCropIdentity({});
  if (change === 'energy') state.player.energy = 0;
  controller.tap(1);
  assert.equal(state.farms[1].gridItems[0], 4, change);
  assert.equal(state.farms[1].gridItems[1], 5, change);
  assert.equal(normalizeChapter(state).cookedCount, 0, change);
}
// Journal replay is idempotent across interrupted key writes; quota rejection rolls back.
{
  const state = fixture(), map = new Map();
  const storage = { getItem: k => map.get(k) ?? null, setItem: (k,v) => map.set(k,v), removeItem: k => map.delete(k) };
  const commit = createChapterCommit({ state, storage, rebind: id => applyFarmStateToActiveGridRuntime(state,id,config), saveState: () => {} });
  commit(() => {
    state.player.cash += 10; plant(state, 0, 101); state.player.playerXp += 2;
    state.unlockedShopItems = { 12: true }; state.shop = [{ itemId: 12, locked: false }];
    state.inventory = [{ itemId: 12, quantity: 3 }]; state.store = [{ id: 'gift', purchased: true }];
    state.freePurchasesByItem = { 12: 1 }; state.unlockedTools.pot = true;
  });
  assert.ok(map.has(CHAPTER_JOURNAL_KEY));
  let writes = 0; const failing = { ...storage, setItem: (k,v) => { if (++writes === 3) throw new Error('interrupted'); storage.setItem(k,v); } };
  assert.throws(() => recoverChapterSettlement(failing), /interrupted/);
  assert.ok(map.has(CHAPTER_JOURNAL_KEY)); assert.equal(recoverChapterSettlement(storage), true);
  assert.equal(JSON.parse(map.get('player')).cash, 30010);
  assert.equal(JSON.parse(map.get('farms'))[1].gridItems[0], 101);
  assert.equal(JSON.parse(map.get('player')).playerXp, 2);
  for (const key of ['unlockedShopItems','shop','inventory','store','freePurchasesByItem','unlockedTools']) {
    assert.deepEqual(JSON.parse(map.get(key)), state[key], `journal replays ${key}`);
  }
  assert.equal(recoverChapterSettlement(storage), false);
  const before = clone(state);
  const reject = createChapterCommit({ state, storage: { ...storage, setItem: () => { throw new Error('quota'); } }, saveState: () => {}, rebind: id => applyFarmStateToActiveGridRuntime(state,id,config) });
  assert.throws(() => reject(() => { state.player.cash += 100; state.gridItems[0] = null; }), /quota/);
  assert.equal(state.player.cash, before.player.cash); assert.equal(state.gridItems[0], 101);
}
// Ordinary sale/save updates a lingering recovery checkpoint instead of resurrecting food.
{
  const state=fixture(),map=new Map();
  const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
  const commit=createChapterCommit({state,storage,saveState:()=>{},rebind:id=>applyFarmStateToActiveGridRuntime(state,id,config)});
  commit(()=>plant(state,0,101)); assert.ok(map.has(CHAPTER_JOURNAL_KEY));
  // Model a market sale, then a normal save interrupted after advancing its checkpoint.
  state.gridItems[0]=null; state.gridPlacedMeta[0]=null; state.player.cash+=8;
  refreshChapterJournal(state,storage);
  assert.equal(recoverChapterSettlement(storage),true);
  assert.equal(JSON.parse(map.get('farms'))[1].gridItems[0],null);
  assert.equal(JSON.parse(map.get('player')).cash,30008);
  // Every relevant key must match before the durable checkpoint is cleared.
  commit(()=>{state.player.playerXp+=2;state.unlockedTools.pot=true;});
  const checkpoint=JSON.parse(map.get(CHAPTER_JOURNAL_KEY));
  for(const [key,value] of Object.entries(checkpoint)) storage.setItem(key,JSON.stringify(value));
  storage.setItem('unlockedTools',JSON.stringify({}));
  finishChapterJournal(state,storage); assert.ok(map.has(CHAPTER_JOURNAL_KEY));
  storage.setItem('unlockedTools',JSON.stringify(state.unlockedTools));
  finishChapterJournal(state,storage); assert.equal(map.has(CHAPTER_JOURNAL_KEY),false);
  assert.equal(recoverChapterSettlement(storage),false);
  refreshChapterJournal(state,storage); assert.equal(map.has(CHAPTER_JOURNAL_KEY),false);
}
console.log('Cooking chapter passed: legacy access, strict/partial/reload deliveries, story safety, bounded orders, full-board exact output, cost/rarity, cancellation/context/identity, dedupe and journal recovery.');
