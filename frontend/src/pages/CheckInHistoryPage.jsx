import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import Header from '../components/Header';

const ITEMS_PER_PAGE = 20;

const CheckInHistoryPage = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('all'); // all, completed, alerted
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, filter]);

  const loadHistory = async (loadMore = false) => {
    if (!currentUser) return;

    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setHistory([]);
      setLastDoc(null);
      setHasMore(true);
    }

    try {
      let q = query(
        collection(db, 'checkins'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(ITEMS_PER_PAGE)
      );

      if (filter === 'completed') {
        q = query(
          collection(db, 'checkins'),
          where('userId', '==', currentUser.uid),
          where('status', '==', 'completed'),
          orderBy('createdAt', 'desc'),
          limit(ITEMS_PER_PAGE)
        );
      } else if (filter === 'alerted') {
        q = query(
          collection(db, 'checkins'),
          where('userId', '==', currentUser.uid),
          where('status', '==', 'alerted'),
          orderBy('createdAt', 'desc'),
          limit(ITEMS_PER_PAGE)
        );
      }

      // If loading more, start after the last document
      if (loadMore && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const checkIns = [];
      snapshot.forEach((doc) => {
        checkIns.push({ id: doc.id, ...doc.data() });
      });

      // Update state
      if (loadMore) {
        setHistory(prev => [...prev, ...checkIns]);
      } else {
        setHistory(checkIns);
      }

      // Update pagination state
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(checkIns.length === ITEMS_PER_PAGE);

      setLoading(false);
      setLoadingMore(false);
    } catch (error) {
      console.error('Error loading history:', error);
      if (!loadMore) setHistory([]);
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    loadHistory(true);
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
      <div className="min-h-screen bg-pattern dark:bg-dark-pattern">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pattern dark:bg-dark-pattern">
      <Header />

      <div className="max-w-4xl mx-auto p-4 pb-20">
        {/* Back Button - Top */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-primary dark:text-dark-primary hover:underline mb-4 font-semibold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-display text-text-primary dark:text-dark-text-primary mb-2">Check-in History</h1>
          <p className="text-text-secondary dark:text-dark-text-secondary">
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
                : 'bg-white dark:bg-dark-card text-text-primary dark:text-dark-text-primary hover:bg-gray-50 dark:hover:bg-dark-hover'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
              filter === 'completed'
                ? 'bg-success text-white'
                : 'bg-white dark:bg-dark-card text-text-primary dark:text-dark-text-primary hover:bg-gray-50 dark:hover:bg-dark-hover'
            }`}
          >
            ✅ Safe
          </button>
          <button
            onClick={() => setFilter('alerted')}
            className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
              filter === 'alerted'
                ? 'bg-warning text-white'
                : 'bg-white dark:bg-dark-card text-text-primary dark:text-dark-text-primary hover:bg-gray-50 dark:hover:bg-dark-hover'
            }`}
          >
            🚨 Alerted
          </button>
        </div>

        {/* Stats Summary - loads from user document (efficient!) */}
        <div className="card dark:bg-dark-card p-6 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-display text-primary dark:text-dark-primary">
                {userData?.stats?.totalCheckIns || 0}
              </div>
              <div className="text-sm text-text-secondary dark:text-dark-text-secondary">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display text-success dark:text-dark-success">
                {userData?.stats?.completedCheckIns || 0}
              </div>
              <div className="text-sm text-text-secondary dark:text-dark-text-secondary">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display text-warning dark:text-dark-warning">
                {userData?.stats?.alertedCheckIns || 0}
              </div>
              <div className="text-sm text-text-secondary dark:text-dark-text-secondary">Alerted</div>
            </div>
          </div>
        </div>

        {/* History List */}
        {history.length === 0 ? (
          <div className="card dark:bg-dark-card p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-display text-text-primary dark:text-dark-text-primary mb-2">
              No check-ins yet
            </h2>
            <p className="text-text-secondary dark:text-dark-text-secondary">
              Your check-in history will appear here
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {history.map((checkIn) => (
                <div key={checkIn.id} className="card dark:bg-dark-card p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display text-lg text-text-primary dark:text-dark-text-primary">
                          {checkIn.location}
                        </h3>
                        {getStatusBadge(checkIn.status)}
                      </div>
                      <div className="text-sm text-text-secondary dark:text-dark-text-secondary">
                        {checkIn.createdAt && formatDistanceToNow(checkIn.createdAt.toDate(), { addSuffix: true })}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-text-secondary dark:text-dark-text-secondary">Duration</div>
                      <div className="font-semibold text-text-primary dark:text-dark-text-primary">
                        {formatDuration(checkIn.duration)}
                      </div>
                    </div>
                    <div>
                      <div className="text-text-secondary dark:text-dark-text-secondary">Besties Notified</div>
                      <div className="font-semibold text-text-primary dark:text-dark-text-primary">
                        {checkIn.bestieIds?.length || 0}
                      </div>
                    </div>
                  </div>

                  {checkIn.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-border">
                      <div className="text-sm text-text-secondary dark:text-dark-text-secondary italic">
                        "{checkIn.notes}"
                      </div>
                    </div>
                  )}

                  {checkIn.completedAt && (
                    <div className="mt-3 text-xs text-success dark:text-dark-success">
                      ✅ Completed {formatDistanceToNow(checkIn.completedAt.toDate(), { addSuffix: true })}
                    </div>
                  )}

                  {checkIn.alertedAt && (
                    <div className="mt-3 text-xs text-warning dark:text-dark-warning">
                      🚨 Alert sent {formatDistanceToNow(checkIn.alertedAt.toDate(), { addSuffix: true })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="btn btn-secondary px-8"
                >
                  {loadingMore ? (
                    <>
                      <span className="spinner-small mr-2"></span>
                      Loading...
                    </>
                  ) : (
                    `Load More (${ITEMS_PER_PAGE} at a time)`
                  )}
                </button>
              </div>
            )}

            {!hasMore && history.length > 0 && (
              <div className="mt-6 text-center text-text-secondary dark:text-dark-text-secondary text-sm">
                You've reached the end of your check-in history
              </div>
            )}
          </>
        )}

        {/* Back Button - Bottom */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-primary dark:text-dark-primary hover:underline font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckInHistoryPage;
