// Typography Pairings for Profile Cards
// Each pairing includes name font and bio font

export const TYPOGRAPHY_STYLES = [
  {
    id: 'elegant',
    name: 'Elegant',
    emoji: '✨',
    description: 'Sophisticated serif with clean sans',
    nameFont: {
      family: 'Playfair Display',
      weight: '700',
      style: 'normal',
      googleFont: 'Playfair+Display:wght@700'
    },
    bioFont: {
      family: 'Inter',
      weight: '400',
      style: 'italic',
      googleFont: 'Inter:ital,wght@1,400'
    },
    nameSizeClass: 'text-4xl',
    bioSizeClass: 'text-base'
  },
  {
    id: 'playful',
    name: 'Playful',
    emoji: '🎨',
    description: 'Rounded display with friendly body',
    nameFont: {
      family: 'Fredoka One',
      weight: '400',
      style: 'normal',
      googleFont: 'Fredoka+One'
    },
    bioFont: {
      family: 'Quicksand',
      weight: '400',
      style: 'normal',
      googleFont: 'Quicksand:wght@400'
    },
    nameSizeClass: 'text-4xl',
    bioSizeClass: 'text-base'
  },
  {
    id: 'editorial',
    name: 'Editorial',
    emoji: '📰',
    description: 'Bold all caps with italic',
    nameFont: {
      family: 'Montserrat',
      weight: '800',
      style: 'normal',
      transform: 'uppercase',
      googleFont: 'Montserrat:wght@800'
    },
    bioFont: {
      family: 'Lora',
      weight: '400',
      style: 'italic',
      googleFont: 'Lora:ital,wght@1,400'
    },
    nameSizeClass: 'text-3xl tracking-wider',
    bioSizeClass: 'text-base'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    emoji: '🤍',
    description: 'Clean thin sans throughout',
    nameFont: {
      family: 'Poppins',
      weight: '300',
      style: 'normal',
      googleFont: 'Poppins:wght@300'
    },
    bioFont: {
      family: 'Poppins',
      weight: '400',
      style: 'normal',
      googleFont: 'Poppins:wght@400'
    },
    nameSizeClass: 'text-4xl',
    bioSizeClass: 'text-sm'
  },
  {
    id: 'bold',
    name: 'Bold',
    emoji: '💪',
    description: 'Extra thick name with standard body',
    nameFont: {
      family: 'Archivo Black',
      weight: '400',
      style: 'normal',
      googleFont: 'Archivo+Black'
    },
    bioFont: {
      family: 'Work Sans',
      weight: '400',
      style: 'normal',
      googleFont: 'Work+Sans:wght@400'
    },
    nameSizeClass: 'text-4xl',
    bioSizeClass: 'text-base'
  },
  {
    id: 'romantic',
    name: 'Romantic',
    emoji: '💕',
    description: 'Delicate script with soft serif',
    nameFont: {
      family: 'Dancing Script',
      weight: '700',
      style: 'normal',
      googleFont: 'Dancing+Script:wght@700'
    },
    bioFont: {
      family: 'Crimson Text',
      weight: '400',
      style: 'normal',
      googleFont: 'Crimson+Text:wght@400'
    },
    nameSizeClass: 'text-5xl',
    bioSizeClass: 'text-base'
  }
];

// Helper to load Google Fonts dynamically
export const loadGoogleFonts = (typography) => {
  const fonts = new Set();

  if (typography?.nameFont?.googleFont) {
    fonts.add(typography.nameFont.googleFont);
  }
  if (typography?.bioFont?.googleFont) {
    fonts.add(typography.bioFont.googleFont);
  }

  if (fonts.size === 0) return;

  const fontString = Array.from(fonts).join('&family=');
  const linkId = 'profile-custom-fonts';

  // Remove existing font link if present
  const existingLink = document.getElementById(linkId);
  if (existingLink) {
    existingLink.remove();
  }

  // Add new font link
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontString}&display=swap`;
  document.head.appendChild(link);
};

// Get typography style by ID
export const getTypographyById = (id) => {
  return TYPOGRAPHY_STYLES.find(style => style.id === id) || TYPOGRAPHY_STYLES[0];
};

// Generate CSS for name styling
export const getNameStyle = (typography) => {
  if (!typography) return {};

  return {
    fontFamily: typography.nameFont.family,
    fontWeight: typography.nameFont.weight,
    fontStyle: typography.nameFont.style,
    textTransform: typography.nameFont.transform || 'none'
  };
};

// Generate CSS for bio styling
export const getBioStyle = (typography) => {
  if (!typography) return {};

  return {
    fontFamily: typography.bioFont.family,
    fontWeight: typography.bioFont.weight,
    fontStyle: typography.bioFont.style
  };
};
