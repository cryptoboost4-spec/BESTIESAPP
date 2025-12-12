# Shared Tutorial Components - Technical Specification

## 🎯 Purpose

This document specifies the shared, reusable components used across all tutorials (Besties, Profile, Settings). These components ensure consistency in design, behavior, and user experience.

---

## 📦 Component Architecture

```
TutorialSystem/
├── Components/
│   ├── TutorialPromptCard.jsx (reusable, configurable)
│   ├── TutorialOverlay.jsx (core overlay system)
│   ├── TutorialTooltip.jsx (tooltip UI)
│   ├── TutorialProgressDots.jsx (progress indicator)
│   └── TutorialMiniTooltip.jsx (compact mode tooltip)
├── Hooks/
│   ├── useTutorialState.js (generic tutorial state)
│   ├── useBestiesTutorialState.js (extends useTutorialState)
│   ├── useProfileTutorialState.js (extends useTutorialState)
│   └── useSettingsTutorialState.js (extends useTutorialState)
├── Utils/
│   ├── tutorialStorage.js (localStorage + Firestore sync)
│   ├── tutorialAnalytics.js (analytics tracking)
│   └── tutorialAnimations.js (confetti, micro-animations)
└── Styles/
    └── tutorial.css (shared styles, animations)
```

---

## 🧩 1. TutorialPromptCard Component

### Purpose
Reusable prompt card shown before tutorial starts. Invites user to begin tutorial.

### Props
```javascript
interface TutorialPromptCardProps {
  emoji: string;                    // e.g., "💜", "✨", "⚙️"
  title: string;                    // e.g., "Welcome to Your Besties Space!"
  body: string;                     // Description of what tutorial covers
  highlightText: string;            // Text in highlight box (e.g., "🔒 Private space")
  highlightColor?: 'purple' | 'blue' | 'green'; // Default: 'purple'
  timeEstimate: string;             // e.g., "⏱️ 2 minutes"
  onStart: () => void;              // Callback when "Start" clicked
  onSkip: () => void;               // Callback when "Skip" clicked
  startButtonText?: string;         // Default: "Start Tutorial"
  skipButtonText?: string;          // Default: "I'll explore on my own"
}
```

### Usage
```javascript
<TutorialPromptCard
  emoji="💜"
  title="Welcome to Your Besties Space!"
  body="This is where you and your crew hang out. Let's take a quick tour!"
  highlightText="🔒 Private space - only your besties see what's here"
  highlightColor="purple"
  timeEstimate="⏱️ 2 minutes • Skip anytime"
  onStart={handleStartTutorial}
  onSkip={handleSkipTutorial}
/>
```

### Design Specs
```css
.tutorial-prompt-card {
  background: linear-gradient(135deg, white, purple-50);
  border: 2px solid purple-200;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(147, 51, 234, 0.15);
  max-width: 500px;
  margin: 0 auto;
  animation: fade-in-up 400ms ease-out;
}

.tutorial-prompt-emoji {
  font-size: 48px;
  text-align: center;
  margin-bottom: 16px;
}

.tutorial-prompt-title {
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  color: gray-900;
  margin-bottom: 12px;
}

.tutorial-prompt-body {
  font-size: 16px;
  color: gray-700;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 16px;
}

.tutorial-prompt-highlight {
  /* Purple variant */
  background: linear-gradient(135deg, purple-100, pink-100);
  border: 2px solid purple-300;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: purple-900;

  /* Blue variant */
  &[data-color="blue"] {
    background: linear-gradient(135deg, blue-100, cyan-100);
    border-color: blue-300;
    color: blue-900;
  }

  /* Green variant */
  &[data-color="green"] {
    background: linear-gradient(135deg, green-100, emerald-100);
    border-color: green-300;
    color: green-900;
  }
}

.tutorial-prompt-time {
  font-size: 13px;
  color: gray-600;
  text-align: center;
  margin-bottom: 20px;
}

.tutorial-prompt-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.tutorial-prompt-start {
  /* Primary button - same as tutorial buttons */
  background: linear-gradient(135deg, purple-600, pink-500);
  color: white;
  font-size: 18px;
  font-weight: 600;
  padding: 14px 32px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(147, 51, 234, 0.4);
  cursor: pointer;
  transition: all 200ms ease;
  width: 100%;
  max-width: 300px;
}

.tutorial-prompt-start:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(147, 51, 234, 0.5);
}

.tutorial-prompt-start:active {
  transform: scale(0.95);
}

.tutorial-prompt-skip {
  background: transparent;
  color: gray-600;
  font-size: 14px;
  text-decoration: underline;
  border: none;
  cursor: pointer;
  padding: 8px;
}

.tutorial-prompt-skip:hover {
  color: gray-900;
}
```

