function getRandomInt(min, max) {
  const safeMin = Math.floor(Math.max(0, Number(min) || 0));
  const safeMax = Math.floor(Math.max(safeMin, Number(max) || safeMin));
  return safeMin + Math.floor(Math.random() * (safeMax - safeMin + 1));
}

function formatSessionDurationCompact(ms) {
  const totalSeconds = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function pickRandomValue(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const index = getRandomInt(0, values.length - 1);
  return values[index] ?? null;
}

export function createMessageRuntimeController(deps) {
  const {
    state,
    addMessageById,
    countReadyToHarvestTiles,
    countPlantedTiles,
    getActivePlaytimeMs,
    GUIDED_FLAGS
  } = deps;

  const IDLE_MIN_MS = 60000;
  const IDLE_MAX_MS = 120000;
  const TICK_MS = 12000;
  const TIP_COOLDOWN_MS = 35000;

  let runtimeTimerId = null;
  let lastActivityAt = Date.now();
  let nextIdleThresholdMs = getRandomInt(IDLE_MIN_MS, IDLE_MAX_MS);
  let lastTipAt = 0;
  let nextPlantTipVariant = 0;

  function notePlayerActivity() {
    lastActivityAt = Date.now();
  }

  function getUnlockedTileCount() {
    return Array.isArray(state.gridUnlocked)
      ? state.gridUnlocked.reduce((sum, value) => sum + (value ? 1 : 0), 0)
      : 0;
  }

  function getMiningProgressCount() {
    return Array.isArray(state.gridMiningHits)
      ? state.gridMiningHits.reduce((sum, value) => sum + (Math.max(0, Number(value) || 0)), 0)
      : 0;
  }

  function getTotalWateredCount() {
    return Array.isArray(state.gridWateredCount)
      ? state.gridWateredCount.reduce((sum, value) => sum + (Math.max(0, Number(value) || 0)), 0)
      : 0;
  }

  function getRandomGrowingItemPlural() {
    if (!Array.isArray(state.gridItems) || !Array.isArray(state.items)) {
      return 'plants';
    }
    const byId = new Map(state.items.map((item) => [item.id, item]));
    const names = [];
    state.gridItems.forEach((itemId) => {
      if (!itemId) return;
      const item = byId.get(itemId);
      const baseName = String(item?.name || '').trim();
      if (!baseName) return;
      const cleaned = baseName.replace(/\s+Seeds?$/i, '').trim();
      if (cleaned) names.push(cleaned);
    });
    const picked = pickRandomValue(names);
    return picked ? `${picked}s` : 'plants';
  }

  function emitStuckTipsIfNeeded() {
    const now = Date.now();
    if (now - lastTipAt < TIP_COOLDOWN_MS) return;
    const day = Math.max(1, Number(state.player?.day) || 1);
    if (day > 10) return;
    const unlockedTiles = getUnlockedTileCount();
    const miningProgress = getMiningProgressCount();
    const plantedCount = countPlantedTiles();
    const wateredCount = getTotalWateredCount();
    const readyToHarvest = countReadyToHarvestTiles();
    const harvestedCount = Math.max(0, Number(state.goalStats?.harvestCount) || 0);
    const energy = Math.max(0, Number(state.player?.energy) || 0);
    const hasStoreUnlocked = !!state.goalFlags?.[GUIDED_FLAGS.storeUnlocked];
    const hasGoalsUnlocked = !!state.goalFlags?.[GUIDED_FLAGS.goalsUnlocked];

    if (unlockedTiles <= 0 && miningProgress <= 0 && plantedCount <= 0) {
      if (addMessageById('tip.day1.mine_pickaxe')) {
        lastTipAt = now;
      }
      return;
    }
    if (unlockedTiles > 0 && plantedCount <= 0) {
      const variantId = nextPlantTipVariant % 2 === 0
        ? 'tip.day1.plant_after_mine'
        : 'tip.day1.select_market_then_tile';
      nextPlantTipVariant += 1;
      if (addMessageById(variantId)) {
        lastTipAt = now;
      }
      return;
    }
    if (plantedCount > 0 && wateredCount <= 0) {
      if (addMessageById('tip.day1.water_crops')) {
        lastTipAt = now;
      }
      return;
    }
    if (readyToHarvest > 0 && harvestedCount <= 0) {
      if (addMessageById('tip.day1.harvest_ready')) {
        lastTipAt = now;
      }
      return;
    }
    if (energy <= 1) {
      if (addMessageById('tip.low_energy_rest')) {
        lastTipAt = now;
      }
      return;
    }
    if (!hasStoreUnlocked && harvestedCount <= 0) {
      if (addMessageById('tip.unlock_store')) {
        lastTipAt = now;
      }
      return;
    }
    if (!hasGoalsUnlocked && day <= 2) {
      if (addMessageById('tip.unlock_goals')) {
        lastTipAt = now;
      }
    }
  }

  function emitIdleLine() {
    const day = Math.max(1, Number(state.player?.day) || 1);
    const isRainDay = String(state.weather?.id || '') === 'rain';
    const sessionDuration = formatSessionDurationCompact(getActivePlaytimeMs());
    const itemNamePlural = getRandomGrowingItemPlural();
    const earlyPool = [
      'idle.session_time',
      'idle.grow_hype',
      'idle.water_reminder',
      'idle.anime_hype_1'
    ];
    const latePool = [
      'idle.session_time',
      'idle.prototype_fact',
      'idle.grow_hype',
      'idle.water_reminder',
      'idle.anime_hype_1',
      'idle.anime_hype_2',
      'idle.anime_hype_3',
      'idle.anime_hype_4'
    ];
    const pool = day <= 10 ? earlyPool.slice() : latePool.slice();
    if (isRainDay) {
      pool.push(
        'idle.rain_crops_sparkle',
        'idle.rain_cosy_noises',
        'idle.rain_free_watering',
        'idle.rain_muddy_boots'
      );
    }
    const id = pickRandomValue(pool);
    if (!id) return;
    addMessageById(id, { sessionDuration, itemNamePlural });
  }

  function tick() {
    emitStuckTipsIfNeeded();
    const now = Date.now();
    const idleForMs = now - lastActivityAt;
    if (idleForMs < nextIdleThresholdMs) return;
    emitIdleLine();
    lastActivityAt = now;
    nextIdleThresholdMs = getRandomInt(IDLE_MIN_MS, IDLE_MAX_MS);
  }

  function start() {
    if (runtimeTimerId !== null) return;
    notePlayerActivity();
    runtimeTimerId = window.setInterval(() => {
      tick();
    }, TICK_MS);
  }

  function stop() {
    if (runtimeTimerId === null) return;
    window.clearInterval(runtimeTimerId);
    runtimeTimerId = null;
  }

  return {
    start,
    stop,
    notePlayerActivity
  };
}
