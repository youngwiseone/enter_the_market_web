/**
 * Shared storage helpers for browser state persistence.
 * Kept side-effect free so they can be reused across modules.
 */

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function loadFromStorage(key, defaultValue) {
  const value = localStorage.getItem(key);
  if (value === null) return defaultValue;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error(`Failed to parse localStorage key ${key}`, error);
    return defaultValue;
  }
}

export function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save localStorage key ${key}`, error);
  }
}
