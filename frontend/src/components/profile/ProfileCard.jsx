import React, { useState, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import { getLayoutById } from './layouts';
import { getTypographyById, getNameStyle, getBioStyle } from './themes/typography';
import { BACKGROUNDS } from './themes/backgrounds';
import './themes/backgroundPatterns.css';

const ProfileCustomizer = lazy(() => import('./ProfileCustomizer'));

const GRADIENT_OPTIONS = [
  { id: 'pink', name: 'Pink Dream', gradient: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)' },
  { id: 'purple', name: 'Purple Magic', gradient: 'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%)' },
  { id: 'blue', name: 'Ocean Blue', gradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' },
  { id: 'green', name: 'Fresh Green', gradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' },
  { id: 'sunset', name: 'Sunset Glow', gradient: 'linear-gradient(135deg, #fed7aa 0%, #fca5a5 100%)' },
  { id: 'lavender', name: 'Lavender Fields', gradient: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)' },
  { id: 'peach', name: 'Peachy Keen', gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' },
  { id: 'mint', name: 'Mint Fresh', gradient: 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)' }
];

const AURA_OPTIONS = [
  { id: 'none', name: 'None', emoji: '🚫', description: 'No animation' },
  { id: 'shimmer', name: 'Shimmer', emoji: '✨', description: 'Subtle shimmering effect' },
  { id: 'glow', name: 'Glow', emoji: '🌟', description: 'Soft pulsing glow' },
  { id: 'sparkle', name: 'Sparkle', emoji: '💫', description: 'Sparkling particles' },
  { id: 'pulse', name: 'Pulse', emoji: '💗', description: 'Gentle pulsing' },
  { id: 'rainbow', name: 'Rainbow', emoji: '🌈', description: 'Rainbow border effect' }
];

const ProfileCard = ({ currentUser, userData }) => {
  const navigate = useNavigate();
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAuraPicker, setShowAuraPicker] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const fileInputRef = useRef(null);

  const currentGradient = userData?.profile?.backgroundGradient || GRADIENT_OPTIONS[0].gradient;
  const currentAura = userData?.profile?.aura || 'none';

  // Get customization settings
  const customization = userData?.profile?.customization || {};
  const layoutId = customization.layout || 'classic';
  const backgroundId = customization.background || null;
  const typographyId = customization.typography || 'playful';

  // Get the selected background or fall back to gradient
  const getBackgroundById = (id) => {
    const allBackgrounds = Object.values(BACKGROUNDS).flat();
    return allBackgrounds.find(bg => bg.id === id);
  };

  const selectedBackground = backgroundId ? getBackgroundById(backgroundId) : null;
  const backgroundStyle = selectedBackground ? selectedBackground.gradient : currentGradient;
  const patternClass = selectedBackground ? `pattern-${selectedBackground.pattern}` : '';

  // Get typography settings
  const typography = getTypographyById(typographyId);
  const nameStyle = typography ? getNameStyle(typography) : {};
  const bioStyle = typography ? getBioStyle(typography) : {};
  const nameSizeClass = typography?.nameSizeClass || 'text-4xl';
  const bioSizeClass = typography?.bioSizeClass || 'text-lg';

  // Get layout component
  const LayoutComponent = getLayoutById(layoutId);

  // Use customization photo settings or defaults
  const photoShape = customization.photoShape || 'circle';
  const photoBorder = customization.photoBorder || 'classic';

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `profile-pictures/${currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'users', currentUser.uid), {
        photoURL: downloadURL,
      });

      toast.success('Profile picture updated!');
      setShowPhotoMenu(false);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        photoURL: currentUser?.photoURL || null,
      });

      toast.success('Profile picture removed');
      setShowPhotoMenu(false);
    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error('Failed to remove photo');
    }
  };

  const handleColorChange = async (gradient) => {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        'profile.backgroundGradient': gradient.gradient,
      });
      toast.success(`Background changed to ${gradient.name}!`);
      setShowColorPicker(false);
    } catch (error) {
      console.error('Error updating background:', error);
      toast.error('Failed to update background');
    }
  };

  const handleAuraChange = async (aura) => {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        'profile.aura': aura.id,
      });
      toast.success(`Aura changed to ${aura.name}! ${aura.emoji}`);
      setShowAuraPicker(false);
    } catch (error) {
      console.error('Error updating aura:', error);
      toast.error('Failed to update aura');
    }
  };

  const handleShareProfileCard = async () => {
    const profileCard = document.getElementById('profile-card-shareable');
    if (!profileCard) {
      toast.error('Could not capture profile card');
      return;
    }

    try {
      toast('Generating image...', { icon: '📸' });

      const canvas = await html2canvas(profileCard, {
        backgroundColor: null,
        scale: 2,
        logging: false,
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to generate image');
          return;
        }

        if (navigator.share && navigator.canShare({ files: [new File([blob], 'profile.png', { type: 'image/png' })] })) {
          const file = new File([blob], 'my-besties-profile.png', { type: 'image/png' });
          navigator.share({
            title: 'My Besties Profile',
            text: 'Check out my Besties profile! 💜',
            files: [file],
          }).then(() => {
            toast.success('Profile card shared! 💜');
          }).catch((err) => {
            if (err.name !== 'AbortError') {
              downloadImage(blob);
            }
          });
        } else {
          downloadImage(blob);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error sharing profile card:', error);
      toast.error('Failed to share profile card');
    }
  };

  const downloadImage = (blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-besties-profile.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Profile card downloaded! 📥');
  };

  // Prepare data for layout component
  const layoutProps = {
    profilePhoto: userData?.photoURL,
    displayName: userData?.displayName,
    bio: userData?.profile?.bio,
    badges: userData?.featuredBadges || [],
    stats: {
      besties: userData?.totalBesties || 0,
      checkIns: userData?.checkInCount || 0
    },
    nameStyle,
    bioStyle,
    nameSizeClass,
    bioSizeClass,
    photoShape,
    photoBorder,
    decorativeElements: customization.decorativeElements || []
  };

  return (
    <>
      <div
        id="profile-card-shareable"
        className={`card mb-6 relative overflow-hidden shadow-2xl profile-card-aura-${currentAura} profile-card-pattern ${patternClass} max-h-80`}
        style={{ background: backgroundStyle }}
      >
        {/* Action Buttons */}
        <div className="absolute top-4 right-4 color-picker-container flex flex-col gap-2 z-20">
          {/* Customize Button */}
          <button
            onClick={() => setShowCustomizer(true)}
            className="w-10 h-10 rounded-full bg-gradient-primary text-white backdrop-blur-sm shadow-xl flex items-center justify-center hover:scale-110 transition-all text-lg"
            title="Customize your vibe"
          >
            ✨
          </button>
        <button
          onClick={() => navigate('/edit-profile')}
          className="w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl flex items-center justify-center hover:scale-110 transition-all hover:bg-white dark:hover:bg-gray-800 text-xl"
          title="Edit profile"
        >
          ✏️
        </button>

        {/* Color Picker Button */}
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl flex items-center justify-center hover:scale-110 transition-all hover:bg-white dark:hover:bg-gray-800"
          title="Change background color"
        >
          🎨
        </button>

        {/* Aura Picker Button */}
        <button
          onClick={() => setShowAuraPicker(!showAuraPicker)}
          className="w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl flex items-center justify-center hover:scale-110 transition-all hover:bg-white dark:hover:bg-gray-800"
          title="Change profile aura"
        >
          ✨
        </button>

        {showColorPicker && (
          <>
            <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40" onClick={() => setShowColorPicker(false)} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-600 p-4 z-50 w-80 max-h-[500px] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-display text-gray-800 dark:text-gray-200">Choose Background</h3>
                <button
                  onClick={() => setShowColorPicker(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {GRADIENT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleColorChange(option)}
                    className="h-16 rounded-lg shadow-md hover:scale-105 transition-transform border-2 border-transparent hover:border-primary"
                    style={{ background: option.gradient }}
                    title={option.name}
                  >
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 drop-shadow-sm">
                      {option.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {showAuraPicker && (
          <div className="aura-picker-container">
            <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40" onClick={() => setShowAuraPicker(false)} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-600 p-4 z-50 w-80 max-h-[500px] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-display text-gray-800 dark:text-gray-200">Choose Profile Aura ✨</h3>
                <button
                  onClick={() => setShowAuraPicker(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                {AURA_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAuraChange(option)}
                    className={`w-full p-3 rounded-lg shadow-md hover:scale-105 transition-transform border-2 text-left ${
                      (userData?.profile?.aura || 'none') === option.id
                        ? 'border-primary bg-purple-50 dark:bg-purple-900/30'
                        : 'border-transparent hover:border-primary bg-gray-50 dark:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.emoji}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 dark:text-gray-200">{option.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{option.description}</div>
                      </div>
                      {(userData?.profile?.aura || 'none') === option.id && (
                        <span className="text-primary">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

        {/* Photo Management Menu - Floating */}
        {showPhotoMenu && (
          <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setShowPhotoMenu(false)}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-600 p-4 w-64">
              <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Manage Photo</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                  setShowPhotoMenu(false);
                }}
                disabled={uploading}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                🔄 Replace Photo
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemovePhoto();
                }}
                className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-sm font-semibold text-red-600 dark:text-red-400"
              >
                ❌ Remove Photo
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />

        {/* Dynamic Layout Component */}
        <LayoutComponent {...layoutProps} />

      {/* Social Sharing Icons - Cute & Small */}
      <div className="mt-6 relative z-10">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">Share your profile:</p>

        {/* Download Card Button */}
        <button
          onClick={handleShareProfileCard}
          className="mb-3 px-4 py-2 bg-gradient-primary text-white rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          📸 Download Profile Card
        </button>

        <div className="flex gap-2 justify-center flex-wrap">
          {/* Facebook */}
          <button
            onClick={() => {
              const url = `${window.location.origin}/user/${currentUser.uid}`;
              const text = `Come be my bestie on Besties! 💜`;
              const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

              if (isMobile) {
                // Try to open Facebook app first
                window.location.href = `fb://profile/${currentUser.uid}`;
                // Fallback to web after a delay
                setTimeout(() => {
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank');
                }, 1500);
              } else {
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank');
              }
            }}
            className="w-8 h-8 rounded-full bg-[#1877f2] hover:bg-[#1864d9] text-white flex items-center justify-center transition-all shadow-md hover:shadow-lg hover:scale-110"
            title="Share on Facebook"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>

          {/* Twitter/X */}
          <button
            onClick={() => {
              const url = `${window.location.origin}/user/${currentUser.uid}`;
              const text = `Come be my bestie on Besties! 💜`;
              const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

              if (isMobile) {
                // Try to open Twitter app first
                window.location.href = `twitter://post?message=${encodeURIComponent(text + ' ' + url)}`;
                // Fallback to web after a delay
                setTimeout(() => {
                  window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
                }, 1500);
              } else {
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
              }
            }}
            className="w-8 h-8 rounded-full bg-black hover:bg-gray-800 text-white flex items-center justify-center transition-all shadow-md hover:shadow-lg hover:scale-110"
            title="Share on X (Twitter)"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </button>

          {/* WhatsApp */}
          <button
            onClick={() => {
              const url = `${window.location.origin}/user/${currentUser.uid}`;
              const text = `Come be my bestie on Besties! 💜`;
              const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

              if (isMobile) {
                // Try to open WhatsApp app first
                window.location.href = `whatsapp://send?text=${encodeURIComponent(text + ' ' + url)}`;
                // Fallback to web after a delay
                setTimeout(() => {
                  window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
                }, 1500);
              } else {
                window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
              }
            }}
            className="w-8 h-8 rounded-full bg-[#25d366] hover:bg-[#20bd5a] text-white flex items-center justify-center transition-all shadow-md hover:shadow-lg hover:scale-110"
            title="Share on WhatsApp"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </button>

          {/* Instagram - Copy Link */}
          <button
            onClick={() => {
              const url = `${window.location.origin}/user/${currentUser.uid}`;
              navigator.clipboard.writeText(url);
              toast.success('Profile link copied! Share it on Instagram 💜');
            }}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] hover:opacity-90 text-white flex items-center justify-center transition-all shadow-md hover:shadow-lg hover:scale-110"
            title="Copy link for Instagram"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </button>

          {/* Copy Link Button */}
          <button
            onClick={() => {
              const url = `${window.location.origin}/user/${currentUser.uid}`;
              navigator.clipboard.writeText(url);
              toast.success('Profile link copied to clipboard!');
            }}
            className="w-8 h-8 rounded-full bg-gray-600 hover:bg-gray-700 text-white flex items-center justify-center transition-all shadow-md hover:shadow-lg hover:scale-110"
            title="Copy link"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
      </div>

      {/* Profile Customizer Modal */}
      {showCustomizer && (
        <Suspense fallback={null}>
          <ProfileCustomizer
            currentUser={currentUser}
            userData={userData}
            onClose={() => setShowCustomizer(false)}
          />
        </Suspense>
      )}
    </>
  );
};

export default ProfileCard;
