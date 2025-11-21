// Special Effects for Profile Cards
// These are overlay effects that work with any background/layout/typography combination

export const SPECIAL_EFFECTS = [
  {
    id: 'none',
    name: 'None',
    emoji: '🚫',
    description: 'Clean, no effects',
    decorativeElements: []
  },
  {
    id: 'sparkles',
    name: 'Sparkles',
    emoji: '✨',
    description: 'Magical sparkle effect',
    decorativeElements: [
      { x: 15, y: 15, size: 20, color: '#FFD700', opacity: 0.8, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l1.5 8.5L22 12l-8.5 1.5L12 22l-1.5-8.5L2 12l8.5-1.5z"/></svg>' },
      { x: 85, y: 20, size: 16, color: '#FFF', opacity: 0.9, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l1.5 8.5L22 12l-8.5 1.5L12 22l-1.5-8.5L2 12l8.5-1.5z"/></svg>' },
      { x: 10, y: 70, size: 14, color: '#FFE4B5', opacity: 0.7, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l1.5 8.5L22 12l-8.5 1.5L12 22l-1.5-8.5L2 12l8.5-1.5z"/></svg>' },
      { x: 90, y: 80, size: 18, color: '#FFFF00', opacity: 0.8, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l1.5 8.5L22 12l-8.5 1.5L12 22l-1.5-8.5L2 12l8.5-1.5z"/></svg>' },
      { x: 50, y: 10, size: 12, color: '#FFF', opacity: 0.6, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l1.5 8.5L22 12l-8.5 1.5L12 22l-1.5-8.5L2 12l8.5-1.5z"/></svg>' },
      { x: 75, y: 50, size: 16, color: '#FFD700', opacity: 0.7, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l1.5 8.5L22 12l-8.5 1.5L12 22l-1.5-8.5L2 12l8.5-1.5z"/></svg>' }
    ]
  },
  {
    id: 'hearts',
    name: 'Hearts',
    emoji: '💕',
    description: 'Floating hearts',
    decorativeElements: [
      { x: 20, y: 25, size: 24, color: '#FF69B4', opacity: 0.7, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' },
      { x: 80, y: 30, size: 20, color: '#FFB6C1', opacity: 0.8, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' },
      { x: 15, y: 75, size: 18, color: '#FF1493', opacity: 0.6, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' },
      { x: 85, y: 70, size: 22, color: '#FF69B4', opacity: 0.75, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' }
    ]
  },
  {
    id: 'confetti',
    name: 'Confetti',
    emoji: '🎉',
    description: 'Party confetti pieces',
    decorativeElements: [
      { x: 10, y: 15, size: 12, color: '#FF6B6B', opacity: 0.8, svg: '<svg viewBox="0 0 10 10" fill="currentColor"><rect width="10" height="10" rx="2"/></svg>' },
      { x: 25, y: 35, size: 14, color: '#4ECDC4', opacity: 0.9, svg: '<svg viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="5"/></svg>' },
      { x: 70, y: 20, size: 10, color: '#FFE66D', opacity: 0.85, svg: '<svg viewBox="0 0 10 10" fill="currentColor"><rect width="10" height="10" rx="2"/></svg>' },
      { x: 85, y: 45, size: 16, color: '#FF6B6B', opacity: 0.7, svg: '<svg viewBox="0 0 10 10" fill="currentColor"><polygon points="5,0 6,3 10,4 7,7 8,10 5,8 2,10 3,7 0,4 4,3"/></svg>' },
      { x: 15, y: 65, size: 12, color: '#95E1D3', opacity: 0.8, svg: '<svg viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="5"/></svg>' },
      { x: 60, y: 75, size: 14, color: '#F38181', opacity: 0.75, svg: '<svg viewBox="0 0 10 10" fill="currentColor"><rect width="10" height="10" rx="2"/></svg>' },
      { x: 90, y: 85, size: 10, color: '#AA96DA', opacity: 0.8, svg: '<svg viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="5"/></svg>' },
      { x: 40, y: 25, size: 12, color: '#FCBAD3', opacity: 0.9, svg: '<svg viewBox="0 0 10 10" fill="currentColor"><rect width="10" height="10" rx="2"/></svg>' }
    ]
  },
  {
    id: 'neon',
    name: 'Neon Glow',
    emoji: '🌟',
    description: 'Glowing neon effect',
    glowEffect: true,
    decorativeElements: [
      { x: 50, y: 50, size: 200, color: '#FF00FF', opacity: 0.15, svg: '<svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" fill="url(#neonGlow)"/><defs><radialGradient id="neonGlow"><stop offset="0%" stop-color="currentColor" stop-opacity="0.3"/><stop offset="100%" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs></svg>' },
      { x: 20, y: 30, size: 150, color: '#00FFFF', opacity: 0.1, svg: '<svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" fill="url(#neonGlow2)"/><defs><radialGradient id="neonGlow2"><stop offset="0%" stop-color="currentColor" stop-opacity="0.3"/><stop offset="100%" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs></svg>' }
    ]
  },
  {
    id: 'birthday',
    name: 'Birthday',
    emoji: '🎂',
    description: 'Birthday celebration',
    decorativeElements: [
      { x: 15, y: 20, size: 20, color: '#FFD700', opacity: 0.8, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 23V11h10v12M12 8a2 2 0 0 0 2-2c0-1.11-.89-2-2-2a2 2 0 0 0-2 2c0 1.11.89 2 2 2M5 11h14v2H5v-2z"/></svg>' },
      { x: 85, y: 25, size: 18, color: '#FF69B4', opacity: 0.7, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l1.5 8.5L22 12l-8.5 1.5L12 22l-1.5-8.5L2 12l8.5-1.5z"/></svg>' },
      { x: 10, y: 70, size: 16, color: '#4ECDC4', opacity: 0.85, svg: '<svg viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="5"/></svg>' },
      { x: 90, y: 75, size: 16, color: '#FFE66D', opacity: 0.8, svg: '<svg viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="5"/></svg>' },
      { x: 50, y: 15, size: 22, color: '#FF6B6B', opacity: 0.75, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' }
    ]
  },
  {
    id: 'dreamy',
    name: 'Dreamy',
    emoji: '🌙',
    description: 'Soft dreamy stars',
    decorativeElements: [
      { x: 20, y: 15, size: 20, color: '#E0BBE4', opacity: 0.6, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' },
      { x: 80, y: 25, size: 16, color: '#D4A5A5', opacity: 0.5, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' },
      { x: 15, y: 75, size: 18, color: '#C7CEEA', opacity: 0.55, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' },
      { x: 85, y: 70, size: 14, color: '#B5EAD7', opacity: 0.6, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' },
      { x: 50, y: 40, size: 24, color: '#FFDFD3', opacity: 0.4, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5" opacity="0.3"/></svg>' }
    ]
  },
  {
    id: 'bold',
    name: 'Bold',
    emoji: '🔥',
    description: 'Strong bold accents',
    decorativeElements: [
      { x: 10, y: 10, size: 30, color: '#FF4500', opacity: 0.7, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15,10 23,10 17,15 19,23 12,18 5,23 7,15 1,10 9,10"/></svg>' },
      { x: 90, y: 20, size: 26, color: '#FF6347', opacity: 0.8, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15,10 23,10 17,15 19,23 12,18 5,23 7,15 1,10 9,10"/></svg>' },
      { x: 15, y: 85, size: 28, color: '#DC143C', opacity: 0.75, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15,10 23,10 17,15 19,23 12,18 5,23 7,15 1,10 9,10"/></svg>' },
      { x: 85, y: 90, size: 24, color: '#FF1493', opacity: 0.7, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15,10 23,10 17,15 19,23 12,18 5,23 7,15 1,10 9,10"/></svg>' }
    ]
  },
  {
    id: 'soft',
    name: 'Soft',
    emoji: '🌸',
    description: 'Gentle floral touches',
    decorativeElements: [
      { x: 25, y: 20, size: 28, color: '#FFB7C5', opacity: 0.5, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="7" r="3"/><circle cx="7" cy="12" r="3"/><circle cx="17" cy="12" r="3"/><circle cx="12" cy="17" r="3"/><circle cx="12" cy="12" r="2"/></svg>' },
      { x: 75, y: 30, size: 24, color: '#E0BBE4', opacity: 0.45, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="7" r="3"/><circle cx="7" cy="12" r="3"/><circle cx="17" cy="12" r="3"/><circle cx="12" cy="17" r="3"/><circle cx="12" cy="12" r="2"/></svg>' },
      { x: 20, y: 75, size: 26, color: '#FFDFD3', opacity: 0.5, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="7" r="3"/><circle cx="7" cy="12" r="3"/><circle cx="17" cy="12" r="3"/><circle cx="12" cy="17" r="3"/><circle cx="12" cy="12" r="2"/></svg>' },
      { x: 80, y: 80, size: 22, color: '#F7CAC9', opacity: 0.55, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="7" r="3"/><circle cx="7" cy="12" r="3"/><circle cx="17" cy="12" r="3"/><circle cx="12" cy="17" r="3"/><circle cx="12" cy="12" r="2"/></svg>' }
    ]
  }
];

// Get special effect by ID
export const getSpecialEffectById = (id) => {
  return SPECIAL_EFFECTS.find(effect => effect.id === id) || SPECIAL_EFFECTS[0];
};
