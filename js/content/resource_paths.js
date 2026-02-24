export function resolveResourcePath(assetPath) {
  if (typeof assetPath !== 'string') return '';
  const trimmedPath = assetPath.trim();
  if (!trimmedPath) return '';
  if (
    trimmedPath.startsWith('data:')
    || trimmedPath.startsWith('blob:')
    || trimmedPath.startsWith('http://')
    || trimmedPath.startsWith('https://')
    || trimmedPath.startsWith('resources/')
  ) {
    return trimmedPath;
  }
  return `resources/${trimmedPath.replace(/^\/+/, '')}`;
}

function mapLegacyProduceItemPath(assetPath, item) {
  if (typeof assetPath !== 'string') return assetPath;
  const trimmedPath = assetPath.trim();
  if (!/^items\/[^/]+\.png$/i.test(trimmedPath)) return assetPath;
  const itemType = String(item?.type || '').trim().toLowerCase();
  const looksLikeProduce = itemType === 'produce'
    || (!!item && (Array.isArray(item.plantStageImages) || Number(item.plantStages) > 0));
  if (!looksLikeProduce) return assetPath;
  return trimmedPath.replace(/^items\//i, 'items/produce/');
}

export function getCropBaseName(item) {
  if (!item) return '';
  const sourcePath = item.seedIconImage || item.harvestImage || item.seedImage || item.image || '';
  const fileName = sourcePath.split('/').pop() || '';
  const baseName = fileName.replace(/\.png$/i, '').replace(/_seeds$/i, '');
  return baseName;
}

export function getSeedImagePath(item) {
  return getSeedPacketBaseImagePath();
}

export function getSeedPacketBaseImagePath() {
  return resolveResourcePath('seeds/seeds.png');
}

export function getSeedOverlayIconPath(item) {
  if (!item) return '';
  const itemType = String(item.type || '').trim().toLowerCase();
  if (item.seedIconImage) return resolveResourcePath(item.seedIconImage);
  if (item.harvestImage) return resolveResourcePath(mapLegacyProduceItemPath(item.harvestImage, item));
  if (item.image) return resolveResourcePath(item.image);
  const baseName = getCropBaseName(item);
  if (!baseName) return '';
  if (itemType === 'produce') return resolveResourcePath(`items/produce/${baseName}.png`);
  return resolveResourcePath(`items/${baseName}.png`);
}

export function getPlantStageImagePath(item, stageIndex) {
  if (!item) return '';
  const safeStageIndex = Math.max(1, Number(stageIndex) || 1);
  if (Array.isArray(item.plantStageImages) && item.plantStageImages.length > 0) {
    const imageIndex = Math.min(item.plantStageImages.length - 1, safeStageIndex - 1);
    return resolveResourcePath(item.plantStageImages[imageIndex]);
  }
  if (typeof item.plantImageBase === 'string' && item.plantImageBase) {
    return resolveResourcePath(`${item.plantImageBase}${safeStageIndex}.png`);
  }
  if (item.plantStages && item.plantStages > 1) {
    const genericStageIndex = Math.min(6, safeStageIndex);
    return resolveResourcePath(`plants/plant${genericStageIndex}.png`);
  }
  return getSeedImagePath(item);
}

export function getHarvestImagePath(item) {
  if (!item) return '';
  const itemType = String(item.type || '').trim().toLowerCase();
  if (item.harvestImage) return resolveResourcePath(mapLegacyProduceItemPath(item.harvestImage, item));
  if (item.image) return resolveResourcePath(item.image);
  if (item.plantStages && item.plantStages > 1) {
    const baseName = getCropBaseName(item);
    if (baseName) {
      if (itemType === 'produce') return resolveResourcePath(`items/produce/${baseName}.png`);
      return resolveResourcePath(`items/${baseName}.png`);
    }
  }
  return getSeedImagePath(item);
}
