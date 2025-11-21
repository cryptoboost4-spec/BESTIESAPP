import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import ProfileWithBubble from './ProfileWithBubble';

const BestieCard = ({ bestie, onRemove }) => {
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
      <div className="relative group">
        {/* Redesigned Bestie Card - Beautiful gradient borders */}
        <div className={`card p-5 transition-all duration-300 hover:shadow-2xl border-2 ${
          bestie.isFavorite
            ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50'
            : 'border-gray-200 hover:border-purple-200'
        }`}>
          <div className="flex items-center gap-4">
            {/* Profile Picture - Clickable */}
            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileMenu(!showProfileMenu);
                }}
                className="relative focus:outline-none focus:ring-4 focus:ring-purple-300 rounded-full transition-all hover:scale-105"
              >
                {loading ? (
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 animate-pulse rounded-full"></div>
                ) : (
                  <ProfileWithBubble
                    photoURL={userPhoto}
                    name={bestie.name || bestie.phone || 'Unknown'}
                    requestAttention={requestAttention}
                    size="xl"
                    showBubble={true}
                  />
                )}
                {/* Click indicator */}
                <div className="absolute inset-0 rounded-full border-2 border-purple-400 opacity-0 group-hover:opacity-30 pointer-events-none animate-ping"></div>
              </button>

              {/* Profile Picture Menu - Opens below profile */}
              {showProfileMenu && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-purple-200 z-50 min-w-[200px] overflow-hidden animate-scale-up">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProfileMenu(false);
                      navigate(`/user/${bestie.userId}`);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-purple-50 text-sm font-semibold text-gray-700 flex items-center gap-2 transition-colors first:rounded-t-xl"
                  >
                    <span className="text-lg">👤</span>
                    <span>View Profile</span>
                  </button>
                  <button
                    onClick={handleToggleCircle}
                    className="w-full text-left px-4 py-3 hover:bg-purple-50 text-sm font-semibold text-gray-700 flex items-center gap-2 transition-colors"
                  >
                    <span className="text-lg">{bestie.isFavorite ? '💔' : '💜'}</span>
                    <span>{bestie.isFavorite ? 'Remove from Circle' : 'Add to Circle'}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (bestie.phone) {
                        window.location.href = `sms:${bestie.phone}`;
                      }
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-green-50 text-sm font-semibold text-green-700 flex items-center gap-2 transition-colors"
                  >
                    <span className="text-lg">💬</span>
                    <span>Send Message</span>
                  </button>
                  <div className="border-t border-gray-200"></div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProfileMenu(false);
                      setShowDeleteModal(true);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-red-50 text-sm font-semibold text-red-600 flex items-center gap-2 transition-colors last:rounded-b-xl"
                  >
                    <span className="text-lg">🗑️</span>
                    <span>Remove Bestie</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bestie Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-gray-900 truncate">
                    {bestie.name || bestie.phone || 'Unknown'}
                  </h3>
                  {bestie.phone && (
                    <p className="text-sm text-gray-600 truncate">{bestie.phone}</p>
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
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              💡 Tap profile picture for options
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-display text-text-primary mb-2">Remove Bestie?</h2>
            <p className="text-text-secondary mb-4">
              Are you sure you want to remove <strong>{bestie.name || bestie.phone}</strong> from your besties?
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800 mb-2">
                ⚠️ Type <strong>"see ya"</strong> or <strong>"bye bye"</strong> to confirm
              </p>
              <input
                type="text"
                value={deleteChallenge}
                onChange={(e) => setDeleteChallenge(e.target.value)}
                className="w-full px-3 py-2 border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none"
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
