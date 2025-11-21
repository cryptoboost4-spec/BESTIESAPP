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
    preview: 'Center-aligned with prominent photo',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#F3F4F6"/>
      <circle cx="50" cy="30" r="12" fill="#EC4899"/>
      <rect x="30" y="48" width="40" height="3" rx="1.5" fill="#6B7280"/>
      <rect x="25" y="55" width="50" height="2" rx="1" fill="#9CA3AF"/>
      <rect x="30" y="60" width="40" height="2" rx="1" fill="#9CA3AF"/>
      <rect x="35" y="70" width="10" height="10" rx="2" fill="#A855F7"/>
      <rect x="55" y="70" width="10" height="10" rx="2" fill="#A855F7"/>
    </svg>`
  },
  {
    id: 'magazine',
    name: 'Magazine',
    emoji: '📰',
    description: 'Editorial, sophisticated',
    component: MagazineLayout,
    preview: 'Magazine cover style layout',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#F3F4F6"/>
      <rect x="10" y="15" width="30" height="35" rx="3" fill="#EC4899"/>
      <rect x="45" y="15" width="45" height="4" rx="2" fill="#6B7280"/>
      <rect x="45" y="23" width="40" height="2" rx="1" fill="#9CA3AF"/>
      <rect x="45" y="28" width="35" height="2" rx="1" fill="#9CA3AF"/>
      <rect x="10" y="60" width="80" height="2" rx="1" fill="#9CA3AF"/>
      <rect x="10" y="65" width="70" height="2" rx="1" fill="#9CA3AF"/>
    </svg>`
  },
  {
    id: 'polaroid',
    name: 'Polaroid',
    emoji: '📸',
    description: 'Nostalgic, scrapbook vibes',
    component: PolaroidLayout,
    preview: 'Instant camera style cards',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#F3F4F6"/>
      <rect x="20" y="15" width="35" height="40" rx="2" fill="white" stroke="#6B7280" stroke-width="2"/>
      <rect x="22" y="17" width="31" height="28" fill="#EC4899"/>
      <rect x="28" y="48" width="19" height="2" rx="1" fill="#6B7280"/>
      <rect x="60" y="25" width="15" height="18" rx="2" fill="white" stroke="#6B7280" stroke-width="1.5"/>
      <rect x="62" y="27" width="11" height="11" fill="#A855F7"/>
    </svg>`
  },
  {
    id: 'split',
    name: 'Split Screen',
    emoji: '◐',
    description: 'Modern, balanced',
    component: SplitScreenLayout,
    preview: 'Split layout with photo and info',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#F3F4F6"/>
      <rect x="10" y="20" width="22" height="22" rx="11" fill="#EC4899"/>
      <rect x="38" y="20" width="52" height="4" rx="2" fill="#6B7280"/>
      <rect x="38" y="28" width="45" height="2" rx="1" fill="#9CA3AF"/>
      <rect x="38" y="33" width="40" height="2" rx="1" fill="#9CA3AF"/>
      <rect x="10" y="55" width="12" height="12" rx="2" fill="#A855F7"/>
      <rect x="25" y="55" width="12" height="12" rx="2" fill="#A855F7"/>
      <rect x="40" y="55" width="12" height="12" rx="2" fill="#A855F7"/>
    </svg>`
  },
  {
    id: 'story',
    name: 'Story',
    emoji: '📱',
    description: 'Instagram Story style',
    component: StoryLayout,
    preview: 'Full-bleed vertical format',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="url(#storyGrad)"/>
      <circle cx="50" cy="35" r="15" fill="white" opacity="0.9"/>
      <rect x="30" y="55" width="40" height="4" rx="2" fill="white" opacity="0.9"/>
      <rect x="35" y="62" width="30" height="2" rx="1" fill="white" opacity="0.8"/>
      <defs>
        <linearGradient id="storyGrad" x1="0" y1="0" x2="0" y2="100">
          <stop offset="0%" stop-color="#EC4899"/>
          <stop offset="100%" stop-color="#A855F7"/>
        </linearGradient>
      </defs>
    </svg>`
  },
  {
    id: 'bento',
    name: 'Bento Grid',
    emoji: '📦',
    description: 'Widget-style, organized',
    component: BentoLayout,
    preview: 'Modular grid system',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#F3F4F6"/>
      <rect x="10" y="10" width="38" height="38" rx="3" fill="#EC4899" opacity="0.8"/>
      <rect x="52" y="10" width="38" height="18" rx="3" fill="#A855F7" opacity="0.8"/>
      <rect x="52" y="32" width="18" height="18" rx="3" fill="#6366F1" opacity="0.8"/>
      <rect x="72" y="32" width="18" height="18" rx="3" fill="#8B5CF6" opacity="0.8"/>
      <rect x="10" y="52" width="38" height="18" rx="3" fill="#EC4899" opacity="0.6"/>
      <rect x="52" y="52" width="38" height="18" rx="3" fill="#A855F7" opacity="0.6"/>
    </svg>`
  },
  {
    id: 'minimal',
    name: 'Minimal',
    emoji: '🤍',
    description: 'Clean, zen, sophisticated',
    component: MinimalLayout,
    preview: 'Maximum whitespace and elegance',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="white"/>
      <circle cx="50" cy="35" r="10" fill="#EC4899" opacity="0.7"/>
      <rect x="40" y="50" width="20" height="2" rx="1" fill="#6B7280"/>
      <line x1="48" y1="56" x2="52" y2="56" stroke="#9CA3AF" stroke-width="1"/>
      <rect x="35" y="62" width="30" height="1.5" rx="0.75" fill="#9CA3AF" opacity="0.5"/>
    </svg>`
  },
  {
    id: 'scrapbook',
    name: 'Scrapbook',
    emoji: '✂️',
    description: 'Playful, creative',
    component: ScrapbookLayout,
    preview: 'Journaling aesthetic with doodles',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#FFF9E5"/>
      <circle cx="50" cy="30" r="13" fill="#EC4899" transform="rotate(-5 50 30)"/>
      <rect x="35" y="48" width="30" height="3" rx="1.5" fill="#6B7280" transform="rotate(-2 50 50)"/>
      <path d="M 30 58 Q 50 56 70 58" stroke="#9CA3AF" stroke-width="1.5" fill="none"/>
      <circle cx="25" cy="25" r="3" fill="#FFD700" opacity="0.6"/>
      <circle cx="75" cy="70" r="3" fill="#A855F7" opacity="0.6"/>
      <path d="M 20 75 L 22 73 L 24 75" stroke="#EC4899" stroke-width="1.5" fill="none"/>
    </svg>`
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
