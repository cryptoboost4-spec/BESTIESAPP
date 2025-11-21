import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import ProfileWithBubble from './ProfileWithBubble';
import { useDarkMode } from '../contexts/DarkModeContext';

const BestieCard = ({ bestie, onRemove }) => {
  const { isDark } = useDarkMode();
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
      await updateDoc(doc(db, 'besties', bestie.id), {
        isFavorite: !bestie.isFavorite,
      });
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
      <div
        className="card p-4 hover:shadow-lg transition-all hover:transform hover:-translate-y-1 relative"
      >
        <div className="flex items-center gap-3 mb-3">
          {loading ? (
            <div className="w-12 h-12 bg-gray-200 animate-pulse rounded-full flex-shrink-0"></div>
          ) : (
            <div className="relative" ref={menuRef}>
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
                  size="lg"
                  showBubble={true}
                />
              </div>

              {/* Dropdown Menu - appears below profile picture */}
              {showProfileMenu && (
                <div className={`absolute top-full left-0 mt-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-xl border-2 z-50 min-w-[180px]`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProfileMenu(false);
                      navigate(`/user/${bestie.userId}`);
                    }}
                    className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-100 text-gray-700'} text-sm font-semibold first:rounded-t-lg`}
                  >
                    👤 View Profile
                  </button>
                  <button
                    onClick={handleToggleCircle}
                    className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-100 text-gray-700'} text-sm font-semibold`}
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
                    className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-100 text-gray-700'} text-sm font-semibold`}
                  >
                    💬 Send Message
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProfileMenu(false);
                      setShowDeleteModal(true);
                    }}
                    className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-red-900/30' : 'hover:bg-red-50'} text-sm font-semibold text-red-600 last:rounded-b-lg`}
                  >
                    🗑️ Delete Bestie
                  </button>
                </div>
              )}
            </div>
          )}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => bestie.userId && navigate(`/user/${bestie.userId}`)}
          >
            <div className="font-semibold text-text-primary truncate">
              {bestie.name || bestie.phone || 'Unknown'}
            </div>

            {/* Bestie Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-lg ${isDark ? 'text-gray-100' : 'text-gray-900'} truncate`}>
                    {bestie.name || bestie.phone || 'Unknown'}
                  </h3>
                  {bestie.phone && (
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} truncate`}>{bestie.phone}</p>
                  )}
                </div>
                {bestie.isFavorite && (
                  <div className="flex-shrink-0">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                      ⭐ Circle
                    </div>
                  </div>
                )}
              </div>

              {/* Status badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="badge bg-gradient-to-r from-pink-100 to-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold">
                  💜 Bestie
                </div>
                {bestie.role === 'guardian' && (
                  <div className="badge bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold">
                    🛡️ Guardian
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hover hint */}
          <div className={`mt-3 pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} text-center`}>
              💡 Tap profile picture for options
            </p>
          </div>
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
