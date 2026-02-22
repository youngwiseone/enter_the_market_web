export function createFxController(deps) {
  const { resolveResourcePath, allocParticleFromState, releaseParticleToState } = deps;
  const fxImageCache = new Map();
  const fxState = {
    canvas: null,
    ctx: null,
    particles: [],
    pool: [],
    maxParticles: 240,
    running: false,
    lastTs: 0,
    reduceMotion: false
  };
  let lastMythicSparkleTs = 0;

  function initFxLayer() {
    if (fxState.canvas) return;
    const farmPanel = document.getElementById('farm-panel');
    if (!farmPanel) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'fx-canvas';
    farmPanel.appendChild(canvas);
    fxState.canvas = canvas;
    fxState.ctx = canvas.getContext('2d');
    resizeFxCanvas();
    fxState.running = true;
    fxState.lastTs = performance.now();
    requestAnimationFrame(fxTick);
  }

  function resizeFxCanvas() {
    if (!fxState.canvas || !fxState.ctx) return;
    const parent = fxState.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    fxState.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    fxState.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    fxState.canvas.style.width = `${rect.width}px`;
    fxState.canvas.style.height = `${rect.height}px`;
    fxState.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function setReduceMotion(enabled) {
    fxState.reduceMotion = !!enabled;
  }

  function isReduceMotion() {
    return fxState.reduceMotion;
  }

  function getFxImage(src) {
    if (!src) return null;
    const resolved = resolveResourcePath(src);
    if (fxImageCache.has(resolved)) return fxImageCache.get(resolved);
    const img = new Image();
    img.src = resolved;
    fxImageCache.set(resolved, img);
    return img;
  }

  function allocParticle() {
    return allocParticleFromState(fxState);
  }

  function releaseParticle(particle) {
    releaseParticleToState(fxState, particle);
  }

  function spawnBurst({ x, y, count, imgList, speedRange, sizeRange, gravity, lifeRange }) {
    if (fxState.reduceMotion) return;
    const images = (imgList || []).map(getFxImage).filter(Boolean);
    if (images.length === 0) return;
    const minSpeed = speedRange?.[0] ?? 30;
    const maxSpeed = speedRange?.[1] ?? 90;
    const minSize = sizeRange?.[0] ?? 6;
    const maxSize = sizeRange?.[1] ?? 16;
    const minLife = lifeRange?.[0] ?? 260;
    const maxLife = lifeRange?.[1] ?? 520;
    for (let i = 0; i < count; i += 1) {
      const particle = allocParticle();
      if (!particle) return;
      const angle = Math.random() * Math.PI * 2;
      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
      particle.type = 'image';
      particle.img = images[Math.floor(Math.random() * images.length)];
      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.gravity = gravity ?? 0;
      particle.life = 0;
      particle.maxLife = minLife + Math.random() * (maxLife - minLife);
      particle.size = minSize + Math.random() * (maxSize - minSize);
      particle.rotation = Math.random() * Math.PI * 2;
      particle.rotationSpeed = (Math.random() - 0.5) * 4;
      particle.active = true;
    }
  }

  function spawnRing({ x, y, radius, color, life }) {
    if (fxState.reduceMotion) return;
    const particle = allocParticle();
    if (!particle) return;
    particle.type = 'ring';
    particle.x = x;
    particle.y = y;
    particle.radius = radius ?? 14;
    particle.radiusEnd = (radius ?? 14) * 2.2;
    particle.color = color || 'rgba(255,255,255,0.8)';
    particle.life = 0;
    particle.maxLife = life ?? 220;
    particle.active = true;
  }

  function spawnCoinTravel(from, to, count) {
    if (fxState.reduceMotion) return;
    const imgList = [
      'resources/effects/coin_particle_01.png',
      'resources/effects/coin_particle_02.png'
    ];
    const images = imgList.map(getFxImage).filter(Boolean);
    if (images.length === 0) return;
    const total = Math.max(1, count || 4);
    for (let i = 0; i < total; i += 1) {
      const particle = allocParticle();
      if (!particle) return;
      particle.type = 'travel';
      particle.img = images[Math.floor(Math.random() * images.length)];
      particle.fromX = from.x;
      particle.fromY = from.y;
      particle.toX = to.x;
      particle.toY = to.y;
      particle.arc = -8 - Math.random() * 6;
      particle.life = 0;
      particle.maxLife = 360 + Math.random() * 120;
      particle.size = 10 + Math.random() * 8;
      particle.active = true;
    }
  }

  function spawnCoinTravelWithImage(from, to, count, imgPath) {
    if (fxState.reduceMotion) return;
    const image = getFxImage(imgPath);
    if (!image) return;
    const total = Math.max(1, count || 1);
    for (let i = 0; i < total; i += 1) {
      const particle = allocParticle();
      if (!particle) return;
      particle.type = 'travel';
      particle.img = image;
      particle.fromX = from.x;
      particle.fromY = from.y;
      particle.toX = to.x;
      particle.toY = to.y;
      particle.arc = -8 - Math.random() * 6;
      particle.life = 0;
      particle.maxLife = 360 + Math.random() * 120;
      particle.size = 10 + Math.random() * 8;
      particle.active = true;
    }
  }

  function spawnCoinsForSaleValue(amount, from, to) {
    if (fxState.reduceMotion) return;
    const rounded = Math.round((Number(amount) || 0) * 100) / 100;
    let dollars = Math.floor(rounded);
    let cents = Math.round((rounded - dollars) * 100);
    if (cents >= 100) {
      dollars += 1;
      cents = 0;
    }
    const hundreds = Math.floor(dollars / 100);
    const tens = dollars % 100;
    if (hundreds > 0) {
      spawnCoinTravelWithImage(from, to, hundreds, 'resources/effects/coin_particle_03.png');
    }
    if (tens > 0) {
      spawnCoinTravelWithImage(from, to, tens, 'resources/effects/coin_particle_02.png');
    }
    if (cents > 0) {
      spawnCoinTravelWithImage(from, to, cents, 'resources/effects/coin_particle_01.png');
    }
  }

  function isElementVisible(element) {
    if (!(element instanceof Element)) return false;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  function getSellActionButtonElement(preferredElement = null) {
    if (isElementVisible(preferredElement)) return preferredElement;
    const candidates = Array.from(document.querySelectorAll('[data-sell-action-button="true"]'));
    return candidates.find((element) => isElementVisible(element) && !element.disabled) || null;
  }

  function getGridCellVisual(element) {
    if (!(element instanceof Element)) return null;
    return element.querySelector('img:not(.grid-overlay)');
  }

  function getGridElement() {
    return document.getElementById('grid');
  }

  function getMarketTableElement() {
    return document.getElementById('market-table');
  }

  function rectFromElementCenter(element) {
    if (!(element instanceof Element)) return null;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return rect;
  }

  function applyImpactStrength(element, strength) {
    if (!(element instanceof Element)) return;
    const normalized = Math.max(0, Number(strength) || 0);
    const px = (2 + normalized * 1.8).toFixed(2);
    element.style.setProperty('--fx-impact-distance', `${px}px`);
  }

  function waitForMs(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function animateSingleSellItem(cellIndex, targetRect) {
    const cell = document.querySelector(`#grid .grid-cell[data-index="${cellIndex}"]`);
    if (!cell) return Promise.resolve(false);
    const cellRect = cell.getBoundingClientRect();
    const image = getGridCellVisual(cell);
    const sourcePath = image?.currentSrc || image?.src || '';
    const sprite = document.createElement(sourcePath ? 'img' : 'div');
    if (sourcePath) {
      sprite.src = sourcePath;
      sprite.alt = '';
    } else {
      sprite.style.background = 'rgba(255,255,255,0.8)';
      sprite.style.border = '1px solid rgba(0,0,0,0.25)';
      sprite.style.borderRadius = '4px';
    }
    const startX = cellRect.left + cellRect.width / 2;
    const startY = cellRect.top + cellRect.height / 2;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;
    const size = Math.max(32, Math.min(46, Math.round(Math.min(cellRect.width, cellRect.height) * 0.95)));
    Object.assign(sprite.style, {
      position: 'fixed',
      left: `${startX}px`,
      top: `${startY}px`,
      width: `${size}px`,
      height: `${size}px`,
      transform: 'translate(-50%, -50%) scale(1)',
      transformOrigin: 'center',
      opacity: '1',
      pointerEvents: 'none',
      zIndex: '9999',
      transition: 'transform 220ms cubic-bezier(0.2, 0.82, 0.24, 1), opacity 220ms ease-out'
    });
    document.body.appendChild(sprite);
    return new Promise((resolve) => {
      const finish = () => {
        sprite.remove();
        resolve(true);
      };
      window.requestAnimationFrame(() => {
        sprite.style.transform = `translate(-50%, -50%) translate(${Math.round(endX - startX)}px, ${Math.round(endY - startY)}px) scale(0.15)`;
        sprite.style.opacity = '0.2';
      });
      window.setTimeout(finish, 230);
    });
  }

  async function playSellItemsToButton(cellEntries, preferredButtonElement = null, options = null) {
    if (fxState.reduceMotion) return;
    if (!Array.isArray(cellEntries) || cellEntries.length === 0) return;
    const indices = cellEntries
      .map((entry) => Number(entry?.cellIndex))
      .filter((index) => Number.isInteger(index) && index >= 0)
      .sort((left, right) => left - right);
    if (!indices.length) return;
    const totalFromOptions = Number(options?.totalItems);
    const startIndexFromOptions = Number(options?.startIndex);
    const total = Number.isFinite(totalFromOptions) && totalFromOptions > 0
      ? Math.max(indices.length, Math.floor(totalFromOptions))
      : indices.length;
    const startIndex = Number.isFinite(startIndexFromOptions) && startIndexFromOptions >= 0
      ? Math.floor(startIndexFromOptions)
      : 0;
    const baseBatchStrength = Math.min(3.2, 0.8 + (total - 1) * 0.22);
    const staggerMs = 35;
    const grid = getGridElement();
    const marketTable = getMarketTableElement();
    for (let i = 0; i < indices.length; i += 1) {
      const sequenceIndex = startIndex + i;
      const progressiveStrength = Math.min(3.6, baseBatchStrength + sequenceIndex * 0.1);
      applyImpactStrength(grid, progressiveStrength * 0.75);
      applyImpactStrength(marketTable, progressiveStrength);
      if (grid) {
        triggerFxClass(grid, 'fx-grid-jiggle');
      }
      const button = getSellActionButtonElement(preferredButtonElement);
      const targetRect = button
        ? button.getBoundingClientRect()
        : rectFromElementCenter(marketTable);
      if (!targetRect) continue;
      if (targetRect.width <= 0 || targetRect.height <= 0) continue;
      // Sequential travel creates clear left-to-right harvest sell feedback.
      const didAnimate = await animateSingleSellItem(indices[i], targetRect);
      if (didAnimate) {
        if (button) {
          triggerFxClass(button, 'fx-pop');
        }
        if (marketTable) {
          triggerFxClass(marketTable, 'fx-shake-impact');
        }
      }
      if (i < indices.length - 1) {
        await waitForMs(staggerMs);
      }
    }
  }

  function fxTick(ts) {
    if (!fxState.running || !fxState.ctx) return;
    const dt = Math.min(64, ts - fxState.lastTs);
    fxState.lastTs = ts;
    const ctx = fxState.ctx;
    ctx.clearRect(0, 0, fxState.canvas.width, fxState.canvas.height);
    fxState.particles.forEach((particle) => {
      if (!particle.active) return;
      particle.life += dt;
      const t = Math.min(1, particle.life / particle.maxLife);
      if (t >= 1) {
        releaseParticle(particle);
        return;
      }
      if (particle.type === 'image') {
        particle.vy += (particle.gravity || 0) * (dt / 1000);
        particle.x += particle.vx * (dt / 1000);
        particle.y += particle.vy * (dt / 1000);
        particle.rotation += particle.rotationSpeed * (dt / 1000);
        ctx.save();
        ctx.globalAlpha = 1 - t;
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.drawImage(particle.img, -particle.size / 2, -particle.size / 2, particle.size, particle.size);
        ctx.restore();
      } else if (particle.type === 'ring') {
        const radius = particle.radius + (particle.radiusEnd - particle.radius) * t;
        ctx.save();
        ctx.globalAlpha = 1 - t;
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (particle.type === 'travel') {
        const ease = 1 - Math.pow(1 - t, 3);
        const x = particle.fromX + (particle.toX - particle.fromX) * ease;
        const y = particle.fromY + (particle.toY - particle.fromY) * ease + particle.arc * (1 - t);
        ctx.save();
        ctx.globalAlpha = 1 - t * 0.6;
        ctx.drawImage(particle.img, x - particle.size / 2, y - particle.size / 2, particle.size, particle.size);
        ctx.restore();
      }
    });
    maybeSpawnMythicSparkle(ts);
    requestAnimationFrame(fxTick);
  }

  function maybeSpawnMythicSparkle(ts) {
    if (fxState.reduceMotion) return;
    if (ts - lastMythicSparkleTs < 1200) return;
    const mythicCells = Array.from(document.querySelectorAll('#grid .grid-cell.rarity-mythic'));
    if (mythicCells.length === 0) return;
    if (Math.random() > 0.35) return;
    const target = mythicCells[Math.floor(Math.random() * mythicCells.length)];
    const center = getElementCenterInFarmPanel(target);
    if (!center) return;
    spawnBurst({
      x: center.x,
      y: center.y,
      count: 2 + Math.floor(Math.random() * 2),
      imgList: ['resources/effects/prism_sparkle_01.png', 'resources/effects/prism_sparkle_02.png'],
      speedRange: [10, 30],
      sizeRange: [8, 14],
      gravity: 0,
      lifeRange: [260, 420]
    });
    lastMythicSparkleTs = ts;
  }

  function triggerFxClass(element, className) {
    if (!element || !className) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    element.addEventListener('animationend', () => {
      element.classList.remove(className);
    }, { once: true });
  }

  function getTileCenter(index) {
    const grid = document.getElementById('grid');
    const farmPanel = document.getElementById('farm-panel');
    if (!grid || !farmPanel) return null;
    const cell = grid.children[index];
    if (!cell) return null;
    const cellRect = cell.getBoundingClientRect();
    const panelRect = farmPanel.getBoundingClientRect();
    return {
      x: cellRect.left - panelRect.left + cellRect.width / 2,
      y: cellRect.top - panelRect.top + cellRect.height / 2
    };
  }

  function getElementCenterInFarmPanel(element) {
    const farmPanel = document.getElementById('farm-panel');
    if (!element || !farmPanel) return null;
    const rect = element.getBoundingClientRect();
    const panelRect = farmPanel.getBoundingClientRect();
    return {
      x: rect.left - panelRect.left + rect.width / 2,
      y: rect.top - panelRect.top + rect.height / 2
    };
  }

  function getHudCenters() {
    const farmPanel = document.getElementById('farm-panel');
    if (!farmPanel) return [];
    const panelRect = farmPanel.getBoundingClientRect();
    return Array.from(document.querySelectorAll('#hud-cash, #hud-networth'))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          x: rect.left - panelRect.left + rect.width / 2,
          y: rect.top - panelRect.top + rect.height / 2,
          el: element
        };
      })
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  }

  function pulseHud(isGain) {
    const className = isGain ? 'fx-pulse-up' : 'fx-pulse-down';
    document.querySelectorAll('#hud-cash, #hud-networth').forEach((element) => {
      triggerFxClass(element, className);
    });
  }

  function spawnFloatingText({ x, y, text, color }) {
    if (fxState.reduceMotion) return;
    const panel = document.getElementById('farm-panel');
    if (!panel) return;
    const node = document.createElement('div');
    node.className = 'fx-floating-text fx-fade-up';
    node.textContent = text;
    if (color) node.style.color = color;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    panel.appendChild(node);
    node.addEventListener('animationend', () => node.remove(), { once: true });
  }

  function showXpGainFeedback(xpGain, center, delayMs = 0) {
    if (!center) return;
    const amount = Math.max(0, Math.floor(Number(xpGain) || 0));
    if (amount <= 0) return;
    const spawn = () => {
      spawnBurst({
        x: center.x,
        y: center.y - 4,
        count: 8,
        imgList: ['resources/effects/xp_01.png', 'resources/effects/xp_02.png'],
        speedRange: [20, 60],
        sizeRange: [8, 12],
        gravity: 12,
        lifeRange: [260, 520]
      });
      spawnFloatingText({
        x: center.x - 10,
        y: center.y - 24,
        text: `+${amount} XP`,
        color: '#7eff9d'
      });
    };
    if (delayMs > 0) {
      window.setTimeout(spawn, delayMs);
    } else {
      spawn();
    }
  }

  function playDayTransition() {
    if (fxState.reduceMotion) return;
    const panel = document.getElementById('farm-panel');
    if (!panel) return;
    const wipe = document.createElement('div');
    wipe.className = 'fx-day-wipe';
    panel.appendChild(wipe);
    triggerFxClass(panel, 'fx-panel-tint');
    wipe.addEventListener('animationend', () => wipe.remove(), { once: true });
  }

  return {
    initFxLayer,
    resizeFxCanvas,
    setReduceMotion,
    isReduceMotion,
    spawnBurst,
    spawnRing,
    spawnCoinTravel,
    spawnCoinsForSaleValue,
    playSellItemsToButton,
    triggerFxClass,
    getTileCenter,
    getHudCenters,
    pulseHud,
    spawnFloatingText,
    showXpGainFeedback,
    playDayTransition
  };
}
