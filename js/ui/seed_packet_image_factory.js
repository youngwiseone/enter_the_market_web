import { getSeedOverlayIconPath, getSeedPacketBaseImagePath } from '../content/resource_paths.js';

function createImageLoader() {
  const cache = new Map();
  return function loadImage(src) {
    if (!src) return Promise.resolve(null);
    if (cache.has(src)) return cache.get(src);
    const promise = new Promise((resolve) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
    cache.set(src, promise);
    return promise;
  };
}

export function createSeedPacketImageFactory(options = {}) {
  const onComposedImageReady = typeof options.onComposedImageReady === 'function'
    ? options.onComposedImageReady
    : () => {};
  const loadImage = createImageLoader();
  const composedByKey = new Map();
  const inflightByKey = new Map();
  const warnedItems = new Set();
  let readyNotificationFrameId = 0;

  function notifyComposedImageReady() {
    if (readyNotificationFrameId) return;
    readyNotificationFrameId = window.requestAnimationFrame(() => {
      readyNotificationFrameId = 0;
      onComposedImageReady();
    });
  }

  function warnMissingIcon(warnKey, warnLabel) {
    if (!warnKey || warnedItems.has(warnKey)) return;
    warnedItems.add(warnKey);
    console.warn(`[seed-packet] Missing icon for ${warnLabel || warnKey}. Rendering base packet only.`);
  }

  function getCacheKey(basePacketPath, iconPath, targetSize) {
    const sizeKey = Number.isFinite(targetSize) ? String(targetSize) : 'native';
    return `${basePacketPath}::${iconPath}::${sizeKey}`;
  }

  async function composeImage(basePacketPath, iconPath, options = {}) {
    const targetSize = Number.isFinite(options.targetSize) ? Math.max(1, Math.round(options.targetSize)) : null;
    const cacheKey = getCacheKey(basePacketPath, iconPath, targetSize);
    if (composedByKey.has(cacheKey)) return composedByKey.get(cacheKey);
    if (inflightByKey.has(cacheKey)) return inflightByKey.get(cacheKey);
    const composePromise = (async () => {
      const [baseImage, iconImage] = await Promise.all([
        loadImage(basePacketPath),
        loadImage(iconPath)
      ]);
      if (!baseImage) return basePacketPath;
      if (!iconImage) {
        warnMissingIcon(options.warnKey, options.warnLabel);
        return basePacketPath;
      }
      const canvas = document.createElement('canvas');
      const baseWidth = baseImage.naturalWidth || baseImage.width;
      const baseHeight = baseImage.naturalHeight || baseImage.height;
      const canvasSize = targetSize || Math.max(baseWidth, baseHeight);
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      if (!canvas.width || !canvas.height) return basePacketPath;
      const context = canvas.getContext('2d');
      if (!context) return basePacketPath;
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      const iconWidth = Math.max(1, Math.round((iconImage.naturalWidth || iconImage.width) * 0.5));
      const iconHeight = Math.max(1, Math.round((iconImage.naturalHeight || iconImage.height) * 0.5));
      const drawX = Math.round((canvas.width - iconWidth) / 2);
      const drawY = Math.round((canvas.height - iconHeight) / 2);
      context.drawImage(iconImage, drawX, drawY, iconWidth, iconHeight);
      const composedDataUrl = canvas.toDataURL('image/png');
      composedByKey.set(cacheKey, composedDataUrl);
      notifyComposedImageReady();
      return composedDataUrl;
    })();
    inflightByKey.set(cacheKey, composePromise);
    const finalPath = await composePromise;
    inflightByKey.delete(cacheKey);
    if (!composedByKey.has(cacheKey) && finalPath) {
      composedByKey.set(cacheKey, finalPath);
    }
    return finalPath;
  }

  function getSeedVisualPath(item) {
    const basePacketPath = getSeedPacketBaseImagePath();
    const iconPath = getSeedOverlayIconPath(item);
    const warnKey = item && Number.isFinite(item.id) ? String(item.id) : (item?.name || iconPath || 'unknown-item');
    const warnLabel = item?.name || `Item ${warnKey}`;
    if (!iconPath) {
      warnMissingIcon(warnKey, warnLabel);
      return basePacketPath;
    }
    const cacheKey = getCacheKey(basePacketPath, iconPath, null);
    if (composedByKey.has(cacheKey)) return composedByKey.get(cacheKey);
    void composeImage(basePacketPath, iconPath, { warnKey, warnLabel });
    return basePacketPath;
  }

  function getCursorSeedVisualPath(item) {
    const iconPath = getSeedOverlayIconPath(item);
    const warnKey = item && Number.isFinite(item.id) ? `cursor-${item.id}` : (item?.name || 'cursor-unknown-item');
    const warnLabel = item?.name || `Item ${warnKey}`;
    if (!iconPath) {
      warnMissingIcon(warnKey, warnLabel);
      return '';
    }
    const cursorSize = 40;
    const iconMaxCoverage = 0.95;
    const minIconScale = 2;
    const cacheKey = getCacheKey('cursor-icon', iconPath, cursorSize);
    if (composedByKey.has(cacheKey)) return composedByKey.get(cacheKey);
    if (inflightByKey.has(cacheKey)) return iconPath;
    const composePromise = (async () => {
      const iconImage = await loadImage(iconPath);
      if (!iconImage) {
        warnMissingIcon(warnKey, warnLabel);
        return '';
      }
      const canvas = document.createElement('canvas');
      canvas.width = cursorSize;
      canvas.height = cursorSize;
      const context = canvas.getContext('2d');
      if (!context) return '';
      context.imageSmoothingEnabled = false;
      const sourceWidth = Math.max(1, iconImage.naturalWidth || iconImage.width);
      const sourceHeight = Math.max(1, iconImage.naturalHeight || iconImage.height);
      const maxTargetSize = Math.max(1, Math.floor(cursorSize * iconMaxCoverage));
      const baseLongestSide = Math.max(sourceWidth, sourceHeight);
      const requestedScaleSize = Math.round(baseLongestSide * minIconScale);
      const targetLongestSide = Math.min(maxTargetSize, requestedScaleSize);
      const fitScale = targetLongestSide / baseLongestSide;
      const iconWidth = Math.max(1, Math.round(sourceWidth * fitScale));
      const iconHeight = Math.max(1, Math.round(sourceHeight * fitScale));
      const drawX = Math.round((canvas.width - iconWidth) / 2);
      const drawY = Math.round((canvas.height - iconHeight) / 2);
      context.drawImage(iconImage, drawX, drawY, iconWidth, iconHeight);
      const cursorDataUrl = canvas.toDataURL('image/png');
      composedByKey.set(cacheKey, cursorDataUrl);
      notifyComposedImageReady();
      return cursorDataUrl;
    })();
    inflightByKey.set(cacheKey, composePromise);
    void composePromise.then((finalPath) => {
      inflightByKey.delete(cacheKey);
      if (!composedByKey.has(cacheKey) && finalPath) {
        composedByKey.set(cacheKey, finalPath);
      }
    });
    return iconPath;
  }

  function getSeedPacketUnlockImages(item) {
    return {
      seedPacketImageSrc: getSeedPacketBaseImagePath(),
      seedOverlayIconImageSrc: getSeedOverlayIconPath(item)
    };
  }

  return {
    getSeedVisualPath,
    getCursorSeedVisualPath,
    getSeedPacketUnlockImages
  };
}