### Animations
```css
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 🧩 2. TutorialOverlay Component

### Purpose
Core overlay system that darkens background, highlights specific element, and shows tooltip.

### Props
```javascript
interface TutorialOverlayProps {
  currentStep: number;                    // Current step (1-based)
  totalSteps: number;                     // Total number of steps
  highlightedElementRef: React.RefObject; // Ref to element to highlight
  tooltipConfig: TooltipConfig;           // Tooltip configuration
  onNext: () => void;                     // Next button callback
  onSkip: () => void;                     // Skip tutorial callback
  onBack?: () => void;                    // Back button callback (optional)
  isPaused?: boolean;                     // Paused state (for modals)
  isMiniMode?: boolean;                   // Mini mode (compact tooltip)
  showBack?: boolean;                     // Show back button (default: currentStep > 1)
}

interface TooltipConfig {
  icon?: string;                          // Emoji icon
  title: string;                          // Tooltip title
  body: string;                           // Tooltip body text
  buttons?: ButtonConfig[];               // Custom buttons
  position?: 'auto' | 'above' | 'below';  // Tooltip position
}

interface ButtonConfig {
  text: string;                           // Button text
  action: string;                         // Action identifier
  primary?: boolean;                      // Is primary button
  icon?: string;                          // Optional emoji icon
}
```

### Usage
```javascript
<TutorialOverlay
  currentStep={2}
  totalSteps={4}
  highlightedElementRef={postButtonRef}
  tooltipConfig={{
    icon: "✨",
    title: "Share Your Moment",
    body: "Want to share something? Tap this button!",
    buttons: [
      { text: "Try It Now", action: "try", primary: true, icon: "✨" },
      { text: "I'll Try Later", action: "skip", primary: false }
    ],
    position: "above"
  }}
  onNext={handleNext}
  onSkip={handleSkip}
  onBack={handleBack}
  showBack={true}
  isPaused={isModalOpen}
  isMiniMode={false}
/>
```

### Behavior
1. **Overlay Layer:** Darkens entire screen except highlighted element
2. **Highlight:** Glowing purple border around target element
3. **Z-Index Management:** Ensures correct layering (overlay → highlight → tooltip)
4. **Scroll Locking:** Prevents scrolling when tutorial active
5. **Paused State:** Reduces overlay opacity when modal/action open
6. **Mini Mode:** Shrinks tooltip to top-right corner

### Design Specs
```css
.tutorial-overlay-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  z-index: 9998;
  transition: opacity 300ms ease-in-out;
  pointer-events: auto;
}

.tutorial-overlay-backdrop[data-paused="true"] {
  opacity: 0.4; /* Lighter when paused */
}

.tutorial-highlight-glow {
  position: fixed;
  z-index: 10000;
  pointer-events: none;
  border-radius: 12px;
  box-shadow:
    0 0 0 4px rgba(147, 51, 234, 0.3),
    0 0 20px rgba(147, 51, 234, 0.6),
    0 0 40px rgba(147, 51, 234, 0.4);
  transition: all 300ms ease-in-out;
  animation: tutorial-pulse 1.5s infinite;
}

@keyframes tutorial-pulse {
  0%, 100% {
    box-shadow:
      0 0 0 4px rgba(147, 51, 234, 0.3),
      0 0 20px rgba(147, 51, 234, 0.6),
      0 0 40px rgba(147, 51, 234, 0.4);
  }
  50% {
    box-shadow:
      0 0 0 4px rgba(147, 51, 234, 0.5),
      0 0 25px rgba(147, 51, 234, 0.8),
      0 0 50px rgba(147, 51, 234, 0.6);
  }
}

.tutorial-highlighted-element {
  position: relative !important;
  z-index: 10001 !important;
  pointer-events: auto;
}
```

---

## 🧩 3. TutorialTooltip Component

### Purpose
Tooltip UI that displays tutorial content, buttons, and progress.

### Props
```javascript
interface TutorialTooltipProps {
  icon?: string;                          // Emoji icon
  title: string;                          // Title text
  body: string;                           // Body text
  buttons: ButtonConfig[];                // Action buttons
  stepNumber: number;                     // Current step (1-based)
  totalSteps: number;                     // Total steps
  onButtonClick: (action: string) => void; // Button click handler
  targetElement: HTMLElement;             // Target element (for positioning)
  position?: 'auto' | 'above' | 'below';  // Position preference
  isMiniMode?: boolean;                   // Mini mode
}
```

### Positioning Logic
- **Auto:** Calculates best position based on available space
- **Above:** Always positions above target element
- **Below:** Always positions below target element
- **Centering:** Horizontally centered on screen (mobile-friendly)
- **Arrow:** Points to target element

### Design Specs
```css
.tutorial-tooltip {
  position: fixed;
  z-index: 10002;
  background: linear-gradient(135deg, purple-50, pink-50);
  border: 2px solid purple-200;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(12px);
  max-width: 500px;
  width: 90vw;
  transition: all 300ms ease-in-out;
}

