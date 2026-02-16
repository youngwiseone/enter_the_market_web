export const TOOL_GLOVE = 'glove';
export const TOOL_WATERING = 'watering';
export const TOOL_PICKAXE = 'pickaxe';
export const TOOL_LIST = [TOOL_GLOVE, TOOL_WATERING, TOOL_PICKAXE];

export const GRID_DIMENSION = 7;
export const GRID_CELL_COUNT = GRID_DIMENSION * GRID_DIMENSION;

export const FARM_PRIMARY_ID = 1;
export const FARM_SECONDARY_ID = 2;
export const FARM_TWO_PURCHASE_COST = 1000;
export const FARM_TWO_MINING_ENERGY_PER_HIT = 5;
export const FARM_TWO_SELL_MULTIPLIER = 2;
export const FARM_TWO_BUTTON_REVEAL_TILES_LEFT = 10;

export const PLAYER_LEVEL_CAP = 99;
export const ENERGY_SEGMENT_CAP = 10;
export const PRICE_CRASH_THRESHOLD_PERCENT = 100;
export const PRICE_RECOVERY_DAYS = 3;

export const XP_REWARDS = {
  plant: 2,
  water: 1,
  mine: 4,
  harvest: 6,
  goal: 20
};

export const GUIDED_FLAGS = {
  selected: 'tutorial:selected-first-item',
  planted: 'tutorial:planted-first-seed',
  harvest: 'tutorial:harvested-first-crop',
  firstRest: 'tutorial:first-rest-complete',
  firstProfit: 'tutorial:first-profit-complete',
  storeUnlocked: 'tutorial:unlock-store-tab',
  goalsUnlocked: 'tutorial:unlock-goals-tab',
  storeAnnounced: 'tutorial:unlock-store-announced',
  goalsAnnounced: 'tutorial:unlock-goals-announced'
};
