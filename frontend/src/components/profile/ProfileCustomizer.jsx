import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import toast from 'react-hot-toast';
import { BACKGROUNDS, getCategoryName, BACKGROUND_CATEGORIES } from './themes/backgrounds';
import { loadGoogleFonts } from './themes/typography';
import { getLayoutById } from './layouts';
import './themes/backgroundPatterns.css';

// Google Fonts list for dropdowns
const GOOGLE_FONTS = [
  { family: 'Playfair Display', category: 'Serif' },
  { family: 'Merriweather', category: 'Serif' },
  { family: 'Lora', category: 'Serif' },
  { family: 'Crimson Text', category: 'Serif' },
  { family: 'EB Garamond', category: 'Serif' },
  { family: 'Cormorant', category: 'Serif' },
  { family: 'Inter', category: 'Sans Serif' },
  { family: 'Poppins', category: 'Sans Serif' },
  { family: 'Montserrat', category: 'Sans Serif' },
  { family: 'Quicksand', category: 'Sans Serif' },
  { family: 'Work Sans', category: 'Sans Serif' },
  { family: 'Raleway', category: 'Sans Serif' },
  { family: 'Open Sans', category: 'Sans Serif' },
  { family: 'Roboto', category: 'Sans Serif' },
  { family: 'Nunito', category: 'Sans Serif' },
  { family: 'Archivo Black', category: 'Display' },
  { family: 'Fredoka One', category: 'Display' },
  { family: 'Bebas Neue', category: 'Display' },
  { family: 'Righteous', category: 'Display' },
  { family: 'Permanent Marker', category: 'Display' },
  { family: 'Dancing Script', category: 'Script' },
  { family: 'Pacifico', category: 'Script' },
  { family: 'Great Vibes', category: 'Script' },
  { family: 'Satisfy', category: 'Script' },
  { family: 'Caveat', category: 'Script' }
];

const FONT_SIZES = [
  { id: 'xs', label: 'XS', nameClass: 'text-2xl', bioClass: 'text-xs' },
  { id: 'sm', label: 'S', nameClass: 'text-3xl', bioClass: 'text-sm' },
  { id: 'md', label: 'M', nameClass: 'text-4xl', bioClass: 'text-base' },
  { id: 'lg', label: 'L', nameClass: 'text-5xl', bioClass: 'text-lg' },
  { id: 'xl', label: 'XL', nameClass: 'text-6xl', bioClass: 'text-xl' }
];

