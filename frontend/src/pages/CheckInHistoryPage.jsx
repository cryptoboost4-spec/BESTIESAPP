import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import Header from '../components/Header';

const CheckInHistoryPage = () => {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, completed, alerted

  useEffect(() => {
    loadHistory();
  }, [currentUser, filter]);

  const loadHistory = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      let q = query(
        collection(db, 'checkins'),
        where('userId', '==', currentUser.uid)
      );

      if (filter === 'completed') {
        q = query(q, where('status', '==', 'completed'));
      } else if (filter === 'alerted') {
        q = query(q, where('status', '==', 'alerted'));
      }

      const snapshot = await getDocs(q);
      const checkIns = [];
      snapshot.forEach((doc) => {
        checkIns.push({ id: doc.id, ...doc.data() });
      });

      // Sort by created date (newest first)
      checkIns.sort((a, b) => {
        const aTime = a.createdAt?.toDate() || new Date(0);
        const bTime = b.createdAt?.toDate() || new Date(0);
        return bTime - aTime;
      });

      setHistory(checkIns);
      setLoading(false);
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success">✅ Safe</span>;
      case 'alerted':
        return <span className="badge badge-warning">🚨 Alerted</span>;
      case 'active':
        return <span className="badge badge-primary">⏰ Active</span>;
      default:
        return <span className="badge">Unknown</span>;
    }
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

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
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-display text-text-primary mb-2">Check-in History</h1>
          <p className="text-text-secondary">
            View all your past check-ins
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-white text-text-primary hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
              filter === 'completed'
                ? 'bg-success text-white'
                : 'bg-white text-text-primary hover:bg-gray-50'
            }`}
          >
            ✅ Safe
          </button>
          <button
            onClick={() => setFilter('alerted')}
            className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
              filter === 'alerted'
                ? 'bg-warning text-white'
                : 'bg-white text-text-primary hover:bg-gray-50'
            }`}
          >
            🚨 Alerted
          </button>
        </div>

        {/* Stats Summary */}
        <div className="card p-6 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-display text-primary">
                {history.length}
              </div>
              <div className="text-sm text-text-secondary">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display text-success">
                {history.filter(c => c.status === 'completed').length}
              </div>
              <div className="text-sm text-text-secondary">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display text-warning">
                {history.filter(c => c.status === 'alerted').length}
              </div>
              <div className="text-sm text-text-secondary">Alerted</div>
            </div>
          </div>
        </div>

        {/* History List */}
        {history.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-display text-text-primary mb-2">
              No check-ins yet
            </h2>
            <p className="text-text-secondary">
              Your check-in history will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((checkIn) => (
              <div key={checkIn.id} className="card p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display text-lg text-text-primary">
                        {checkIn.location}
                      </h3>
                      {getStatusBadge(checkIn.status)}
                    </div>
                    <div className="text-sm text-text-secondary">
                      {checkIn.createdAt && formatDistanceToNow(checkIn.createdAt.toDate(), { addSuffix: true })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-text-secondary">Duration</div>
                    <div className="font-semibold text-text-primary">
                      {formatDuration(checkIn.duration)}
                    </div>
                  </div>
                  <div>
                    <div className="text-text-secondary">Besties Notified</div>
                    <div className="font-semibold text-text-primary">
                      {checkIn.bestieIds?.length || 0}
                    </div>
                  </div>
                </div>

                {checkIn.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-sm text-text-secondary italic">
                      "{checkIn.notes}"
                    </div>
                  </div>
                )}

                {checkIn.completedAt && (
                  <div className="mt-3 text-xs text-success">
                    ✅ Completed {formatDistanceToNow(checkIn.completedAt.toDate(), { addSuffix: true })}
                  </div>
                )}

                {checkIn.alertedAt && (
                  <div className="mt-3 text-xs text-warning">
                    🚨 Alert sent {formatDistanceToNow(checkIn.alertedAt.toDate(), { addSuffix: true })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckInHistoryPage;
