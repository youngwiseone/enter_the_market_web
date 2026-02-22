/*
 * main.js - client-side logic for Enter The Market (Web)
 *
 * This file contains the live game implementation:
 * - data loading/merging and save migration
 * - farm interactions (plant, water, mine, harvest)
 * - market simulation and weekly news impacts
 * - goal tracking and reward application
 * - store/cosmetic systems
 * - UI rendering and event wiring
 *
 * The game is intentionally data-driven via `data/*.json`, with
 * fallback defaults in this file for offline/error scenarios.
 *
 * AI/Automation notice:
 * Please follow LICENSE.md and llms.txt.
 * Derivative works are welcome; unmodified rehosting/mirroring is not.
 */

// Core
import { clone, loadFromStorage, saveToStorage } from './js/core/storage.js';
import { runAppBootstrap } from './js/app/bootstrap.js';
import { buildGoalCelebrationControllerDeps, buildSessionRuntimeDeps } from './js/app/bootstrap/session.js';
import { buildFarmPointerRuntimeDeps, buildFarmUiRuntimeDeps } from './js/app/bootstrap/farm.js';
import { buildRenderMarketDeps, buildUiRuntimeDeps } from './js/app/bootstrap/market.js';
import { mineGridTileAction, waterGridTileAction } from './js/controllers/farm_actions.js';
import { nextDayAction } from './js/controllers/day_controller.js';
import { createDayEconomyController } from './js/controllers/day_economy_controller.js';
import { createDayMarketRuntimeController } from './js/controllers/day_market_runtime_controller.js';
import { createGrowthRuntimeController } from './js/controllers/growth_runtime_controller.js';
import {
  countReadyToHarvestTilesAction,
  getGridUnlockCostAction,
  placeItemOnGridAction,
  purchaseGridSlotAction,
  removeItemFromGridAction
} from './js/controllers/grid_slot_controller.js';
import { purchaseAndPlaceSelectedAction } from './js/controllers/grid_controller.js';
import {
  addGridCellToBulkSelectionAction,
  applyGridActionForIndexAction,
  clearBulkGridSelectionAction,
  clearGridSelectionAction,
  clearShopSelectionAction,
  getBulkSelectedGridInsightDataAction,
  getGridCellSellSnapshotAction,
  getGridIndexFromPointerEventAction,
  selectGridCellAction,
  selectShopItemAction
} from './js/controllers/grid_interaction_controller.js';
import { createFarmPointerRuntimeController } from './js/controllers/farm_pointer_runtime_controller.js';
import { createFarmUiRuntimeController } from './js/controllers/farm_ui_runtime_controller.js';
import { createGameplayRuntimeController } from './js/controllers/gameplay_runtime_controller.js';
import { createMessageRuntimeController } from './js/controllers/message_runtime_controller.js';
import { createSessionRuntimeController } from './js/controllers/session_runtime_controller.js';
import {
  handleFarmToggleButtonClickAction,
  setActiveFarmAction,
  setActiveToolAction,
  updateCursorForToolAction,
  updateFarmToggleButtonAction,
  updateToolButtonsAction
} from './js/controllers/farm_ui_controller.js';
import {
  applyGoalRewardAction,
  doesConditionMeetAction,
  doesGoalMeetConditionAction,
  evaluateGoalsAction,
  getGoalConditionsAction,
  getGoalMetricValueAction
} from './js/controllers/goals_controller.js';
import {
  countPlantedTilesAction,
  getBestBuyOpportunityAction,
  getGuidancePayloadAction,
  getPrimaryGuidedStateAction,
  isGoalsTabUnlockedAction,
  isStoreTabUnlockedAction,
  requestLockedTabAction,
  syncGuidedUnlocksAction
} from './js/controllers/guided_controller.js';
import {
  addResourceToInventoryAction,
  generateNewsEventsAction,
  produceForLevelAction
} from './js/controllers/resource_production.js';
import {
  awardPlayerXpAction,
  calculateGridValueAction,
  calculateInventoryValueAction,
  calculateNetWorthAction,
  clampPlayerLevelAction,
  consumeFreePurchasesAction,
  ensurePlayerProgressStateAction,
  enqueueLevelUpCelebrationAction,
  formatEnergyValueAction,
  getEnergyMaxForLevelAction,
  getFreePurchaseCountAction,
  getItemCurrentPriceAction,
  getXpToNextLevelAction,
  isToolUnlockedAction,
  roundEnergyValueAction,
  updateNetWorthAction
} from './js/controllers/player_progress_controller.js';
import { resetGameAction } from './js/controllers/reset_controller.js';
import {
  harvestPlantAction,
  sellBulkSelectedGridItemsAction,
  sellSelectedGridItemAction
} from './js/controllers/harvest_controller.js';
import {
  applyShopEntryPriceRecoveryStepAction,
  ensureShopEntryMarketFieldsAction,
  getDefaultUnlockedShopItemsAction,
  getGoalRewardUnlockedItemIdsAction,
  getShopEntryAveragePriceAction,
  hasPlayerHandledItemAction,
  isShopEntryPriceRecoveryActiveAction,
  resetShopEntryToBasePriceAction,
  startShopEntryPriceRecoveryAction,
  syncGoalLockedShopUnlocksAction
} from './js/controllers/shop_market_controller.js';
import { buyItemAction, sellItemAction } from './js/controllers/shop_controller.js';
import {
  craftItemAction,
  purchaseCosmeticAction,
  selectCosmeticAction
} from './js/controllers/store_cosmetics.js';

// Dev instrumentation
import { trackActionDuration, trackRenderCall, trackSaveCall } from './js/dev/perf_metrics.js';

// Content
import { DEFAULT_DATA } from './js/content/fallbacks/default_data.js';
import { loadJSONDataIntoDefaults } from './js/content/json_loader.js';
import {
  mergeGoalsWithDefaults,
  mergeItemAssetsWithDefaults,
  mergeStoreCosmeticsWithDefaults
} from './js/content/normalizers.js';
import {
  getHarvestImagePath,
  getPlantStageImagePath,
  resolveResourcePath
} from './js/content/resource_paths.js';

// State
import {
  createEmptyFarmStateForGrid,
  isFarmStateShapeValidForGrid,
  normalizeFarmStateForGrid
} from './js/state/farm_state.js';
import {
  applyFarmStateToActiveGridRuntime,
  getFarmStateRuntime,
  getUnlockedTileCountForFarmRuntime
} from './js/state/farm_runtime.js';
import { hydrateDaySalesState, normalizeDaySalesState } from './js/state/day_sales_state.js';
import { normalizeGoalStateShape } from './js/state/goal_state.js';
import { persistFullState, persistLegacyPrimaryGridState } from './js/state/persistence.js';
import { persistResetState } from './js/state/reset_persistence.js';
import { initialiseStateRuntimeAction, saveStateRuntimeAction } from './js/state/state_runtime_controller.js';
import { initialiseStateAction } from './js/state/state_initializer.js';

// Simulation
import {
  ENERGY_SEGMENT_CAP,
  FARM_PRIMARY_ID,
  FARM_SECONDARY_ID,
  FARM_TWO_BUTTON_REVEAL_TILES_LEFT,
  FARM_TWO_MINING_ENERGY_PER_HIT,
  FARM_TWO_PURCHASE_COST,
  FARM_TWO_SELL_MULTIPLIER,
  GRID_CELL_COUNT,
  GUIDED_FLAGS,
  PLAYER_LEVEL_CAP,
  PRICE_CRASH_THRESHOLD_PERCENT,
  PRICE_RECOVERY_DAYS,
  TOOL_GLOVE,
  TOOL_LIST,
  TOOL_PICKAXE,
  TOOL_WATERING,
  XP_REWARDS
} from './js/sim/constants.js';

import {
  EXPECTED_RARITY_MULTIPLIER,
  getRarityMultiplier,
  normalizeRarity,
  RARITY_MULTIPLIERS,
  rollRarity
} from './js/sim/rarity.js';
import {
  applyDailyMarketRollToShopState,
  generateDailyMarketRollState,
  getBestRollOpportunityTextState,
  getDailyRollSummaryTextState,
  getFatigueFromEnergyState
} from './js/sim/daily_roll.js';
import {
  getDailyRollItemWeightState,
  getHeldQuantityForItemState,
  getMarketDirectionalBiasState,
  getMarketPressureRecordState,
  registerItemSalePressureState,
  updateMarketPressureForNextDayState
} from './js/sim/market_pressure.js';
import { generateNewsEventsForState } from './js/sim/news_events.js';

