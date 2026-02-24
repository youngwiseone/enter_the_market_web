import { normalizeItemTypeAndTableKey } from './item_types.js';

/**
 * Load JSON content files into fallback default data.
 * Mutates the provided defaults object in place to preserve current behavior.
 */
export async function loadJSONDataIntoDefaults(defaultData) {
  const normalizeItemType = (item) => normalizeItemTypeAndTableKey(item, 'items.json');
  const normalizeDecorationAsItem = (decoration) => {
    if (!decoration || typeof decoration !== 'object') return decoration;
    return normalizeItemTypeAndTableKey({
      ...decoration,
      type: 'decoration'
    }, 'decorations.json');
  };
  const isProduceMarketItem = (item) => {
    if (!item || typeof item !== 'object') return false;
    const itemType = String(item.type || '').trim().toLowerCase();
    const tableKey = String(item.table_key || '').trim().toLowerCase();
    return itemType === 'produce' || tableKey === 'produce_market';
  };
  try {
    const itemsResp = await fetch('data/items.json');
    if (itemsResp.ok) {
      const itemsData = await itemsResp.json();
      if (itemsData && Array.isArray(itemsData.items)) {
        const normalizedItems = itemsData.items.map(normalizeItemType);
        defaultData.items = normalizedItems;
        defaultData.shop = normalizedItems
          .filter((item) => isProduceMarketItem(item))
          .map((item) => ({
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
    const decorationsResp = await fetch('data/decorations.json');
    if (decorationsResp.ok) {
      const decorationsData = await decorationsResp.json();
      if (decorationsData && Array.isArray(decorationsData.decorations)) {
        const normalizedDecorations = decorationsData.decorations.map((decoration) => ({ ...decoration }));
        const existingItems = Array.isArray(defaultData.items) ? defaultData.items : [];
        const itemIds = new Set(existingItems.map((item) => item?.id));
        normalizedDecorations
          .map(normalizeDecorationAsItem)
          .forEach((decorationItem) => {
            if (!decorationItem || !Object.prototype.hasOwnProperty.call(decorationItem, 'id')) return;
            if (itemIds.has(decorationItem.id)) return;
            existingItems.push(decorationItem);
            itemIds.add(decorationItem.id);
          });
        defaultData.items = existingItems;
      }
    }
  } catch (err) {
    console.error('Failed to load decorations.json', err);
  }
  try {
    const newsResp = await fetch('data/news.json');
    if (newsResp.ok) {
      const newsData = await newsResp.json();
      if (newsData && Array.isArray(newsData.news)) {
        defaultData.newsEvents = newsData.news;
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
        defaultData.goals = goalsData.goals;
      }
    }
  } catch (err) {
    console.error('Failed to load goals.json', err);
  }
  try {
    const messagesResp = await fetch('data/messages.json');
    if (messagesResp.ok) {
      const messagesData = await messagesResp.json();
      if (messagesData && Array.isArray(messagesData.messages)) {
        defaultData.messages = messagesData.messages;
      }
    }
  } catch (err) {
    console.error('Failed to load messages.json', err);
  }
}
