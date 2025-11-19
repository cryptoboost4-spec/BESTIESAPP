import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const BestieCircle = ({ userId, onAddClick }) => {
  const navigate = useNavigate();
  const [allBesties, setAllBesties] = useState([]);
  const [circleBesties, setCircleBesties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showReplaceModal, setShowReplaceModal] = useState(false);

  const loadBesties = async () => {
    if (!userId) return;

    try {
      // Get all accepted besties
      const [requesterQuery, recipientQuery] = await Promise.all([
        getDocs(
          query(
            collection(db, 'besties'),
            where('requesterId', '==', userId),
            where('status', '==', 'accepted')
          )
        ),
        getDocs(
          query(
            collection(db, 'besties'),
            where('recipientId', '==', userId),
            where('status', '==', 'accepted')
          )
        ),
      ]);

      const bestiesList = [];

      for (const docSnap of requesterQuery.docs) {
        const data = docSnap.data();
        const userDoc = await getDoc(doc(db, 'users', data.recipientId));
        bestiesList.push({
          id: data.recipientId,
          name: userDoc.exists() ? userDoc.data().displayName : 'Bestie',
          photoURL: userDoc.exists() ? userDoc.data().photoURL : null,
        });
      }

      for (const docSnap of recipientQuery.docs) {
        const data = docSnap.data();
        const userDoc = await getDoc(doc(db, 'users', data.requesterId));
        bestiesList.push({
          id: data.requesterId,
          name: userDoc.exists() ? userDoc.data().displayName : 'Bestie',
          photoURL: userDoc.exists() ? userDoc.data().photoURL : null,
        });
      }

      setAllBesties(bestiesList);

      // Get user's featured circle
      const userDoc = await getDoc(doc(db, 'users', userId));
      const featuredIds = userDoc.exists() ? (userDoc.data().featuredCircle || []) : [];

      // Map featured IDs to bestie objects
      const featured = featuredIds
        .map(id => bestiesList.find(b => b.id === id))
        .filter(Boolean);

      // If less than what user has, auto-fill with first few besties
      if (featured.length < bestiesList.length && featured.length < 5) {
        const remaining = bestiesList.filter(b => !featuredIds.includes(b.id));
        featured.push(...remaining.slice(0, 5 - featured.length));
      }

      setCircleBesties(featured.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Error loading besties:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBesties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const saveFeaturedCircle = async (newCircle) => {
    const featuredIds = newCircle.map(b => b.id);
    await updateDoc(doc(db, 'users', userId), {
      featuredCircle: featuredIds,
    });
  };

  const handleRemoveFromCircle = async (index) => {
    const newCircle = circleBesties.filter((_, i) => i !== index);
    setCircleBesties(newCircle);
    await saveFeaturedCircle(newCircle);
    setSelectedSlot(null);
    toast.success('Removed from circle');
  };

  const handleReplaceBestie = async (newBestie) => {
    const newCircle = [...circleBesties];
    newCircle[selectedSlot] = newBestie;
    setCircleBesties(newCircle);
    await saveFeaturedCircle(newCircle);
    setShowReplaceModal(false);
    setSelectedSlot(null);
    toast.success('Bestie replaced');
  };

  const handleViewProfile = (bestieId) => {
    navigate(`/user/${bestieId}`);
    setSelectedSlot(null);
  };

  const slots = Array.from({ length: 5 }, (_, i) => circleBesties[i] || null);

  // Different colors for each bestie slot
  const slotColors = [
    'bg-pink-500',      // Slot 0 - Pink
    'bg-purple-500',    // Slot 1 - Purple
    'bg-blue-500',      // Slot 2 - Blue
    'bg-green-500',     // Slot 3 - Green
    'bg-orange-500',    // Slot 4 - Orange
  ];

  if (loading) {
    return (
      <div className="card p-8 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="card p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 border-2 border-purple-100">
      <h3 className="text-center text-2xl font-display text-gradient mb-6">Your Safety Circle ⭐</h3>

      {/* Circle Container - Responsive sizing */}
      <div className="relative w-full max-w-sm mx-auto aspect-square">
        <div className="absolute inset-0">
          {/* Connection Lines */}
          {slots.map((bestie, index) => {
            if (!bestie) return null;
            const angle = (index * 72 - 90) * (Math.PI / 180);
            const radius = 45; // Percentage-based radius
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);

            return (
              <svg
                key={`line-${index}`}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 0 }}
              >
                <line
                  x1="50%"
                  y1="50%"
                  x2={`${x}%`}
                  y2={`${y}%`}
                  stroke="url(#gradient)"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  opacity="0.3"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
            );
          })}

          {/* Center Circle (YOU) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-primary rounded-full flex items-center justify-center text-white text-base md:text-lg font-display shadow-2xl border-4 border-white ring-4 ring-purple-200 animate-pulse-gentle">
              YOU
            </div>
          </div>

          {/* Bestie Slots - all equidistant from center */}
          {slots.map((bestie, index) => {
            const angle = (index * 72 - 90) * (Math.PI / 180);
            const radius = 45; // Percentage-based for better responsiveness
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);

            return (
              <div
                key={index}
                className="absolute"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {bestie ? (
                  <div className="relative group">
                    {/* Bestie Circle - clickable with unique color, responsive size */}
                    <button
                      onClick={() => setSelectedSlot(selectedSlot === index ? null : index)}
                      className={`relative w-16 h-16 md:w-20 md:h-20 ${slotColors[index]} rounded-full flex items-center justify-center text-white text-xl md:text-2xl font-display shadow-xl border-4 border-white hover:scale-110 hover:shadow-2xl transition-all duration-300 overflow-hidden ring-2 ring-purple-200 hover:ring-4 hover:ring-purple-300`}
                    >
                      {bestie.photoURL ? (
                        <img src={bestie.photoURL} alt={bestie.name || 'Bestie'} className="w-full h-full object-cover" />
                      ) : (
                        bestie.name?.[0] || '?'
                      )}
                      {/* Subtle pulse effect on hover */}
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-full"></div>
                    </button>

                    {/* Name Tooltip - improved */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 transform group-hover:-translate-y-1">
                      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-lg">
                        {bestie.name || 'Unknown'}
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-pink-600"></div>
                      </div>
                    </div>

                    {/* Action Menu */}
                    {selectedSlot === index && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-lg shadow-xl border-2 border-gray-200 p-2 z-[200] w-36">
                        <button
                          onClick={() => handleViewProfile(bestie.id)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm font-semibold text-gray-700"
                        >
                          👤 View Profile
                        </button>
                        <button
                          onClick={() => setShowReplaceModal(true)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm font-semibold text-gray-700"
                        >
                          🔄 Replace
                        </button>
                        <button
                          onClick={() => handleRemoveFromCircle(index)}
                          className="w-full text-left px-3 py-2 hover:bg-red-50 rounded text-sm font-semibold text-red-600"
                        >
                          ❌ Remove
                        </button>
                      </div>
                    )}
                  </div>
                ) : onAddClick ? (
                  <button
                    onClick={onAddClick}
                    className={`w-16 h-16 md:w-20 md:h-20 border-4 border-dashed ${slotColors[index].replace('bg-', 'border-')} rounded-full flex items-center justify-center ${slotColors[index].replace('bg-', 'text-')} text-3xl md:text-4xl font-bold hover:scale-110 hover:bg-purple-100 transition-all shadow-lg hover:shadow-xl animate-pulse-slow`}
                    title="Add a bestie to your circle"
                  >
                    +
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info - Enhanced */}
      <div className="text-center mt-8">
        <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border-2 border-purple-200 mb-2">
          <span className="text-2xl">⭐</span>
          <span className="font-display text-lg text-gradient font-bold">
            {circleBesties.length}/5 Circle Members
          </span>
        </div>
        <div className="text-sm text-gray-600 mt-2">
          {circleBesties.length === 5
            ? "Your circle is complete! 🎉"
            : circleBesties.length === 0
            ? "Start building your safety network"
            : `Add ${5 - circleBesties.length} more to complete your circle`}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse-gentle {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.03);
          }
        }
        .animate-pulse-gentle {
          animation: pulse-gentle 3s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>

      {/* Replace Modal */}
      {showReplaceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReplaceModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-display mb-4">Replace with:</h3>
            <div className="space-y-2">
              {allBesties
                .filter(b => !circleBesties.find(cb => cb.id === b.id))
                .map(bestie => (
                  <button
                    key={bestie.id}
                    onClick={() => handleReplaceBestie(bestie)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 bg-gradient-secondary rounded-full flex items-center justify-center text-white font-display overflow-hidden">
                      {bestie.photoURL ? (
                        <img src={bestie.photoURL} alt={bestie.name || 'Bestie'} className="w-full h-full object-cover" />
                      ) : (
                        bestie.name?.[0] || '?'
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{bestie.name || 'Unknown'}</div>
                    </div>
                  </button>
                ))}
              {allBesties.filter(b => !circleBesties.find(cb => cb.id === b.id)).length === 0 && (
                <p className="text-center text-gray-500 py-4">All besties are in your circle!</p>
              )}
            </div>
            <button
              onClick={() => setShowReplaceModal(false)}
              className="mt-4 w-full btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BestieCircle;
