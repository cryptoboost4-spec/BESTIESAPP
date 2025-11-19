import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const BestieCard = ({ bestie, onRemove }) => {
  const navigate = useNavigate();
  const [userPhoto, setUserPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteChallenge, setDeleteChallenge] = useState('');
  const menuRef = useRef(null);

  // Fetch user's profile photo
  useEffect(() => {
    const fetchUserPhoto = async () => {
      if (!bestie?.userId) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', bestie.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserPhoto(userData.photoURL);
        }
      } catch (error) {
        console.error('Error fetching user photo:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPhoto();
  }, [bestie?.userId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleToggleCircle = async (e) => {
    e.stopPropagation();
    setShowMenu(false);

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

  const handleClick = (e) => {
    // Don't navigate if clicking on menu button
    if (e.target.closest('.menu-button')) {
      return;
    }
    if (bestie.userId) {
      navigate(`/user/${bestie.userId}`);
    }
  };

  // Get first character safely
  const getInitial = () => {
    if (bestie.name && typeof bestie.name === 'string' && bestie.name.length > 0) {
      return bestie.name[0].toUpperCase();
    }
    if (bestie.phone && typeof bestie.phone === 'string' && bestie.phone.length > 0) {
      return bestie.phone[0];
    }
    return '?';
  };

  return (
    <>
      <div
        className="card p-4 cursor-pointer hover:shadow-lg transition-all hover:transform hover:-translate-y-1 relative"
        onClick={handleClick}
      >
        {/* Menu Button */}
        <div className="absolute top-3 right-3" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="menu-button w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-xl border-2 border-gray-200 z-50 min-w-[160px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  navigate(`/user/${bestie.userId}`);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-semibold text-gray-700 first:rounded-t-lg"
              >
                👤 View Profile
              </button>
              <button
                onClick={handleToggleCircle}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-semibold text-gray-700"
              >
                {bestie.isFavorite ? '💔 Remove from Circle' : '💜 Add to Circle'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  setShowDeleteModal(true);
                }}
                className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm font-semibold text-red-600 last:rounded-b-lg"
              >
                🗑️ Remove Bestie
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-display text-lg flex-shrink-0 overflow-hidden">
            {loading ? (
              <div className="w-full h-full bg-gray-200 animate-pulse"></div>
            ) : userPhoto ? (
              <img
                src={userPhoto}
                alt={bestie.name || 'Bestie'}
                className="w-full h-full object-cover"
              />
            ) : (
              getInitial()
            )}
          </div>
          <div className="flex-1 min-w-0 pr-8">
            <div className="font-semibold text-text-primary truncate">
              {bestie.name || bestie.phone || 'Unknown'}
            </div>
            <div className="text-sm text-text-secondary truncate">
              {bestie.phone || 'No phone'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="badge badge-primary text-xs">
            💜 Bestie
          </div>
          {bestie.isFavorite && (
            <div className="badge bg-purple-100 text-purple-700 text-xs">
              ⭐ Circle
            </div>
          )}
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
