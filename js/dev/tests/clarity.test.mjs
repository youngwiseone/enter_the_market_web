import assert from 'node:assert/strict';
import { getSelectedShopItemInsightDataAction } from '../../ui/market_insight_data.js';
import { takeIntroCropMeta } from '../../state/opening_state.js';

const carrot = { id: 4, name: 'Carrot', type: 'produce', price: 1, growDays: 6 };
const tomato = { id: 5, name: 'Tomato', type: 'produce', price: 2, growDays: 6 };
const state = { player: { day: 1, openingTrade: { carrotAvailable: true } }, items: [carrot, tomato], shop: [{ itemId: 4, price: 1 }, { itemId: 5, price: 2 }] };
const insight = id => getSelectedShopItemInsightDataAction({ state, selectedShopItemId: id, getFreePurchaseCount: () => 0, rarityMultipliers: { common: 1.2, uncommon: 1.5, rare: 2, mythic: 3 } });
assert.equal(insight(4).growthDays, 2);
assert.equal(insight(4).introductoryGrowth, true);
assert.equal(insight(5).growthDays, 6, 'starter display does not accelerate other crops');
assert.equal(insight(4).marketContext.growDays, 6, 'normal content remains unchanged');
assert.deepEqual(takeIntroCropMeta(state, carrot), { introductoryGrowDays: 2 });
assert.equal(insight(4).growthDays, 6, 'next seed outlook returns to normal after planting');
delete state.player.openingTrade;
assert.equal(insight(4).growthDays, 6, 'existing saves never show an introductory exception');
console.log('Clarity checks passed: accurate first-seed growth, subsequent seeds, other crops and existing saves.');
