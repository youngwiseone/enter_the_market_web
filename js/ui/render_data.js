import { isProduceItem } from '../content/item_types.js';
import { getHarvestImagePath, resolveResourcePath } from '../content/resource_paths.js';

const GRAPH_WINDOW_OPTIONS = [
  { id: '7', label: '7d', days: 7 },
  { id: '30', label: '30d', days: 30 },
  { id: '90', label: '90d', days: 90 },
  { id: 'all', label: 'All', days: null }
];

const DATA_GROUP_OPTIONS = [
  { id: 'total', label: 'Total' },
  { id: 'items', label: 'Items' }
];

const SERIES_COLORS = [
  '#4f8cff',
  '#ff9f43',
  '#52d273',
  '#ff5d73',
  '#a67cff',
  '#f2c94c'
];

const MAX_ACTIVE_PRICE_SERIES = 4;
const CASH_ICON_PATH = resolveResourcePath('effects/coin_particle_01.png');

let activeGraphWindow = '30';
let activeDataGroup = 'total';
let activeGraphSeriesKeys = ['cash'];

function formatMoney(value) {
  return `$${(Math.max(0, Number(value) || 0)).toFixed(2)}`;
}

function formatAxisMoney(value, compact = false) {
  const safeValue = Math.max(0, Number(value) || 0);
  return compact ? `$${Math.round(safeValue)}` : formatMoney(safeValue);
}

