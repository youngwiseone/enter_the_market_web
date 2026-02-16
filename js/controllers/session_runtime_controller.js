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
    isReduceMotion
  } = deps;

  let dailyRollAnimationToken = 0;

  function startPlaytimeTracking() {
    startPlaytimeTrackingAction(playtestStats);
  }

  function getActivePlaytimeMs() {
    return getActivePlaytimeMsAction(playtestStats);
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
    continueDailyRollModalAction({
      state,
      setDailyRollOpen,
      showDaySummaryModal,
      incrementDailyRollAnimationToken: () => {
        dailyRollAnimationToken += 1;
        return dailyRollAnimationToken;
      }
    });
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

  async function showDailyMarketRollModal(rollResult, summaryText, fatiguePercent = 0) {
    await showDailyMarketRollModalAction({
      rollResult,
      summaryText,
      fatiguePercent,
      getUnlockedRollItems,
      getHarvestImagePath,
      getCurrentDailyRollAnimationToken: () => dailyRollAnimationToken,
      incrementDailyRollAnimationToken: () => {
        dailyRollAnimationToken += 1;
        return dailyRollAnimationToken;
      },
      isDailyRollOpen,
      setDailyRollOpen,
      isReduceMotion
    });
  }

  return {
    startPlaytimeTracking,
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
    continueDailyRollModal,
    continueDaySummaryModal,
    showDaySummaryModal,
    showDailyMarketRollModal
  };
}