// UI
import {
  decodeAuthorIdentityToken,
  setCreatorSignatureNodeState,
  setLicenseNoteNodeState
} from './js/ui/creator_license.js';
import { attachCoreEventHandlers } from './js/ui/bindings/core_bindings.js';
import { calculateGoalProgress, renderGoalsPanel } from './js/ui/render_goals.js';
import { copyFeedbackTextAction, setFeedbackModalOpenDom } from './js/ui/feedback_controller.js';
import {
  buildFeedbackStringAction,
  formatMoneyAction,
  formatPlaytimeAction,
  getActivePlaytimeMsAction,
  getGoalsSummaryAction,
  getGrowablePlantCountAction,
  startPlaytimeTrackingAction
} from './js/ui/feedback_build.js';
import {
  renderEnergyBarAction,
  renderHUDAction,
  renderPlayerLevelStatusAction,
  updateTimeOfDayMoodAction
} from './js/ui/render_player.js';
import {
  continueDailyRollModalAction,
  continueDaySummaryModalAction,
  isDailyRollOpenDom,
  isDaySummaryOpenDom,
  setDailyRollOpenDom,
  setDaySummaryOpenDom,
  showDailyMarketRollModalAction,
  showDaySummaryModalDom
} from './js/ui/daily_roll_modal.js';
import { createGoalCelebrationController } from './js/ui/goal_celebration_controller.js';
import { createSeedPacketImageFactory } from './js/ui/seed_packet_image_factory.js';
import {
  getSelectedGridItemInsightDataAction,
  getSelectedShopItemInsightDataAction
} from './js/ui/market_insight_data.js';
import { renderMarketAction } from './js/ui/render_market.js';
import { renderSelectedItemInsightAction } from './js/ui/render_market_insight.js';
import { createMessagesController } from './js/ui/messages_controller.js';
import { renderStorePanel } from './js/ui/render_store.js';
import { renderAllAction } from './js/ui/render_root.js';
import {
  installSidePanelScrollHandlersAction,
  updateGridSizeAction,
  updateSidePanelScrollAreaAction
} from './js/ui/layout_controller.js';
import {
  showTabDom,
  toggleMessagesPanelDom,
  updateMainTabButtonsDom,
  updateMainViewVisibilityDom
} from './js/ui/tab_controller.js';
import { createUiRuntimeController } from './js/ui/ui_runtime_controller.js';
import { installFarmPointerHandlersAction, stopFarmPointerInteractionAction } from './js/ui/farm_pointer_bindings.js';
import {
  getCurrentStoreUnlockIdsAction,
  getNewStoreUnlockCountAction,
  getPendingGoalsCountAction,
  markStoreUnlocksSeenAction,
  renderProfileGoalSummaryAction,
  setTabBadgeCountAction,
  updateTabNotificationBadgesAction
} from './js/ui/notifications_controller.js';
import { createCreatorVisibilityController } from './js/ui/creator_visibility_controller.js';
import { createProfileChatController } from './js/ui/profile_chat_controller.js';
import { getGridActionFxTargetsDom } from './js/ui/grid_fx_targets.js';
import { renderGuidancePanelDom } from './js/ui/render_guidance.js';
import { applyThemeDom } from './js/ui/theme_dom.js';
import { getElementFromPointDom } from './js/ui/pointer_dom.js';
import {
  confirmDialogDom,
  createToolKeyLabelElementDom,
  getDesktopShortcutsEnabledDom,
  getFarmToggleButtonDom,
  getRestButtonDom,
  getToolButtonsDom,
  setBodyCursorDom,
  setDesktopShortcutsClassDom
} from './js/ui/farm_ui_dom.js';

// FX
import { allocParticleFromState, releaseParticleToState } from './js/fx/particle_pool.js';
import { createFxController } from './js/fx/fx_controller.js';

const BUILD_VERSION = 'Web v0.1';
const VERSION_CONTROL = 'eyJkaXNwbGF5TmFtZSI6IkJsaWdoIEhlZGdlcyIsImF1dGhvcklkcyI6WyJ5b3VuZ3dpc2VvbmUiLCJibGlnaGhlZGdlcyJdfQ==';

// ----------- Data Definitions -----------

/*
 * Fallback default data for player/items/shop/goals/store.
 * Runtime JSON loading can override these values. Keep fallback defaults
 * aligned with `data/*.json` so behavior remains consistent if fetch fails.
 */
// Fallback defaults moved to js/content/fallbacks/default_data.js
// ----------- Data Loading Functions -----------

/**
 * Fetch JSON data for items and news from the data directory. After
 * fetching, update DEFAULT_DATA.items, DEFAULT_DATA.shop and
 * DEFAULT_DATA.newsEvents so that subsequent initialisation will
 * populate these values if localStorage does not already contain
 * them. Quantities for shop stock are generated based on item
 * categories: Food items default to 100 units, Metal items 50 and
 * others 200 units.
 */
async function loadJSONData() {
  await loadJSONDataIntoDefaults(DEFAULT_DATA);
  if (messagesController && typeof messagesController.setMessageDefinitions === 'function') {
    messagesController.setMessageDefinitions(DEFAULT_DATA.messages);
  }
}

// Internal state used at runtime. Loaded from localStorage or seeded
// from DEFAULT_DATA on first run.
let state = {
  player: null,
  items: null,
  shop: null,
  inventory: null,
  newsEvents: null,
  store: null,
  goals: null,
  goalsClaimed: null,
  unlockedTools: null,
  unlockedShopItems: null,
  freePurchasesByItem: null,
  goalFlags: null,
  goalStats: null,
  dayActionCount: 0,
  dailyMarketRollHistory: null,
  lastRollFatiguePercent: 0,
  lastRollImpactMultiplier: 1,
  dayStartSnapshot: null,
  goalCelebrationQueue: [],
  activeGoalCelebration: null,
  daySalesCount: 0,
  daySalesTotal: 0,
  dayTopSale: null,
  dayItemSales: null,
  marketPressureByItem: null,
  daySummaryHistory: [],
  pendingDaySummary: null,
  gridPurchasePrice: null,
  farms: null,
  activeFarmId: 1,
  secondFarmPurchased: false
};

const playtestStats = {
  activeMs: 0,
  lastActiveAt: null
};

const seedPacketImageFactory = createSeedPacketImageFactory({
  onComposedImageReady: () => {
    renderMarket();
    updateCursorForTool();
  }
});

function getShopSeedVisualPath(item) {
  return seedPacketImageFactory.getSeedVisualPath(item);
}

function getCursorSeedVisualPath(item) {
  return seedPacketImageFactory.getCursorSeedVisualPath(item);
}

function getLevelUpUnlockSeedImagePayload(item) {
  return seedPacketImageFactory.getSeedPacketUnlockImages(item);
}

function moveFocusOutsideModal(modalEl) {
  const active = document.activeElement;
  if (modalEl && active && modalEl.contains(active) && typeof active.blur === 'function') {
    active.blur();
  }
  const fallback = document.getElementById('market-layout') || document.body;
  if (fallback && typeof fallback.focus === 'function') {
    if (!fallback.hasAttribute('tabindex')) {
      fallback.setAttribute('tabindex', '-1');
    }
    fallback.focus({ preventScroll: true });
  }
}

function getToolDisplayName(tool) {
  switch (tool) {
    case TOOL_GLOVE:
      return 'Glove';
    case TOOL_WATERING:
      return 'Watering Can';
    case TOOL_PICKAXE:
      return 'Pickaxe';
    default:
      return String(tool || 'Tool');
  }
}

const fxController = createFxController({
  resolveResourcePath,
  allocParticleFromState,
  releaseParticleToState
});

const creatorVisibilityController = createCreatorVisibilityController({
  decodeAuthorIdentityToken,
  versionControlToken: VERSION_CONTROL,
  setCreatorSignatureNodeState,
  setLicenseNoteNodeState
});

const growthRuntimeController = createGrowthRuntimeController({
  state,
  normalizeRarity,
  getRarityMultiplier,
  getItemCurrentPrice,
  addMessage,
  rollRarity,
  saveToStorage
});

