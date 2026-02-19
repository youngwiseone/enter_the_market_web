export function createMessagesController(deps) {
  const {
    getMessageDayIndex,
    messageDefinitions,
    setChatProfile,
    showProfileMessageBubble,
    hideProfileMessageBubbleImmediately,
    toggleMessagesPanel,
    updateTabNotificationBadges,
    triggerFxClass,
    updateGridSize,
    isReduceMotion
  } = deps;

  const MESSAGE_LIMIT = 150;
  const TYPEWRITER_MIN_DURATION_MS = 180;
  const TYPEWRITER_MAX_DURATION_MS = 1400;
  const TYPEWRITER_MAX_STEP_MS = 42;
  const TYPEWRITER_MIN_STEP_MS = 12;
  const messageReplaceMap = new Map();
  const typingTimersByEntry = new WeakMap();
  const messageStatsById = new Map();
  const messageDebugStats = {
    emittedById: Object.create(null),
    suppressedById: Object.create(null),
    fallbackHits: 0,
    missingIdHits: Object.create(null),
    lastFallbackAt: 0
  };
  let messageJustEmitted = false;
  let latestMobileMessageText = '';
  const FALLBACK_MESSAGE_ID = 'system.fallback_forgot';
  const FALLBACK_MESSAGE_TEXT = 'I was gonna say something, but I forgot';
  const FALLBACK_WARN_INTERVAL_MS = 15000;
  const messageDefinitionsById = new Map();
  let activeMessageDefinitions = messageDefinitions;
  let lastFallbackWarnAt = 0;

  function incrementCounter(counterMap, key) {
    const safeKey = String(key || 'unknown');
    counterMap[safeKey] = Math.max(0, Number(counterMap[safeKey]) || 0) + 1;
  }

  function exposeDebugStats() {
    if (typeof window !== 'undefined') {
      window.__etmMessageStats = messageDebugStats;
    }
  }

  function snapshotDebugStats() {
    return {
      emittedById: { ...messageDebugStats.emittedById },
      suppressedById: { ...messageDebugStats.suppressedById },
      fallbackHits: messageDebugStats.fallbackHits,
      missingIdHits: { ...messageDebugStats.missingIdHits },
      lastFallbackAt: messageDebugStats.lastFallbackAt
    };
  }

  exposeDebugStats();

  function normalizeMessageDefinitions(raw) {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && Array.isArray(raw.messages)) return raw.messages;
    return [];
  }

  function buildMessageCatalog(rawDefinitions = activeMessageDefinitions) {
    messageDefinitionsById.clear();
    const defs = normalizeMessageDefinitions(rawDefinitions);
    defs.forEach((entry) => {
      if (!entry || typeof entry !== 'object') return;
      const id = String(entry.id || '').trim();
      if (!id) return;
      messageDefinitionsById.set(id, entry);
    });
  }

  buildMessageCatalog();

  function setMessageDefinitions(nextDefinitions) {
    activeMessageDefinitions = nextDefinitions;
    buildMessageCatalog(activeMessageDefinitions);
  }

  function syncSingleLineChatStrips(latestText = '') {
    const mobileLog = document.getElementById('mobile-chat-log');
    const desktopLog = document.getElementById('desktop-chat-log');
    const chatLog = document.getElementById('chat-log');
    if (!chatLog) return;
    if (latestText) {
      latestMobileMessageText = String(latestText);
    }
    const updateSingleLineLog = (container, rowClassName) => {
      if (!container) return;
      Array.from(container.children).forEach((child) => {
        if (child && child.nodeType === 1) {
          stopTypingAnimationForEntry(child);
        }
      });
      container.innerHTML = '';
      const entries = Array.from(chatLog.querySelectorAll('.chat-entry'));
      const mostRecentEntry = entries.length ? entries[entries.length - 1] : null;
      const singleLineText = latestMobileMessageText || (mostRecentEntry ? (mostRecentEntry.textContent || '') : '');
      if (!singleLineText) {
        container.textContent = '';
        return;
      }
      const row = document.createElement('div');
      row.className = rowClassName;
      container.appendChild(row);
      startTypingAnimationForElement(row, singleLineText);
    };
    updateSingleLineLog(mobileLog, 'mobile-chat-entry');
    updateSingleLineLog(desktopLog, 'desktop-chat-entry');
  }

  function getMessageDayPrefix(dayIndex) {
    const dowNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dowIndex = (dayIndex - 1) % 7;
    const dow = dowNames[dowIndex];
    return `DAY ${dayIndex} - ${dow}`;
  }

  function buildMessageEntryText(payload) {
    const dayIndex = Number(payload.dayIndex) || getMessageDayIndex();
    const now = new Date(Number(payload.timestamp) || Date.now());
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `[${getMessageDayPrefix(dayIndex)} ${timeString}] ${payload.text}`;
  }

  function isChatNearBottom() {
    const chatLog = document.getElementById('chat-log');
    if (!chatLog) return true;
    const threshold = 24;
    return (chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight) <= threshold;
  }

  function stopTypingAnimationForEntry(entry) {
    if (!entry) return;
    const timerId = typingTimersByEntry.get(entry);
    if (timerId) {
      window.clearInterval(timerId);
      typingTimersByEntry.delete(entry);
    }
    entry.classList.remove('typing');
  }

  function pruneChatLog() {
    const chatLog = document.getElementById('chat-log');
    if (!chatLog) return;
    while (chatLog.children.length > MESSAGE_LIMIT) {
      const first = chatLog.firstChild;
      if (first && first.nodeType === 1) {
        stopTypingAnimationForEntry(first);
      }
      chatLog.removeChild(chatLog.firstChild);
    }
    messageReplaceMap.forEach((entry, key) => {
      if (!entry || !entry.element || !chatLog.contains(entry.element)) {
        messageReplaceMap.delete(key);
      }
    });
  }

  function startTypingAnimationForEntry(entry, fullText, shouldFollowScroll) {
    if (!entry) return;
    const chatLog = document.getElementById('chat-log');
    startTypingAnimationForElement(entry, fullText, () => {
      if (shouldFollowScroll && chatLog) {
        chatLog.scrollTop = chatLog.scrollHeight;
      }
    });
  }

  function startTypingAnimationForElement(entry, fullText, onUpdate) {
    if (!entry) return;
    stopTypingAnimationForEntry(entry);
    const targetText = String(fullText ?? '');
    if (isReduceMotion() || targetText.length <= 1) {
      entry.textContent = targetText;
      if (typeof onUpdate === 'function') onUpdate();
      return;
    }

    const duration = Math.max(
      TYPEWRITER_MIN_DURATION_MS,
      Math.min(TYPEWRITER_MAX_DURATION_MS, targetText.length * 16)
    );
    const stepMs = Math.max(
      TYPEWRITER_MIN_STEP_MS,
      Math.min(TYPEWRITER_MAX_STEP_MS, Math.round(duration / targetText.length))
    );

    let currentIndex = 0;
    entry.classList.add('typing');
    entry.textContent = '';
    const timerId = window.setInterval(() => {
      currentIndex += 1;
      if (currentIndex >= targetText.length) {
        entry.textContent = targetText;
        if (typeof onUpdate === 'function') onUpdate();
        stopTypingAnimationForEntry(entry);
        return;
      }
      entry.textContent = targetText.slice(0, currentIndex);
      if (typeof onUpdate === 'function') onUpdate();
    }, stepMs);
    typingTimersByEntry.set(entry, timerId);
  }

  function emitMessage(payload) {
    const chatLog = document.getElementById('chat-log');
    if (!chatLog) return null;
    const normalized = {
      text: String(payload?.text ?? '').trim(),
      speaker: payload?.speaker || 'player',
      emotion: payload?.emotion || 'neutral',
      priority: payload?.priority || 'normal',
      category: payload?.category || 'system',
      timestamp: Number(payload?.timestamp) || Date.now(),
      dayIndex: Number(payload?.dayIndex) || getMessageDayIndex(),
      replaceKey: payload?.replaceKey || '',
      replaceScope: payload?.replaceScope || 'day',
      messageId: payload?.messageId || ''
    };
    if (!normalized.text) return null;

    const wasNearBottom = isChatNearBottom();
    setChatProfile(normalized.speaker, normalized.emotion);
    const isMobileLayout = !!(document.body && document.body.classList.contains('mobile-layout'));
    if (isMobileLayout) {
      showProfileMessageBubble(normalized.text);
    } else {
      hideProfileMessageBubbleImmediately();
    }
    messageJustEmitted = true;

    let scopedReplaceKey = '';
    if (normalized.replaceKey) {
      scopedReplaceKey = normalized.replaceScope === 'global'
        ? normalized.replaceKey
        : `${normalized.replaceKey}:day:${normalized.dayIndex}`;
    }
    const existingReplaceEntry = scopedReplaceKey ? messageReplaceMap.get(scopedReplaceKey) : null;
    let entry = existingReplaceEntry && existingReplaceEntry.element ? existingReplaceEntry.element : null;
    const wasReplace = !!entry;

    if (entry) {
      entry.dataset.ts = String(normalized.timestamp);
      entry.textContent = buildMessageEntryText(normalized);
      stopTypingAnimationForEntry(entry);
    } else {
      entry = document.createElement('div');
      entry.className = 'chat-entry';
      const fullEntryText = buildMessageEntryText(normalized);
      startTypingAnimationForEntry(entry, fullEntryText, wasNearBottom);
      chatLog.appendChild(entry);
      if (scopedReplaceKey) {
        messageReplaceMap.set(scopedReplaceKey, { element: entry });
      }
    }

    entry.dataset.priority = normalized.priority;
    entry.dataset.category = normalized.category;
    entry.dataset.replaceKey = scopedReplaceKey;
    if (normalized.messageId) {
      entry.dataset.messageId = normalized.messageId;
    } else {
      delete entry.dataset.messageId;
    }
    if (wasReplace) {
      triggerFxClass(entry, 'fx-pulse-up');
    }
    pruneChatLog();
    if (wasNearBottom) {
      chatLog.scrollTop = chatLog.scrollHeight;
    }
    syncSingleLineChatStrips(normalized.text);
    updateGridSize();
    return entry;
  }

  function formatTemplate(template, vars) {
    const source = String(template ?? '');
    const safeVars = vars && typeof vars === 'object' ? vars : {};
    return source.replace(/\{([a-zA-Z0-9_]+)\}/g, (full, key) => {
      if (!(key in safeVars) || safeVars[key] === undefined || safeVars[key] === null) {
        return full;
      }
      return String(safeVars[key]);
    });
  }

  function getMessageDefinitionById(messageId) {
    const id = String(messageId || '').trim();
    if (!id) return null;
    return messageDefinitionsById.get(id) || null;
  }

  function canEmitMessageByDefinition(messageId, definition, dayIndex) {
    if (!messageId || !definition || typeof definition !== 'object') return true;
    const cooldownMs = Math.max(0, Number(definition.cooldownMs) || 0);
    const maxPerDay = Math.max(0, Number(definition.maxPerDay) || 0);
    if (cooldownMs <= 0 && maxPerDay <= 0) return true;
    const now = Date.now();
    const stats = messageStatsById.get(messageId) || {
      lastTs: 0,
      dayCounts: Object.create(null)
    };
    if (cooldownMs > 0 && (now - stats.lastTs) < cooldownMs) {
      return false;
    }
    if (maxPerDay > 0) {
      const countForDay = Math.max(0, Number(stats.dayCounts[dayIndex]) || 0);
      if (countForDay >= maxPerDay) {
        return false;
      }
    }
    return true;
  }

  function markMessageEmission(messageId, dayIndex) {
    if (!messageId) return;
    const now = Date.now();
    const stats = messageStatsById.get(messageId) || {
      lastTs: 0,
      dayCounts: Object.create(null)
    };
    stats.lastTs = now;
    stats.dayCounts[dayIndex] = Math.max(0, Number(stats.dayCounts[dayIndex]) || 0) + 1;
    const keys = Object.keys(stats.dayCounts);
    if (keys.length > 12) {
      const sorted = keys.map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => b - a)
        .slice(0, 12);
      const keep = new Set(sorted.map((value) => String(value)));
      Object.keys(stats.dayCounts).forEach((key) => {
        if (!keep.has(key)) {
          delete stats.dayCounts[key];
        }
      });
    }
    messageStatsById.set(messageId, stats);
  }

  function emitMessageById(messageId, vars, overrides) {
    const metadata = overrides && typeof overrides === 'object' ? overrides : {};
    const definition = getMessageDefinitionById(messageId);
    const resolvedFallbackDefinition = getMessageDefinitionById(FALLBACK_MESSAGE_ID);
    const fallbackDefinition = resolvedFallbackDefinition || {
      id: FALLBACK_MESSAGE_ID,
      speaker: 'farmer',
      emotion: 'neutral',
      priority: 'low',
      category: 'system',
      template: FALLBACK_MESSAGE_TEXT
    };
    const usingFallback = !definition;
    const activeDefinition = usingFallback ? fallbackDefinition : definition;
    const dayIndex = Number(metadata.dayIndex) || getMessageDayIndex();
    const activeMessageId = usingFallback ? FALLBACK_MESSAGE_ID : String(messageId || '').trim();

    if (!canEmitMessageByDefinition(activeMessageId, activeDefinition, dayIndex)) {
      incrementCounter(messageDebugStats.suppressedById, activeMessageId);
      exposeDebugStats();
      return null;
    }
    if (usingFallback) {
      messageDebugStats.fallbackHits += 1;
      messageDebugStats.lastFallbackAt = Date.now();
      const requestedId = String(messageId || '').trim();
      if (requestedId && requestedId !== FALLBACK_MESSAGE_ID) {
        incrementCounter(messageDebugStats.missingIdHits, requestedId);
        const elapsedSinceLastWarn = Date.now() - lastFallbackWarnAt;
        if (elapsedSinceLastWarn >= FALLBACK_WARN_INTERVAL_MS) {
          console.warn(`Message catalog fallback used for unknown id: ${requestedId}`);
          lastFallbackWarnAt = Date.now();
        }
      }
      exposeDebugStats();
    }

    const text = formatTemplate(
      activeDefinition.template || FALLBACK_MESSAGE_TEXT,
      vars && typeof vars === 'object' ? vars : {}
    ).trim() || FALLBACK_MESSAGE_TEXT;

    const emitted = emitMessage({
      text,
      speaker: metadata.speaker || activeDefinition.speaker || 'player',
      emotion: metadata.emotion || activeDefinition.emotion || 'neutral',
      priority: metadata.priority || activeDefinition.priority || 'normal',
      category: metadata.category || activeDefinition.category || activeDefinition.type || 'system',
      replaceKey: metadata.replaceKey || activeDefinition.replaceKey || '',
      replaceScope: metadata.replaceScope || activeDefinition.replaceScope || 'day',
      dayIndex,
      messageId: activeMessageId
    });
    if (emitted) {
      markMessageEmission(activeMessageId, dayIndex);
      incrementCounter(messageDebugStats.emittedById, activeMessageId);
      exposeDebugStats();
    }
    return emitted;
  }

  function initialiseMessageUI() {
    const profile = document.getElementById('chat-profile');
    if (profile) {
      profile.style.cursor = 'pointer';
      profile.addEventListener('click', () => toggleMessagesPanel());
    }
    document.addEventListener('pointerdown', () => {
      hideProfileMessageBubbleImmediately();
    });
    const closeButton = document.getElementById('messages-history-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => toggleMessagesPanel());
    }
    syncSingleLineChatStrips();
    updateTabNotificationBadges();
  }

  function addMessage(payload) {
    if (!payload || typeof payload !== 'object') {
      return emitMessageById(FALLBACK_MESSAGE_ID);
    }
    return emitMessageById(payload.id, payload.vars, payload.meta || {});
  }

  function addMessageById(messageId, vars, meta) {
    return emitMessageById(messageId, vars, meta);
  }

  function setMessageJustEmitted(value) {
    messageJustEmitted = !!value;
  }

  return {
    initialiseMessageUI,
    addMessage,
    addMessageById,
    setMessageJustEmitted,
    setMessageDefinitions,
    getMessageDebugStats: snapshotDebugStats
  };
}
