/*
 * main.js – client‑side logic for Enter The Market (Web)
 *
 * This script implements the core logic of a browser‑based port of the
 * original Pygame version of Enter The Market. It uses 98.css for styling
 * and localStorage for persistence. The goal is to replicate the existing
 * gameplay mechanics as closely as possible while leveraging HTML, CSS,
 * and JavaScript.
 *
 * IMPORTANT: This file provides a scaffold. Many functions contain
 * placeholders where game logic needs to be ported from the Python
 * implementation. Comments indicate where additional features should be
 * implemented. When porting, refer to the original Python source for
 * detailed algorithms (e.g. price fluctuations, crafting recipes)
 * and replicate them here in JavaScript.
 */

// ----------- Data Definitions -----------

/*
 * Default seed data for items, shop, player and store. These objects
 * approximate the CSV seeds used in the Python version, but are simplified
 * for brevity. Extend these structures with full item lists, prices,
 * categories, and crafting recipes as needed.
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
    energy: 10,
    energyMax: 10
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
      price: 10,
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
      plantStages: 6
    }
  ],
  // Precompute shop fallback from the fallback items. This ensures
  // default quantities and pricing are available even if JSON fails
  // to load. These entries are overwritten by loadJSONData() when
  // external data is successfully fetched.
  shop: [
    { itemId: 1, quantity: 100, price: 10, priceSum: 0, daysCount: 0 }
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
      { id: 'theme-teal',    name: 'Teal Breeze', type: 'theme', price: 500, unlocked: false }
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
}

// Internal state used at runtime. Loaded from localStorage or seeded
// from DEFAULT_DATA on first run.
let state = {
  player: null,
  items: null,
  shop: null,
  inventory: null,
  newsEvents: null,
  store: null
};

const TOOL_GLOVE = 'glove';
const TOOL_WATERING = 'watering';
const TOOL_PICKAXE = 'pickaxe';
const TOOL_LIST = [TOOL_GLOVE, TOOL_WATERING, TOOL_PICKAXE];

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
    const baseName = getCropBaseName(item);
    if (baseName) return resolveResourcePath(`plants/${baseName}_plant${safeStageIndex}.png`);
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
  // News history stores arrays of events per week. Load from storage or start empty.
  state.newsHistory   = loadFromStorage('newsHistory',   null) ?? clone(DEFAULT_DATA.newsHistory);
  if (typeof state.player.energyMax !== 'number' || state.player.energyMax <= 0) {
    state.player.energyMax = DEFAULT_DATA.player.energyMax;
  }
  if (typeof state.player.energy !== 'number') {
    state.player.energy = state.player.energyMax;
  }
  state.player.energy = Math.max(0, Math.min(state.player.energy, state.player.energyMax));
  const itemMergeResult = mergeItemAssetsWithDefaults(state.items, DEFAULT_DATA.items);
  if (itemMergeResult.changed) {
    state.items = itemMergeResult.items;
    saveToStorage('items', state.items);
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
  // Initialise the Minesweeper grid state. A 9×9 grid has 81 cells,
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
  state.activeTool = loadFromStorage('activeTool', null);
  if (!Array.isArray(state.gridUnlocked) || state.gridUnlocked.length !== 81) {
    if (Array.isArray(oldGrid) && oldGrid.length === 81) {
      state.gridUnlocked = oldGrid.map(val => !!val);
    } else {
      state.gridUnlocked = Array(81).fill(false);
    }
  }
  if (!Array.isArray(state.gridItems) || state.gridItems.length !== 81) {
    state.gridItems = Array(81).fill(null);
  }
  if (!Array.isArray(state.gridPlantedDay) || state.gridPlantedDay.length !== 81) {
    state.gridPlantedDay = Array(81).fill(null);
  }
  if (!Array.isArray(state.gridWateredDay) || state.gridWateredDay.length !== 81) {
    state.gridWateredDay = Array(81).fill(null);
  }
  if (!Array.isArray(state.gridWateredCount) || state.gridWateredCount.length !== 81) {
    state.gridWateredCount = Array(81).fill(0);
  }
  if (!Array.isArray(state.gridMiningHits) || state.gridMiningHits.length !== 81) {
    state.gridMiningHits = Array(81).fill(0);
  }
  if (!Array.isArray(state.gridRarity) || state.gridRarity.length !== 81) {
    state.gridRarity = Array(81).fill(null);
  }
  if (!TOOL_LIST.includes(state.activeTool)) {
    state.activeTool = TOOL_GLOVE;
  }

}

/**
 * Persist the current state back to localStorage. Invoke this after
 * any mutation to player data, shop, inventory, reports, or news.
 */
