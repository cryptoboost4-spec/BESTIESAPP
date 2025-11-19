import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

const BestieCard = ({ bestie }) => {
  const navigate = useNavigate();
  const [userPhoto, setUserPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Safety check: return null if bestie is undefined/null
  if (!bestie) {
    return null;
  }

  const handleClick = () => {
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
    <div
      className="card p-4 cursor-pointer hover:shadow-lg transition-all hover:transform hover:-translate-y-1"
      onClick={handleClick}
    >
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
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-text-primary truncate">
            {bestie.name || bestie.phone || 'Unknown'}
          </div>
          <div className="text-sm text-text-secondary truncate">
            {bestie.phone || 'No phone'}
          </div>
        </div>
      </div>

      <div className="badge badge-primary text-xs">
        💜 Bestie
      </div>
    </div>
  );
};

export default BestieCard;
