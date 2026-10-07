// An optional, explicitly entered challenge. Its ledger lives inside goalStats,
// which already participates in full-state saves. Old saves remain unentered.
export const TRADING_CHALLENGE_GOAL_ID = 'market-timing-challenge';
export const TRADING_CHALLENGE_RULES = Object.freeze({
  minLevel: 5,
  windowDays: 14,
  targetProfit: 5,
  targetSaleDays: 2
});

function currentDay(state) {
  return Math.max(1, Math.floor(Number(state.player?.day) || 1));
}

function getAttempt(state) {
  const attempt = state.goalStats?.tradingChallenge;
  if (!attempt || typeof attempt !== 'object' || typeof attempt.id !== 'string'
    || !Number.isInteger(attempt.startDay) || !Number.isInteger(attempt.endDay)
    || attempt.startDay < 1 || attempt.endDay < attempt.startDay) return null;
  return attempt;
}

export function getTradingChallengeView(state) {
  const attempt = getAttempt(state);
  const won = attempt?.won === true || !!state.goalsClaimed?.[TRADING_CHALLENGE_GOAL_ID];
  const saleDays = new Set(Array.isArray(attempt?.saleDays) ? attempt.saleDays : []).size;
  const status = won ? 'won'
    : attempt ? (currentDay(state) > attempt.endDay ? 'expired' : 'active')
      : Number(state.player?.playerLevel || 1) >= TRADING_CHALLENGE_RULES.minLevel ? 'available' : 'locked';
  return {
    ...TRADING_CHALLENGE_RULES,
    status,
    startDay: attempt?.startDay ?? null,
    endDay: attempt?.endDay ?? null,
    profit: Number(attempt?.profit) || 0,
    saleDays
  };
}

export function startTradingChallenge(state) {
  const view = getTradingChallengeView(state);
  if (view.status !== 'available' && view.status !== 'expired') return false;
  if (state.runtimeFlags?.isSellBatchInFlight) return false;
  if (!state.goalStats || typeof state.goalStats !== 'object') state.goalStats = {};
  const previousAttempt = getAttempt(state);
  const attemptNumber = Math.max(0, Math.floor(Number(previousAttempt?.attemptNumber) || 0)) + 1;
  const startDay = currentDay(state);
  state.goalStats.tradingChallenge = {
    id: `trade:${startDay}:${attemptNumber}`,
    attemptNumber,
    startDay,
    endDay: startDay + TRADING_CHALLENGE_RULES.windowDays - 1,
    profit: 0,
    saleDays: [],
    soldCropIds: [],
    won: false
  };
  return true;
}

// Call only for a seed purchased and placed now. Inventory seedlings have no
// reliable acquisition date, so inherited inventory cannot enter the ledger.
export function withTradingChallengeCropMeta(state, meta, { seedCost } = {}) {
  const attempt = getAttempt(state);
  if (!attempt || getTradingChallengeView(state).status !== 'active'
    || !Number.isFinite(seedCost) || seedCost <= 0) return meta;
  return { ...(meta || {}), tradingChallengeId: attempt.id };
}

// Economic settlement supplies the captured crop metadata before saving.
// Cosmetic rewards and resales never call it. Farm 2's extra multiplier is
// removed so the same market trade contributes equally on either farm.
export function recordTradingChallengeSale(state, {
  cropMeta,
  cropId,
  revenue,
  farmMultiplier = 1,
  costBasis,
  costBasisKnown
} = {}) {
  const attempt = getAttempt(state);
  if (!attempt || getTradingChallengeView(state).status !== 'active'
    || cropMeta?.tradingChallengeId !== attempt.id
    || typeof cropId !== 'string' || !cropId
    || costBasisKnown !== true
    || !Number.isFinite(revenue) || revenue < 0
    || !Number.isFinite(costBasis) || costBasis < 0
    || !Number.isFinite(farmMultiplier) || farmMultiplier < 1) return false;
  if (!Array.isArray(attempt.soldCropIds)) attempt.soldCropIds = [];
  if (attempt.soldCropIds.includes(cropId)) return false;
  if (!Array.isArray(attempt.saleDays)) attempt.saleDays = [];
  const day = currentDay(state);
  if (day < attempt.startDay || day > attempt.endDay) return false;
  attempt.soldCropIds.push(cropId);
  attempt.profit = (Number(attempt.profit) || 0) + revenue / farmMultiplier - costBasis;
  if (!attempt.saleDays.includes(day)) attempt.saleDays.push(day);
  if (attempt.profit >= TRADING_CHALLENGE_RULES.targetProfit - 1e-9
    && attempt.saleDays.length >= TRADING_CHALLENGE_RULES.targetSaleDays) {
    attempt.won = true;
  }
  return true;
}