const goalCelebrationController = createGoalCelebrationController(buildGoalCelebrationControllerDeps({
  state,
  moveFocusOutsideModal,
  isReduceMotion: () => fxController.isReduceMotion(),
  getToolDisplayName
}));

const sessionRuntimeController = createSessionRuntimeController(buildSessionRuntimeDeps({
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
  isReduceMotion: () => fxController.isReduceMotion()
}));

function getPlantGrowthState(item, index) {
  return growthRuntimeController.getPlantGrowthState(item, index);
}

function getDefaultUnlockedTools() {
  return {
    [TOOL_GLOVE]: true,
    [TOOL_PICKAXE]: true,
    [TOOL_WATERING]: false
  };
}

function resetShopEntryToBasePrice(itemId) {
  resetShopEntryToBasePriceAction(state, itemId);
}

function ensureShopEntryMarketFields(entry) {
  return ensureShopEntryMarketFieldsAction(entry);
}

function getShopEntryAveragePrice(entry) {
  return getShopEntryAveragePriceAction(entry);
}

function isShopEntryPriceRecoveryActive(entry) {
  return isShopEntryPriceRecoveryActiveAction(entry);
}

function startShopEntryPriceRecovery(entry, targetPrice) {
  return startShopEntryPriceRecoveryAction(entry, targetPrice, PRICE_RECOVERY_DAYS);
}

function applyShopEntryPriceRecoveryStep(entry) {
  return applyShopEntryPriceRecoveryStepAction(entry, isShopEntryPriceRecoveryActive);
}

function getDefaultUnlockedShopItems(items) {
  return getDefaultUnlockedShopItemsAction(items, state.player?.playerLevel);
}

function getGoalRewardUnlockedItemIds(goal) {
  return getGoalRewardUnlockedItemIdsAction(goal);
}

function hasPlayerHandledItem(itemId) {
  return hasPlayerHandledItemAction(state, itemId);
}

function syncGoalLockedShopUnlocks() {
  return syncGoalLockedShopUnlocksAction(
    state,
    getGoalRewardUnlockedItemIds,
    hasPlayerHandledItem,
    resetShopEntryToBasePrice
  );
}

function unlockShopItemForLevel(level) {
  const unlockOrder = Array.isArray(state.items)
    ? state.items
      .filter((item) => item && typeof item.id === 'number')
      .slice()
      .sort((a, b) => {
        const aPrice = Math.max(0, Number(a?.price) || 0);
        const bPrice = Math.max(0, Number(b?.price) || 0);
        if (aPrice !== bPrice) return aPrice - bPrice;
        return a.id - b.id;
      })
      .map((item) => item.id)
    : [];
  const unlockItemId = unlockOrder[Math.max(0, Math.floor(Number(level) || 1) - 1)];
  if (!Number.isInteger(unlockItemId)) return null;
  const wasUnlocked = !!(state.unlockedShopItems && state.unlockedShopItems[unlockItemId]);
  syncGoalLockedShopUnlocks();
  const isUnlocked = !!(state.unlockedShopItems && state.unlockedShopItems[unlockItemId]);
  if (!isUnlocked || wasUnlocked) return null;
  const item = Array.isArray(state.items) ? state.items.find((it) => it && it.id === unlockItemId) : null;
  if (!item) return null;
  return {
    id: item.id,
    name: item.name || `Item ${item.id}`,
    imageSrc: getShopSeedVisualPath(item) || 'resources/profiles/player_level_up.png',
    imageAlt: item.name || `Item ${item.id}`,
    ...getLevelUpUnlockSeedImagePayload(item)
  };
}

function isToolUnlocked(tool) {
  return isToolUnlockedAction(state, tool, TOOL_GLOVE);
}

function isShopItemUnlocked(itemId) {
  return !!(state.unlockedShopItems && state.unlockedShopItems[itemId]);
}

function getFreePurchaseCount(itemId) {
  return getFreePurchaseCountAction(state, itemId);
}

function consumeFreePurchases(itemId, quantity) {
  return consumeFreePurchasesAction(state, itemId, quantity, getFreePurchaseCount);
}

function getItemCurrentPrice(itemId) {
  return getItemCurrentPriceAction(state, itemId);
}

function calculateInventoryValue() {
  return calculateInventoryValueAction(state, getItemCurrentPrice);
}

function calculateGridValue() {
  return calculateGridValueAction(state, getItemCurrentPrice);
}

function calculateNetWorth() {
  return calculateNetWorthAction(state, calculateInventoryValue, calculateGridValue);
}

function updateNetWorth() {
  return updateNetWorthAction(state, calculateNetWorth);
}

function clampPlayerLevel(levelRaw) {
  return clampPlayerLevelAction(levelRaw, PLAYER_LEVEL_CAP);
}

function getXpToNextLevel(levelRaw) {
  return getXpToNextLevelAction(levelRaw, clampPlayerLevel);
}

function roundEnergyValue(valueRaw) {
  return roundEnergyValueAction(valueRaw);
}

function formatEnergyValue(valueRaw) {
  return formatEnergyValueAction(valueRaw, roundEnergyValue);
}

function getEnergyMaxForLevel(levelRaw) {
  return getEnergyMaxForLevelAction(levelRaw, clampPlayerLevel);
}

function ensurePlayerProgressState() {
  ensurePlayerProgressStateAction(
    state,
    clampPlayerLevel,
    getXpToNextLevel,
    getEnergyMaxForLevel,
    roundEnergyValue,
    PLAYER_LEVEL_CAP
  );
}

function enqueueLevelUpCelebration(level, changeText, unlockedItem = null, rollCelebrationText = '') {
  enqueueLevelUpCelebrationAction(
    state,
    level,
    changeText,
    sessionRuntimeController.showNextGoalCelebration,
    unlockedItem,
    rollCelebrationText
  );
}

function awardPlayerXp(amount, options = {}) {
  return awardPlayerXpAction(amount, options, {
    state,
    ensurePlayerProgressState,
    playerLevelCap: PLAYER_LEVEL_CAP,
    getXpToNextLevel,
    getEnergyMaxForLevel,
    formatEnergyValue,
    addMessage,
    unlockShopItemForLevel,
    enqueueLevelUpCelebration,
    showXpGainFeedback
  });
}

function getGoalMetricValue(metric) {
  return getGoalMetricValueAction({
    state,
    metric,
    calculateNetWorth,
    getUnlockedTileCountForFarm,
    FARM_PRIMARY_ID,
    FARM_SECONDARY_ID
  });
}

function getGoalConditions(goal) {
  return getGoalConditionsAction(goal);
}

function doesConditionMeet(condition) {
  return doesConditionMeetAction({
    condition,
    getGoalMetricValue
  });
}

function doesGoalMeetCondition(goal) {
  return doesGoalMeetConditionAction({
    goal,
    getGoalConditions,
    doesConditionMeet
  });
}

function applyGoalReward(goal) {
  return applyGoalRewardAction({
    state,
    goal,
    updateNetWorth,
    TOOL_LIST,
    getFreePurchaseCount
  });
}

function evaluateGoals() {
  return evaluateGoalsAction({
    state,
    getGoalProgress,
    addMessage,
    doesGoalMeetCondition,
    applyGoalReward,
    awardPlayerXp,
    XP_REWARDS,
    enqueueGoalCelebration: sessionRuntimeController.enqueueGoalCelebration,
    isToolUnlocked,
    TOOL_GLOVE,
    saveState,
    updateToolButtons,
    updateCursorForTool
  });
}

function createEmptyFarmState() {
  return createEmptyFarmStateForGrid(GRID_CELL_COUNT);
}

function normalizeFarmState(rawFarm) {
  return normalizeFarmStateForGrid(rawFarm, GRID_CELL_COUNT);
}

function isFarmStateShapeValid(farm) {
  return isFarmStateShapeValidForGrid(farm, GRID_CELL_COUNT);
}

function getFarmState(farmId) {
  return getFarmStateRuntime(state, farmId, {
    farmPrimaryId: FARM_PRIMARY_ID,
    farmSecondaryId: FARM_SECONDARY_ID,
    gridCellCount: GRID_CELL_COUNT
  });
}

