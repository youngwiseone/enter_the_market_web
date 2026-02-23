export function attachCoreEventHandlers(deps) {
  const {
    showTab,
    buildFeedbackString,
    copyFeedbackText,
    setFeedbackModalOpen,
    continueGoalCelebration,
    continueDailyRollModal,
    continueDaySummaryModal,
    resetGame,
    nextDay,
    clearShopSelection,
    triggerFxClass,
    setActiveTool,
    handleFarmToggleButtonClick,
    installFarmPointerHandlers,
    getSelectedGridCellIndex,
    getSelectedGridCellIndices,
    state,
    clearGridSelection,
    setMessageJustEmitted,
    toggleLicenseAndCreator,
    isDailyRollOpen,
    canContinueDailyRoll,
    requestDailyRollSkip,
    isGoalCelebrationOpen,
    TOOL_GLOVE,
    TOOL_PICKAXE,
    TOOL_WATERING
  } = deps;

  document.querySelectorAll('[data-main-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      const tabName = String(button.getAttribute('data-main-tab') || '').trim();
      if (!tabName) return;
      showTab(tabName);
    });
  });
  const feedbackButton = document.getElementById('feedbackButton');
  if (feedbackButton) {
    feedbackButton.addEventListener('click', async (event) => {
      event.preventDefault();
      const text = buildFeedbackString();
      const textarea = document.getElementById('feedback-textarea');
      if (textarea) textarea.value = text;
      setFeedbackModalOpen(true);
      await copyFeedbackText(text);
      const url = feedbackButton.getAttribute('href');
      if (url) window.open(url, '_blank', 'noopener');
    });
  }
  const feedbackCopy = document.getElementById('feedback-copy');
  if (feedbackCopy) {
    feedbackCopy.addEventListener('click', async () => {
      const textarea = document.getElementById('feedback-textarea');
      const text = textarea ? textarea.value : buildFeedbackString();
      await copyFeedbackText(text);
    });
  }
  const feedbackClose = document.getElementById('feedback-close');
  if (feedbackClose) feedbackClose.addEventListener('click', () => setFeedbackModalOpen(false));
  const feedbackModal = document.getElementById('feedback-modal');
  if (feedbackModal) {
    feedbackModal.addEventListener('click', (event) => {
      if (event.target === feedbackModal) setFeedbackModalOpen(false);
    });
  }
  const goalCelebrationContinueButton = document.getElementById('goal-celebration-continue');
  if (goalCelebrationContinueButton) {
    goalCelebrationContinueButton.addEventListener('click', () => continueGoalCelebration());
  }
  const goalCelebrationModal = document.getElementById('goal-celebration-modal');
  if (goalCelebrationModal) {
    goalCelebrationModal.addEventListener('click', (event) => {
      if (event.target === goalCelebrationModal) event.preventDefault();
    });
  }
  const dailyRollContinueButton = document.getElementById('daily-roll-continue');
  if (dailyRollContinueButton) {
    dailyRollContinueButton.addEventListener('click', () => continueDailyRollModal());
  }
  const dailyRollModal = document.getElementById('daily-roll-modal');
  if (dailyRollModal) {
    dailyRollModal.addEventListener('click', (event) => {
      if (!isDailyRollOpen()) return;
      const target = event.target;
      if (target instanceof Element && target.closest('#daily-roll-continue')) return;
      event.preventDefault();
      if (canContinueDailyRoll()) {
        continueDailyRollModal();
      } else {
        requestDailyRollSkip();
      }
    });
  }
  const daySummaryContinueButton = document.getElementById('day-summary-continue');
  if (daySummaryContinueButton) {
    daySummaryContinueButton.addEventListener('click', () => continueDaySummaryModal());
  }
  const daySummaryModal = document.getElementById('day-summary-modal');
  if (daySummaryModal) {
    daySummaryModal.addEventListener('click', (event) => {
      if (event.target === daySummaryModal) continueDaySummaryModal();
    });
  }
  document.getElementById('reset-game').onclick = resetGame;
  document.getElementById('next-day').onclick = nextDay;

  document.querySelectorAll('.tool-button[data-tool]').forEach((button) => {
    button.addEventListener('click', () => {
      const tool = button.getAttribute('data-tool');
      if (tool === TOOL_WATERING || tool === TOOL_PICKAXE) clearShopSelection();
      triggerFxClass(button, 'fx-pop');
      setActiveTool(tool);
    });
  });

  const farmToggleButton = document.getElementById('farm-toggle-button');
  if (farmToggleButton) {
    farmToggleButton.addEventListener('click', () => {
      triggerFxClass(farmToggleButton, 'fx-pop');
      handleFarmToggleButtonClick();
    });
  }

  installFarmPointerHandlers();
  document.addEventListener('click', (event) => {
    if (state.runtimeFlags && state.runtimeFlags.isSellBatchInFlight) return;
    const selectedGridCellIndex = getSelectedGridCellIndex();
    const selectedGridCellIndices = getSelectedGridCellIndices();
    if (selectedGridCellIndex === null && selectedGridCellIndices.size === 0) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('[data-sell-action-button="true"]')) return;
    const gridCell = target.closest('.grid-cell');
    if (gridCell) {
      const indexText = gridCell.getAttribute('data-index');
      const index = Number(indexText);
      if (selectedGridCellIndices.size > 0 && Number.isInteger(index) && selectedGridCellIndices.has(index)) return;
      if (
        selectedGridCellIndices.size === 0
        && Number.isInteger(index)
        && Array.isArray(state.gridItems)
        && !!state.gridItems[index]
      ) {
        return;
      }
    }
    clearGridSelection(true);
  });

  document.addEventListener(
    'click',
    () => {
      setMessageJustEmitted(false);
    },
    true
  );

  document.addEventListener(
    'keydown',
    (event) => {
      const target = event.target;
      const isTextInputTarget = target instanceof Element && (
        target.closest('input, textarea, select') !== null
        || target.getAttribute('contenteditable') === 'true'
      );
      const desktopShortcuts = !!(
        window.matchMedia
        && window.matchMedia('(hover: hover) and (pointer: fine)').matches
      );
      const isTildePress = event.key === '~'
        || (event.key === '`' && event.shiftKey)
        || (event.code === 'Backquote' && event.shiftKey);
      if (isTildePress) {
        event.preventDefault();
        toggleLicenseAndCreator();
        return;
      }
      if (isDailyRollOpen()) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (canContinueDailyRoll()) {
            continueDailyRollModal();
          } else {
            requestDailyRollSkip();
          }
          return;
        }
        if (event.key === 'Tab') return;
        requestDailyRollSkip();
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (isGoalCelebrationOpen()) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          continueGoalCelebration();
          return;
        }
        if (event.key === 'Tab') return;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (!desktopShortcuts || isTextInputTarget) return;
      const summaryModal = document.getElementById('day-summary-modal');
      const isDaySummaryOpen = !!(summaryModal && summaryModal.classList.contains('is-open'));
      if (isDaySummaryOpen) return;
      const key = String(event.key || '').toLowerCase();
      if (key === 'z') {
        event.preventDefault();
        setActiveTool(TOOL_GLOVE);
        return;
      }
      if (key === 'x') {
        event.preventDefault();
        setActiveTool(TOOL_WATERING);
        return;
      }
      if (key === 'c') {
        event.preventDefault();
        setActiveTool(TOOL_PICKAXE);
        return;
      }
      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault();
        nextDay();
      }
    },
    true
  );
}
