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

const BUILD_VERSION = 'Web v0.1';
const VERSION_CONTROL = 'eyJkaXNwbGF5TmFtZSI6IkJsaWdoIEhlZGdlcyIsImF1dGhvcklkcyI6WyJ5b3VuZ3dpc2VvbmUiLCJibGlnaGhlZGdlcyJdfQ==';
let creatorSignatureVisible = false;
let licenseNoteVisible = false;

// ----------- Data Definitions -----------

/*
 * Fallback default data for player/items/shop/goals/store.
 * Runtime JSON loading can override these values. Keep fallback defaults
 * aligned with `data/*.json` so behavior remains consistent if fetch fails.
 */
const DEFAULT_DATA = {
  player: {
    cash: 100.0,           // starting cash (reduced to $100)
    capacity: 10,          // starting storage capacity (10 units)
    capacityUsed: 0,       // current used storage
    day: 1,
    week: 1,
    year: 1,
    netWorth: 100.0,       // cash + inventory value, initialised to starting cash
    theme: 'default',      // selected theme
    uiSkin: 'classic',     // selected UI skin
    screensaver: 'default', // selected screensaver
    energy: 5,
    energyMax: 5,
    playerLevel: 1,
    playerXp: 0
    ,
    // Tracks whether the welcome message has been shown on first load
    welcomeShown: false
  },
  // Items and shop will be populated at runtime from JSON files in
  // web_enter_the_market/data. If loading from JSON fails (e.g. due to
  // file protocol restrictions), these fallback items ensure the game
  // remains playable. The images are embedded as base64 strings.
  items: [
    {
      id: 1,
      name: 'Pumpkin Seeds',
      description: 'Pumpkin seeds.',
      price: 18,
      rarity: 'common',
      image: 'seeds/pumpkin_seeds.png',
      seedImage: 'seeds/pumpkin_seeds.png',
      plantStageImages: [
        'plants/pumpkin_plant1.png',
        'plants/pumpkin_plant2.png',
        'plants/pumpkin_plant3.png',
        'plants/pumpkin_plant4.png',
        'plants/pumpkin_plant5.png',
        'plants/pumpkin_plant6.png'
      ],
      harvestImage: 'items/pumpkin.png',
      growDays: 6,
      plantStages: 6,
      goalLocked: true
    },
    {
      id: 2,
      name: 'Tomato Seeds',
      description: 'Tomato seeds.',
      price: 2,
      rarity: 'common',
      image: 'seeds/tomato_seeds.png',
      seedImage: 'seeds/tomato_seeds.png',
      harvestImage: 'items/tomato.png',
      growDays: 6,
      plantStages: 6
    },
    {
      id: 3,
      name: 'Corn Seeds',
      description: 'Corn seeds.',
      price: 8,
      rarity: 'common',
      image: 'seeds/corn_seeds.png',
      seedImage: 'seeds/corn_seeds.png',
      harvestImage: 'items/corn.png',
      growDays: 6,
      plantStages: 6,
      goalLocked: true
    },
    {
      id: 4,
      name: 'Carrot Seeds',
      description: 'Carrot seeds.',
      price: 1,
      rarity: 'common',
      image: 'seeds/carrot_seeds.png',
      seedImage: 'seeds/carrot_seeds.png',
      harvestImage: 'items/carrot.png',
      growDays: 6,
      plantStages: 6
    },
    {
      id: 5,
      name: 'Potato Seeds',
      description: 'Potato seeds.',
      price: 3,
      rarity: 'common',
      image: 'seeds/potato_seeds.png',
      seedImage: 'seeds/potato_seeds.png',
      harvestImage: 'items/potato.png',
      growDays: 6,
      plantStages: 6
    },
    {
      id: 6,
      name: 'Onion Seeds',
      description: 'Onion seeds.',
      price: 2,
      rarity: 'common',
      image: 'seeds/onion_seeds.png',
      seedImage: 'seeds/onion_seeds.png',
      harvestImage: 'items/onion.png',
      growDays: 6,
      plantStages: 6
    },
    {
      id: 7,
      name: 'Cabbage Seeds',
      description: 'Cabbage seeds.',
      price: 9,
      rarity: 'common',
      image: 'seeds/cabbage_seeds.png',
      seedImage: 'seeds/cabbage_seeds.png',
      harvestImage: 'items/cabbage.png',
      growDays: 6,
      plantStages: 6,
      goalLocked: true
    },
    {
      id: 8,
      name: 'Broccoli Seeds',
      description: 'Broccoli seeds.',
      price: 34,
      rarity: 'common',
      image: 'seeds/broccoli_seeds.png',
      seedImage: 'seeds/broccoli_seeds.png',
      harvestImage: 'items/broccoli.png',
      growDays: 6,
      plantStages: 6,
      goalLocked: true
    },
    {
      id: 9,
      name: 'Cucumber Seeds',
      description: 'Cucumber seeds.',
      price: 10,
      rarity: 'common',
      image: 'seeds/cucumber_seeds.png',
      seedImage: 'seeds/cucumber_seeds.png',
      harvestImage: 'items/cucumber.png',
      growDays: 6,
      plantStages: 6,
      goalLocked: true
    },
    {
      id: 10,
      name: 'Zucchini Seeds',
      description: 'Zucchini seeds.',
      price: 11,
      rarity: 'common',
      image: 'seeds/zucchini_seeds.png',
      seedImage: 'seeds/zucchini_seeds.png',
      harvestImage: 'items/zucchini.png',
      growDays: 6,
      plantStages: 6,
      goalLocked: true
    },
    {
      id: 11,
      name: 'Eggplant Seeds',
      description: 'Eggplant seeds.',
      price: 20,
      rarity: 'common',
      image: 'seeds/eggplant_seeds.png',
      seedImage: 'seeds/eggplant_seeds.png',
      harvestImage: 'items/eggplant.png',
      growDays: 6,
      plantStages: 6,
      goalLocked: true
    },
    {
      id: 12,
      name: 'Garlic Seeds',
      description: 'Garlic seeds.',
      price: 4,
      rarity: 'common',
      image: 'seeds/garlic_seeds.png',
      seedImage: 'seeds/garlic_seeds.png',
      harvestImage: 'items/garlic.png',
      growDays: 6,
      plantStages: 6
    },
    {
      id: 13,
      name: 'Lettuce Seeds',
      description: 'Lettuce seeds.',
      price: 22,
      rarity: 'common',
      image: 'seeds/lettuce_seeds.png',
      seedImage: 'seeds/lettuce_seeds.png',
      harvestImage: 'items/lettuce.png',
      growDays: 6,
      plantStages: 6,
      goalLocked: true
    },
    {
      id: 14,
      name: 'Spinach Seeds',
      description: 'Spinach seeds.',
      price: 5,
      rarity: 'common',
      image: 'seeds/spinach_seeds.png',
      seedImage: 'seeds/spinach_seeds.png',
      harvestImage: 'items/spinach.png',
      growDays: 6,
      plantStages: 6
    },
    {
      id: 15,
      name: 'Radish Seeds',
      description: 'Radish seeds.',
      price: 3,
      rarity: 'common',
      image: 'seeds/radish_seeds.png',
      seedImage: 'seeds/radish_seeds.png',
      harvestImage: 'items/radish.png',
      growDays: 6,
      plantStages: 6
    },
    {
      id: 16,
      name: 'Green Pepper Seeds',
      description: 'Green pepper seeds.',
      price: 24,
      rarity: 'common',
      image: 'seeds/green_pepper_seeds.png',
      seedImage: 'seeds/green_pepper_seeds.png',
      harvestImage: 'items/green_pepper.png',
      growDays: 6,
      plantStages: 6,
      goalLocked: true
    },
    {
      id: 17,
      name: 'Beetroot Seeds',
      description: 'Beetroot seeds.',
      price: 12,
      rarity: 'common',
      image: 'seeds/beetroot_seeds.png',
      seedImage: 'seeds/beetroot_seeds.png',
      harvestImage: 'items/beetroot.png',
      growDays: 6,
      plantStages: 6,
      goalLocked: true
    }
  ],
  // Precompute shop fallback from the fallback items. This ensures
  // default quantities and pricing are available even if JSON fails
  // to load. These entries are overwritten by loadJSONData() when
  // external data is successfully fetched.
  shop: [
    { itemId: 1, quantity: 100, price: 18, priceSum: 0, daysCount: 0 },
    { itemId: 2, quantity: 100, price: 2, priceSum: 0, daysCount: 0 },
    { itemId: 3, quantity: 100, price: 8, priceSum: 0, daysCount: 0 },
    { itemId: 4, quantity: 100, price: 1, priceSum: 0, daysCount: 0 },
    { itemId: 5, quantity: 100, price: 3, priceSum: 0, daysCount: 0 },
    { itemId: 6, quantity: 100, price: 2, priceSum: 0, daysCount: 0 },
    { itemId: 7, quantity: 100, price: 9, priceSum: 0, daysCount: 0 },
    { itemId: 8, quantity: 100, price: 34, priceSum: 0, daysCount: 0 },
    { itemId: 9, quantity: 100, price: 10, priceSum: 0, daysCount: 0 },
    { itemId: 10, quantity: 100, price: 11, priceSum: 0, daysCount: 0 },
    { itemId: 11, quantity: 100, price: 20, priceSum: 0, daysCount: 0 },
    { itemId: 12, quantity: 100, price: 4, priceSum: 0, daysCount: 0 },
    { itemId: 13, quantity: 100, price: 22, priceSum: 0, daysCount: 0 },
    { itemId: 14, quantity: 100, price: 5, priceSum: 0, daysCount: 0 },
    { itemId: 15, quantity: 100, price: 3, priceSum: 0, daysCount: 0 },
    { itemId: 16, quantity: 100, price: 24, priceSum: 0, daysCount: 0 },
    { itemId: 17, quantity: 100, price: 12, priceSum: 0, daysCount: 0 }
  ],
  goals: [
    {
      id: 'day-2-watering',
      name: 'Early Riser',
      description: 'Reach Day 2 to gain watering can',
      type: 'feature',
      goal: { metric: 'day', operator: '>=', value: 2 },
      reward: { unlockTool: 'watering' },
      message: 'Goal complete: Watering Can is now available.'
    },
    {
      id: 'tomato-first-harvest',
      name: 'Tomato Starter',
      description: 'Harvest 1 Tomato',
      type: 'economy',
      goal: { metric: 'itemsHarvested.2', operator: '>=', value: 1 },
      reward: { freePurchases: { itemId: 2, count: 2 } },
      message: 'Goal complete: Next 2 Tomato Seeds bought are free.'
    },
    {
      id: 'diversified-grower',
      name: 'Diversified Grower',
      description: 'Harvest Tomato, Carrot, Potato, and Onion at least once',
      type: 'economy',
      goal: {
        all: [
          { metric: 'itemsHarvested.2', operator: '>=', value: 1 },
          { metric: 'itemsHarvested.4', operator: '>=', value: 1 },
          { metric: 'itemsHarvested.5', operator: '>=', value: 1 },
          { metric: 'itemsHarvested.6', operator: '>=', value: 1 }
        ]
      },
      reward: {
        cashBonus: 40,
        freePurchases: { itemId: 2, count: 2 }
      },
      message: 'Goal complete: Diversification bonus awarded ($40 + 2 free Tomato Seeds).'
    },
    {
      id: 'steady-expander',
      name: 'Steady Expander',
      description: 'Reach Day 6 and unlock 6 farm tiles',
      type: 'economy',
      goal: {
        all: [
          { metric: 'day', operator: '>=', value: 6 },
          { metric: 'gridUnlockedCount', operator: '>=', value: 6 }
        ]
      },
      reward: { cashBonus: 110 },
      message: 'Goal complete: Expansion bonus awarded ($110).'
    },
    {
      id: 'premium-first-harvest',
      name: 'Premium First Harvest',
      description: 'Harvest Broccoli once',
      type: 'economy',
      goal: { metric: 'itemsHarvested.8', operator: '>=', value: 1 },
      reward: {
        cashBonus: 500,
        setFlag: 'premium_first_harvest'
      },
      message: 'Goal complete: Premium harvest achieved ($500 bonus).'
    },
    {
      id: 'unlock-tier2-first-expansion',
      name: 'Tier 2 Contract',
      description: 'Reach Day 3 and $220 cash',
      type: 'economy',
      goal: {
        all: [
          { metric: 'day', operator: '>=', value: 3 },
          { metric: 'cash', operator: '>=', value: 220 }
        ]
      },
      reward: { unlockShopItems: [3, 7, 9, 10, 17] },
      message: 'Goal complete: New crop contracts unlocked (Tier 2).'
    },
    {
      id: 'unlock-tier3-growth',
      name: 'Tier 3 Supply',
      description: 'Harvest 14 crops and reach $400 cash',
      type: 'economy',
      goal: {
        all: [
          { metric: 'harvestCount', operator: '>=', value: 14 },
          { metric: 'cash', operator: '>=', value: 400 }
        ]
      },
      reward: { unlockShopItems: [1, 11, 13, 16] },
      message: 'Goal complete: Advanced crop supply unlocked (Tier 3).'
    },
    {
      id: 'unlock-tier4-elite',
      name: 'Tier 4 Elite Futures',
      description: 'Reach $1,200 cash and unlock 8 farm tiles',
      type: 'economy',
      goal: {
        all: [
          { metric: 'cash', operator: '>=', value: 1200 },
          { metric: 'gridUnlockedCount', operator: '>=', value: 8 }
        ]
      },
      reward: { unlockShopItems: [8] },
      message: 'Goal complete: Elite crop futures unlocked (Tier 4).'
    },
    {
      id: 'cash-150-theme',
      name: 'Pocket Profit',
      description: 'Reach $150 cash',
      type: 'cosmetic',
      goal: { metric: 'cash', operator: '>=', value: 150 },
      reward: { grantCosmetic: 'theme-mono' },
      message: 'Goal complete: Monochrome Green theme awarded.'
    },
    {
      id: 'cash-1000-boost',
      name: 'Early Momentum',
      description: 'Reach $300 cash',
      type: 'cosmetic',
      goal: { metric: 'cash', operator: '>=', value: 300 },
      reward: { grantCosmetic: 'theme-sophisticated' },
      message: 'Goal complete: Sophisticated theme awarded.'
    },
    {
      id: 'cash-10000-boost',
      name: 'Market Veteran',
      description: 'Reach $1,000 cash',
      type: 'cosmetic',
      goal: { metric: 'cash', operator: '>=', value: 1000 },
      reward: { grantCosmetic: 'theme-marble' },
      message: 'Goal complete: Marble theme awarded.'
    },
    {
      id: 'cash-100000-boost',
      name: 'Tycoon',
      description: 'Reach $5,000 cash',
      type: 'cosmetic',
      goal: { metric: 'cash', operator: '>=', value: 5000 },
      reward: { grantCosmetic: 'theme-gold' },
      message: 'Goal complete: Gold theme awarded.'
    },
    {
      id: 'cash-1000000-boost',
      name: 'Legendary Broker',
      description: 'Reach $25,000 cash',
      type: 'cosmetic',
      goal: { metric: 'cash', operator: '>=', value: 25000 },
      reward: {
        grantCosmetic: 'theme-diamond',
        setFlag: 'cash_millionaire'
      },
      message: 'Goal complete: Diamond theme awarded and Millionaire status unlocked.'
    }
  ],
  // Player inventory starts empty. Each entry holds the item id and
  // quantity owned. Additional metadata such as average cost could be
  // stored to calculate profit/loss on sales.
  inventory: [],
  // News events templates. Each entry contains a headline and article
  // template along with an impact percent and duration. When news
  // events are generated (on Thursdays), random items from the current
  // items list are inserted into the templates. The keyword 'sku' in
  // the headline and article is replaced with the selected item name.
  newsEvents: [
    {
      headline: 'Surging demand for sku leads to price hike',
      article: 'In a bustling twist, tech‑savvy adventurers are lining up to purchase sku after a famous alchemist praised its quality. Expect prices to soar!',
      impact: 20,
      duration: 5
    },
    {
      headline: 'Abundant harvest floods market with sku',
      article: 'Farmers report an extraordinary yield of sku this season, leading to a glut in supply. Merchants slash prices to move stock.',
      impact: -15,
      duration: 4
    },
    {
      headline: 'Industrial boom drives up demand for sku',
      article: 'A manufacturing boom has increased the need for sku. Traders anticipate shortages and begin hoarding supplies.',
      impact: 25,
      duration: 3
    },
    {
      headline: 'Strike at the mines reduces sku output',
      article: 'Workers at several mines producing sku have gone on strike, halting operations. Production delays will likely raise prices.',
      impact: 10,
      duration: 4
    },
    {
      headline: 'Recycling initiative cuts cost of sku',
      article: 'A new recycling program floods the market with reclaimed sku, lowering production costs and consumer prices.',
      impact: -20,
      duration: 5
    },
    {
      headline: 'Technological breakthrough reduces need for sku',
      article: 'Innovators have found a way to replace sku in many devices, decreasing its demand. Sellers may need to discount to stay competitive.',
      impact: -10,
      duration: 3
    }
  ],
  // History of news events by week. This structure records which
  // events were generated on each week so that players can browse
  // previous news. Each entry is an array of event objects.
  newsHistory: [],
  // Store items for cosmetics and crafting. These
  // definitions include pricing and unlocked state. When adding more
  // themes or skins, populate this list accordingly.
  store: {
    cosmetics: [
      { id: 'theme-default', name: 'Default', type: 'theme', price: 0, unlocked: true },
      { id: 'theme-mono',    name: 'Monochrome Green', type: 'theme', price: 500, unlocked: false },
      { id: 'theme-aqua',    name: 'Aquatic Blue', type: 'theme', price: 500, unlocked: false },
      { id: 'theme-flame',   name: 'Flame Vixen', type: 'theme', price: 500, unlocked: false },
      { id: 'theme-coder',   name: 'Coder Black', type: 'theme', price: 500, unlocked: false },
      { id: 'theme-hotdog',  name: 'Hotdog Stand', type: 'theme', price: 500, unlocked: false },
      { id: 'theme-teal',    name: 'Teal Breeze', type: 'theme', price: 500, unlocked: false },
      { id: 'theme-sophisticated', name: 'Sophisticated Look', type: 'theme', price: 5000, unlocked: false },
      { id: 'theme-marble',  name: 'Marble Luxe', type: 'theme', price: 20000, unlocked: false },
      { id: 'theme-gold',    name: 'Gold Dynasty', type: 'theme', price: 200000, unlocked: false },
      { id: 'theme-diamond', name: 'Diamond Apex', type: 'theme', price: 2000000, unlocked: false }
    ],
    // Future categories: screensavers and UI skins can be added here.
    crafting: [
      // Example recipe: 2 units of Copper + 1 unit of Plastic → 1 unit of Circuit at cost
      { id: 'recipe-circuit', input: [{ id: 3, qty: 2 }, { id: 5, qty: 1 }], output: { id: 6, qty: 1 }, costMultiplier: 0.05 }
    ]
  }
};

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
  try {
    const itemsResp = await fetch('data/items.json');
    if (itemsResp.ok) {
      const itemsData = await itemsResp.json();
      if (itemsData && Array.isArray(itemsData.items)) {
        DEFAULT_DATA.items = itemsData.items;
        // Generate shop entries with default quantities
        DEFAULT_DATA.shop = itemsData.items.map(item => ({
          itemId: item.id,
          quantity: 100,
          price: item.price,
          priceSum: 0,
          daysCount: 0
        }));
      }
    }
  } catch (err) {
    console.error('Failed to load items.json', err);
  }
  try {
    const newsResp = await fetch('data/news.json');
    if (newsResp.ok) {
      const newsData = await newsResp.json();
      if (newsData && Array.isArray(newsData.news)) {
        // Keep the news items as a schedule for future events. Do not
        // assign them directly to state.newsEvents here; state.newsEvents
        // represents active news and is initialised separately.
        DEFAULT_DATA.newsEvents = newsData.news;
      }
    }
  } catch (err) {
    console.error('Failed to load news.json', err);
  }
  try {
    const goalsResp = await fetch('data/goals.json');
    if (goalsResp.ok) {
      const goalsData = await goalsResp.json();
      if (goalsData && Array.isArray(goalsData.goals)) {
        DEFAULT_DATA.goals = goalsData.goals;
      }
    }
  } catch (err) {
    console.error('Failed to load goals.json', err);
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
  daySummaryHistory: [],
  pendingDaySummary: null,
  gridPurchasePrice: null
};

const playtestStats = {
  activeMs: 0,
  lastActiveAt: null
};

function startPlaytimeTracking() {
  playtestStats.lastActiveAt = document.hidden ? null : performance.now();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (playtestStats.lastActiveAt !== null) {
        playtestStats.activeMs += performance.now() - playtestStats.lastActiveAt;
        playtestStats.lastActiveAt = null;
      }
      return;
    }
    if (playtestStats.lastActiveAt === null) {
      playtestStats.lastActiveAt = performance.now();
    }
  });
}

function getActivePlaytimeMs() {
  let total = playtestStats.activeMs;
  if (playtestStats.lastActiveAt !== null) {
    total += performance.now() - playtestStats.lastActiveAt;
  }
  return Math.max(0, total);
}

function formatPlaytime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours <= 0) {
    return `${minutes}m${seconds}s`;
  }
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function formatMoney(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 'n/a';
  return numberValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getGrowablePlantCount() {
  if (!Array.isArray(state.gridItems)) {
    // TODO: Replace with actual plant tracking array if gridItems is removed.
    return null;
  }
  if (!Array.isArray(state.items)) {
    // TODO: Replace with actual item catalog lookup if state.items is unavailable.
    return null;
  }
  const itemById = new Map(state.items.map(item => [item.id, item]));
  let count = 0;
  state.gridItems.forEach(itemId => {
    if (!itemId) return;
    const item = itemById.get(itemId);
    const growDays = Number(item?.growDays) || 0;
    if (growDays > 0) {
      count += 1;
    }
  });
  return count;
}

function getGoalsSummary() {
  if (!Array.isArray(state.goals)) {
    // TODO: Replace with actual goals list if state.goals is unavailable.
    return null;
  }
  if (!state.goalsClaimed || typeof state.goalsClaimed !== 'object') {
    // TODO: Replace with actual goal completion map if goalsClaimed is unavailable.
    return null;
  }
  const total = state.goals.length;
  const completed = Object.keys(state.goalsClaimed).length;
  return { completed, total };
}

function buildFeedbackString() {
  const played = formatPlaytime(getActivePlaytimeMs());
  const dayValue = Number(state.player?.day);
  const dayText = Number.isFinite(dayValue) ? String(dayValue) : 'n/a';
  if (dayText === 'n/a') {
    // TODO: Replace with actual day variable from game loop if state.player.day is missing.
  }

  const moneyFormatted = formatMoney(state.player?.cash);
  const moneyText = moneyFormatted === 'n/a' ? 'n/a' : `$${moneyFormatted}`;
  if (moneyText === 'n/a') {
    // TODO: Replace with actual cash variable if state.player.cash is missing.
  }

  const plantsCount = getGrowablePlantCount();
  const plantsText = Number.isFinite(plantsCount) ? String(plantsCount) : 'n/a';
  if (plantsText === 'n/a') {
    // TODO: Replace with actual plant tracking if growable plant count is unavailable.
  }

  const goalsSummary = getGoalsSummary();
  const goalsText = goalsSummary ? `${goalsSummary.completed}/${goalsSummary.total}` : 'n/a';
  if (goalsText === 'n/a') {
    // TODO: Replace with actual goals completion tracking if goals data is unavailable.
  }

  return `EnterTheMarket ${BUILD_VERSION} | Played: ${played} | Day: ${dayText} | Money: ${moneyText} | Plants: ${plantsText} | Goals: ${goalsText}`;
}

function setFeedbackModalOpen(isOpen) {
  const modal = document.getElementById('feedback-modal');
  if (!modal) return;
  modal.classList.toggle('is-open', isOpen);
  modal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
}

function showCopiedMessage() {
  const copiedEl = document.getElementById('feedback-copied');
  if (!copiedEl) return;
  copiedEl.textContent = 'Copied!';
  window.setTimeout(() => {
    copiedEl.textContent = '';
  }, 1500);
}

async function copyFeedbackText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      showCopiedMessage();
      return true;
    } catch (err) {
      console.warn('Clipboard API failed, falling back.', err);
    }
  }
  const textarea = document.getElementById('feedback-textarea');
  if (!textarea) return false;
  textarea.focus();
  textarea.select();
  try {
    const didCopy = document.execCommand('copy');
    if (didCopy) {
      showCopiedMessage();
    }
    return didCopy;
  } catch (err) {
    console.warn('execCommand copy failed.', err);
    return false;
  }
}

const GOAL_CELEBRATION_SPARKLE_IMAGES = [
  'resources/effects/sparkle_gold_01.png',
  'resources/effects/sparkle_gold_02.png',
  'resources/effects/prism_sparkle_01.png',
  'resources/effects/prism_sparkle_02.png'
];
let goalCelebrationAmbientTimer = null;
let goalCelebrationAmbientStopTimer = null;

function isGoalCelebrationOpen() {
  return !!state.activeGoalCelebration;
}

function clearGoalCelebrationSparkles() {
  if (goalCelebrationAmbientTimer) {
    window.clearInterval(goalCelebrationAmbientTimer);
    goalCelebrationAmbientTimer = null;
  }
  if (goalCelebrationAmbientStopTimer) {
    window.clearTimeout(goalCelebrationAmbientStopTimer);
    goalCelebrationAmbientStopTimer = null;
  }
  const sparkleLayer = document.getElementById('goal-celebration-sparkles');
  if (sparkleLayer) {
    sparkleLayer.innerHTML = '';
  }
}

function setGoalCelebrationOpen(isOpen) {
  const modal = document.getElementById('goal-celebration-modal');
  if (!modal) return;
  modal.classList.toggle('is-open', !!isOpen);
  modal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
}

function getToolDisplayName(toolId) {
  if (toolId === TOOL_GLOVE) return 'Gloves';
  if (toolId === TOOL_WATERING) return 'Watering Can';
  if (toolId === TOOL_PICKAXE) return 'Pickaxe';
  return toolId;
}

function getGoalCelebrationRewardText(goal) {
  if (!goal || typeof goal !== 'object') return 'New reward unlocked.';
  const reward = goal.reward || {};
  const parts = [];
  const cashBonus = Math.max(0, Number(reward.cashBonus) || 0);
  if (cashBonus > 0) {
    parts.push(`Cash bonus: $${cashBonus.toFixed(2)}`);
  }
  if (typeof reward.unlockTool === 'string') {
    parts.push(`Unlocked: ${getToolDisplayName(reward.unlockTool)}`);
  }
  if (typeof reward.unlockShopItem === 'number') {
    const item = state.items.find(it => it.id === reward.unlockShopItem);
    parts.push(`Unlocked in shop: ${item ? item.name : `Item ${reward.unlockShopItem}`}`);
  }
  if (Array.isArray(reward.unlockShopItems) && reward.unlockShopItems.length > 0) {
    const labels = reward.unlockShopItems
      .map(itemId => state.items.find(it => it.id === Number(itemId)))
      .filter(Boolean)
      .map(item => item.name);
    if (labels.length > 0) {
      parts.push(`Unlocked in shop: ${labels.join(', ')}`);
    }
  }
  if (reward.freePurchases && typeof reward.freePurchases === 'object') {
    const itemId = Number(reward.freePurchases.itemId);
    const count = Math.max(0, Number(reward.freePurchases.count) || 0);
    const item = state.items.find(it => it.id === itemId);
    const itemLabel = item ? item.name : `Item ${itemId}`;
    if (count > 0) {
      parts.push(`Unlocked: Next ${count} ${itemLabel} purchase${count === 1 ? '' : 's'} free`);
    }
  }
  if (typeof reward.grantCosmetic === 'string') {
    const cosmetic = state.store?.cosmetics?.find(c => c.id === reward.grantCosmetic);
    parts.push(`Unlocked cosmetic: ${cosmetic ? cosmetic.name : reward.grantCosmetic}`);
  }
  if (typeof reward.setFlag === 'string' && reward.setFlag) {
    parts.push('Unlocked: New feature');
  }
  if (parts.length > 0) return parts.join(' | ');
  const fallback = (goal.message || '').replace(/^Goal complete:\s*/i, '').trim();
  return fallback || 'New reward unlocked.';
}

function spawnGoalCelebrationSparkle(options) {
  const layer = document.getElementById('goal-celebration-sparkles');
  if (!layer) return;
  const rect = layer.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const img = document.createElement('img');
  img.className = `goal-celebration-sparkle${options.isAmbient ? ' is-ambient' : ''}`;
  const src = GOAL_CELEBRATION_SPARKLE_IMAGES[Math.floor(Math.random() * GOAL_CELEBRATION_SPARKLE_IMAGES.length)];
  img.src = src;
  img.alt = '';
  const size = options.size || (16 + Math.random() * 24);
  const lifeMs = options.lifeMs || (560 + Math.random() * 360);
  const dx = options.dx ?? ((Math.random() - 0.5) * 160);
  const dy = options.dy ?? (-40 - Math.random() * 120);
  const rot = options.rot ?? ((Math.random() - 0.5) * 360);
  const x = Math.max(0, Math.min(rect.width, options.x));
  const y = Math.max(0, Math.min(rect.height, options.y));
  img.style.left = `${x - size / 2}px`;
  img.style.top = `${y - size / 2}px`;
  img.style.width = `${size}px`;
  img.style.height = `${size}px`;
  img.style.setProperty('--sparkle-life', `${Math.round(lifeMs)}ms`);
  img.style.setProperty('--sparkle-dx', `${Math.round(dx)}px`);
  img.style.setProperty('--sparkle-dy', `${Math.round(dy)}px`);
  img.style.setProperty('--sparkle-rot', `${Math.round(rot)}deg`);
  layer.appendChild(img);
  img.addEventListener('animationend', () => img.remove(), { once: true });
}