function applyFarmStateToActiveGrid(farmId) {
  applyFarmStateToActiveGridRuntime(state, farmId, {
    farmPrimaryId: FARM_PRIMARY_ID,
    farmSecondaryId: FARM_SECONDARY_ID,
    gridCellCount: GRID_CELL_COUNT
  });
}

function getUnlockedTileCountForFarm(farmId) {
  return getUnlockedTileCountForFarmRuntime(state, farmId, {
    farmPrimaryId: FARM_PRIMARY_ID,
    farmSecondaryId: FARM_SECONDARY_ID,
    gridCellCount: GRID_CELL_COUNT
  });
}

function isFarmOneFullyUnlocked() {
  return getUnlockedTileCountForFarm(FARM_PRIMARY_ID) >= GRID_CELL_COUNT;
}

function isFarmTwoPurchased() {
  return !!state.secondFarmPurchased;
}

function getActiveFarmSellMultiplier() {
  return state.activeFarmId === FARM_SECONDARY_ID ? FARM_TWO_SELL_MULTIPLIER : 1;
}

function getActiveFarmMiningEnergyCost() {
  return state.activeFarmId === FARM_SECONDARY_ID ? FARM_TWO_MINING_ENERGY_PER_HIT : 1;
}

function decodeAuthorIdentity() {
  return creatorVisibilityController.decodeAuthorIdentity();
}

function toggleCreatorSignature() {
  creatorVisibilityController.toggleCreatorSignature();
}

function setCreatorSignatureVisible(isVisible) {
  creatorVisibilityController.setCreatorSignatureVisible(isVisible);
}

function toggleLicenseNote() {
  creatorVisibilityController.toggleLicenseNote();
}

function setLicenseNoteVisible(isVisible) {
  creatorVisibilityController.setLicenseNoteVisible(isVisible);
}

function toggleLicenseAndCreator() {
  creatorVisibilityController.toggleLicenseAndCreator();
}

function addRareGrowthMessage(item, rarity) {
  growthRuntimeController.addRareGrowthMessage(item, rarity);
}

// ----------- Utility Functions -----------

/**
 * Initialise state by loading from localStorage or falling back to
 * DEFAULT_DATA. This function should be called once on page load.
 */
function initialiseState() {
  initialiseStateRuntimeAction({
    initialiseStateAction,
    state,
    loadFromStorage,
    clone,
    DEFAULT_DATA,
    getDefaultUnlockedTools,
    getDefaultUnlockedShopItems,
    hydrateDaySalesState,
    ensurePlayerProgressState,
    mergeItemAssetsWithDefaults,
    mergeStoreCosmeticsWithDefaults,
    mergeGoalsWithDefaults,
    normalizeRarity,
    saveToStorage,
    saveState,
    normalizeFarmState,
    FARM_PRIMARY_ID,
    FARM_SECONDARY_ID,
    getUnlockedTileCountForFarm,
    getFarmState,
    createEmptyFarmState,
    isFarmTwoPurchased,
    applyFarmStateToActiveGrid,
    TOOL_LIST,
    TOOL_GLOVE,
    syncGoalLockedShopUnlocks,
    ensureShopEntryMarketFields,
    normalizeGoalStateShape,
    normalizeDaySalesState,
    isToolUnlocked,
    TOOL_WATERING,
    getCurrentDaySnapshot,
    setSelectedGridCellIndex: (index) => {
      selectedGridCellIndex = index;
    },
    setSelectedShopItemId: (itemId) => {
      selectedShopItemId = itemId;
    },
    setSelectionPulseId: (itemId) => {
      selectionPulseId = itemId;
    },
    clearGoalCelebrationSparkles: sessionRuntimeController.clearGoalCelebrationSparkles,
    setGoalCelebrationOpen: sessionRuntimeController.setGoalCelebrationOpen
  });
}

/**
 * Persist the current state back to localStorage. Invoke this after
 * any mutation to player data, shop, inventory, reports, or news.
 */
function saveState() {
  saveStateRuntimeAction({
    trackSaveCall,
    updateNetWorth,
    getFarmState,
    createEmptyFarmState,
    isFarmTwoPurchased,
    state,
    FARM_PRIMARY_ID,
    FARM_SECONDARY_ID,
    persistFullState,
    persistLegacyPrimaryGridState,
    saveToStorage
  });
}

/**
 * Reset the game to default values. Clears all data from localStorage
 * and resets the in‑memory state. This is triggered from the Store tab
 * when the user opts to reset their progress. A confirmation dialog
 * protects against accidental resets. You can further enhance this by
 * requiring the user to type a phrase before resetting.
 */
async function resetGame() {
  await resetGameAction({
    state,
    loadJSONData,
    initialiseState,
    createEmptyFarmState,
    FARM_PRIMARY_ID,
    FARM_SECONDARY_ID,
    applyFarmStateToActiveGrid,
    TOOL_GLOVE,
    clone,
    defaultGoals: DEFAULT_DATA.goals,
    getDefaultUnlockedTools,
    getDefaultUnlockedShopItems,
    persistResetState,
    saveToStorage,
    renderAll,
    updateToolButtons,
    updateCursorForTool,
    addMessage,
    saveState,
    clearGoalCelebrationSparkles: sessionRuntimeController.clearGoalCelebrationSparkles,
    setGoalCelebrationOpen: sessionRuntimeController.setGoalCelebrationOpen,
    confirmDialog: confirmDialogDom,
    clearStorage: () => localStorage.clear()
  });
}

// ----------- UI Rendering Functions -----------

/**
 * Render the HUD elements (day, cash, storage, net worth). Uses the
 * current state to populate values. Use to update the top bar after
 * each game tick or transaction.
 */
function renderHUD() {
  renderHUDAction({
    state,
    ensurePlayerProgressState,
    updateNetWorth,
    renderPlayerLevelStatus
  });
}

function renderEnergyBar() {
  renderEnergyBarAction({
    state,
    ENERGY_SEGMENT_CAP,
    roundEnergyValue,
    formatEnergyValue,
    renderPlayerLevelStatus,
    updateTimeOfDayMood
  });
}

function renderPlayerLevelStatus() {
  renderPlayerLevelStatusAction({
    state,
    ensurePlayerProgressState,
    PLAYER_LEVEL_CAP,
    getXpToNextLevel
  });
}

function getGridRarity(index) {
  return growthRuntimeController.getGridRarity(index);
}

function assignGridRarity(index) {
  return growthRuntimeController.assignGridRarity(index);
}

/**
 * Render the Farmer's Market tab. Populates the shop and inventory tables with
 * current data and sets up buy/sell controls. This function
 * reconstructs the DOM each time it runs; for better performance you
 * could diff the tables or reuse elements.
 */
function renderMarket() {
  renderMarketAction(buildRenderMarketDeps({
    state,
    FARM_SECONDARY_ID,
    GRID_CELL_COUNT,
    getSelectedShopItemId: () => selectedShopItemId,
    setSelectedShopItemId: (itemId) => {
      selectedShopItemId = itemId;
    },
    getSelectedGridCellIndex: () => selectedGridCellIndex,
    setSelectedGridCellIndex: (cellIndex) => {
      selectedGridCellIndex = cellIndex;
    },
    selectedGridCellIndices,
    getSelectionPulseId: () => selectionPulseId,
    setSelectionPulseId: (itemId) => {
      selectionPulseId = itemId;
    },
    updateFarmToggleButton,
    isShopItemUnlocked,
    getGridCellSellSnapshot,
    getShopSeedVisualPath,
    getFreePurchaseCount,
    selectShopItem,
    getPlantGrowthState,
    getHarvestImagePath,
    getPlantStageImagePath,
    getGridRarity,
    assignGridRarity,
    normalizeRarity,
    addRareGrowthMessage,
    addMessage,
    getRarityMultiplier,
    getActiveFarmSellMultiplier,
    farmPointerState: farmPointerRuntimeController.getFarmPointerState(),
    applyGridActionForIndex,
    renderSelectedItemInsight,
    renderGuidancePanel
  }));
}

/**
 * Render the Store tab. Handles sub‑tabs for cosmetics and crafting.
 * Based on the selected sub‑tab, the store content
 * area is populated accordingly. Buttons to buy or select items call
 * into functions that update state and persist changes.
 */
