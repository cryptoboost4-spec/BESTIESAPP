import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
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
    topLocations: [],
    recentAlerts: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, all

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Users Analytics
      const usersSnap = await getDocs(collection(db, 'users'));
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

      // Check-ins Analytics
      const checkInsSnap = await getDocs(collection(db, 'checkins'));
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
      const bestiesSnap = await getDocs(collection(db, 'besties'));
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

      usersSnap.forEach(doc => {
        const data = doc.data();
        if (data.smsSubscription?.active) smsSubscribers++;
        if (data.donationStats?.isActive) {
          donorsActive++;
          totalDonations += data.donationStats?.totalDonated || 0;
        }
      });

      const mrr = (smsSubscribers * 1) + totalDonations;

      // Engagement Analytics
      const templatesSnap = await getDocs(collection(db, 'templates'));
      const badgesSnap = await getDocs(collection(db, 'badges'));

      let totalBadgesEarned = 0;
      badgesSnap.forEach(doc => {
        const data = doc.data();
        totalBadgesEarned += data.badges?.length || 0;
      });

      // Recent Alerts
      const alertsQuery = query(
        collection(db, 'checkins'),
        where('status', '==', 'alerted'),
        orderBy('alertedAt', 'desc')
      );
      
      const alertsSnap = await getDocs(alertsQuery);
      const recentAlerts = [];
      alertsSnap.forEach(doc => {
        if (recentAlerts.length < 10) {
          const data = doc.data();
          recentAlerts.push({
            id: doc.id,
            location: data.location,
            alertedAt: data.alertedAt,
            userName: data.userName || 'Unknown',
          });
        }
      });

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
          avgPerUser: totalUsers > 0 ? (acceptedBesties / totalUsers).toFixed(1) : 0,
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
          avgBestiesPerUser: totalUsers > 0 ? (acceptedBesties / totalUsers).toFixed(1) : 0,
          templatesCreated: templatesSnap.size,
          badgesEarned: totalBadgesEarned,
        },
        topLocations,
        recentAlerts,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setLoading(false);
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
