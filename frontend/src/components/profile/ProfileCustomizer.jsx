import React, { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import toast from 'react-hot-toast';
import { BACKGROUNDS, getCategoryName, BACKGROUND_CATEGORIES } from './themes/backgrounds';
import { TYPOGRAPHY_STYLES, loadGoogleFonts, getTypographyById, getNameStyle, getBioStyle } from './themes/typography';
import { LAYOUT_OPTIONS, getLayoutById } from './layouts';
import { SPECIAL_EFFECTS, getSpecialEffectById } from './themes/specialEffects';
import './themes/backgroundPatterns.css';
import './themes/specialEffects.css';

const ProfileCustomizer = ({ currentUser, userData, onClose }) => {
  const [activeTab, setActiveTab] = useState('vibes');
  const [selectedSpecialEffect, setSelectedSpecialEffect] = useState(userData?.profile?.customization?.specialEffect || 'none');
  const [selectedBackground, setSelectedBackground] = useState(userData?.profile?.customization?.background || 'pearl-elegance');
  const [selectedLayout, setSelectedLayout] = useState(userData?.profile?.customization?.layout || 'classic');
  const [selectedTypography, setSelectedTypography] = useState(userData?.profile?.customization?.typography || 'elegant');
  const [photoShape, setPhotoShape] = useState(userData?.profile?.customization?.photoShape || 'circle');
  const [photoBorder, setPhotoBorder] = useState(userData?.profile?.customization?.photoBorder || 'classic');
  const [customNameFont, setCustomNameFont] = useState(userData?.profile?.customization?.customNameFont || '');
  const [customBioFont, setCustomBioFont] = useState(userData?.profile?.customization?.customBioFont || '');
  const [saving, setSaving] = useState(false);
  const [backgroundSearch, setBackgroundSearch] = useState('');
  const [previewZoom, setPreviewZoom] = useState(1);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Popular Google Fonts list
  const POPULAR_FONTS = [
    { name: 'Playfair Display', category: 'serif' },
    { name: 'Montserrat', category: 'sans-serif' },
    { name: 'Roboto', category: 'sans-serif' },
    { name: 'Open Sans', category: 'sans-serif' },
    { name: 'Lora', category: 'serif' },
    { name: 'Raleway', category: 'sans-serif' },
    { name: 'Poppins', category: 'sans-serif' },
    { name: 'Merriweather', category: 'serif' },
    { name: 'Oswald', category: 'sans-serif' },
    { name: 'Inter', category: 'sans-serif' },
    { name: 'Bebas Neue', category: 'display' },
    { name: 'Pacifico', category: 'handwriting' },
    { name: 'Dancing Script', category: 'handwriting' },
    { name: 'Crimson Text', category: 'serif' },
    { name: 'Nunito', category: 'sans-serif' },
    { name: 'Quicksand', category: 'sans-serif' },
    { name: 'Libre Baskerville', category: 'serif' },
    { name: 'Source Sans Pro', category: 'sans-serif' },
    { name: 'Abril Fatface', category: 'display' },
    { name: 'Cormorant Garamond', category: 'serif' }
  ];

  // Initialize history on mount with current state
  useEffect(() => {
    const initialState = {
      background: selectedBackground,
      layout: selectedLayout,
      typography: selectedTypography,
      specialEffect: selectedSpecialEffect,
      photoShape,
      photoBorder,
      customNameFont,
      customBioFont
    };
    setHistory([initialState]);
    setHistoryIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load fonts when typography changes
  useEffect(() => {
    const typography = getTypographyById(selectedTypography);
    if (typography) {
      loadGoogleFonts(typography);
    }
  }, [selectedTypography]);

  // Load custom fonts when selected
  useEffect(() => {
    const loadCustomFont = (fontName) => {
      if (!fontName) return;
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;600;700&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    };

    if (customNameFont) loadCustomFont(customNameFont);
    if (customBioFont) loadCustomFont(customBioFont);
  }, [customNameFont, customBioFont]);

  // Save current state to history
  const saveToHistory = () => {
    const currentState = {
      background: selectedBackground,
      layout: selectedLayout,
      typography: selectedTypography,
      specialEffect: selectedSpecialEffect,
      photoShape,
      photoBorder,
      customNameFont,
      customBioFont
    };

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, currentState];
    });
    setHistoryIndex(prev => prev + 1);
  };

  // Undo function
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setSelectedBackground(state.background);
      setSelectedLayout(state.layout);
      setSelectedTypography(state.typography);
      setSelectedSpecialEffect(state.specialEffect);
      setPhotoShape(state.photoShape);
      setPhotoBorder(state.photoBorder);
      setCustomNameFont(state.customNameFont);
      setCustomBioFont(state.customBioFont);
      setHistoryIndex(newIndex);
      toast('Undo', { icon: '↶' });
    }
  }, [historyIndex, history]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setSelectedBackground(state.background);
      setSelectedLayout(state.layout);
      setSelectedTypography(state.typography);
      setSelectedSpecialEffect(state.specialEffect);
      setPhotoShape(state.photoShape);
      setPhotoBorder(state.photoBorder);
      setCustomNameFont(state.customNameFont);
      setCustomBioFont(state.customBioFont);
      setHistoryIndex(newIndex);
      toast('Redo', { icon: '↷' });
    }
  }, [historyIndex, history]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        'profile.customization': {
          background: selectedBackground,
          layout: selectedLayout,
          typography: selectedTypography,
          photoShape,
          photoBorder,
          specialEffect: selectedSpecialEffect,
          customNameFont,
          customBioFont
        }
      });
      toast.success('Profile style saved! 💜');
      if (onClose) onClose();
    } catch (error) {
      console.error('Error saving customization:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  }, [currentUser.uid, selectedBackground, selectedLayout, selectedTypography, photoShape, photoBorder, selectedSpecialEffect, customNameFont, customBioFont, onClose]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ESC to close
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      // Ctrl+Z or Cmd+Z to undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Ctrl+Y or Cmd+Shift+Z to redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Arrow keys to switch tabs
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const tabs = ['vibes', 'backgrounds', 'layouts', 'typography', 'photo'];
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex !== -1) {
          e.preventDefault();
          if (e.key === 'ArrowLeft') {
            const newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
            setActiveTab(tabs[newIndex]);
          } else {
            const newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
            setActiveTab(tabs[newIndex]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, historyIndex, history, onClose, handleSave, handleUndo, handleRedo]);

  const copyStyleCode = () => {
    const styleCode = JSON.stringify({
      background: selectedBackground,
      layout: selectedLayout,
      typography: selectedTypography,
      photoShape,
      photoBorder,
      specialEffect: selectedSpecialEffect,
      customNameFont,
      customBioFont
    }, null, 2);

    navigator.clipboard.writeText(styleCode).then(() => {
      toast.success('Style code copied to clipboard! 📋');
    }).catch(() => {
      toast.error('Failed to copy style code');
    });
  };


  const getBackgroundById = (id) => {
    const allBackgrounds = Object.values(BACKGROUNDS).flat();
    return allBackgrounds.find(bg => bg.id === id);
  };

  const filterBackgrounds = (backgrounds) => {
    if (!backgroundSearch.trim()) return backgrounds;
    const search = backgroundSearch.toLowerCase();
    return backgrounds.filter(bg =>
      bg.name.toLowerCase().includes(search) ||
      bg.description.toLowerCase().includes(search) ||
      bg.category.toLowerCase().includes(search)
    );
  };

  // Get current selections for preview
  const currentBackground = getBackgroundById(selectedBackground);
  const currentTypography = getTypographyById(selectedTypography);
  const currentSpecialEffect = getSpecialEffectById(selectedSpecialEffect);
  const LayoutComponent = getLayoutById(selectedLayout);

  // Determine styles with custom fonts override
  const getCustomNameStyle = () => {
    const baseStyle = currentTypography ? getNameStyle(currentTypography) : {};
    if (customNameFont) {
      return { ...baseStyle, fontFamily: `'${customNameFont}', ${baseStyle.fontFamily || 'sans-serif'}` };
    }
    return baseStyle;
  };

  const getCustomBioStyle = () => {
    const baseStyle = currentTypography ? getBioStyle(currentTypography) : {};
    if (customBioFont) {
      return { ...baseStyle, fontFamily: `'${customBioFont}', ${baseStyle.fontFamily || 'sans-serif'}` };
    }
    return baseStyle;
  };

  const layoutProps = {
    profilePhoto: userData?.photoURL,
    displayName: userData?.displayName || 'Your Name',
    bio: userData?.profile?.bio || 'Your bio will appear here',
    badges: userData?.featuredBadges?.slice(0, 3) || [],
    stats: {
      besties: userData?.totalBesties || 0,
      checkIns: userData?.checkInCount || 0
    },
    nameStyle: getCustomNameStyle(),
    bioStyle: getCustomBioStyle(),
    nameSizeClass: currentTypography?.nameSizeClass || 'text-4xl',
    bioSizeClass: currentTypography?.bioSizeClass || 'text-lg',
    photoShape,
    photoBorder,
    decorativeElements: []
  };

  const getPhotoShapeClass = (shapeId = photoShape) => {
    const shapes = {
      circle: 'rounded-full',
      square: 'rounded-none',
      rounded: 'rounded-2xl',
      heart: 'heart-shape'
    };
    return shapes[shapeId] || 'rounded-full';
  };

  const getPhotoBorderClass = () => {
    const borders = {
      none: '',
      classic: 'border-4 border-white shadow-lg',
      metallic: 'border-4 border-yellow-400 shadow-lg',
      scalloped: 'border-4 border-white shadow-lg'
    };
    return borders[photoBorder] || '';
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-0">
      <div className="bg-white dark:bg-gray-900 w-full h-full md:h-[90vh] md:max-h-[900px] md:max-w-6xl md:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
        {/* LIVE PREVIEW - Always visible: Top half on mobile, left side on desktop */}
        <div className="flex flex-col md:w-2/5 bg-gray-50 dark:bg-gray-800 p-3 md:p-6 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 overflow-y-auto h-1/2 md:h-auto">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <h3 className="text-xs md:text-sm font-bold text-gray-600 dark:text-gray-400">Live Preview</h3>
            {/* Zoom controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPreviewZoom(Math.max(0.5, previewZoom - 0.1))}
                disabled={previewZoom <= 0.5}
                className="w-6 h-6 rounded-md bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs font-bold transition-all"
                title="Zoom out"
              >
                −
              </button>
              <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[3rem] text-center">
                {Math.round(previewZoom * 100)}%
              </span>
              <button
                onClick={() => setPreviewZoom(Math.min(1.5, previewZoom + 0.1))}
                disabled={previewZoom >= 1.5}
                className="w-6 h-6 rounded-md bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs font-bold transition-all"
                title="Zoom in"
              >
                +
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-sm">
              <div
                key={`${selectedBackground}-${selectedLayout}-${selectedTypography}-${selectedSpecialEffect}-${photoShape}-${photoBorder}`}
                className={`profile-card-pattern pattern-${currentBackground?.pattern || 'none'} ${currentSpecialEffect?.cssClass || ''} rounded-xl md:rounded-2xl overflow-hidden shadow-xl origin-center transition-all duration-300 ease-out animate-fadeIn`}
                style={{
                  background: currentBackground?.gradient || '#fff',
                  transform: `scale(${previewZoom * 0.75})`,
                  transformOrigin: 'center'
                }}
              >
                <LayoutComponent {...layoutProps} />
              </div>
            </div>
          </div>
        </div>

        {/* OPTIONS PANEL - Bottom half on mobile, right side on desktop */}
        <div className="flex-1 flex flex-col h-1/2 md:h-auto">
          {/* Header - Sticky */}
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between p-2 md:p-4">
              <div className="flex items-center gap-1 md:gap-2">
                <h2 className="text-base md:text-lg font-display bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Customize ✨
                </h2>

                {/* Undo/Redo buttons */}
                <div className="flex gap-0.5 md:gap-1">
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="p-1 md:p-1.5 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs md:text-sm"
                    title="Undo (Ctrl+Z)"
                  >
                    ↶
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="p-1 md:p-1.5 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs md:text-sm"
                    title="Redo (Ctrl+Y)"
                  >
                    ↷
                  </button>
                </div>

                <button
                  onClick={() => {
                    saveToHistory();
                    // Randomize everything!
                    const allBackgrounds = Object.values(BACKGROUNDS).flat();
                    const randomBg = allBackgrounds[Math.floor(Math.random() * allBackgrounds.length)];
                    const randomLayout = LAYOUT_OPTIONS[Math.floor(Math.random() * LAYOUT_OPTIONS.length)];
                    const randomTypo = TYPOGRAPHY_STYLES[Math.floor(Math.random() * TYPOGRAPHY_STYLES.length)];
                    const randomEffect = SPECIAL_EFFECTS[Math.floor(Math.random() * SPECIAL_EFFECTS.length)];
                    const shapes = ['circle', 'square', 'rounded', 'heart'];
                    const borders = ['none', 'classic', 'metallic', 'scalloped'];
                    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
                    const randomBorder = borders[Math.floor(Math.random() * borders.length)];

                    setSelectedBackground(randomBg.id);
                    setSelectedLayout(randomLayout.id);
                    setSelectedTypography(randomTypo.id);
                    setSelectedSpecialEffect(randomEffect.id);
                    setPhotoShape(randomShape);
                    setPhotoBorder(randomBorder);

                    toast('✨ Complete style randomized! ✨', { icon: '🎲' });
                  }}
                  className="px-2 py-1 text-xs md:text-sm rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold hover:shadow-lg transition-all whitespace-nowrap"
                  title="Randomize everything!"
                >
                  <span className="hidden sm:inline">🎲 Surprise Me!</span>
                  <span className="sm:hidden">🎲</span>
                </button>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 text-sm md:text-base transition-all"
                title="Close (ESC)"
              >
                ✕
              </button>
            </div>

            {/* Tab Navigation - Scrollable */}
            <div className="overflow-x-auto px-2 md:px-4 pb-2 md:pb-3">
              <div className="flex gap-1 md:gap-2 min-w-max">
                {[
                  { id: 'vibes', label: 'Vibes', emoji: '✨' },
                  { id: 'backgrounds', label: 'Backgrounds', emoji: '🎨' },
                  { id: 'layouts', label: 'Layouts', emoji: '📱' },
                  { id: 'typography', label: 'Fonts', emoji: '🔤' },
                  { id: 'photo', label: 'Photo', emoji: '📸' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-semibold whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-primary text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="md:inline">{tab.emoji}</span> <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto p-2 md:p-4">
            {/* VIBES TAB - Special Effects */}
            {activeTab === 'vibes' && (
              <div>
                <div className="flex items-center justify-between mb-2 md:mb-4">
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    Add special effects to your profile ✨
                  </p>
                  <button
                    onClick={() => {
                      const randomEffect = SPECIAL_EFFECTS[Math.floor(Math.random() * SPECIAL_EFFECTS.length)];
                      setSelectedSpecialEffect(randomEffect.id);
                      toast(`Random vibe: ${randomEffect.name}! ${randomEffect.emoji}`);
                    }}
                    className="text-xs px-2 py-1 rounded-lg bg-gradient-primary text-white font-semibold hover:shadow-lg transition-all"
                  >
                    🎲 Surprise Me
                  </button>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-3">
                  {SPECIAL_EFFECTS.map(effect => {
                    return (
                      <button
                        key={effect.id}
                        onClick={() => {
                          saveToHistory();
                          setSelectedSpecialEffect(effect.id);
                          toast(`${effect.name} effect applied! ${effect.emoji}`);
                        }}
                        className={`relative overflow-hidden rounded-xl transition-all hover:scale-105 ${
                          selectedSpecialEffect === effect.id
                            ? 'ring-4 ring-purple-500 bg-gradient-primary shadow-xl'
                            : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {/* Effect Preview with Animation */}
                        <div className={`h-24 md:h-36 p-2 md:p-3 flex flex-col items-center justify-center text-center relative ${effect.cssClass || ''}`}>
                          {/* Animated Background Demo */}
                          <div className="absolute inset-0 opacity-30">
                            {effect.id !== 'none' && (
                              <div className={`w-full h-full ${effect.cssClass}`}></div>
                            )}
                          </div>

                          <div className={`text-3xl md:text-5xl mb-1 md:mb-2 z-10 relative transition-transform ${selectedSpecialEffect === effect.id ? 'scale-110' : ''}`}>
                            {effect.emoji}
                          </div>
                          <div className={`text-[10px] md:text-sm font-bold z-10 relative ${selectedSpecialEffect === effect.id ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                            {effect.name}
                          </div>
                          <div className={`text-[8px] md:text-xs z-10 relative mt-0.5 md:mt-1 hidden md:block ${selectedSpecialEffect === effect.id ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
                            {effect.description}
                          </div>
                          {selectedSpecialEffect === effect.id && (
                            <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 bg-white rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-purple-600 z-10 shadow-lg">
                              ✓
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* BACKGROUNDS TAB */}
            {activeTab === 'backgrounds' && (
              <div>
                {/* Search and Randomize */}
                <div className="mb-3 md:mb-4 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search backgrounds..."
                      value={backgroundSearch}
                      onChange={(e) => setBackgroundSearch(e.target.value)}
                      className="flex-1 px-3 py-1.5 md:py-2 text-xs md:text-sm rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
                    />
                    <button
                      onClick={() => {
                        const allBackgrounds = Object.values(BACKGROUNDS).flat();
                        const randomBg = allBackgrounds[Math.floor(Math.random() * allBackgrounds.length)];
                        setSelectedBackground(randomBg.id);
                        toast(`Random aesthetic: ${randomBg.name}! 🎨`);
                      }}
                      className="px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm rounded-lg bg-gradient-primary text-white font-semibold hover:shadow-lg transition-all whitespace-nowrap"
                    >
                      🎲 Random
                    </button>
                  </div>
                  {backgroundSearch && (
                    <button
                      onClick={() => setBackgroundSearch('')}
                      className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      Clear search
                    </button>
                  )}
                </div>

                {BACKGROUND_CATEGORIES.map(category => {
                  const backgrounds = filterBackgrounds(BACKGROUNDS[category] || []);
                  if (backgrounds.length === 0) return null;

                  return (
                    <div key={category} className="mb-4 md:mb-6">
                      <h3 className="text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 md:mb-3">
                        {getCategoryName(category)}
                        <span className="ml-2 text-[10px] md:text-xs font-normal text-gray-500 dark:text-gray-400">
                          ({backgrounds.length})
                        </span>
                      </h3>
                      <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-3">
                        {backgrounds.map(bg => (
                          <button
                            key={bg.id}
                            onClick={() => {
                              saveToHistory();
                              setSelectedBackground(bg.id);
                              toast(`${bg.name} applied! 🎨`);
                            }}
                            className={`relative overflow-hidden rounded-xl transition-all hover:scale-105 ${
                              selectedBackground === bg.id ? 'ring-4 ring-purple-500 shadow-xl' : ''
                            }`}
                          >
                            {/* Mini Card Preview */}
                            <div
                              className={`h-16 md:h-24 flex items-center justify-center relative profile-card-pattern pattern-${bg.pattern || 'none'}`}
                              style={{ background: bg.gradient }}
                            >
                              {/* Tiny profile preview */}
                              <div className="flex flex-col items-center">
                                <div className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-white/80 mb-0.5 md:mb-1 shadow-lg"></div>
                                <div className="text-[8px] md:text-[10px] font-bold text-white drop-shadow-lg bg-black/30 px-1 md:px-2 py-0.5 rounded truncate max-w-full">
                                  {bg.name}
                                </div>
                              </div>
                              {selectedBackground === bg.id && (
                                <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-white rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center text-purple-600 text-[10px] md:text-xs shadow-lg">
                                  ✓
                                </div>
                              )}
                              {bg.illustrated && (
                                <div className="absolute top-1 left-1 md:top-2 md:left-2 bg-purple-600 text-white text-[8px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded font-bold shadow-lg">
                                  ✨
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {BACKGROUND_CATEGORIES.every(cat => filterBackgrounds(BACKGROUNDS[cat] || []).length === 0) && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-2">🔍</div>
                    <p className="text-sm">No backgrounds found</p>
                    <p className="text-xs mt-1">Try a different search term</p>
                  </div>
                )}
              </div>
            )}

            {/* LAYOUTS TAB */}
            {activeTab === 'layouts' && (
              <div>
                <div className="flex items-center justify-between mb-2 md:mb-4">
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    Choose your layout style 📱
                  </p>
                  <button
                    onClick={() => {
                      const randomLayout = LAYOUT_OPTIONS[Math.floor(Math.random() * LAYOUT_OPTIONS.length)];
                      setSelectedLayout(randomLayout.id);
                      toast(`Random layout: ${randomLayout.name}! ${randomLayout.emoji}`);
                    }}
                    className="text-xs px-2 py-1 rounded-lg bg-gradient-primary text-white font-semibold hover:shadow-lg transition-all"
                  >
                    🎲 Surprise Me
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-4">
                  {LAYOUT_OPTIONS.map(layout => (
                    <button
                      key={layout.id}
                      onClick={() => {
                        saveToHistory();
                        setSelectedLayout(layout.id);
                        toast(`${layout.name} layout applied! ${layout.emoji}`);
                      }}
                      className={`p-2 md:p-4 rounded-xl text-left transition-all hover:scale-105 ${
                        selectedLayout === layout.id
                          ? 'bg-gradient-primary text-white shadow-xl ring-2 ring-purple-500'
                          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {/* Layout Preview SVG */}
                      <div className="mb-2 md:mb-3 h-16 md:h-24 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden border-2 border-gray-200/50 dark:border-gray-600/50">
                        <div
                          className="w-full h-full"
                          dangerouslySetInnerHTML={{ __html: layout.svg }}
                        />
                      </div>
                      <div className={`flex items-center gap-1 mb-0.5 md:mb-1 ${selectedLayout === layout.id ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                        <span className="text-sm md:text-base">{layout.emoji}</span>
                        <span className="font-display font-bold text-xs md:text-base">{layout.name}</span>
                      </div>
                      <div className={`text-[10px] md:text-xs opacity-80 hidden md:block ${selectedLayout === layout.id ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
                        {layout.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TYPOGRAPHY TAB */}
            {activeTab === 'typography' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Pick your font style 🔤
                  </p>
                  <button
                    onClick={() => {
                      const randomTypo = TYPOGRAPHY_STYLES[Math.floor(Math.random() * TYPOGRAPHY_STYLES.length)];
                      setSelectedTypography(randomTypo.id);
                      toast(`Random typography: ${randomTypo.name}! ${randomTypo.emoji}`);
                    }}
                    className="text-xs px-2 py-1 rounded-lg bg-gradient-primary text-white font-semibold hover:shadow-lg transition-all"
                  >
                    🎲 Surprise Me
                  </button>
                </div>
                <div className="space-y-3">
                  {TYPOGRAPHY_STYLES.map(typo => (
                    <button
                      key={typo.id}
                      onClick={() => {
                        saveToHistory();
                        setSelectedTypography(typo.id);
                      }}
                      className={`w-full p-5 rounded-xl text-left transition-all ${
                        selectedTypography === typo.id
                          ? 'bg-gradient-primary text-white shadow-xl ring-2 ring-purple-500'
                          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {/* Font Preview - MAIN FOCUS */}
                      <div className="mb-3">
                        <div
                          className={`text-3xl font-bold mb-2 ${selectedTypography === typo.id ? 'text-white' : 'bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent'}`}
                          style={{
                            fontFamily: typo.nameFont.family,
                            fontWeight: typo.nameFont.weight,
                            fontStyle: typo.nameFont.style,
                            textTransform: typo.nameFont.transform || 'none'
                          }}
                        >
                          Your Name
                        </div>
                        <div
                          className={`text-lg ${selectedTypography === typo.id ? 'text-white/90' : 'text-gray-700 dark:text-gray-300'}`}
                          style={{
                            fontFamily: typo.bioFont.family,
                            fontWeight: typo.bioFont.weight,
                            fontStyle: typo.bioFont.style
                          }}
                        >
                          Your bio text appears here
                        </div>
                      </div>
                      {/* Font Info - Secondary */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/20 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{typo.emoji}</span>
                          <div>
                            <div className={`text-xs font-bold ${selectedTypography === typo.id ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                              {typo.name}
                            </div>
                            <div className={`text-xs ${selectedTypography === typo.id ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                              {typo.nameFont.family}
                            </div>
                          </div>
                        </div>
                        {selectedTypography === typo.id && <span className="text-xl">✓</span>}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom Font Selection */}
                <div className="mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">✨ Custom Fonts</h3>
                    <button
                      onClick={() => {
                        const randomFont = POPULAR_FONTS[Math.floor(Math.random() * POPULAR_FONTS.length)];
                        setCustomNameFont(randomFont.name);
                        setCustomBioFont(randomFont.name);
                        toast(`Random font combo: ${randomFont.name}! 🔤`);
                      }}
                      className="text-xs px-2 py-1 rounded-lg bg-gradient-primary text-white font-semibold hover:shadow-lg transition-all"
                    >
                      🎲 Random
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Choose different fonts for your name and bio, or use preset typography pairings above
                  </p>

                  {/* Name Font */}
                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                      <span>Name Font</span>
                      {customNameFont && (
                        <button
                          onClick={() => setCustomNameFont('')}
                          className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-normal"
                        >
                          Clear
                        </button>
                      )}
                    </label>
                    <select
                      value={customNameFont}
                      onChange={(e) => setCustomNameFont(e.target.value)}
                      className="w-full p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
                    >
                      <option value="">Use preset font from typography pairing</option>
                      <optgroup label="Serif Fonts">
                        {POPULAR_FONTS.filter(f => f.category === 'serif').map(font => (
                          <option key={font.name} value={font.name} style={{ fontFamily: font.name }}>
                            {font.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Sans-Serif Fonts">
                        {POPULAR_FONTS.filter(f => f.category === 'sans-serif').map(font => (
                          <option key={font.name} value={font.name} style={{ fontFamily: font.name }}>
                            {font.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Display Fonts">
                        {POPULAR_FONTS.filter(f => f.category === 'display').map(font => (
                          <option key={font.name} value={font.name} style={{ fontFamily: font.name }}>
                            {font.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Handwriting Fonts">
                        {POPULAR_FONTS.filter(f => f.category === 'handwriting').map(font => (
                          <option key={font.name} value={font.name} style={{ fontFamily: font.name }}>
                            {font.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    {customNameFont && (
                      <div
                        className="mt-2 p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg"
                        style={{ fontFamily: `'${customNameFont}', sans-serif` }}
                      >
                        <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                          Your Name Preview
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{customNameFont}</div>
                      </div>
                    )}
                  </div>

                  {/* Bio Font */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                      <span>Bio Font</span>
                      {customBioFont && (
                        <button
                          onClick={() => setCustomBioFont('')}
                          className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-normal"
                        >
                          Clear
                        </button>
                      )}
                    </label>
                    <select
                      value={customBioFont}
                      onChange={(e) => setCustomBioFont(e.target.value)}
                      className="w-full p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
                    >
                      <option value="">Use preset font from typography pairing</option>
                      <optgroup label="Serif Fonts">
                        {POPULAR_FONTS.filter(f => f.category === 'serif').map(font => (
                          <option key={font.name} value={font.name} style={{ fontFamily: font.name }}>
                            {font.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Sans-Serif Fonts">
                        {POPULAR_FONTS.filter(f => f.category === 'sans-serif').map(font => (
                          <option key={font.name} value={font.name} style={{ fontFamily: font.name }}>
                            {font.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Display Fonts">
                        {POPULAR_FONTS.filter(f => f.category === 'display').map(font => (
                          <option key={font.name} value={font.name} style={{ fontFamily: font.name }}>
                            {font.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Handwriting Fonts">
                        {POPULAR_FONTS.filter(f => f.category === 'handwriting').map(font => (
                          <option key={font.name} value={font.name} style={{ fontFamily: font.name }}>
                            {font.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    {customBioFont && (
                      <div
                        className="mt-2 p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg"
                        style={{ fontFamily: `'${customBioFont}', sans-serif` }}
                      >
                        <div className="text-base text-gray-700 dark:text-gray-300">
                          Your bio text preview appears here with your selected font. This is how it will look on your profile card when you share it with friends.
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{customBioFont}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PHOTO TAB */}
            {activeTab === 'photo' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Customize your photo style 📸
                  </p>
                  <button
                    onClick={() => {
                      const shapes = ['circle', 'square', 'rounded', 'heart'];
                      const borders = ['none', 'classic', 'metallic', 'scalloped'];
                      const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
                      const randomBorder = borders[Math.floor(Math.random() * borders.length)];
                      setPhotoShape(randomShape);
                      setPhotoBorder(randomBorder);
                      toast(`Random photo style! 📸`);
                    }}
                    className="text-xs px-2 py-1 rounded-lg bg-gradient-primary text-white font-semibold hover:shadow-lg transition-all"
                  >
                    🎲 Surprise Me
                  </button>
                </div>

                {/* Photo Shape */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Photo Shape</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { id: 'circle', label: 'Circle', icon: '⭕' },
                      { id: 'square', label: 'Square', icon: '⬜' },
                      { id: 'rounded', label: 'Rounded', icon: '▢' },
                      { id: 'heart', label: 'Heart', icon: '💕' }
                    ].map(shape => (
                      <button
                        key={shape.id}
                        onClick={() => {
                          saveToHistory();
                          setPhotoShape(shape.id);
                        }}
                        className={`p-3 rounded-xl text-center transition-all hover:scale-105 ${
                          photoShape === shape.id
                            ? 'bg-gradient-primary text-white shadow-lg ring-2 ring-purple-500'
                            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {/* Shape Preview */}
                        <div className={`w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-pink-400 to-purple-400 ${getPhotoShapeClass(shape.id)} overflow-hidden transition-all`}>
                          {shape.id === 'heart' && (
                            <div className="w-full h-full bg-gradient-to-br from-pink-400 to-purple-400"></div>
                          )}
                        </div>
                        <div className={`text-xs font-bold ${photoShape === shape.id ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{shape.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo Border */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Photo Border</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'none', label: 'None', desc: 'Clean', icon: '⭕' },
                      { id: 'classic', label: 'Classic', desc: 'White border', icon: '⚪' },
                      { id: 'metallic', label: 'Metallic', desc: 'Gold shimmer', icon: '✨' },
                      { id: 'scalloped', label: 'Scalloped', desc: 'Decorative', icon: '🌸' }
                    ].map(border => (
                      <button
                        key={border.id}
                        onClick={() => {
                          saveToHistory();
                          setPhotoBorder(border.id);
                          toast(`${border.label} border applied! ${border.icon}`);
                        }}
                        className={`p-3 rounded-xl text-left transition-all hover:scale-105 ${
                          photoBorder === border.id
                            ? 'bg-gradient-primary text-white shadow-xl ring-2 ring-purple-500'
                            : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {/* Border Preview */}
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 ${getPhotoBorderClass()} flex-shrink-0 transition-all`}></div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-bold text-sm mb-0.5 ${photoBorder === border.id ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                              {border.label} {border.icon}
                            </div>
                            <div className={`text-xs ${photoBorder === border.id ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
                              {border.desc}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Sticky */}
          <div className="flex-shrink-0 p-2 md:p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  saveToHistory();
                  // Reset to defaults
                  setSelectedBackground('pearl-elegance');
                  setSelectedLayout('classic');
                  setSelectedTypography('elegant');
                  setSelectedSpecialEffect('none');
                  setPhotoShape('circle');
                  setPhotoBorder('classic');
                  setCustomNameFont('');
                  setCustomBioFont('');
                  toast('Reset to default style', { icon: '↺' });
                }}
                className="flex-shrink-0 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-3 md:px-4 rounded-lg font-semibold text-xs md:text-sm transition-all"
                title="Reset to defaults"
              >
                <span className="hidden sm:inline">↺ Reset</span>
                <span className="sm:hidden">↺</span>
              </button>
              <button
                onClick={copyStyleCode}
                className="flex-shrink-0 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-3 md:px-4 rounded-lg font-semibold text-xs md:text-sm transition-all"
                title="Copy style code to share"
              >
                <span className="hidden sm:inline">📋 Copy</span>
                <span className="sm:hidden">📋</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-gradient-primary text-white py-2 px-4 rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                title="Save changes (Ctrl+S)"
              >
                {saving ? 'Saving...' : '💾 Save'}
              </button>
            </div>
            <p className="text-[10px] md:text-xs text-center text-gray-500 dark:text-gray-400">
              ⌨️ <span className="hidden sm:inline">Shortcuts: ESC to close • Ctrl+S to save • Ctrl+Z/Y to undo/redo • ← → to switch tabs</span>
              <span className="sm:hidden">ESC=close • Ctrl+S=save</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCustomizer;
