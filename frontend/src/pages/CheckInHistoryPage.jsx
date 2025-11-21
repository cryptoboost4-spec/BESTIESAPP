import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy, limit, startAfter, doc, getDoc } from 'firebase/firestore';
import { formatDistanceToNow, format } from 'date-fns';
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
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [bestieNames, setBestieNames] = useState({});

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, filter]);

  // Fetch bestie names
  useEffect(() => {
    const fetchBestieNames = async () => {
      const uniqueBestieIds = new Set();
      history.forEach(checkIn => {
        if (checkIn.bestieIds) {
          checkIn.bestieIds.forEach(id => uniqueBestieIds.add(id));
        }
      });

      setBestieNames(prevNames => {
        const names = { ...prevNames };
        const promises = [];

        for (const bestieId of uniqueBestieIds) {
          if (!names[bestieId]) {
            promises.push(
              getDoc(doc(db, 'users', bestieId))
                .then(bestieDoc => {
                  if (bestieDoc.exists()) {
                    const bestieData = bestieDoc.data();
                    names[bestieId] = bestieData.displayName || 'Unknown';
                  } else {
                    names[bestieId] = 'Unknown';
                  }
                })
                .catch(error => {
                  console.error('Error fetching bestie name:', error);
                  names[bestieId] = 'Unknown';
                })
            );
          }
        }

        if (promises.length > 0) {
          Promise.all(promises).then(() => setBestieNames({ ...names }));
        }

        return names;
      });
    };

    if (history.length > 0) {
      fetchBestieNames();
    }
  }, [history]);

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

  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
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

  const hasExpandableContent = (checkIn) => {
    return (checkIn.notes || checkIn.meetingWith || checkIn.socialMediaLinks ||
            checkIn.gpsCoords || checkIn.photoURLs?.length > 0 ||
            checkIn.bestieIds?.length > 0 || checkIn.alertTime ||
            checkIn.completedAt || checkIn.alertedAt);
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
              {history.map((checkIn) => {
                const isExpanded = expandedItems.has(checkIn.id);
                const canExpand = hasExpandableContent(checkIn);

                return (
                  <div
                    key={checkIn.id}
                    className={`card dark:bg-dark-card p-4 md:p-6 transition-all ${canExpand ? 'cursor-pointer hover:shadow-lg' : ''}`}
                    onClick={() => canExpand && toggleExpanded(checkIn.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-display text-lg text-text-primary dark:text-dark-text-primary">
                            {checkIn.location || 'No location'}
                          </h3>
                          {getStatusBadge(checkIn.status)}
                        </div>
                        <div className="text-sm text-text-secondary dark:text-dark-text-secondary">
                          {checkIn.createdAt?.toDate ? formatDistanceToNow(checkIn.createdAt.toDate(), { addSuffix: true }) : 'Unknown time'}
                        </div>
                      </div>
                      {canExpand && (
                        <button
                          className="text-primary dark:text-dark-primary ml-2 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpanded(checkIn.id);
                          }}
                        >
                          <svg
                            className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <div className="text-text-secondary dark:text-dark-text-secondary">Duration</div>
                        <div className="font-semibold text-text-primary dark:text-dark-text-primary">
                          {checkIn.duration ? formatDuration(checkIn.duration) : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-text-secondary dark:text-dark-text-secondary">Besties Notified</div>
                        <div className="font-semibold text-text-primary dark:text-dark-text-primary">
                          {checkIn.bestieIds?.length || 0}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border space-y-3 animate-fade-in">
                        {/* Exact Timestamps */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                          <div className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mb-2">
                            Timestamps
                          </div>
                          <div className="space-y-1 text-sm">
                            {checkIn.createdAt?.toDate && (
                              <div className="flex justify-between">
                                <span className="text-text-secondary dark:text-dark-text-secondary">Created:</span>
                                <span className="font-medium text-text-primary dark:text-dark-text-primary">
                                  {format(checkIn.createdAt.toDate(), 'MMM d, yyyy h:mm a')}
                                </span>
                              </div>
                            )}
                            {checkIn.alertTime?.toDate && (
                              <div className="flex justify-between">
                                <span className="text-text-secondary dark:text-dark-text-secondary">Alert Time:</span>
                                <span className="font-medium text-text-primary dark:text-dark-text-primary">
                                  {format(checkIn.alertTime.toDate(), 'MMM d, yyyy h:mm a')}
                                </span>
                              </div>
                            )}
                            {checkIn.completedAt?.toDate && (
                              <div className="flex justify-between">
                                <span className="text-success dark:text-dark-success">✅ Completed:</span>
                                <span className="font-medium text-success dark:text-dark-success">
                                  {format(checkIn.completedAt.toDate(), 'MMM d, yyyy h:mm a')}
                                </span>
                              </div>
                            )}
                            {checkIn.alertedAt?.toDate && (
                              <div className="flex justify-between">
                                <span className="text-warning dark:text-dark-warning">🚨 Alerted:</span>
                                <span className="font-medium text-warning dark:text-dark-warning">
                                  {format(checkIn.alertedAt.toDate(), 'MMM d, yyyy h:mm a')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Besties List */}
                        {checkIn.bestieIds && checkIn.bestieIds.length > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <div className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mb-2">
                              Notified Besties
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {checkIn.bestieIds.map((bestieId) => (
                                <span
                                  key={bestieId}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary dark:bg-primary/20 dark:text-dark-primary rounded-full text-sm"
                                >
                                  👤 {bestieNames[bestieId] || 'Loading...'}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {checkIn.notes && (
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <div className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mb-2">
                              Notes
                            </div>
                            <div className="text-sm text-text-primary dark:text-dark-text-primary italic">
                              "{checkIn.notes}"
                            </div>
                          </div>
                        )}

                        {/* Meeting With */}
                        {checkIn.meetingWith && (
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <div className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mb-2">
                              Meeting With
                            </div>
                            <div className="text-sm text-text-primary dark:text-dark-text-primary">
                              {checkIn.meetingWith}
                            </div>
                          </div>
                        )}

                        {/* Social Media Links */}
                        {checkIn.socialMediaLinks && (
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <div className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mb-2">
                              Social Media Links
                            </div>
                            <div className="text-sm text-text-primary dark:text-dark-text-primary break-all">
                              {checkIn.socialMediaLinks}
                            </div>
                          </div>
                        )}

                        {/* GPS Coordinates */}
                        {checkIn.gpsCoords && (
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <div className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mb-2">
                              GPS Location
                            </div>
                            <div className="text-sm text-text-primary dark:text-dark-text-primary">
                              📍 {checkIn.gpsCoords.lat.toFixed(6)}, {checkIn.gpsCoords.lng.toFixed(6)}
                            </div>
                            <a
                              href={`https://www.google.com/maps?q=${checkIn.gpsCoords.lat},${checkIn.gpsCoords.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary dark:text-dark-primary hover:underline mt-1 inline-block"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View on Google Maps →
                            </a>
                          </div>
                        )}

                        {/* Photos */}
                        {checkIn.photoURLs && checkIn.photoURLs.length > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <div className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mb-2">
                              Photos ({checkIn.photoURLs.length})
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {checkIn.photoURLs.map((url, idx) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <img
                                    src={url}
                                    alt={`Check-in ${idx + 1}`}
                                    className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