function startGoalCelebrationSparkles() {
  if (FX_STATE.reduceMotion) return;
  const panel = document.getElementById('goal-celebration-panel');
  const layer = document.getElementById('goal-celebration-sparkles');
  if (!panel || !layer) return;
  clearGoalCelebrationSparkles();
  const panelRect = panel.getBoundingClientRect();
  const layerRect = layer.getBoundingClientRect();
  const centerX = panelRect.left - layerRect.left + (panelRect.width / 2);
  const centerY = panelRect.top - layerRect.top + Math.min(140, panelRect.height * 0.32);

  for (let i = 0; i < 24; i++) {
    const angle = (Math.PI * 2 * i) / 24;
    const radius = 12 + Math.random() * 28;
    spawnGoalCelebrationSparkle({
      x: centerX + (Math.cos(angle) * radius),
      y: centerY + (Math.sin(angle) * radius),
      size: 18 + Math.random() * 22,
      lifeMs: 620 + Math.random() * 380,
      dx: Math.cos(angle) * (40 + Math.random() * 90),
      dy: Math.sin(angle) * (20 + Math.random() * 90) - 50,
      rot: (Math.random() - 0.5) * 380,
      isAmbient: false
    });
  }

  goalCelebrationAmbientTimer = window.setInterval(() => {
    const edge = Math.floor(Math.random() * 4);
    const x = edge <= 1
      ? panelRect.left - layerRect.left + (Math.random() * panelRect.width)
      : panelRect.left - layerRect.left + (edge === 2 ? -20 : panelRect.width + 20);
    const y = edge >= 2
      ? panelRect.top - layerRect.top + (Math.random() * panelRect.height)
      : panelRect.top - layerRect.top + (edge === 0 ? -12 : panelRect.height + 10);
    spawnGoalCelebrationSparkle({
      x,
      y,
      size: 12 + Math.random() * 18,
      lifeMs: 500 + Math.random() * 600,
      dx: (Math.random() - 0.5) * 70,
      dy: -30 - (Math.random() * 80),
      rot: (Math.random() - 0.5) * 200,
      isAmbient: true
    });
  }, 140);

  goalCelebrationAmbientStopTimer = window.setTimeout(() => {
    if (goalCelebrationAmbientTimer) {
      window.clearInterval(goalCelebrationAmbientTimer);
      goalCelebrationAmbientTimer = null;
    }
  }, 2400);
}

function showNextGoalCelebration() {
  if (state.activeGoalCelebration) return;
  if (!Array.isArray(state.goalCelebrationQueue) || state.goalCelebrationQueue.length === 0) return;
  const next = state.goalCelebrationQueue.shift();
  if (!next) return;
  state.activeGoalCelebration = next;

  const titleEl = document.getElementById('goal-celebration-title');
  const unlockEl = document.getElementById('goal-celebration-unlock');
  const imageEl = document.getElementById('goal-celebration-image');
  if (titleEl) titleEl.textContent = next.title;
  if (unlockEl) unlockEl.textContent = next.rewardText;
  if (imageEl) {
    imageEl.src = next.imageSrc || 'resources/profiles/player_goal_unlocked.png';
    imageEl.alt = next.imageAlt || 'Goal unlocked';
  }

  setGoalCelebrationOpen(true);
  startGoalCelebrationSparkles();
  window.setTimeout(() => {
    const continueBtn = document.getElementById('goal-celebration-continue');
    if (continueBtn) continueBtn.focus();
  }, 80);
}

function enqueueGoalCelebration(goal) {
  if (!goal || typeof goal !== 'object') return;
  if (!Array.isArray(state.goalCelebrationQueue)) {
    state.goalCelebrationQueue = [];
  }
  state.goalCelebrationQueue.push({
    id: goal.id || '',
    title: goal.name || 'Goal Complete',
    rewardText: getGoalCelebrationRewardText(goal),
    imageSrc: 'resources/profiles/player_goal_unlocked.png',
    imageAlt: 'Goal unlocked'
  });
  showNextGoalCelebration();
}

function continueGoalCelebration() {
  if (!state.activeGoalCelebration) return;
  state.activeGoalCelebration = null;
  clearGoalCelebrationSparkles();
  setGoalCelebrationOpen(false);
  window.setTimeout(() => {
    showNextGoalCelebration();
  }, 120);
}

function isDailyRollOpen() {
  const modal = document.getElementById('daily-roll-modal');
  return !!(modal && modal.classList.contains('is-open'));
}

function setDailyRollOpen(isOpen) {
  const modal = document.getElementById('daily-roll-modal');
  if (!modal) return;
  modal.classList.toggle('is-open', !!isOpen);
  modal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
}

function continueDailyRollModal() {
  dailyRollAnimationToken += 1;
  setDailyRollOpen(false);
  if (state.pendingDaySummary) {
    showDaySummaryModal(state.pendingDaySummary);
    state.pendingDaySummary = null;
  }
}

function setDaySummaryOpen(isOpen) {
  const modal = document.getElementById('day-summary-modal');
  if (!modal) return;
  modal.classList.toggle('is-open', !!isOpen);
  modal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
}

function showDaySummaryModal(summary) {
  if (!summary || typeof summary !== 'object') return;
  const subtitleEl = document.getElementById('day-summary-subtitle');
  const soldEl = document.getElementById('day-summary-sold');
  const salesEl = document.getElementById('day-summary-sales');
  const deltaEl = document.getElementById('day-summary-delta');
  const topEl = document.getElementById('day-summary-top');
  const nextEl = document.getElementById('day-summary-next');
  if (subtitleEl) {
    subtitleEl.textContent = `Day ${summary.day || 1} wrap-up`;
  }
  if (soldEl) {
    soldEl.textContent = String(Math.max(0, Number(summary.itemsSold) || 0));
  }
  if (salesEl) {
    salesEl.textContent = `$${(Math.max(0, Number(summary.salesTotal) || 0)).toFixed(2)}`;
  }
  if (deltaEl) {
    const delta = Number(summary.cashDelta) || 0;
    deltaEl.textContent = `${delta >= 0 ? '+' : ''}$${delta.toFixed(2)}`;
    deltaEl.style.color = delta >= 0 ? '#1f7a1f' : '#9a1c1c';
  }
  if (topEl) {
    if (summary.topSale && typeof summary.topSale === 'object') {
      const topName = String(summary.topSale.itemName || 'Item');
      const topValue = Math.max(0, Number(summary.topSale.value) || 0);
      topEl.textContent = `${topName} ($${topValue.toFixed(2)})`;
    } else {
      topEl.textContent = 'None';
    }
  }
  if (nextEl) {
    nextEl.textContent = summary.nextOpportunity || 'No special opportunities noted.';
  }
  setDaySummaryOpen(true);
}

function continueDaySummaryModal() {
  setDaySummaryOpen(false);
}

let dailyRollAnimationToken = 0;

function createDailyRollSlotNode(item, extraClass = '') {
  const slot = document.createElement('div');
  slot.className = `daily-roll-reel-slot ${extraClass}`.trim();
  const icon = document.createElement('img');
  icon.src = item?.harvestImage || '';
  icon.alt = item?.itemName || 'Item';
  icon.title = item?.itemName || 'Unknown';
  icon.loading = 'eager';
  slot.appendChild(icon);
  return slot;
}

function triggerDailyRollLandingEffects(reelEl, hitCount = 1) {
  if (!reelEl) return;
  if (hitCount > 1) {
    reelEl.classList.remove('duplicate-hit');
    void reelEl.offsetWidth;
    reelEl.classList.add('duplicate-hit');
    reelEl.addEventListener('animationend', () => reelEl.classList.remove('duplicate-hit'), { once: true });
  }
  const sparkImages = ['resources/effects/sparkle_gold_01.png', 'resources/effects/sparkle_gold_02.png'];
  const baseSparkCount = FX_STATE.reduceMotion ? 4 : 8;
  const sparkCount = baseSparkCount + Math.max(0, Math.min(8, (Math.max(1, Number(hitCount) || 1) - 1) * 2));
  for (let i = 0; i < sparkCount; i += 1) {
    const spark = document.createElement('img');
    spark.className = 'daily-roll-spark';
    spark.src = sparkImages[Math.floor(Math.random() * sparkImages.length)];
    spark.alt = '';
    spark.style.left = `${10 + Math.random() * (Math.max(10, reelEl.clientWidth - 20))}px`;
    spark.style.top = `${20 + Math.random() * 40}px`;
    spark.style.setProperty('--spark-dx', `${Math.round((Math.random() - 0.5) * 60)}px`);
    spark.style.setProperty('--spark-dy', `${Math.round(-20 - Math.random() * 50)}px`);
    spark.style.setProperty('--spark-rot', `${Math.round((Math.random() - 0.5) * 260)}deg`);
    reelEl.appendChild(spark);
    spark.addEventListener('animationend', () => spark.remove(), { once: true });
  }
}

function renderDailyRollResultChip(summaryEl, pick, itemEffect) {
  if (!summaryEl || !pick) return;
  const impactPct = Number(itemEffect?.adjustedImpactPct) || 0;
  const sign = impactPct >= 0 ? '+' : '';
  const stackCount = Math.max(1, Number(itemEffect?.hits) || 1);
  const trendClass = impactPct >= 0 ? 'positive' : 'negative';
  const chip = document.createElement('div');
  chip.className = 'daily-roll-result-chip';

  const icon = document.createElement('img');
  icon.className = 'daily-roll-result-icon';
  icon.src = pick.harvestImage || '';
  icon.alt = pick.itemName || 'Item';
  icon.loading = 'eager';

  const name = document.createElement('span');
  name.className = 'daily-roll-result-name';
  name.textContent = pick.itemName || 'Unknown';

  const impact = document.createElement('span');
  impact.className = `daily-roll-impact-chip ${trendClass}`;
  impact.textContent = `${sign}${impactPct.toFixed(0)}%`;

  chip.appendChild(icon);
  chip.appendChild(name);
  chip.appendChild(impact);

  if (stackCount > 1) {
    const stack = document.createElement('span');
    stack.className = 'daily-roll-reel-stack';
    stack.textContent = `x${stackCount}`;
    chip.appendChild(stack);
  }
  summaryEl.appendChild(chip);
}

function waitForDailyRoll(ms) {
  return new Promise(resolve => {
    window.setTimeout(resolve, Math.max(0, Number(ms) || 0));
  });
}

function renderDailyRollStage(trackEl, unlockedItems, midItem) {
  if (!trackEl || !Array.isArray(unlockedItems) || unlockedItems.length === 0 || !midItem) return;
  const topItem = unlockedItems[Math.floor(Math.random() * unlockedItems.length)];
  const bottomItem = unlockedItems[Math.floor(Math.random() * unlockedItems.length)];
  trackEl.innerHTML = '';
  trackEl.appendChild(createDailyRollSlotNode(topItem, 'ghost'));
  trackEl.appendChild(createDailyRollSlotNode(midItem, 'mid'));
  trackEl.appendChild(createDailyRollSlotNode(bottomItem, 'ghost'));
}

async function showDailyMarketRollModal(rollResult, summaryText, fatiguePercent = 0) {
  const modal = document.getElementById('daily-roll-modal');
  const summaryEl = document.getElementById('daily-roll-results');
  const fatigueEl = document.getElementById('daily-roll-fatigue');
  const fatigueNoteEl = document.getElementById('daily-roll-fatigue-note');
  if (!modal || !Array.isArray(rollResult?.picks) || rollResult.picks.length === 0) return;

  const unlockedItems = getUnlockedRollItems().map(item => ({
    itemId: item.id,
    itemName: item.name,
    harvestImage: getHarvestImagePath(item)
  }));
  const reelEl = document.getElementById('daily-roll-reel');
  const trackEl = document.getElementById('daily-roll-track');
  if (!reelEl || !trackEl || unlockedItems.length === 0) return;

  const animationToken = ++dailyRollAnimationToken;
  const isCurrentAnimation = () => animationToken === dailyRollAnimationToken && isDailyRollOpen();

  const fatigueClamped = Math.max(0, Math.min(100, Math.round(fatiguePercent)));
  const fatigueDetail = `Leftover energy dampens both positive and negative roll movement. ${fatigueClamped}% dampening applied this day.`;
  if (fatigueEl) {
    fatigueEl.textContent = `Fatigue: ${fatigueClamped}%`;
    fatigueEl.title = fatigueDetail;
    fatigueEl.setAttribute('aria-label', `Market fatigue ${fatigueClamped} percent. ${fatigueDetail}`);
  }
  if (fatigueNoteEl) {
    fatigueNoteEl.title = fatigueDetail;
  }

  if (summaryEl) {
    summaryEl.innerHTML = '';
    summaryEl.title = summaryText || '';
  }
  reelEl.classList.remove('final');
  reelEl.classList.remove('duplicate-hit');
  renderDailyRollStage(trackEl, unlockedItems, unlockedItems[Math.floor(Math.random() * unlockedItems.length)]);
  setDailyRollOpen(true);

  for (let index = 0; index < 3; index += 1) {
    if (!isCurrentAnimation()) return;
    const finalPick = rollResult.picks[index] || rollResult.picks[rollResult.picks.length - 1];
    if (!finalPick) continue;
    const itemEffect = rollResult.byItem.get(finalPick.itemId);

    const spinIntervalMs = FX_STATE.reduceMotion ? 80 : 54;
    const spinTarget = FX_STATE.reduceMotion ? 4 : 11;
    for (let spins = 0; spins < spinTarget; spins += 1) {
      if (!isCurrentAnimation()) return;
      const midItem = unlockedItems[Math.floor(Math.random() * unlockedItems.length)];
      renderDailyRollStage(trackEl, unlockedItems, midItem);
      await waitForDailyRoll(spinIntervalMs);
    }

    if (!isCurrentAnimation()) return;
    renderDailyRollStage(trackEl, unlockedItems, finalPick);
    reelEl.classList.remove('final');
    void reelEl.offsetWidth;
    reelEl.classList.add('final');
    triggerDailyRollLandingEffects(reelEl, Math.max(1, Number(itemEffect?.hits) || 1));
    if (summaryEl) {
      renderDailyRollResultChip(summaryEl, finalPick, itemEffect);
    }
    await waitForDailyRoll(FX_STATE.reduceMotion ? 70 : 150);
  }

  if (!isCurrentAnimation()) return;
  await waitForDailyRoll(FX_STATE.reduceMotion ? 40 : 90);
}

function getEffectiveWateredCount(index) {
  const wateredCount = Array.isArray(state.gridWateredCount) ? (state.gridWateredCount[index] || 0) : 0;
  const wateredToday = Array.isArray(state.gridWateredDay) && state.gridWateredDay[index] === state.player.day;
  return Math.max(0, wateredCount - (wateredToday ? 1 : 0));
}

function getPlantGrowthState(item, index) {
  const stageCount = Math.max(1, Number(item?.plantStages) || 1);
  const growDays = Math.max(0, Number(item?.growDays) || 0);
  if (growDays <= 0) {
    return { stageIndex: stageCount, isGrown: true, daysLeft: 0 };
  }
  const effectiveWateredCount = getEffectiveWateredCount(index);
  const isGrown = effectiveWateredCount >= growDays;
  const daysLeft = Math.max(0, growDays - effectiveWateredCount);
  let stageIndex = 1;
  if (stageCount > 1 && !isGrown) {
    // Spread visible plant stages across pre-harvest growth so the final
    // stage appears before harvest day.
    const preHarvestDays = Math.max(1, growDays - 1);
    const scaled = Math.ceil((effectiveWateredCount / preHarvestDays) * stageCount);
    stageIndex = Math.min(stageCount, Math.max(1, scaled));
  } else if (isGrown) {
    stageIndex = stageCount;
  }
  return { stageIndex, isGrown, daysLeft };
}

function getDefaultUnlockedTools() {
  return {
    [TOOL_GLOVE]: true,
    [TOOL_PICKAXE]: true,
    [TOOL_WATERING]: false
  };
}

function resetShopEntryToBasePrice(itemId) {
  if (!Array.isArray(state.shop) || !Array.isArray(state.items)) return;
  const shopEntry = state.shop.find(entry => entry && entry.itemId === itemId);
  const item = state.items.find(it => it && it.id === itemId);
  if (!shopEntry || !item) return;
  const basePrice = Math.max(0.01, Number(item.price) || Number(shopEntry.price) || 0.01);
  shopEntry.price = basePrice;
  shopEntry.priceSum = 0;
  shopEntry.daysCount = 0;
}

function getDefaultUnlockedShopItems(items) {
  const unlocked = {};
  if (!Array.isArray(items)) return unlocked;
  items.forEach(item => {
    if (!item || typeof item.id !== 'number') return;
    unlocked[item.id] = item.goalLocked !== true;
  });
  return unlocked;
}

function getGoalRewardUnlockedItemIds(goal) {
  if (!goal || typeof goal !== 'object') return [];
  const reward = goal.reward || {};
  const ids = [];
  if (typeof reward.unlockShopItem === 'number') {
    ids.push(reward.unlockShopItem);
  }
  if (Array.isArray(reward.unlockShopItems)) {
    reward.unlockShopItems.forEach(itemId => {
      const numericId = Number(itemId);
      if (Number.isInteger(numericId)) {
        ids.push(numericId);
      }
    });
  }
  return ids;
}

function hasPlayerHandledItem(itemId) {
  const inventoryQty = Array.isArray(state.inventory)
    ? state.inventory
      .filter(entry => entry && entry.itemId === itemId)
      .reduce((sum, entry) => sum + (Number(entry.quantity) || 0), 0)
    : 0;
  const gridQty = Array.isArray(state.gridItems)
    ? state.gridItems.reduce((sum, gridItemId) => sum + (gridItemId === itemId ? 1 : 0), 0)
    : 0;
  const harvestedQty = Number(state.goalStats?.itemsHarvested?.[String(itemId)]) || 0;
  return inventoryQty > 0 || gridQty > 0 || harvestedQty > 0;
}

function syncGoalLockedShopUnlocks() {
  if (!Array.isArray(state.items)) return false;
  if (!state.unlockedShopItems || typeof state.unlockedShopItems !== 'object') {
    state.unlockedShopItems = {};
  }
  let changed = false;
  const claimedUnlocks = new Set();
  if (state.goalsClaimed && typeof state.goalsClaimed === 'object' && Array.isArray(state.goals)) {
    state.goals.forEach(goal => {
      if (!goal || typeof goal.id !== 'string') return;
      if (!state.goalsClaimed[goal.id]) return;
      getGoalRewardUnlockedItemIds(goal).forEach(itemId => claimedUnlocks.add(itemId));
    });
  }
  state.items.forEach(item => {
    if (!item || typeof item.id !== 'number') return;
    const itemId = item.id;
    const currentlyUnlocked = !!state.unlockedShopItems[itemId];
    if (item.goalLocked === true) {
      const shouldUnlock = claimedUnlocks.has(itemId) || hasPlayerHandledItem(itemId);
      if (currentlyUnlocked !== shouldUnlock) {
        state.unlockedShopItems[itemId] = shouldUnlock;
        if (!shouldUnlock) {
          resetShopEntryToBasePrice(itemId);
        }
        changed = true;
      }
      return;
    }
    if (!currentlyUnlocked) {
      state.unlockedShopItems[itemId] = true;
      changed = true;
    }
  });
  return changed;
}

function isToolUnlocked(tool) {
  if (tool === TOOL_GLOVE) return true;
  return !!(state.unlockedTools && state.unlockedTools[tool]);
}

function isShopItemUnlocked(itemId) {
  return !!(state.unlockedShopItems && state.unlockedShopItems[itemId]);
}

function getFreePurchaseCount(itemId) {
  if (!state.freePurchasesByItem) return 0;
  const key = String(itemId);
  return Math.max(0, Number(state.freePurchasesByItem[key]) || 0);
}

function consumeFreePurchases(itemId, quantity) {
  const key = String(itemId);
  const available = getFreePurchaseCount(itemId);
  const freeQty = Math.min(available, Math.max(0, quantity));
  if (freeQty > 0) {
    state.freePurchasesByItem[key] = available - freeQty;
  }
  return freeQty;
}

function getItemCurrentPrice(itemId) {
  const shopEntry = Array.isArray(state.shop)
    ? state.shop.find(entry => entry.itemId === itemId)
    : null;
  if (shopEntry && typeof shopEntry.price === 'number') {
    return Math.max(0, shopEntry.price);
  }
  const item = Array.isArray(state.items)
    ? state.items.find(it => it.id === itemId)
    : null;
  return Math.max(0, Number(item?.price) || 0);
}

function calculateInventoryValue() {
  if (!Array.isArray(state.inventory)) return 0;
  return state.inventory.reduce((total, entry) => {
    const qty = Number(entry?.quantity) || 0;
    if (qty <= 0) return total;
    return total + getItemCurrentPrice(entry.itemId) * qty;
  }, 0);
}

function calculateGridValue() {
  if (!Array.isArray(state.gridItems)) return 0;
  return state.gridItems.reduce((total, itemId) => {
    if (!itemId) return total;
    return total + getItemCurrentPrice(itemId);
  }, 0);
}

function calculateNetWorth() {
  const cash = Number(state.player?.cash) || 0;
  return cash + calculateInventoryValue() + calculateGridValue();
}

function updateNetWorth() {
  if (!state.player || typeof state.player !== 'object') return 0;
  state.player.netWorth = calculateNetWorth();
  return state.player.netWorth;
}

function clampPlayerLevel(levelRaw) {
  const numeric = Math.floor(Number(levelRaw) || 1);
  return Math.max(1, Math.min(PLAYER_LEVEL_CAP, numeric));
}

function getXpToNextLevel(levelRaw) {
  const level = clampPlayerLevel(levelRaw);
  return Math.max(1, Math.round(30 * Math.pow(1.18, Math.max(0, level - 1))));
}

function getEnergyMaxForLevel(levelRaw) {
  const level = clampPlayerLevel(levelRaw);
  if (level >= 10) return 10;
  if (level >= 8) return 9;
  if (level >= 6) return 8;
  if (level >= 4) return 7;
  if (level >= 2) return 6;
  return 5;
}

function ensurePlayerProgressState() {
  if (!state.player || typeof state.player !== 'object') return;
  state.player.playerLevel = clampPlayerLevel(state.player.playerLevel);
  const atCap = state.player.playerLevel >= PLAYER_LEVEL_CAP;
  const xp = Math.max(0, Math.floor(Number(state.player.playerXp) || 0));
  state.player.playerXp = atCap ? 0 : Math.min(xp, getXpToNextLevel(state.player.playerLevel) - 1);
  state.player.energyMax = getEnergyMaxForLevel(state.player.playerLevel);
  if (typeof state.player.energy !== 'number') {
    state.player.energy = state.player.energyMax;
  }
  state.player.energy = Math.max(0, Math.min(Math.floor(state.player.energy), state.player.energyMax));
}

function enqueueLevelUpCelebration(level, changeText) {
  if (!Array.isArray(state.goalCelebrationQueue)) {
    state.goalCelebrationQueue = [];
  }
  state.goalCelebrationQueue.push({
    id: `level-up-${level}-${Date.now()}`,
    title: 'Level Up',
    rewardText: `Level ${level} reached | ${changeText}`,
    imageSrc: 'resources/profiles/player_level_up.png',
    imageAlt: 'Level up'
  });
  showNextGoalCelebration();
}

function awardPlayerXp(amount, options = {}) {
  ensurePlayerProgressState();
  const xpGain = Math.max(0, Math.floor(Number(amount) || 0));
  if (xpGain <= 0 || state.player.playerLevel >= PLAYER_LEVEL_CAP) return 0;

  state.player.playerXp += xpGain;
  let levelsGained = 0;
  while (state.player.playerLevel < PLAYER_LEVEL_CAP) {
    const xpToNext = getXpToNextLevel(state.player.playerLevel);
    if (state.player.playerXp < xpToNext) break;
    state.player.playerXp -= xpToNext;
    const previousEnergyMax = getEnergyMaxForLevel(state.player.playerLevel);
    state.player.playerLevel += 1;
    levelsGained += 1;
    const currentEnergyMax = getEnergyMaxForLevel(state.player.playerLevel);
    state.player.energyMax = currentEnergyMax;
    state.player.energy = currentEnergyMax;
    const changeText = currentEnergyMax > previousEnergyMax
      ? `Max energy increased to ${currentEnergyMax}. Energy fully refilled.`
      : `Energy fully refilled to ${currentEnergyMax}.`;
    addMessage(`Level up! Reached Level ${state.player.playerLevel}. ${changeText}`, {
      speaker: 'player',
      emotion: 'level_up',
      category: 'progress',
      priority: 'high'
    });
    enqueueLevelUpCelebration(state.player.playerLevel, changeText);
  }

  if (state.player.playerLevel >= PLAYER_LEVEL_CAP) {
    state.player.playerXp = 0;
  }

  if (options && options.center) {
    showXpGainFeedback(xpGain, options.center);
  }
  return levelsGained;
}

function getGoalMetricValue(metric) {
  if (typeof metric !== 'string') return 0;
  if (metric === 'cash') return Number(state.player?.cash) || 0;
  if (metric === 'netWorth') return calculateNetWorth();
  if (metric === 'day') return Number(state.player?.day) || 0;
  if (metric === 'harvestCount') return Number(state.goalStats?.harvestCount) || 0;
  if (metric === 'gridUnlockedCount') {
    return Array.isArray(state.gridUnlocked)
      ? state.gridUnlocked.reduce((sum, v) => sum + (v ? 1 : 0), 0)
      : 0;
  }
  if (metric.startsWith('itemsHarvested.')) {
    const itemId = metric.split('.')[1];
    return Number(state.goalStats?.itemsHarvested?.[itemId]) || 0;
  }
  return 0;
}

function getGoalConditions(goal) {
  if (!goal || typeof goal !== 'object' || !goal.goal || typeof goal.goal !== 'object') {
    return [];
  }
  if (Array.isArray(goal.goal.all)) {
    return goal.goal.all.filter(condition => condition && typeof condition.metric === 'string');
  }
  if (typeof goal.goal.metric === 'string') {
    return [goal.goal];
  }
  return [];
}

function doesConditionMeet(condition) {
  if (!condition || typeof condition !== 'object' || typeof condition.metric !== 'string') return false;
  const metricValue = getGoalMetricValue(condition.metric);
  const targetValue = Number(condition.value) || 0;
  const operator = condition.operator || '>=';
  if (operator === '<') return metricValue < targetValue;
  if (operator === '<=') return metricValue <= targetValue;
  if (operator === '>') return metricValue > targetValue;
  if (operator === '==') return metricValue === targetValue;
  return metricValue >= targetValue;
}

function doesGoalMeetCondition(goal) {
  const conditions = getGoalConditions(goal);
  if (!conditions.length) return false;
  return conditions.every(condition => doesConditionMeet(condition));
}

function applyGoalReward(goal) {
  if (!goal || typeof goal !== 'object') return false;
  const reward = goal.reward || {};
  let changed = false;
  const cashBonus = Math.max(0, Number(reward.cashBonus) || 0);
  if (cashBonus > 0) {
    state.player.cash = (Number(state.player.cash) || 0) + cashBonus;
    updateNetWorth();
    changed = true;
  }
  if (typeof reward.unlockTool === 'string' && TOOL_LIST.includes(reward.unlockTool)) {
    if (!state.unlockedTools[reward.unlockTool]) {
      state.unlockedTools[reward.unlockTool] = true;
      changed = true;
    }
  }
  if (typeof reward.unlockShopItem === 'number') {
    const itemId = reward.unlockShopItem;
    if (!state.unlockedShopItems[itemId]) {
      state.unlockedShopItems[itemId] = true;
      resetShopEntryToBasePrice(itemId);
      changed = true;
    }
  }
  if (Array.isArray(reward.unlockShopItems)) {
    reward.unlockShopItems.forEach(itemIdRaw => {
      const itemId = Number(itemIdRaw);
      if (!Number.isInteger(itemId)) return;
      if (!state.unlockedShopItems[itemId]) {
        state.unlockedShopItems[itemId] = true;
        resetShopEntryToBasePrice(itemId);
        changed = true;
      }
    });
  }
  if (reward.freePurchases && typeof reward.freePurchases === 'object') {
    const itemId = reward.freePurchases.itemId;
    const count = Math.max(0, Number(reward.freePurchases.count) || 0);
    if (typeof itemId === 'number' && count > 0) {
      const key = String(itemId);
      const previous = getFreePurchaseCount(itemId);
      state.freePurchasesByItem[key] = previous + count;
      changed = true;
    }
  }
  if (typeof reward.grantCosmetic === 'string' && state.store && Array.isArray(state.store.cosmetics)) {
    const cosmetic = state.store.cosmetics.find(c => c.id === reward.grantCosmetic);
    if (cosmetic && !cosmetic.unlocked) {
      cosmetic.unlocked = true;
      changed = true;
    }
  }
  if (typeof reward.setFlag === 'string' && reward.setFlag) {
    if (!state.goalFlags[reward.setFlag]) {
      state.goalFlags[reward.setFlag] = true;
      changed = true;
    }
  }
  return changed;
}

function evaluateGoals() {
  if (!Array.isArray(state.goals) || !state.goals.length) return 0;
  let completedCount = 0;
  const milestonePercents = [25, 50, 75];
  state.goals.forEach(goal => {
    if (!goal || typeof goal !== 'object' || typeof goal.id !== 'string') return;
    if (goal.enabled === false) return;
    if (state.goalsClaimed[goal.id]) return;

    const progress = getGoalProgress(goal);
    milestonePercents.forEach(percent => {
      const key = `goalMilestone:${goal.id}:${percent}`;
      if (progress.percent >= percent && !state.goalFlags[key]) {
        state.goalFlags[key] = true;
        addMessage(`${goal.name || goal.id} progress: ${percent}% complete.`, {
          speaker: 'player',
          emotion: 'neutral',
          category: 'goal',
          priority: 'normal'
        });
      }
    });

    if (!doesGoalMeetCondition(goal)) return;
    applyGoalReward(goal);
    awardPlayerXp(XP_REWARDS.goal);
    state.goalsClaimed[goal.id] = true;
    completedCount += 1;
    const message = goal.message || `Goal complete: ${goal.name || goal.id}.`;
    addMessage(message, { speaker: 'player', emotion: 'goal_unlocked', category: 'goal', priority: 'high' });
    enqueueGoalCelebration(goal);
  });
  if (completedCount > 0) {
    if (state.activeTool && !isToolUnlocked(state.activeTool)) {
      state.activeTool = TOOL_GLOVE;
    }
    saveState();
    updateToolButtons();
    updateCursorForTool();
  }
  return completedCount;
}

