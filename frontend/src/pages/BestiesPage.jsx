import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import Header from '../components/Header';
import BestieCard from '../components/BestieCard';
import AddBestieModal from '../components/AddBestieModal';
import BestieRequestCard from '../components/BestieRequestCard';

const BestiesPage = () => {
  const { currentUser } = useAuth();
  const [besties, setBesties] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Listen to accepted besties (real-time updates)
    const requesterQuery = query(
      collection(db, 'besties'),
      where('requesterId', '==', currentUser.uid),
      where('status', '==', 'accepted')
    );

    const recipientQuery = query(
      collection(db, 'besties'),
      where('recipientId', '==', currentUser.uid),
      where('status', '==', 'accepted')
    );

    // Listen to both queries in real-time
    const unsubscribeRequester = onSnapshot(requesterQuery, (snapshot) => {
      const bestiesList = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        bestiesList.push({
          id: doc.id,
          userId: data.recipientId,
          name: data.recipientName || 'Unknown',
          phone: data.recipientPhone,
          role: 'added',
        });
      });

      // Get recipient besties too
      getDocs(recipientQuery).then((recipientSnapshot) => {
        recipientSnapshot.forEach((doc) => {
          const data = doc.data();
          bestiesList.push({
            id: doc.id,
            userId: data.requesterId,
            name: data.requesterName || 'Unknown',
            phone: data.requesterPhone,
            role: 'guardian',
          });
        });

        setBesties(bestiesList);
        setLoading(false);
      }).catch((error) => {
        console.error('Error loading recipient besties:', error);
        setBesties(bestiesList); // Show at least requester besties
        setLoading(false);
      });
    }, (error) => {
      console.error('Error loading besties:', error);
      setBesties([]);
      setLoading(false);
    });

    // Listen to pending requests (where current user is recipient)
    const pendingQuery = query(
      collection(db, 'besties'),
      where('recipientId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
      const requests = [];
      snapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      setPendingRequests(requests);
    });

    // Cleanup both listeners
    return () => {
      unsubscribeRequester();
      unsubscribePending();
    };
  }, [currentUser]);

  const topBesties = besties.slice(0, 5);
  const otherBesties = besties.slice(5);

  if (loading) {
    return (
      <div className="min-h-screen bg-pattern">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pattern">
      <Header />

      <div className="max-w-4xl mx-auto p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-3xl font-display text-text-primary mb-2">Your Besties</h1>
          <p className="text-text-secondary">
            Manage your safety network
          </p>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-display text-text-primary mb-4">
              Pending Requests ({pendingRequests.length})
            </h2>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <BestieRequestCard key={request.id} request={request} />
              ))}
            </div>
          </div>
        )}

        {/* Top 5 Besties (Circle) */}
        {topBesties.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-display text-text-primary mb-4">
              Circle Besties (Top 5)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {topBesties.map((bestie) => (
                <BestieCard key={bestie.id} bestie={bestie} />
              ))}
            </div>
          </div>
        )}

        {/* Other Besties */}
        {otherBesties.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-display text-text-primary mb-4">
              Other Besties
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {otherBesties.map((bestie) => (
                <BestieCard key={bestie.id} bestie={bestie} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {besties.length === 0 && pendingRequests.length === 0 && (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">💜</div>
            <h2 className="text-2xl font-display text-text-primary mb-2">
              No besties yet!
            </h2>
            <p className="text-text-secondary mb-6">
              Add friends who'll have your back when you need them
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              Add Your First Bestie
            </button>
          </div>
        )}

        {/* Add Bestie Button */}
        {besties.length > 0 && (
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full btn btn-primary"
          >
            ➕ Add Another Bestie
          </button>
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fab"
        title="Add bestie"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Add Bestie Modal */}
      {showAddModal && (
        <AddBestieModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
};

export default BestiesPage;
