import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

export function useActivityFeed(currentUser, besties, userData) {
  const [activityFeed, setActivityFeed] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [missedCheckIns, setMissedCheckIns] = useState([]);
  const [requestsForAttention, setRequestsForAttention] = useState([]);

  useEffect(() => {
    if (!currentUser) {
      setActivityLoading(false);
      return;
    }
    
    // Don't wait for besties - load activity even if no besties yet
    if (besties.length === 0) {
      setActivityLoading(false);
      setActivityFeed([]);
      setMissedCheckIns([]);
      setRequestsForAttention([]);
      return;
    }

    const loadActivityFeed = async () => {
      if (document.hidden) return;

      setActivityLoading(true);
      
      try {

      const activities = [];
      const missed = [];
      const attentionRequests = [];

      const bestieIds = [...new Set(besties.map(b => b.userId))];

      const twoDaysAgoDate = new Date();
      twoDaysAgoDate.setHours(twoDaysAgoDate.getHours() - 48);
      const twoDaysAgo = Timestamp.fromDate(twoDaysAgoDate);

      // Load user's own posts
      const userPostsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', currentUser.uid),
        where('createdAt', '>=', twoDaysAgo),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const userPostsSnapshot = await getDocs(userPostsQuery);
      userPostsSnapshot.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'post',
          postData: data,
          userName: userData?.displayName || 'You',
          userId: currentUser.uid,
          timestamp: data.createdAt?.toDate() || new Date(),
        });
      });

      // Load welcome posts from Besties Bot
      const welcomePostsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', 'BESTIES_BOT')
      );
      const welcomePostsSnapshot = await getDocs(welcomePostsQuery);
      welcomePostsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.recipientId === currentUser.uid) {
          activities.push({
            id: doc.id,
            type: 'post',
            postData: data,
            userName: 'Besties Team',
            userId: 'BESTIES_BOT',
            timestamp: data.createdAt?.toDate() || new Date(),
          });
        }
      });

      const BATCH_SIZE = 10;
      const allQueryPromises = [];
      const userDocPromises = [];
      const badgeDocPromises = [];
      
      for (let i = 0; i < bestieIds.length; i += BATCH_SIZE) {
        const batch = bestieIds.slice(i, i + BATCH_SIZE);
        
        const checkInsQuery = query(
          collection(db, 'checkins'),
          where('userId', 'in', batch),
          where('createdAt', '>=', twoDaysAgo),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        allQueryPromises.push(getDocs(checkInsQuery).then(snap => ({ type: 'checkins', snap, batch })));
        
        const checkInsAsBestieQuery = query(
          collection(db, 'checkins'),
          where('bestieUserIds', 'array-contains', currentUser.uid),
          where('createdAt', '>=', twoDaysAgo),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        allQueryPromises.push(getDocs(checkInsAsBestieQuery).then(snap => ({ type: 'checkinsAsBestie', snap })));
        
        // Firestore 'in' queries require at least one element and max 10
        if (batch.length > 0 && batch.length <= 10) {
          const postsQuery = query(
            collection(db, 'posts'),
            where('userId', 'in', batch),
            where('createdAt', '>=', twoDaysAgo),
            orderBy('createdAt', 'desc'),
            limit(100)
          );
          allQueryPromises.push(getDocs(postsQuery).then(snap => ({ type: 'posts', snap, batch })).catch(err => {
            console.warn('Error loading posts for batch:', err);
            return { type: 'posts', snap: { forEach: () => {}, empty: true }, batch: [] };
          }));
        }
      }
      
      for (let i = 0; i < bestieIds.length; i += BATCH_SIZE) {
        const batch = bestieIds.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(bestieId => getDoc(doc(db, 'users', bestieId)));
        userDocPromises.push(Promise.all(batchPromises).then(docs => 
          docs.map((doc, idx) => ({ bestieId: batch[idx], doc }))
        ));
      }
      
      for (let i = 0; i < bestieIds.length; i += BATCH_SIZE) {
        const batch = bestieIds.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(bestieId => getDoc(doc(db, 'badges', bestieId)));
        badgeDocPromises.push(Promise.all(batchPromises).then(docs => 
          docs.map((doc, idx) => ({ bestieId: batch[idx], doc }))
        ));
      }
      
      const [queryResults, userDocs, badgeDocs] = await Promise.all([
        Promise.all(allQueryPromises),
        Promise.all(userDocPromises),
        Promise.all(badgeDocPromises)
      ]);
      
      const userDataMap = new Map();
      userDocs.flat().forEach(({ bestieId, doc }) => {
        if (doc.exists()) {
          userDataMap.set(bestieId, doc.data());
        }
      });
      
      const badgeDataMap = new Map();
      badgeDocs.flat().forEach(({ bestieId, doc }) => {
        if (doc.exists()) {
          badgeDataMap.set(bestieId, doc.data());
        }
      });
      
      const bestieMap = new Map(besties.map(b => [b.userId, b]));
      const processedCheckInIds = new Set();
      
      queryResults.forEach(result => {
        if (result.type === 'checkins' || result.type === 'checkinsAsBestie') {
          result.snap.forEach((checkInDoc) => {
            const data = checkInDoc.data();
            const userId = data.userId;
            
            if (result.type === 'checkinsAsBestie' && !bestieIds.includes(userId)) {
              return;
            }
            
            if (processedCheckInIds.has(checkInDoc.id)) return;
            processedCheckInIds.add(checkInDoc.id);
            
            const bestie = bestieMap.get(userId);
            activities.push({
              id: checkInDoc.id,
              type: 'checkin',
              checkInData: data,
              userName: bestie?.name || 'Bestie',
              userId: userId,
              timestamp: data.createdAt?.toDate() || new Date(),
              status: data.status,
            });
            
            if (data.status === 'alerted') {
              missed.push({
                id: checkInDoc.id,
                userName: bestie?.name || 'Bestie',
                userId: userId,
                checkInData: data,
                timestamp: data.createdAt?.toDate() || new Date(),
              });
            }
          });
        } else if (result.type === 'posts') {
          result.snap.forEach((postDoc) => {
            const data = postDoc.data();
            const userId = data.userId;
            const bestie = bestieMap.get(userId);
            
            activities.push({
              id: postDoc.id,
              type: 'post',
              postData: data,
              userName: bestie?.name || 'Bestie',
              userId: userId,
              timestamp: data.createdAt?.toDate() || new Date(),
            });
          });
        }
      });
      
      userDataMap.forEach((userData, bestieId) => {
        if (userData.requestAttention && userData.requestAttention.active) {
          const bestie = bestieMap.get(bestieId);
          attentionRequests.push({
            userId: bestieId,
            userName: userData.displayName || bestie?.name || 'Bestie',
            photoURL: userData.photoURL || bestie?.photoURL || null,
            tag: userData.requestAttention.tag,
            note: userData.requestAttention.note,
            timestamp: userData.requestAttention.timestamp?.toDate() || new Date(),
          });
        }
      });
      
      badgeDataMap.forEach((badgesData, bestieId) => {
        const recentBadges = badgesData.badges?.filter(b => {
          const earnedDate = b.earnedAt?.toDate();
          return earnedDate && earnedDate > twoDaysAgoDate;
        }) || [];
        
        recentBadges.forEach(badge => {
          const bestie = bestieMap.get(bestieId);
          activities.push({
            id: `badge-${bestieId}-${badge.id || badge.type || Math.random()}`,
            type: 'badge',
            userName: bestie?.name || 'Bestie',
            userId: bestieId,
            badge: badge,
            timestamp: badge.earnedAt?.toDate() || new Date(),
          });
        });
      });

      activities.sort((a, b) => b.timestamp - a.timestamp);

      const featuredCircle = userData?.featuredCircle || [];
      const filteredMissed = featuredCircle.length > 0
        ? missed.filter(m => featuredCircle.includes(m.userId))
        : missed;
      const filteredAttention = featuredCircle.length > 0
        ? attentionRequests.filter(a => featuredCircle.includes(a.userId))
        : attentionRequests;

      setActivityFeed(activities);
      setMissedCheckIns(filteredMissed);
      setRequestsForAttention(filteredAttention);
      setActivityLoading(false);
      } catch (error) {
        console.error('Error loading activity feed:', error);
        // If permission error, it might be a race condition - show empty feed instead of crashing
        if (error.code === 'permission-denied') {
          console.warn('Permission denied loading activity feed - may be race condition. Showing empty feed.');
          setActivityFeed([]);
          setMissedCheckIns([]);
          setRequestsForAttention([]);
        }
        setActivityLoading(false);
      }
    };

    loadActivityFeed();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadActivityFeed();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser, besties, userData]);

  return { activityFeed, activityLoading, missedCheckIns, requestsForAttention };
}

