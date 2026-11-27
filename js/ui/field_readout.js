// Visual vocabulary only. Growth, moisture, and prices come from the game state.
export function getFieldCropState(growth, watered) {
  return growth.isGrown ? 'ready' : watered ? 'wet' : 'dry';
}

export function getFieldReadout(mode, { ready, wet, dry, open, refill = 0 }, alwaysShowInfo = false) {
  if (mode === 'plant') return open ? `${open} open to plant` : 'No open plots';
  if (mode === 'watering') {
    return [dry ? `${dry} need water` : null, refill ? `${refill} to refill` : null, wet ? `${wet} watered` : null]
      .filter(Boolean).join(' · ') || 'No crops to water';
  }
  if (mode === 'pickaxe') return 'Clear a grass plot';
  if (mode === 'pot') return 'Pick ripe ingredients';
  if (alwaysShowInfo) return 'Market prices on';
  return [ready ? `${ready} ready` : null, dry ? `${dry} need water` : null, wet ? `${wet} watered` : null].filter(Boolean).slice(0,2).join(' · ')
    || (open ? 'Open soil for seeds' : 'Clear grass to make room');
}
