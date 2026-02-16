export function generateNewsEventsForState(deps) {
  const {
    state,
    defaultNewsEvents,
    isShopItemUnlocked,
    saveToStorage
  } = deps;
  const currentWeek = state.player.week;
  if (state.newsHistory[currentWeek] && state.newsHistory[currentWeek].length > 0) return;
  if (!Array.isArray(defaultNewsEvents)) return;

  const pool = defaultNewsEvents.slice();
  const eventsForWeek = [];
  const count = Math.min(3, pool.length);
  for (let i = 0; i < count; i += 1) {
    const templateIndex = Math.floor(Math.random() * pool.length);
    const baseEvent = pool.splice(templateIndex, 1)[0];
    let selectedItem = null;
    const unlockedItems = Array.isArray(state.items)
      ? state.items.filter((item) => item && isShopItemUnlocked(item.id))
      : [];
    if (unlockedItems.length > 0) {
      const itemIndex = Math.floor(Math.random() * unlockedItems.length);
      selectedItem = unlockedItems[itemIndex];
    }
    const itemName = selectedItem ? selectedItem.name : 'Unknown Item';
    const itemId = selectedItem ? selectedItem.id : null;
    const headline = baseEvent.headline ? baseEvent.headline.replace(/sku/gi, itemName) : '';
    const article = baseEvent.article ? baseEvent.article.replace(/sku/gi, itemName) : '';
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
  state.newsEvents.push(...eventsForWeek);
  state.newsHistory[currentWeek] = eventsForWeek;
  saveToStorage('newsEvents', state.newsEvents);
  saveToStorage('newsHistory', state.newsHistory);
}
