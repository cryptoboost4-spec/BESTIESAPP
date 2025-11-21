// Export all layout components
import ClassicLayout from './ClassicLayout';
import MagazineLayout from './MagazineLayout';
import PolaroidLayout from './PolaroidLayout';
import SplitScreenLayout from './SplitScreenLayout';
import StoryLayout from './StoryLayout';
import BentoLayout from './BentoLayout';
import MinimalLayout from './MinimalLayout';
import ScrapbookLayout from './ScrapbookLayout';

export const LAYOUTS = {
  classic: ClassicLayout,
  magazine: MagazineLayout,
  polaroid: PolaroidLayout,
  split: SplitScreenLayout,
  story: StoryLayout,
  bento: BentoLayout,
  minimal: MinimalLayout,
  scrapbook: ScrapbookLayout
};

export const LAYOUT_OPTIONS = [
  {
    id: 'classic',
    name: 'Classic',
    emoji: '✨',
    description: 'Traditional, easy to read',
    component: ClassicLayout,
    preview: 'Center-aligned with prominent photo'
  },
  {
    id: 'magazine',
    name: 'Magazine',
    emoji: '📰',
    description: 'Editorial, sophisticated',
    component: MagazineLayout,
    preview: 'Magazine cover style layout'
  },
  {
    id: 'polaroid',
    name: 'Polaroid',
    emoji: '📸',
    description: 'Nostalgic, scrapbook vibes',
    component: PolaroidLayout,
    preview: 'Instant camera style cards'
  },
  {
    id: 'split',
    name: 'Split Screen',
    emoji: '◐',
    description: 'Modern, balanced',
    component: SplitScreenLayout,
    preview: 'Split layout with photo and info'
  },
  {
    id: 'story',
    name: 'Story',
    emoji: '📱',
    description: 'Instagram Story style',
    component: StoryLayout,
    preview: 'Full-bleed vertical format'
  },
  {
    id: 'bento',
    name: 'Bento Grid',
    emoji: '📦',
    description: 'Widget-style, organized',
    component: BentoLayout,
    preview: 'Modular grid system'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    emoji: '🤍',
    description: 'Clean, zen, sophisticated',
    component: MinimalLayout,
    preview: 'Maximum whitespace and elegance'
  },
  {
    id: 'scrapbook',
    name: 'Scrapbook',
    emoji: '✂️',
    description: 'Playful, creative',
    component: ScrapbookLayout,
    preview: 'Journaling aesthetic with doodles'
  }
];

export const getLayoutById = (id) => {
  return LAYOUTS[id] || LAYOUTS.classic;
};

export const getLayoutOption = (id) => {
  return LAYOUT_OPTIONS.find(option => option.id === id) || LAYOUT_OPTIONS[0];
};

export {
  ClassicLayout,
  MagazineLayout,
  PolaroidLayout,
  SplitScreenLayout,
  StoryLayout,
  BentoLayout,
  MinimalLayout,
  ScrapbookLayout
};
