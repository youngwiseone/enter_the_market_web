export function createSessionRuntimeController(deps) {
  const {
    playtestStats,
    startPlaytimeTrackingAction,
    getActivePlaytimeMsAction,
    formatPlaytimeAction,
    formatMoneyAction,
    getGrowablePlantCountAction,
    getGoalsSummaryAction,
    buildFeedbackStringAction,
    setFeedbackModalOpenDom,
    copyFeedbackTextAction,
    BUILD_VERSION,
    state,
    getFarmState,
    FARM_PRIMARY_ID,
    FARM_SECONDARY_ID,
    goalCelebrationController,
    isDailyRollOpenDom,
    setDailyRollOpenDom,
    continueDailyRollModalAction,
    setDaySummaryOpenDom,
    showDaySummaryModalDom,
    continueDaySummaryModalAction,
    showDailyMarketRollModalAction,
    getUnlockedRollItems,
    getHarvestImagePath,
    moveFocusOutsideModal,
    isReduceMotion,
    onDailyRollClosed
  } = deps;

  let dailyRollAnimationToken = 0;
  let dailyRollCanContinue = false;
  let dailyRollSkipRequested = false;

  function startPlaytimeTracking() {
    startPlaytimeTrackingAction(playtestStats, {
      onPersistSessionMs: (sessionMs) => {
        if (typeof deps.onPersistSessionPlaytimeMs === 'function') {
          deps.onPersistSessionPlaytimeMs(sessionMs);
        }
      }
    });
  }

  function getActivePlaytimeMs() {
    return getTotalPlaytimeMs();
  }

  function getTotalPlaytimeMs() {
    const persistedBase = Math.max(0, Number(state.totalPlaytimeMs) || 0);
    return persistedBase + getActivePlaytimeMsAction(playtestStats);
  }

  function formatPlaytime(ms) {
    return formatPlaytimeAction(ms);
  }

  function formatMoney(value) {
    return formatMoneyAction(value);
  }

  function getGrowablePlantCount() {
    return getGrowablePlantCountAction({
      state,
      getFarmState,
      FARM_PRIMARY_ID,
      FARM_SECONDARY_ID
    });
  }

  function getGoalsSummary() {
    return getGoalsSummaryAction(state);
  }

  function buildFeedbackString() {
    return buildFeedbackStringAction({
      BUILD_VERSION,
      state,
      getActivePlaytimeMs,
      formatPlaytime,
      formatMoney,
      getGrowablePlantCount,
      getGoalsSummary
    });
  }

  function setFeedbackModalOpen(isOpen) {
    setFeedbackModalOpenDom(isOpen);
  }

  async function copyFeedbackText(text) {
    return copyFeedbackTextAction(text);
  }

  function isGoalCelebrationOpen() {
    return goalCelebrationController.isGoalCelebrationOpen();
  }

  function clearGoalCelebrationSparkles() {
    goalCelebrationController.clearGoalCelebrationSparkles();
  }

  function setGoalCelebrationOpen(isOpen) {
    goalCelebrationController.setGoalCelebrationOpen(isOpen);
  }

  function enqueueGoalCelebration(goal) {
    goalCelebrationController.enqueueGoalCelebration(goal);
  }

  function showNextGoalCelebration() {
    goalCelebrationController.showNextGoalCelebration();
  }

  function continueGoalCelebration() {
    goalCelebrationController.continueGoalCelebration();
  }

  function isDailyRollOpen() {
    return isDailyRollOpenDom();
  }

  function setDailyRollOpen(isOpen) {
    setDailyRollOpenDom(isOpen, moveFocusOutsideModal);
  }

  function continueDailyRollModal() {
    if (!dailyRollCanContinue) {
      dailyRollSkipRequested = true;
      return false;
    }
    continueDailyRollModalAction({
      setDailyRollOpen,
      incrementDailyRollAnimationToken: () => {
        dailyRollAnimationToken += 1;
        return dailyRollAnimationToken;
      }
    });
    dailyRollCanContinue = false;
    if (typeof onDailyRollClosed === 'function') {
      onDailyRollClosed();
    }
    return true;
  }

  function requestDailyRollSkip() {
    if (!isDailyRollOpen() || dailyRollCanContinue) return false;
    dailyRollSkipRequested = true;
    return true;
  }

  function consumeDailyRollSkipRequested() {
    const value = dailyRollSkipRequested;
    dailyRollSkipRequested = false;
    return value;
  }

  function canContinueDailyRoll() {
    return dailyRollCanContinue;
  }

  function setDaySummaryOpen(isOpen) {
    setDaySummaryOpenDom(isOpen, moveFocusOutsideModal);
  }

  function showDaySummaryModal(summary) {
    showDaySummaryModalDom(summary, setDaySummaryOpen);
  }

  function continueDaySummaryModal() {
    continueDaySummaryModalAction(setDaySummaryOpen);
  }

  async function showDailyMarketRollModal(rollResult, summaryText, fatiguePercent = 0, daySummary = null) {
    dailyRollCanContinue = false;
    dailyRollSkipRequested = false;
    await showDailyMarketRollModalAction({
      rollResult,
      summaryText,
      fatiguePercent,
      daySummary,
      getUnlockedRollItems,
      getHarvestImagePath,
      getCurrentDailyRollAnimationToken: () => dailyRollAnimationToken,
      incrementDailyRollAnimationToken: () => {
        dailyRollAnimationToken += 1;
        return dailyRollAnimationToken;
      },
      consumeDailyRollSkipRequested,
      setDailyRollCanContinue: (value) => {
        dailyRollCanContinue = !!value;
      },
      isDailyRollOpen,
      setDailyRollOpen,
      isReduceMotion
    });
  }

  return {
    startPlaytimeTracking,
    getActivePlaytimeMs,
    getTotalPlaytimeMs,
    formatPlaytime,
    buildFeedbackString,
    setFeedbackModalOpen,
    copyFeedbackText,
    isGoalCelebrationOpen,
    clearGoalCelebrationSparkles,
    setGoalCelebrationOpen,
    enqueueGoalCelebration,
    showNextGoalCelebration,
    continueGoalCelebration,
    isDailyRollOpen,
    canContinueDailyRoll,
    requestDailyRollSkip,
    continueDailyRollModal,
    continueDaySummaryModal,
    showDaySummaryModal,
    showDailyMarketRollModal
  };
}
