export function createMessagesController(deps) {
  const {
    getMessageDayIndex,
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
  let messageJustEmitted = false;

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
    stopTypingAnimationForEntry(entry);
    const targetText = String(fullText ?? '');
    const chatLog = document.getElementById('chat-log');
    if (isReduceMotion() || targetText.length <= 1) {
      entry.textContent = targetText;
      if (shouldFollowScroll && chatLog) {
        chatLog.scrollTop = chatLog.scrollHeight;
      }
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
        if (shouldFollowScroll && chatLog) {
          chatLog.scrollTop = chatLog.scrollHeight;
        }
        stopTypingAnimationForEntry(entry);
        return;
      }
      entry.textContent = targetText.slice(0, currentIndex);
      if (shouldFollowScroll && chatLog) {
        chatLog.scrollTop = chatLog.scrollHeight;
      }
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
      replaceKey: payload?.replaceKey || ''
    };
    if (!normalized.text) return null;

    const wasNearBottom = isChatNearBottom();
    setChatProfile(normalized.speaker, normalized.emotion);
    showProfileMessageBubble(normalized.text);
    messageJustEmitted = true;

    let scopedReplaceKey = '';
    if (normalized.replaceKey) {
      scopedReplaceKey = `${normalized.replaceKey}:day:${normalized.dayIndex}`;
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
    if (wasReplace) {
      triggerFxClass(entry, 'fx-pulse-up');
    }
    pruneChatLog();
    if (wasNearBottom) {
      chatLog.scrollTop = chatLog.scrollHeight;
    }
    updateGridSize();
    return entry;
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
    updateTabNotificationBadges();
  }

  function addMessage(text, meta) {
    const metadata = meta && typeof meta === 'object' ? meta : {};
    emitMessage({
      text,
      speaker: metadata.speaker || 'player',
      emotion: metadata.emotion || 'neutral',
      priority: metadata.priority || 'normal',
      category: metadata.category || 'system',
      replaceKey: metadata.replaceKey || '',
      dayIndex: metadata.dayIndex
    });
  }

  function setMessageJustEmitted(value) {
    messageJustEmitted = !!value;
  }

  return {
    initialiseMessageUI,
    addMessage,
    setMessageJustEmitted
  };
}