const TOOL_GLOVE = 'glove';
const TOOL_WATERING = 'watering';
const TOOL_PICKAXE = 'pickaxe';
const TOOL_LIST = [TOOL_GLOVE, TOOL_WATERING, TOOL_PICKAXE];
const GRID_DIMENSION = 7;
const GRID_CELL_COUNT = GRID_DIMENSION * GRID_DIMENSION;
const PLAYER_LEVEL_CAP = 20;
const XP_REWARDS = {
  plant: 2,
  water: 1,
  mine: 4,
  harvest: 6,
  goal: 20
};

const RARITY_TYPES = ['common', 'uncommon', 'rare', 'mythic'];
const RARITY_ROLLS = [
  { rarity: 'common', weight: 50 },
  { rarity: 'uncommon', weight: 30 },
  { rarity: 'rare', weight: 15 },
  { rarity: 'mythic', weight: 5 }
];
const RARITY_MULTIPLIERS = {
  common: 1.2,
  uncommon: 1.5,
  rare: 2,
  mythic: 3
};
const EXPECTED_RARITY_MULTIPLIER = RARITY_ROLLS.reduce((sum, entry) => {
  const multiplier = RARITY_MULTIPLIERS[entry.rarity] ?? 1;
  return sum + (entry.weight * multiplier);
}, 0) / Math.max(1, RARITY_ROLLS.reduce((sum, entry) => sum + entry.weight, 0));
const GUIDED_FLAGS = {
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

function decodeAuthorIdentity() {
  try {
    if (typeof atob === 'function') {
      const decoded = atob(VERSION_CONTROL);
      const parsed = JSON.parse(decoded);
      if (parsed && typeof parsed === 'object') {
        return {
          displayName: typeof parsed.displayName === 'string' && parsed.displayName.trim()
            ? parsed.displayName.trim()
            : 'Creator',
          authorIds: Array.isArray(parsed.authorIds)
            ? parsed.authorIds.map(id => String(id).trim()).filter(Boolean)
            : []
        };
      }
    }
  } catch (err) {
    console.warn('Failed to decode author identity token.', err);
  }
  return { displayName: 'Creator', authorIds: [] };
}

function toggleCreatorSignature() {
  const tag = document.getElementById('creator-signature');
  if (!tag) return;
  creatorSignatureVisible = !creatorSignatureVisible;
  const authorIdentity = decodeAuthorIdentity();
  tag.textContent = `Crafted by ${authorIdentity.displayName}`;
  tag.setAttribute('aria-hidden', creatorSignatureVisible ? 'false' : 'true');
  tag.classList.toggle('is-visible', creatorSignatureVisible);
}

function setCreatorSignatureVisible(isVisible) {
  const tag = document.getElementById('creator-signature');
  if (!tag) return;
  creatorSignatureVisible = !!isVisible;
  const authorIdentity = decodeAuthorIdentity();
  tag.textContent = `Crafted by ${authorIdentity.displayName}`;
  tag.setAttribute('aria-hidden', creatorSignatureVisible ? 'false' : 'true');
  tag.classList.toggle('is-visible', creatorSignatureVisible);
}

function toggleLicenseNote() {
  const note = document.getElementById('license-note');
  if (!note) return;
  licenseNoteVisible = !licenseNoteVisible;
  note.setAttribute('aria-hidden', licenseNoteVisible ? 'false' : 'true');
  note.classList.toggle('is-visible', licenseNoteVisible);
}

function setLicenseNoteVisible(isVisible) {
  const note = document.getElementById('license-note');
  if (!note) return;
  licenseNoteVisible = !!isVisible;
  note.setAttribute('aria-hidden', licenseNoteVisible ? 'false' : 'true');
  note.classList.toggle('is-visible', licenseNoteVisible);
}

function toggleLicenseAndCreator() {
  const nextVisible = !licenseNoteVisible;
  setLicenseNoteVisible(nextVisible);
  setCreatorSignatureVisible(nextVisible);
}

// Deep clone a value using JSON serialisation. This is used to
// duplicate default objects so that mutations to state do not affect
// DEFAULT_DATA. Note: this will drop functions and complex types.
function clone(val) {
  return JSON.parse(JSON.stringify(val));
}

function resolveResourcePath(assetPath) {
  if (typeof assetPath !== 'string') return '';
  const trimmedPath = assetPath.trim();
  if (!trimmedPath) return '';
  if (
    trimmedPath.startsWith('data:') ||
    trimmedPath.startsWith('blob:') ||
    trimmedPath.startsWith('http://') ||
    trimmedPath.startsWith('https://') ||
    trimmedPath.startsWith('resources/')
  ) {
    return trimmedPath;
  }
  return `resources/${trimmedPath.replace(/^\/+/, '')}`;
}

function getCropBaseName(item) {
  if (!item) return '';
  const sourcePath = item.seedImage || item.image || '';
  const fileName = sourcePath.split('/').pop() || '';
  const baseName = fileName.replace(/\.png$/i, '').replace(/_seeds$/i, '');
  return baseName;
}

function getSeedImagePath(item) {
  if (!item) return '';
  return resolveResourcePath(item.seedImage || item.image || '');
}

function getPlantStageImagePath(item, stageIndex) {
  if (!item) return '';
  const safeStageIndex = Math.max(1, Number(stageIndex) || 1);
  if (Array.isArray(item.plantStageImages) && item.plantStageImages.length > 0) {
    const imageIndex = Math.min(item.plantStageImages.length - 1, safeStageIndex - 1);
    return resolveResourcePath(item.plantStageImages[imageIndex]);
  }
  if (typeof item.plantImageBase === 'string' && item.plantImageBase) {
    return resolveResourcePath(`${item.plantImageBase}${safeStageIndex}.png`);
  }
  if (item.plantStages && item.plantStages > 1) {
    const genericStageIndex = Math.min(6, safeStageIndex);
    return resolveResourcePath(`plants/plant${genericStageIndex}.png`);
  }
  return getSeedImagePath(item);
}

function getHarvestImagePath(item) {
  if (!item) return '';
  if (item.harvestImage) return resolveResourcePath(item.harvestImage);
  if (item.plantStages && item.plantStages > 1) {
    const baseName = getCropBaseName(item);
    if (baseName) return resolveResourcePath(`items/${baseName}.png`);
  }
  return getSeedImagePath(item);
}

function mergeItemAssetsWithDefaults(items, defaultItems) {
  if (!Array.isArray(items) || !Array.isArray(defaultItems)) {
    return { items, changed: false };
  }
  const defaultsById = new Map(defaultItems.map(item => [item.id, item]));
  let changed = false;
  const mergedItems = items.map(item => {
    if (!item || typeof item !== 'object') return item;
    const defaultItem = defaultsById.get(item.id);
    if (!defaultItem) return item;
    let nextItem = item;
    const assignIfMissing = (key) => {
      const currentValue = nextItem[key];
      const defaultValue = defaultItem[key];
      const valueMissing = currentValue === undefined || currentValue === null
        || (Array.isArray(currentValue) && currentValue.length === 0);
      if (!valueMissing || defaultValue === undefined || defaultValue === null) return;
      if (nextItem === item) nextItem = { ...item };
      nextItem[key] = Array.isArray(defaultValue) ? [...defaultValue] : defaultValue;
      changed = true;
    };
    assignIfMissing('seedImage');
    assignIfMissing('plantStageImages');
    assignIfMissing('harvestImage');
    assignIfMissing('rarity');
    if (nextItem.seedImage && nextItem.image !== nextItem.seedImage) {
      if (nextItem === item) nextItem = { ...item };
      nextItem.image = nextItem.seedImage;
      changed = true;
    }
    return nextItem;
  });
  return { items: mergedItems, changed };
}

function mergeStoreCosmeticsWithDefaults(store, defaultStore) {
  if (!store || typeof store !== 'object' || !defaultStore || typeof defaultStore !== 'object') {
    return { store, changed: false };
  }
  if (!Array.isArray(defaultStore.cosmetics)) {
    return { store, changed: false };
  }
  const savedCosmetics = Array.isArray(store.cosmetics) ? store.cosmetics : [];
  const savedById = new Map(savedCosmetics.map(item => [item?.id, item]));
  let changed = false;
  const mergedCosmetics = defaultStore.cosmetics.map(defaultItem => {
    if (!defaultItem || typeof defaultItem !== 'object' || typeof defaultItem.id !== 'string') {
      return defaultItem;
    }
    const saved = savedById.get(defaultItem.id);
    if (!saved || typeof saved !== 'object') {
      changed = true;
      return { ...defaultItem };
    }
    const merged = { ...defaultItem, unlocked: !!saved.unlocked };
    if (
      merged.name !== saved.name ||
      merged.type !== saved.type ||
      merged.price !== saved.price
    ) {
      changed = true;
    }
    return merged;
  });
  if (!Array.isArray(store.cosmetics) || store.cosmetics.length !== mergedCosmetics.length) {
    changed = true;
  }
  return { store: { ...store, cosmetics: mergedCosmetics }, changed };
}

function mergeGoalsWithDefaults(goals, defaultGoals) {
  if (!Array.isArray(defaultGoals)) {
    return { goals, changed: false };
  }
  const savedGoals = Array.isArray(goals) ? goals : [];
  const savedById = new Map(savedGoals.map(goal => [goal?.id, goal]));
  let changed = false;
  const mergedGoals = defaultGoals.map(defaultGoal => {
    if (!defaultGoal || typeof defaultGoal !== 'object' || typeof defaultGoal.id !== 'string') {
      return defaultGoal;
    }
    const saved = savedById.get(defaultGoal.id);
    if (!saved || typeof saved !== 'object') {
      changed = true;
      return clone(defaultGoal);
    }
    const mergedGoal = clone(defaultGoal);
    if (saved.enabled === false) {
      mergedGoal.enabled = false;
    }
    if (JSON.stringify(saved) !== JSON.stringify(mergedGoal)) {
      changed = true;
    }
    return mergedGoal;
  });
  if (savedGoals.length !== mergedGoals.length) {
    changed = true;
  }
  return { goals: mergedGoals, changed };
}

function normalizeRarity(value) {
  if (typeof value !== 'string') return 'common';
  const trimmed = value.trim().toLowerCase();
  return RARITY_TYPES.includes(trimmed) ? trimmed : 'common';
}

function rollRarity() {
  const totalWeight = RARITY_ROLLS.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) return 'common';
  let roll = Math.random() * totalWeight;
  for (const entry of RARITY_ROLLS) {
    roll -= entry.weight;
    if (roll <= 0) {
      return entry.rarity;
    }
  }
  return 'common';
}

function getRarityMultiplier(rarity) {
  const normalized = normalizeRarity(rarity);
  return RARITY_MULTIPLIERS[normalized] ?? RARITY_MULTIPLIERS.common;
}

function addRareGrowthMessage(item, rarity) {
  const normalized = normalizeRarity(rarity);
  if (normalized !== 'rare' && normalized !== 'mythic') return;
  const rarityLabel = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  const multiplier = getRarityMultiplier(normalized);
  const multiplierLabel = Number.isInteger(multiplier) ? String(multiplier) : multiplier.toFixed(2);
  const basePrice = getItemCurrentPrice(item.id);
  addMessage(
    `1x ${rarityLabel} ${item.name} grown! Worth ${multiplierLabel}x buy price ($${basePrice.toFixed(2)} -> $${(basePrice * multiplier).toFixed(2)}).`,
    { speaker: 'player', emotion: 'excited', category: 'progress', priority: 'high' }
  );
}

// ----------- Utility Functions -----------

/**
 * Retrieve a data object from localStorage. If the key does not exist
 * localStorage, return the provided default value. All data is
 * serialised as JSON strings.
 *
 * @param {string} key The key under which the data is stored
 * @param {any} defaultValue The default value to return if key absent
 * @returns {any} Parsed object from JSON or default value
 */
function loadFromStorage(key, defaultValue) {
  const value = localStorage.getItem(key);
  if (value === null) return defaultValue;
  try {
    return JSON.parse(value);
  } catch (e) {
    console.error(`Failed to parse localStorage key ${key}`, e);
    return defaultValue;
  }
}

/**
 * Save a data object to localStorage. Objects will be stringified to
 * JSON automatically.
 *
 * @param {string} key The key under which to store the data
 * @param {any} data The data to serialise and save
 */
