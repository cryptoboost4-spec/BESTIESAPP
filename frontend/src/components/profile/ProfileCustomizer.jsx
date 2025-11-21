import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import toast from 'react-hot-toast';
import { BACKGROUNDS, getCategoryName, BACKGROUND_CATEGORIES } from './themes/backgrounds';
import { TYPOGRAPHY_STYLES, loadGoogleFonts, getTypographyById } from './themes/typography';
import { LAYOUT_OPTIONS } from './layouts';
import { VIBE_PRESETS } from './themes/vibePresets';
import './themes/backgroundPatterns.css';

const ProfileCustomizer = ({ currentUser, userData, onClose }) => {
  const [activeTab, setActiveTab] = useState('vibes'); // vibes, backgrounds, layouts, typography
  const [selectedVibe, setSelectedVibe] = useState(null);
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
          photoBorder
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

  const applyVibePreset = (vibe) => {
    setSelectedVibe(vibe.id);
    setSelectedBackground(vibe.background);
    setSelectedLayout(vibe.layout);
    setSelectedTypography(vibe.typography);
    setPhotoShape(vibe.photoShape);
    setPhotoBorder(vibe.photoBorder);
    toast('Vibe applied! ✨', { icon: vibe.emoji });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white dark:bg-gray-900 w-full md:max-w-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-screen md:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-display bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Customize Your Vibe ✨
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
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
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-primary text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* VIBES TAB */}
          {activeTab === 'vibes' && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Choose a complete vibe - one tap to style everything! 🎨
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {VIBE_PRESETS.map(vibe => (
                  <button
                    key={vibe.id}
                    onClick={() => applyVibePreset(vibe)}
                    className={`p-4 rounded-xl text-left transition-all hover:scale-105 ${
                      selectedVibe === vibe.id
                        ? 'bg-gradient-primary text-white shadow-xl ring-2 ring-purple-500'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="text-3xl mb-2">{vibe.emoji}</div>
                    <div className="font-display text-sm font-bold mb-1">{vibe.name}</div>
                    <div className="text-xs opacity-80">{vibe.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* BACKGROUNDS TAB */}
          {activeTab === 'backgrounds' && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Pick your perfect background aesthetic 🎨
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
                          className={`h-24 rounded-xl shadow-md hover:scale-105 transition-all relative overflow-hidden ${
                            selectedBackground === bg.id
                              ? 'ring-4 ring-purple-500'
                              : ''
                          }`}
                          style={{ background: bg.gradient }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-white drop-shadow-lg bg-black/30 px-2 py-1 rounded">
                              {bg.name}
                            </span>
                          </div>
                          {selectedBackground === bg.id && (
                            <div className="absolute top-2 right-2 bg-white rounded-full w-6 h-6 flex items-center justify-center text-purple-600">
                              ✓
                            </div>
                          )}
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
                Choose how your profile looks 📱
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {LAYOUT_OPTIONS.map(layout => (
                  <button
                    key={layout.id}
                    onClick={() => setSelectedLayout(layout.id)}
                    className={`p-4 rounded-xl text-left transition-all hover:scale-105 ${
                      selectedLayout === layout.id
                        ? 'bg-gradient-primary text-white shadow-xl ring-2 ring-purple-500'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="text-2xl mb-2">{layout.emoji}</div>
                    <div className="font-display font-bold mb-1">{layout.name}</div>
                    <div className="text-xs opacity-80">{layout.description}</div>
                    <div className="text-xs opacity-60 mt-1">{layout.preview}</div>
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
                    className={`w-full p-4 rounded-xl text-left transition-all hover:scale-102 ${
                      selectedTypography === typo.id
                        ? 'bg-gradient-primary text-white shadow-xl ring-2 ring-purple-500'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{typo.emoji}</span>
                      <div className="flex-1">
                        <div className="font-bold">{typo.name}</div>
                        <div className="text-xs opacity-80">{typo.description}</div>
                      </div>
                      {selectedTypography === typo.id && <span>✓</span>}
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
                      className={`p-4 rounded-xl text-center transition-all ${
                        photoShape === shape.id
                          ? 'bg-gradient-primary text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="text-2xl mb-1">{shape.icon}</div>
                      <div className="text-xs">{shape.label}</div>
                    </button>
                  ))}
                </div>
              </div>

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
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="font-bold text-sm">{border.label}</div>
                      <div className="text-xs opacity-80">{border.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Save Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-primary text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save My Style ✨'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCustomizer;
