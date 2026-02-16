import { clone } from '../core/storage.js';

export function normalizeGoalStateShape(state, defaultGoals) {
  if (!state.goalFlags || typeof state.goalFlags !== 'object') {
    state.goalFlags = {};
  }
  if (!state.goalsClaimed || typeof state.goalsClaimed !== 'object' || Array.isArray(state.goalsClaimed)) {
    state.goalsClaimed = {};
  }
  if (!Array.isArray(state.goals)) {
    state.goals = clone(defaultGoals);
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
}