function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save localStorage key ${key}`, e);
  }
}

/**
 * Initialise state by loading from localStorage or falling back to
 * DEFAULT_DATA. This function should be called once on page load.
 */
function initialiseState() {
  // Load from localStorage if available; otherwise clone default values
  state.player        = loadFromStorage('player',        null) ?? clone(DEFAULT_DATA.player);
  state.items         = loadFromStorage('items',         null) ?? clone(DEFAULT_DATA.items);
  state.shop          = loadFromStorage('shop',          null) ?? clone(DEFAULT_DATA.shop);
  state.inventory     = loadFromStorage('inventory',     null) ?? clone(DEFAULT_DATA.inventory);
  // Active news events are stored separately from the schedule in
  // DEFAULT_DATA.newsEvents. Initialise with saved active events or
  // an empty array; do not clone DEFAULT_DATA.newsEvents, which
  // contains the schedule of upcoming events.
  state.newsEvents    = loadFromStorage('newsEvents',    null) ?? [];
  state.store         = loadFromStorage('store',         null) ?? clone(DEFAULT_DATA.store);
  state.goals         = loadFromStorage('goals',         null) ?? clone(DEFAULT_DATA.goals);
  state.goalsClaimed  = loadFromStorage('goalsClaimed',  null) ?? {};
  state.unlockedTools = loadFromStorage('unlockedTools', null) ?? getDefaultUnlockedTools();
  state.unlockedShopItems = loadFromStorage('unlockedShopItems', null) ?? getDefaultUnlockedShopItems(state.items);
  state.freePurchasesByItem = loadFromStorage('freePurchasesByItem', null) ?? {};
  state.goalFlags = loadFromStorage('goalFlags', null) ?? {};
  state.goalStats = loadFromStorage('goalStats', null) ?? { harvestCount: 0, itemsHarvested: {} };
  state.dayActionCount = Math.max(0, Number(loadFromStorage('dayActionCount', null) ?? 0) || 0);
  state.dailyMarketRollHistory = loadFromStorage('dailyMarketRollHistory', null) ?? [];
  state.lastRollFatiguePercent = Math.max(0, Math.min(100, Number(loadFromStorage('lastRollFatiguePercent', null) ?? 0) || 0));
  state.lastRollImpactMultiplier = Math.max(0, Math.min(1, Number(loadFromStorage('lastRollImpactMultiplier', null) ?? 1) || 1));
  state.dayStartSnapshot = loadFromStorage('dayStartSnapshot', null);
  state.daySalesCount = Math.max(0, Number(loadFromStorage('daySalesCount', null) ?? 0) || 0);
  state.daySalesTotal = Math.max(0, Number(loadFromStorage('daySalesTotal', null) ?? 0) || 0);
  state.dayTopSale = loadFromStorage('dayTopSale', null);
  state.daySummaryHistory = loadFromStorage('daySummaryHistory', null) ?? [];
  state.pendingDaySummary = null;
  // News history stores arrays of events per week. Load from storage or start empty.
  state.newsHistory   = loadFromStorage('newsHistory',   null) ?? clone(DEFAULT_DATA.newsHistory);
  ensurePlayerProgressState();
  const itemMergeResult = mergeItemAssetsWithDefaults(state.items, DEFAULT_DATA.items);
  if (itemMergeResult.changed) {
    state.items = itemMergeResult.items;
    saveToStorage('items', state.items);
  }
  const storeMergeResult = mergeStoreCosmeticsWithDefaults(state.store, DEFAULT_DATA.store);
  if (storeMergeResult.changed) {
    state.store = storeMergeResult.store;
    saveToStorage('store', state.store);
  }
  const goalMergeResult = mergeGoalsWithDefaults(state.goals, DEFAULT_DATA.goals);
  if (goalMergeResult.changed) {
    state.goals = goalMergeResult.goals;
    saveToStorage('goals', state.goals);
  }
  if (Array.isArray(state.items)) {
    let rarityChanged = false;
    const normalized = state.items.map(item => {
      if (!item || typeof item !== 'object') return item;
      const normalizedRarity = normalizeRarity(item.rarity);
      if (item.rarity !== normalizedRarity) {
        rarityChanged = true;
        return { ...item, rarity: normalizedRarity };
      }
      return item;
    });
    if (rarityChanged) {
      state.items = normalized;
      saveToStorage('items', state.items);
    }
  }
  // If saved items do not match the current defaults, reset items/shop/inventory.
  const defaultItem = DEFAULT_DATA.items[0];
  const savedItem = Array.isArray(state.items) ? state.items[0] : null;
  const itemsMatch = Array.isArray(state.items)
    && state.items.length === DEFAULT_DATA.items.length
    && savedItem
    && savedItem.id === defaultItem.id
    && savedItem.name === defaultItem.name;
  if (!itemsMatch) {
    state.items = clone(DEFAULT_DATA.items);
    state.shop = clone(DEFAULT_DATA.shop);
    state.inventory = clone(DEFAULT_DATA.inventory);
    saveState();
  }
  // Initialise the Minesweeper grid state. A 7x7 grid has 49 cells,
  // each represented by whether it has been purchased/unlocked and what item it contains.
  // Earlier versions stored a 'grid' boolean array indicating revealed cells. To support
  // purchased grid slots and items, we now maintain two parallel arrays:
  //  - gridUnlocked: boolean flag for each cell indicating whether the slot has been purchased
  //  - gridItems: stores the itemId placed in the slot (or null if empty)
  //  When migrating from an old save that uses 'grid', treat any previously revealed cell
  //  as purchased and empty.
  const oldGrid = loadFromStorage('grid', null);
  state.gridUnlocked = loadFromStorage('gridUnlocked', null);
  state.gridItems    = loadFromStorage('gridItems', null);
  state.gridPlantedDay = loadFromStorage('gridPlantedDay', null);
  state.gridWateredDay = loadFromStorage('gridWateredDay', null);
  state.gridWateredCount = loadFromStorage('gridWateredCount', null);
  state.gridMiningHits = loadFromStorage('gridMiningHits', null);
  state.gridRarity = loadFromStorage('gridRarity', null);
  state.gridPurchasePrice = loadFromStorage('gridPurchasePrice', null);
  state.activeTool = loadFromStorage('activeTool', null);
  if (!Array.isArray(state.gridUnlocked) || state.gridUnlocked.length !== GRID_CELL_COUNT) {
    if (Array.isArray(state.gridUnlocked) && state.gridUnlocked.length >= GRID_CELL_COUNT) {
      state.gridUnlocked = state.gridUnlocked.slice(0, GRID_CELL_COUNT).map(val => !!val);
    } else if (Array.isArray(oldGrid) && oldGrid.length >= GRID_CELL_COUNT) {
      state.gridUnlocked = oldGrid.slice(0, GRID_CELL_COUNT).map(val => !!val);
    } else {
      state.gridUnlocked = Array(GRID_CELL_COUNT).fill(false);
    }
  }
  if (!Array.isArray(state.gridItems) || state.gridItems.length !== GRID_CELL_COUNT) {
    if (Array.isArray(state.gridItems) && state.gridItems.length >= GRID_CELL_COUNT) {
      state.gridItems = state.gridItems.slice(0, GRID_CELL_COUNT);
    } else {
      state.gridItems = Array(GRID_CELL_COUNT).fill(null);
    }
  }
  if (!Array.isArray(state.gridPlantedDay) || state.gridPlantedDay.length !== GRID_CELL_COUNT) {
    if (Array.isArray(state.gridPlantedDay) && state.gridPlantedDay.length >= GRID_CELL_COUNT) {
      state.gridPlantedDay = state.gridPlantedDay.slice(0, GRID_CELL_COUNT);
    } else {
      state.gridPlantedDay = Array(GRID_CELL_COUNT).fill(null);
    }
  }
  if (!Array.isArray(state.gridWateredDay) || state.gridWateredDay.length !== GRID_CELL_COUNT) {
    if (Array.isArray(state.gridWateredDay) && state.gridWateredDay.length >= GRID_CELL_COUNT) {
      state.gridWateredDay = state.gridWateredDay.slice(0, GRID_CELL_COUNT);
    } else {
      state.gridWateredDay = Array(GRID_CELL_COUNT).fill(null);
    }
  }
  if (!Array.isArray(state.gridWateredCount) || state.gridWateredCount.length !== GRID_CELL_COUNT) {
    if (Array.isArray(state.gridWateredCount) && state.gridWateredCount.length >= GRID_CELL_COUNT) {
      state.gridWateredCount = state.gridWateredCount.slice(0, GRID_CELL_COUNT);
    } else {
      state.gridWateredCount = Array(GRID_CELL_COUNT).fill(0);
    }
  }
  if (!Array.isArray(state.gridMiningHits) || state.gridMiningHits.length !== GRID_CELL_COUNT) {
    if (Array.isArray(state.gridMiningHits) && state.gridMiningHits.length >= GRID_CELL_COUNT) {
      state.gridMiningHits = state.gridMiningHits.slice(0, GRID_CELL_COUNT);
    } else {
      state.gridMiningHits = Array(GRID_CELL_COUNT).fill(0);
    }
  }
  if (!Array.isArray(state.gridRarity) || state.gridRarity.length !== GRID_CELL_COUNT) {
    if (Array.isArray(state.gridRarity) && state.gridRarity.length >= GRID_CELL_COUNT) {
      state.gridRarity = state.gridRarity.slice(0, GRID_CELL_COUNT);
    } else {
      state.gridRarity = Array(GRID_CELL_COUNT).fill(null);
    }
  }
  if (!Array.isArray(state.gridPurchasePrice) || state.gridPurchasePrice.length !== GRID_CELL_COUNT) {
    if (Array.isArray(state.gridPurchasePrice) && state.gridPurchasePrice.length >= GRID_CELL_COUNT) {
      state.gridPurchasePrice = state.gridPurchasePrice.slice(0, GRID_CELL_COUNT);
    } else {
      state.gridPurchasePrice = Array(GRID_CELL_COUNT).fill(null);
    }
  }
  if (!TOOL_LIST.includes(state.activeTool)) {
    state.activeTool = TOOL_GLOVE;
  }
  if (!state.unlockedTools || typeof state.unlockedTools !== 'object') {
    state.unlockedTools = getDefaultUnlockedTools();
  }
  if (!state.unlockedShopItems || typeof state.unlockedShopItems !== 'object') {
    state.unlockedShopItems = getDefaultUnlockedShopItems(state.items);
  }
  const defaultShopUnlocks = getDefaultUnlockedShopItems(state.items);
  Object.keys(defaultShopUnlocks).forEach(itemId => {
    if (!(itemId in state.unlockedShopItems)) {
      state.unlockedShopItems[itemId] = defaultShopUnlocks[itemId];
    }
  });
  if (syncGoalLockedShopUnlocks()) {
    saveToStorage('unlockedShopItems', state.unlockedShopItems);
    saveToStorage('shop', state.shop);
  }
  if (!state.freePurchasesByItem || typeof state.freePurchasesByItem !== 'object') {
    state.freePurchasesByItem = {};
  }
  if (!state.goalFlags || typeof state.goalFlags !== 'object') {
    state.goalFlags = {};
  }
  if (!state.goalsClaimed || typeof state.goalsClaimed !== 'object' || Array.isArray(state.goalsClaimed)) {
    state.goalsClaimed = {};
  }
  if (!Array.isArray(state.goals)) {
    state.goals = clone(DEFAULT_DATA.goals);
  }
  if (!state.goalStats || typeof state.goalStats !== 'object') {
    state.goalStats = { harvestCount: 0, itemsHarvested: {} };
  }
  if (!state.goalStats.itemsHarvested || typeof state.goalStats.itemsHarvested !== 'object') {
    state.goalStats.itemsHarvested = {};
  }
  if (typeof state.goalStats.harvestCount !== 'number') {
    state.goalStats.harvestCount = 0;
  }
  if (!Array.isArray(state.dailyMarketRollHistory)) {
    state.dailyMarketRollHistory = [];
  }
  state.daySalesCount = Math.max(0, Number(state.daySalesCount) || 0);
  state.daySalesTotal = Math.max(0, Number(state.daySalesTotal) || 0);
  if (!Array.isArray(state.daySummaryHistory)) {
    state.daySummaryHistory = [];
  }
  if (!state.dayTopSale || typeof state.dayTopSale !== 'object') {
    state.dayTopSale = null;
  } else {
    state.dayTopSale = {
      itemName: String(state.dayTopSale.itemName || 'Item'),
      value: Math.max(0, Number(state.dayTopSale.value) || 0),
      quantity: Math.max(1, Number(state.dayTopSale.quantity) || 1)
    };
  }
  state.pendingDaySummary = null;
  if (!isToolUnlocked(TOOL_WATERING) && state.activeTool === TOOL_WATERING) {
    state.activeTool = TOOL_GLOVE;
  }
  const currentDay = Number(state.player?.day) || 1;
  const validDayStart = state.dayStartSnapshot
    && typeof state.dayStartSnapshot === 'object'
    && Number(state.dayStartSnapshot.day) === currentDay;
  if (!validDayStart) {
    state.dayStartSnapshot = getCurrentDaySnapshot();
  }
  state.goalCelebrationQueue = [];
  state.activeGoalCelebration = null;
  selectedGridCellIndex = null;
  selectedShopItemId = null;
  selectionPulseId = null;
  clearGoalCelebrationSparkles();
  setGoalCelebrationOpen(false);

}

/**
 * Persist the current state back to localStorage. Invoke this after
 * any mutation to player data, shop, inventory, reports, or news.
 */
function saveState() {
  updateNetWorth();
  saveToStorage('player',        state.player);
  saveToStorage('items',         state.items);
  saveToStorage('shop',          state.shop);
  saveToStorage('inventory',     state.inventory);
  saveToStorage('newsEvents',    state.newsEvents);
  saveToStorage('store',         state.store);
  saveToStorage('newsHistory',   state.newsHistory);
  saveToStorage('goals',         state.goals);
  saveToStorage('goalsClaimed',  state.goalsClaimed);
  saveToStorage('unlockedTools', state.unlockedTools);
  saveToStorage('unlockedShopItems', state.unlockedShopItems);
  saveToStorage('freePurchasesByItem', state.freePurchasesByItem);
  saveToStorage('goalFlags', state.goalFlags);
  saveToStorage('goalStats', state.goalStats);
  saveToStorage('dayActionCount', state.dayActionCount);
  saveToStorage('dailyMarketRollHistory', state.dailyMarketRollHistory);
  saveToStorage('lastRollFatiguePercent', state.lastRollFatiguePercent);
  saveToStorage('lastRollImpactMultiplier', state.lastRollImpactMultiplier);
  saveToStorage('dayStartSnapshot', state.dayStartSnapshot);
  saveToStorage('daySalesCount', state.daySalesCount);
  saveToStorage('daySalesTotal', state.daySalesTotal);
  saveToStorage('dayTopSale', state.dayTopSale);
  saveToStorage('daySummaryHistory', state.daySummaryHistory);
  // Persist grid purchase and placement state. These arrays represent which grid
  // slots have been purchased (gridUnlocked) and which contain items (gridItems).
  saveToStorage('gridUnlocked',  state.gridUnlocked);
  saveToStorage('gridItems',     state.gridItems);
  saveToStorage('gridPlantedDay', state.gridPlantedDay);
  saveToStorage('gridWateredDay', state.gridWateredDay);
  saveToStorage('gridWateredCount', state.gridWateredCount);
  saveToStorage('gridMiningHits', state.gridMiningHits);
  saveToStorage('gridRarity', state.gridRarity);
  saveToStorage('gridPurchasePrice', state.gridPurchasePrice);
  saveToStorage('activeTool', state.activeTool);
}

/**
 * Reset the game to default values. Clears all data from localStorage
 * and resets the in‑memory state. This is triggered from the Store tab
 * when the user opts to reset their progress. A confirmation dialog
 * protects against accidental resets. You can further enhance this by
 * requiring the user to type a phrase before resetting.
 */
async function resetGame() {
  if (!confirm('Are you sure you want to reset your progress? This will erase all saved data.')) {
    return;
  }
  // Clear all persisted state
  localStorage.clear();
  // Reload external JSON data to repopulate default definitions. If
  // loading fails (e.g. file protocol restrictions), the fallback
  // definitions in DEFAULT_DATA will remain.
  try {
    await loadJSONData();
  } catch (e) {
    console.error('Error reloading data during reset', e);
  }
  // Initialise state from freshly loaded defaults
  initialiseState();
  // Reset grid arrays explicitly. Without this, residual gridUnlocked
  // entries from previous sessions could persist if state was not fully
  // reinitialised. Ensure both the unlocked flags and placed items
  // arrays are fresh for a new game.
  state.gridUnlocked = Array(GRID_CELL_COUNT).fill(false);
  state.gridItems    = Array(GRID_CELL_COUNT).fill(null);
  state.gridPlantedDay = Array(GRID_CELL_COUNT).fill(null);
  state.gridWateredDay = Array(GRID_CELL_COUNT).fill(null);
  state.gridWateredCount = Array(GRID_CELL_COUNT).fill(0);
  state.gridMiningHits = Array(GRID_CELL_COUNT).fill(0);
  state.gridRarity = Array(GRID_CELL_COUNT).fill(null);
  state.gridPurchasePrice = Array(GRID_CELL_COUNT).fill(null);
  state.activeTool = TOOL_GLOVE;
  state.goals = clone(DEFAULT_DATA.goals);
  state.goalsClaimed = {};
  state.unlockedTools = getDefaultUnlockedTools();
  state.unlockedShopItems = getDefaultUnlockedShopItems(state.items);
  state.freePurchasesByItem = {};
  state.goalFlags = {};
  state.goalStats = { harvestCount: 0, itemsHarvested: {} };
  state.dayActionCount = 0;
  state.dailyMarketRollHistory = [];
  state.lastRollFatiguePercent = 0;
  state.lastRollImpactMultiplier = 1;
  state.daySalesCount = 0;
  state.daySalesTotal = 0;
  state.dayTopSale = null;
  state.daySummaryHistory = [];
  state.pendingDaySummary = null;
  state.goalCelebrationQueue = [];
  state.activeGoalCelebration = null;
  clearGoalCelebrationSparkles();
  setGoalCelebrationOpen(false);
  saveToStorage('gridUnlocked', state.gridUnlocked);
  saveToStorage('gridItems',    state.gridItems);
  saveToStorage('gridPlantedDay', state.gridPlantedDay);
  saveToStorage('gridWateredDay', state.gridWateredDay);
  saveToStorage('gridWateredCount', state.gridWateredCount);
  saveToStorage('gridMiningHits', state.gridMiningHits);
  saveToStorage('gridRarity', state.gridRarity);
  saveToStorage('gridPurchasePrice', state.gridPurchasePrice);
  saveToStorage('activeTool', state.activeTool);
  saveToStorage('goals', state.goals);
  saveToStorage('goalsClaimed', state.goalsClaimed);
  saveToStorage('unlockedTools', state.unlockedTools);
  saveToStorage('unlockedShopItems', state.unlockedShopItems);
  saveToStorage('freePurchasesByItem', state.freePurchasesByItem);
  saveToStorage('goalFlags', state.goalFlags);
  saveToStorage('goalStats', state.goalStats);
  saveToStorage('dayActionCount', state.dayActionCount);
  saveToStorage('dailyMarketRollHistory', state.dailyMarketRollHistory);
  saveToStorage('lastRollFatiguePercent', state.lastRollFatiguePercent);
  saveToStorage('lastRollImpactMultiplier', state.lastRollImpactMultiplier);
  saveToStorage('daySalesCount', state.daySalesCount);
  saveToStorage('daySalesTotal', state.daySalesTotal);
  saveToStorage('dayTopSale', state.dayTopSale);
  saveToStorage('daySummaryHistory', state.daySummaryHistory);
  renderAll();
  updateToolButtons();
  updateCursorForTool();
  // Show welcome message on reset
  if (!state.player.welcomeShown) {
    addMessage('Welcome to the market!');
    state.player.welcomeShown = true;
    saveState();
  }
  alert('Game has been reset to default values.');
}

// ----------- UI Rendering Functions -----------

/**
 * Render the HUD elements (day, cash, storage, net worth). Uses the
 * current state to populate values. Use to update the top bar after
 * each game tick or transaction.
 */
function renderHUD() {
  ensurePlayerProgressState();
  updateNetWorth();
  const dayElems    = document.querySelectorAll('#hud-day');
  const cashElems   = document.querySelectorAll('#hud-cash');
  const storageElem = document.getElementById('hud-storage');
  const netElems    = document.querySelectorAll('#hud-networth');
  const { day, week, year, cash, capacity, capacityUsed, netWorth } = state.player;
  // Compute day of week (Mon, Tue, etc.). Day 1 is Monday.
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dow        = daysOfWeek[(day - 1) % 7];
  dayElems.forEach(el => {
    el.textContent = `${dow} - Day ${day}`;
  });
  cashElems.forEach(el => {
    el.textContent = `Cash: $${cash.toFixed(2)}`;
  });
  if (storageElem) {
    storageElem.textContent = 'Storage: Unlimited';
  }
  netElems.forEach(el => {
    el.textContent = `Net Worth: $${netWorth.toFixed(2)}`;
  });
  renderPlayerLevelStatus();
}

function renderEnergyBar() {
  const bar = document.getElementById('energy-bar');
  const text = document.getElementById('energy-text');
  if (!bar || !state.player) return;
  const max = Math.max(1, state.player.energyMax || 10);
  const current = Math.max(0, Math.min(state.player.energy ?? max, max));
  bar.innerHTML = '';
  for (let i = 0; i < max; i += 1) {
    const segment = document.createElement('div');
    segment.className = 'energy-segment' + (i < current ? ' filled' : '');
    bar.appendChild(segment);
  }
  bar.setAttribute('aria-valuenow', String(current));
  bar.setAttribute('aria-valuemax', String(max));
  if (text) {
    text.textContent = `Energy: ${current}/${max}`;
  }
  renderPlayerLevelStatus();
  updateTimeOfDayMood();
}

function renderPlayerLevelStatus() {
  ensurePlayerProgressState();
  const levelLabel = document.getElementById('player-level-label');
  const xpText = document.getElementById('player-xp-text');
  const xpFill = document.getElementById('player-xp-fill');
  const xpBar = document.getElementById('player-xp-bar');
  if (!state.player) return;
  const level = state.player.playerLevel;
  const atCap = level >= PLAYER_LEVEL_CAP;
  const currentXp = Math.max(0, Number(state.player.playerXp) || 0);
  const xpToNext = atCap ? 0 : getXpToNextLevel(level);
  const percent = atCap ? 100 : Math.min(100, Math.round((currentXp / Math.max(1, xpToNext)) * 100));
  if (levelLabel) {
    levelLabel.textContent = `Level: ${level}`;
  }
  if (xpText) {
    xpText.textContent = atCap ? 'MAX LEVEL' : `${currentXp} / ${xpToNext} XP`;
  }
  if (xpFill) {
    xpFill.style.width = `${percent}%`;
  }
  const xpHoverText = atCap ? 'MAX LEVEL' : `${currentXp} / ${xpToNext} XP`;
  if (levelLabel) {
    levelLabel.title = xpHoverText;
  }
  if (xpBar) {
    xpBar.title = xpHoverText;
  }
  if (xpBar) {
    xpBar.setAttribute('aria-valuenow', String(atCap ? 0 : currentXp));
    xpBar.setAttribute('aria-valuemax', String(atCap ? 1 : xpToNext));
  }
}

function getGridRarity(index) {
  if (!Array.isArray(state.gridRarity)) return null;
  const rarity = state.gridRarity[index];
  if (!rarity) return null;
  return normalizeRarity(rarity);
}

function assignGridRarity(index) {
  if (!Array.isArray(state.gridRarity)) return null;
  const existing = getGridRarity(index);
  if (existing) return existing;
  const rolled = rollRarity();
  state.gridRarity[index] = rolled;
  saveToStorage('gridRarity', state.gridRarity);
  return rolled;
}

/**
 * Render the Farmer's Market tab. Populates the shop and inventory tables with
 * current data and sets up buy/sell controls. This function
 * reconstructs the DOM each time it runs; for better performance you
 * could diff the tables or reuse elements.
 */
function renderMarket() {
  // Unified farmer's market table container
  const tableContainer = document.getElementById('market-table');
  const gridEl         = document.getElementById('grid');
  if (selectedShopItemId && !isShopItemUnlocked(selectedShopItemId)) {
    selectedShopItemId = null;
  }
  if (
    selectedGridCellIndex !== null
    && (!Array.isArray(state.gridItems)
      || selectedGridCellIndex < 0
      || selectedGridCellIndex >= state.gridItems.length
      || !state.gridItems[selectedGridCellIndex])
  ) {
    selectedGridCellIndex = null;
  }
  if (selectedGridCellIndices.size) {
    const stale = [];
    selectedGridCellIndices.forEach(index => {
      if (!getGridCellSellSnapshot(index)) {
        stale.push(index);
      }
    });
    stale.forEach(index => selectedGridCellIndices.delete(index));
  }
  // Clear previous content
  if (tableContainer) tableContainer.innerHTML = '';
  if (gridEl) gridEl.innerHTML = '';
  // Build combined table
  const table = document.createElement('table');
  table.className = 'zebra-table';
  const headerRow = document.createElement('tr');
  const headers = ['Img', 'Item', 'Price'];
  headers.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);
  // For each shop entry, create a unified row
  state.shop.forEach(entry => {
    if (!isShopItemUnlocked(entry.itemId)) return;
    const item = state.items.find(it => it.id === entry.itemId); 
    if (!item) return; 
    const row = document.createElement('tr'); 
    row.style.cursor = 'pointer'; 
    // Do not set the entire row as draggable. Instead, attach draggable behaviour
    // to the item image so that dragging originates from the icon. This improves
    // cross‑browser drag behaviour and avoids issues with draggable <tr> elements.
    // Img
    const imgCell = document.createElement('td');
    const img = document.createElement('img');
    const seedImagePath = getSeedImagePath(item);
    if (seedImagePath) {
      img.src = seedImagePath;
    } else {
      img.style.visibility = 'hidden';
    }
    img.alt = item.name;
    img.width = 48;
    img.height = 48;
    imgCell.appendChild(img);
    row.appendChild(imgCell);
    // Item (description)
    const descCell = document.createElement('td');
    descCell.textContent = item.description || item.name;
    row.appendChild(descCell);
    const avgPrice = (entry.daysCount && entry.priceSum) ? (entry.priceSum / entry.daysCount) : entry.price;
    // Price
    const priceCell = document.createElement('td');
    const freeCount = getFreePurchaseCount(item.id);
    const priceText = document.createElement('span');
    priceText.className = 'market-price-value';
    priceText.textContent = freeCount > 0
      ? `$${entry.price.toFixed(2)} (${freeCount} free)`
      : `$${entry.price.toFixed(2)}`;
    priceCell.appendChild(priceText);
    const avgDelta = avgPrice > 0 ? ((entry.price - avgPrice) / avgPrice) : 0;
    const avgDeltaPct = Math.abs(avgDelta * 100).toFixed(0);
    const avgDeltaSigned = `${avgDelta >= 0 ? '+' : '-'}${avgDeltaPct}%`;
    const trendChip = document.createElement('span');
    trendChip.className = `insight-chip market-price-trend ${avgDelta <= -0.05 ? 'good' : (avgDelta >= 0.05 ? 'bad' : '')}`.trim();
    if (avgDelta <= -0.05) {
      trendChip.textContent = `Great Deal (${avgDeltaSigned})`;
      trendChip.title = `${Math.abs(avgDelta * 100).toFixed(0)}% below average market price`;
    } else if (avgDelta >= 0.05) {
      trendChip.textContent = `Overpriced (${avgDeltaSigned})`;
      trendChip.title = `${Math.abs(avgDelta * 100).toFixed(0)}% above average market price`;
    } else {
      trendChip.textContent = `Fair Price (${avgDeltaSigned})`;
      trendChip.title = 'Near average market price';
    }
    priceCell.appendChild(trendChip);
    row.appendChild(priceCell);

    row.classList.add('market-row'); 
    row.dataset.itemId = String(item.id); 
    if (selectedShopItemId === item.id) { 
      row.classList.add('market-row-selected'); 
    } 
    if (selectionPulseId === item.id) { 
      row.classList.add('market-row-pulse'); 
      row.addEventListener('animationend', () => { 
        row.classList.remove('market-row-pulse'); 
      }, { once: true }); 
    } 
    row.addEventListener('click', () => { 
      selectShopItem(item.id); 
    }); 

    table.appendChild(row);
  });
  if (tableContainer) { 
    tableContainer.appendChild(table); 
  } 
  if (selectionPulseId !== null) { 
    selectionPulseId = null; 
  } 
  // Build the 7x7 farm. Each cell may be locked (unpurchased), unlocked and empty, or contain an item.
  for (let i = 0; i < GRID_CELL_COUNT; i++) { 
    const cell = document.createElement('div'); 
    cell.className = 'grid-cell'; 
    cell.dataset.index = String(i); 
    if (selectedGridCellIndex === i) {
      cell.classList.add('grid-cell-selected');
    }
    if (selectedGridCellIndices.has(i)) {
      cell.classList.add('grid-cell-bulk-selected');
    }
    // Determine unlocked state and item placement. Use temporary variables for initial
    // visual state only. Event handlers will reference state arrays directly to
    // reflect up‑to‑date values.
    const unlocked = Array.isArray(state.gridUnlocked) ? state.gridUnlocked[i] : false;
    const itemId   = Array.isArray(state.gridItems) ? state.gridItems[i] : null;
    if (unlocked) {
      // Purchased slots appear sunken using the same styling as the old 'revealed' class
      cell.classList.add('revealed');
    }
    // If an item occupies this cell, render its icon and make it draggable. Use
    // the current state arrays to determine contents.
    if (state.gridUnlocked && state.gridUnlocked[i] && state.gridItems && state.gridItems[i]) {
      const itmId = state.gridItems[i];
        const it = state.items.find(itm => itm.id === itmId);
        if (it) {
          const growth = getPlantGrowthState(it, i);
          const growDays = typeof it.growDays === 'number' ? it.growDays : 0;
          const img = document.createElement('img');
          img.width = 24;
          img.height = 24;
          const gridImagePath = growth.isGrown
            ? getHarvestImagePath(it)
            : getPlantStageImagePath(it, growth.stageIndex);
          if (gridImagePath) {
            img.src = gridImagePath;
          }
          img.alt = it.name;
          cell.appendChild(img);
          if (growth.isGrown) {
            const hadRarity = !!getGridRarity(i);
            const rarity = assignGridRarity(i);
            if (!hadRarity) {
              const normalizedRarity = normalizeRarity(rarity);
              if (normalizedRarity === 'rare' || normalizedRarity === 'mythic') {
                addRareGrowthMessage(it, normalizedRarity);
              } else {
                addMessage(`${it.name} is ready to harvest.`, {
                  speaker: 'player',
                  emotion: 'excited',
                  category: 'progress',
                  priority: 'normal'
                });
              }
            }
            if (rarity) {
              cell.classList.add('rarity-border', `rarity-${rarity}`);
              const frame = document.createElement('div');
              frame.className = 'rarity-frame';
              cell.appendChild(frame);
              if (rarity === 'mythic') {
                const holo = document.createElement('div');
                holo.className = 'rarity-holo';
                cell.appendChild(holo);
              }
            }
            const shopEntry = state.shop.find(entry => entry.itemId === itmId);
            const multiplier = getRarityMultiplier(rarity);
            const sellPrice = shopEntry ? shopEntry.price * multiplier : 0;
            cell.title = `Harvest for $${sellPrice.toFixed(2)}`;
          } else if (growDays > 0) {
            cell.title = `Grows in ${growth.daysLeft} day${growth.daysLeft === 1 ? '' : 's'}`;
          }
        }
      }
    const miningHits = Array.isArray(state.gridMiningHits) ? state.gridMiningHits[i] : 0;
    if (!unlocked && miningHits > 0) {
      const crackIndex = Math.min(10, miningHits);
      const crackImg = document.createElement('img');
      crackImg.className = 'grid-overlay';
      crackImg.src = `resources/tools/crack${crackIndex}.png`;
      crackImg.alt = 'Mining progress';
      cell.appendChild(crackImg);
    }
    if (unlocked && Array.isArray(state.gridWateredDay) && state.gridWateredDay[i] === state.player.day) {
      const waterImg = document.createElement('img');
      waterImg.className = 'grid-overlay';
      waterImg.src = 'resources/tools/water.png';
      waterImg.alt = 'Watered';
      cell.appendChild(waterImg);
    }
    // Handle clicks with shared action logic; pointer-driven interactions use
    // the same route to keep behavior consistent.
    cell.addEventListener('click', () => {
      if (Date.now() < farmPointerState.suppressClickUntil) return;
      applyGridActionForIndex(i, { mode: 'tap' });
    });
    // Disable the context menu on right click. Earlier versions used
    // right‑click for testing reveal/hide behaviour but this has been
    // removed. Prevent the default context menu from appearing.
    cell.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
    });
    gridEl.appendChild(cell);
  }
  renderSelectedItemInsight();
  renderGuidancePanel();
}

/**
 * Render the Store tab. Handles sub‑tabs for cosmetics and crafting.
 * Based on the selected sub‑tab, the store content
 * area is populated accordingly. Buttons to buy or select items call
 * into functions that update state and persist changes.
 */
let currentStoreTab = 'cosmetics';
let currentGoalFilter = 'all';

const GOAL_FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'harvest', label: 'Harvest' },
  { id: 'tiles', label: 'Tiles' },
  { id: 'cash', label: 'Cash' },
  { id: 'day', label: 'Day' },
  { id: 'networth', label: 'Net Worth' },
  { id: 'other', label: 'Other' }
];

function getGoalMetricCategory(metric) {
  if (typeof metric !== 'string' || !metric) return 'other';
  if (metric === 'harvestCount' || metric.startsWith('itemsHarvested.')) return 'harvest';
  if (metric === 'gridUnlockedCount') return 'tiles';
  if (metric === 'cash') return 'cash';
  if (metric === 'day') return 'day';
  if (metric === 'netWorth') return 'networth';
  return 'other';
}

function getGoalCategories(goal) {
  const categories = new Set();
  getGoalConditions(goal).forEach(condition => {
    categories.add(getGoalMetricCategory(condition.metric));
  });
  return categories;
}

function goalMatchesFilter(goal, filterId) {
  if (filterId === 'all') return true;
  const categories = getGoalCategories(goal);
  return categories.has(filterId);
}

function renderStore() {
  const container = document.getElementById('store-content');
  container.innerHTML = '';
  // Default to cosmetics if an unknown or removed sub‑tab is selected
  if (currentStoreTab !== 'cosmetics' && currentStoreTab !== 'crafting') {
    currentStoreTab = 'cosmetics';
  }
  if (currentStoreTab === 'cosmetics') {
    renderCosmeticsStore(container);
  } else if (currentStoreTab === 'crafting') {
    renderCraftingStore(container);
  }
}

function formatGoalMetric(metric) {
  if (typeof metric !== 'string' || !metric) return metric;
  if (metric === 'cash') return 'Cash';
  if (metric === 'netWorth') return 'Net Worth';
  if (metric === 'day') return 'Day';
  if (metric === 'harvestCount') return 'Harvest Count';
  if (metric === 'gridUnlockedCount') return 'Tiles Unlocked';
  if (metric.startsWith('itemsHarvested.')) {
    const itemId = Number(metric.split('.')[1]);
    const item = state.items.find(it => it.id === itemId);
    return item ? `${item.name} Harvested` : `Item ${itemId} Harvested`;
  }
  return metric;
}

function formatGoalCondition(condition) {
  if (!condition || typeof condition !== 'object') return '';
  const metricLabel = formatGoalMetric(condition.metric);
  const target = Math.max(0, Number(condition.value) || 0);
  const operator = condition.operator || '>=';
  const isMoneyMetric = condition.metric === 'cash' || condition.metric === 'netWorth';
  const targetText = isMoneyMetric ? `$${target.toFixed(2)}` : `${target}`;
  return `${metricLabel} ${operator} ${targetText}`;
}

function formatGoalReward(reward) {
  if (!reward || typeof reward !== 'object') return 'Reward pending';
  const parts = [];
  const cashBonus = Math.max(0, Number(reward.cashBonus) || 0);
  if (cashBonus > 0) {
    parts.push(`Cash: $${cashBonus.toFixed(2)}`);
  }
  if (typeof reward.unlockTool === 'string') {
    parts.push(`Tool: ${reward.unlockTool}`);
  }
  if (typeof reward.unlockShopItem === 'number') {
    const item = state.items.find(it => it.id === reward.unlockShopItem);
    parts.push(`Shop item: ${item ? item.name : reward.unlockShopItem}`);
  }
  if (Array.isArray(reward.unlockShopItems) && reward.unlockShopItems.length > 0) {
    const labels = reward.unlockShopItems
      .map(itemId => state.items.find(it => it.id === Number(itemId)))
      .filter(Boolean)
      .map(item => item.name);
    if (labels.length > 0) {
      parts.push(`Shop items: ${labels.join(', ')}`);
    }
  }
  if (reward.freePurchases && typeof reward.freePurchases === 'object') {
    const itemId = Number(reward.freePurchases.itemId);
    const count = Number(reward.freePurchases.count) || 0;
    const item = state.items.find(it => it.id === itemId);
    parts.push(`${count} free purchases (${item ? item.name : itemId})`);
  }
  if (typeof reward.grantCosmetic === 'string') {
    const cosmetic = state.store?.cosmetics?.find(c => c.id === reward.grantCosmetic);
    parts.push(`Cosmetic: ${cosmetic ? cosmetic.name : reward.grantCosmetic}`);
  }
  if (typeof reward.setFlag === 'string') {
    parts.push(`Flag: ${reward.setFlag}`);
  }
  return parts.length ? parts.join(' | ') : 'Reward pending';
}

function getGoalProgress(goal) {
  const conditions = getGoalConditions(goal);
  if (!conditions.length) {
    return { current: 0, target: 0, percent: 0, progressText: '0 / 0' };
  }
  if (conditions.length === 1) {
    const metric = conditions[0].metric;
    const target = Math.max(0, Number(conditions[0].value) || 0);
    const current = Math.max(0, getGoalMetricValue(metric));
    const operator = conditions[0].operator || '>=';
    let percent = 0;
    if (target <= 0) {
      percent = 100;
    } else if (operator === '==') {
      percent = current === target ? 100 : Math.min(99, Math.round((current / target) * 100));
    } else {
      percent = Math.min(100, Math.round((current / target) * 100));
    }
    const isMoneyMetric = metric === 'cash' || metric === 'netWorth';
    const progressText = isMoneyMetric
      ? `$${current.toFixed(2)} / $${target.toFixed(2)}`
      : `${current} / ${target}`;
    return { current, target, percent, progressText };
  }
  let totalPercent = 0;
  let metCount = 0;
  conditions.forEach(condition => {
    const metric = condition.metric;
    const target = Math.max(0, Number(condition.value) || 0);
    const current = Math.max(0, getGoalMetricValue(metric));
    const operator = condition.operator || '>=';
    let percent = 0;
    if (target <= 0) {
      percent = 100;
    } else if (operator === '==') {
      percent = current === target ? 100 : Math.min(99, Math.round((current / target) * 100));
    } else {
      percent = Math.min(100, Math.round((current / target) * 100));
    }
    totalPercent += percent;
    if (doesConditionMeet(condition)) {
      metCount += 1;
    }
  });
  const avgPercent = Math.round(totalPercent / conditions.length);
  return {
    current: metCount,
    target: conditions.length,
    percent: avgPercent,
    progressText: `${metCount} / ${conditions.length} conditions`
  };
}

function renderGoals() {
  const container = document.getElementById('goals-content');
  if (!container) return;
  container.innerHTML = '';
  const title = document.createElement('div');
  title.className = 'panel-title';
  title.textContent = 'Goals';
  container.appendChild(title);

  const filterBar = document.createElement('div');
  filterBar.style.display = 'flex';
  filterBar.style.flexWrap = 'wrap';
  filterBar.style.gap = '4px';
  filterBar.style.margin = '6px 0';
  GOAL_FILTER_OPTIONS.forEach(filter => {
    const button = document.createElement('button');
    button.className = 'button';
    button.textContent = filter.label;
    button.disabled = currentGoalFilter === filter.id;
    button.setAttribute('aria-pressed', currentGoalFilter === filter.id ? 'true' : 'false');
    button.onclick = () => {
      currentGoalFilter = filter.id;
      renderGoals();
    };
    filterBar.appendChild(button);
  });
  container.appendChild(filterBar);

  const table = document.createElement('table');
  table.className = 'zebra-table';
  const headerRow = document.createElement('tr');
  ['Goal', 'Progress', 'Reward', 'Status'].forEach(label => {
    const th = document.createElement('th');
    th.textContent = label;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  const goals = Array.isArray(state.goals) ? state.goals.slice() : [];
  goals.sort((a, b) => {
    const aDone = state.goalsClaimed?.[a.id] ? 1 : 0;
    const bDone = state.goalsClaimed?.[b.id] ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    const aProgress = getGoalProgress(a).percent;
    const bProgress = getGoalProgress(b).percent;
    return bProgress - aProgress;
  });

  const filteredGoals = goals.filter(goal => goalMatchesFilter(goal, currentGoalFilter));
  filteredGoals.forEach(goal => {
    const row = document.createElement('tr');
    row.dataset.goalId = goal.id || '';
    if (highlightedGoalId && goal.id === highlightedGoalId) {
      row.classList.add('goal-row-highlight');
    }
    const goalCell = document.createElement('td');
    const conditions = getGoalConditions(goal);
    const metricLabel = conditions.length > 1
      ? conditions.map(condition => formatGoalCondition(condition)).join(' + ')
      : formatGoalMetric(goal.goal?.metric);
    goalCell.textContent = `${goal.name || goal.id} - ${goal.description || metricLabel}`;
    row.appendChild(goalCell);

    const progressCell = document.createElement('td');
    const progress = getGoalProgress(goal);
    progressCell.textContent = `${progress.progressText} (${progress.percent}%)`;
    row.appendChild(progressCell);

    const rewardCell = document.createElement('td');
    rewardCell.textContent = formatGoalReward(goal.reward);
    row.appendChild(rewardCell);

    const statusCell = document.createElement('td');
    const isCompleted = !!state.goalsClaimed?.[goal.id];
    statusCell.textContent = isCompleted ? 'Completed' : 'In Progress';
    statusCell.className = isCompleted ? 'goal-status-completed' : 'goal-status-progress';
    row.appendChild(statusCell);

    table.appendChild(row);
  });

  container.appendChild(table);
  if (filteredGoals.length === 0) {
    const empty = document.createElement('div');
    empty.style.marginTop = '6px';
    empty.textContent = 'No goals match this filter yet.';
    container.appendChild(empty);
  }
  if (highlightedGoalId) {
    const highlightedRow = table.querySelector(`tr[data-goal-id="${highlightedGoalId}"]`);
    if (highlightedRow) {
      highlightedRow.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }
}

/**
 * Render the Cosmetics sub‑tab. Lists themes and other cosmetic items
 * available for purchase or selection. Unlocking a theme deducts its
 * price from the player's cash; selecting a theme simply applies it.
 */
function renderCosmeticsStore(container) {
  const list = document.createElement('ul');
  list.style.listStyle = 'none';
  list.style.padding = '0';
  state.store.cosmetics.forEach(item => {
    const li = document.createElement('li');
    li.style.marginBottom = '4px';
    const nameSpan = document.createElement('span');
    nameSpan.textContent = item.name;
    li.appendChild(nameSpan);
    li.appendChild(document.createTextNode(' '));
    if (!item.unlocked) {
      const buyBtn = document.createElement('button');
      buyBtn.className = 'button';
      buyBtn.textContent = `Buy ($${item.price})`;
      buyBtn.onclick = () => {
        purchaseCosmetic(item.id);
      };
      li.appendChild(buyBtn);
    } else {
      const selectBtn = document.createElement('button');
      selectBtn.className = 'button';
      selectBtn.textContent = (state.player.theme === item.id ? 'Selected' : 'Select');
      selectBtn.disabled = (state.player.theme === item.id);
      selectBtn.onclick = () => {
        selectCosmetic(item.id);
      };
      li.appendChild(selectBtn);
    }
    container.appendChild(li);
  });
}

/**
 * Render the Crafting sub‑tab. Lists available crafting recipes and
 * provides controls to convert items. Crafting consumes input items
 * from the player's inventory and produces output items at a cost.
 */
function renderCraftingStore(container) {
  const recipes = state.store.crafting || [];
  if (recipes.length === 0) {
    container.textContent = 'No crafting recipes available.';
    return;
  }
  recipes.forEach(recipe => {
    const div = document.createElement('div');
    div.style.marginBottom = '6px';
    const inputs = recipe.input.map(inp => {
      const item = state.items.find(it => it.id === inp.id);
      return `${inp.qty}× ${item ? item.name : 'Unknown'}`;
    }).join(' + ');
    const outputItem = state.items.find(it => it.id === recipe.output.id);
    const outputName = outputItem ? outputItem.name : 'Unknown';
    div.innerHTML = `<strong>${inputs} → ${recipe.output.qty}× ${outputName}</strong><br>`;
    // Quantity input
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.min  = '1';
    qtyInput.value= '1';
    qtyInput.style.width = '50px';
    div.appendChild(qtyInput);
    // Craft button
    const craftBtn = document.createElement('button');
    craftBtn.className = 'button';
    craftBtn.textContent = 'Convert';
    craftBtn.onclick = () => {
      const qty = parseInt(qtyInput.value, 10);
      if (Number.isNaN(qty) || qty <= 0) return;
      craftItem(recipe.id, qty);
    };
    div.appendChild(craftBtn);
    container.appendChild(div);
  });
}

/**
 * Show the specified tab and hide all others. This function is bound
 * to each of the tab buttons in the HUD. After displaying the tab,
 * call the corresponding render function.
 *
 * @param {string} tabName The identifier of the tab to display
 */
function updateMainViewVisibility() {
  const marketTable = document.getElementById('market-table-container');
  const storePanel = document.getElementById('store');
  const goalsPanel = document.getElementById('goals-panel');
  const messagesPanel = document.getElementById('messages-history-panel');
  const isMarket = activeMainTab === 'market';
  const isStore = activeMainTab === 'store';
  const isGoals = activeMainTab === 'goals';
  const isMessages = activeMainTab === 'messages';
  if (marketTable) marketTable.style.display = isMarket ? 'block' : 'none';
  if (storePanel) storePanel.style.display = isStore ? 'block' : 'none';
  if (goalsPanel) goalsPanel.style.display = isGoals ? 'block' : 'none';
  if (messagesPanel) messagesPanel.style.display = isMessages ? 'flex' : 'none';
}

function updateMainTabButtons() {
  const marketTab = document.getElementById('tab-market');
  const storeTab = document.getElementById('tab-store');
  const goalsTab = document.getElementById('tab-goals');
  const storeUnlocked = isStoreTabUnlocked();
  const goalsUnlocked = isGoalsTabUnlocked();
  const isMarket = activeMainTab === 'market';
  const isStore = activeMainTab === 'store';
  const isGoals = activeMainTab === 'goals';
  if (marketTab) {
    marketTab.classList.toggle('active', isMarket);
    marketTab.setAttribute('aria-selected', isMarket ? 'true' : 'false');
  }
  if (storeTab) {
    storeTab.classList.toggle('active', isStore);
    storeTab.setAttribute('aria-selected', isStore ? 'true' : 'false');
    storeTab.disabled = !storeUnlocked;
    storeTab.setAttribute('aria-disabled', storeUnlocked ? 'false' : 'true');
    storeTab.title = storeUnlocked ? 'Open Shop' : 'Unlocks after first harvest';
  }
  if (goalsTab) {
    goalsTab.classList.toggle('active', isGoals);
    goalsTab.setAttribute('aria-selected', isGoals ? 'true' : 'false');
    goalsTab.disabled = !goalsUnlocked;
    goalsTab.setAttribute('aria-disabled', goalsUnlocked ? 'false' : 'true');
    goalsTab.title = goalsUnlocked ? 'Open Goal' : 'Unlocks after first harvest and rest';
  }
}

function toggleMessagesPanel() {
  if (activeMainTab === 'messages') {
    showTab(tabBeforeMessages || 'market');
    return;
  }
  tabBeforeMessages = activeMainTab;
  activeMainTab = 'messages';
  updateMainViewVisibility();
  updateMainTabButtons();
  const chatLog = document.getElementById('chat-log');
  if (chatLog) {
    chatLog.scrollTop = chatLog.scrollHeight;
  }
  updateGridSize();
}

function showTab(tabName) {
  syncGuidedUnlocks();
  if ((tabName === 'store' || tabName === 'goals') && !requestLockedTab(tabName)) {
    updateMainTabButtons();
    renderGuidancePanel();
    return;
  }
  if (tabName !== 'messages') {
    tabBeforeMessages = tabName;
  }
  activeMainTab = tabName;
  if (tabName === 'store') {
    markStoreUnlocksSeen();
  }
  updateMainViewVisibility();
  updateMainTabButtons();
  renderMarket();
  renderSelectedItemInsight();
  renderGuidancePanel();
  renderEnergyBar();
  if (tabName === 'store') {
    renderStore();
  }
  if (tabName === 'goals') {
    renderGoals();
  }
  updateTabNotificationBadges();
  updateGridSize();
}

/**
 * Render all parts of the interface. Should be called after any
 * significant state change such as buying/selling items, advancing
 * the day, or changing a theme. This acts as a single entry point
 * for UI updates.
 */
function renderAll() {
  syncGuidedUnlocks();
  renderHUD();
  renderEnergyBar();
  renderProfileGoalSummary();
  renderGuidancePanel();
  // Always update market to keep grid/table in sync, even if hidden.
  renderMarket();
  renderSelectedItemInsight();
  // Update store only when visible.
  const storeEl = document.getElementById('store');
  if (storeEl && window.getComputedStyle(storeEl).display !== 'none') {
    renderStore();
  }
  const goalsEl = document.getElementById('goals-panel');
  if (goalsEl && window.getComputedStyle(goalsEl).display !== 'none') {
    renderGoals();
  }
  updateMainViewVisibility();
  updateMainTabButtons();
  updateTabNotificationBadges();
  updateTimeOfDayMood();
  updateGridSize();
}

function updateSidePanelScrollArea() {
  const panelIds = ['market-table-container', 'store', 'goals-panel', 'messages-history-panel'];
  panelIds.forEach(id => {
    const panel = document.getElementById(id);
    if (!panel) return;
    panel.style.height = '';
    panel.style.maxHeight = '';
    panel.style.overflowY = '';
  });
}

function installSidePanelScrollHandlers() {
  // Native overflow scrolling is more reliable than manual wheel/touch handling
  // once panel sizing is constrained correctly by CSS.
}

function updateGridSize() { 
  const root = document.documentElement; 
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value)); 
  const gridContainer = document.getElementById('grid-container'); 
  const farmPanel = document.getElementById('farm-panel'); 
  const marketLayout = document.getElementById('market-layout');

  if (!gridContainer || !farmPanel) return;

  const layoutHeight = Math.max(320, (marketLayout ? marketLayout.clientHeight : window.innerHeight) - 8);
  const isMobileLayout = window.matchMedia('(max-width: 900px)').matches;
  const farmChrome = Math.max(0, farmPanel.offsetHeight - gridContainer.offsetHeight);
  const desktopMinimumTarget = Math.floor(window.innerWidth / 3.2);
  const parentWidth = gridContainer.parentElement ? gridContainer.parentElement.clientWidth : window.innerWidth;
  const maxByWidth = Math.max(140, parentWidth - (isMobileLayout ? 8 : 12));
  const minGridSize = isMobileLayout ? 180 : Math.max(260, desktopMinimumTarget);
  const verticalPadding = isMobileLayout ? 28 : 34;
  const availableGridByHeight = Math.max(140, layoutHeight - farmChrome - verticalPadding);
  const mobileSideReserve = isMobileLayout
    ? Math.round(Math.min(320, Math.max(190, layoutHeight * 0.34)))
    : 0;
  const mobileMaxByHeight = Math.max(140, availableGridByHeight - mobileSideReserve);
  const maxGridSize = isMobileLayout
    ? Math.floor(Math.min(maxByWidth, mobileMaxByHeight))
    : Math.floor(Math.min(window.innerWidth * 0.58, window.innerHeight * 0.78));
  const lowerBound = Math.min(minGridSize, maxGridSize);
  const upperBound = Math.max(minGridSize, maxGridSize);
  const baseTarget = isMobileLayout
    ? Math.floor(maxByWidth * 0.99)
    : Math.floor(Math.min(availableGridByHeight, maxByWidth) * 0.97);
  const size = clamp(baseTarget, lowerBound, upperBound);
  root.style.setProperty('--grid-size', `${size}px`);
  root.style.setProperty('--messages-height', '0px');
  root.style.setProperty('--bottom-bar-height', '0px');
  updateSidePanelScrollArea();
  resizeFxCanvas(); 
} 

// ----------- FX Utilities ----------- 
const FX_IMAGE_CACHE = new Map(); 
const FX_STATE = {  
  canvas: null,  
  ctx: null,  
  particles: [],  
  pool: [],  
  maxParticles: 240,  
  running: false,  
  lastTs: 0,  
  reduceMotion: false  
}; 
let lastMythicSparkleTs = 0; 

function initFxLayer() { 
  if (FX_STATE.canvas) return; 
  const farmPanel = document.getElementById('farm-panel'); 
  if (!farmPanel) return; 
  const canvas = document.createElement('canvas'); 
  canvas.className = 'fx-canvas'; 
  farmPanel.appendChild(canvas); 
  FX_STATE.canvas = canvas; 
  FX_STATE.ctx = canvas.getContext('2d'); 
  resizeFxCanvas(); 
  FX_STATE.running = true; 
  FX_STATE.lastTs = performance.now(); 
  requestAnimationFrame(fxTick); 
} 

function resizeFxCanvas() { 
  if (!FX_STATE.canvas || !FX_STATE.ctx) return; 
  const parent = FX_STATE.canvas.parentElement; 
  if (!parent) return; 
  const rect = parent.getBoundingClientRect(); 
  const dpr = window.devicePixelRatio || 1; 
  FX_STATE.canvas.width = Math.max(1, Math.floor(rect.width * dpr)); 
  FX_STATE.canvas.height = Math.max(1, Math.floor(rect.height * dpr)); 
  FX_STATE.canvas.style.width = `${rect.width}px`; 
  FX_STATE.canvas.style.height = `${rect.height}px`; 
  FX_STATE.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); 
} 

function setReduceMotion(enabled) { 
  FX_STATE.reduceMotion = !!enabled; 
} 

function getFxImage(src) { 
  if (!src) return null; 
  const resolved = resolveResourcePath(src); 
  if (FX_IMAGE_CACHE.has(resolved)) return FX_IMAGE_CACHE.get(resolved); 
  const img = new Image(); 
  img.src = resolved; 
  FX_IMAGE_CACHE.set(resolved, img); 
  return img; 
} 

function allocParticle() { 
  if (FX_STATE.pool.length > 0) return FX_STATE.pool.pop(); 
  if (FX_STATE.particles.length < FX_STATE.maxParticles) { 
    const p = { active: false }; 
    FX_STATE.particles.push(p); 
    return p; 
  } 
  return null; 
} 

function releaseParticle(p) { 
  if (!p) return; 
  p.active = false; 
  FX_STATE.pool.push(p); 
} 

function spawnBurst({ x, y, count, imgList, speedRange, sizeRange, gravity, lifeRange }) { 
  if (FX_STATE.reduceMotion) return; 
  const images = (imgList || []).map(getFxImage).filter(Boolean); 
  if (images.length === 0) return; 
  const minSpeed = speedRange?.[0] ?? 30; 
  const maxSpeed = speedRange?.[1] ?? 90; 
  const minSize = sizeRange?.[0] ?? 6; 
  const maxSize = sizeRange?.[1] ?? 16; 
  const minLife = lifeRange?.[0] ?? 260; 
  const maxLife = lifeRange?.[1] ?? 520; 
  for (let i = 0; i < count; i++) { 
    const p = allocParticle(); 
    if (!p) return; 
    const angle = Math.random() * Math.PI * 2; 
    const speed = minSpeed + Math.random() * (maxSpeed - minSpeed); 
    p.type = 'image'; 
    p.img = images[Math.floor(Math.random() * images.length)]; 
    p.x = x; 
    p.y = y; 
    p.vx = Math.cos(angle) * speed; 
    p.vy = Math.sin(angle) * speed; 
    p.gravity = gravity ?? 0; 
    p.life = 0; 
    p.maxLife = minLife + Math.random() * (maxLife - minLife); 
    p.size = minSize + Math.random() * (maxSize - minSize); 
    p.rotation = Math.random() * Math.PI * 2; 
    p.rotationSpeed = (Math.random() - 0.5) * 4; 
    p.active = true; 
  } 
} 

function spawnRing({ x, y, radius, color, life }) { 
  if (FX_STATE.reduceMotion) return; 
  const p = allocParticle(); 
  if (!p) return; 
  p.type = 'ring'; 
  p.x = x; 
  p.y = y; 
  p.radius = radius ?? 14; 
  p.radiusEnd = (radius ?? 14) * 2.2; 
  p.color = color || 'rgba(255,255,255,0.8)'; 
  p.life = 0; 
  p.maxLife = life ?? 220; 
  p.active = true; 
} 

function spawnCoinTravel(from, to, count) { 
  if (FX_STATE.reduceMotion) return; 
  const imgList = [ 
    'resources/effects/coin_particle_01.png', 
    'resources/effects/coin_particle_02.png' 
  ]; 
  const images = imgList.map(getFxImage).filter(Boolean); 
  if (images.length === 0) return; 
  const total = Math.max(1, count || 4); 
  for (let i = 0; i < total; i++) { 
    const p = allocParticle(); 
    if (!p) return; 
    p.type = 'travel'; 
    p.img = images[Math.floor(Math.random() * images.length)]; 
    p.fromX = from.x; 
    p.fromY = from.y; 
    p.toX = to.x; 
    p.toY = to.y; 
    p.arc = -8 - Math.random() * 6; 
    p.life = 0; 
    p.maxLife = 360 + Math.random() * 120; 
    p.size = 10 + Math.random() * 8; 
    p.active = true; 
  } 
} 

function spawnCoinTravelWithImage(from, to, count, imgPath) { 
  if (FX_STATE.reduceMotion) return; 
  const img = getFxImage(imgPath); 
  if (!img) return; 
  const total = Math.max(1, count || 1); 
  for (let i = 0; i < total; i++) { 
    const p = allocParticle(); 
    if (!p) return; 
    p.type = 'travel'; 
    p.img = img; 
    p.fromX = from.x; 
    p.fromY = from.y; 
    p.toX = to.x; 
    p.toY = to.y; 
    p.arc = -8 - Math.random() * 6; 
    p.life = 0; 
    p.maxLife = 360 + Math.random() * 120; 
    p.size = 10 + Math.random() * 8; 
    p.active = true; 
  } 
} 

function spawnCoinsForSaleValue(amount, from, to) { 
  if (FX_STATE.reduceMotion) return; 
  const rounded = Math.round((Number(amount) || 0) * 100) / 100; 
  let dollars = Math.floor(rounded); 
  let cents = Math.round((rounded - dollars) * 100); 
  if (cents >= 100) { 
    dollars += 1; 
    cents = 0; 
  } 
  const hundreds = Math.floor(dollars / 100); 
  const tens = dollars % 100; 
  if (hundreds > 0) { 
    spawnCoinTravelWithImage(from, to, hundreds, 'resources/effects/coin_particle_03.png'); 
  } 
  if (tens > 0) { 
    spawnCoinTravelWithImage(from, to, tens, 'resources/effects/coin_particle_02.png'); 
  } 
  if (cents > 0) { 
    spawnCoinTravelWithImage(from, to, cents, 'resources/effects/coin_particle_01.png'); 
  } 
} 

function fxTick(ts) {  
  if (!FX_STATE.running || !FX_STATE.ctx) return;  
  const dt = Math.min(64, ts - FX_STATE.lastTs);  
  FX_STATE.lastTs = ts;  
  const ctx = FX_STATE.ctx;  
  ctx.clearRect(0, 0, FX_STATE.canvas.width, FX_STATE.canvas.height);  
  FX_STATE.particles.forEach(p => {  
    if (!p.active) return; 
    p.life += dt; 
    const t = Math.min(1, p.life / p.maxLife); 
    if (t >= 1) { 
      releaseParticle(p); 
      return; 
    } 
    if (p.type === 'image') { 
      p.vy += (p.gravity || 0) * (dt / 1000); 
      p.x += p.vx * (dt / 1000); 
      p.y += p.vy * (dt / 1000); 
      p.rotation += p.rotationSpeed * (dt / 1000); 
      ctx.save(); 
      ctx.globalAlpha = 1 - t; 
      ctx.translate(p.x, p.y); 
      ctx.rotate(p.rotation); 
      ctx.drawImage(p.img, -p.size / 2, -p.size / 2, p.size, p.size); 
      ctx.restore(); 
    } else if (p.type === 'ring') { 
      const radius = p.radius + (p.radiusEnd - p.radius) * t; 
      ctx.save(); 
      ctx.globalAlpha = 1 - t; 
      ctx.strokeStyle = p.color; 
      ctx.lineWidth = 2; 
      ctx.beginPath(); 
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); 
      ctx.stroke(); 
      ctx.restore(); 
    } else if (p.type === 'travel') { 
      const ease = 1 - Math.pow(1 - t, 3); 
      const x = p.fromX + (p.toX - p.fromX) * ease; 
      const y = p.fromY + (p.toY - p.fromY) * ease + p.arc * (1 - t); 
      ctx.save(); 
      ctx.globalAlpha = 1 - t * 0.6; 
      ctx.drawImage(p.img, x - p.size / 2, y - p.size / 2, p.size, p.size); 
      ctx.restore(); 
    }  
  });  
  maybeSpawnMythicSparkle(ts);  
  requestAnimationFrame(fxTick);  
}  

function maybeSpawnMythicSparkle(ts) {  
  if (FX_STATE.reduceMotion) return;  
  if (ts - lastMythicSparkleTs < 1200) return;  
  const mythicCells = Array.from(document.querySelectorAll('#grid .grid-cell.rarity-mythic'));  
  if (mythicCells.length === 0) return;  
  if (Math.random() > 0.35) return;  
  const target = mythicCells[Math.floor(Math.random() * mythicCells.length)];  
  const center = getElementCenterInFarmPanel(target);  
  if (!center) return;  
  spawnBurst({  
    x: center.x,  
    y: center.y,  
    count: 2 + Math.floor(Math.random() * 2),  
    imgList: ['resources/effects/prism_sparkle_01.png', 'resources/effects/prism_sparkle_02.png'],  
    speedRange: [10, 30],  
    sizeRange: [8, 14],  
    gravity: 0,  
    lifeRange: [260, 420]  
  });  
  lastMythicSparkleTs = ts;  
}  

function triggerFxClass(el, className) { 
  if (!el || !className) return; 
  el.classList.remove(className); 
  void el.offsetWidth; 
  el.classList.add(className); 
  el.addEventListener('animationend', () => { 
    el.classList.remove(className); 
  }, { once: true }); 
} 

function getTileCenter(index) { 
  const grid = document.getElementById('grid'); 
  const farmPanel = document.getElementById('farm-panel'); 
  if (!grid || !farmPanel) return null; 
  const cell = grid.children[index]; 
  if (!cell) return null; 
  const cellRect = cell.getBoundingClientRect(); 
  const panelRect = farmPanel.getBoundingClientRect(); 
  return { 
    x: cellRect.left - panelRect.left + cellRect.width / 2, 
    y: cellRect.top - panelRect.top + cellRect.height / 2 
  }; 
} 

function getElementCenterInFarmPanel(el) { 
  const farmPanel = document.getElementById('farm-panel'); 
  if (!el || !farmPanel) return null; 
  const rect = el.getBoundingClientRect(); 
  const panelRect = farmPanel.getBoundingClientRect(); 
  return { 
    x: rect.left - panelRect.left + rect.width / 2, 
    y: rect.top - panelRect.top + rect.height / 2 
  }; 
} 

function getHudCenters() { 
  const farmPanel = document.getElementById('farm-panel'); 
  if (!farmPanel) return []; 
  const panelRect = farmPanel.getBoundingClientRect(); 
  return Array.from(document.querySelectorAll('#hud-cash, #hud-networth')) 
    .map(el => { 
      const rect = el.getBoundingClientRect(); 
      return { 
        x: rect.left - panelRect.left + rect.width / 2, 
        y: rect.top - panelRect.top + rect.height / 2, 
        el 
      }; 
    }) 
    .filter(pt => Number.isFinite(pt.x) && Number.isFinite(pt.y)); 
} 

function pulseHud(isGain) { 
  const className = isGain ? 'fx-pulse-up' : 'fx-pulse-down'; 
  document.querySelectorAll('#hud-cash, #hud-networth').forEach(el => { 
    triggerFxClass(el, className); 
  }); 
} 

function spawnFloatingText({ x, y, text, color }) { 
  if (FX_STATE.reduceMotion) return; 
  const panel = document.getElementById('farm-panel'); 
  if (!panel) return; 
  const node = document.createElement('div'); 
  node.className = 'fx-floating-text fx-fade-up'; 
  node.textContent = text; 
  if (color) node.style.color = color; 
  node.style.left = `${x}px`; 
  node.style.top = `${y}px`; 
  panel.appendChild(node); 
  node.addEventListener('animationend', () => node.remove(), { once: true }); 
} 

function showXpGainFeedback(xpGain, center, delayMs = 0) {
  if (!center) return;
  const amount = Math.max(0, Math.floor(Number(xpGain) || 0));
  if (amount <= 0) return;
  const spawn = () => {
    spawnBurst({
      x: center.x,
      y: center.y - 4,
      count: 8,
      imgList: ['resources/effects/xp_01.png', 'resources/effects/xp_02.png'],
      speedRange: [20, 60],
      sizeRange: [8, 12],
      gravity: 12,
      lifeRange: [260, 520]
    });
    spawnFloatingText({
      x: center.x - 10,
      y: center.y - 24,
      text: `+${amount} XP`,
      color: '#7eff9d'
    });
  };
  if (delayMs > 0) {
    window.setTimeout(spawn, delayMs);
  } else {
    spawn();
  }
}

function playDayTransition() { 
  if (FX_STATE.reduceMotion) return; 
  const panel = document.getElementById('farm-panel'); 
  if (!panel) return; 
  const wipe = document.createElement('div'); 
  wipe.className = 'fx-day-wipe'; 
  panel.appendChild(wipe); 
  triggerFxClass(panel, 'fx-panel-tint'); 
  wipe.addEventListener('animationend', () => wipe.remove(), { once: true }); 
} 

/**
 * Append a message to the chat log. Messages appear in the messages
 * panel with a timestamp. Keeps the scroll pinned to the bottom.
 *
 * @param {string} text The message to display
 */
const PROFILE_IMAGES = {
  player: {
    neutral: 'resources/profiles/player.png',
    excited: 'resources/profiles/player_excited.png',
    mining: 'resources/profiles/player_mining.png',
    watering: 'resources/profiles/player_watering.png',
    tired: 'resources/profiles/player_tired.png',
    wrong: 'resources/profiles/player_wrong.png',
    money: 'resources/profiles/player_money.png',
    goal_unlocked: 'resources/profiles/player_goal_unlocked.png',
    level_up: 'resources/profiles/player_level_up.png'
  },
  farmer: {
    neutral: 'resources/profiles/farmer.png'
  },
  merchant: {
    neutral: 'resources/profiles/merchant.png'
  }
};
let messageJustEmitted = false;
const MESSAGE_LIMIT = 150;
const PROFILE_BUBBLE_HIDE_MS = 3000;
const ECONOMY_ALERT_THRESHOLD = 0.15;
let lowEnergyNoticeDay = null; 
const messageReplaceMap = new Map();
const typingTimersByEntry = new WeakMap();
const TYPEWRITER_MIN_DURATION_MS = 180;
const TYPEWRITER_MAX_DURATION_MS = 1400;
const TYPEWRITER_MAX_STEP_MS = 42;
const TYPEWRITER_MIN_STEP_MS = 12;
let profileBubbleHideTimerId = null;
let activeMainTab = 'market';
let tabBeforeMessages = 'market';
let highlightedGoalId = null;
const seenStoreUnlockIds = new Set();

function getProfileImage(speaker, emotion) {
  const speakerMap = PROFILE_IMAGES[speaker] || PROFILE_IMAGES.player;
  return speakerMap[emotion] || speakerMap.neutral || PROFILE_IMAGES.player.neutral;
}

function setChatProfile(speaker, emotion) {
  const profile = document.getElementById('chat-profile');
  if (!profile) return;
  profile.src = getProfileImage(speaker, emotion);
  profile.alt = `${speaker} ${emotion}`;
}

function showProfileMessageBubble(text) {
  const bubble = document.getElementById('profile-message-bubble');
  if (!bubble) return;
  const value = String(text || '').trim();
  if (!value) return;
  bubble.textContent = value;
  bubble.classList.remove('is-hidden');
  if (profileBubbleHideTimerId) {
    window.clearTimeout(profileBubbleHideTimerId);
    profileBubbleHideTimerId = null;
  }
  profileBubbleHideTimerId = window.setTimeout(() => {
    bubble.classList.add('is-hidden');
    profileBubbleHideTimerId = null;
  }, PROFILE_BUBBLE_HIDE_MS);
}

function hideProfileMessageBubbleImmediately() {
  const bubble = document.getElementById('profile-message-bubble');
  if (!bubble) return;
  bubble.classList.add('is-hidden');
  if (profileBubbleHideTimerId) {
    window.clearTimeout(profileBubbleHideTimerId);
    profileBubbleHideTimerId = null;
  }
}

function getPendingGoalsCount() {
  if (!Array.isArray(state.goals)) return 0;
  return state.goals.reduce((count, goal) => {
    if (!goal || typeof goal !== 'object' || typeof goal.id !== 'string') return count;
    if (goal.enabled === false) return count;
    if (state.goalsClaimed?.[goal.id]) return count;
    return doesGoalMeetCondition(goal) ? count + 1 : count;
  }, 0);
}

function getCurrentStoreUnlockIds() {
  const ids = [];
  if (Array.isArray(state.items)) {
    state.items.forEach(item => {
      if (!item || typeof item.id !== 'number') return;
      if (isShopItemUnlocked(item.id)) ids.push(`shop:${item.id}`);
    });
  }
  if (state.store && Array.isArray(state.store.cosmetics)) {
    state.store.cosmetics.forEach(cosmetic => {
      if (!cosmetic || typeof cosmetic.id !== 'string') return;
      if (cosmetic.unlocked) ids.push(`cosmetic:${cosmetic.id}`);
    });
  }
  return ids;
}

function markStoreUnlocksSeen() {
  seenStoreUnlockIds.clear();
  getCurrentStoreUnlockIds().forEach(id => seenStoreUnlockIds.add(id));
}

function getNewStoreUnlockCount() {
  let count = 0;
  getCurrentStoreUnlockIds().forEach(id => {
    if (!seenStoreUnlockIds.has(id)) count += 1;
  });
  return count;
}

function setTabBadgeCount(badgeId, count) {
  const badge = document.getElementById(badgeId);
  if (!badge) return;
  const value = Math.max(0, Number(count) || 0);
  badge.textContent = String(value);
  badge.classList.toggle('has-count', value > 0);
}

function updateTabNotificationBadges() {
  if (activeMainTab === 'store') {
    markStoreUnlocksSeen();
  }
  setTabBadgeCount('tab-goals-badge', getPendingGoalsCount());
  setTabBadgeCount('tab-store-badge', getNewStoreUnlockCount());
}

function renderProfileGoalSummary() {
  const list = document.getElementById('profile-goals-list');
  if (!list) return;
  list.innerHTML = '';
  if (!Array.isArray(state.goals)) return;
  const rows = state.goals
    .filter(goal => goal && typeof goal.id === 'string' && goal.enabled !== false && !state.goalsClaimed?.[goal.id])
    .map(goal => {
      const progress = getGoalProgress(goal);
      return { goal, percent: progress.percent };
    })
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 2);
  if (rows.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No pending goals';
    list.appendChild(li);
    return;
  }
  rows.forEach(row => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button profile-goal-button';
    button.textContent = `${row.goal.name || row.goal.id} ${row.percent}%`;
    button.addEventListener('click', () => {
      highlightedGoalId = row.goal.id;
      currentGoalFilter = 'all';
      showTab('goals');
    });
    li.appendChild(button);
    list.appendChild(li);
  });
}

function countPlantedTiles() {
  if (!Array.isArray(state.gridItems)) return 0;
  return state.gridItems.reduce((sum, itemId) => sum + (itemId ? 1 : 0), 0);
}

function getPrimaryGuidedState() {
  const plantedTiles = countPlantedTiles();
  const harvested = Math.max(0, Number(state.goalStats?.harvestCount) || 0);
  const hasSelection = !!selectedShopItemId || !!state.goalFlags?.[GUIDED_FLAGS.selected];
  return {
    plantedTiles,
    harvested,
    hasSelection,
    hasPlanted: plantedTiles > 0 || !!state.goalFlags?.[GUIDED_FLAGS.planted],
    hasHarvested: harvested > 0 || !!state.goalFlags?.[GUIDED_FLAGS.harvest],
    hasRested: (Number(state.player?.day) || 1) > 1 || !!state.goalFlags?.[GUIDED_FLAGS.firstRest]
  };
}

function isStoreTabUnlocked() {
  return !!state.goalFlags?.[GUIDED_FLAGS.storeUnlocked];
}

function isGoalsTabUnlocked() {
  return !!state.goalFlags?.[GUIDED_FLAGS.goalsUnlocked];
}

function syncGuidedUnlocks() {
  if (!state.goalFlags || typeof state.goalFlags !== 'object') return;
  const guided = getPrimaryGuidedState();
  const currentDay = Math.max(1, Number(state.player?.day) || 1);
  if (guided.hasSelection) {
    state.goalFlags[GUIDED_FLAGS.selected] = true;
  }
  if (guided.hasPlanted) {
    state.goalFlags[GUIDED_FLAGS.planted] = true;
  }
  if (guided.hasHarvested) {
    state.goalFlags[GUIDED_FLAGS.harvest] = true;
  }
  if (guided.hasHarvested || currentDay >= 2) {
    state.goalFlags[GUIDED_FLAGS.storeUnlocked] = true;
  }
  if (guided.hasRested) {
    state.goalFlags[GUIDED_FLAGS.firstRest] = true;
  }
  if (isStoreTabUnlocked() && (guided.hasRested || currentDay >= 2)) {
    state.goalFlags[GUIDED_FLAGS.goalsUnlocked] = true;
  }
  if (!state.goalFlags[GUIDED_FLAGS.storeAnnounced] && isStoreTabUnlocked()) {
    state.goalFlags[GUIDED_FLAGS.storeAnnounced] = true;
    addMessage('Store unlocked: new options are now available.', {
      speaker: 'merchant',
      emotion: 'excited',
      category: 'progress',
      priority: 'high'
    });
  }
  if (!state.goalFlags[GUIDED_FLAGS.goalsAnnounced] && isGoalsTabUnlocked()) {
    state.goalFlags[GUIDED_FLAGS.goalsAnnounced] = true;
    addMessage('Goals unlocked: track milestones and rewards.', {
      speaker: 'farmer',
      emotion: 'excited',
      category: 'progress',
      priority: 'high'
    });
  }
}

function requestLockedTab(tabName) {
  if (tabName === 'store' && !isStoreTabUnlocked()) {
    addMessage('Store unlocks after your first harvest.', {
      speaker: 'merchant',
      category: 'tips',
      priority: 'low',
      replaceKey: 'tip:unlock-store'
    });
    return false;
  }
  if (tabName === 'goals' && !isGoalsTabUnlocked()) {
    addMessage('Goals unlock after your first harvest and rest.', {
      speaker: 'farmer',
      category: 'tips',
      priority: 'low',
      replaceKey: 'tip:unlock-goals'
    });
    return false;
  }
  return true;
}

function getBestBuyOpportunity() {
  let best = null;
  let bestDiff = 0;
  if (!Array.isArray(state.shop)) return null;
  state.shop.forEach(entry => {
    if (!entry || !isShopItemUnlocked(entry.itemId)) return;
    const avg = (entry.daysCount && entry.priceSum) ? (entry.priceSum / entry.daysCount) : 0;
    if (avg <= 0) return;
    const diff = (avg - entry.price) / avg;
    if (diff > bestDiff) {
      const item = state.items.find(it => it.id === entry.itemId);
      if (!item) return;
      bestDiff = diff;
      best = { itemName: item.name, discountPct: diff * 100 };
    }
  });
  return best && best.discountPct >= 5 ? best : null;
}

function getGuidancePayload() {
  const guided = getPrimaryGuidedState();
  const energy = Number(state.player?.energy) || 0;
  if (!state.goalFlags?.[GUIDED_FLAGS.selected]) {
    return {
      objective: 'Select your first seed',
      hint: 'Tap a market row to pick a seed to place.',
      progressText: '0%',
      chipClass: 'warn'
    };
  }
  if (!state.goalFlags?.[GUIDED_FLAGS.planted]) {
    return {
      objective: 'Plant 1 seed on your farm',
      hint: 'Tap any unlocked farm tile to place the selected seed.',
      progressText: `${Math.min(1, guided.plantedTiles)}/1`,
      chipClass: 'warn'
    };
  }
  if (!state.goalFlags?.[GUIDED_FLAGS.harvest]) {
    const readyTiles = countReadyToHarvestTiles();
    if (readyTiles > 0) {
      return {
        objective: 'Harvest your first crop',
        hint: 'Tap the ready crop tile to cash out.',
        progressText: `${Math.min(1, guided.harvested)}/1`,
        chipClass: ''
      };
    }
    return {
      objective: 'Grow and harvest your first crop',
      hint: 'Use Rest to advance day and finish growth faster.',
      progressText: `${Math.min(1, guided.harvested)}/1`,
      chipClass: 'warn'
    };
  }
  if (!state.goalFlags?.[GUIDED_FLAGS.firstRest]) {
    return {
      objective: 'Rest to roll the next market day',
      hint: 'Tap Rest when you are ready for new prices.',
      progressText: `${guided.hasRested ? 1 : 0}/1`,
      chipClass: ''
    };
  }
  if (!state.goalFlags?.[GUIDED_FLAGS.firstProfit]) {
    const baselineCash = Number(state.dayStartSnapshot?.cash) || 0;
    const cashDelta = (Number(state.player?.cash) || 0) - baselineCash;
    if (cashDelta > 0) {
      state.goalFlags[GUIDED_FLAGS.firstProfit] = true;
    } else {
      return {
        objective: 'Build your first profit streak',
        hint: 'Buy below average prices, then harvest and sell into stronger prices.',
        progressText: `$${cashDelta.toFixed(2)}`,
        chipClass: cashDelta < 0 ? 'bad' : 'warn'
      };
    }
  }

  if (energy <= 1) {
    return {
      objective: 'Keep momentum',
      hint: 'Energy is low. Rest to refresh and reroll opportunities.',
      progressText: `Energy ${Math.max(0, energy)}`,
      chipClass: 'warn'
    };
  }
  const bestBuy = getBestBuyOpportunity();
  if (bestBuy) {
    return {
      objective: 'Play the best value move',
      hint: `Buy ${bestBuy.itemName}: about ${bestBuy.discountPct.toFixed(0)}% below average.`,
      progressText: 'Value',
      chipClass: ''
    };
  }
  return {
    objective: 'Keep the loop going',
    hint: 'Plant, water, harvest, then rest for new market shifts.',
    progressText: 'Flow',
    chipClass: ''
  };
}

function renderGuidancePanel() {
  const objectiveEl = document.getElementById('guidance-objective-text');
  const hintEl = document.getElementById('guidance-hint-text');
  const chipEl = document.getElementById('guidance-objective-chip');
  if (!objectiveEl || !hintEl || !chipEl) return;
  const payload = getGuidancePayload();
  objectiveEl.textContent = payload.objective;
  hintEl.textContent = payload.hint;
  chipEl.textContent = payload.progressText;
  chipEl.classList.remove('warn', 'bad');
  if (payload.chipClass === 'warn') chipEl.classList.add('warn');
  if (payload.chipClass === 'bad') chipEl.classList.add('bad');
}

function getSelectedShopItemInsightData() {
  if (!selectedShopItemId) return null;
  const item = Array.isArray(state.items) ? state.items.find(it => it.id === selectedShopItemId) : null;
  const shopEntry = Array.isArray(state.shop) ? state.shop.find(entry => entry.itemId === selectedShopItemId) : null;
  if (!item || !shopEntry) return null;
  const buyPrice = Math.max(0, Number(shopEntry.price) || 0);
  const freeCount = getFreePurchaseCount(selectedShopItemId);
  const effectiveCost = freeCount > 0 ? 0 : buyPrice;
  const expectedSale = buyPrice * EXPECTED_RARITY_MULTIPLIER;
  const guaranteedSale = buyPrice * (RARITY_MULTIPLIERS.common || 1);
  const projectedDelta = expectedSale - effectiveCost;
  const guaranteedDelta = guaranteedSale - effectiveCost;
  const marginPct = effectiveCost > 0 ? ((projectedDelta / effectiveCost) * 100) : 0;
  return {
    itemName: item.name,
    buyPrice,
    effectiveCost,
    freeCount,
    expectedSale,
    guaranteedSale,
    projectedDelta,
    guaranteedDelta,
    marginPct
  };
}

function getSelectedGridItemInsightData() {
  if (selectedGridCellIndex === null) return null;
  if (!Array.isArray(state.gridItems) || selectedGridCellIndex < 0 || selectedGridCellIndex >= state.gridItems.length) return null;
  const itemId = state.gridItems[selectedGridCellIndex];
  if (!itemId) return null;
  const item = Array.isArray(state.items) ? state.items.find(it => it.id === itemId) : null;
  const shopEntry = Array.isArray(state.shop) ? state.shop.find(entry => entry.itemId === itemId) : null;
  if (!item || !shopEntry) return null;
  const growth = getPlantGrowthState(item, selectedGridCellIndex);
  const buyPrice = Array.isArray(state.gridPurchasePrice)
    ? Math.max(0, Number(state.gridPurchasePrice[selectedGridCellIndex]) || 0)
    : 0;
  const currentBasePrice = Math.max(0, Number(shopEntry.price) || 0);
  const rarity = growth.isGrown ? (getGridRarity(selectedGridCellIndex) || 'common') : 'unknown';
  const sellMultiplier = growth.isGrown ? getRarityMultiplier(rarity || 'common') : 0;
  const sellNow = growth.isGrown ? (currentBasePrice * sellMultiplier) : 0;
  const profitNow = sellNow - buyPrice;
  return {
    cellIndex: selectedGridCellIndex,
    itemName: item.name,
    buyPrice,
    currentBasePrice,
    rarity,
    growth,
    canSell: growth.isGrown,
    sellNow,
    profitNow
  };
}

function sellSelectedGridItem() {
  const bulkInsight = getBulkSelectedGridInsightData();
  if (bulkInsight && bulkInsight.count > 0) {
    sellBulkSelectedGridItems();
    return;
  }
  const insight = getSelectedGridItemInsightData();
  if (!insight) return;
  if (!insight.canSell) {
    addMessage('This plant is still growing.');
    return;
  }
  harvestPlant(insight.cellIndex);
}

function sellBulkSelectedGridItems() {
  const bulkInsight = getBulkSelectedGridInsightData();
  if (!bulkInsight || bulkInsight.count <= 0) return;
  if (!consumeEnergy(bulkInsight.count, `harvest ${bulkInsight.count} selected plant${bulkInsight.count === 1 ? '' : 's'}`)) {
    return;
  }
  registerDayAction();
  let totalSaleValue = 0;
  let totalProfitValue = 0;
  let harvestedCount = 0;
  const summaryByItem = new Map();
  bulkInsight.cells.forEach(cell => {
    const item = cell.item;
    if (!item) return;
    const itemId = cell.itemId;
    const saleValue = Math.max(0, Number(cell.sellNow) || 0);
    const buyPrice = Math.max(0, Number(cell.buyPrice) || 0);
    const profit = saleValue - buyPrice;
    registerSaleEvent(item.name, saleValue, 1);
    state.player.cash += saleValue;
    state.goalStats.harvestCount = (state.goalStats.harvestCount || 0) + 1;
    if (state.goalFlags && typeof state.goalFlags === 'object') {
      state.goalFlags[GUIDED_FLAGS.harvest] = true;
    }
    const harvestKey = String(itemId);
    state.goalStats.itemsHarvested[harvestKey] = (state.goalStats.itemsHarvested[harvestKey] || 0) + 1;
    state.gridItems[cell.cellIndex] = null;
    if (Array.isArray(state.gridPurchasePrice)) state.gridPurchasePrice[cell.cellIndex] = null;
    if (Array.isArray(state.gridRarity)) state.gridRarity[cell.cellIndex] = null;
    if (Array.isArray(state.gridPlantedDay)) state.gridPlantedDay[cell.cellIndex] = null;
    if (Array.isArray(state.gridWateredCount)) state.gridWateredCount[cell.cellIndex] = 0;
    totalSaleValue += saleValue;
    totalProfitValue += profit;
    harvestedCount += 1;
    summaryByItem.set(item.name, (summaryByItem.get(item.name) || 0) + 1);
  });
  if (!harvestedCount) {
    return;
  }
  awardPlayerXp(XP_REWARDS.harvest * harvestedCount);
  selectedGridCellIndices.clear();
  selectedGridCellIndex = null;
  updateNetWorth();
  evaluateGoals();
  saveState();
  const summaryText = Array.from(summaryByItem.entries()).map(([name, qty]) => `${name} x${qty}`).join(', ');
  addMessage(
    `Sold ${harvestedCount} selected crop${harvestedCount === 1 ? '' : 's'} for $${totalSaleValue.toFixed(2)} (profit ${totalProfitValue >= 0 ? '+' : ''}$${totalProfitValue.toFixed(2)}). ${summaryText}`,
    { speaker: 'player', emotion: 'money' }
  );
  renderAll();
}

function clearCurrentInfoSelection() {
  let changed = false;
  if (selectedShopItemId !== null) {
    selectedShopItemId = null;
    selectionPulseId = null;
    changed = true;
  }
  if (selectedGridCellIndex !== null) {
    selectedGridCellIndex = null;
    changed = true;
  }
  if (selectedGridCellIndices.size) {
    selectedGridCellIndices.clear();
    changed = true;
  }
  if (!changed) return;
  updateCursorForTool();
  renderMarket();
}

function createInsightHeader(titleText) {
  const head = document.createElement('div');
  head.className = 'market-insight-head';
  const title = document.createElement('div');
  title.className = 'market-insight-title';
  title.textContent = titleText;
  head.appendChild(title);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'button market-insight-close';
  close.textContent = 'x';
  close.title = 'Close info';
  close.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    clearCurrentInfoSelection();
  });
  head.appendChild(close);
  return head;
}

function renderSelectedItemInsight() {
  const panel = document.getElementById('market-insight-panel');
  if (!panel) return;
  panel.innerHTML = '';

  const bulkInsight = getBulkSelectedGridInsightData();
  if (bulkInsight && bulkInsight.count > 0) {
    panel.appendChild(createInsightHeader(`${bulkInsight.count} selected crops`));
    const metricGrid = document.createElement('div');
    metricGrid.className = 'market-insight-grid';
    const rows = [
      ['Total Bought', `$${bulkInsight.totalBuy.toFixed(2)}`, ''],
      ['Total Sell Now', `$${bulkInsight.totalSale.toFixed(2)}`, ''],
      ['Bulk Profit', `${bulkInsight.totalProfit >= 0 ? '+' : ''}$${bulkInsight.totalProfit.toFixed(2)}`, bulkInsight.totalProfit >= 0 ? 'good' : 'bad'],
      ['Energy Cost', `${bulkInsight.count}`, '']
    ];
    rows.forEach(([label, value, tone]) => {
      const metric = document.createElement('div');
      metric.className = 'market-insight-metric';
      const labelEl = document.createElement('span');
      labelEl.className = 'metric-label';
      labelEl.textContent = label;
      const valueEl = document.createElement('span');
      valueEl.className = `metric-value${tone ? ` ${tone}` : ''}`;
      valueEl.textContent = value;
      metric.appendChild(labelEl);
      metric.appendChild(valueEl);
      metricGrid.appendChild(metric);
    });
    panel.appendChild(metricGrid);
    const chipRow = document.createElement('div');
    chipRow.className = 'market-insight-row';
    const compositionChip = document.createElement('span');
    compositionChip.className = 'insight-chip';
    compositionChip.textContent = bulkInsight.itemBreakdown.join(', ');
    chipRow.appendChild(compositionChip);
    const sellButton = document.createElement('button');
    sellButton.type = 'button';
    sellButton.className = 'button';
    sellButton.textContent = `Sell Selected (${bulkInsight.count})`;
    sellButton.addEventListener('click', () => {
      sellBulkSelectedGridItems();
    });
    chipRow.appendChild(sellButton);
    panel.appendChild(chipRow);
    return;
  }

  const gridInsight = getSelectedGridItemInsightData();
  if (gridInsight) {
    panel.appendChild(createInsightHeader(`${gridInsight.itemName} selected tile`));

    const metricGrid = document.createElement('div');
    metricGrid.className = 'market-insight-grid';
    const rows = [
      ['Bought For', `$${gridInsight.buyPrice.toFixed(2)}`, ''],
      ['Market Base', `$${gridInsight.currentBasePrice.toFixed(2)}`, ''],
      ['Sell Now', gridInsight.canSell ? `$${gridInsight.sellNow.toFixed(2)}` : 'Not ready', gridInsight.canSell ? '' : 'bad'],
      ['Profit', gridInsight.canSell ? `${gridInsight.profitNow >= 0 ? '+' : ''}$${gridInsight.profitNow.toFixed(2)}` : '-', gridInsight.canSell ? (gridInsight.profitNow >= 0 ? 'good' : 'bad') : '']
    ];
    rows.forEach(([label, value, tone]) => {
      const metric = document.createElement('div');
      metric.className = 'market-insight-metric';
      const labelEl = document.createElement('span');
      labelEl.className = 'metric-label';
      labelEl.textContent = label;
      const valueEl = document.createElement('span');
      valueEl.className = `metric-value${tone ? ` ${tone}` : ''}`;
      valueEl.textContent = value;
      metric.appendChild(labelEl);
      metric.appendChild(valueEl);
      metricGrid.appendChild(metric);
    });
    panel.appendChild(metricGrid);

    const chipRow = document.createElement('div');
    chipRow.className = 'market-insight-row';
    const rarityChip = document.createElement('span');
    const rarityLabel = String(gridInsight.rarity || 'unknown');
    const rarityClass = rarityLabel === 'unknown' ? '' : ` rarity-${rarityLabel}`;
    rarityChip.className = `insight-chip insight-rarity-chip${rarityClass}`;
    rarityChip.textContent = `Rarity: ${rarityLabel === 'unknown' ? 'Unknown' : (rarityLabel.charAt(0).toUpperCase() + rarityLabel.slice(1))}`;
    chipRow.appendChild(rarityChip);
    const stageChip = document.createElement('span');
    stageChip.className = `insight-chip${gridInsight.canSell ? ' good' : ''}`;
    stageChip.textContent = gridInsight.canSell
      ? 'Ready to sell'
      : `Growing (${gridInsight.growth.daysLeft} day${gridInsight.growth.daysLeft === 1 ? '' : 's'} left)`;
    chipRow.appendChild(stageChip);

    const sellButton = document.createElement('button');
    sellButton.type = 'button';
    sellButton.className = 'button';
    sellButton.textContent = gridInsight.canSell ? `Sell Selected ($${gridInsight.sellNow.toFixed(2)})` : 'Sell Selected (Locked)';
    sellButton.disabled = !gridInsight.canSell;
    sellButton.addEventListener('click', () => {
      sellSelectedGridItem();
    });
    chipRow.appendChild(sellButton);
    panel.appendChild(chipRow);
    return;
  }

  const insight = getSelectedShopItemInsightData();
  if (!insight) {
    const empty = document.createElement('div');
    empty.id = 'market-insight-empty';
    empty.className = 'market-insight-empty';
    empty.textContent = 'Select an item in Market or Farm to preview info.';
    panel.appendChild(empty);
    return;
  }

  panel.appendChild(createInsightHeader(`${insight.itemName} outlook`));

  const metricGrid = document.createElement('div');
  metricGrid.className = 'market-insight-grid';
  const rows = [
    ['Buy Price', `$${insight.buyPrice.toFixed(2)}`, ''],
    ['Effective Cost', `$${insight.effectiveCost.toFixed(2)}`, insight.effectiveCost === 0 ? 'good' : ''],
    ['Expected Sale', `$${insight.expectedSale.toFixed(2)}`, ''],
    ['Projected Delta', `${insight.projectedDelta >= 0 ? '+' : ''}$${insight.projectedDelta.toFixed(2)}`, insight.projectedDelta >= 0 ? 'good' : 'bad']
  ];
  rows.forEach(([label, value, tone]) => {
    const metric = document.createElement('div');
    metric.className = 'market-insight-metric';
    const labelEl = document.createElement('span');
    labelEl.className = 'metric-label';
    labelEl.textContent = label;
    const valueEl = document.createElement('span');
    valueEl.className = `metric-value${tone ? ` ${tone}` : ''}`;
    valueEl.textContent = value;
    metric.appendChild(labelEl);
    metric.appendChild(valueEl);
    metricGrid.appendChild(metric);
  });
  panel.appendChild(metricGrid);

  const chipRow = document.createElement('div');
  chipRow.className = 'market-insight-row';

  const safetyChip = document.createElement('span');
  safetyChip.className = `insight-chip${insight.guaranteedDelta >= 0 ? ' good' : ' bad'}`;
  safetyChip.textContent = `Guaranteed: ${insight.guaranteedDelta >= 0 ? '+' : ''}$${insight.guaranteedDelta.toFixed(2)}`;
  chipRow.appendChild(safetyChip);

  const marginChip = document.createElement('span');
  const marginTone = insight.marginPct >= 0 ? ' good' : ' bad';
  marginChip.className = `insight-chip${marginTone}`;
  marginChip.textContent = `Projected Margin: ${insight.marginPct >= 0 ? '+' : ''}${insight.marginPct.toFixed(0)}%`;
  chipRow.appendChild(marginChip);

  if (insight.freeCount > 0) {
    const freeChip = document.createElement('span');
    freeChip.className = 'insight-chip good';
    freeChip.textContent = `${insight.freeCount} free purchase${insight.freeCount === 1 ? '' : 's'} remaining`;
    chipRow.appendChild(freeChip);
  }
  panel.appendChild(chipRow);
}

function updateTimeOfDayMood() {
  if (!document.body || !state.player) return;
  const max = Math.max(1, Number(state.player.energyMax) || 1);
  const energy = Math.max(0, Math.min(max, Number(state.player.energy) || 0));
  const ratio = energy / max;
  let mood = 'midday';
  if (ratio >= 0.67) mood = 'morning';
  else if (ratio <= 0.33) mood = 'night';
  document.body.setAttribute('data-time-of-day', mood);
}

function registerSaleEvent(itemName, saleValue, quantity = 1) {
  const safeValue = Math.max(0, Number(saleValue) || 0);
  const safeQty = Math.max(1, Number(quantity) || 1);
  state.daySalesCount = Math.max(0, Number(state.daySalesCount) || 0) + safeQty;
  state.daySalesTotal = Math.max(0, Number(state.daySalesTotal) || 0) + safeValue;
  const currentTop = state.dayTopSale && typeof state.dayTopSale === 'object' ? (Number(state.dayTopSale.value) || 0) : 0;
  if (!state.dayTopSale || safeValue > currentTop) {
    state.dayTopSale = {
      itemName: String(itemName || 'Item'),
      value: safeValue,
      quantity: safeQty
    };
  }
}

function getMessageDayIndex() {
  return (state.player && typeof state.player.day === 'number') ? state.player.day : 1;
}

function getMessageDayPrefix(dayIndex) {
  const dowNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dowIndex = (dayIndex - 1) % 7;
  const dow = dowNames[dowIndex];
  return `DAY ${dayIndex} - ${dow}`;
}

function buildMessageEntryText(payload) {
  const dayIndex = Number(payload.dayIndex) || getMessageDayIndex();
  const now = new Date(Number(payload.timestamp) || Date.now());
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `[${getMessageDayPrefix(dayIndex)} ${timeString}] ${payload.text}`;
}

function isChatNearBottom() {
  const chatLog = document.getElementById('chat-log');
  if (!chatLog) return true;
  const threshold = 24;
  return (chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight) <= threshold;
}

function pruneChatLog() {
  const chatLog = document.getElementById('chat-log');
  if (!chatLog) return;
  while (chatLog.children.length > MESSAGE_LIMIT) {
    const first = chatLog.firstChild;
    if (first && first.nodeType === 1) {
      stopTypingAnimationForEntry(first);
    }
    chatLog.removeChild(chatLog.firstChild);
  }
  messageReplaceMap.forEach((entry, key) => {
    if (!entry || !entry.element || !chatLog.contains(entry.element)) {
      messageReplaceMap.delete(key);
    }
  });
}

function stopTypingAnimationForEntry(entry) {
  if (!entry) return;
  const timerId = typingTimersByEntry.get(entry);
  if (timerId) {
    window.clearInterval(timerId);
    typingTimersByEntry.delete(entry);
  }
  entry.classList.remove('typing');
}

function startTypingAnimationForEntry(entry, fullText, shouldFollowScroll) {
  if (!entry) return;
  stopTypingAnimationForEntry(entry);
  const targetText = String(fullText ?? '');
  const chatLog = document.getElementById('chat-log');
  if (FX_STATE.reduceMotion || targetText.length <= 1) {
    entry.textContent = targetText;
    if (shouldFollowScroll && chatLog) {
      chatLog.scrollTop = chatLog.scrollHeight;
    }
    return;
  }

  const duration = Math.max(
    TYPEWRITER_MIN_DURATION_MS,
    Math.min(TYPEWRITER_MAX_DURATION_MS, targetText.length * 16)
  );
  const stepMs = Math.max(
    TYPEWRITER_MIN_STEP_MS,
    Math.min(TYPEWRITER_MAX_STEP_MS, Math.round(duration / targetText.length))
  );

  let currentIndex = 0;
  entry.classList.add('typing');
  entry.textContent = '';
  const timerId = window.setInterval(() => {
    currentIndex += 1;
    if (currentIndex >= targetText.length) {
      entry.textContent = targetText;
      if (shouldFollowScroll && chatLog) {
        chatLog.scrollTop = chatLog.scrollHeight;
      }
      stopTypingAnimationForEntry(entry);
      return;
    }
    entry.textContent = targetText.slice(0, currentIndex);
    if (shouldFollowScroll && chatLog) {
      chatLog.scrollTop = chatLog.scrollHeight;
    }
  }, stepMs);
  typingTimersByEntry.set(entry, timerId);
}

function emitMessage(payload) {
  const chatLog = document.getElementById('chat-log');
  if (!chatLog) return null;
  const normalized = {
    text: String(payload?.text ?? '').trim(),
    speaker: payload?.speaker || 'player',
    emotion: payload?.emotion || 'neutral',
    priority: payload?.priority || 'normal',
    category: payload?.category || 'system',
    timestamp: Number(payload?.timestamp) || Date.now(),
    dayIndex: Number(payload?.dayIndex) || getMessageDayIndex(),
    replaceKey: payload?.replaceKey || ''
  };
  if (!normalized.text) return null;
  const wasNearBottom = isChatNearBottom();
  setChatProfile(normalized.speaker, normalized.emotion);
  showProfileMessageBubble(normalized.text);
  messageJustEmitted = true;

  let scopedReplaceKey = '';
  if (normalized.replaceKey) {
    scopedReplaceKey = `${normalized.replaceKey}:day:${normalized.dayIndex}`;
  }
  const existingReplaceEntry = scopedReplaceKey ? messageReplaceMap.get(scopedReplaceKey) : null; 
  let entry = existingReplaceEntry && existingReplaceEntry.element ? existingReplaceEntry.element : null; 
  const wasReplace = !!entry; 
 
  if (entry) { 
    entry.dataset.ts = String(normalized.timestamp);
    entry.textContent = buildMessageEntryText(normalized);
    stopTypingAnimationForEntry(entry);
  } else {
    entry = document.createElement('div');
    entry.className = 'chat-entry';
    const fullEntryText = buildMessageEntryText(normalized);
    startTypingAnimationForEntry(entry, fullEntryText, wasNearBottom);
    chatLog.appendChild(entry);
    if (scopedReplaceKey) {
      messageReplaceMap.set(scopedReplaceKey, { element: entry });
    }
  }

  entry.dataset.priority = normalized.priority;
  entry.dataset.category = normalized.category;
  entry.dataset.replaceKey = scopedReplaceKey; 
  if (wasReplace) { 
    triggerFxClass(entry, 'fx-pulse-up'); 
  } 

  pruneChatLog();

  if (wasNearBottom) {
    chatLog.scrollTop = chatLog.scrollHeight;
  }
  updateGridSize();
  return entry;
}

function initialiseMessageUI() {
  const profile = document.getElementById('chat-profile');
  if (profile) {
    profile.style.cursor = 'pointer';
    profile.addEventListener('click', () => toggleMessagesPanel());
  }
  document.addEventListener('pointerdown', () => {
    hideProfileMessageBubbleImmediately();
  });
  const closeButton = document.getElementById('messages-history-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => toggleMessagesPanel());
  }
  updateTabNotificationBadges();
}

function addMessage(text, meta) {
  const metadata = meta && typeof meta === 'object' ? meta : {};
  emitMessage({
    text,
    speaker: metadata.speaker || 'player',
    emotion: metadata.emotion || 'neutral',
    priority: metadata.priority || 'normal',
    category: metadata.category || 'system',
    replaceKey: metadata.replaceKey || '',
    dayIndex: metadata.dayIndex
  });
}

function consumeEnergy(amount, reason) {
  const max = state.player.energyMax || 10;
  if (typeof state.player.energy !== 'number') {
    state.player.energy = max;
  }
  if (state.player.energy < amount) {
    const message = reason ? `Not enough energy to ${reason}.` : 'Not enough energy.';
    addMessage(message, { speaker: 'player', emotion: 'tired', category: 'system', priority: 'normal' });
    return false;
  }
  state.player.energy = Math.max(0, state.player.energy - amount);
  if (state.player.energy <= 2 && lowEnergyNoticeDay !== state.player.day) {
    lowEnergyNoticeDay = state.player.day;
    addMessage(`Low energy: ${state.player.energy}/${state.player.energyMax}. Consider ending the day.`, {
      speaker: 'player',
      emotion: 'tired',
      category: 'tips',
      priority: 'low',
      replaceKey: 'tip:low-energy'
    });
  }
  return true;
}

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
  if (!isShopItemUnlocked(itemId)) {
    addMessage('This item is not available yet.');
    return;
  }
  const shopEntry = state.shop.find(entry => entry.itemId === itemId);
  const item = state.items.find(it => it.id === itemId);
  if (!shopEntry || !item) return;
  if (shopEntry.quantity < quantity) {
    alert('Not enough stock available.');
    return;
  }
  const freeQty = Math.min(getFreePurchaseCount(itemId), quantity);
  const paidQty = quantity - freeQty;
  const totalCost = shopEntry.price * paidQty;
  if (state.player.cash < totalCost) {
    alert('Insufficient funds.');
    return;
  }
  if (freeQty > 0) {
    consumeFreePurchases(itemId, freeQty);
  }
  registerDayAction();
  state.player.cash -= totalCost;
  shopEntry.quantity -= quantity;
  let invEntry = state.inventory.find(entry => entry.itemId === itemId);
  if (!invEntry) {
    invEntry = { itemId: itemId, quantity: 0, avgCost: 0 };
    state.inventory.push(invEntry);
  }
  const existingCost = invEntry.avgCost * invEntry.quantity;
  invEntry.quantity += quantity;
  invEntry.avgCost = (existingCost + totalCost) / invEntry.quantity;
  updateNetWorth();
  evaluateGoals();
  saveState();
  if (freeQty > 0) {
    addMessage(`Bought ${quantity} x ${item.name} for $${totalCost.toFixed(2)} (${freeQty} free).`, { speaker: 'merchant' });
  } else {
    addMessage(`Bought ${quantity} x ${item.name} for $${totalCost.toFixed(2)}.`, { speaker: 'merchant' });
  }
  renderAll();
  pulseHud(false);
  const hudCenters = getHudCenters();
  if (hudCenters.length > 0) {
    spawnFloatingText({
      x: hudCenters[0].x - 16,
      y: hudCenters[0].y - 12,
      text: `-$${totalCost.toFixed(2)}`,
      color: '#ffd3d3'
    });
  }
}

function sellItem(itemId, quantity) {
  const invEntry  = state.inventory.find(entry => entry.itemId === itemId);
  const shopEntry = state.shop.find(entry => entry.itemId === itemId);
  if (!invEntry || !shopEntry) return;
  if (invEntry.quantity < quantity) {
    alert('You do not have enough to sell.');
    return;
  }
  // Compute sale value – currently 100% of shop price (could be less)
  const saleValue = shopEntry.price * quantity;
  registerDayAction();
  const item = state.items.find(it => it.id === itemId);
  registerSaleEvent(item ? item.name : 'Item', saleValue, quantity);
  // Increase cash and stock
  state.player.cash += saleValue;
  shopEntry.quantity += quantity;
  // Reduce inventory
  invEntry.quantity -= quantity;
  // Remove entry if quantity zero
  if (invEntry.quantity === 0) {
    const index = state.inventory.indexOf(invEntry);
    state.inventory.splice(index, 1);
  }
  updateNetWorth();
  evaluateGoals();
  saveState();
  // Announce sale
  addMessage(`Sold ${quantity} × ${item ? item.name : 'item'} for $${saleValue.toFixed(2)}`, { speaker: 'player', emotion: 'money' });
  renderAll();
  pulseHud(true);
  const hudCenters = getHudCenters();
  if (hudCenters.length > 0) {
    spawnFloatingText({
      x: hudCenters[0].x - 14,
      y: hudCenters[0].y - 12,
      text: `+$${saleValue.toFixed(2)}`,
      color: '#b8ffd0'
    });
  }
}

function countReadyToHarvestTiles() {
  if (!Array.isArray(state.gridItems)) return 0;
  let count = 0;
  state.gridItems.forEach((itemId, index) => {
    if (!itemId) return;
    const item = state.items.find(it => it.id === itemId);
    if (!item) return;
    if (getPlantGrowthState(item, index).isGrown) {
      count += 1;
    }
  });
  return count;
}

function getCurrentDaySnapshot() {
  return {
    day: Number(state.player?.day) || 1,
    cash: Number(state.player?.cash) || 0,
    netWorth: calculateNetWorth(),
    readyTiles: countReadyToHarvestTiles(),
    unlockedTiles: Array.isArray(state.gridUnlocked) ? state.gridUnlocked.reduce((sum, v) => sum + (v ? 1 : 0), 0) : 0,
    harvestCount: Math.max(0, Number(state.goalStats?.harvestCount) || 0)
  };
}

function emitEconomyAlert(priceMoves) {
  if (!Array.isArray(priceMoves) || priceMoves.length === 0) return;
  const significant = priceMoves
    .filter(move => Math.abs(move.pctChange) >= ECONOMY_ALERT_THRESHOLD)
    .sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange));
  if (significant.length === 0) return;
  const top = significant.slice(0, 3).map(move => {
    const sign = move.pctChange >= 0 ? '+' : '';
    return `${move.itemName} ${sign}${(move.pctChange * 100).toFixed(0)}%`;
  });
  const extra = significant.length > 3 ? ` (+${significant.length - 3} more)` : '';
  addMessage(`Economy alert: ${top.join(', ')}${extra}.`, {
    speaker: 'farmer',
    category: 'economy',
    priority: 'normal'
  });
}

function registerDayAction() {
  state.dayActionCount = Math.max(0, Number(state.dayActionCount) || 0) + 1;
}

function getUnlockedRollItems() {
  if (!Array.isArray(state.items)) return [];
  return state.items.filter(item => item && isShopItemUnlocked(item.id));
}

function getRollStoryForItem(itemName) {
  const templates = Array.isArray(DEFAULT_DATA.newsEvents) ? DEFAULT_DATA.newsEvents : [];
  if (!templates.length) {
    return {
      headline: `Market focus: ${itemName}`,
      article: `${itemName} traders report unusual activity into the next rest cycle.`
    };
  }
  const template = templates[Math.floor(Math.random() * templates.length)];
  const headline = String(template?.headline || `Market focus: ${itemName}`).replace(/sku/gi, itemName);
  const article = String(template?.article || `${itemName} traders report unusual activity.`).replace(/sku/gi, itemName);
  return { headline, article };
}

function getFatigueFromEnergy() {
  const energyMax = Math.max(1, Number(state.player?.energyMax) || 1);
  const energy = Math.max(0, Math.min(energyMax, Number(state.player?.energy) || 0));
  const energyRatio = energy / energyMax;
  const impactMultiplier = Math.max(0, 1 - energyRatio);
  const fatiguePercent = Math.round(energyRatio * 100);
  return { fatiguePercent, impactMultiplier, energy, energyMax };
}

function generateDailyMarketRoll(impactMultiplier = 1) {
  const unlockedItems = getUnlockedRollItems();
  if (unlockedItems.length === 0) {
    return { picks: [], byItem: new Map() };
  }
  const picks = [];
  for (let i = 0; i < 3; i += 1) {
    const target = unlockedItems[Math.floor(Math.random() * unlockedItems.length)];
    const sign = Math.random() < 0.5 ? -1 : 1;
    const baseMagnitude = 6 + Math.floor(Math.random() * 8); // 6..13
    const story = getRollStoryForItem(target.name);
    picks.push({
      itemId: target.id,
      itemName: target.name,
      harvestImage: getHarvestImagePath(target),
      impactPct: sign * baseMagnitude,
      storyHeadline: story.headline,
      storyBody: story.article,
      stackCount: 1,
      finalImpactPct: 0
    });
  }
  const grouped = new Map();
  picks.forEach(pick => {
    const key = pick.itemId;
    if (!grouped.has(key)) {
      grouped.set(key, {
        itemId: pick.itemId,
        itemName: pick.itemName,
        hits: 0,
        baseSumPct: 0,
        totalImpactPct: 0,
        adjustedImpactPct: 0
      });
    }
    const row = grouped.get(key);
    row.hits += 1;
    row.baseSumPct += pick.impactPct;
  });
  grouped.forEach(row => {
    const bonusMultiplier = 1 + (Math.max(0, row.hits - 1) * 0.25);
    row.totalImpactPct = row.baseSumPct * bonusMultiplier;
    row.adjustedImpactPct = row.totalImpactPct * impactMultiplier;
  });
  picks.forEach(pick => {
    const row = grouped.get(pick.itemId);
    if (!row) return;
    pick.stackCount = row.hits;
    pick.finalImpactPct = row.adjustedImpactPct;
  });
  return { picks, byItem: grouped };
}

function applyDailyMarketRollToShop(rollResult) {
  if (!rollResult || !(rollResult.byItem instanceof Map)) return;
  state.shop.forEach(entry => {
    if (!isShopItemUnlocked(entry.itemId)) return;
    const effect = rollResult.byItem.get(entry.itemId);
    if (!effect) return;
    const factor = 1 + (effect.adjustedImpactPct / 100);
    entry.price *= Math.max(0.1, factor);
  });
}

function getDailyRollSummaryText(rollResult, fatiguePercent = 0) {
  if (!rollResult || !(rollResult.byItem instanceof Map) || rollResult.byItem.size === 0) {
    return 'No market shifts rolled.';
  }
  const parts = [];
  Array.from(rollResult.byItem.values()).forEach(effect => {
    const sign = effect.adjustedImpactPct >= 0 ? '+' : '';
    const stackText = effect.hits > 1 ? ` x${effect.hits}` : '';
    parts.push(`${effect.itemName} ${sign}${effect.adjustedImpactPct.toFixed(0)}%${stackText}`);
  });
  const fatigueText = `Fatigue ${Math.max(0, Math.min(100, Math.round(fatiguePercent)))}%`;
  return `${fatigueText} | ${parts.join(' | ')}`;
}

function getBestRollOpportunityText(rollResult) {
  if (!rollResult || !(rollResult.byItem instanceof Map) || rollResult.byItem.size === 0) {
    return 'No major market shift this day.';
  }
  const ranked = Array.from(rollResult.byItem.values())
    .sort((a, b) => (Number(b.adjustedImpactPct) || 0) - (Number(a.adjustedImpactPct) || 0));
  const best = ranked[0];
  if (!best) return 'No major market shift this day.';
  const impact = Number(best.adjustedImpactPct) || 0;
  const sign = impact >= 0 ? '+' : '';
  return `Next opportunity: watch ${best.itemName} (${sign}${impact.toFixed(0)}% roll impact).`;
}

/**
 * Advance the game by one day ("Rest"). Applies energy-based market
 * fatigue to the daily roll, updates prices and restores energy.
 */
function nextDay() { 
  updateNetWorth(); 
  playDayTransition(); 
  syncGuidedUnlocks();
  const daySummaryStart = (state.dayStartSnapshot && typeof state.dayStartSnapshot === 'object')
    ? state.dayStartSnapshot
    : getCurrentDaySnapshot();
  const preRestCash = Number(state.player?.cash) || 0;

  const previousPrices = new Map();
  state.shop.forEach(entry => {
    if (!isShopItemUnlocked(entry.itemId)) return;
    previousPrices.set(entry.itemId, Number(entry.price) || 0);
  });
  const fatigue = getFatigueFromEnergy();
  state.lastRollFatiguePercent = fatigue.fatiguePercent;
  state.lastRollImpactMultiplier = fatigue.impactMultiplier;
  addMessage(
    `Market fatigue applied: ${fatigue.fatiguePercent}% reduced roll impact from leftover energy (${fatigue.energy}/${fatigue.energyMax}).`,
    { speaker: 'farmer', category: 'economy', priority: 'normal' }
  );

  // Roll the daily market slots before prices are updated.
  const dailyRoll = generateDailyMarketRoll(fatigue.impactMultiplier);
  const rollSummary = getDailyRollSummaryText(dailyRoll, fatigue.fatiguePercent);
  if (dailyRoll.picks.length > 0) {
    showDailyMarketRollModal(dailyRoll, rollSummary, fatigue.fatiguePercent);
    addMessage(`Market roll: ${rollSummary}`, {
      speaker: 'farmer',
      category: 'economy',
      priority: 'high'
    });
  }

  // Advance day counter
  state.player.day += 1;
  lowEnergyNoticeDay = null;
  ensurePlayerProgressState();
  state.player.energy = state.player.energyMax;
  state.dayActionCount = 0;
  // Determine the day of week for the new day (0=Mon,..6=Sun)
  const dowIndex = (state.player.day - 1) % 7;
  // Handle start of a new week (Monday) for days beyond the first
  if (dowIndex === 0 && state.player.day !== 1) {
    state.player.week += 1;
  }
  // Update item prices – accumulate for average, apply random fluctuation and slot-roll impact.
  state.shop.forEach(entry => {
    if (!isShopItemUnlocked(entry.itemId)) return;
    // Accumulate the current price into priceSum and increment daysCount
    entry.priceSum = (entry.priceSum || 0) + entry.price;
    entry.daysCount = (entry.daysCount || 0) + 1;
    // Apply random ±5% fluctuation
    const randomFactor = 1 + (Math.random() * 0.1 - 0.05);
    entry.price *= randomFactor;
    // Keep price within reasonable bounds
    entry.price = Math.max(0.01, entry.price);
  });
  applyDailyMarketRollToShop(dailyRoll);
  state.shop.forEach(entry => {
    entry.price = Math.max(0.01, Number(entry.price) || 0.01);
  });
  // Recalculate net worth (cash + inventory + grid item value)
  updateNetWorth();
  const priceMoves = [];
  state.shop.forEach(entry => {
    if (!isShopItemUnlocked(entry.itemId)) return;
    const previous = previousPrices.get(entry.itemId);
    if (typeof previous !== 'number' || previous <= 0) return;
    const current = Number(entry.price) || 0;
    const pctChange = (current - previous) / previous;
    const item = state.items.find(it => it.id === entry.itemId);
    priceMoves.push({
      itemId: entry.itemId,
      itemName: item ? item.name : `Item ${entry.itemId}`,
      pctChange
    });
  });
  emitEconomyAlert(priceMoves);
  if (dailyRoll.picks.length > 0) {
    state.dailyMarketRollHistory.push({
      day: Number(state.player.day) || 1,
      week: Number(state.player.week) || 1,
      picks: dailyRoll.picks,
      summary: rollSummary
    });
    if (state.dailyMarketRollHistory.length > 30) {
      state.dailyMarketRollHistory = state.dailyMarketRollHistory.slice(-30);
    }
  }
  const daySummary = {
    day: Number(daySummaryStart.day) || Math.max(1, Number(state.player.day) - 1),
    itemsSold: Math.max(0, Number(state.daySalesCount) || 0),
    salesTotal: Math.max(0, Number(state.daySalesTotal) || 0),
    cashDelta: preRestCash - (Number(daySummaryStart.cash) || 0),
    topSale: state.dayTopSale || null,
    nextOpportunity: getBestRollOpportunityText(dailyRoll)
  };
  if (!Array.isArray(state.daySummaryHistory)) {
    state.daySummaryHistory = [];
  }
  state.daySummaryHistory.push(daySummary);
  if (state.daySummaryHistory.length > 7) {
    state.daySummaryHistory = state.daySummaryHistory.slice(-7);
  }
  state.pendingDaySummary = daySummary;

  // Provide a single contextual tip or reminder for the day.
  generateDailyTip(dowIndex);
  state.daySalesCount = 0;
  state.daySalesTotal = 0;
  state.dayTopSale = null;
  evaluateGoals();
  syncGuidedUnlocks();
  state.dayStartSnapshot = getCurrentDaySnapshot();
  saveState();
  renderAll();
  if (dailyRoll.picks.length === 0 && state.pendingDaySummary) {
    showDaySummaryModal(state.pendingDaySummary);
    state.pendingDaySummary = null;
  }
}

/**
 * Generate daily tips and facts. Depending on the day of week this will
 * emit messages such as buy/sell recommendations, inventory status and
 * cash on hand. To avoid spamming the chat, it selects one message each day.
 *
 * @param {number} dowIndex The zero-based index of the current day of week (0=Mon..6=Sun)
 */
function generateDailyTip(dowIndex) {
  // Select one random tip from the optional categories.
  const optionalTips = [];
  // Suggest buying if price below average price
  let bestBuy = null;
  let bestBuyDiff = 0;
  state.shop.forEach(entry => {
    if (!isShopItemUnlocked(entry.itemId)) return;
    const item = state.items.find(it => it.id === entry.itemId);
    if (!item) return;
    const avgPrice = (entry.daysCount && entry.priceSum) ? (entry.priceSum / entry.daysCount) : null;
    if (avgPrice && entry.price < avgPrice) {
      const diff = (avgPrice - entry.price) / avgPrice;
      if (diff > bestBuyDiff) {
        bestBuyDiff = diff;
        bestBuy = item;
      }
    }
  });
  if (bestBuy && bestBuyDiff > 0.05) {
    optionalTips.push(`Tip: Consider buying ${bestBuy.name} – price is below its average.`);
  }
  // Suggest selling if sell price above average cost
  let bestSell = null;
  let bestSellDiff = 0;
  state.inventory.forEach(entry => {
    const item = state.items.find(it => it.id === entry.itemId);
    if (!item) return;
    if (!isShopItemUnlocked(entry.itemId)) return;
    const shopEntry = state.shop.find(s => s.itemId === entry.itemId);
    if (!shopEntry) return;
    const sellPrice = shopEntry.price;
    const avgCost = entry.avgCost || 0;
    if (sellPrice > avgCost && avgCost > 0) {
      const diff = (sellPrice - avgCost) / avgCost;
      if (diff > bestSellDiff) {
        bestSellDiff = diff;
        bestSell = item;
      }
    }
  });
  if (bestSell && bestSellDiff > 0.05) {
    optionalTips.push(`Tip: Consider selling ${bestSell.name} – price is above your average cost.`);
  }
  // Always include a cash summary as a potential tip
  optionalTips.push(`Current cash: $${state.player.cash.toFixed(2)}`);
  // If no optional tips generated, fall back to cash summary
  const tipOptions = optionalTips.length > 0 ? optionalTips : [`Current cash: $${state.player.cash.toFixed(2)}`];
  const idx = Math.floor(Math.random() * tipOptions.length);
  addMessage(tipOptions[idx], { category: 'tips', priority: 'low' });
}

/**
 * Purchase a cosmetic item (theme or screensaver). Deducts cash and
 * unlocks the item. If the item is a theme and purchased, it could
 * immediately apply the theme; otherwise call selectCosmetic.
 *
 * @param {string} itemId The identifier of the cosmetic item
 */
function purchaseCosmetic(itemId) {
  const item = state.store.cosmetics.find(c => c.id === itemId);
  if (!item || item.unlocked) return;
  if (state.player.cash < item.price) {
    alert('Insufficient funds to buy this cosmetic.');
    return;
  }
  state.player.cash -= item.price;
  item.unlocked = true;
  saveState();
  addMessage(`Purchased ${item.name} theme for $${item.price.toFixed(2)}`, { speaker: 'merchant' });
  renderAll();
}

/**
 * Select a cosmetic item as active (theme or screensaver). Updates
 * player settings and applies the theme to the page by switching
 * styles. Only unlocked items can be selected.
 *
 * @param {string} itemId The identifier of the cosmetic item
 */
function selectCosmetic(itemId) {
  const item = state.store.cosmetics.find(c => c.id === itemId);
  if (!item || !item.unlocked) return;
  // Determine type by id prefix (theme- vs screensaver-)
  if (item.id.startsWith('theme-')) {
    state.player.theme = item.id;
    applyTheme(item.id);
  }
  // Additional types (screensaver, UI skins) could be handled here
  saveState();
  addMessage(`Selected ${item.name} theme.`, { speaker: 'merchant' });
  renderAll();
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
  document.body.classList.remove(...Array.from(document.body.classList).filter(cls => cls.startsWith('theme-')));
  document.body.classList.add(themeId);
  // TODO: Define CSS rules for each theme in index.html or a separate CSS file
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
  const recipe = state.store.crafting.find(r => r.id === recipeId);
  if (!recipe) return;
  // Check input availability
  for (const input of recipe.input) {
    const invEntry = state.inventory.find(e => e.itemId === input.id);
    if (!invEntry || invEntry.quantity < input.qty * quantity) {
      alert('Not enough materials to craft.');
      return;
    }
  }
  // Compute cost: multiplier × shop price of output × total output quantity
  const outputShopEntry = state.shop.find(s => s.itemId === recipe.output.id);
  const costPerOutput = outputShopEntry ? outputShopEntry.price * recipe.costMultiplier : 0;
  const totalCost = costPerOutput * recipe.output.qty * quantity;
  if (state.player.cash < totalCost) {
    alert('Insufficient funds to craft.');
    return;
  }
  // Deduct input items
  for (const input of recipe.input) {
    const invEntry = state.inventory.find(e => e.itemId === input.id);
    invEntry.quantity -= input.qty * quantity;
    if (invEntry.quantity === 0) {
      const idx = state.inventory.indexOf(invEntry);
      state.inventory.splice(idx, 1);
    }
  }
  // Deduct cash
  state.player.cash -= totalCost;
  // Add output items to inventory
  let outEntry = state.inventory.find(e => e.itemId === recipe.output.id);
  if (!outEntry) {
    outEntry = { itemId: recipe.output.id, quantity: 0, avgCost: 0 };
    state.inventory.push(outEntry);
  }
  outEntry.quantity += recipe.output.qty * quantity;
  // TODO: Update avgCost for crafted items (could use costPerOutput)
  saveState();
  // Announce crafting
  const outputItem = state.items.find(it => it.id === recipe.output.id);
  addMessage(`Crafted ${recipe.output.qty * quantity} × ${outputItem ? outputItem.name : 'item'} for $${totalCost.toFixed(2)}`, { speaker: 'merchant' });
  renderAll();
}

/**
 * Compute the cost to unlock the next grid slot. The price doubles with each
 * slot purchased: the first costs $10, the next $20, then $40 and so on. The
 * cost is calculated based on the number of slots already unlocked.
 *
 * @returns {number} The cost in dollars to purchase one additional slot
 */
function getGridUnlockCost() {
  // Count how many slots have been purchased
  const unlockedCount = Array.isArray(state.gridUnlocked)
    ? state.gridUnlocked.reduce((sum, v) => sum + (v ? 1 : 0), 0)
    : 0;
  // Cost = $10 * 2^n, where n is the number of already unlocked slots
  return 10 * Math.pow(2, unlockedCount);
}

/**
 * Attempt to purchase a grid slot at the specified index. If the slot is
 * already purchased or the player lacks funds, no action is taken. On
 * success, deducts cash, marks the slot as unlocked and persists state.
 *
 * @param {number} index The zero‑based index of the grid cell to purchase
 */
function purchaseGridSlot(index) {
  if (!Array.isArray(state.gridUnlocked) || index < 0 || index >= state.gridUnlocked.length) return;
  if (state.gridUnlocked[index]) return; // already purchased
  const cost = getGridUnlockCost();
  if (state.player.cash < cost) {
    alert(`Insufficient funds to purchase this slot. Requires $${cost.toFixed(2)}.`);
    return;
  }
  if (!consumeEnergy(1, 'unlock a grid slot')) {
    return;
  }
  registerDayAction();
  state.player.cash -= cost;
  state.gridUnlocked[index] = true;
  evaluateGoals();
  // Persist changes
  saveState();
  addMessage(`Purchased a grid slot for $${cost.toFixed(2)}.`);
  renderAll();
}

function mineGridTile(index) { 
  if (!Array.isArray(state.gridUnlocked) || index < 0 || index >= state.gridUnlocked.length) return false; 
  if (state.gridUnlocked[index]) return false; 
  if (!consumeEnergy(1, 'mine this tile')) { 
    return true; 
  } 
  registerDayAction();
  awardPlayerXp(XP_REWARDS.mine);
  const currentHits = Array.isArray(state.gridMiningHits) ? (state.gridMiningHits[index] || 0) : 0; 
  const nextHits = currentHits + 1; 
  const didClear = nextHits >= 10; 
  let didMessage = false; 
  if (didClear) { 
    state.gridUnlocked[index] = true; 
    if (Array.isArray(state.gridMiningHits)) { 
      state.gridMiningHits[index] = 0; 
    } 
    addMessage('Cleared a tile.', { speaker: 'player', emotion: 'excited', category: 'progress', priority: 'high' });
    didMessage = true;
  } else if (Array.isArray(state.gridMiningHits)) {
    state.gridMiningHits[index] = nextHits;
    const hitsLeft = Math.max(0, 10 - nextHits);
    addMessage(`Mining progress: ${nextHits}/10 hits (${hitsLeft} left).`, {
      speaker: 'player',
      emotion: 'mining',
      category: 'progress',
      priority: 'normal',
      replaceKey: 'progress:mine'
    });
    didMessage = true;
  } 
  evaluateGoals(); 
  saveState(); 
  renderAll(); 
  const center = getTileCenter(index); 
  const gridContainer = document.getElementById('grid-container'); 
  if (center) { 
    if (didClear) { 
      spawnBurst({ 
        x: center.x, 
        y: center.y, 
        count: 14, 
        imgList: ['resources/effects/dust_puff_01.png', 'resources/effects/dust_puff_02.png'], 
        speedRange: [20, 70], 
        sizeRange: [10, 18], 
        gravity: 10, 
        lifeRange: [300, 560] 
      }); 
      spawnRing({ x: center.x, y: center.y, radius: 12, color: 'rgba(255,255,255,0.8)', life: 220 }); 
      if (gridContainer) { 
        triggerFxClass(gridContainer, 'fx-camera-nudge'); 
      } 
    } else { 
      spawnBurst({ 
        x: center.x, 
        y: center.y, 
        count: 6, 
        imgList: ['resources/effects/rock_chip_01.png', 'resources/effects/rock_chip_02.png'], 
        speedRange: [30, 90], 
        sizeRange: [6, 12], 
        gravity: 40, 
        lifeRange: [200, 420] 
      }); 
      const cell = document.getElementById('grid')?.children[index]; 
      if (cell) triggerFxClass(cell, 'fx-shake'); 
      const toolButton = document.querySelector('.tool-button[data-tool=\"pickaxe\"]'); 
      if (toolButton) triggerFxClass(toolButton, 'fx-pop'); 
    } 
    showXpGainFeedback(XP_REWARDS.mine, center);
  } 
  return didMessage; 
} 

function waterGridTile(index) {
  if (!Array.isArray(state.gridWateredDay) || index < 0 || index >= state.gridWateredDay.length) return false;
  const itemId = Array.isArray(state.gridItems) ? state.gridItems[index] : null;
  const item = itemId ? state.items.find(it => it.id === itemId) : null;
  if (!item) return false;

  const growth = getPlantGrowthState(item, index);
  if (growth.isGrown) { 
    addMessage('This plant is already grown. Harvest it instead.', { 
      speaker: 'player', 
      emotion: 'watering', 
      category: 'progress', 
      priority: 'normal', 
      replaceKey: 'progress:water' 
    }); 
    const cell = document.getElementById('grid')?.children[index]; 
    if (cell) triggerFxClass(cell, 'fx-wobble'); 
    return true; 
  } 

  const wasWateredToday = state.gridWateredDay[index] === state.player.day;
  if (wasWateredToday) {
    const growDays = Math.max(0, Number(item.growDays) || 0);
    const wateredDays = Math.max(0, Number(state.gridWateredCount[index]) || 0);
    const daysLeft = Math.max(0, growDays - wateredDays);
    addMessage( 
      `Already watered today. ${item.name} progress: ${wateredDays}/${growDays} days (${daysLeft} left).`, 
      { 
        speaker: 'player', 
        emotion: 'watering', 
        category: 'progress', 
        priority: 'normal', 
        replaceKey: 'progress:water' 
      } 
    ); 
    const cell = document.getElementById('grid')?.children[index]; 
    if (cell) triggerFxClass(cell, 'fx-wobble'); 
    return true; 
  } 

  if (!consumeEnergy(1, 'water this tile')) {
    return true;
  }
  registerDayAction();

  state.gridWateredDay[index] = state.player.day;
  if (Array.isArray(state.gridWateredCount)) {
    state.gridWateredCount[index] = (state.gridWateredCount[index] || 0) + 1;
  }
  awardPlayerXp(XP_REWARDS.water);

  const growDays = Math.max(0, Number(item.growDays) || 0);
  const wateredDays = Math.max(0, Number(state.gridWateredCount[index]) || 0);
  const daysLeft = Math.max(0, growDays - wateredDays);
  addMessage(
    `Watering progress: ${item.name} ${wateredDays}/${growDays} days (${daysLeft} left).`,
    {
      speaker: 'player',
      emotion: 'watering',
      category: 'progress',
      priority: 'normal',
      replaceKey: 'progress:water'
    }
  );

  saveState(); 
  renderAll(); 
  const center = getTileCenter(index); 
  if (center) { 
    spawnBurst({ 
      x: center.x, 
      y: center.y, 
      count: 10, 
      imgList: ['resources/effects/water_drop_01.png', 'resources/effects/water_drop_02.png'], 
      speedRange: [20, 60], 
      sizeRange: [6, 10], 
      gravity: 80, 
      lifeRange: [240, 520] 
    }); 
    spawnRing({ x: center.x, y: center.y, radius: 10, color: 'rgba(80,160,255,0.7)', life: 220 }); 
    const cell = document.getElementById('grid')?.children[index]; 
    const overlay = cell ? cell.querySelector('img.grid-overlay[src*=\"water.png\"]') : null; 
    if (overlay) triggerFxClass(overlay, 'fx-pop'); 
    showXpGainFeedback(XP_REWARDS.water, center);
  } 
  return true; 
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
  if (!state.gridUnlocked[cellIndex] || state.gridItems[cellIndex]) return;
  const item = state.items.find(it => it.id === itemId);
  if (!item) return;
  if (!consumeEnergy(1, 'plant a seed')) {
    return;
  }
  registerDayAction();
  const invEntry = Array.isArray(state.inventory) ? state.inventory.find(entry => entry.itemId === itemId) : null;
  const perUnitCost = Math.max(0, Number(invEntry?.avgCost) || 0);
  state.gridItems[cellIndex] = itemId;
  if (Array.isArray(state.gridPurchasePrice)) {
    state.gridPurchasePrice[cellIndex] = perUnitCost;
  }
  if (Array.isArray(state.gridRarity)) {
    state.gridRarity[cellIndex] = null;
  }
  if (Array.isArray(state.gridPlantedDay)) {
    state.gridPlantedDay[cellIndex] = state.player.day;
  }
  if (Array.isArray(state.gridWateredCount)) {
    const wateredToday = Array.isArray(state.gridWateredDay) && state.gridWateredDay[cellIndex] === state.player.day;
    state.gridWateredCount[cellIndex] = wateredToday ? 1 : 0;
  }
  awardPlayerXp(XP_REWARDS.plant);
  saveState(); 
  addMessage(`Placed ${item.name} on the grid.`); 
  renderAll(); 
  const center = getTileCenter(cellIndex); 
  if (center) { 
    spawnBurst({ 
      x: center.x, 
      y: center.y + 6, 
      count: 6, 
      imgList: ['resources/effects/soil_puff_01.png', 'resources/effects/soil_puff_02.png'], 
      speedRange: [10, 40], 
      sizeRange: [8, 14], 
      gravity: 30, 
      lifeRange: [220, 460] 
    }); 
    const cell = document.getElementById('grid')?.children[cellIndex]; 
    if (cell) triggerFxClass(cell, 'fx-pop'); 
    showXpGainFeedback(XP_REWARDS.plant, center);
  } 
} 

/**
 * Remove an item from a grid slot back into the player's inventory.
 *
 * @param {number} cellIndex The index of the grid cell to remove the item from
 */
function removeItemFromGrid(cellIndex) {
  const itemId = state.gridItems[cellIndex];
  if (!itemId) return;
  const item = state.items.find(it => it.id === itemId);
  if (!item) return;
  state.gridItems[cellIndex] = null;
  if (Array.isArray(state.gridPurchasePrice)) {
    state.gridPurchasePrice[cellIndex] = null;
  }
  if (Array.isArray(state.gridRarity)) {
    state.gridRarity[cellIndex] = null;
  }
  if (Array.isArray(state.gridPlantedDay)) {
    state.gridPlantedDay[cellIndex] = null;
  }
  if (Array.isArray(state.gridWateredCount)) {
    state.gridWateredCount[cellIndex] = 0;
  }
  saveState();
  addMessage(`Removed ${item.name} from the grid.`);
  if (selectedGridCellIndex === cellIndex) {
    selectedGridCellIndex = null;
  }
  renderAll();
}

// Track the currently selected shop item for farm placement.
let selectedShopItemId = null; 
let selectionPulseId = null; 
let selectedGridCellIndex = null;
const selectedGridCellIndices = new Set();
const farmPointerState = {
  active: false,
  pointerId: null,
  processedIndices: new Set(),
  suppressClickUntil: 0
};
let farmPointerHandlersInstalled = false;

function isDaySummaryOpen() {
  const modal = document.getElementById('day-summary-modal');
  return !!(modal && modal.classList.contains('is-open'));
}

function isFarmActionBlocked() {
  return isDailyRollOpen() || isGoalCelebrationOpen() || isDaySummaryOpen();
}

function getGridIndexFromPointerEvent(event) {
  if (!(event && typeof event === 'object')) return null;
  let targetCell = null;
  if (event.target instanceof Element) {
    targetCell = event.target.closest('.grid-cell');
  }
  if (!targetCell && Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) {
    const hovered = document.elementFromPoint(event.clientX, event.clientY);
    if (hovered instanceof Element) {
      targetCell = hovered.closest('.grid-cell');
    }
  }
  if (!targetCell) return null;
  const index = Number(targetCell.getAttribute('data-index'));
  return Number.isInteger(index) ? index : null;
}

function applyGridActionForIndex(index, options = {}) {
  const mode = options.mode === 'drag' ? 'drag' : 'tap';
  const isDragMode = mode === 'drag';
  const allowInfoSelection = !isDragMode;
  if (!Array.isArray(state.gridUnlocked) || !Array.isArray(state.gridItems)) return false;
  if (index < 0 || index >= state.gridUnlocked.length || index >= state.gridItems.length) return false;

  const unlockedNow = !!state.gridUnlocked[index];
  if (state.activeTool === TOOL_PICKAXE) {
    if (!unlockedNow) {
      const didMessage = mineGridTile(index);
      if (!didMessage) setChatProfile('player', 'neutral');
      return true;
    }
    setChatProfile('player', 'neutral');
    return false;
  }

  if (state.activeTool === TOOL_WATERING) {
    if (!unlockedNow) {
      if (mode !== 'drag') {
        addMessage('This tile is locked. Mine it first.');
      }
      return false;
    }
    const didMessage = waterGridTile(index);
    if (!didMessage) setChatProfile('player', 'neutral');
    return true;
  }

  if (!unlockedNow) {
    if (mode !== 'drag') {
      addMessage('Use the pickaxe to mine this tile.');
    }
    return false;
  }

  if (state.gridItems[index]) {
    if (isDragMode && !selectedShopItemId && state.activeTool === TOOL_GLOVE) {
      if (addGridCellToBulkSelection(index)) {
        return true;
      }
      return false;
    }
    if (allowInfoSelection) {
      selectGridCell(index);
      return true;
    }
    return false;
  }

  if (selectedShopItemId) {
    purchaseAndPlaceSelected(index);
    return true;
  }

  if (mode !== 'drag') {
    addMessage('Select an item from the market first.');
  }
  return false;
}

function stopFarmPointerInteraction() {
  farmPointerState.active = false;
  farmPointerState.pointerId = null;
  farmPointerState.processedIndices.clear();
}

function getGridCellSellSnapshot(cellIndex) {
  if (!Array.isArray(state.gridItems) || cellIndex < 0 || cellIndex >= state.gridItems.length) return null;
  const itemId = state.gridItems[cellIndex];
  if (!itemId) return null;
  const item = Array.isArray(state.items) ? state.items.find(it => it.id === itemId) : null;
  const shopEntry = Array.isArray(state.shop) ? state.shop.find(entry => entry.itemId === itemId) : null;
  if (!item || !shopEntry) return null;
  const growth = getPlantGrowthState(item, cellIndex);
  if (!growth.isGrown) return null;
  const rarity = getGridRarity(cellIndex) || 'common';
  const multiplier = getRarityMultiplier(rarity);
  const sellNow = Math.max(0, Number(shopEntry.price) || 0) * multiplier;
  const buyPrice = Array.isArray(state.gridPurchasePrice)
    ? Math.max(0, Number(state.gridPurchasePrice[cellIndex]) || 0)
    : 0;
  return {
    cellIndex,
    itemId,
    item,
    rarity,
    sellNow,
    buyPrice,
    profitNow: sellNow - buyPrice
  };
}

function addGridCellToBulkSelection(cellIndex) {
  const snapshot = getGridCellSellSnapshot(cellIndex);
  if (!snapshot) return false;
  if (selectedGridCellIndices.has(cellIndex)) return false;
  selectedGridCellIndices.add(cellIndex);
  selectedGridCellIndex = null;
  renderMarket();
  return true;
}

function clearBulkGridSelection(shouldRefresh = false) {
  if (!selectedGridCellIndices.size) return;
  selectedGridCellIndices.clear();
  if (shouldRefresh) {
    renderMarket();
  }
}

function getBulkSelectedGridInsightData() {
  if (!selectedGridCellIndices.size) return null;
  const cells = [];
  selectedGridCellIndices.forEach(index => {
    const snapshot = getGridCellSellSnapshot(index);
    if (snapshot) cells.push(snapshot);
  });
  if (!cells.length) return null;
  const totalSale = cells.reduce((sum, cell) => sum + cell.sellNow, 0);
  const totalBuy = cells.reduce((sum, cell) => sum + cell.buyPrice, 0);
  const totalProfit = totalSale - totalBuy;
  const byItem = new Map();
  cells.forEach(cell => {
    const key = String(cell.itemId);
    byItem.set(key, (byItem.get(key) || 0) + 1);
  });
  const itemBreakdown = Array.from(byItem.entries()).map(([itemIdText, qty]) => {
    const itemId = Number(itemIdText);
    const item = state.items.find(it => it.id === itemId);
    return `${item ? item.name : 'Item'} x${qty}`;
  });
  return {
    cells,
    count: cells.length,
    totalSale,
    totalBuy,
    totalProfit,
    itemBreakdown
  };
}

function installFarmPointerHandlers() {
  if (farmPointerHandlersInstalled) return;
  const grid = document.getElementById('grid');
  if (!grid) return;
  farmPointerHandlersInstalled = true;

  grid.addEventListener('pointerdown', (event) => {
    if (isFarmActionBlocked()) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const index = getGridIndexFromPointerEvent(event);
    if (!Number.isInteger(index)) return;
    farmPointerState.active = true;
    farmPointerState.pointerId = event.pointerId;
    farmPointerState.processedIndices.clear();
    farmPointerState.processedIndices.add(index);
    farmPointerState.suppressClickUntil = Date.now() + 260;
    applyGridActionForIndex(index, { mode: 'tap' });
    if (typeof grid.setPointerCapture === 'function') {
      try {
        grid.setPointerCapture(event.pointerId);
      } catch (err) {
        // Ignore capture failures; dragging still works via document listeners.
      }
    }
    event.preventDefault();
  });

  document.addEventListener('pointermove', (event) => {
    if (!farmPointerState.active) return;
    if (farmPointerState.pointerId !== null && event.pointerId !== farmPointerState.pointerId) return;
    if (isFarmActionBlocked()) {
      stopFarmPointerInteraction();
      return;
    }
    const index = getGridIndexFromPointerEvent(event);
    if (!Number.isInteger(index)) return;
    if (farmPointerState.processedIndices.has(index)) return;
    farmPointerState.processedIndices.add(index);
    applyGridActionForIndex(index, { mode: 'drag' });
    event.preventDefault();
  }, { passive: false });

  const endPointer = () => {
    if (!farmPointerState.active) return;
    stopFarmPointerInteraction();
  };
  document.addEventListener('pointerup', endPointer);
  document.addEventListener('pointercancel', endPointer);
}

function selectGridCell(cellIndex) {
  if (!Array.isArray(state.gridItems) || cellIndex < 0 || cellIndex >= state.gridItems.length) return;
  if (!state.gridItems[cellIndex]) return;
  if (selectedGridCellIndex === cellIndex) return;
  selectedGridCellIndices.clear();
  selectedGridCellIndex = cellIndex;
  selectedShopItemId = null;
  selectionPulseId = null;
  updateCursorForTool();
  renderMarket();
}

function clearGridSelection(shouldRefresh = false) {
  if (selectedGridCellIndex === null && selectedGridCellIndices.size === 0) return;
  selectedGridCellIndex = null;
  selectedGridCellIndices.clear();
  if (shouldRefresh) {
    renderMarket();
  }
}

function selectShopItem(itemId) { 
  if (!isShopItemUnlocked(itemId)) { 
    addMessage('This item is not available yet.'); 
    return; 
  } 
  if (selectedShopItemId === itemId) { 
    selectedShopItemId = null; 
    updateCursorForTool(); 
    renderMarket(); 
    return; 
  } 
  clearGridSelection();
  selectedShopItemId = itemId; 
  if (state.goalFlags && typeof state.goalFlags === 'object') {
    state.goalFlags[GUIDED_FLAGS.selected] = true;
  }
  selectionPulseId = itemId; 
  setActiveTool(TOOL_GLOVE); 
  const freeCount = getFreePurchaseCount(itemId); 
  if (freeCount > 0) { 
    const item = state.items.find(it => it.id === itemId);
    addMessage(`You have ${freeCount} free purchase${freeCount === 1 ? '' : 's'} left for ${item ? item.name : 'this item'}.`, {
      speaker: 'merchant',
      category: 'tips',
      priority: 'low',
      replaceKey: 'tip:free-purchase'
    });
  }
  updateCursorForTool();
  renderMarket();
}

function clearShopSelection() { 
  if (!selectedShopItemId) return; 
  selectedShopItemId = null; 
  selectionPulseId = null; 
  updateCursorForTool(); 
  renderMarket(); 
} 

function updateToolButtons() {
  const desktopShortcuts = !!(
    window.matchMedia
    && window.matchMedia('(hover: hover) and (pointer: fine)').matches
    && !window.matchMedia('(max-width: 900px)').matches
  );
  const shortcutByTool = {
    [TOOL_GLOVE]: 'Z',
    [TOOL_WATERING]: 'X',
    [TOOL_PICKAXE]: 'C'
  };
  if (document.body) {
    document.body.classList.toggle('has-desktop-shortcuts', desktopShortcuts);
  }
  document.querySelectorAll('.tool-button').forEach(button => {
    const tool = button.getAttribute('data-tool');
    const unlocked = isToolUnlocked(tool);
    const baseTitle = getToolDisplayName(tool);
    const shortcut = shortcutByTool[tool] || '';
    let keyLabel = button.querySelector('.tool-key-label');
    if (!keyLabel) {
      keyLabel = document.createElement('span');
      keyLabel.className = 'tool-key-label';
      button.appendChild(keyLabel);
    }
    keyLabel.textContent = shortcut ? `(${shortcut})` : '';
    button.disabled = !unlocked;
    button.title = unlocked ? baseTitle : `${baseTitle} (Locked by goal)`;
    if (tool === state.activeTool) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
  const restButton = document.getElementById('next-day');
  if (restButton) {
    restButton.textContent = desktopShortcuts ? 'Rest (Space)' : 'Rest';
    restButton.title = 'Rest';
  }
}

function updateCursorForTool() {
  if (state.activeTool && !isToolUnlocked(state.activeTool)) {
    state.activeTool = TOOL_GLOVE;
  }
  if (state.activeTool === TOOL_WATERING) {
    document.body.style.cursor = "url('resources/tools/watering_can.png') 12 12, pointer";
    return;
  }
  if (state.activeTool === TOOL_PICKAXE) {
    document.body.style.cursor = "url('resources/tools/pickaxe.png') 12 12, pointer";
    return;
  }
  if (selectedShopItemId) {
    const item = state.items.find(it => it.id === selectedShopItemId);
    if (item) {
      const imgPath = getSeedImagePath(item);
      if (!imgPath) return;
      document.body.style.cursor = `url('${imgPath}') 12 12, pointer`;
      return;
    }
  }
  document.body.style.cursor = '';
}

function setActiveTool(tool) {
  if (!TOOL_LIST.includes(tool)) return;
  if (!isToolUnlocked(tool)) {
    addMessage('This tool is locked. Complete goals to unlock it.');
    return;
  }
  state.activeTool = tool;
  updateToolButtons();
  updateCursorForTool();
  saveToStorage('activeTool', state.activeTool);
}

function purchaseAndPlaceSelected(cellIndex) {
  if (!selectedShopItemId) return;
  if (!isShopItemUnlocked(selectedShopItemId)) {
    addMessage('This item is not available yet.');
    return;
  }
  const shopEntry = state.shop.find(entry => entry.itemId === selectedShopItemId);
  const item = state.items.find(it => it.id === selectedShopItemId);
  if (!shopEntry || !item) return;
  if (shopEntry.quantity <= 0) {
    addMessage('Out of stock.');
    return;
  }
  const freeQty = Math.min(getFreePurchaseCount(selectedShopItemId), 1);
  const totalCost = shopEntry.price * (1 - freeQty);
  if (state.player.cash < totalCost) {
    alert('Insufficient funds.');
    return;
  }
  if (!consumeEnergy(1, 'plant a seed')) {
    return;
  }
  registerDayAction();
  if (state.goalFlags && typeof state.goalFlags === 'object') {
    state.goalFlags[GUIDED_FLAGS.planted] = true;
  }
  if (freeQty > 0) {
    consumeFreePurchases(selectedShopItemId, 1);
  }
  state.player.cash -= totalCost;
  shopEntry.quantity -= 1;
  state.gridItems[cellIndex] = selectedShopItemId;
  selectedGridCellIndex = cellIndex;
  if (Array.isArray(state.gridPurchasePrice)) {
    state.gridPurchasePrice[cellIndex] = totalCost;
  }
  if (Array.isArray(state.gridRarity)) {
    state.gridRarity[cellIndex] = null;
  }
  if (Array.isArray(state.gridPlantedDay)) {
    state.gridPlantedDay[cellIndex] = state.player.day;
  }
  if (Array.isArray(state.gridWateredCount)) {
    const wateredToday = Array.isArray(state.gridWateredDay) && state.gridWateredDay[cellIndex] === state.player.day;
    state.gridWateredCount[cellIndex] = wateredToday ? 1 : 0;
  }
  awardPlayerXp(XP_REWARDS.plant);
  updateNetWorth();
  evaluateGoals();
  saveState();
  if (freeQty > 0) { 
    addMessage(`Purchased ${item.name} for $0.00 (free) and placed it on the grid.`, { speaker: 'farmer' }); 
  } else { 
    addMessage(`Purchased ${item.name} for $${shopEntry.price.toFixed(2)} and placed it on the grid.`, { speaker: 'farmer' }); 
  } 
  renderAll(); 
  const center = getTileCenter(cellIndex); 
  if (center) { 
    spawnBurst({ 
      x: center.x, 
      y: center.y + 6, 
      count: 6, 
      imgList: ['resources/effects/soil_puff_01.png', 'resources/effects/soil_puff_02.png'], 
      speedRange: [10, 40], 
      sizeRange: [8, 14], 
      gravity: 30, 
      lifeRange: [220, 460] 
    }); 
    const cell = document.getElementById('grid')?.children[cellIndex]; 
    if (cell) triggerFxClass(cell, 'fx-pop'); 
  } 
  pulseHud(false); 
  const hudCenters = getHudCenters(); 
  if (center && hudCenters.length > 0) { 
    spawnCoinTravel(hudCenters[0], center, 5); 
  } 
  if (center) {
    showXpGainFeedback(XP_REWARDS.plant, center);
  }
} 

function harvestPlant(cellIndex) {
  const itemId = state.gridItems[cellIndex];
  if (!itemId) return;
  const item = state.items.find(it => it.id === itemId);
  if (!item) return;
  if (!getPlantGrowthState(item, cellIndex).isGrown) {
    addMessage('This plant is still growing.');
    return;
  }
  if (!consumeEnergy(1, 'harvest this plant')) {
    return;
  }
  registerDayAction();
  const shopEntry = state.shop.find(entry => entry.itemId === itemId);
  const basePrice = shopEntry ? shopEntry.price : 0;
  const buyPrice = Array.isArray(state.gridPurchasePrice)
    ? Math.max(0, Number(state.gridPurchasePrice[cellIndex]) || 0)
    : 0;
  const rarity = getGridRarity(cellIndex) || assignGridRarity(cellIndex);
  const multiplier = getRarityMultiplier(rarity);
  const saleValue = basePrice * multiplier;
  const realizedProfit = saleValue - buyPrice;
  registerSaleEvent(item.name, saleValue, 1);
  state.player.cash += saleValue;
  state.goalStats.harvestCount = (state.goalStats.harvestCount || 0) + 1;
  if (state.goalFlags && typeof state.goalFlags === 'object') {
    state.goalFlags[GUIDED_FLAGS.harvest] = true;
  }
  const harvestKey = String(itemId);
  state.goalStats.itemsHarvested[harvestKey] = (state.goalStats.itemsHarvested[harvestKey] || 0) + 1;
  state.gridItems[cellIndex] = null;
  if (Array.isArray(state.gridPurchasePrice)) {
    state.gridPurchasePrice[cellIndex] = null;
  }
  if (Array.isArray(state.gridRarity)) {
    state.gridRarity[cellIndex] = null;
  }
  if (Array.isArray(state.gridPlantedDay)) {
    state.gridPlantedDay[cellIndex] = null;
  }
  if (Array.isArray(state.gridWateredCount)) {
    state.gridWateredCount[cellIndex] = 0;
  }
  awardPlayerXp(XP_REWARDS.harvest);
  updateNetWorth();
  evaluateGoals();
  saveState(); 
  addMessage(
    `Harvested ${item.name} for $${saleValue.toFixed(2)} (profit ${realizedProfit >= 0 ? '+' : ''}$${realizedProfit.toFixed(2)}).`,
    { speaker: 'player', emotion: 'money' }
  ); 
  if (selectedGridCellIndex === cellIndex) {
    selectedGridCellIndex = null;
  }
  renderAll(); 
  const center = getTileCenter(cellIndex); 
  if (center) { 
    const isRare = rarity === 'rare'; 
    const isMythic = rarity === 'mythic'; 
    const sparkleList = isMythic 
      ? ['resources/effects/prism_sparkle_01.png', 'resources/effects/prism_sparkle_02.png'] 
      : ['resources/effects/sparkle_gold_01.png', 'resources/effects/sparkle_gold_02.png']; 
    const burstCount = isMythic ? 16 : (isRare ? 12 : 8); 
    spawnBurst({ 
      x: center.x, 
      y: center.y - 6, 
      count: burstCount, 
      imgList: sparkleList, 
      speedRange: [20, 70], 
      sizeRange: [8, 14], 
      gravity: 10, 
      lifeRange: [240, 520] 
    }); 
    if (isRare || isMythic) { 
      spawnRing({ 
        x: center.x, 
        y: center.y, 
        radius: 10, 
        color: isMythic ? 'rgba(198,180,255,0.8)' : 'rgba(255,213,100,0.8)', 
        life: 220 
      }); 
    } 
    spawnFloatingText({ 
      x: center.x - 12, 
      y: center.y - 18, 
      text: `+$${saleValue.toFixed(2)}`, 
      color: isMythic ? '#c6b4ff' : '#ffe680' 
    }); 
    showXpGainFeedback(XP_REWARDS.harvest, center, 340);
  } 
  pulseHud(true); 
  const hudCenters = getHudCenters(); 
  if (center && hudCenters.length > 0) { 
    spawnCoinsForSaleValue(saleValue, center, hudCenters[0]); 
  } 
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
  // Group items by level
  const itemsByLevel = {};
  state.items.forEach(it => {
    if (!it.level) return;
    if (!itemsByLevel[it.level]) itemsByLevel[it.level] = [];
    itemsByLevel[it.level].push(it);
  });
  const results = [];
  // Define production options for each level
  const options = [];
  if (level === 1) {
    // one random level‑1 item
    options.push({ level: 1, minQty: 1, maxQty: 1 });
  } else if (level === 2) {
    options.push({ level: 1, minQty: 1, maxQty: 5 });
    options.push({ level: 2, minQty: 1, maxQty: 1 });
  } else if (level === 3) {
    options.push({ level: 1, minQty: 10, maxQty: 25 });
    options.push({ level: 2, minQty: 1, maxQty: 5 });
    options.push({ level: 3, minQty: 1, maxQty: 1 });
  } else if (level === 4) {
    options.push({ level: 1, minQty: 50, maxQty: 125 });
    options.push({ level: 2, minQty: 10, maxQty: 25 });
    options.push({ level: 3, minQty: 1, maxQty: 5 });
    options.push({ level: 4, minQty: 1, maxQty: 1 });
  } else if (level >= 5) {
    options.push({ level: 1, minQty: 500, maxQty: 625 });
    options.push({ level: 2, minQty: 50, maxQty: 125 });
    options.push({ level: 3, minQty: 10, maxQty: 25 });
    options.push({ level: 4, minQty: 1, maxQty: 5 });
    options.push({ level: 5, minQty: 1, maxQty: 1 });
  }
  // Filter options to those levels that exist in our items list
  const validOptions = options.filter(opt => Array.isArray(itemsByLevel[opt.level]) && itemsByLevel[opt.level].length > 0);
  if (validOptions.length === 0) {
    return results;
  }
  // Pick a random option
  const opt = validOptions[Math.floor(Math.random() * validOptions.length)];
  // Determine quantity within range
  const qty = opt.minQty + Math.floor(Math.random() * (opt.maxQty - opt.minQty + 1));
  // Choose a random item at that level
  const choices = itemsByLevel[opt.level];
  const chosen = choices[Math.floor(Math.random() * choices.length)];
  if (chosen) {
    results.push({ itemId: chosen.id, quantity: qty });
  }
  return results;
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
  let remaining = quantity;
  const availableSpace = state.player.capacity - state.player.capacityUsed;
  if (availableSpace <= 0) {
    addMessage(`Could not add produced ${quantity} × ${state.items.find(it => it.id === itemId)?.name || 'items'} because storage is full.`);
    return;
  }
  const canAdd = Math.min(remaining, availableSpace);
  if (canAdd < quantity) {
    addMessage(`Storage space limited: only ${canAdd} × ${state.items.find(it => it.id === itemId)?.name || 'items'} were stored; ${quantity - canAdd} dropped.`);
  }
  remaining = canAdd;
  // Add to inventory or create entry
  let entry = state.inventory.find(e => e.itemId === itemId);
  if (!entry) {
    entry = { itemId: itemId, quantity: 0, avgCost: 0 };
    state.inventory.push(entry);
  }
  // Update average cost: produced resources have zero cost, so avgCost remains weighted by existing cost
  const existingCost = entry.avgCost * entry.quantity;
  entry.quantity += remaining;
  entry.avgCost = entry.quantity > 0 ? (existingCost) / entry.quantity : 0;
  // Increase used capacity
  state.player.capacityUsed += remaining;
  addMessage(`Extractors produced ${remaining} × ${state.items.find(it => it.id === itemId)?.name || 'items'}.`);
}

/**
 * Generate weekly news events from template data in DEFAULT_DATA.newsEvents.
 * Up to three templates are sampled, each assigned to a random unlocked item,
 * and persisted in state.newsEvents/state.newsHistory with a daysLeft counter.
 */
function generateNewsEvents() {
  const currentWeek = state.player.week;
  // Only generate news once per week. If history already has entries for this week, skip.
  if (state.newsHistory[currentWeek] && state.newsHistory[currentWeek].length > 0) {
    return;
  }
  if (!Array.isArray(DEFAULT_DATA.newsEvents)) return;
  // Select up to three random templates from the pool. For each
  // selected template, pick a random unlocked item from the current
  // unlocked item list and insert its name into the headline and article. The
  // resulting event includes the affected item id, impact, duration and
  // daysLeft fields.
  const pool = DEFAULT_DATA.newsEvents.slice();
  const eventsForWeek = [];
  const count = Math.min(3, pool.length);
  for (let i = 0; i < count; i++) {
    const templateIndex = Math.floor(Math.random() * pool.length);
    const baseEvent = pool.splice(templateIndex, 1)[0];
    // Choose a random unlocked shop item only.
    let selectedItem = null;
    const unlockedItems = Array.isArray(state.items)
      ? state.items.filter(item => item && isShopItemUnlocked(item.id))
      : [];
    if (unlockedItems.length > 0) {
      const itemIndex = Math.floor(Math.random() * unlockedItems.length);
      selectedItem = unlockedItems[itemIndex];
    }
    // Build the event's text using the selected item; if no item available, use generic placeholder
    const itemName = selectedItem ? selectedItem.name : 'Unknown Item';
    const itemId   = selectedItem ? selectedItem.id : null;
    const headline = baseEvent.headline ? baseEvent.headline.replace(/sku/gi, itemName) : '';
    const article  = baseEvent.article ? baseEvent.article.replace(/sku/gi, itemName) : '';
    const newEvent = {
      headline,
      article,
      affects: itemId,
      impact: baseEvent.impact,
      duration: baseEvent.duration,
      daysLeft: typeof baseEvent.duration === 'number' ? baseEvent.duration : 1
    };
    eventsForWeek.push(newEvent);
  }
  // Append generated events to the active news list and record them in history
  state.newsEvents.push(...eventsForWeek);
  state.newsHistory[currentWeek] = eventsForWeek;
  saveToStorage('newsEvents', state.newsEvents);
  saveToStorage('newsHistory', state.newsHistory);
}
// ----------- Event Handlers -----------

/**
 * Initialise event listeners for tab buttons, store sub‑tabs and the
 * reset button. This runs once after the DOM is ready.
 */
function attachEventHandlers() {
  document.getElementById('tab-market').onclick = () => showTab('market');
  document.getElementById('tab-store').onclick  = () => showTab('store');
  document.getElementById('tab-goals').onclick  = () => showTab('goals');
  const feedbackButton = document.getElementById('feedbackButton');
  if (feedbackButton) {
    feedbackButton.addEventListener('click', async (event) => {
      event.preventDefault();
      const text = buildFeedbackString();
      const textarea = document.getElementById('feedback-textarea');
      if (textarea) {
        textarea.value = text;
      }
      setFeedbackModalOpen(true);
      await copyFeedbackText(text);
      const url = feedbackButton.getAttribute('href');
      if (url) {
        window.open(url, '_blank', 'noopener');
      }
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
  if (feedbackClose) {
    feedbackClose.addEventListener('click', () => setFeedbackModalOpen(false));
  }
  const feedbackModal = document.getElementById('feedback-modal');
  if (feedbackModal) {
    feedbackModal.addEventListener('click', (event) => {
      if (event.target === feedbackModal) {
        setFeedbackModalOpen(false);
      }
    });
  }
  const goalCelebrationContinueButton = document.getElementById('goal-celebration-continue');
  if (goalCelebrationContinueButton) {
    goalCelebrationContinueButton.addEventListener('click', () => {
      continueGoalCelebration();
    });
  }
  const goalCelebrationModal = document.getElementById('goal-celebration-modal');
  if (goalCelebrationModal) {
    goalCelebrationModal.addEventListener('click', (event) => {
      if (event.target === goalCelebrationModal) {
        event.preventDefault();
      }
    });
  }
  const dailyRollContinueButton = document.getElementById('daily-roll-continue');
  if (dailyRollContinueButton) {
    dailyRollContinueButton.addEventListener('click', () => {
      continueDailyRollModal();
    });
  }
  const dailyRollModal = document.getElementById('daily-roll-modal');
  if (dailyRollModal) {
    dailyRollModal.addEventListener('click', (event) => {
      if (event.target === dailyRollModal) {
        event.preventDefault();
      }
    });
  }
  const daySummaryContinueButton = document.getElementById('day-summary-continue');
  if (daySummaryContinueButton) {
    daySummaryContinueButton.addEventListener('click', () => {
      continueDaySummaryModal();
    });
  }
  const daySummaryModal = document.getElementById('day-summary-modal');
  if (daySummaryModal) {
    daySummaryModal.addEventListener('click', (event) => {
      if (event.target === daySummaryModal) {
        continueDaySummaryModal();
      }
    });
  }
  document.getElementById('store-cosmetics').onclick = () => {
    currentStoreTab = 'cosmetics';
    renderStore();
  };
  document.getElementById('store-crafting').onclick = () => {
    currentStoreTab = 'crafting';
    renderStore();
  };
  // Inventory tab removed: capacity changes are handled elsewhere.
  document.getElementById('reset-game').onclick = resetGame;

  // Next Day button triggers a daily update
  document.getElementById('next-day').onclick = nextDay;

  document.querySelectorAll('.tool-button').forEach(button => { 
    button.addEventListener('click', () => { 
      const tool = button.getAttribute('data-tool'); 
      if (tool === TOOL_WATERING || tool === TOOL_PICKAXE) { 
        clearShopSelection(); 
      } 
      triggerFxClass(button, 'fx-pop'); 
      setActiveTool(tool); 
    }); 
  }); 
  installFarmPointerHandlers();
  document.addEventListener('click', (event) => {
    if (selectedGridCellIndex === null && selectedGridCellIndices.size === 0) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const gridCell = target.closest('.grid-cell');
    if (gridCell) {
      const indexText = gridCell.getAttribute('data-index');
      const index = Number(indexText);
      if (selectedGridCellIndices.size > 0 && Number.isInteger(index) && selectedGridCellIndices.has(index)) {
        return;
      }
      if (selectedGridCellIndices.size === 0 && Number.isInteger(index) && Array.isArray(state.gridItems) && !!state.gridItems[index]) {
        return;
      }
    }
    clearGridSelection(true);
  });

  document.addEventListener('click', () => {
    messageJustEmitted = false;
  }, true);
  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const isTextInputTarget = target instanceof Element && (
      target.closest('input, textarea, select') !== null
      || target.getAttribute('contenteditable') === 'true'
    );
    const desktopShortcuts = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
    const isTildePress = event.key === '~' || (event.key === '`' && event.shiftKey) || (event.code === 'Backquote' && event.shiftKey);
    if (isTildePress) {
      event.preventDefault();
      toggleLicenseAndCreator();
      return;
    }
    if (isDailyRollOpen()) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        continueDailyRollModal();
        return;
      }
      if (event.key === 'Tab') return;
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
      return;
    }
  }, true);

}

