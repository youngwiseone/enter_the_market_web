export const PROFILE_IMAGES = {
  player: {
    neutral: 'resources/profiles/player.png',
    excited: 'resources/profiles/player_excited.png',
    mining: 'resources/profiles/player_mining.png',
    watering: 'resources/profiles/player_watering.png',
    tired: 'resources/profiles/player_tired.png',
    wrong: 'resources/profiles/player_wrong.png',
    money: 'resources/profiles/player_money.png',
    goal_unlocked: 'resources/profiles/player_goal_unlocked.png',
    level_up: 'resources/profiles/player_level_up.png'
  },
  farmer: {
    neutral: 'resources/profiles/farmer_chad.png',
    excited: 'resources/profiles/farmer_chad.png',
    watering: 'resources/profiles/farmer_chad.png',
    produce: 'resources/profiles/farmer_chad_produce.png'
  },
  merchant: {
    neutral: 'resources/profiles/merchant.png',
    excited: 'resources/profiles/merchant.png'
  }
};

const PROFILE_BUBBLE_HIDE_MS = 3000;
const OUT_OF_ENERGY_TEXT_MATCHERS = ['not enough energy', 'low energy'];

export function createProfileChatController() {
  let profileBubbleHideTimerId = null;
  let profileShakeTimerId = null;
  let activeSpeaker = 'player';
  let activeEmotion = 'neutral';

  function getProfileImage(speaker, emotion) {
    const speakerMap = PROFILE_IMAGES[speaker] || PROFILE_IMAGES.player;
    return speakerMap[emotion] || speakerMap.neutral || PROFILE_IMAGES.player.neutral;
  }

  function setChatProfile(speaker, emotion) {
    const profile = document.getElementById('chat-profile');
    if (!profile) return;
    const nextSpeaker = speaker || 'player';
    const nextEmotion = emotion || 'neutral';
    const nextImage = getProfileImage(nextSpeaker, nextEmotion);
    const didImageChange = activeSpeaker !== nextSpeaker || activeEmotion !== nextEmotion;

    activeSpeaker = nextSpeaker;
    activeEmotion = nextEmotion;

    profile.src = nextImage;
    profile.alt = `${nextSpeaker} ${nextEmotion}`;

    if (!didImageChange) return;

    profile.classList.remove('profile-avatar-shake');
    void profile.offsetWidth;
    profile.classList.add('profile-avatar-shake');

    if (profileShakeTimerId) {
      window.clearTimeout(profileShakeTimerId);
      profileShakeTimerId = null;
    }
    profileShakeTimerId = window.setTimeout(() => {
      profile.classList.remove('profile-avatar-shake');
      profileShakeTimerId = null;
    }, 320);
  }

  function isOutOfEnergyMessage(text) {
    const lowered = String(text || '').toLowerCase();
    return OUT_OF_ENERGY_TEXT_MATCHERS.some((entry) => lowered.includes(entry));
  }

  function renderBubbleContent(bubble, text) {
    bubble.textContent = '';
    bubble.classList.remove('is-tired-popup');

    if (!(activeEmotion === 'tired' && isOutOfEnergyMessage(text))) {
      bubble.textContent = text;
      return;
    }

    bubble.classList.add('is-tired-popup');

    const image = document.createElement('img');
    image.className = 'profile-message-bubble-tired-image';
    image.src = getProfileImage(activeSpeaker, 'tired');
    image.alt = `${activeSpeaker} tired`;

    const caption = document.createElement('div');
    caption.className = 'profile-message-bubble-tired-text';
    caption.textContent = text;

    bubble.appendChild(image);
    bubble.appendChild(caption);
  }

  function showProfileMessageBubble(text) {
    const bubble = document.getElementById('profile-message-bubble');
    if (!bubble) return;
    const value = String(text || '').trim();
    if (!value) return;
    renderBubbleContent(bubble, value);
    bubble.classList.remove('is-hidden');
    if (profileBubbleHideTimerId) {
      window.clearTimeout(profileBubbleHideTimerId);
      profileBubbleHideTimerId = null;
    }
    profileBubbleHideTimerId = window.setTimeout(() => {
      bubble.classList.add('is-hidden');
      profileBubbleHideTimerId = null;
    }, PROFILE_BUBBLE_HIDE_MS);
  }

  function hideProfileMessageBubbleImmediately() {
    const bubble = document.getElementById('profile-message-bubble');
    if (!bubble) return;
    bubble.classList.add('is-hidden');
    if (profileBubbleHideTimerId) {
      window.clearTimeout(profileBubbleHideTimerId);
      profileBubbleHideTimerId = null;
    }
  }

  return {
    getProfileImage,
    setChatProfile,
    showProfileMessageBubble,
    hideProfileMessageBubbleImmediately
  };
}
