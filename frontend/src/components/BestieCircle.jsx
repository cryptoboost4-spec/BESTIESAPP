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

  if (loading) {
    return (
      <div className="card p-8 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      {/* Circle Container - Made smaller for tighter spacing */}
      <div className="relative w-full max-w-xs mx-auto" style={{ paddingBottom: '100%' }}>
        <div className="absolute inset-0">
          {/* Center Circle (YOU) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white text-sm font-display shadow-lg border-2 border-white">
              YOU
            </div>
          </div>

          {/* Bestie Slots - closer to center */}
          {slots.map((bestie, index) => {
            const angle = (index * 72 - 90) * (Math.PI / 180);
            const radius = 80; // Reduced from 100 for tighter spacing
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
                    {/* Bestie Circle - clickable */}
                    <button
                      onClick={() => setSelectedSlot(selectedSlot === index ? null : index)}
                      className="relative w-14 h-14 bg-gradient-secondary rounded-full flex items-center justify-center text-white text-lg font-display shadow-lg border-2 border-white hover:scale-110 transition-transform overflow-hidden"
                    >
                      {bestie.photoURL ? (
                        <img src={bestie.photoURL} alt={bestie.name} className="w-full h-full object-cover" />
                      ) : (
                        bestie.name[0]
                      )}
                    </button>

                    {/* Name Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      <div className="bg-text-primary text-white px-2 py-1 rounded-lg text-xs whitespace-nowrap">
                        {bestie.name}
                      </div>
                    </div>

                    {/* Action Menu */}
                    {selectedSlot === index && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-lg shadow-xl border-2 border-gray-200 p-2 z-30 w-36">
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
                    className="w-14 h-14 border-3 border-dashed border-primary/40 rounded-full flex items-center justify-center text-primary text-xl hover:border-primary hover:bg-primary/10 transition-all hover:scale-110"
                  >
                    +
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <div className="text-center mt-6">
        <div className="font-display text-base text-text-primary mb-1">
          {circleBesties.length}/5 Besties in Circle
        </div>
        <div className="text-xs text-text-secondary">
          Your featured safety network ⭐
        </div>
      </div>

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
                        <img src={bestie.photoURL} alt={bestie.name} className="w-full h-full object-cover" />
                      ) : (
                        bestie.name[0]
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{bestie.name}</div>
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
