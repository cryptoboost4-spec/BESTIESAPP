import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import toast from 'react-hot-toast';
import { BACKGROUNDS, getCategoryName, BACKGROUND_CATEGORIES } from './themes/backgrounds';
import { TYPOGRAPHY_STYLES, loadGoogleFonts, getTypographyById, getNameStyle, getBioStyle } from './themes/typography';
import { LAYOUT_OPTIONS, getLayoutById } from './layouts';
import { SPECIAL_EFFECTS, getSpecialEffectById } from './themes/specialEffects';
import './themes/backgroundPatterns.css';

const ProfileCustomizer = ({ currentUser, userData, onClose }) => {
  const [activeTab, setActiveTab] = useState('vibes');
  const [selectedSpecialEffect, setSelectedSpecialEffect] = useState(userData?.profile?.customization?.specialEffect || 'none');
  const [selectedBackground, setSelectedBackground] = useState(userData?.profile?.customization?.background || 'pearl-elegance');
  const [selectedLayout, setSelectedLayout] = useState(userData?.profile?.customization?.layout || 'classic');
  const [selectedTypography, setSelectedTypography] = useState(userData?.profile?.customization?.typography || 'elegant');
  const [photoShape, setPhotoShape] = useState(userData?.profile?.customization?.photoShape || 'circle');
  const [photoBorder, setPhotoBorder] = useState(userData?.profile?.customization?.photoBorder || 'classic');
  const [saving, setSaving] = useState(false);

  // Load fonts when typography changes
  useEffect(() => {
    const typography = getTypographyById(selectedTypography);
    if (typography) {
      loadGoogleFonts(typography);
    }
  }, [selectedTypography]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        'profile.customization': {
          background: selectedBackground,
          layout: selectedLayout,
          typography: selectedTypography,
          photoShape,
          photoBorder,
          specialEffect: selectedSpecialEffect
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
  };


  const getBackgroundById = (id) => {
    const allBackgrounds = Object.values(BACKGROUNDS).flat();
    return allBackgrounds.find(bg => bg.id === id);
  };

  // Get current selections for preview
  const currentBackground = getBackgroundById(selectedBackground);
  const currentTypography = getTypographyById(selectedTypography);
  const currentSpecialEffect = getSpecialEffectById(selectedSpecialEffect);
  const LayoutComponent = getLayoutById(selectedLayout);

  const layoutProps = {
    profilePhoto: userData?.photoURL,
    displayName: userData?.displayName || 'Your Name',
    bio: userData?.profile?.bio || 'Your bio will appear here',
    badges: userData?.featuredBadges?.slice(0, 3) || [],
    stats: {
      besties: userData?.totalBesties || 0,
      checkIns: userData?.checkInCount || 0
    },
    nameStyle: currentTypography ? getNameStyle(currentTypography) : {},
    bioStyle: currentTypography ? getBioStyle(currentTypography) : {},
    nameSizeClass: currentTypography?.nameSizeClass || 'text-4xl',
    bioSizeClass: currentTypography?.bioSizeClass || 'text-lg',
    photoShape,
    photoBorder,
    decorativeElements: currentSpecialEffect?.decorativeElements || []
  };

  const getPhotoShapeClass = () => {
    const shapes = {
      circle: 'rounded-full',
      square: 'rounded-none',
      rounded: 'rounded-2xl',
      heart: 'rounded-full'
    };
    return shapes[photoShape] || 'rounded-full';
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
      <div className="bg-white dark:bg-gray-900 w-full h-full md:h-auto md:max-w-6xl md:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
        {/* LIVE PREVIEW - Always visible, top on mobile (50% height), left on desktop */}
        <div className="flex md:w-2/5 h-1/2 md:h-auto bg-gray-50 dark:bg-gray-800 p-3 md:p-6 items-center justify-center border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
          <div className="w-full max-w-sm">
            <h3 className="text-xs md:text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 md:mb-3 text-center">Live Preview</h3>
            <div
              className={`profile-card-pattern pattern-${currentBackground?.pattern || 'none'} rounded-2xl overflow-hidden shadow-xl scale-75 md:scale-100 origin-top`}
              style={{ background: currentBackground?.gradient || '#fff' }}
            >
              <LayoutComponent {...layoutProps} />
            </div>
          </div>
        </div>

        {/* OPTIONS PANEL - Takes remaining 50% on mobile, 3/5 on desktop */}
        <div className="flex-1 flex flex-col h-1/2 md:h-auto">
          {/* Header - Sticky */}
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between p-4">
              <h2 className="text-lg md:text-xl font-display bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Customize ✨
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Tab Navigation - Scrollable */}
            <div className="overflow-x-auto px-4 pb-3">
              <div className="flex gap-2 min-w-max">
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
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-primary text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {tab.emoji} {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* VIBES TAB - Special Effects */}
            {activeTab === 'vibes' && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Add special effects to your profile ✨
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SPECIAL_EFFECTS.map(effect => {
                    return (
                      <button
                        key={effect.id}
                        onClick={() => {
                          setSelectedSpecialEffect(effect.id);
                          toast(`${effect.name} effect applied! ${effect.emoji}`);
                        }}
                        className={`relative overflow-hidden rounded-xl transition-all hover:scale-105 ${
                          selectedSpecialEffect === effect.id
                            ? 'ring-4 ring-purple-500 bg-gradient-primary'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        {/* Effect Preview */}
                        <div className="h-32 p-3 flex flex-col items-center justify-center text-center relative">
                          {/* Show decorative elements preview */}
                          {effect.decorativeElements && effect.decorativeElements.length > 0 && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
                              {effect.decorativeElements.slice(0, 4).map((element, index) => (
                                <div
                                  key={index}
                                  className="absolute"
                                  style={{
                                    left: `${element.x}%`,
                                    top: `${element.y}%`,
                                    width: element.size * 0.6 || 16,
                                    height: element.size * 0.6 || 16,
                                    color: element.color || 'currentColor',
                                    opacity: element.opacity || 0.8,
                                    transform: 'translate(-50%, -50%)'
                                  }}
                                  dangerouslySetInnerHTML={{ __html: element.svg }}
                                />
                              ))}
                            </div>
                          )}
                          <div className={`text-4xl mb-2 z-10 relative ${selectedSpecialEffect === effect.id ? 'animate-bounce' : ''}`}>
                            {effect.emoji}
                          </div>
                          <div className={`text-sm font-bold z-10 relative ${selectedSpecialEffect === effect.id ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                            {effect.name}
                          </div>
                          <div className={`text-xs z-10 relative mt-1 ${selectedSpecialEffect === effect.id ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
                            {effect.description}
                          </div>
                          {selectedSpecialEffect === effect.id && (
                            <div className="absolute top-2 right-2 bg-white rounded-full w-6 h-6 flex items-center justify-center text-purple-600 z-10">
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
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Pick your aesthetic 🎨
                </p>
                {BACKGROUND_CATEGORIES.map(category => {
                  const backgrounds = BACKGROUNDS[category] || [];
                  if (backgrounds.length === 0) return null;

                  return (
                    <div key={category} className="mb-6">
                      <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                        {getCategoryName(category)}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {backgrounds.map(bg => (
                          <button
                            key={bg.id}
                            onClick={() => setSelectedBackground(bg.id)}
                            className={`relative overflow-hidden rounded-xl transition-all hover:scale-105 ${
                              selectedBackground === bg.id ? 'ring-4 ring-purple-500' : ''
                            }`}
                          >
                            {/* Mini Card Preview */}
                            <div
                              className="h-24 flex items-center justify-center relative"
                              style={{ background: bg.gradient }}
                            >
                              {/* Tiny profile preview */}
                              <div className="flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full bg-white/80 mb-1"></div>
                                <div className="text-[10px] font-bold text-white drop-shadow-lg bg-black/30 px-2 py-0.5 rounded">
                                  {bg.name}
                                </div>
                              </div>
                              {selectedBackground === bg.id && (
                                <div className="absolute top-2 right-2 bg-white rounded-full w-5 h-5 flex items-center justify-center text-purple-600 text-xs">
                                  ✓
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* LAYOUTS TAB */}
            {activeTab === 'layouts' && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Choose your layout style 📱
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {LAYOUT_OPTIONS.map(layout => (
                    <button
                      key={layout.id}
                      onClick={() => setSelectedLayout(layout.id)}
                      className={`p-4 rounded-xl text-left transition-all hover:scale-105 ${
                        selectedLayout === layout.id
                          ? 'bg-gradient-primary text-white shadow-xl ring-2 ring-purple-500'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      {/* Wireframe Preview */}
                      <div className="mb-3 h-20 bg-white/20 dark:bg-black/20 rounded-lg flex items-center justify-center">
                        <div className="text-3xl">{layout.emoji}</div>
                      </div>
                      <div className="font-display font-bold mb-1">{layout.name}</div>
                      <div className="text-xs opacity-80">{layout.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TYPOGRAPHY TAB */}
            {activeTab === 'typography' && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Pick your font style 🔤
                </p>
                <div className="space-y-3">
                  {TYPOGRAPHY_STYLES.map(typo => (
                    <button
                      key={typo.id}
                      onClick={() => setSelectedTypography(typo.id)}
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
              </div>
            )}

            {/* PHOTO TAB */}
            {activeTab === 'photo' && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Customize your photo style 📸
                </p>

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
                        onClick={() => setPhotoShape(shape.id)}
                        className={`p-3 rounded-xl text-center transition-all ${
                          photoShape === shape.id
                            ? 'bg-gradient-primary text-white shadow-lg'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        {/* Shape Preview */}
                        <div className={`w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-pink-400 to-purple-400 ${getPhotoShapeClass()}`}></div>
                        <div className="text-xs font-bold">{shape.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo Border */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Photo Border</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'none', label: 'None', desc: 'Clean' },
                      { id: 'classic', label: 'Classic', desc: 'White border' },
                      { id: 'metallic', label: 'Metallic', desc: 'Gold shimmer' },
                      { id: 'scalloped', label: 'Scalloped', desc: 'Decorative' }
                    ].map(border => (
                      <button
                        key={border.id}
                        onClick={() => setPhotoBorder(border.id)}
                        className={`p-3 rounded-xl text-left transition-all ${
                          photoBorder === border.id
                            ? 'bg-gradient-primary text-white shadow-lg'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        {/* Border Preview */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 ${getPhotoBorderClass()}`}></div>
                          <div className="flex-1">
                            <div className="font-bold text-sm">{border.label}</div>
                            <div className="text-xs opacity-80">{border.desc}</div>
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
          <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            {/* Save Button - Full width since preview is now always visible */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-primary text-white py-2 px-4 rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : '💾 Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCustomizer;
