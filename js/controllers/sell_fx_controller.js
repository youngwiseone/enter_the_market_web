export function emitSellFxAction(deps) {
  const {
    center,
    rarityRaw,
    saleValue,
    xpGain,
    spawnBurst,
    spawnRing,
    spawnFloatingText,
    showXpGainFeedback
  } = deps;

  if (!center) return;
  const rarity = String(rarityRaw || 'common');
  const isRare = rarity === 'rare';
  const isMythic = rarity === 'mythic';
  const sparkleList = isMythic
    ? ['resources/effects/prism_sparkle_01.png', 'resources/effects/prism_sparkle_02.png']
    : ['resources/effects/sparkle_gold_01.png', 'resources/effects/sparkle_gold_02.png'];

  if (typeof spawnBurst === 'function') {
    spawnBurst({
      x: center.x,
      y: center.y - 6,
      count: isMythic ? 14 : (isRare ? 10 : 7),
      imgList: sparkleList,
      speedRange: [20, 62],
      sizeRange: [8, 13],
      gravity: 10,
      lifeRange: [220, 420]
    });
  }

  if ((isRare || isMythic) && typeof spawnRing === 'function') {
    spawnRing({
      x: center.x,
      y: center.y,
      radius: 9,
      color: isMythic ? 'rgba(198,180,255,0.8)' : 'rgba(255,213,100,0.8)',
      life: 180
    });
  }

  if (typeof spawnFloatingText === 'function') {
    spawnFloatingText({
      x: center.x - 12,
      y: center.y - 18,
      text: `+$${Number(saleValue || 0).toFixed(2)}`,
      color: isMythic ? '#c6b4ff' : '#ffe680'
    });
  }

  if (typeof showXpGainFeedback === 'function') {
    showXpGainFeedback(xpGain, center, 120);
  }
}