function saveState() {
  saveToStorage('player',        state.player);
  saveToStorage('items',         state.items);
  saveToStorage('shop',          state.shop);
  saveToStorage('inventory',     state.inventory);
  saveToStorage('newsEvents',    state.newsEvents);
  saveToStorage('store',         state.store);
  saveToStorage('newsHistory',   state.newsHistory);
  // Persist grid purchase and placement state. These arrays represent which grid
  // slots have been purchased (gridUnlocked) and which contain items (gridItems).
  saveToStorage('gridUnlocked',  state.gridUnlocked);
  saveToStorage('gridItems',     state.gridItems);
  saveToStorage('gridPlantedDay', state.gridPlantedDay);
  saveToStorage('gridWateredDay', state.gridWateredDay);
  saveToStorage('gridWateredCount', state.gridWateredCount);
  saveToStorage('gridMiningHits', state.gridMiningHits);
  saveToStorage('gridRarity', state.gridRarity);
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
  state.gridUnlocked = Array(81).fill(false);
  state.gridItems    = Array(81).fill(null);
  state.gridPlantedDay = Array(81).fill(null);
  state.gridWateredDay = Array(81).fill(null);
  state.gridWateredCount = Array(81).fill(0);
  state.gridMiningHits = Array(81).fill(0);
  state.gridRarity = Array(81).fill(null);
  state.activeTool = TOOL_GLOVE;
  saveToStorage('gridUnlocked', state.gridUnlocked);
  saveToStorage('gridItems',    state.gridItems);
  saveToStorage('gridPlantedDay', state.gridPlantedDay);
  saveToStorage('gridWateredDay', state.gridWateredDay);
  saveToStorage('gridWateredCount', state.gridWateredCount);
  saveToStorage('gridMiningHits', state.gridMiningHits);
  saveToStorage('gridRarity', state.gridRarity);
  saveToStorage('activeTool', state.activeTool);
  // Start at week 1: schedule any news for week 1
  generateNewsEvents();
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
  // Clear previous content
  if (tableContainer) tableContainer.innerHTML = '';
  if (gridEl) gridEl.innerHTML = '';
  // Build combined table
  const table = document.createElement('table');
  table.className = 'zebra-table';
  const headerRow = document.createElement('tr');
  const headers = ['Img', 'Item', 'Avg', 'Price'];
  headers.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);
  // For each shop entry, create a unified row
  state.shop.forEach(entry => {
    const item = state.items.find(it => it.id === entry.itemId);
    if (!item) return;
    const row = document.createElement('tr');
    row.style.cursor = 'pointer';
    if (selectedShopItemId === item.id) {
      row.classList.add('market-row-selected');
    }
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
    img.width = 24;
    img.height = 24;
    imgCell.appendChild(img);
    row.appendChild(imgCell);
    // Item (description)
    const descCell = document.createElement('td');
    descCell.textContent = item.description || item.name;
    row.appendChild(descCell);
    // Avg Price (shop)
    const avgPriceCell = document.createElement('td');
    const avgPrice = (entry.daysCount && entry.priceSum) ? (entry.priceSum / entry.daysCount) : entry.price;
    avgPriceCell.textContent = `$${avgPrice.toFixed(2)}`;
    row.appendChild(avgPriceCell);
    // Price
    const priceCell = document.createElement('td');
    priceCell.textContent = `$${entry.price.toFixed(2)}`;
    row.appendChild(priceCell);

    row.addEventListener('click', () => {
      selectShopItem(item.id);
    });

    table.appendChild(row);
  });
  if (tableContainer) {
    tableContainer.appendChild(table);
  }
  // Build the 9×9 farm. Each cell may be locked (unpurchased), unlocked and empty, or contain an item.
  for (let i = 0; i < 81; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
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
          const stageCount = it.plantStages || 1;
          const growDays = typeof it.growDays === 'number' ? it.growDays : 0;
          const wateredCount = Array.isArray(state.gridWateredCount) ? (state.gridWateredCount[i] || 0) : 0;
          let stageIndex = 1;
          let isGrown = true;
          if (growDays > 0) {
            const progress = Math.min(1, wateredCount / growDays);
            stageIndex = 1 + Math.floor(progress * (stageCount - 1));
            isGrown = wateredCount >= growDays;
          }
          const img = document.createElement('img');
          img.width = 24;
          img.height = 24;
          const gridImagePath = isGrown
            ? getHarvestImagePath(it)
            : getPlantStageImagePath(it, stageIndex);
          if (gridImagePath) {
            img.src = gridImagePath;
          }
          img.alt = it.name;
          cell.appendChild(img);
          if (isGrown) {
            const rarity = assignGridRarity(i);
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
            const daysLeft = Math.max(0, growDays - wateredCount);
            cell.title = `Grows in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
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
    // Handle clicks: purchase locked slots or remove items from grid. Use
    // dynamic state lookups instead of captured variables.
    cell.addEventListener('click', () => {
      const unlockedNow = state.gridUnlocked[i];
      if (state.activeTool === TOOL_PICKAXE) {
        if (!unlockedNow) {
          const didMessage = mineGridTile(i);
          if (!didMessage) {
            setChatProfile('player', 'neutral');
          }
        } else {
          setChatProfile('player', 'neutral');
        }
        return;
      }
      if (state.activeTool === TOOL_WATERING) {
        if (!unlockedNow) {
          addMessage('This tile is locked. Mine it first.');
          return;
        }
        const didMessage = waterGridTile(i);
        if (!didMessage) {
          setChatProfile('player', 'neutral');
        }
        return;
      }
      if (!unlockedNow) {
        addMessage('Use the pickaxe to mine this tile.');
        return;
      }
      if (state.gridItems[i]) {
        const itmId = state.gridItems[i];
        const it = state.items.find(itm => itm.id === itmId);
        const growDays = it && typeof it.growDays === 'number' ? it.growDays : 0;
        const wateredCount = Array.isArray(state.gridWateredCount) ? (state.gridWateredCount[i] || 0) : 0;
        const isGrown = growDays > 0 ? wateredCount >= growDays : true;
        if (isGrown) {
          harvestPlant(i);
        } else {
          addMessage('This plant is still growing.');
        }
        return;
      }
      if (selectedShopItemId) {
        purchaseAndPlaceSelected(i);
      } else {
        addMessage('Select an item from the market first.');
      }
    });
    // Disable the context menu on right click. Earlier versions used
    // right‑click for testing reveal/hide behaviour but this has been
    // removed. Prevent the default context menu from appearing.
    cell.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
    });
    gridEl.appendChild(cell);
  }

}

/**
 * Render the Store tab. Handles sub‑tabs for cosmetics and crafting.
 * Based on the selected sub‑tab, the store content
 * area is populated accordingly. Buttons to buy or select items call
 * into functions that update state and persist changes.
 */
let currentStoreTab = 'cosmetics';
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
function showTab(tabName) {
    const marketTable = document.getElementById('market-table-container');
    const storePanel = document.getElementById('store');
  const marketTab = document.getElementById('tab-market');
  const storeTab = document.getElementById('tab-store');
  const isMarket = tabName === 'market';
    if (marketTable) marketTable.style.display = isMarket ? 'block' : 'none';
  if (storePanel) storePanel.style.display = isMarket ? 'none' : 'block';
  if (marketTab) {
    marketTab.classList.toggle('active', isMarket);
    marketTab.setAttribute('aria-selected', isMarket ? 'true' : 'false');
  }
  if (storeTab) {
    storeTab.classList.toggle('active', !isMarket);
    storeTab.setAttribute('aria-selected', isMarket ? 'false' : 'true');
  }
  renderMarket();
  renderEnergyBar();
  if (!isMarket) {
    renderStore();
  }
  updateGridSize();
}

/**
 * Render all parts of the interface. Should be called after any
 * significant state change such as buying/selling items, advancing
 * the day, or changing a theme. This acts as a single entry point
 * for UI updates.
 */
function renderAll() {
  renderHUD();
  renderEnergyBar();
  // Always update market to keep grid/table in sync, even if hidden.
  renderMarket();
  // Update store only when visible.
  const storeEl = document.getElementById('store');
  if (storeEl && window.getComputedStyle(storeEl).display !== 'none') {
    renderStore();
  }
  updateGridSize();
}

function updateGridSize() {
  const root = document.documentElement;
  const isMobile = window.innerWidth < window.innerHeight;
  const gridContainer = document.getElementById('grid-container');
  if (!gridContainer) return;
  if (isMobile) {
    const size = Math.max(200, window.innerWidth - 24);
    root.style.setProperty('--grid-size', `${size}px`);
    return;
  }
  const header = document.getElementById('market-header');
  const messages = document.getElementById('messages-panel');
  const nextDay = document.getElementById('next-day');
  const headerHeight = header ? header.offsetHeight : 0;
  const messagesHeight = messages ? messages.offsetHeight : 0;
  const nextDayHeight = nextDay ? nextDay.offsetHeight : 0;
  const rowHeight = Math.max(messagesHeight, nextDayHeight);
  const availableHeight = window.innerHeight - headerHeight - rowHeight - 24;
  const maxByWidth = gridContainer.parentElement ? gridContainer.parentElement.clientWidth : availableHeight;
  const size = Math.max(240, Math.min(availableHeight, maxByWidth));
  root.style.setProperty('--grid-size', `${size}px`);
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
    tired: 'resources/profiles/player_tired.png',
    wrong: 'resources/profiles/player_wrong.png',
    money: 'resources/profiles/player_money.png'
  },
  farmer: {
    neutral: 'resources/profiles/farmer.png'
  },
  merchant: {
    neutral: 'resources/profiles/merchant.png'
  }
};
let messageJustEmitted = false;
let lastClickToken = 0;

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

function addMessage(text, meta) {
  const chatLog = document.getElementById('chat-log');
  // Compose a timestamp that includes the current day and day of week. The
  // state.player.day field tracks the absolute day count and dowIndex is
  // derived from it. Use local time for the time portion.
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dowNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayIndex = (state.player && state.player.day) ? state.player.day : 1;
  const dowIndex = (dayIndex - 1) % 7;
  const dow = dowNames[dowIndex];
  const prefix = `DAY ${dayIndex} - ${dow}`;
  const speaker = meta && meta.speaker ? meta.speaker : 'player';
  const emotion = meta && meta.emotion ? meta.emotion : 'neutral';
  setChatProfile(speaker, emotion);
  messageJustEmitted = true;
  const entry = document.createElement('div');
  entry.textContent = `[${prefix} ${timeString}] ${text}`;
  chatLog.appendChild(entry);
  // Scroll to bottom
  chatLog.scrollTop = chatLog.scrollHeight;
}

function consumeEnergy(amount, reason) {
  const max = state.player.energyMax || 10;
  if (typeof state.player.energy !== 'number') {
    state.player.energy = max;
  }
  if (state.player.energy < amount) {
    const message = reason ? `Not enough energy to ${reason}.` : 'Not enough energy.';
    addMessage(message, { speaker: 'player', emotion: 'tired' });
    return false;
  }
  state.player.energy = Math.max(0, state.player.energy - amount);
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
  const shopEntry = state.shop.find(entry => entry.itemId === itemId);
  const item      = state.items.find(it => it.id === itemId);
  if (!shopEntry || !item) return;
  // Check stock
  if (shopEntry.quantity < quantity) {
    alert('Not enough stock available.');
    return;
  }
  // Compute total cost
  const totalCost = shopEntry.price * quantity;
  if (state.player.cash < totalCost) {
    alert('Insufficient funds.');
    return;
  }
  // Deduct cash and stock
  state.player.cash -= totalCost;
  shopEntry.quantity -= quantity;
  // Add to inventory (or increase quantity if exists)
  let invEntry = state.inventory.find(entry => entry.itemId === itemId);
  if (!invEntry) {
    invEntry = { itemId: itemId, quantity: 0, avgCost: 0 };
    state.inventory.push(invEntry);
  }
  // Update average cost: weighted average of existing stock and new purchase
  const existingCost = invEntry.avgCost * invEntry.quantity;
  invEntry.quantity += quantity;
  invEntry.avgCost = (existingCost + totalCost) / invEntry.quantity;
  saveState();
  // Announce purchase
  addMessage(`Bought ${quantity} × ${item.name} for $${totalCost.toFixed(2)}`, { speaker: 'merchant' });
  renderAll();
}

/**
 * Sell a quantity of an item from the player's inventory back to the
 * shop. Increases cash and increases shop stock. The
 * sale price is currently equal to the shop price. The Python
 * implementation also updates the shop’s price based on sales volume;
 * you can port that logic here.
 *
 * @param {number} itemId The ID of the item to sell
 * @param {number} quantity The number of units to sell
 */
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
  saveState();
  // Announce sale
  const item = state.items.find(it => it.id === itemId);
  addMessage(`Sold ${quantity} × ${item ? item.name : 'item'} for $${saleValue.toFixed(2)}`, { speaker: 'player', emotion: 'money' });
  renderAll();
}

/**
 * Advance the game by one day. This function should update item
 * prices (possibly using random fluctuations or news event impacts),
 * generate new news on a schedule and increment the day/week/year.
 */
function nextDay() {
  // Advance day counter
  state.player.day += 1;
  if (typeof state.player.energyMax !== 'number' || state.player.energyMax <= 0) {
    state.player.energyMax = DEFAULT_DATA.player.energyMax;
  }
  state.player.energy = state.player.energyMax;
  // Determine the day of week for the new day (0=Mon,..6=Sun)
  const dowIndex = (state.player.day - 1) % 7;
  // Handle start of a new week (Monday) for days beyond the first
  if (dowIndex === 0 && state.player.day !== 1) {
    state.player.week += 1;
  }
  // On Thursdays (dowIndex 3) generate news events for this week if not already generated
  if (dowIndex === 3) {
    generateNewsEvents();
  }
  // Update item prices – accumulate for average, apply random fluctuation and news impact
  state.shop.forEach(entry => {
    // Accumulate the current price into priceSum and increment daysCount
    entry.priceSum = (entry.priceSum || 0) + entry.price;
    entry.daysCount = (entry.daysCount || 0) + 1;
    // Apply random ±5% fluctuation
    const randomFactor = 1 + (Math.random() * 0.1 - 0.05);
    entry.price *= randomFactor;
    // Apply active news modifiers. Events may specify 'impact' as a percentage
    // or a 'multiplier'. Determine the factor accordingly.
    const item = state.items.find(it => it.id === entry.itemId);
    if (item) {
      state.newsEvents.forEach(event => {
        let factor = 1;
      if (event.affects && event.affects === item.id) {
          if (typeof event.impact === 'number') {
            factor = 1 + (event.impact / 100);
          } else if (typeof event.multiplier === 'number') {
            factor = event.multiplier;
          }
          entry.price *= factor;
        }
      });
    }
    // Keep price within reasonable bounds
    entry.price = Math.max(0.01, entry.price);
  });
  // Decrement daysLeft for news events and remove expired ones
  state.newsEvents = state.newsEvents.filter(event => {
    if (typeof event.daysLeft === 'number') {
      event.daysLeft -= 1;
      return event.daysLeft > 0;
    }
    return true;
  });
  // Recalculate net worth (cash + inventory value)
  let inventoryValue = 0;
  state.inventory.forEach(entry => {
    const shopEntry = state.shop.find(s => s.itemId === entry.itemId);
    if (shopEntry) {
      inventoryValue += shopEntry.price * entry.quantity;
    }
  });
  state.player.netWorth = state.player.cash + inventoryValue;
  // Save active news events and history
  saveToStorage('newsEvents', state.newsEvents);
  saveToStorage('newsHistory', state.newsHistory);
  // Provide a single contextual tip or reminder for the day
  generateDailyTip(dowIndex);
  saveState();
  renderAll();
}

/**
 * Generate daily tips and facts. Depending on the day of week this will
 * emit messages such as buy/sell recommendations, inventory status,
 * cash on hand and special reminders on Thursdays. To avoid
 * spamming the chat, it selects a few messages each day.
 *
 * @param {number} dowIndex The zero‑based index of the current day of week (0=Mon..6=Sun)
 */
function generateDailyTip(dowIndex) {
  // Thursday: show weekly news in messages
  if (dowIndex === 3) {
    const events = state.newsHistory[state.player.week] || [];
    if (events.length === 0) {
    addMessage('News: No stories this week.', { speaker: 'farmer' });
      return;
    }
    addMessage('News: New market stories are in.', { speaker: 'farmer' });
    events.forEach(event => {
      let impactStr = '';
      if (typeof event.impact === 'number') {
        impactStr = (event.impact >= 0 ? '+' : '') + event.impact + '%';
      } else if (typeof event.multiplier === 'number') {
        const pct = ((event.multiplier - 1) * 100).toFixed(0);
        impactStr = (pct >= 0 ? '+' : '') + pct + '%';
      }
      let itemName = '';
      if (event.affects) {
        const it = state.items.find(itm => itm.id === event.affects);
        itemName = it ? it.name : String(event.affects);
      }
      const detail = [event.headline, itemName ? `Affects ${itemName}` : '', impactStr ? `Impact ${impactStr}` : '']
        .filter(Boolean)
        .join(' | ');
      addMessage(detail, { speaker: 'farmer' });
    });
    return;
  }
  // Otherwise select one random tip from the optional categories
  const optionalTips = [];
  // Suggest buying if price below average price
  let bestBuy = null;
  let bestBuyDiff = 0;
  state.shop.forEach(entry => {
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
  addMessage(tipOptions[idx]);
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
  state.player.cash -= cost;
  state.gridUnlocked[index] = true;
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
  const currentHits = Array.isArray(state.gridMiningHits) ? (state.gridMiningHits[index] || 0) : 0;
  const nextHits = currentHits + 1;
  let didMessage = false;
  if (nextHits >= 10) {
    state.gridUnlocked[index] = true;
    if (Array.isArray(state.gridMiningHits)) {
      state.gridMiningHits[index] = 0;
    }
  addMessage('Cleared a tile.', { speaker: 'player', emotion: 'excited' });
    didMessage = true;
  } else if (Array.isArray(state.gridMiningHits)) {
    state.gridMiningHits[index] = nextHits;
  }
  saveState();
  renderAll();
  return didMessage;
}

function waterGridTile(index) {
  if (!Array.isArray(state.gridWateredDay) || index < 0 || index >= state.gridWateredDay.length) return false;
  if (!consumeEnergy(1, 'water this tile')) {
    return true;
  }
  const wasWateredToday = state.gridWateredDay[index] === state.player.day;
  if (!wasWateredToday) {
    state.gridWateredDay[index] = state.player.day;
    if (Array.isArray(state.gridWateredCount) && state.gridItems[index]) {
      state.gridWateredCount[index] = (state.gridWateredCount[index] || 0) + 1;
      const item = state.items.find(it => it.id === state.gridItems[index]);
      if (item) {
        const growDays = typeof item.growDays === 'number' ? item.growDays : 0;
        if (growDays > 0 && state.gridWateredCount[index] >= growDays) {
          assignGridRarity(index);
        }
      }
    }
  }
  saveState();
  renderAll();
  if (!wasWateredToday && state.gridItems[index]) {
    addMessage('Watered a plant.', { speaker: 'player', emotion: 'excited' });
    return true;
  }
  return false;
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
  state.gridItems[cellIndex] = itemId;
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
  saveState();
  addMessage(`Placed ${item.name} on the grid.`);
  renderAll();
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
  renderAll();
}

// Track the currently selected shop item for farm placement.
let selectedShopItemId = null;

function selectShopItem(itemId) {
  if (selectedShopItemId === itemId) {
    selectedShopItemId = null;
    updateCursorForTool();
    renderMarket();
    return;
  }
  selectedShopItemId = itemId;
  setActiveTool(TOOL_GLOVE);
  updateCursorForTool();
  renderMarket();
}

function clearShopSelection() {
  if (!selectedShopItemId) return;
  selectedShopItemId = null;
  updateCursorForTool();
  renderMarket();
}

function updateToolButtons() {
  document.querySelectorAll('.tool-button').forEach(button => {
    const tool = button.getAttribute('data-tool');
    if (tool === state.activeTool) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
}

function updateCursorForTool() {
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
  state.activeTool = tool;
  updateToolButtons();
  updateCursorForTool();
  saveToStorage('activeTool', state.activeTool);
}

function purchaseAndPlaceSelected(cellIndex) {
  if (!selectedShopItemId) return;
  const shopEntry = state.shop.find(entry => entry.itemId === selectedShopItemId);
  const item = state.items.find(it => it.id === selectedShopItemId);
  if (!shopEntry || !item) return;
  if (shopEntry.quantity <= 0) {
    addMessage('Out of stock.');
    return;
  }
  if (state.player.cash < shopEntry.price) {
    alert('Insufficient funds.');
    return;
  }
  if (!consumeEnergy(1, 'plant a seed')) {
    return;
  }
  state.player.cash -= shopEntry.price;
  state.player.netWorth = state.player.cash;
  shopEntry.quantity -= 1;
  state.gridItems[cellIndex] = selectedShopItemId;
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
  saveState();
  addMessage(`Purchased ${item.name} for $${shopEntry.price.toFixed(2)} and placed it on the grid.`, { speaker: 'farmer' });
  renderAll();
}

function harvestPlant(cellIndex) {
  const itemId = state.gridItems[cellIndex];
  if (!itemId) return;
  const item = state.items.find(it => it.id === itemId);
  if (!item) return;
  if (!consumeEnergy(1, 'harvest this plant')) {
    return;
  }
  const shopEntry = state.shop.find(entry => entry.itemId === itemId);
  const basePrice = shopEntry ? shopEntry.price : 0;
  const rarity = getGridRarity(cellIndex) || assignGridRarity(cellIndex);
  const multiplier = getRarityMultiplier(rarity);
  const saleValue = basePrice * multiplier;
  state.player.cash += saleValue;
  state.player.netWorth = state.player.cash;
  state.gridItems[cellIndex] = null;
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
  addMessage(`Harvested ${item.name} for $${saleValue.toFixed(2)}`, { speaker: 'player', emotion: 'money' });
  renderAll();
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
 * Generate news events for the current week. News definitions are
 * stored in DEFAULT_DATA.newsEvents as a schedule, each with a
 * 'week' property indicating when the event should occur. When
 * called, this function scans for news scheduled for the
 * player’s current week and appends a copy of each event to
 * state.newsEvents with a 'daysLeft' property equal to the event
 * duration. The schedule remains untouched so that future weeks
 * can still generate events on resets.
 */
function generateNewsEvents() {
  const currentWeek = state.player.week;
  // Only generate news once per week. If history already has entries for this week, skip.
  if (state.newsHistory[currentWeek] && state.newsHistory[currentWeek].length > 0) {
    return;
  }
  if (!Array.isArray(DEFAULT_DATA.newsEvents)) return;
  // Select up to three random templates from the pool. For each
  // selected template, pick a random item from the current items
  // list and insert its name into the headline and article. The
  // resulting event includes the affected item id, impact, duration and
  // daysLeft fields.
  const pool = DEFAULT_DATA.newsEvents.slice();
  const eventsForWeek = [];
  const count = Math.min(3, pool.length);
  for (let i = 0; i < count; i++) {
    const templateIndex = Math.floor(Math.random() * pool.length);
    const baseEvent = pool.splice(templateIndex, 1)[0];
    // Choose a random item from the current items list
    let selectedItem = null;
    if (Array.isArray(state.items) && state.items.length > 0) {
      const itemIndex = Math.floor(Math.random() * state.items.length);
      selectedItem = state.items[itemIndex];
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
      setActiveTool(tool);
    });
  });

  document.addEventListener('click', () => {
    messageJustEmitted = false;
    const token = ++lastClickToken;
    setTimeout(() => {
      if (!messageJustEmitted && lastClickToken === token) {
        setChatProfile('player', 'neutral');
      }
    }, 0);
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
  attachEventHandlers();
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
  window.addEventListener('resize', updateGridSize);
}

// Run main once DOM is ready. If the async function rejects, log the error.
document.addEventListener('DOMContentLoaded', () => {
  main().catch(err => console.error(err));
});
