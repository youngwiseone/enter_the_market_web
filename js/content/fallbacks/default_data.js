export const DEFAULT_DATA = {
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
      plantStageImages: [
        'plants/pumpkin_plant1.png',
        'plants/pumpkin_plant2.png',
        'plants/pumpkin_plant3.png',
        'plants/pumpkin_plant4.png',
        'plants/pumpkin_plant5.png',
        'plants/pumpkin_plant6.png'
      ],
      harvestImage: 'items/pumpkin.png',
      seedIconImage: 'items/pumpkin.png',
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
      harvestImage: 'items/tomato.png',
      seedIconImage: 'items/tomato.png',
      growDays: 6,
      plantStages: 6
    },
    {
      id: 3,
      name: 'Corn Seeds',
      description: 'Corn seeds.',
      price: 8,
      rarity: 'common',
      harvestImage: 'items/corn.png',
      seedIconImage: 'items/corn.png',
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
      harvestImage: 'items/carrot.png',
      seedIconImage: 'items/carrot.png',
      growDays: 6,
      plantStages: 6
    },
    {
      id: 5,
      name: 'Potato Seeds',
      description: 'Potato seeds.',
      price: 3,
      rarity: 'common',
      harvestImage: 'items/potato.png',
      seedIconImage: 'items/potato.png',
      growDays: 6,
      plantStages: 6
    },
    {
      id: 6,
      name: 'Onion Seeds',
      description: 'Onion seeds.',
      price: 2,
      rarity: 'common',
      harvestImage: 'items/onion.png',
      seedIconImage: 'items/onion.png',
      growDays: 6,
      plantStages: 6
    },
    {
      id: 7,
      name: 'Cabbage Seeds',
      description: 'Cabbage seeds.',
      price: 9,
      rarity: 'common',
      harvestImage: 'items/cabbage.png',
      seedIconImage: 'items/cabbage.png',
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
      harvestImage: 'items/broccoli.png',
      seedIconImage: 'items/broccoli.png',
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
      harvestImage: 'items/cucumber.png',
      seedIconImage: 'items/cucumber.png',
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
      harvestImage: 'items/zucchini.png',
      seedIconImage: 'items/zucchini.png',
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
      harvestImage: 'items/eggplant.png',
      seedIconImage: 'items/eggplant.png',
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
      harvestImage: 'items/garlic.png',
      seedIconImage: 'items/garlic.png',
      growDays: 6,
      plantStages: 6
    },
    {
      id: 13,
      name: 'Lettuce Seeds',
      description: 'Lettuce seeds.',
      price: 22,
      rarity: 'common',
      harvestImage: 'items/lettuce.png',
      seedIconImage: 'items/lettuce.png',
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
      harvestImage: 'items/spinach.png',
      seedIconImage: 'items/spinach.png',
      growDays: 6,
      plantStages: 6
    },
    {
      id: 15,
      name: 'Radish Seeds',
      description: 'Radish seeds.',
      price: 3,
      rarity: 'common',
      harvestImage: 'items/radish.png',
      seedIconImage: 'items/radish.png',
      growDays: 6,
      plantStages: 6
    },
    {
      id: 16,
      name: 'Green Pepper Seeds',
      description: 'Green pepper seeds.',
      price: 24,
      rarity: 'common',
      harvestImage: 'items/green_pepper.png',
      seedIconImage: 'items/green_pepper.png',
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
      harvestImage: 'items/beetroot.png',
      seedIconImage: 'items/beetroot.png',
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
      name: 'Growth Contract',
      description: 'Reach Day 3 and $220 cash',
      type: 'economy',
      goal: {
        all: [
          { metric: 'day', operator: '>=', value: 3 },
          { metric: 'cash', operator: '>=', value: 220 }
        ]
      },
      reward: { cashBonus: 180 },
      message: 'Goal complete: Growth contract paid out ($180).'
    },
    {
      id: 'unlock-tier3-growth',
      name: 'Supply Chain Win',
      description: 'Harvest 14 crops and reach $400 cash',
      type: 'economy',
      goal: {
        all: [
          { metric: 'harvestCount', operator: '>=', value: 14 },
          { metric: 'cash', operator: '>=', value: 400 }
        ]
      },
      reward: { cashBonus: 300 },
      message: 'Goal complete: Supply chain bonus awarded ($300).'
    },
    {
      id: 'unlock-tier4-elite',
      name: 'Elite Futures',
      description: 'Reach $1,200 cash and unlock 8 farm tiles',
      type: 'economy',
      goal: {
        all: [
          { metric: 'cash', operator: '>=', value: 1200 },
          { metric: 'gridUnlockedCount', operator: '>=', value: 8 }
        ]
      },
      reward: { cashBonus: 750 },
      message: 'Goal complete: Elite futures bonus awarded ($750).'
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
  messages: [
    {
      id: 'system.fallback_forgot',
      type: 'system',
      icon: 'chat',
      speaker: 'farmer',
      emotion: 'neutral',
      category: 'system',
      priority: 'low',
      template: 'I was gonna say something, but I forgot'
    },
    {
      id: 'intro.welcome_new_game',
      type: 'intro',
      icon: 'sparkle',
      speaker: 'farmer',
      emotion: 'neutral',
      category: 'tutorial',
      priority: 'high',
      maxPerDay: 1,
      template: 'Welcome to the Market!'
    },
    {
      id: 'tip.day1.mine_pickaxe',
      type: 'tip',
      icon: 'pickaxe',
      speaker: 'player',
      emotion: 'mining',
      category: 'tips',
      priority: 'normal',
      cooldownMs: 90000,
      replaceKey: 'tip:mine-pickaxe',
      replaceScope: 'global',
      template: 'Tip: Click the pickaxe button, then click a farm tile to mine.'
    },
    {
      id: 'tip.day1.plant_after_mine',
      type: 'tip',
      icon: 'sprout',
      speaker: 'farmer',
      emotion: 'neutral',
      category: 'tips',
      priority: 'normal',
      cooldownMs: 90000,
      replaceKey: 'tip:plant-after-mine',
      replaceScope: 'global',
      template: 'Tip: You can plant items on tiles you have freed up!'
    },
    {
      id: 'tip.day1.select_market_then_tile',
      type: 'tip',
      icon: 'sprout',
      speaker: 'farmer',
      emotion: 'neutral',
      category: 'tips',
      priority: 'normal',
      cooldownMs: 90000,
      replaceKey: 'tip:select-market-then-tile',
      replaceScope: 'global',
      template: 'Tip: Click an item from Market, then click a free tile to plant.'
    },
    {
      id: 'tip.day1.water_crops',
      type: 'tip',
      icon: 'watering',
      speaker: 'player',
      emotion: 'watering',
      category: 'tips',
      priority: 'normal',
      cooldownMs: 90000,
      replaceKey: 'tip:water-crops',
      replaceScope: 'global',
      template: 'Tip: Use the watering can tool on planted crops to help them grow.'
    },
    {
      id: 'tip.day1.harvest_ready',
      type: 'tip',
      icon: 'sprout',
      speaker: 'player',
      emotion: 'excited',
      category: 'tips',
      priority: 'normal',
      cooldownMs: 90000,
      replaceKey: 'tip:harvest-ready',
      replaceScope: 'global',
      template: 'Tip: A crop is ready. Click it with gloves to harvest.'
    },
    {
      id: 'tip.low_energy_rest',
      type: 'tip',
      icon: 'clock',
      speaker: 'player',
      emotion: 'tired',
      category: 'tips',
      priority: 'low',
      cooldownMs: 70000,
      replaceKey: 'tip:low-energy',
      replaceScope: 'global',
      template: 'Low energy. Rest to start the next day and refill energy.'
    },
    {
      id: 'idle.session_time',
      type: 'idle',
      icon: 'clock',
      speaker: 'farmer',
      emotion: 'neutral',
      category: 'idle',
      priority: 'low',
      cooldownMs: 60000,
      template: 'You have played for {sessionDuration} this session!'
    },
    {
      id: 'idle.grow_hype',
      type: 'idle',
      icon: 'chat',
      speaker: 'player',
      emotion: 'excited',
      category: 'idle',
      priority: 'low',
      cooldownMs: 60000,
      template: 'I love seeing all the {itemNamePlural} growing!'
    },
    {
      id: 'commerce.buy_streak_seed',
      type: 'market',
      icon: 'chat',
      speaker: 'farmer',
      emotion: 'produce',
      category: 'progress',
      priority: 'normal',
      template: 'Wow, buying lots of {itemName} I see!'
    },
    {
      id: 'commerce.buy_streak_seed_mixed',
      type: 'market',
      icon: 'chat',
      speaker: 'farmer',
      emotion: 'produce',
      category: 'progress',
      priority: 'normal',
      template: 'Mixing it up I see!'
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