/* Dark mode */
.dark .tutorial-tooltip {
  background: linear-gradient(135deg, rgba(88, 28, 135, 0.9), rgba(157, 23, 77, 0.9));
  border-color: purple-700;
}

/* Mini mode */
.tutorial-tooltip[data-mini="true"] {
  padding: 16px;
  max-width: 250px;
  width: auto;
  top: 20px !important;
  right: 20px !important;
  left: auto !important;
}

.tutorial-tooltip-arrow {
  position: absolute;
  width: 0;
  height: 0;
}

/* Arrow pointing down (tooltip above target) */
.tutorial-tooltip-arrow[data-direction="down"] {
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid var(--tooltip-bg-color);
}

/* Arrow pointing up (tooltip below target) */
.tutorial-tooltip-arrow[data-direction="up"] {
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 10px solid var(--tooltip-bg-color);
}

.tutorial-tooltip-icon {
  font-size: 36px;
  text-align: center;
  margin-bottom: 12px;
}

.tutorial-tooltip-title {
  font-size: 20px;
  font-weight: 700;
  color: gray-900;
  margin-bottom: 8px;
  text-align: center;
}

.dark .tutorial-tooltip-title {
  color: white;
}

.tutorial-tooltip-body {
  font-size: 16px;
  color: gray-700;
  line-height: 1.6;
  margin-bottom: 16px;
  text-align: center;
}

.dark .tutorial-tooltip-body {
  color: gray-100;
}

.tutorial-tooltip-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.tutorial-tooltip-button-primary {
  background: linear-gradient(135deg, purple-600, pink-500);
  color: white;
  font-size: 16px;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(147, 51, 234, 0.4);
  cursor: pointer;
  transition: all 200ms ease;
  flex: 1;
  max-width: 200px;
}

.tutorial-tooltip-button-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(147, 51, 234, 0.5);
}

.tutorial-tooltip-button-primary:active {
  transform: scale(0.95);
}

/* Pulsing animation for "Try It" buttons */
.tutorial-tooltip-button-primary[data-pulsing="true"] {
  animation: gentle-pulse 2s infinite;
}

@keyframes gentle-pulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(147, 51, 234, 0.4);
  }
  50% {
    box-shadow: 0 4px 16px rgba(147, 51, 234, 0.6);
  }
}

.tutorial-tooltip-button-secondary {
  background: transparent;
  color: gray-600;
  font-size: 14px;
  text-decoration: underline;
  border: none;
  cursor: pointer;
  padding: 8px 16px;
}

.tutorial-tooltip-button-secondary:hover {
  color: gray-900;
}

.dark .tutorial-tooltip-button-secondary {
  color: gray-300;
}

.dark .tutorial-tooltip-button-secondary:hover {
  color: white;
}
```

---

## 🧩 4. TutorialProgressDots Component

### Purpose
Visual progress indicator showing current step.

### Props
```javascript
interface TutorialProgressDotsProps {
  currentStep: number;    // 1-based
  totalSteps: number;     // Total number of steps
  color?: string;         // Default: 'purple'
}
```

### Usage
```javascript
<TutorialProgressDots currentStep={2} totalSteps={4} />
```

### Design Specs
```css
.tutorial-progress-dots {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 16px;
}

.tutorial-progress-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid gray-300;
  background: transparent;
  transition: all 300ms ease;
}

.tutorial-progress-dot[data-filled="true"] {
  background: purple-600;
  border-color: purple-600;
  animation: dot-fill 300ms ease;
}

@keyframes dot-fill {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}
```

---

## 🧩 5. TutorialMiniTooltip Component

### Purpose
Compact tooltip shown during interactive exploration mode.

### Props
```javascript
interface TutorialMiniTooltipProps {
  message: string;                  // Short message
  stepNumber: number;               // Current step
  totalSteps: number;               // Total steps
  onContinue: () => void;           // Continue button callback
}
```

### Usage
```javascript
<TutorialMiniTooltip
  message="Tap any item to set it up! ✨"
  stepNumber={2}
  totalSteps={4}
  onContinue={handleContinue}
