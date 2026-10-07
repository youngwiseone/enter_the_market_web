import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  getTradingChallengeView,
  startTradingChallenge,
  withTradingChallengeCropMeta,
  recordTradingChallengeSale,
  TRADING_CHALLENGE_GOAL_ID
} from '../../state/trading_challenge.js';
import { normalizeFarmStateForGrid } from '../../state/farm_state.js';
import { getGoalMetricValueAction, evaluateGoalsAction, startTradingChallengeAction } from '../../controllers/goals_controller.js';
import { DEFAULT_DATA } from '../../content/fallbacks/default_data.js';

const makeState = (day = 20) => ({
  player: { playerLevel: 5, day, cash: 100 },
  goalStats: { harvestCount: 30, itemsHarvested: { 4: 30 } },
  goalFlags: {}, goalsClaimed: {}
});
function paidCrop(state, cropId, seedCost = 1) {
  return { cropId, ...withTradingChallengeCropMeta(state, {}, { seedCost }) };
}
function sale(state, meta, extra = {}) {
  return recordTradingChallengeSale(state, {
    cropMeta: meta, cropId: meta.cropId, revenue: 4, costBasis: 1,
    costBasisKnown: true, ...extra
  });
}

const legacy = makeState();
assert.equal(getTradingChallengeView(legacy).status, 'available');
assert.equal(legacy.goalStats.tradingChallenge, undefined, 'old saves never enter automatically');
legacy.player.playerLevel = 4;
assert.equal(startTradingChallenge(legacy), false);
assert.equal(getTradingChallengeView(legacy).status, 'locked');
legacy.player.playerLevel = 5;
legacy.runtimeFlags = { isSellBatchInFlight: true };
assert.equal(startTradingChallenge(legacy), false, 'starting cannot overlap sale settlement');
legacy.runtimeFlags.isSellBatchInFlight = false;
assert.equal(startTradingChallenge(legacy), true);
assert.equal(startTradingChallenge(legacy), false, 'active attempts cannot restart');
assert.equal(getTradingChallengeView(legacy).endDay, 33);
assert.equal(sale(legacy, { cropId: 'old' }), false, 'inherited crops excluded');
assert.equal(sale(legacy, paidCrop(legacy, 'free', 0)), false, 'free rewards excluded');
assert.equal(sale(legacy, paidCrop(legacy, 'unknown'), { costBasisKnown: false }), false);
assert.equal(sale(legacy, paidCrop(legacy, 'missing-id'), { cropId: null }), false);

const crop = paidCrop(legacy, 'crop:1');
const farm = normalizeFarmStateForGrid({ gridPlacedMeta: [crop] }, 49);
const reloaded = JSON.parse(JSON.stringify(legacy));
assert.equal(sale(reloaded, farm.gridPlacedMeta[0]), true, 'metadata survives farm normalization and reload');
assert.equal(sale(reloaded, farm.gridPlacedMeta[0]), false, 'each exact crop counted once');
assert.equal(sale(reloaded, paidCrop(reloaded, 'crop:2')), true);
assert.equal(getTradingChallengeView(reloaded).profit, 6);
assert.equal(getTradingChallengeView(reloaded).saleDays, 1);
assert.equal(getTradingChallengeView(reloaded).status, 'active', 'one bulk harvest day cannot win');
reloaded.player.day += 1;
assert.equal(sale(reloaded, paidCrop(reloaded, 'treated'), { revenue: 2.49, costBasis: 11.35 }), true);
assert.ok(Math.abs(getTradingChallengeView(reloaded).profit - (-2.86)) < 1e-9, 'treatments and loss trades lower profit');
assert.equal(getTradingChallengeView(reloaded).status, 'active');
assert.equal(sale(reloaded, paidCrop(reloaded, 'farm2'), { revenue: 20, farmMultiplier: 2 }), true);
assert.ok(Math.abs(getTradingChallengeView(reloaded).profit - 6.14) < 1e-9, 'Farm 2 subsidy does not count as trading profit');
assert.equal(getTradingChallengeView(reloaded).status, 'won');
assert.equal(startTradingChallenge(reloaded), false, 'success is a one-time existing goal');
assert.equal(getGoalMetricValueAction({ state: reloaded, metric: 'tradingChallengeWon' }), 1);
reloaded.player.day = 100;
assert.equal(getTradingChallengeView(reloaded).status, 'won', 'earned eligibility survives deadline and reload');

const expiry = makeState(40);
startTradingChallenge(expiry);
const oldAttemptCrop = paidCrop(expiry, 'previous-attempt');
expiry.player.day = 53;
assert.equal(sale(expiry, paidCrop(expiry, 'last-day')), true, 'deadline includes the displayed final day');
expiry.player.day = 54;
assert.equal(getTradingChallengeView(expiry).status, 'expired');
assert.equal(sale(expiry, oldAttemptCrop), false);
const cashBefore = expiry.player.cash;
assert.equal(startTradingChallenge(expiry), true, 'failed attempts retry without penalty');
assert.equal(expiry.player.cash, cashBefore);
assert.equal(sale(expiry, oldAttemptCrop), false, 'previous-attempt holdings cannot enter retry');
assert.equal(getTradingChallengeView(expiry).profit, 0);

const precision = makeState();
startTradingChallenge(precision);
for (let i = 0; i < 700; i += 1) {
  precision.player.day = 20 + i % 2;
  sale(precision, paidCrop(precision, `fraction:${i}`), { revenue: 1.004, costBasis: 1 });
}
assert.ok(Math.abs(getTradingChallengeView(precision).profit - 2.8) < 1e-9);
assert.equal(getTradingChallengeView(precision).status, 'active', 'per-sale rounding cannot inflate challenge profit');

const goals = JSON.parse(readFileSync(new URL('../../../data/goals.json', import.meta.url))).goals;
const goal = goals.find((entry) => entry.id === TRADING_CHALLENGE_GOAL_ID);
assert.deepEqual(goal, DEFAULT_DATA.goals.find((entry) => entry.id === TRADING_CHALLENGE_GOAL_ID));
reloaded.goals = [goal];
let rewards = 0, xpAwards = 0, saves = 0;
const noop = () => {};
const deps = {
  state: reloaded, getGoalProgress: () => ({ percent: 100 }), addMessage: noop,
  doesGoalMeetCondition: () => getGoalMetricValueAction({ state: reloaded, metric: 'tradingChallengeWon' }) === 1,
  applyGoalReward: () => { rewards += 1; }, awardPlayerXp: () => { xpAwards += 1; },
  XP_REWARDS: { goal: 20 }, enqueueGoalCelebration: noop,
  isToolUnlocked: () => true, TOOL_GLOVE: 'glove', saveState: () => { saves += 1; },
  updateToolButtons: noop, updateCursorForTool: noop
};
assert.equal(evaluateGoalsAction(deps), 1);
assert.equal(evaluateGoalsAction(deps), 0);
assert.equal(rewards, 1);
assert.equal(xpAwards, 1);
assert.equal(saves, 1);
const explicit = makeState();
let startSaves = 0, renders = 0;
assert.equal(startTradingChallengeAction({ state: explicit, saveState: () => { startSaves += 1; }, rerender: () => { renders += 1; } }), true);
assert.equal(startSaves, 1);
assert.equal(renders, 1);
console.log('Trading challenge checks passed: explicit entry, known costs, inherited/free crops, loss accounting, Farm 2 parity, exact-crop dedupe, metadata reload, deadlines, harmless retry, precision and one-time goal rewards.');
