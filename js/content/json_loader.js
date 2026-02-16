/**
 * Load JSON content files into fallback default data.
 * Mutates the provided defaults object in place to preserve current behavior.
 */
export async function loadJSONDataIntoDefaults(defaultData) {
  try {
    const itemsResp = await fetch('data/items.json');
    if (itemsResp.ok) {
      const itemsData = await itemsResp.json();
      if (itemsData && Array.isArray(itemsData.items)) {
        defaultData.items = itemsData.items;
        defaultData.shop = itemsData.items.map((item) => ({
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
}
