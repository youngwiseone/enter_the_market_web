import assert from 'node:assert/strict';
import { getFarmSceneryPhase } from '../../ui/farm_scenery_state.js';
const state = (energy, spent = 10 - energy) => ({ player: { energy, energyMax: 10 }, dayEnergySpent: spent });
for (const [energy, expected] of [[10, 'morning'], [8, 'morning'], [7.5, 'midday'], [5, 'afternoon'], [2.5, 'evening'], [0.01, 'evening'], [0, 'night']]) {
  assert.equal(getFarmSceneryPhase(state(energy)), expected);
}
assert.equal(getFarmSceneryPhase(state(10, 8)), 'evening', 'energy refill retains work spent');
assert.equal(getFarmSceneryPhase(state(10, 0)), 'morning', 'rest resets the visual day');
assert.equal(getFarmSceneryPhase({ player: { energy: 5, energyMax: 10 } }), 'afternoon', 'legacy save fallback');
assert.equal(getFarmSceneryPhase(state(-3)), 'night');
console.log('Farm scenery checks passed: five phases, exhaustion, rest, refills and legacy fallback.');
