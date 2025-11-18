import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const BestieCircle = ({ userId, onAddClick }) => {
  const [besties, setBesties] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBesties = async () => {
    if (!userId) return;

    try {
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

      requesterQuery.forEach((doc) => {
        const data = doc.data();
        bestiesList.push({
          id: data.recipientId,
          name: data.recipientName || 'Bestie',
        });
      });

      recipientQuery.forEach((doc) => {
        const data = doc.data();
        bestiesList.push({
          id: data.requesterId,
          name: data.requesterName || 'Bestie',
        });
      });

      setBesties(bestiesList.slice(0, 5));
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

  const slots = Array.from({ length: 5 }, (_, i) => besties[i] || null);

  if (loading) {
    return (
      <div className="card p-8 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="card p-8">
      {/* Circle Container */}
      <div className="relative w-full max-w-sm mx-auto" style={{ paddingBottom: '100%' }}>
        <div className="absolute inset-0">
          {/* Center Circle */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-display shadow-lg">
              YOU
            </div>
          </div>

          {/* Bestie Slots */}
          {slots.map((bestie, index) => {
            const angle = (index * 72 - 90) * (Math.PI / 180);
            const radius = 100;
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
                    {/* Star Animation */}
                    <div className="absolute -inset-2 animate-pulse">
                      <svg className="w-full h-full text-primary opacity-50" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>

                    {/* Bestie Circle */}
                    <div className="relative w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center text-white text-xl font-display shadow-lg border-2 border-white">
                      {bestie.name[0]}
                    </div>

                    {/* Name Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-text-primary text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap">
                        {bestie.name}
                      </div>
                    </div>
                  </div>
                ) : onAddClick ? (
                  <button
                    onClick={onAddClick}
                    className="w-16 h-16 border-4 border-dashed border-primary/30 rounded-full flex items-center justify-center text-primary text-2xl hover:border-primary hover:bg-primary/5 transition-all hover:scale-110"
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
      <div className="text-center mt-8">
        <div className="font-display text-lg text-text-primary mb-1">
          {besties.length}/5 Besties
        </div>
        <div className="text-sm text-text-secondary">
          Your top 5 safety network ⭐
        </div>
      </div>
    </div>
  );
};

export default BestieCircle;