const ProfileCustomizer = ({ currentUser, userData, onClose }) => {
  const [activeTab, setActiveTab] = useState('backgrounds');
  const [selectedBackground, setSelectedBackground] = useState(userData?.profile?.customization?.background || 'pearl-elegance');

  // Font customization
  const [nameFont, setNameFont] = useState(userData?.profile?.customization?.nameFont || 'Playfair Display');
  const [bioFont, setBioFont] = useState(userData?.profile?.customization?.bioFont || 'Inter');
  const [nameSize, setNameSize] = useState(userData?.profile?.customization?.nameSize || 'md');
  const [bioSize, setBioSize] = useState(userData?.profile?.customization?.bioSize || 'md');

  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Load fonts when they change
  useEffect(() => {
    const fonts = new Set();
    if (nameFont) fonts.add(nameFont.replace(/ /g, '+') + ':wght@300;400;700');
    if (bioFont) fonts.add(bioFont.replace(/ /g, '+') + ':wght@300;400;700');

    if (fonts.size > 0) {
      const fontString = Array.from(fonts).join('&family=');
      const linkId = 'profile-custom-fonts';

      const existingLink = document.getElementById(linkId);
      if (existingLink) existingLink.remove();

      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${fontString}&display=swap`;
      document.head.appendChild(link);
    }
  }, [nameFont, bioFont]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        'profile.customization': {
          background: selectedBackground,
          layout: 'magazine', // Always magazine
          nameFont,
          bioFont,
          nameSize,
          bioSize,
          // Keep old fields for backward compatibility
          typography: 'elegant',
          photoShape: 'circle',
          photoBorder: 'classic'
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

  const currentBackground = getBackgroundById(selectedBackground);
  const LayoutComponent = getLayoutById('magazine');

  const nameSizeClass = FONT_SIZES.find(s => s.id === nameSize)?.nameClass || 'text-4xl';
  const bioSizeClass = FONT_SIZES.find(s => s.id === bioSize)?.bioClass || 'text-base';

  const layoutProps = {
    profilePhoto: userData?.photoURL,
    displayName: userData?.displayName || 'Your Name',
    bio: userData?.profile?.bio || 'Your bio will appear here',
    badges: userData?.featuredBadges?.slice(0, 3) || [],
    stats: {
      besties: userData?.totalBesties || 0,
      checkIns: userData?.checkInCount || 0
    },
    nameStyle: { fontFamily: nameFont },
    bioStyle: { fontFamily: bioFont },
    nameSizeClass,
    bioSizeClass,
    photoShape: 'circle',
    photoBorder: 'classic',
    decorativeElements: []
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-0">
      {/* Mobile Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 md:hidden">
          <button
            onClick={() => setShowPreview(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl"
          >
            ✕
          </button>
          <div className="max-w-sm w-full">
            <div
              className={`profile-card-pattern pattern-${currentBackground?.pattern || 'none'}`}
              style={{ background: currentBackground?.gradient || '#fff' }}
            >
              <LayoutComponent {...layoutProps} />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 w-full h-full md:h-auto md:max-w-6xl md:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
        {/* LIVE PREVIEW - Desktop Left, Hidden on Mobile */}
        <div className="hidden md:flex md:w-2/5 bg-gray-50 dark:bg-gray-800 p-6 items-center justify-center border-r border-gray-200 dark:border-gray-700">
          <div className="w-full max-w-sm">
            <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-3 text-center">Preview</h3>
            <div
              className={`profile-card-pattern pattern-${currentBackground?.pattern || 'none'} rounded-2xl overflow-hidden shadow-xl`}
              style={{ background: currentBackground?.gradient || '#fff' }}
            >
              <LayoutComponent {...layoutProps} />
            </div>
          </div>
        </div>

        {/* OPTIONS PANEL */}
        <div className="flex-1 flex flex-col h-full md:h-auto">
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

            {/* Tab Navigation */}
            <div className="overflow-x-auto px-4 pb-3">
              <div className="flex gap-2 min-w-max">
                {[
                  { id: 'backgrounds', label: 'Backgrounds', emoji: '🎨' },
                  { id: 'fonts', label: 'Fonts', emoji: '🔤' }
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
                            <div
                              className="h-24 flex items-center justify-center relative"
                              style={{ background: bg.gradient }}
                            >
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

            {/* FONTS TAB */}
            {activeTab === 'fonts' && (
              <div className="space-y-6">
                {/* Name Font */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Name Font</h3>
                  <select
                    value={nameFont}
                    onChange={(e) => setNameFont(e.target.value)}
                    className="w-full p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold"
                    style={{ fontFamily: nameFont }}
                  >
                    {GOOGLE_FONTS.map(font => (
                      <option
                        key={font.family}
                        value={font.family}
                        style={{ fontFamily: font.family }}
                      >
                        {font.family} ({font.category})
                      </option>
                    ))}
                  </select>

                  {/* Name Size Picker */}
                  <div className="mt-3">
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">Name Size</label>
                    <div className="flex gap-2">
                      {FONT_SIZES.map(size => (
                        <button
                          key={size.id}
                          onClick={() => setNameSize(size.id)}
                          className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all ${
                            nameSize === size.id
                              ? 'bg-gradient-primary text-white shadow-lg'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {size.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name Preview */}
                  <div className="mt-3 p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                    <p className={`${nameSizeClass} font-bold text-gray-900 dark:text-white`} style={{ fontFamily: nameFont }}>
                      {userData?.displayName || 'Your Name'}
                    </p>
                  </div>
                </div>

                {/* Bio Font */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Bio Font</h3>
                  <select
                    value={bioFont}
                    onChange={(e) => setBioFont(e.target.value)}
                    className="w-full p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    style={{ fontFamily: bioFont }}
                  >
                    {GOOGLE_FONTS.map(font => (
                      <option
                        key={font.family}
                        value={font.family}
                        style={{ fontFamily: font.family }}
                      >
                        {font.family} ({font.category})
                      </option>
                    ))}
                  </select>

                  {/* Bio Size Picker */}
                  <div className="mt-3">
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">Bio Size</label>
                    <div className="flex gap-2">
                      {FONT_SIZES.map(size => (
                        <button
                          key={size.id}
                          onClick={() => setBioSize(size.id)}
                          className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all ${
                            bioSize === size.id
                              ? 'bg-gradient-primary text-white shadow-lg'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {size.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bio Preview */}
                  <div className="mt-3 p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                    <p className={`${bioSizeClass} text-gray-700 dark:text-gray-300`} style={{ fontFamily: bioFont }}>
                      {userData?.profile?.bio || 'Your bio will appear here with this beautiful font!'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Sticky */}
          <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex gap-2">
            {/* Mobile Preview Button */}
            <button
              onClick={() => setShowPreview(true)}
              className="md:hidden flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg font-semibold text-sm"
            >
              👁️ Preview
            </button>
            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gradient-primary text-white py-2 px-4 rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
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
