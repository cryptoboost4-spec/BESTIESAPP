// Vibe Presets - Complete one-tap profile looks
// Combines layout, background, typography, photo effects, and decorative elements

export const VIBE_PRESETS = [
  {
    id: 'clean-girl',
    name: 'Clean Girl',
    emoji: '🤍',
    description: 'Minimal, elegant, sophisticated',
    layout: 'minimal',
    background: 'pearl-elegance',
    typography: 'minimal',
    photoShape: 'circle',
    photoBorder: 'none',
    photoEffect: 'normal',
    decorativeElements: [],
    popularWith: ['beauty', 'wellness']
  },
  {
    id: 'that-girl',
    name: 'That Girl',
    emoji: '✨',
    description: 'Morning wellness vibes',
    layout: 'classic',
    background: 'pilates-princess',
    typography: 'elegant',
    photoShape: 'circle',
    photoBorder: 'classic',
    photoEffect: 'normal',
    decorativeElements: [{ id: 'sparkle-1', x: 10, y: 10, size: 24, color: '#D4AF37' }],
    popularWith: ['wellness', 'cozy']
  },
  {
    id: 'cottage-core',
    name: 'Cottage Core',
    emoji: '🌸',
    description: 'Soft, romantic, countryside',
    layout: 'scrapbook',
    background: 'wildflower-meadow',
    typography: 'romantic',
    photoShape: 'rounded',
    photoBorder: 'scalloped',
    photoEffect: 'vintage',
    decorativeElements: [
      { id: 'flower-1', x: 15, y: 15, size: 28, color: '#FFB6C1' },
      { id: 'butterfly', x: 85, y: 20, size: 32, color: '#E6D5F5' }
    ],
    popularWith: ['cottagecore', 'plantMom']
  },
  {
    id: 'main-character',
    name: 'Main Character',
    emoji: '💫',
    description: 'Bold, editorial, confident',
    layout: 'magazine',
    background: 'parisian-pink',
    typography: 'editorial',
    photoShape: 'square',
    photoBorder: 'none',
    photoEffect: 'normal',
    decorativeElements: [
      { id: 'star-1', x: 90, y: 10, size: 24, color: '#D4AF37' }
    ],
    popularWith: ['fashion', 'cityGirl']
  },
  {
    id: 'soft-life',
    name: 'Soft Life',
    emoji: '🌙',
    description: 'Dreamy, peaceful, pastel',
    layout: 'classic',
    background: 'cloud-nine',
    typography: 'romantic',
    photoShape: 'circle',
    photoBorder: 'classic',
    photoEffect: 'soft-focus',
    decorativeElements: [
      { id: 'cloud', x: 10, y: 80, size: 32, color: '#B0E0E6', opacity: 0.5 },
      { id: 'sparkle-1', x: 85, y: 85, size: 20, color: '#FFB6C1' }
    ],
    popularWith: ['whimsical', 'cozy']
  },
  {
    id: 'baddie',
    name: 'Baddie',
    emoji: '😎',
    description: 'Confident, sleek, bold',
    layout: 'split',
    background: 'black-gold',
    typography: 'bold',
    photoShape: 'square',
    photoBorder: 'metallic',
    photoEffect: 'normal',
    decorativeElements: [
      { id: 'sparkle-1', x: 50, y: 50, size: 28, color: '#D4AF37' }
    ],
    popularWith: ['luxe', 'cityGirl']
  },
  {
    id: 'bookworm',
    name: 'Bookworm',
    emoji: '📚',
    description: 'Cozy, literary, thoughtful',
    layout: 'classic',
    background: 'golden-library',
    typography: 'elegant',
    photoShape: 'rounded',
    photoBorder: 'classic',
    photoEffect: 'vintage',
    decorativeElements: [
      { id: 'book-1', x: 10, y: 85, size: 28, color: '#D4AF37' }
    ],
    popularWith: ['bookworm', 'cozy']
  },
  {
    id: 'wanderlust',
    name: 'Wanderlust',
    emoji: '✈️',
    description: 'Adventurous, free-spirited',
    layout: 'polaroid',
    background: 'wanderlust',
    typography: 'playful',
    photoShape: 'rounded',
    photoBorder: 'classic',
    photoEffect: 'normal',
    decorativeElements: [
      { id: 'plane', x: 15, y: 15, size: 28, color: '#4ECDC4' },
      { id: 'compass', x: 85, y: 15, size: 28, color: '#FF6B6B' }
    ],
    popularWith: ['travel', 'beach']
  },
  {
    id: 'plant-mom',
    name: 'Plant Mom',
    emoji: '🌿',
    description: 'Earthy, natural, green',
    layout: 'bento',
    background: 'monstera-dream',
    typography: 'minimal',
    photoShape: 'rounded',
    photoBorder: 'none',
    photoEffect: 'normal',
    decorativeElements: [
      { id: 'leaf-1', x: 10, y: 10, size: 28, color: '#4A7C59' },
      { id: 'leaf-1', x: 90, y: 85, size: 28, color: '#8B9D83' }
    ],
    popularWith: ['plantMom', 'wellness']
  },
  {
    id: 'coffee-addict',
    name: 'Coffee Addict',
    emoji: '☕',
    description: 'Cozy cafe vibes',
    layout: 'classic',
    background: 'latte-love',
    typography: 'playful',
    photoShape: 'circle',
    photoBorder: 'classic',
    photoEffect: 'normal',
    decorativeElements: [
      { id: 'coffee-cup', x: 85, y: 15, size: 28, color: '#6F4E37' }
    ],
    popularWith: ['coffee', 'cozy']
  },
  {
    id: 'mystical',
    name: 'Mystical',
    emoji: '🔮',
    description: 'Celestial, spiritual, magic',
    layout: 'story',
    background: 'cosmic-connection',
    typography: 'romantic',
    photoShape: 'circle',
    photoBorder: 'none',
    photoEffect: 'normal',
    decorativeElements: [
      { id: 'moon', x: 10, y: 10, size: 28, color: '#C0C0C0' },
      { id: 'star-1', x: 85, y: 15, size: 20, color: '#D4AF37' },
      { id: 'sparkle-1', x: 15, y: 85, size: 20, color: '#FFFFFF' }
    ],
    popularWith: ['mystical', 'whimsical']
  },
  {
    id: 'beach-babe',
    name: 'Beach Babe',
    emoji: '🌊',
    description: 'Coastal, summery, breezy',
    layout: 'classic',
    background: 'malibu-sunset',
    typography: 'playful',
    photoShape: 'circle',
    photoBorder: 'classic',
    photoEffect: 'normal',
    decorativeElements: [
      { id: 'sparkle-1', x: 20, y: 20, size: 24, color: '#FFD700' }
    ],
    popularWith: ['beach', 'travel']
  }
];

// Get preset by ID
export const getPresetById = (id) => {
  return VIBE_PRESETS.find(preset => preset.id === id);
};

// Get presets by background category
export const getPresetsByCategory = (category) => {
  return VIBE_PRESETS.filter(preset => preset.popularWith.includes(category));
};

// Get random preset
export const getRandomPreset = () => {
  return VIBE_PRESETS[Math.floor(Math.random() * VIBE_PRESETS.length)];
};
