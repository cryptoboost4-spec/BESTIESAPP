import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import ProfileWithBubble from './ProfileWithBubble';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useAuth } from '../contexts/AuthContext';

const BestieCard = ({ bestie, onRemove }) => {
  const { isDark } = useDarkMode();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userPhoto, setUserPhoto] = useState(null);
  const [requestAttention, setRequestAttention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteChallenge, setDeleteChallenge] = useState('');
  const menuRef = useRef(null);

  // Fetch user's profile photo and request attention status
  useEffect(() => {
    const fetchUserData = async () => {
      if (!bestie?.userId) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', bestie.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserPhoto(userData.photoURL);
          setRequestAttention(userData.requestAttention);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [bestie?.userId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfileMenu]);

  const handleToggleCircle = async (e) => {
    e.stopPropagation();
    setShowProfileMenu(false);

    try {
      const newIsFavorite = !bestie.isFavorite;
      
      // Update isFavorite on besties document
      await updateDoc(doc(db, 'besties', bestie.id), {
        isFavorite: newIsFavorite,
      });
      
      // Also update featuredCircle on user document (this is what actually controls the circle)
      // Use bestie.userId (the actual user ID), not bestie.id (the bestie document ID)
      if (currentUser && bestie.userId) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const currentFeaturedCircle = userDoc.data().featuredCircle || [];
          let updatedFeaturedCircle;
          
          if (newIsFavorite) {
            // Add to circle (max 5)
            if (!currentFeaturedCircle.includes(bestie.userId) && currentFeaturedCircle.length < 5) {
              updatedFeaturedCircle = [...currentFeaturedCircle, bestie.userId];
            } else {
              updatedFeaturedCircle = currentFeaturedCircle; // Already in circle or at max
            }
          } else {
            // Remove from circle
            updatedFeaturedCircle = currentFeaturedCircle.filter(id => id !== bestie.userId);
          }
          
          await updateDoc(userDocRef, {
            featuredCircle: updatedFeaturedCircle
          });
        }
      }
      
      toast.success(bestie.isFavorite ? 'Removed from circle' : 'Added to circle!');
    } catch (error) {
      console.error('Error toggling circle:', error);
      toast.error('Failed to update circle');
    }
  };

  const handleRemove = async () => {
    const expectedPhrases = ['see ya', 'bye bye'];
    const normalized = deleteChallenge.toLowerCase().trim();

    if (!expectedPhrases.includes(normalized)) {
      toast.error(`Please type "${expectedPhrases[0]}" or "${expectedPhrases[1]}" to confirm`);
      return;
    }

    try {
      await deleteDoc(doc(db, 'besties', bestie.id));
      toast.success('Bestie removed');
      setShowDeleteModal(false);
      if (onRemove) onRemove(bestie.id);
    } catch (error) {
      console.error('Error removing bestie:', error);
      toast.error('Failed to remove bestie');
    }
  };

  // Safety check: return null if bestie is undefined/null
  if (!bestie) {
    return null;
  }

  return (
    <>
      {/* Redesigned Bestie Card with gradient aesthetic */}
      <div className="relative group">
        {/* Gradient glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-300 via-purple-300 to-pink-300 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>

        <div className="relative card p-5 bg-gradient-to-br from-pink-50/50 via-purple-50/50 to-pink-50/50 dark:from-pink-900/10 dark:via-purple-900/10 dark:to-pink-900/10 border-2 border-pink-200 dark:border-pink-600 hover:shadow-xl transition-all hover:transform hover:-translate-y-1 min-h-[280px] flex flex-col">
          {/* Circle badge - top right */}
          {bestie.isFavorite && (
            <div className="absolute top-3 right-3">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                ⭐ Circle
              </div>
            </div>
          )}

          {/* Profile section */}
          <div className="text-center mb-4 flex-1 flex flex-col justify-center">
            {loading ? (
              <div className="w-20 h-20 bg-gradient-to-br from-pink-200 to-purple-200 animate-pulse rounded-full mx-auto mb-3"></div>
            ) : (
              <div className="relative inline-block" ref={menuRef}>
                {/* Click on profile picture to show menu */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileMenu(!showProfileMenu);
                  }}
                  className="cursor-pointer"
                >
                  <ProfileWithBubble
                    photoURL={userPhoto}
                    name={bestie.name || bestie.phone || 'Unknown'}
                    requestAttention={requestAttention}
                    size="xl"
                    showBubble={true}
                  />
                </div>

                {/* Dropdown Menu - appears below profile picture */}
                {showProfileMenu && (
                  <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-2xl border-2 z-50 min-w-[180px]`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowProfileMenu(false);
                        navigate(`/user/${bestie.userId}`);
                      }}
                      className={`w-full text-left px-4 py-2.5 ${isDark ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-100 text-gray-700'} text-sm font-semibold first:rounded-t-xl`}
                    >
                      👤 View Profile
                    </button>
                    <button
                      onClick={handleToggleCircle}
                      className={`w-full text-left px-4 py-2.5 ${isDark ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-100 text-gray-700'} text-sm font-semibold`}
                    >
                      {bestie.isFavorite ? '💔 Remove from Circle' : '💜 Add to Circle'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const phone = bestie.phone;
                        if (phone) {
                          window.location.href = `sms:${phone}`;
                        } else {
                          toast.error('No phone number available');
                        }
                        setShowProfileMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 ${isDark ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-100 text-gray-700'} text-sm font-semibold`}
                    >
                      💬 Send Message
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowProfileMenu(false);
                        setShowDeleteModal(true);
                      }}
                      className={`w-full text-left px-4 py-2.5 ${isDark ? 'hover:bg-red-900/30' : 'hover:bg-red-50'} text-sm font-semibold text-red-600 last:rounded-b-xl`}
                    >
                      🗑️ Delete Bestie
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Name */}
            <div
              className="cursor-pointer mt-3"
              onClick={() => bestie.userId && navigate(`/user/${bestie.userId}`)}
            >
              <h3 className="font-display text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
                {bestie.name || 'Unknown'}
              </h3>
              {bestie.phone && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {bestie.phone}
                </p>
              )}
            </div>
          </div>

          {/* Placeholder for indicators - will be added by parent */}
          <div className="bestie-indicators-slot"></div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl max-w-md w-full p-6`}>
            <h2 className={`text-2xl font-display ${isDark ? 'text-gray-100' : 'text-text-primary'} mb-2`}>Remove Bestie?</h2>
            <p className="text-text-secondary mb-4">
              Are you sure you want to remove <strong>{bestie.name || bestie.phone}</strong> from your besties?
            </p>

            <div className={`${isDark ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-3 mb-4`}>
              <p className={`text-sm ${isDark ? 'text-yellow-300' : 'text-yellow-800'} mb-2`}>
                ⚠️ Type <strong>"see ya"</strong> or <strong>"bye bye"</strong> to confirm
              </p>
              <input
                type="text"
                value={deleteChallenge}
                onChange={(e) => setDeleteChallenge(e.target.value)}
                className={`w-full px-3 py-2 border-2 ${isDark ? 'border-yellow-600 bg-gray-700 text-gray-100 focus:border-yellow-500' : 'border-yellow-300 bg-white text-gray-900 focus:border-yellow-500'} rounded-lg focus:outline-none`}
                placeholder="Type here..."
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteChallenge('');
                }}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                className="flex-1 btn bg-red-500 text-white hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BestieCard;