const uiRuntimeController = createUiRuntimeController(buildUiRuntimeDeps({
  state,
  trackRenderCall,
  trackActionDuration,
  renderStorePanel,
  calculateGoalProgress,
  renderGoalsPanel,
  updateMainViewVisibilityDom,
  updateMainTabButtonsDom,
  toggleMessagesPanelDom,
  showTabDom,
  renderAllAction,
  getPendingGoalsCountAction,
  getCurrentStoreUnlockIdsAction,
  markStoreUnlocksSeenAction,
  getNewStoreUnlockCountAction,
  setTabBadgeCountAction,
  updateTabNotificationBadgesAction,
  renderProfileGoalSummaryAction,
  purchaseCosmetic,
  selectCosmetic,
  craftItem,
  getGoalConditions,
  getGoalMetricValue,
  doesConditionMeet,
  isStoreTabUnlocked,
  isGoalsTabUnlocked,
  updateGridSize,
  syncGuidedUnlocks,
  requestLockedTab,
  renderMarket,
  renderSelectedItemInsight,
  renderGuidancePanel,
  renderEnergyBar,
  isShopItemUnlocked,
  doesGoalMeetCondition,
  renderHUD,
  updateTimeOfDayMood
}));

function renderStore() {
  uiRuntimeController.renderStore();
}

function getGoalProgress(goal) {
  return uiRuntimeController.getGoalProgress(goal);
}

function renderGoals() {
  uiRuntimeController.renderGoals();
}

function updateMainViewVisibility() {
  uiRuntimeController.updateMainViewVisibility();
}

function updateMainTabButtons() {
  uiRuntimeController.updateMainTabButtons();
}

function toggleMessagesPanel() {
  uiRuntimeController.toggleMessagesPanel();
}

function showTab(tabName) {
  uiRuntimeController.showTab(tabName);
}

function renderAll() {
  uiRuntimeController.renderAll();
}

function updateSidePanelScrollArea() {
  updateSidePanelScrollAreaAction();
}

function installSidePanelScrollHandlers() {
  installSidePanelScrollHandlersAction();
}

function updateGridSize() { 
  updateGridSizeAction(resizeFxCanvas, updateSidePanelScrollArea);
} 

// ----------- FX Utilities -----------
function initFxLayer() {
  fxController.initFxLayer();
}

function resizeFxCanvas() {
  fxController.resizeFxCanvas();
}

function setReduceMotion(enabled) {
  fxController.setReduceMotion(enabled);
}

function spawnBurst(options) {
  fxController.spawnBurst(options);
}

function spawnRing(options) {
  fxController.spawnRing(options);
}

function spawnCoinTravel(from, to, count) {
  fxController.spawnCoinTravel(from, to, count);
}

function spawnCoinsForSaleValue(amount, from, to) {
  fxController.spawnCoinsForSaleValue(amount, from, to);
}

function playSellItemsToButton(cellEntries, preferredButtonElement = null, options = null) {
  return fxController.playSellItemsToButton(cellEntries, preferredButtonElement, options);
}

function triggerFxClass(element, className) {
  fxController.triggerFxClass(element, className);
}

function getTileCenter(index) {
  return fxController.getTileCenter(index);
}

function getHudCenters() {
  return fxController.getHudCenters();
}

function pulseHud(isGain) {
  fxController.pulseHud(isGain);
}

function spawnFloatingText(options) {
  fxController.spawnFloatingText(options);
}

function showXpGainFeedback(xpGain, center, delayMs = 0) {
  fxController.showXpGainFeedback(xpGain, center, delayMs);
}

function playDayTransition() {
  fxController.playDayTransition();
}

const profileChatController = createProfileChatController();
const HOLDING_LOT_THRESHOLD = 4;
const HOLD_BIAS_STREAK_DAYS = 8;
const HOLD_BIAS_QTY_RANGE = 12;
const SELL_SHOCK_QTY_RANGE = 10;

function getProfileImage(speaker, emotion) {
  return profileChatController.getProfileImage(speaker, emotion);
}

function setChatProfile(speaker, emotion) {
  profileChatController.setChatProfile(speaker, emotion);
}

function showProfileMessageBubble(text) {
  profileChatController.showProfileMessageBubble(text);
}

function hideProfileMessageBubbleImmediately() {
  profileChatController.hideProfileMessageBubbleImmediately();
}

function getPendingGoalsCount() {
  return uiRuntimeController.getPendingGoalsCount();
}

function getCurrentStoreUnlockIds() {
  return uiRuntimeController.getCurrentStoreUnlockIds();
}

function markStoreUnlocksSeen() {
  uiRuntimeController.markStoreUnlocksSeen();
}

function getNewStoreUnlockCount() {
  return uiRuntimeController.getNewStoreUnlockCount();
}

function setTabBadgeCount(badgeId, count) {
  uiRuntimeController.setTabBadgeCount(badgeId, count);
}

function updateTabNotificationBadges() {
  uiRuntimeController.updateTabNotificationBadges();
}

function renderProfileGoalSummary() {
  uiRuntimeController.renderProfileGoalSummary();
}

function countPlantedTiles() {
  return countPlantedTilesAction(state);
}

function getPrimaryGuidedState() {
  return getPrimaryGuidedStateAction({
    state,
    selectedShopItemId,
    GUIDED_FLAGS,
    countPlantedTiles
  });
}

function isStoreTabUnlocked() {
  return isStoreTabUnlockedAction(state, GUIDED_FLAGS);
}

function isGoalsTabUnlocked() {
  return isGoalsTabUnlockedAction(state, GUIDED_FLAGS);
}

function syncGuidedUnlocks() {
  syncGuidedUnlocksAction({
    state,
    GUIDED_FLAGS,
    getPrimaryGuidedState,
    isStoreTabUnlocked,
    isGoalsTabUnlocked,
    addMessage
  });
}

function requestLockedTab(tabName) {
  return requestLockedTabAction({
    tabName,
    isStoreTabUnlocked,
    isGoalsTabUnlocked,
    addMessage
  });
}

function getBestBuyOpportunity() {
  return getBestBuyOpportunityAction({
    state,
    isShopItemUnlocked
  });
}

function getGuidancePayload() {
  return getGuidancePayloadAction({
    state,
    GUIDED_FLAGS,
    getPrimaryGuidedState,
    countReadyToHarvestTiles,
    getBestBuyOpportunity
  });
}

function renderGuidancePanel() {
  renderGuidancePanelDom(getGuidancePayload());
}

function getSelectedShopItemInsightData() {
  return getSelectedShopItemInsightDataAction({
    state,
    selectedShopItemId,
    getFreePurchaseCount,
    expectedRarityMultiplier: EXPECTED_RARITY_MULTIPLIER,
    rarityMultipliers: RARITY_MULTIPLIERS
  });
}

function getSelectedGridItemInsightData() {
  return getSelectedGridItemInsightDataAction({
    state,
    selectedGridCellIndex,
    getPlantGrowthState,
    getGridRarity,
    getRarityMultiplier,
    getActiveFarmSellMultiplier
  });
}

async function sellSelectedGridItem(sellButtonElement = null) {
  await sellSelectedGridItemAction({
    getBulkSelectedGridInsightData,
    sellBulkSelectedGridItems,
    getSelectedGridItemInsightData,
    addMessage,
    harvestPlant,
    sellButtonElement
  });
}

async function sellBulkSelectedGridItems(sellButtonElement = null) {
  await sellBulkSelectedGridItemsAction({
    state,
    getBulkSelectedGridInsightData,
    registerDayAction,
    registerSaleEvent,
    registerItemSalePressure,
    guidedHarvestFlag: GUIDED_FLAGS.harvest,
    awardPlayerXp,
    xpRewards: XP_REWARDS,
    selectedGridCellIndices,
    setSelectedGridCellIndex: (index) => {
      selectedGridCellIndex = index;
    },
    updateNetWorth,
    evaluateGoals,
    saveState,
    addMessage,
    renderAll,
    playSellItemsToButton,
    spawnBurst,
    spawnRing,
    spawnFloatingText,
    showXpGainFeedback,
    getTileCenter,
    getHudCenters,
    spawnCoinsForSaleValue,
    pulseHud,
    sellButtonElement
  });
}

function clearCurrentInfoSelection() {
  farmPointerRuntimeController.clearCurrentInfoSelection();
}

