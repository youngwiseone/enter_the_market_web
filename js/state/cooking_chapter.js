import { STORY_REQUESTS, MEAL_REQUESTS, POT_GIFT_DIALOGUE, CHAPTER_PEOPLE } from '../content/cooking_chapter.js';
import { getSaleOriginFarm, isSaleCropPresent } from './crop_identity.js';
import { getPlantGrowthProgressWithFertiliser } from '../controllers/fertiliser_controller.js';

const day = state => Math.max(1, Math.floor(Number(state.player?.day) || 1));
const copy = value => JSON.parse(JSON.stringify(value));
const decorate = offer => ({ ...offer, name: offer.title, speaker: CHAPTER_PEOPLE[offer.person]?.name, portrait: CHAPTER_PEOPLE[offer.person]?.portrait, deadlineDays: offer.duration });
export function normalizeChapter(state) {
  state.player ||= {};
  const c = state.player.cookingChapter ||= {};
  c.stage = Math.min(4, Math.max(0, Math.floor(Number(c.stage) || 0)));
  for (const key of ['readyDay', 'cooldownDay', 'restaurantDay', 'cookedCount', 'completedRequests']) c[key] = Math.max(0, Math.floor(Number(c[key]) || 0));
  c.potUnlocked = !!c.potUnlocked;
  c.knownRecipes = Array.isArray(c.knownRecipes) ? c.knownRecipes.filter(id => [101, 102, 103].includes(id)) : [];
  if (!c.active || typeof c.active !== 'object' || !Array.isArray(c.active.requirements)) c.active = null;
  if (c.active) {
    c.active.delivered = c.active.delivered && typeof c.active.delivered === 'object' ? c.active.delivered : {};
    for (const r of c.active.requirements) c.active.delivered[r.itemId] = Math.min(r.quantity, Math.max(0, Math.floor(Number(c.active.delivered[r.itemId]) || 0)));
    c.active.deadlineDay = Number(c.active.deadlineDay ?? c.active.deadline) || day(state) + 24;
    c.active.deadline = c.active.deadlineDay;
  }
  if (c.active && day(state) > c.active.deadlineDay) {
    if (c.active.kind === 'restaurant') c.restaurantDay = day(state) + 8;
    c.lastOutcome = 'The visit ended. Your friend will return; earned story progress is safe.';
    c.active = null;
    c.cooldownDay = day(state) + 1;
  }
  return c;
}
export function getChapterOffers(state) {
  const c = normalizeChapter(state);
  if (c.active || day(state) < c.cooldownDay) return [];
  if (c.stage < 3) {
    if (c.stage === 0 && Number(state.player.playerLevel || 1) < 4) return [];
    if (c.stage === 2) {
      const reached = Number(state.player.cash) >= 25000 || state.goalsClaimed?.['cash-1000000-boost'] || state.goalFlags?.cash_millionaire;
      const unlocked = (state.items || []).filter(item => item.type === 'produce' && state.unlockedShopItems?.[item.id]).length;
      const grown = Object.values(state.goalStats?.itemsHarvested || {}).filter(n => Number(n) > 0).length;
      if (!reached || Math.max(unlocked, grown) < 8) return [];
    }
    return [decorate({ ...copy(STORY_REQUESTS[c.stage]), kind: 'story', reward: 0, duration: 24 })];
  }
  if (c.stage === 3) return day(state) >= c.readyDay ? [decorate({ id: 'mina-pot-gift', person: 'mina', kind: 'gift', title: 'Mina’s old pot', dialogue: POT_GIFT_DIALOGUE, requirements: [], reward: 0 })] : [];
  if (!c.cookedCount) return [];
  const offers = MEAL_REQUESTS.map(r => ({ ...copy(r), kind: 'meal', duration: 18, dialogue: r.dialogue[c.completedRequests % r.dialogue.length] }));
  if (day(state) >= c.restaurantDay) {
    const tiles = Object.values(state.farms || {}).reduce((sum, f) => sum + (f.gridUnlocked || []).filter(Boolean).length, 0) || (state.gridUnlocked || []).filter(Boolean).length;
    const quantity = tiles >= 60 ? 12 : tiles >= 35 ? 9 : 6;
    const requirements = [{ itemId: 5, quantity: Math.ceil(quantity / 2) }, { itemId: 2, quantity: Math.floor(quantity / 2) }];
    const base = requirements.reduce((sum, r) => sum + r.quantity * Number(state.items?.find(i => i.id === r.itemId)?.price || 0), 0);
    offers.push({ id: 'mina-restaurant', person: 'mina', kind: 'restaurant', title: 'Our farm on the menu', requirements, reward: Math.round(base * 1.25 * 100) / 100, duration: 24, dialogue: 'The restaurant needs a larger basket of potatoes and tomatoes. I still remember that first soup. This is a fixed offer; the market may pay more today.', completion: 'Our farm is on the menu again. Thank you for helping me get here!' });
  }
  return offers.map(decorate);
}
export function acceptRequest(state, id) {
  const c = normalizeChapter(state);
  if (c.active) return { ok: false, reason: 'Finish or decline your current request first.' };
  const offer = getChapterOffers(state).find(o => o.id === id && o.kind !== 'gift');
  if (!offer) return { ok: false, reason: 'That visit is not available.' };
  c.active = { ...copy(offer), acceptedDay: day(state), deadlineDay: day(state) + offer.duration, deadline: day(state) + offer.duration, delivered: {} };
  return { ok: true, request: c.active };
}
export function declineRequest(state) {
  const c = normalizeChapter(state);
  if (c.active?.kind === 'restaurant') c.restaurantDay = day(state) + 8;
  c.active = null;
  c.cooldownDay = day(state) + 1;
  return { ok: true, message: 'No problem. Earned story progress is safe; visitors can return.' };
}
export function claimPot(state) {
  const c = normalizeChapter(state);
  if (c.stage !== 3 || day(state) < c.readyDay) return { ok: false };
  c.stage = 4;
  c.potUnlocked = true;
  c.knownRecipes = [101, 102, 103];
  c.restaurantDay = day(state) + 8;
  state.unlockedTools ||= {};
  state.unlockedTools.pot = true;
  return { ok: true, message: POT_GIFT_DIALOGUE };
}
export function getDeliveryPreview(state, cells = []) {
  const c = normalizeChapter(state), request = c.active;
  const result = { ok: false, reason: '', request, eligibleCount: 0, selectedCount: cells.length, counts: {}, completes: false, complete: false };
  if (!request) return { ...result, reason: 'Accept a request first.' };
  if (!cells.length) return { ...result, reason: 'Select mature requested items to give.' };
  const seen = new Set();
  for (const cell of cells) {
    const key = `${cell.farmId}:${cell.instanceId}`;
    if (seen.has(key) || !isSaleCropPresent(state, cell) || Number(cell.farmId) !== Number(state.activeFarmId || 1)) return { ...result, reason: 'Selection changed. Select the items again.' };
    seen.add(key);
    const req = request.requirements.find(r => r.itemId === cell.itemId);
    const farm = getSaleOriginFarm(state, cell);
    const item = state.items?.find(i => i.id === cell.itemId) || cell.item;
    if (!item || (cell.itemId < 101 && !getPlantGrowthProgressWithFertiliser({ ...farm, player: state.player }, item, cell.cellIndex).isGrown)) return { ...result, reason: 'Only mature ingredients can be given.' };
    if (!req || (req.commonOnly && farm.gridRarity?.[cell.cellIndex] !== 'common')) return { ...result, reason: 'Remove unrelated items; this request needs only the listed ingredients.' };
    result.counts[cell.itemId] = (result.counts[cell.itemId] || 0) + 1;
    result.eligibleCount++;
    if (result.counts[cell.itemId] > req.quantity - Number(request.delivered[cell.itemId] || 0)) return { ...result, reason: 'Too many selected. Remove the extra items before giving.' };
  }
  result.completes = request.requirements.every(r => Number(request.delivered[r.itemId] || 0) + Number(result.counts[r.itemId] || 0) === r.quantity);
  result.complete = result.completes;
  return { ...result, ok: true, reason: result.completes ? `Complete request${request.reward ? `; receive $${request.reward.toFixed(2)}` : '; story gift, no cash'}.` : `Partial delivery; reward only when complete${request.reward ? ` ($${request.reward.toFixed(2)})` : ' (story gift)'}.` };
}
// Caller supplies mature-item snapshots from existing selection, then saves once.
// Settlement is synchronous: visual effects never determine delivery or payment.
export function settleDelivery(state, cells) {
  const preview = getDeliveryPreview(state, cells);
  if (!preview.ok || state.runtimeFlags?.isSellBatchInFlight || state.runtimeFlags?.isRestInProgress) return { ok: false, reason: preview.reason || 'Another action is finishing.' };
  const c = normalizeChapter(state), request = c.active;
  if (!cells.every(cell => isSaleCropPresent(state, cell))) return { ok: false, reason: 'Selection changed.' };
  for (const cell of cells) {
    const farm = getSaleOriginFarm(state, cell);
    for (const key of ['gridItems', 'gridPlantedDay', 'gridRarity', 'gridPurchasePrice', 'gridPlacedMeta']) if (Array.isArray(farm[key])) farm[key][cell.cellIndex] = null;
    if (Array.isArray(farm.gridWateredCount)) farm.gridWateredCount[cell.cellIndex] = 0;
    request.delivered[cell.itemId] = Number(request.delivered[cell.itemId] || 0) + 1;
  }
  let reward = 0;
  if (preview.completes) {
    reward = Math.max(0, Number(request.reward) || 0);
    state.player.cash = Number(state.player.cash || 0) + reward;
    c.completedRequests++;
    c.lastOutcome = request.completion;
    if (request.kind === 'story') {
      c.stage++;
      c.readyDay = day(state) + 1;
    }
    if (request.kind === 'restaurant') c.restaurantDay = day(state) + 8;
    c.cooldownDay = day(state) + 1;
    c.active = null;
  }
  return { ok: true, complete: preview.completes, reward, count: cells.length, requestId: request.id, message: preview.completes ? request.completion : 'Delivered. The remaining quantities are still needed; reward waits until completion.' };
}
