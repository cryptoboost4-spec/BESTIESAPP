// Special Effects for Profile Cards with CSS Animations
// These are animated overlay effects that work with any background/layout/typography combination

export const SPECIAL_EFFECTS = [
  {
    id: 'none',
    name: 'None',
    emoji: '🚫',
    description: 'Clean, no effects',
    cssClass: ''
  },
  {
    id: 'sparkles',
    name: 'Sparkles',
    emoji: '✨',
    description: 'Magical twinkling sparkles',
    cssClass: 'effect-sparkles'
  },
  {
    id: 'hearts',
    name: 'Hearts',
    emoji: '💕',
    description: 'Floating hearts animation',
    cssClass: 'effect-hearts'
  },
  {
    id: 'confetti',
    name: 'Confetti',
    emoji: '🎉',
    description: 'Falling party confetti',
    cssClass: 'effect-confetti'
  },
  {
    id: 'neon',
    name: 'Neon Glow',
    emoji: '🌟',
    description: 'Pulsing neon glow effect',
    cssClass: 'effect-neon'
  },
  {
    id: 'birthday',
    name: 'Birthday',
    emoji: '🎂',
    description: 'Birthday celebration vibes',
    cssClass: 'effect-birthday'
  },
  {
    id: 'dreamy',
    name: 'Dreamy',
    emoji: '🌙',
    description: 'Soft floating stars',
    cssClass: 'effect-dreamy'
  },
  {
    id: 'bold',
    name: 'Bold',
    emoji: '🔥',
    description: 'Strong power pulses',
    cssClass: 'effect-bold'
  },
  {
    id: 'soft',
    name: 'Soft',
    emoji: '🌸',
    description: 'Gentle floral float',
    cssClass: 'effect-soft'
  }
];

// Get special effect by ID
export const getSpecialEffectById = (id) => {
  return SPECIAL_EFFECTS.find(effect => effect.id === id) || SPECIAL_EFFECTS[0];
};
