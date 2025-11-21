// Decorative Elements (Stickers, Accents) for Profile Cards
// SVG-based for crisp rendering and small file size

export const DECORATIVE_ELEMENTS = {
  // Sparkles & Stars
  sparkles: [
    {
      id: 'sparkle-1',
      name: 'Sparkle',
      category: 'sparkles',
      emoji: '✨',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l1.5 7.5L21 9l-7.5 1.5L12 18l-1.5-7.5L3 9l7.5-1.5L12 0z"/></svg>',
      defaultSize: 24
    },
    {
      id: 'star-1',
      name: 'Star',
      category: 'sparkles',
      emoji: '⭐',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
      defaultSize: 24
    }
  ],

  // Hearts
  hearts: [
    {
      id: 'heart-1',
      name: 'Heart',
      category: 'hearts',
      emoji: '💕',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
      defaultSize: 20
    },
    {
      id: 'heart-outline',
      name: 'Heart Outline',
      category: 'hearts',
      emoji: '🤍',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
      defaultSize: 20
    }
  ],

  // Plants
  plants: [
    {
      id: 'leaf-1',
      name: 'Leaf',
      category: 'plants',
      emoji: '🌿',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.66-1.89C8 17 11 9 17 8zm-3.84 6.25c-.66 1.13-1.52 2.26-2.62 3.36-.13.13-.27.26-.41.38l1.72 1.72c.35-.31.69-.62 1.02-.95 1.53-1.53 2.69-3.11 3.52-4.72L13.16 14.25z"/></svg>',
      defaultSize: 28
    },
    {
      id: 'flower-1',
      name: 'Flower',
      category: 'plants',
      emoji: '🌸',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg>',
      defaultSize: 28
    }
  ],

  // Coffee
  coffee: [
    {
      id: 'coffee-cup',
      name: 'Coffee Cup',
      category: 'coffee',
      emoji: '☕',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 21h18v-2H2v2zM20 8h-2V5h2m0-2h-4v7H4V3H2v2h2v5.54C4 12.27 5.73 14 7.44 14h8.12c1.71 0 3.44-1.73 3.44-3.46V8h1c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/></svg>',
      defaultSize: 28
    }
  ],

  // Books
  books: [
    {
      id: 'book-1',
      name: 'Book',
      category: 'books',
      emoji: '📚',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>',
      defaultSize: 28
    }
  ],

  // Travel
  travel: [
    {
      id: 'plane',
      name: 'Airplane',
      category: 'travel',
      emoji: '✈️',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>',
      defaultSize: 28
    },
    {
      id: 'compass',
      name: 'Compass',
      category: 'travel',
      emoji: '🧭',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm1-13h-2v6l5.25 3.15.75-1.23-4-2.42z"/></svg>',
      defaultSize: 28
    }
  ],

  // Moon & Stars
  celestial: [
    {
      id: 'moon',
      name: 'Moon',
      category: 'celestial',
      emoji: '🌙',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 2c-1.05 0-2.05.16-3 .46 4.06 1.27 7 5.06 7 9.54 0 4.48-2.94 8.27-7 9.54.95.3 1.95.46 3 .46 5.52 0 10-4.48 10-10S14.52 2 9 2z"/></svg>',
      defaultSize: 28
    }
  ],

  // Butterflies
  butterflies: [
    {
      id: 'butterfly',
      name: 'Butterfly',
      category: 'butterflies',
      emoji: '🦋',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C10.89 2 10 2.89 10 4v2.54c-.41.14-.82.29-1.22.46-.67-1.16-1.69-2.06-2.91-2.52C4.89 3.91 3.77 4.15 3 5c-.77.85-.73 2 .13 2.83.67.65 1.59.95 2.47.93 1.07 2.72 3.38 4.24 6.4 4.24 3.02 0 5.33-1.52 6.4-4.24.88.02 1.8-.28 2.47-.93.86-.83.9-1.98.13-2.83-.77-.85-1.89-1.09-2.87-.52-1.22.46-2.24 1.36-2.91 2.52-.4-.17-.81-.32-1.22-.46V4c0-1.11-.89-2-2-2zm0 8c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/></svg>',
      defaultSize: 32
    }
  ],

  // Fashion
  fashion: [
    {
      id: 'lipstick',
      name: 'Lipstick',
      category: 'fashion',
      emoji: '💄',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9 9h6l-3-7zm-2 9v11h4V11h-4z"/></svg>',
      defaultSize: 24
    }
  ],

  // Clouds
  clouds: [
    {
      id: 'cloud',
      name: 'Cloud',
      category: 'clouds',
      emoji: '☁️',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>',
      defaultSize: 32
    }
  ]
};

// Get all elements as flat array
export const getAllDecorativeElements = () => {
  return Object.values(DECORATIVE_ELEMENTS).flat();
};

// Get elements by category
export const getElementsByCategory = (category) => {
  return DECORATIVE_ELEMENTS[category] || [];
};

// Get suggested elements based on background theme
export const getSuggestedElements = (backgroundCategory) => {
  const suggestions = {
    plantMom: ['plants', 'sparkles'],
    beauty: ['hearts', 'fashion', 'sparkles'],
    equestrian: ['hearts', 'sparkles'],
    coffee: ['coffee', 'hearts'],
    wellness: ['sparkles', 'hearts'],
    bookworm: ['books', 'sparkles'],
    travel: ['travel', 'sparkles'],
    mystical: ['celestial', 'sparkles'],
    fashion: ['fashion', 'hearts', 'sparkles'],
    creative: ['sparkles', 'hearts'],
    beach: ['sparkles', 'hearts'],
    cottagecore: ['plants', 'butterflies', 'hearts'],
    cityGirl: ['sparkles', 'hearts'],
    cozy: ['hearts', 'clouds'],
    whimsical: ['butterflies', 'sparkles', 'hearts', 'clouds'],
    luxe: ['sparkles', 'hearts']
  };

  const categories = suggestions[backgroundCategory] || ['sparkles', 'hearts'];
  return categories.flatMap(cat => getElementsByCategory(cat));
};