function formatSeriesDelta(currentValue, previousValue) {
  if (!Number.isFinite(previousValue) || previousValue <= 0) return 'New';
  const pct = ((currentValue - previousValue) / previousValue) * 100;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeSvgAttribute(value) {
  return escapeHtml(value);
}

function getVisibleHistory(history) {
  const selectedWindow = GRAPH_WINDOW_OPTIONS.find((option) => option.id === activeGraphWindow) || GRAPH_WINDOW_OPTIONS[1];
  if (!selectedWindow.days) return history.slice();
  return history.slice(-selectedWindow.days);
}

function getSeriesGroup(series) {
  if (!series) return 'total';
  if (series.type === 'cash') return 'total';
  return series.group || 'total';
}

function getSeriesColor(series) {
  if (!series) return SERIES_COLORS[0];
  if (series.type === 'cash') return SERIES_COLORS[0];
  const numericId = Number(series.itemId);
  if (Number.isInteger(numericId) && numericId > 0) {
    return SERIES_COLORS[(numericId - 1) % SERIES_COLORS.length];
  }
  let hash = 0;
  const key = String(series.key || '');
  for (let index = 0; index < key.length; index += 1) {
    hash = ((hash * 31) + key.charCodeAt(index)) >>> 0;
  }
  return SERIES_COLORS[hash % SERIES_COLORS.length];
}

function buildSeriesDefinitions(state, isShopItemUnlocked) {
  const items = Array.isArray(state?.items) ? state.items : [];
  const shopEntries = Array.isArray(state?.shop) ? state.shop : [];
  const shopByItemId = new Map(shopEntries.map((entry) => [String(entry?.itemId ?? ''), entry]));
  const unlockedItems = items.filter((item) => (
    item
    && typeof item.id === 'number'
    && isShopItemUnlocked(item.id)
    && isProduceItem(item)
  ));
  const itemSeries = unlockedItems.map((item) => {
    const entry = shopByItemId.get(String(item.id));
    return {
      key: `item:${item.id}`,
      itemId: item.id,
      type: 'item',
      label: item.name || `Item ${item.id}`,
      currentValue: Math.max(0, Number(entry?.price) || 0),
      group: 'items',
      iconPath: getHarvestImagePath(item),
      item
    };
  });
  return [
    {
      key: 'cash',
      type: 'cash',
      label: 'Total Cash',
      currentValue: Math.max(0, Number(state?.player?.cash) || 0),
      group: 'total',
      iconPath: CASH_ICON_PATH
    },
    ...itemSeries
  ];
}

function getSelectedSeriesKey(state, selectedShopItemId, selectedGridCellIndex) {
  if (selectedShopItemId) return `item:${selectedShopItemId}`;
  if (!Number.isInteger(selectedGridCellIndex)) return null;
  const itemId = Array.isArray(state?.gridItems) ? Number(state.gridItems[selectedGridCellIndex]) : 0;
  return itemId ? `item:${itemId}` : null;
}

function filterSeriesForGroup(seriesDefinitions) {
  if (activeDataGroup === 'total') {
    return seriesDefinitions.filter((series) => series.key === 'cash');
  }
  return seriesDefinitions.filter((series) => getSeriesGroup(series) === activeDataGroup);
}

function normalizeActiveSeries(availableSeries, preferredSeriesKey = null) {
  const availableKeys = new Set(availableSeries.map((series) => series.key));
  if (activeDataGroup === 'total') {
    activeGraphSeriesKeys = availableKeys.has('cash') ? ['cash'] : [];
    return activeGraphSeriesKeys;
  }
  let nextKeys = activeGraphSeriesKeys.filter((key) => availableKeys.has(key));

  if (preferredSeriesKey && availableKeys.has(preferredSeriesKey)) {
    nextKeys = preferredSeriesKey === 'cash'
      ? ['cash']
      : [preferredSeriesKey, ...nextKeys.filter((key) => key !== preferredSeriesKey && key !== 'cash')];
  }

  if (activeDataGroup !== 'total') {
    nextKeys = nextKeys.filter((key) => key !== 'cash');
  }

  if (nextKeys.length === 0) {
    const fallbackSeries = preferredSeriesKey && availableKeys.has(preferredSeriesKey)
      ? preferredSeriesKey
      : (availableSeries[0] ? availableSeries[0].key : null);
    nextKeys = fallbackSeries ? [fallbackSeries] : [];
  }

  const hasCash = nextKeys.includes('cash');
  if (hasCash && nextKeys.length > 1) {
    nextKeys = ['cash'];
  }
  if (!hasCash && nextKeys.length > MAX_ACTIVE_PRICE_SERIES) {
    nextKeys = nextKeys.slice(0, MAX_ACTIVE_PRICE_SERIES);
  }
  activeGraphSeriesKeys = nextKeys;
  return nextKeys;
}

function getSeriesValue(snapshot, series) {
  if (!snapshot || !series) return Number.NaN;
  if (series.type === 'cash') return Math.max(0, Number(snapshot.cash) || 0);
  const priceKey = String(series.itemId);
  if (!snapshot.prices || !Object.prototype.hasOwnProperty.call(snapshot.prices, priceKey)) {
    return Number.NaN;
  }
  return Math.max(0, Number(snapshot.prices[priceKey]) || 0);
}

function buildSeriesPoints(history, series, chartWidth, chartHeight, minValue, maxValue) {
  if (history.length === 0) return [];
  const valueRange = Math.max(1, maxValue - minValue);
  const xDenominator = Math.max(1, history.length - 1);
  return history.map((snapshot, index) => {
    const value = getSeriesValue(snapshot, series);
    if (!Number.isFinite(value)) {
      return { x: 0, y: 0, value, missing: true, day: Number(snapshot?.day) || 0 };
    }
    const x = history.length === 1 ? chartWidth / 2 : (index / xDenominator) * chartWidth;
    const y = chartHeight - (((value - minValue) / valueRange) * chartHeight);
    return { x, y, value, missing: false, day: Number(snapshot?.day) || 0 };
  });
}

function buildPathData(points) {
  let path = '';
  points.forEach((point, index) => {
    if (!point || point.missing) return;
    path += `${index === 0 || (points[index - 1] && points[index - 1].missing) ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)} `;
  });
  return path.trim();
}

function getTickValues(minValue, maxValue, compact) {
  if (compact) return [minValue, maxValue];
  return [minValue, minValue + ((maxValue - minValue) / 2), maxValue];
}

function getXAxisSnapshots(visibleHistory, compact) {
  if (visibleHistory.length === 0) return [];
  if (compact || visibleHistory.length < 3) {
    return [visibleHistory[0], visibleHistory[visibleHistory.length - 1]].filter(Boolean);
  }
  return [
    visibleHistory[0],
    visibleHistory[Math.floor((visibleHistory.length - 1) / 2)],
    visibleHistory[visibleHistory.length - 1]
  ];
}

function renderGraphSvg(visibleHistory, selectedSeries, graphWidth) {
  const chartWidth = Math.max(520, Number(graphWidth) || 720);
  const compact = chartWidth < 620;
  const chartHeight = compact ? 208 : 248;
  const axisLeft = compact ? 44 : 60;
  const axisRight = 14;
  const axisTop = 12;
  const axisBottom = compact ? 40 : 34;
  const innerWidth = chartWidth - axisLeft - axisRight;
  const innerHeight = chartHeight - axisTop - axisBottom;
  const values = [];

  selectedSeries.forEach((series) => {
    visibleHistory.forEach((snapshot) => {
      const value = getSeriesValue(snapshot, series);
      if (Number.isFinite(value)) values.push(value);
    });
  });

  if (visibleHistory.length === 0 || selectedSeries.length === 0 || values.length === 0) {
    return `
      <div class="data-graph-empty">
        Rest through a few days to start collecting market history.
      </div>
    `;
  }

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const paddedMin = Math.max(0, rawMin - ((rawMax - rawMin) * 0.12 || rawMax * 0.12 || 1));
  const paddedMax = rawMax + ((rawMax - rawMin) * 0.12 || rawMax * 0.12 || 1);
  const yTicks = getTickValues(paddedMin, paddedMax, compact);
  const xSnapshots = getXAxisSnapshots(visibleHistory, compact);

  const lineMarkup = selectedSeries.map((series, index) => {
    const color = getSeriesColor(series);
    const points = buildSeriesPoints(visibleHistory, series, innerWidth, innerHeight, paddedMin, paddedMax);
    const pathData = buildPathData(points);
    const lastPoint = [...points].reverse().find((point) => point && !point.missing);
    if (!pathData) return '';
    const iconMarkup = lastPoint && series.iconPath
      ? `<image href="${escapeSvgAttribute(series.iconPath)}" x="${(axisLeft + lastPoint.x - 16).toFixed(2)}" y="${(axisTop + lastPoint.y - 16).toFixed(2)}" width="32" height="32" preserveAspectRatio="xMidYMid meet" />`
      : '';
    return `
      <path class="data-graph-line" d="${escapeSvgAttribute(pathData)}" stroke="${color}" transform="translate(${axisLeft} ${axisTop})" />
      ${iconMarkup}
      ${lastPoint ? `<circle cx="${(axisLeft + lastPoint.x).toFixed(2)}" cy="${(axisTop + lastPoint.y).toFixed(2)}" r="3.25" fill="${color}" />` : ''}
    `;
  }).join('');

  const gridLines = yTicks.map((tick) => {
    const ratio = (tick - paddedMin) / Math.max(1, paddedMax - paddedMin);
    const y = axisTop + innerHeight - (ratio * innerHeight);
    return `
      <line x1="${axisLeft}" y1="${y.toFixed(2)}" x2="${(axisLeft + innerWidth).toFixed(2)}" y2="${y.toFixed(2)}" class="data-graph-grid-line" />
      <text x="${axisLeft - 7}" y="${(y + 4).toFixed(2)}" class="data-graph-axis-label data-graph-axis-label-left">${escapeSvgAttribute(formatAxisMoney(tick, compact))}</text>
    `;
  }).join('');

  const xAxisLabels = xSnapshots.map((snapshot, index) => {
    const ratio = visibleHistory.length <= 1 ? 0.5 : visibleHistory.indexOf(snapshot) / (visibleHistory.length - 1);
    const x = axisLeft + (ratio * innerWidth);
    const className = index === 0
      ? 'data-graph-axis-label data-graph-axis-label-left'
      : (index === xSnapshots.length - 1 ? 'data-graph-axis-label data-graph-axis-label-right' : 'data-graph-axis-label');
    const dayLabel = compact ? `${escapeSvgAttribute(snapshot?.day)}` : `Day ${escapeSvgAttribute(snapshot?.day)}`;
    return `<text x="${x.toFixed(2)}" y="${(axisTop + innerHeight + 18).toFixed(2)}" class="${className}">${dayLabel}</text>`;
  }).join('');
  const xAxisTitle = compact
    ? `<text x="${(axisLeft + (innerWidth / 2)).toFixed(2)}" y="${(axisTop + innerHeight + 33).toFixed(2)}" class="data-graph-axis-title">Day</text>`
    : '';

  return `
    <svg class="data-graph-svg" viewBox="0 0 ${chartWidth} ${chartHeight}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Market history graph">
      <rect x="${axisLeft}" y="${axisTop}" width="${innerWidth}" height="${innerHeight}" class="data-graph-plot" />
      ${gridLines}
      <line x1="${axisLeft}" y1="${(axisTop + innerHeight).toFixed(2)}" x2="${(axisLeft + innerWidth).toFixed(2)}" y2="${(axisTop + innerHeight).toFixed(2)}" class="data-graph-axis-line" />
      ${lineMarkup}
      ${xAxisLabels}
      ${xAxisTitle}
    </svg>
  `;
}

function createWindowButton(option, rerender) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `tab-button data-window-button${activeGraphWindow === option.id ? ' active' : ''}`;
  button.textContent = option.label;
  button.addEventListener('click', () => {
    activeGraphWindow = option.id;
    rerender();
  });
  return button;
}