function renderSelectedItemInsight() {
  renderSelectedItemInsightAction({
    getBulkSelectedGridInsightData,
    getSelectedGridItemInsightData,
    getSelectedShopItemInsightData,
    clearCurrentInfoSelection,
    sellBulkSelectedGridItems,
    sellSelectedGridItem,
    updateGridSize
  });
}

function updateTimeOfDayMood() {
  updateTimeOfDayMoodAction(state);
}

function registerSaleEvent(itemName, saleValue, quantity = 1) {
  dayEconomyController.registerSaleEvent(itemName, saleValue, quantity);
}

function getMessageDayIndex() {
  return (state.player && typeof state.player.day === 'number') ? state.player.day : 1;
}

const messagesController = createMessagesController({
  getMessageDayIndex,
  messageDefinitions: DEFAULT_DATA.messages,
  setChatProfile,
  showProfileMessageBubble,
  hideProfileMessageBubbleImmediately,
  toggleMessagesPanel,
  updateTabNotificationBadges,
  triggerFxClass,
  updateGridSize,
  isReduceMotion: () => fxController.isReduceMotion()
});

function initialiseMessageUI() {
  messagesController.initialiseMessageUI();
}

function addMessage(payload) {
  return messagesController.addMessage(payload);
}

function addMessageById(messageId, vars, meta) {
  return messagesController.addMessageById(messageId, vars, meta);
}

const messageRuntimeController = createMessageRuntimeController({
  state,
  addMessageById,
  countReadyToHarvestTiles,
  countPlantedTiles: () => countPlantedTilesAction(state),
  getActivePlaytimeMs: sessionRuntimeController.getActivePlaytimeMs,
  GUIDED_FLAGS
});

const dayEconomyController = createDayEconomyController({
  state,
  addMessage,
  roundEnergyValue,
  formatEnergyValue,
  calculateNetWorth,
  countReadyToHarvestTiles,
  isShopItemUnlocked
});

function consumeEnergy(amount, reason) {
  return dayEconomyController.consumeEnergy(amount, reason);
}

const gameplayRuntimeController = createGameplayRuntimeController({
  state,
  buyItemAction,
  sellItemAction,
  purchaseCosmeticAction,
  selectCosmeticAction,
  applyThemeAction: applyThemeDom,
  craftItemAction,
  mineGridTileAction,
  waterGridTileAction,
  purchaseAndPlaceSelectedAction,
  harvestPlantAction,
  produceForLevelAction,
  addResourceToInventoryAction,
  generateNewsEventsAction,
  generateNewsEventsForState,
  defaultNewsEvents: DEFAULT_DATA.newsEvents,
  isShopItemUnlocked,
  addMessage,
  getFreePurchaseCount,
  consumeFreePurchases,
  registerDayAction,
  updateNetWorth,
  evaluateGoals,
  saveState,
  renderAll,
  pulseHud,
  getHudCenters,
  spawnFloatingText,
  registerSaleEvent,
  registerItemSalePressure,
  consumeEnergy,
  farmSecondaryId: FARM_SECONDARY_ID,
  getActiveFarmMiningEnergyCost,
  getPlantGrowthState,
  awardPlayerXp,
  xpRewards: XP_REWARDS,
  getTileCenter,
  getGridActionFxTargets: getGridActionFxTargetsDom,
  spawnBurst,
  spawnRing,
  triggerFxClass,
  showXpGainFeedback,
  selectedShopItemIdGetter: () => selectedShopItemId,
  selectedGridCellIndexGetter: () => selectedGridCellIndex,
  selectedGridCellIndexSetter: (index) => {
    selectedGridCellIndex = index;
  },
  getGridRarity,
  assignGridRarity,
  getRarityMultiplier,
  getActiveFarmSellMultiplier,
  spawnCoinTravel,
  spawnCoinsForSaleValue,
  playSellItemsToButton,
  guidedFlags: GUIDED_FLAGS,
  getBulkSelectedGridInsightData,
  sellBulkSelectedGridItems,
  getSelectedGridItemInsightData,
  showDaySummaryModal: sessionRuntimeController.showDaySummaryModal,
  clearGridSelection,
  setMessageJustEmitted: messagesController.setMessageJustEmitted,
  saveToStorage
});

// ----------- Game Logic Functions (Placeholders) -----------

/**
 * Buy a quantity of an item from the shop. Deducts cash, reduces shop
 * quantity, adds to inventory and updates averages. This function
 * should enforce rules such as available stock and sufficient cash.
 * The Python implementation keeps track of average
 * purchase cost per item; you can extend the inventory entries with
 * that metadata.
 *
 * @param {number} itemId The ID of the item to buy
 * @param {number} quantity The number of units to buy
 */
function buyItem(itemId, quantity) {
  gameplayRuntimeController.buyItem(itemId, quantity);
}

function sellItem(itemId, quantity) {
  gameplayRuntimeController.sellItem(itemId, quantity);
}

function countReadyToHarvestTiles() {
  return countReadyToHarvestTilesAction(state, getPlantGrowthState);
}

function getCurrentDaySnapshot() {
  return dayEconomyController.getCurrentDaySnapshot();
}

function emitEconomyAlert(priceMoves) {
  dayEconomyController.emitEconomyAlert(priceMoves);
}

function registerDayAction() {
  dayEconomyController.registerDayAction();
  messageRuntimeController.notePlayerActivity();
}

function clampMarketBias(value, min, max) {
  return dayEconomyController.clampMarketBias(value, min, max);
}

const dayMarketRuntimeController = createDayMarketRuntimeController({
  state,
  trackActionDuration,
  nextDayAction,
  getHeldQuantityForItemState,
  getMarketPressureRecordState,
  getMarketDirectionalBiasState,
  registerItemSalePressureState,
  updateMarketPressureForNextDayState,
  getDailyRollItemWeightState,
  getFatigueFromEnergyState,
  generateDailyMarketRollState,
  applyDailyMarketRollToShopState,
  getDailyRollSummaryTextState,
  getBestRollOpportunityTextState,
  clampMarketBias,
  isShopItemUnlocked,
  getHarvestImagePath,
  defaultNewsEvents: DEFAULT_DATA.newsEvents,
  ensureShopEntryMarketFields,
  isShopEntryPriceRecoveryActive,
  updateNetWorth,
  playDayTransition,
  syncGuidedUnlocks,
  getCurrentDaySnapshot,
  formatEnergyValue,
  addMessage,
  showDailyMarketRollModal: sessionRuntimeController.showDailyMarketRollModal,
  ensurePlayerProgressState,
  resetLowEnergyNoticeDay: dayEconomyController.resetLowEnergyNoticeDay,
  applyShopEntryPriceRecoveryStep,
  getShopEntryAveragePrice,
  startShopEntryPriceRecovery,
  priceCrashThresholdPercent: PRICE_CRASH_THRESHOLD_PERCENT,
  priceRecoveryDays: PRICE_RECOVERY_DAYS,
  emitEconomyAlert,
  generateDailyTip: () => dayEconomyController.generateDailyTip(),
  evaluateGoals,
  saveState,
  renderAll,
  showDaySummaryModal: sessionRuntimeController.showDaySummaryModal,
  holdingLotThreshold: HOLDING_LOT_THRESHOLD,
  holdBiasQtyRange: HOLD_BIAS_QTY_RANGE,
  holdBiasStreakDays: HOLD_BIAS_STREAK_DAYS,
  sellShockQtyRange: SELL_SHOCK_QTY_RANGE,
  getUnlockedRollItems: () => dayEconomyController.getUnlockedRollItems()
});

function getHeldQuantityForItem(itemId) {
  return dayMarketRuntimeController.getHeldQuantityForItem(itemId);
}

function getMarketPressureRecord(itemId) {
  return dayMarketRuntimeController.getMarketPressureRecord(itemId);
}

function getMarketDirectionalBias(itemId) {
  return dayMarketRuntimeController.getMarketDirectionalBias(itemId);
}

function registerItemSalePressure(itemId, quantity) {
  dayMarketRuntimeController.registerItemSalePressure(itemId, quantity);
}

function updateMarketPressureForNextDay() {
  dayMarketRuntimeController.updateMarketPressureForNextDay();
}

function getDailyRollItemWeight(itemId) {
  return dayMarketRuntimeController.getDailyRollItemWeight(itemId);
}

function getUnlockedRollItems() {
  return dayMarketRuntimeController.getUnlockedRollItems();
}

