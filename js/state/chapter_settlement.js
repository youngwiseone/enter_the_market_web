// Existing saves use multiple keys. This journal makes chapter grid + reward
// changes recoverable if a tab closes or a write fails between those keys.
export const CHAPTER_JOURNAL_KEY = 'etm.chapterSettlement.v1';
const FIELDS = ['player', 'farms', 'unlockedTools', 'unlockedShopItems', 'shop', 'inventory', 'store', 'freePurchasesByItem', 'dayEnergySpent', 'dayActionCount', 'goalStats', 'goalFlags', 'goalsClaimed'];
function snapshot(state) {
  const value = Object.fromEntries(FIELDS.map(key => [key, state[key]]));
  value.activeFarmId = state.activeFarmId || 1;
  return JSON.parse(JSON.stringify(value));
}
export function recoverChapterSettlement(storage) {
  const raw = storage.getItem(CHAPTER_JOURNAL_KEY);
  if (!raw) return false;
  let value;
  try { value = JSON.parse(raw); } catch { return false; }
  if (!value?.player || !value?.farms || !value?.activeFarmId) return false;
  for (const [key, data] of Object.entries(value)) storage.setItem(key, JSON.stringify(data));
  const primary = value.farms[1];
  if (primary) for (const [key, data] of Object.entries(primary)) storage.setItem(key, JSON.stringify(data));
  storage.removeItem(CHAPTER_JOURNAL_KEY);
  return true;
}
export function createChapterCommit({ state, storage, saveState, rebind }) {
  return mutation => {
    const before = snapshot(state);
    try {
      mutation();
      // Active arrays alias the source farm; preserve that relationship in journal.
      const value = snapshot(state);
      storage.setItem(CHAPTER_JOURNAL_KEY, JSON.stringify(value));
    } catch (error) {
      Object.assign(state, before);
      rebind(state.activeFarmId);
      throw error;
    }
    saveState();
    // Keep a journal when the existing forgiving storage helper reports failure.
    if (storage.getItem('player') === JSON.stringify(state.player)
      && storage.getItem('farms') === JSON.stringify(state.farms)) storage.removeItem(CHAPTER_JOURNAL_KEY);
  };
}
