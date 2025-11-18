import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, orderBy, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import Header from '../components/Header';
import toast from 'react-hot-toast';

const SocialFeedPage = () => {
  const { currentUser } = useAuth();
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, completed

  useEffect(() => {
    loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, filter]);

  const loadFeed = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Get user's besties
      const bestiesQuery1 = query(
        collection(db, 'besties'),
        where('requesterId', '==', currentUser.uid),
        where('status', '==', 'accepted')
      );
      const bestiesQuery2 = query(
        collection(db, 'besties'),
        where('recipientId', '==', currentUser.uid),
        where('status', '==', 'accepted')
      );

      const [snap1, snap2] = await Promise.all([
        getDocs(bestiesQuery1),
        getDocs(bestiesQuery2)
      ]);

      const bestieIds = new Set([currentUser.uid]); // Include own check-ins
      snap1.forEach(doc => {
        const data = doc.data();
        if (data.recipientId) bestieIds.add(data.recipientId);
      });
      snap2.forEach(doc => {
        const data = doc.data();
        if (data.requesterId) bestieIds.add(data.requesterId);
      });

      const bestieIdsArray = Array.from(bestieIds);

      // Get check-ins from besties
      const feedItems = [];
      
      for (const userId of bestieIdsArray) {
        let checkInsQuery = query(
          collection(db, 'checkins'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(10)
        );

        if (filter === 'active') {
          checkInsQuery = query(
            collection(db, 'checkins'),
            where('userId', '==', userId),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc'),
            limit(10)
          );
        } else if (filter === 'completed') {
          checkInsQuery = query(
            collection(db, 'checkins'),
            where('userId', '==', userId),
            where('status', '==', 'completed'),
            orderBy('createdAt', 'desc'),
            limit(10)
          );
        }

        const checkInsSnap = await getDocs(checkInsQuery);
        
        for (const checkInDoc of checkInsSnap.docs) {
          const checkInData = checkInDoc.data();
          
          // Get user data
          const userDoc = await getDoc(doc(db, 'users', userId));
          const userData = userDoc.exists() ? userDoc.data() : null;

          feedItems.push({
            id: checkInDoc.id,
            ...checkInData,
            userName: userData?.displayName || 'Unknown User',
            userPhoto: userData?.photoURL || null,
            isOwn: userId === currentUser.uid,
          });
        }
      }

      // Sort by creation time
      feedItems.sort((a, b) => b.createdAt - a.createdAt);

      setFeed(feedItems.slice(0, 50)); // Show top 50
      setLoading(false);
    } catch (error) {
      console.error('Error loading feed:', error);
      toast.error('Failed to load feed');
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-warning';
      case 'completed':
        return 'text-success';
      case 'alerted':
        return 'text-danger';
      default:
        return 'text-text-secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return '⏰';
      case 'completed':
        return '✅';
      case 'alerted':
        return '🚨';
      default:
        return '📍';
    }
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
        <div className="mb-6">
          <h1 className="text-3xl font-display text-text-primary mb-2">
            Social Feed
          </h1>
          <p className="text-text-secondary">
            See what your besties are up to (privacy-safe)
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full font-semibold ${
              filter === 'all' ? 'bg-primary text-white' : 'bg-white text-text-primary'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-full font-semibold ${
              filter === 'active' ? 'bg-warning text-white' : 'bg-white text-text-primary'
            }`}
          >
            Active Now
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-full font-semibold ${
              filter === 'completed' ? 'bg-success text-white' : 'bg-white text-text-primary'
            }`}
          >
            Safe & Sound
          </button>
        </div>

        {/* Feed */}
        {feed.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-2xl font-display text-text-primary mb-2">
              No activity yet
            </h2>
            <p className="text-text-secondary">
              {filter === 'active' 
                ? 'None of your besties are checked in right now'
                : 'Add besties to see their check-ins here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {feed.map((item) => (
              <div key={item.id} className="card p-4">
                <div className="flex items-start gap-3">
                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    {item.userPhoto ? (
                      <img
                        src={item.userPhoto}
                        alt={item.userName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
                        {item.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-text-primary">
                        {item.isOwn ? 'You' : item.userName}
                      </span>
                      <span className="text-text-secondary text-sm">
                        {item.createdAt && formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-lg ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                      </span>
                      <span className="text-text-primary">
                        {item.status === 'active' && 'is checked in at'}
                        {item.status === 'completed' && 'safely returned from'}
                        {item.status === 'alerted' && 'needs help at'}
                      </span>
                      <span className="font-semibold text-text-primary">
                        {item.location}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm text-text-secondary">
                      <span>⏱️ {item.duration} minutes</span>
                      {item.status === 'active' && item.alertTime && (
                        <span>
                          • Alert in {Math.round((item.alertTime.toDate() - new Date()) / 60000)} min
                        </span>
                      )}
                      {item.status === 'completed' && item.completedAt && (
                        <span>
                          • Completed {formatDistanceToNow(item.completedAt.toDate(), { addSuffix: true })}
                        </span>
                      )}
                    </div>

                    {item.notes && (
                      <div className="mt-2 text-sm text-text-secondary italic">
                        "{item.notes}"
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="mt-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status === 'active' ? 'bg-warning/10 text-warning' :
                        item.status === 'completed' ? 'bg-success/10 text-success' :
                        item.status === 'alerted' ? 'bg-danger/10 text-danger' :
                        'bg-gray-100 text-text-secondary'
                      }`}>
                        {item.status === 'active' && '🟡 Active'}
                        {item.status === 'completed' && '🟢 Safe'}
                        {item.status === 'alerted' && '🔴 Alert'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Privacy Note */}
        <div className="card p-4 mt-6 bg-primary/5 border border-primary/20">
          <div className="text-sm text-text-secondary">
            <strong className="text-text-primary">🔒 Privacy:</strong> Only your accepted besties can see your check-ins. 
            You can only see check-ins from people in your safety circle.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialFeedPage;