/>
```

### Design Specs
```css
.tutorial-mini-tooltip {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10003;
  background: linear-gradient(135deg, purple-50, pink-50);
  border: 2px solid purple-200;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  max-width: 250px;
  animation: slide-in-right 300ms ease;
}

@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.tutorial-mini-tooltip-message {
  font-size: 14px;
  font-weight: 600;
  color: gray-900;
  margin-bottom: 12px;
}

.tutorial-mini-tooltip-button {
  width: 100%;
  background: linear-gradient(135deg, purple-600, pink-500);
  color: white;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}
```

---

## 🔌 6. useTutorialState Hook (Base)

### Purpose
Generic tutorial state management hook. Extended by page-specific hooks.

### API
```javascript
const useTutorialState = (tutorialKey) => {
  // State
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(false);

  // Methods
  const startTutorial = () => { /* ... */ };
  const nextStep = () => { /* ... */ };
  const previousStep = () => { /* ... */ };
  const skipTutorial = () => { /* ... */ };
  const completeTutorial = () => { /* ... */ };
  const pauseTutorial = () => { /* ... */ };
  const resumeTutorial = () => { /* ... */ };
  const enterMiniMode = () => { /* ... */ };
  const exitMiniMode = () => { /* ... */ };
  const saveState = () => { /* ... */ };
  const loadState = () => { /* ... */ };
  const clearState = () => { /* ... */ };

  return {
    isActive,
    currentStep,
    isCompleted,
    isDismissed,
    isPaused,
    isMiniMode,
    startTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    pauseTutorial,
    resumeTutorial,
    enterMiniMode,
    exitMiniMode,
    saveState,
    loadState,
    clearState
  };
};
```

### Storage Integration
```javascript
// tutorialStorage.js
export const saveTutorialState = async (userId, tutorialKey, state) => {
  // Save to localStorage (immediate)
  localStorage.setItem(`${tutorialKey}_tutorial_state`, JSON.stringify(state));

  // Save to Firestore (persistent, cross-device)
  if (userId) {
    await updateDoc(doc(db, 'users', userId, 'settings', 'tutorials'), {
      [tutorialKey]: state
    });
  }
};

export const loadTutorialState = async (userId, tutorialKey) => {
  // Try localStorage first (faster)
  const localState = localStorage.getItem(`${tutorialKey}_tutorial_state`);
  if (localState) {
    return JSON.parse(localState);
  }

  // Fallback to Firestore (cross-device sync)
  if (userId) {
    const docRef = doc(db, 'users', userId, 'settings', 'tutorials');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data()[tutorialKey];
    }
  }

  return null;
};
```

---

## 🎨 7. Shared Animations (tutorialAnimations.js)

### Confetti Animation
```javascript
export const showConfetti = (options = {}) => {
  const {
    duration = 2000,
    particleCount = 30,
    colors = ['#9333ea', '#ec4899', '#fbbf24'],
    spread = 60,
    origin = { x: 0.5, y: 0.5 }
  } = options;

  // Use canvas-confetti library or custom implementation
  confetti({
    particleCount,
    spread,
    origin,
    colors,
    ticks: duration / 10,
    gravity: 1.2,
    scalar: 1.2
  });
};
```

### Micro-Success Animation
```javascript
export const showMicroSuccess = (element, icon = '✓') => {
  const successIndicator = document.createElement('div');
  successIndicator.className = 'tutorial-micro-success';
  successIndicator.innerHTML = icon;
  successIndicator.style.cssText = `
    position: absolute;
    top: 50%;
    right: -30px;
    transform: translateY(-50%);
    color: #10b981;
    font-size: 20px;
    font-weight: bold;
    animation: micro-success 1s ease forwards;
  `;

  element.appendChild(successIndicator);

  setTimeout(() => {
    successIndicator.remove();
  }, 1000);
};
```

```css
@keyframes micro-success {
  0% {
    opacity: 0;
    transform: translateY(-50%) scale(0.5);
  }
  30% {
    opacity: 1;
    transform: translateY(-50%) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translateY(-50%) scale(1);
  }
}
```

---

## 📊 8. Analytics Tracking (tutorialAnalytics.js)

### Standard Events
```javascript
export const trackTutorialEvent = (eventName, properties) => {
  // Use your analytics service (e.g., Mixpanel, Amplitude, Google Analytics)
  analytics.track(eventName, {
    timestamp: Date.now(),
    ...properties
  });
};