function createGroupButton(option, availableCount, rerender) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `tab-button data-group-button${activeDataGroup === option.id ? ' active' : ''}`;
  button.textContent = option.label;
  button.disabled = availableCount <= 0 && option.id !== 'total';
  button.title = button.disabled ? `No ${option.label.toLowerCase()} data yet` : `View ${option.label.toLowerCase()} series`;
  button.addEventListener('click', () => {
    activeDataGroup = option.id;
    rerender();
  });
  return button;
}

function createSeriesButton(series, selectedKeys, rerender, isSourceSelected) {
  const button = document.createElement('button');
  button.type = 'button';
  const isSelected = selectedKeys.includes(series.key);
  button.className = `data-series-button${isSelected ? ' active' : ''}${isSourceSelected ? ' source-selected' : ''}`;
  button.innerHTML = `
    <span class="data-series-icon-wrap">${series.iconPath ? `<img class="data-series-icon" src="${escapeHtml(series.iconPath)}" alt="">` : ''}</span>
    <span class="data-series-copy">
      <span class="data-series-name-row">
        <span class="data-series-name">${escapeHtml(series.label)}</span>
      </span>
    </span>
  `;
  button.addEventListener('click', () => {
    if (series.key === 'cash') {
      activeGraphSeriesKeys = ['cash'];
      rerender();
      return;
    }
    let nextKeys = activeGraphSeriesKeys.filter((key) => key !== 'cash');
    if (nextKeys.includes(series.key)) {
      nextKeys = nextKeys.filter((key) => key !== series.key);
    } else {
      nextKeys = [series.key, ...nextKeys.filter((key) => key !== series.key)];
      if (nextKeys.length > MAX_ACTIVE_PRICE_SERIES) {
        nextKeys = nextKeys.slice(0, MAX_ACTIVE_PRICE_SERIES);
      }
    }
    activeGraphSeriesKeys = nextKeys.length > 0 ? nextKeys : [series.key];
    rerender();
  });
  return button;
}