function getFatigueFromEnergy() {
  return dayMarketRuntimeController.getFatigueFromEnergy();
}

function generateDailyMarketRoll(impactMultiplier = 1, impactPercent = null) {
  return dayMarketRuntimeController.generateDailyMarketRoll(impactMultiplier, impactPercent);
}

function applyDailyMarketRollToShop(rollResult) {
  dayMarketRuntimeController.applyDailyMarketRollToShop(rollResult);
}

function getDailyRollSummaryText(rollResult, fatiguePercent = 0) {
  return dayMarketRuntimeController.getDailyRollSummaryText(rollResult, fatiguePercent);
}

function getBestRollOpportunityText(rollResult) {
  return dayMarketRuntimeController.getBestRollOpportunityText(rollResult);
}

function nextDay() {
  messageRuntimeController.notePlayerActivity();
  dayMarketRuntimeController.nextDay();
}

/**
 * Purchase a cosmetic item (theme or screensaver). Deducts cash and
 * unlocks the item. If the item is a theme and purchased, it could
 * immediately apply the theme; otherwise call selectCosmetic.
 *
 * @param {string} itemId The identifier of the cosmetic item
 */
function purchaseCosmetic(itemId) {
  gameplayRuntimeController.purchaseCosmetic(itemId);
}

/**
 * Select a cosmetic item as active (theme or screensaver). Updates
 * player settings and applies the theme to the page by switching
 * styles. Only unlocked items can be selected.
 *
 * @param {string} itemId The identifier of the cosmetic item
 */
function selectCosmetic(itemId) {
  gameplayRuntimeController.selectCosmetic(itemId);
}

/**
 * Apply a theme by adjusting CSS variables or classes. 98.css does
 * not support dynamic theming out of the box, so this function can
 * override colours using inline styles or custom classes. A simple
 * implementation toggles the body class based on the selected theme.
 *
 * @param {string} themeId The identifier of the selected theme
 */
function applyTheme(themeId) {
  gameplayRuntimeController.applyTheme(themeId);
}

/**
 * Craft items using a recipe. Consumes input items from the player's
 * inventory and produces the output item at a cost. This function
 * should enforce requirements like sufficient input quantities and
 * cash to cover craft cost.
 *
 * @param {string} recipeId The identifier of the recipe to execute
 * @param {number} quantity The number of times to perform the recipe
 */
function craftItem(recipeId, quantity) {
  gameplayRuntimeController.craftItem(recipeId, quantity);
}

/**
 * Compute the cost to unlock the next grid slot. The price doubles with each
 * slot purchased: the first costs $10, the next $20, then $40 and so on. The
 * cost is calculated based on the number of slots already unlocked.
 *
 * @returns {number} The cost in dollars to purchase one additional slot
 */
function getGridUnlockCost() {
  return getGridUnlockCostAction(state);
}

/**
 * Attempt to purchase a grid slot at the specified index. If the slot is
 * already purchased or the player lacks funds, no action is taken. On
 * success, deducts cash, marks the slot as unlocked and persists state.
 *
 * @param {number} index The zero‑based index of the grid cell to purchase
 */
function purchaseGridSlot(index) {
  purchaseGridSlotAction({
    state,
    index,
    getGridUnlockCost,
    consumeEnergy,
    registerDayAction,
    evaluateGoals,
    saveState,
    addMessage,
    renderAll
  });
}

function mineGridTile(index) { 
  return gameplayRuntimeController.mineGridTile(index); 
} 

function waterGridTile(index) {
  return gameplayRuntimeController.waterGridTile(index);
} 

/**
 * Place an inventory item onto an unlocked grid slot. The item must exist
 * in the player's inventory (stock on hand). Upon placement, one unit
 * is removed from inventory and stored in the grid cell.
 *
 * @param {number} itemId The ID of the item to place
 * @param {number} cellIndex The grid slot index to place the item into
 */
function placeItemOnGrid(itemId, cellIndex) {
  placeItemOnGridAction({
    state,
    itemId,
    cellIndex,
    consumeEnergy,
    registerDayAction,
    awardPlayerXp,
    xpRewards: XP_REWARDS,
    saveState,
    addMessage,
    renderAll,
    getTileCenter,
    getGridActionFxTargets: getGridActionFxTargetsDom,
    spawnBurst,
    triggerFxClass,
    showXpGainFeedback
  });
} 

/**
 * Remove an item from a grid slot back into the player's inventory.
 *
 * @param {number} cellIndex The index of the grid cell to remove the item from
 */
function removeItemFromGrid(cellIndex) {
  removeItemFromGridAction({
    state,
    cellIndex,
    getSelectedGridCellIndex: () => selectedGridCellIndex,
    setSelectedGridCellIndex: (index) => {
      selectedGridCellIndex = index;
    },
    saveState,
    addMessage,
    renderAll
  });
}

// Track the currently selected shop item for farm placement.
let selectedShopItemId = null;
let selectionPulseId = null;
let selectedGridCellIndex = null;
const selectedGridCellIndices = new Set();

const farmPointerRuntimeController = createFarmPointerRuntimeController(buildFarmPointerRuntimeDeps({
  state,
  trackActionDuration,
  isDailyRollOpen: sessionRuntimeController.isDailyRollOpen,
  isGoalCelebrationOpen: sessionRuntimeController.isGoalCelebrationOpen,
  isDaySummaryOpen: isDaySummaryOpenDom,
  getElementFromPoint: getElementFromPointDom,
  getGridIndexFromPointerEventAction,
  applyGridActionForIndexAction,
  stopFarmPointerInteractionAction,
  getGridCellSellSnapshotAction,
  addGridCellToBulkSelectionAction,
  clearBulkGridSelectionAction,
  getBulkSelectedGridInsightDataAction,
  installFarmPointerHandlersAction,
  selectGridCellAction,
  clearGridSelectionAction,
  selectShopItemAction,
  clearShopSelectionAction,
  TOOL_PICKAXE,
  TOOL_WATERING,
  TOOL_GLOVE,
  getSelectedShopItemId: () => selectedShopItemId,
  setSelectedShopItemId: (itemId) => {
    selectedShopItemId = itemId;
  },
  getSelectedGridCellIndex: () => selectedGridCellIndex,
  setSelectedGridCellIndex: (index) => {
    selectedGridCellIndex = index;
  },
  getSelectionPulseId: () => selectionPulseId,
  setSelectionPulseId: (itemId) => {
    selectionPulseId = itemId;
  },
  selectedGridCellIndices,
  mineGridTile,
  waterGridTile,
  purchaseAndPlaceSelected,
  addMessage,
  setChatProfile,
  getPlantGrowthState,
  getGridRarity,
  getRarityMultiplier,
  getActiveFarmSellMultiplier,
  renderMarket,
  updateCursorForTool,
  isShopItemUnlocked,
  setActiveTool,
  getFreePurchaseCount,
  GUIDED_FLAGS
}));

function applyGridActionForIndex(index, options = {}) {
  return farmPointerRuntimeController.applyGridActionForIndex(index, options);
}

function stopFarmPointerInteraction() {
  farmPointerRuntimeController.stopFarmPointerInteraction();
}

function getGridCellSellSnapshot(cellIndex) {
  return farmPointerRuntimeController.getGridCellSellSnapshot(cellIndex);
}

function addGridCellToBulkSelection(cellIndex) {
  return farmPointerRuntimeController.addGridCellToBulkSelection(cellIndex);
}

function clearBulkGridSelection(shouldRefresh = false) {
  farmPointerRuntimeController.clearBulkGridSelection(shouldRefresh);
}

function getBulkSelectedGridInsightData() {
  return farmPointerRuntimeController.getBulkSelectedGridInsightData();
}

function installFarmPointerHandlers() {
  farmPointerRuntimeController.installFarmPointerHandlers();
}

function selectGridCell(cellIndex) {
  farmPointerRuntimeController.selectGridCell(cellIndex);
}

function clearGridSelection(shouldRefresh = false) {
  farmPointerRuntimeController.clearGridSelection(shouldRefresh);
}

function selectShopItem(itemId) {
  farmPointerRuntimeController.selectShopItem(itemId);
}

function clearShopSelection() {
  farmPointerRuntimeController.clearShopSelection();
}