// ----------- Startup -----------

/**
 * Main entry point. Called when the DOM is fully loaded. Loads state,
 * attaches event handlers, selects the default tab and renders the UI.
 */
async function main() {
  // Load external JSON data for items and news before initialisation
  await loadJSONData();
  initialiseState();
  evaluateGoals();
  syncGuidedUnlocks();
  attachEventHandlers();
  startPlaytimeTracking();
  initialiseMessageUI();
  markStoreUnlocksSeen();
  const header = document.getElementById('market-header');
  if (header) {
    Array.from(header.children).forEach(child => {
      if (child.tagName === 'SPAN') {
        child.remove();
      }
    });
  }
  updateToolButtons();
  updateCursorForTool();
  installSidePanelScrollHandlers();
  // Show welcome message on first launch
  if (!state.player.welcomeShown) {
    addMessage('Welcome to the market!');
    state.player.welcomeShown = true;
    saveState();
  }
  // Show market by default
  showTab('market');
  renderHUD();
  // Additional initialisation: apply selected theme
  applyTheme(state.player.theme);
  updateGridSize(); 
  const reduceMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null; 
  setReduceMotion(!!(reduceMotionQuery && reduceMotionQuery.matches)); 
  if (reduceMotionQuery) { 
    reduceMotionQuery.addEventListener('change', (event) => { 
      setReduceMotion(!!event.matches); 
    }); 
  } 
  initFxLayer(); 
  window.addEventListener('resize', () => {
    updateGridSize();
    updateToolButtons();
  }); 
  window.addEventListener('orientationchange', () => {
    updateGridSize();
    updateToolButtons();
  }); 
  if ('ResizeObserver' in window) {
    const observedElements = ['market-header', 'market-table-container', 'messages-history-panel']
      .map(id => document.getElementById(id))
      .filter(Boolean);
    if (observedElements.length > 0) {
      const resizeObserver = new ResizeObserver(() => updateGridSize());
      observedElements.forEach(el => resizeObserver.observe(el));
    }
  }
}

// Run main once DOM is ready. If the async function rejects, log the error.
document.addEventListener('DOMContentLoaded', () => {
  main().catch(err => console.error(err));
});