function renderActiveSeriesSummary(selectedSeries, previousSnapshot) {
  const summaryRow = document.createElement('div');
  summaryRow.className = 'data-summary-row';
  selectedSeries.forEach((series) => {
    const previousValue = previousSnapshot ? getSeriesValue(previousSnapshot, series) : Number.NaN;
    const card = document.createElement('div');
    card.className = 'data-summary-card';
    card.style.setProperty('--series-color', getSeriesColor(series));
    card.innerHTML = `
      <span class="data-summary-label">${escapeHtml(series.label)}</span>
      <span class="data-summary-value-row">
        ${series.iconPath ? `<img class="data-summary-icon" src="${escapeHtml(series.iconPath)}" alt="">` : ''}
        <span class="data-summary-value">${escapeHtml(formatMoney(series.currentValue))}</span>
      </span>
      <span class="data-summary-delta">${escapeHtml(formatSeriesDelta(series.currentValue, previousValue))}</span>
    `;
    summaryRow.appendChild(card);
  });
  return summaryRow;
}

export function renderDataAction(deps) {
  const {
    state,
    isShopItemUnlocked,
    getSelectedShopItemId,
    getSelectedGridCellIndex
  } = deps;

  const panel = document.getElementById('data-panel');
  const content = document.getElementById('data-content');
  if (!panel || !content) return;

  const selectedShopItemId = typeof getSelectedShopItemId === 'function' ? getSelectedShopItemId() : null;
  const selectedGridCellIndex = typeof getSelectedGridCellIndex === 'function' ? getSelectedGridCellIndex() : null;
  const selectedSeriesKey = getSelectedSeriesKey(state, selectedShopItemId, selectedGridCellIndex);
  const allSeries = buildSeriesDefinitions(state, isShopItemUnlocked);
  const groupedCounts = {
    total: allSeries.some((series) => series.key === 'cash') ? 1 : 0,
    items: allSeries.filter((series) => getSeriesGroup(series) === 'items').length
  };

  const selectedSeriesDefinition = selectedSeriesKey
    ? allSeries.find((series) => series.key === selectedSeriesKey) || null
    : null;
  if (selectedSeriesDefinition && activeDataGroup !== 'total' && getSeriesGroup(selectedSeriesDefinition) !== activeDataGroup) {
    activeDataGroup = getSeriesGroup(selectedSeriesDefinition);
  }

  const availableSeries = filterSeriesForGroup(allSeries);
  const selectedKeys = normalizeActiveSeries(availableSeries, selectedSeriesKey);
  const selectedSeries = selectedKeys
    .map((key) => availableSeries.find((series) => series.key === key))
    .filter(Boolean);
  const visibleHistory = getVisibleHistory(Array.isArray(state?.marketHistory) ? state.marketHistory : []);
  const previousSnapshot = visibleHistory.length > 1 ? visibleHistory[visibleHistory.length - 2] : null;
  const latestSnapshot = visibleHistory.length > 0 ? visibleHistory[visibleHistory.length - 1] : null;
  const graphWidth = Math.max(520, Number(panel.clientWidth) - 340);

  content.innerHTML = '';

  const root = document.createElement('div');
  root.className = 'data-panel-layout';

  const graphCard = document.createElement('section');
  graphCard.className = 'data-card data-card-graph';

  const topBar = document.createElement('div');
  topBar.className = 'data-card-header';
  topBar.innerHTML = `
    <div class="data-card-heading">
      <div class="data-card-title">Market Data</div>
      <div class="data-card-subtitle">${latestSnapshot ? `Tracking ${visibleHistory.length} day${visibleHistory.length === 1 ? '' : 's'} through Day ${latestSnapshot.day}` : 'No recorded days yet'}</div>
    </div>
  `;
  const windowGroup = document.createElement('div');
  windowGroup.className = 'data-window-buttons';
  const rerender = () => renderDataAction(deps);
  GRAPH_WINDOW_OPTIONS.forEach((option) => windowGroup.appendChild(createWindowButton(option, rerender)));
  topBar.appendChild(windowGroup);
  graphCard.appendChild(topBar);

  const groupBar = document.createElement('div');
  groupBar.className = 'data-group-buttons';
  DATA_GROUP_OPTIONS.forEach((option) => {
    groupBar.appendChild(createGroupButton(option, groupedCounts[option.id] || 0, rerender));
  });
  graphCard.appendChild(groupBar);

  if (selectedSeries.length > 0) {
    graphCard.appendChild(renderActiveSeriesSummary(selectedSeries, previousSnapshot));
  }

  const graphSurface = document.createElement('div');
  graphSurface.className = 'data-graph-surface';
  graphSurface.innerHTML = renderGraphSvg(visibleHistory, selectedSeries, graphWidth);
  graphCard.appendChild(graphSurface);

  const sideCard = document.createElement('section');
  sideCard.className = 'data-card data-card-series';
  const sideHeader = document.createElement('div');
  sideHeader.className = 'data-card-header';
  sideHeader.innerHTML = `
    <div class="data-card-heading">
      <div class="data-card-title">Series</div>
      <div class="data-card-subtitle">${activeDataGroup === 'total' ? 'Showing total cash only.' : `Showing unlocked items only. Select up to ${MAX_ACTIVE_PRICE_SERIES} item lines.`}</div>
    </div>
  `;
  sideCard.appendChild(sideHeader);

  const seriesList = document.createElement('div');
  seriesList.className = 'data-series-list';
  availableSeries.forEach((series) => {
    seriesList.appendChild(createSeriesButton(
      series,
      selectedKeys,
      rerender,
      selectedSeriesKey === series.key
    ));
  });
  sideCard.appendChild(seriesList);

  root.appendChild(graphCard);
  root.appendChild(sideCard);
  content.appendChild(root);
}
