import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
// eslint-disable-next-line no-unused-vars
import { collection, getDocs, getDoc, doc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import Header from '../components/Header';

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

      <div className="max-w-7xl mx-auto p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-3xl font-display text-text-primary mb-2">📊 Developer Analytics</h1>
          <p className="text-text-secondary">Real-time app metrics and insights</p>
        </div>

        {/* Time Range Filter */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-4 py-2 rounded-full font-semibold ${
              timeRange === '7d' ? 'bg-primary text-white' : 'bg-white text-text-primary'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-4 py-2 rounded-full font-semibold ${
              timeRange === '30d' ? 'bg-primary text-white' : 'bg-white text-text-primary'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-4 py-2 rounded-full font-semibold ${
              timeRange === 'all' ? 'bg-primary text-white' : 'bg-white text-text-primary'
            }`}
          >
            All Time
          </button>
        </div>

        {/* Users Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-display text-text-primary mb-4">👥 Users</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-primary">{analytics.users.total}</div>
              <div className="text-sm text-text-secondary">Total Users</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-success">{analytics.users.new7days}</div>
              <div className="text-sm text-text-secondary">New (7d)</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-success">{analytics.users.new30days}</div>
              <div className="text-sm text-text-secondary">New (30d)</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-secondary">{analytics.users.active7days}</div>
              <div className="text-sm text-text-secondary">Active (7d)</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-secondary">{analytics.users.active30days}</div>
              <div className="text-sm text-text-secondary">Active (30d)</div>
            </div>
          </div>
        </div>

        {/* Check-ins Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-display text-text-primary mb-4">✅ Check-ins</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-primary">{analytics.checkIns.total}</div>
              <div className="text-sm text-text-secondary">Total</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-warning">{analytics.checkIns.active}</div>
              <div className="text-sm text-text-secondary">Active Now</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-success">{analytics.checkIns.completed}</div>
              <div className="text-sm text-text-secondary">Completed</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-danger">{analytics.checkIns.alerted}</div>
              <div className="text-sm text-text-secondary">Alerted</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-accent">{analytics.checkIns.avgDuration}</div>
              <div className="text-sm text-text-secondary">Avg Minutes</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-success">{analytics.checkIns.completionRate}%</div>
              <div className="text-sm text-text-secondary">Completion</div>
            </div>
          </div>
        </div>

        {/* Besties Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-display text-text-primary mb-4">💜 Besties Network</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-primary">{analytics.besties.totalConnections}</div>
              <div className="text-sm text-text-secondary">Total Connections</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-success">{analytics.besties.accepted}</div>
              <div className="text-sm text-text-secondary">Accepted</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-warning">{analytics.besties.pending}</div>
              <div className="text-sm text-text-secondary">Pending</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-secondary">{analytics.besties.avgPerUser}</div>
              <div className="text-sm text-text-secondary">Avg Per User</div>
            </div>
          </div>
        </div>

        {/* Revenue Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-display text-text-primary mb-4">💰 Revenue</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 text-center bg-gradient-primary text-white">
              <div className="text-3xl font-display">${analytics.revenue.mrr}</div>
              <div className="text-sm opacity-90">MRR</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-primary">{analytics.revenue.smsSubscribers}</div>
              <div className="text-sm text-text-secondary">SMS Subscribers</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-secondary">{analytics.revenue.donorsActive}</div>
              <div className="text-sm text-text-secondary">Active Donors</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-success">${analytics.revenue.totalDonations}</div>
              <div className="text-sm text-text-secondary">Total Donated</div>
            </div>
          </div>
        </div>

        {/* Engagement Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-display text-text-primary mb-4">📈 Engagement</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-primary">{analytics.engagement.avgCheckInsPerUser}</div>
              <div className="text-sm text-text-secondary">Check-ins/User</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-secondary">{analytics.engagement.avgBestiesPerUser}</div>
              <div className="text-sm text-text-secondary">Besties/User</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-accent">{analytics.engagement.templatesCreated}</div>
              <div className="text-sm text-text-secondary">Templates</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-warning">{analytics.engagement.badgesEarned}</div>
              <div className="text-sm text-text-secondary">Badges Earned</div>
            </div>
          </div>
        </div>

        {/* Cost Tracking */}
        <div className="mb-6">
          <h2 className="text-2xl font-display text-text-primary mb-4">💸 Cost Tracking (Estimates)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 text-center bg-danger/10">
              <div className="text-3xl font-display text-danger">${analytics.costs.estimatedSMS}</div>
              <div className="text-sm text-text-secondary">SMS Costs</div>
            </div>
            <div className="card p-4 text-center bg-success/10">
              <div className="text-3xl font-display text-success">${analytics.costs.estimatedWhatsApp}</div>
              <div className="text-sm text-text-secondary">WhatsApp Costs</div>
            </div>
            <div className="card p-4 text-center bg-primary/10">
              <div className="text-3xl font-display text-primary">${analytics.costs.estimatedEmail}</div>
              <div className="text-sm text-text-secondary">Email Costs</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-accent">{analytics.costs.totalAlertsSent}</div>
              <div className="text-sm text-text-secondary">Total Alerts</div>
            </div>
          </div>
        </div>

        {/* Growth Metrics */}
        <div className="mb-6">
          <h2 className="text-2xl font-display text-text-primary mb-4">📊 Growth Metrics</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <div className={`text-3xl font-display ${parseFloat(analytics.growth.userGrowthRate) >= 0 ? 'text-success' : 'text-danger'}`}>
                {analytics.growth.userGrowthRate > 0 ? '+' : ''}{analytics.growth.userGrowthRate}%
              </div>
              <div className="text-sm text-text-secondary">User Growth (WoW)</div>
            </div>
            <div className="card p-4 text-center">
              <div className={`text-3xl font-display ${parseFloat(analytics.growth.checkInGrowthRate) >= 0 ? 'text-success' : 'text-danger'}`}>
                {analytics.growth.checkInGrowthRate > 0 ? '+' : ''}{analytics.growth.checkInGrowthRate}%
              </div>
              <div className="text-sm text-text-secondary">Check-in Growth (WoW)</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-primary">{analytics.growth.retentionRate}%</div>
              <div className="text-sm text-text-secondary">Retention Rate</div>
            </div>
          </div>
        </div>

        {/* Funnel Analytics */}
        <div className="mb-6">
          <h2 className="text-2xl font-display text-text-primary mb-4">🎯 User Funnel</h2>
          <div className="card p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-text-primary">1. Sign Ups</div>
                  <div className="text-sm text-text-secondary">{analytics.funnel.signups} users</div>
                </div>
                <div className="text-2xl font-display text-primary">100%</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-text-primary">2. Completed Onboarding</div>
                  <div className="text-sm text-text-secondary">{analytics.funnel.completedOnboarding} users</div>
                </div>
                <div className="text-2xl font-display text-success">{analytics.funnel.onboardingRate}%</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-text-primary">3. Added First Bestie</div>
                  <div className="text-sm text-text-secondary">{analytics.funnel.addedBestie} users</div>
                </div>
                <div className="text-2xl font-display text-warning">{analytics.funnel.bestieRate}%</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-text-primary">4. Created First Check-in</div>
                  <div className="text-sm text-text-secondary">{analytics.funnel.firstCheckIn} users</div>
                </div>
                <div className="text-2xl font-display text-accent">{analytics.funnel.checkInRate}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* User Behavior */}
        <div className="mb-6">
          <h2 className="text-2xl font-display text-text-primary mb-4">🕐 User Behavior</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-primary">{analytics.behavior.peakHour}:00</div>
              <div className="text-sm text-text-secondary">Peak Hour (24h)</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-secondary">{analytics.behavior.peakDay}</div>
              <div className="text-sm text-text-secondary">Peak Day</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display text-accent">{analytics.behavior.mostCommonDuration}m</div>
              <div className="text-sm text-text-secondary">Common Duration</div>
            </div>
          </div>
        </div>

        {/* Top Locations */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="card p-6">
            <h3 className="font-display text-xl text-text-primary mb-4">📍 Top Check-in Locations</h3>
            {analytics.topLocations.length > 0 ? (
              <div className="space-y-2">
                {analytics.topLocations.map((loc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-semibold text-text-primary">{loc.location}</span>
                    <span className="badge badge-primary">{loc.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary text-center py-8">No data yet</p>
            )}
          </div>

          {/* Recent Alerts */}
          <div className="card p-6">
            <h3 className="font-display text-xl text-text-primary mb-4">🚨 Recent Alerts</h3>
            {analytics.recentAlerts.length > 0 ? (
              <div className="space-y-2">
                {analytics.recentAlerts.map((alert) => (
                  <div key={alert.id} className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
                    <div className="font-semibold text-danger">{alert.userName}</div>
                    <div className="text-sm text-text-secondary">{alert.location}</div>
                    {alert.alertedAt && (
                      <div className="text-xs text-text-secondary mt-1">
                        {new Date(alert.alertedAt.toDate()).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary text-center py-8">No alerts 🎉</p>
            )}
          </div>
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