// Standard event functions
export const trackTutorialStarted = (page) => {
  trackTutorialEvent('tutorial_started', { page });
};

export const trackTutorialStepCompleted = (page, step, timeOnStep) => {
  trackTutorialEvent('tutorial_step_completed', {
    page,
    step,
    time_on_step_seconds: timeOnStep
  });
};

export const trackTutorialSkipped = (page, atStep) => {
  trackTutorialEvent('tutorial_skipped', {
    page,
    at_step: atStep
  });
};

export const trackTutorialCompleted = (page, totalDuration) => {
  trackTutorialEvent('tutorial_completed', {
    page,
    duration_seconds: totalDuration
  });
};

export const trackTutorialActionAttempted = (page, step, action) => {
  trackTutorialEvent('tutorial_action_attempted', {
    page,
    step,
    action
  });
};

export const trackTutorialActionCompleted = (page, step, action) => {
  trackTutorialEvent('tutorial_action_completed', {
    page,
    step,
    action
  });
};
```

---

## 🎯 9. Shared Behavior Patterns

### Scroll Locking
```javascript
export const lockScroll = () => {
  const scrollY = window.scrollY;
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';
  return scrollY;
};

export const unlockScroll = (scrollY) => {
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, scrollY);
};
```

### Element Position Calculation
```javascript
export const calculateTooltipPosition = (targetElement, tooltipElement, preference = 'auto') => {
  const targetRect = targetElement.getBoundingClientRect();
  const tooltipRect = tooltipElement.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  const spaceAbove = targetRect.top;
  const spaceBelow = viewportHeight - targetRect.bottom;

  let position = preference;

  if (preference === 'auto') {
    position = spaceAbove > spaceBelow ? 'above' : 'below';
  }

  let top, left;

  if (position === 'above') {
    top = targetRect.top - tooltipRect.height - 16;
  } else {
    top = targetRect.bottom + 16;
  }

  // Center horizontally
  left = (viewportWidth - tooltipRect.width) / 2;

  // Ensure within viewport
  top = Math.max(20, Math.min(top, viewportHeight - tooltipRect.height - 20));
  left = Math.max(20, Math.min(left, viewportWidth - tooltipRect.width - 20));

  return { top, left, position };
};
```

### Ref Retry Logic
```javascript
export const waitForRef = async (ref, maxRetries = 5, delay = 100) => {
  for (let i = 0; i < maxRetries; i++) {
    if (ref.current) {
      return ref.current;
    }
    await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
  }
  throw new Error('Ref not found after retries');
};
```

---

## ✅ Testing Utilities

### Tutorial Test Helpers
```javascript
export const tutorialTestHelpers = {
  // Reset all tutorial states
  resetAllTutorials: () => {
    localStorage.removeItem('besties_tutorial_completed');
    localStorage.removeItem('profile_tutorial_completed');
    localStorage.removeItem('settings_tutorial_completed');
    // Clear Firestore too (in test environment)
  },

  // Simulate tutorial completion
  completeTutorial: (tutorialKey) => {
    localStorage.setItem(`${tutorialKey}_tutorial_completed`, 'true');
    localStorage.setItem(`${tutorialKey}_tutorial_completed_at`, Date.now());
  },

  // Check if tutorial should show
  shouldShowTutorial: (tutorialKey) => {
    const completed = localStorage.getItem(`${tutorialKey}_tutorial_completed`);
    const dismissed = localStorage.getItem(`${tutorialKey}_tutorial_dismissed`);
    return !completed && !dismissed;
  }
};
```

---

## 📝 Implementation Checklist

### For Each Tutorial:
- [ ] Create page-specific tutorial overlay component
- [ ] Create page-specific tutorial state hook (extends useTutorialState)
- [ ] Add refs to all highlighted elements in page component
- [ ] Implement tutorial trigger logic (when to show)
- [ ] Implement step navigation (next, back, skip)
- [ ] Implement interactive actions (toggles, modals, etc.)
- [ ] Implement pause/resume for modals
- [ ] Implement mini mode for exploration
- [ ] Add micro-success animations
- [ ] Add completion celebration
- [ ] Save state to localStorage + Firestore
- [ ] Add analytics tracking
- [ ] Handle all edge cases
- [ ] Test on mobile and desktop
- [ ] Test dark mode
- [ ] Test with screen readers (accessibility)
- [ ] Test restart functionality

---

**End of Shared Tutorial Components Specification**