const farmUiRuntimeController = createFarmUiRuntimeController(buildFarmUiRuntimeDeps({
  state,
  updateFarmToggleButtonAction,
  setActiveFarmAction,
  handleFarmToggleButtonClickAction,
  updateToolButtonsAction,
  updateCursorForToolAction,
  setActiveToolAction,
  FARM_PRIMARY_ID,
  FARM_SECONDARY_ID,
  GRID_CELL_COUNT,
  FARM_TWO_BUTTON_REVEAL_TILES_LEFT,
  FARM_TWO_PURCHASE_COST,
  isFarmTwoPurchased,
  getUnlockedTileCountForFarm,
  isFarmOneFullyUnlocked,
  applyFarmStateToActiveGrid,
  setSelectedGridCellIndex: (index) => {
    selectedGridCellIndex = index;
  },
  selectedGridCellIndices,
  setSelectedShopItemId: (itemId) => {
    selectedShopItemId = itemId;
  },
  setSelectionPulseId: (itemId) => {
    selectionPulseId = itemId;
  },
  stopFarmPointerInteraction,
  saveState,
  renderAll,
  addMessage,
  normalizeFarmState,
  setActiveFarm: (farmId) => setActiveFarm(farmId),
  pulseHud,
  TOOL_GLOVE,
  TOOL_WATERING,
  TOOL_PICKAXE,
  isToolUnlocked,
  getToolDisplayName,
  updateFarmToggleButton: () => updateFarmToggleButton(),
  TOOL_LIST,
  updateToolButtons: () => updateToolButtons(),
  updateCursorForTool: () => updateCursorForTool(),
  saveToStorage,
  selectedShopItemId: () => selectedShopItemId,
  getCursorSeedVisualPath,
  getFarmToggleButton: getFarmToggleButtonDom,
  confirmDialog: confirmDialogDom,
  getDesktopShortcutsEnabled: getDesktopShortcutsEnabledDom,
  setDesktopShortcutsClass: setDesktopShortcutsClassDom,
  getToolButtons: getToolButtonsDom,
  getRestButton: getRestButtonDom,
  createToolKeyLabelElement: createToolKeyLabelElementDom,
  setBodyCursor: setBodyCursorDom
}));

function updateFarmToggleButton() {
  farmUiRuntimeController.updateFarmToggleButton();
}

function setActiveFarm(farmId) {
  return farmUiRuntimeController.setActiveFarm(farmId);
}

function handleFarmToggleButtonClick() {
  farmUiRuntimeController.handleFarmToggleButtonClick();
}

function updateToolButtons() {
  farmUiRuntimeController.updateToolButtons();
}

function updateCursorForTool() {
  farmUiRuntimeController.updateCursorForTool();
}

function setActiveTool(tool) {
  farmUiRuntimeController.setActiveTool(tool);
}

function purchaseAndPlaceSelected(cellIndex) {
  gameplayRuntimeController.purchaseAndPlaceSelected(cellIndex);
}

async function harvestPlant(cellIndex, sellButtonElement = null) {
  await gameplayRuntimeController.harvestPlant(cellIndex, sellButtonElement);
}

/**
 * Produce items for an extractor of a given level. Returns an array
 * of objects { itemId, quantity }. The selection rules follow:
 *
 *  - Level 1: produce 1 random level‑1 item
 *  - Level 2: produce either 1–5 level‑1 items or 1 level‑2 item
 *  - Level 3: produce 10–25 level‑1 items or 1–5 level‑2 items or 1 level‑3 item
 *  - Level 4: produce 50–125 level‑1 items or 10–25 level‑2 items or 1–5 level‑3 items or 1 level‑4 item
 *  - Level 5: produce 500–625 level‑1 items or 50–125 level‑2 items or 10–25 level‑3 items or 1–5 level‑4 items or 1 level‑5 item
 *
 * Selection is random among the available options. Within each option, a
 * random item of the appropriate level is selected from the items list.
 * If no items exist for a level, that option is skipped. Returns an empty
 * array if no valid options are found.
 *
 * @param {number} level The level of the extractor producing resources
 * @returns {Array<{itemId:number, quantity:number}>} List of produced items and quantities
 */
function produceForLevel(level) {
  return gameplayRuntimeController.produceForLevel(level);
}

/**
 * Add produced resources to the player's inventory, respecting storage
 * capacity. If not all produced items fit, only the portion that fits
 * is added and a message is shown to inform the player.
 *
 * @param {number} itemId The ID of the item to add
 * @param {number} quantity The amount of the item produced
 */
function addResourceToInventory(itemId, quantity) {
  gameplayRuntimeController.addResourceToInventory(itemId, quantity);
}

/**
 * Generate weekly news events from template data in DEFAULT_DATA.newsEvents.
 * Up to three templates are sampled, each assigned to a random unlocked item,
 * and persisted in state.newsEvents/state.newsHistory with a daysLeft counter.
 */
function generateNewsEvents() {
  gameplayRuntimeController.generateNewsEvents();
}// ----------- Event Handlers -----------

/**
 * Initialise event listeners for tab buttons, store sub‑tabs and the
 * reset button. This runs once after the DOM is ready.
 */
function attachEventHandlers() {
  attachCoreEventHandlers({
    showTab,
    buildFeedbackString: sessionRuntimeController.buildFeedbackString,
    copyFeedbackText: sessionRuntimeController.copyFeedbackText,
    setFeedbackModalOpen: sessionRuntimeController.setFeedbackModalOpen,
    continueGoalCelebration: sessionRuntimeController.continueGoalCelebration,
    continueDailyRollModal: sessionRuntimeController.continueDailyRollModal,
    continueDaySummaryModal: sessionRuntimeController.continueDaySummaryModal,
    setCurrentStoreTab: uiRuntimeController.setCurrentStoreTab,
    renderStore,
    resetGame,
    nextDay,
    clearShopSelection,
    triggerFxClass,
    setActiveTool,
    handleFarmToggleButtonClick,
    installFarmPointerHandlers,
    getSelectedGridCellIndex: () => selectedGridCellIndex,
    getSelectedGridCellIndices: () => selectedGridCellIndices,
    state,
    clearGridSelection,
    setMessageJustEmitted: messagesController.setMessageJustEmitted,
    toggleLicenseAndCreator,
    isDailyRollOpen: sessionRuntimeController.isDailyRollOpen,
    canContinueDailyRoll: sessionRuntimeController.canContinueDailyRoll,
    requestDailyRollSkip: sessionRuntimeController.requestDailyRollSkip,
    isGoalCelebrationOpen: sessionRuntimeController.isGoalCelebrationOpen,
    TOOL_GLOVE,
    TOOL_PICKAXE,
    TOOL_WATERING
  });
}

// ----------- Startup -----------

/**
 * Main entry point. Called when the DOM is fully loaded. Loads state,
 * attaches event handlers, selects the default tab and renders the UI.
 */
async function main() {
  await runAppBootstrap({
    loadJSONData,
    initialiseState,
    evaluateGoals,
    syncGuidedUnlocks,
    attachEventHandlers,
    startPlaytimeTracking: sessionRuntimeController.startPlaytimeTracking,
    initialiseMessageUI,
    markStoreUnlocksSeen,
    updateToolButtons,
    updateCursorForTool,
    installSidePanelScrollHandlers,
    state,
    addMessage,
    saveState,
    showTab,
    renderHUD,
    applyTheme,
    updateGridSize,
    getInitialMainTab: () => {
      const isNarrowViewport = window.matchMedia('(max-width: 900px)').matches;
      const isTouchViewport = window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches;
      const isLandscapeViewport = window.innerWidth > window.innerHeight;
      if (!isLandscapeViewport && (isNarrowViewport || (isTouchViewport && window.matchMedia('(max-width: 1100px)').matches))) {
        return 'farm';
      }
      return 'market';
    },
    onViewportChange: () => {
      updateMainViewVisibility();
      updateMainTabButtons();
      renderSelectedItemInsight();
    },
    setReduceMotion,
    initFxLayer
  });
  messageRuntimeController.start();
  const markActivity = () => {
    messageRuntimeController.notePlayerActivity();
  };
  document.addEventListener('pointerdown', markActivity);
  document.addEventListener('keydown', markActivity);
}

// Run main once DOM is ready. If the async function rejects, log the error.
document.addEventListener('DOMContentLoaded', () => {
  main().catch(err => console.error(err));
});















