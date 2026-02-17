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
    neutral: 'resources/profiles/farmer.png',
    excited: 'resources/profiles/farmer.png'
  },
  merchant: {
    neutral: 'resources/profiles/merchant.png',
    excited: 'resources/profiles/merchant.png'
  }
};

const PROFILE_BUBBLE_HIDE_MS = 3000;

export function createProfileChatController() {
  let profileBubbleHideTimerId = null;

  function getProfileImage(speaker, emotion) {
    const speakerMap = PROFILE_IMAGES[speaker] || PROFILE_IMAGES.player;
    return speakerMap[emotion] || speakerMap.neutral || PROFILE_IMAGES.player.neutral;
  }

  function setChatProfile(speaker, emotion) {
    const profile = document.getElementById('chat-profile');
    if (!profile) return;
    profile.src = getProfileImage(speaker, emotion);
    profile.alt = `${speaker} ${emotion}`;
  }

  function showProfileMessageBubble(text) {
    const bubble = document.getElementById('profile-message-bubble');
    if (!bubble) return;
    const value = String(text || '').trim();
    if (!value) return;
    bubble.textContent = value;
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
