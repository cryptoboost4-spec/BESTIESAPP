import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
// eslint-disable-next-line no-unused-vars
import { collection, getDocs, getDoc, doc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import TimeRangeFilter from '../components/analytics/TimeRangeFilter';
import UserStats from '../components/analytics/UserStats';
import CheckInStats from '../components/analytics/CheckInStats';
import BestiesStats from '../components/analytics/BestiesStats';
import RevenueStats from '../components/analytics/RevenueStats';
import EngagementStats from '../components/analytics/EngagementStats';
import CostTracking from '../components/analytics/CostTracking';
import GrowthMetrics from '../components/analytics/GrowthMetrics';
import FunnelAnalytics from '../components/analytics/FunnelAnalytics';
import UserBehavior from '../components/analytics/UserBehavior';
import TopLocations from '../components/analytics/TopLocations';
import RecentAlerts from '../components/analytics/RecentAlerts';

const DevAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState({
    users: {
      total: 0,
      new7days: 0,
      new30days: 0,
      active7days: 0,
      active30days: 0,
    },
    checkIns: {
      total: 0,
      active: 0,
      completed: 0,
      alerted: 0,
      avgDuration: 0,
      completionRate: 0,
    },
    besties: {
      totalConnections: 0,
      avgPerUser: 0,
      pending: 0,
      accepted: 0,
    },
    revenue: {
      smsSubscribers: 0,
      donorsActive: 0,
      totalDonations: 0,
      mrr: 0,
    },
    engagement: {
      avgCheckInsPerUser: 0,
      avgBestiesPerUser: 0,
      templatesCreated: 0,
      badgesEarned: 0,
    },
    costs: {
      estimatedSMS: 0,
      estimatedWhatsApp: 0,
      estimatedEmail: 0,
      totalAlertsSent: 0,
    },
    growth: {
      userGrowthRate: 0,
      checkInGrowthRate: 0,
      retentionRate: 0,
    },
    funnel: {
      signups: 0,
      completedOnboarding: 0,
      addedBestie: 0,
      firstCheckIn: 0,
      onboardingRate: 0,
      bestieRate: 0,
      checkInRate: 0,
    },
    behavior: {
      peakHour: 0,
      peakDay: '',
      mostCommonDuration: 0,
    },
    topLocations: [],
    recentAlerts: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, all

  const loadAnalytics = useCallback(async () => {
    setLoading(true);

    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Determine time filter based on selected range
      let startDate = now;
      if (timeRange === '7d') {
        startDate = sevenDaysAgo;
      } else if (timeRange === '30d') {
        startDate = thirtyDaysAgo;
      } else {
        startDate = new Date(0); // All time = epoch
      }

      // Users Analytics
      console.log('[Analytics] Loading users...');
      const usersSnap = await getDocs(collection(db, 'users'));
      console.log('[Analytics] ✓ Users loaded:', usersSnap.size);
      let totalUsers = 0;
      let new7days = 0;
      let new30days = 0;
      let active7days = 0;
      let active30days = 0;

      usersSnap.forEach(doc => {
        const data = doc.data();
        totalUsers++;
        
        const createdAt = data.stats?.joinedAt?.toDate();
        if (createdAt && createdAt > sevenDaysAgo) new7days++;
        if (createdAt && createdAt > thirtyDaysAgo) new30days++;

        const lastActive = data.lastActive?.toDate();
        if (lastActive && lastActive > sevenDaysAgo) active7days++;
        if (lastActive && lastActive > thirtyDaysAgo) active30days++;
      });

      // Check-ins Analytics (filtered by time range)
      let checkInsQuery = collection(db, 'checkins');
      if (timeRange !== 'all') {
        checkInsQuery = query(
          checkInsQuery,
          where('createdAt', '>=', Timestamp.fromDate(startDate))
        );
      }
      console.log('[Analytics] Loading checkins...');
      const checkInsSnap = await getDocs(checkInsQuery);
      console.log('[Analytics] ✓ Checkins loaded:', checkInsSnap.size);

      let totalCheckIns = 0;
      let activeCheckIns = 0;
      let completedCheckIns = 0;
      let alertedCheckIns = 0;
      let totalDuration = 0;
      const locationCounts = {};

      checkInsSnap.forEach(doc => {
        const data = doc.data();
        totalCheckIns++;
        totalDuration += data.duration || 0;

        if (data.status === 'active') activeCheckIns++;
        if (data.status === 'completed') completedCheckIns++;
        if (data.status === 'alerted') alertedCheckIns++;

        // Track locations
        if (data.location) {
          locationCounts[data.location] = (locationCounts[data.location] || 0) + 1;
        }
      });

      const topLocations = Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const completionRate = totalCheckIns > 0 
        ? ((completedCheckIns / totalCheckIns) * 100).toFixed(1)
        : 0;

      // Besties Analytics
      console.log('[Analytics] Loading besties...');
      const bestiesSnap = await getDocs(collection(db, 'besties'));
      console.log('[Analytics] ✓ Besties loaded:', bestiesSnap.size);
      let totalBesties = 0;
      let pendingBesties = 0;
      let acceptedBesties = 0;

      bestiesSnap.forEach(doc => {
        const data = doc.data();
        totalBesties++;
        if (data.status === 'pending') pendingBesties++;
        if (data.status === 'accepted') acceptedBesties++;
      });

      // Revenue Analytics
      let smsSubscribers = 0;
      let donorsActive = 0;
      let totalDonations = 0;
      let monthlyRevenue = 0;

      usersSnap.forEach(doc => {
        const data = doc.data();
        if (data.smsSubscription?.active) {
          smsSubscribers++;
          monthlyRevenue += 1; // $1/month SMS subscription
        }
        if (data.donationStats?.isActive) {
          donorsActive++;
          totalDonations += data.donationStats?.totalDonated || 0;
          // Add monthly recurring donation amount to MRR
          if (data.donationStats?.monthlyAmount) {
            monthlyRevenue += data.donationStats.monthlyAmount;
          }
        }
      });

      const mrr = monthlyRevenue;

      // Engagement Analytics
      console.log('[Analytics] Loading templates...');
      const templatesSnap = await getDocs(collection(db, 'templates'));
      console.log('[Analytics] ✓ Templates loaded:', templatesSnap.size);
      console.log('[Analytics] Loading badges...');
      const badgesSnap = await getDocs(collection(db, 'badges'));
      console.log('[Analytics] ✓ Badges loaded:', badgesSnap.size);

      let totalBadgesEarned = 0;
      badgesSnap.forEach(doc => {
        const data = doc.data();
        totalBadgesEarned += data.badges?.length || 0;
      });

      // Recent Alerts (fetch user names separately)
      console.log('[Analytics] Loading recent alerts...');
      const alertsQuery = query(
        collection(db, 'checkins'),
        where('status', '==', 'alerted'),
        orderBy('alertedAt', 'desc')
      );

      const alertsSnap = await getDocs(alertsQuery);
      console.log('[Analytics] ✓ Recent alerts loaded:', alertsSnap.size);
      const recentAlerts = [];

      // Fetch user names for each alert
      const alertPromises = [];
      alertsSnap.forEach(doc => {
        if (recentAlerts.length < 10) {
          const data = doc.data();
          alertPromises.push(
            (async () => {
              let userName = 'Unknown';
              try {
                const userDoc = await getDoc(doc(db, 'users', data.userId));
                if (userDoc.exists()) {
                  userName = userDoc.data().displayName || 'Unknown';
                }
              } catch (err) {
                console.error('Error fetching user name:', err);
              }

              recentAlerts.push({
                id: doc.id,
                location: data.location,
                alertedAt: data.alertedAt,
                userName,
              });
            })()
          );
        }
      });

      await Promise.all(alertPromises);

      // Cost Tracking (estimate based on alerts sent)
      // Real alert logic: Try WhatsApp first (free/cheap), fallback to SMS (expensive)
      // We don't track actual delivery, so we estimate conservatively
      let totalAlertsSent = 0;
      let estimatedSMSSent = 0;
      let estimatedWhatsAppSent = 0;

      checkInsSnap.forEach(doc => {
        const data = doc.data();
        if (data.status === 'alerted' && data.bestieIds) {
          const bestieCount = data.bestieIds.length;
          totalAlertsSent += bestieCount;

          // Conservative estimate: 70% get WhatsApp, 30% need SMS fallback
          // (Reality: WhatsApp tries first, SMS only if fails or no subscription)
          estimatedWhatsAppSent += Math.ceil(bestieCount * 0.7);
          estimatedSMSSent += Math.floor(bestieCount * 0.3);
        }
      });

      const estimatedSMSCost = (estimatedSMSSent * 0.0075).toFixed(2); // $0.0075 per SMS
      const estimatedWhatsAppCost = (estimatedWhatsAppSent * 0.005).toFixed(2); // $0.005 per WhatsApp
      const estimatedEmailCost = 0; // SendGrid free tier

      // Growth Metrics
      const prevWeekStart = new Date(sevenDaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
      let prevWeekUsers = 0;
      let prevWeekCheckIns = 0;

      usersSnap.forEach(doc => {
        const data = doc.data();
        const joinedAt = data.stats?.joinedAt?.toDate();
        if (joinedAt && joinedAt > prevWeekStart && joinedAt < sevenDaysAgo) {
          prevWeekUsers++;
        }
      });

      checkInsSnap.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate();
        if (createdAt && createdAt > prevWeekStart && createdAt < sevenDaysAgo) {
          prevWeekCheckIns++;
        }
      });

      const userGrowthRate = prevWeekUsers > 0
        ? (((new7days - prevWeekUsers) / prevWeekUsers) * 100).toFixed(1)
        : new7days > 0 ? '∞' : 'N/A';

      const checkInGrowthRate = prevWeekCheckIns > 0
        ? (((totalCheckIns - prevWeekCheckIns) / prevWeekCheckIns) * 100).toFixed(1)
        : totalCheckIns > 0 ? '∞' : 'N/A';

      // Retention: users who created multiple check-ins
      const userCheckInCounts = {};
      checkInsSnap.forEach(doc => {
        const userId = doc.data().userId;
        userCheckInCounts[userId] = (userCheckInCounts[userId] || 0) + 1;
      });
      const returningUsers = Object.values(userCheckInCounts).filter(count => count > 1).length;
      const retentionRate = totalUsers > 0 ? ((returningUsers / totalUsers) * 100).toFixed(1) : 0;

      // Funnel Analytics
      console.log('[Analytics] Calculating funnel metrics...');
      let completedOnboardingCount = 0;
      let addedBestieCount = 0;
      let firstCheckInCount = 0;
      let debugSampleUser = null;

      usersSnap.forEach(doc => {
        const data = doc.data();
        // Capture first user for debugging
        if (!debugSampleUser) {
          debugSampleUser = {
            id: doc.id,
            onboardingCompleted: data.onboardingCompleted,
            statsExists: !!data.stats,
            totalBesties: data.stats?.totalBesties,
            totalCheckIns: data.stats?.totalCheckIns,
          };
        }
        if (data.onboardingCompleted) completedOnboardingCount++;
        if (data.stats?.totalBesties > 0) addedBestieCount++;
        if (data.stats?.totalCheckIns > 0) firstCheckInCount++;
      });

      console.log('[Analytics] Funnel Debug - Sample User:', debugSampleUser);
      console.log('[Analytics] Funnel Counts:', {
        totalUsers,
        completedOnboarding: completedOnboardingCount,
        addedBestie: addedBestieCount,
        firstCheckIn: firstCheckInCount,
      });

      const onboardingRate = totalUsers > 0 ? ((completedOnboardingCount / totalUsers) * 100).toFixed(1) : 0;
      const bestieRate = completedOnboardingCount > 0 ? ((addedBestieCount / completedOnboardingCount) * 100).toFixed(1) : 0;
      const checkInRate = addedBestieCount > 0 ? ((firstCheckInCount / addedBestieCount) * 100).toFixed(1) : 0;

      // User Behavior (normalized to UTC to avoid timezone skew)
      const hourCounts = new Array(24).fill(0);
      const dayCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
      const durationCounts = {};

      checkInsSnap.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate();
        if (createdAt) {
          // Use UTC to normalize across timezones
          hourCounts[createdAt.getUTCHours()]++;
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          dayCounts[dayNames[createdAt.getUTCDay()]]++;
        }
        if (data.duration) {
          durationCounts[data.duration] = (durationCounts[data.duration] || 0) + 1;
        }
      });

      const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
      const peakDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
      const mostCommonDuration = Object.entries(durationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 30;

      setAnalytics({
        users: {
          total: totalUsers,
          new7days,
          new30days,
          active7days,
          active30days,
        },
        checkIns: {
          total: totalCheckIns,
          active: activeCheckIns,
          completed: completedCheckIns,
          alerted: alertedCheckIns,
          avgDuration: totalCheckIns > 0 ? Math.round(totalDuration / totalCheckIns) : 0,
          completionRate,
        },
        besties: {
          totalConnections: totalBesties,
          // Each bestie relationship involves 2 users, so multiply by 2 for avg besties per user
          avgPerUser: totalUsers > 0 ? ((acceptedBesties * 2) / totalUsers).toFixed(1) : 0,
          pending: pendingBesties,
          accepted: acceptedBesties,
        },
        revenue: {
          smsSubscribers,
          donorsActive,
          totalDonations: totalDonations.toFixed(2),
          mrr: mrr.toFixed(2),
        },
        engagement: {
          avgCheckInsPerUser: totalUsers > 0 ? (totalCheckIns / totalUsers).toFixed(1) : 0,
          // Each bestie relationship involves 2 users, so multiply by 2 for avg besties per user
          avgBestiesPerUser: totalUsers > 0 ? ((acceptedBesties * 2) / totalUsers).toFixed(1) : 0,
          templatesCreated: templatesSnap.size,
          badgesEarned: totalBadgesEarned,
        },
        costs: {
          estimatedSMS: estimatedSMSCost,
          estimatedWhatsApp: estimatedWhatsAppCost,
          estimatedEmail: estimatedEmailCost,
          totalAlertsSent: totalAlertsSent,
        },
        growth: {
          userGrowthRate,
          checkInGrowthRate,
          retentionRate,
        },
        funnel: {
          signups: totalUsers,
          completedOnboarding: completedOnboardingCount,
          addedBestie: addedBestieCount,
          firstCheckIn: firstCheckInCount,
          onboardingRate,
          bestieRate,
          checkInRate,
        },
        behavior: {
          peakHour,
          peakDay,
          mostCommonDuration,
        },
        topLocations,
        recentAlerts,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading analytics:', error);

      // Show user-friendly error message based on error type
      if (error.code === 'failed-precondition') {
        console.error('Firestore index missing. Create index at:', error.message);
        alert('Analytics require database indices. Check console for index creation link.');
      } else if (error.code === 'permission-denied') {
        alert('Permission denied. Make sure your user document has the field:\n- isAdmin: true');
      } else {
        alert(`Failed to load analytics: ${error.message}`);
      }

      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div className="min-h-screen bg-pattern">
        <div className="flex items-center justify-center py-20">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pattern">

      <div className="max-w-7xl mx-auto p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-3xl font-display text-text-primary mb-2">📊 Developer Analytics</h1>
          <p className="text-text-secondary">Real-time app metrics and insights</p>
        </div>

        <TimeRangeFilter timeRange={timeRange} setTimeRange={setTimeRange} />

        <UserStats analytics={analytics} />
        <CheckInStats analytics={analytics} />
        <BestiesStats analytics={analytics} />
        <RevenueStats analytics={analytics} />
        <EngagementStats analytics={analytics} />
        <CostTracking analytics={analytics} />
        <GrowthMetrics analytics={analytics} />
        <FunnelAnalytics analytics={analytics} />
        <UserBehavior analytics={analytics} />

        {/* Top Locations and Recent Alerts */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <TopLocations topLocations={analytics.topLocations} />
          <RecentAlerts recentAlerts={analytics.recentAlerts} />
        </div>

        {/* Refresh Button */}
        <button
          onClick={loadAnalytics}
          className="w-full btn btn-primary"
          disabled={loading}
        >
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
};

export default DevAnalyticsPage;
