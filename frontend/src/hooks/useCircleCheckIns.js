import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';

/**
 * Custom hook to manage circle check-ins visible to a user
 * Provides real-time updates for circle check-ins from featured circle
 * 
 * @param {string} userId - Current user ID
 * @param {number} limitCount - Number of check-ins to fetch (default: 50)
 * @returns {Object} - { checkIns, loading }
 */
export const useCircleCheckIns = (userId, limitCount = 50) => {
    const [checkIns, setCheckIns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setCheckIns([]);
            setLoading(false);
            return;
        }

        // Real-time listener for circle check-ins visible to user
        const checkInsQuery = query(
            collection(db, 'circle_checkins'),
            where('visibleTo', 'array-contains', userId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const unsubscribe = onSnapshot(
            checkInsQuery,
            (snapshot) => {
                const checkInsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setCheckIns(checkInsData);
                setLoading(false);
            },
            (error) => {
                console.error('Error listening to circle check-ins:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userId, limitCount]);

    return { checkIns, loading };
};

export default useCircleCheckIns;
