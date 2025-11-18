import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import Header from '../components/Header';

const MonitoringDashboard = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [errors, setErrors] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [userActions, setUserActions] = useState([]);
  const [funnelData, setFunnelData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonitoringData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const getTimeRangeStart = () => {
    const now = new Date();
    switch (timeRange) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  };

  const loadMonitoringData = async () => {
    setLoading(true);
    try {
      const startTime = Timestamp.fromDate(getTimeRangeStart());

      // Load errors
      const errorsQuery = query(
        collection(db, 'errors'),
        where('createdAt', '>=', startTime),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const errorsSnap = await getDocs(errorsQuery);
      const errorsList = [];
      errorsSnap.forEach(doc => errorsList.push({ id: doc.id, ...doc.data() }));
      setErrors(errorsList);

      // Load performance metrics
      const perfQuery = query(
        collection(db, 'performance'),
        where('createdAt', '>=', startTime),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const perfSnap = await getDocs(perfQuery);
      const perfList = [];
      perfSnap.forEach(doc => perfList.push({ id: doc.id, ...doc.data() }));
      setPerformance(perfList);

      // Load user actions
      const actionsQuery = query(
        collection(db, 'user_actions'),
        where('createdAt', '>=', startTime),
        orderBy('createdAt', 'desc'),
        limit(200)
      );
      const actionsSnap = await getDocs(actionsQuery);
      const actionsList = [];
      actionsSnap.forEach(doc => actionsList.push({ id: doc.id, ...doc.data() }));
      setUserActions(actionsList);

      // Load funnel events
      const funnelQuery = query(
        collection(db, 'funnel_events'),
        where('createdAt', '>=', startTime),
        orderBy('createdAt', 'desc')
      );
      const funnelSnap = await getDocs(funnelQuery);
      
      // Analyze funnel data
      const funnels = {};
      funnelSnap.forEach(doc => {
        const data = doc.data();
        if (!funnels[data.funnel]) {
          funnels[data.funnel] = {};
        }
        if (!funnels[data.funnel][data.step]) {
          funnels[data.funnel][data.step] = 0;
        }
        funnels[data.funnel][data.step]++;
      });
      setFunnelData(funnels);

      setLoading(false);
    } catch (error) {
      console.error('Error loading monitoring data:', error);
      setLoading(false);
    }
  };

  // Calculate error rate
  const errorRate = ((errors.length / Math.max(userActions.length, 1)) * 100).toFixed(2);

  // Calculate average page load time
  const pageLoads = performance.filter(p => p.type === 'page_load');
  const avgPageLoad = pageLoads.length > 0
    ? (pageLoads.reduce((sum, p) => sum + (p.metrics?.total || 0), 0) / pageLoads.length).toFixed(0)
    : 0;

  // Group errors by type
  const errorsByType = errors.reduce((acc, err) => {
    acc[err.type] = (acc[err.type] || 0) + 1;
    return acc;
  }, {});

  // Most visited pages
  const pageViews = userActions.filter(a => a.action === 'page_view');
  const pageVisits = pageViews.reduce((acc, pv) => {
    const page = pv.details?.page || 'unknown';
    acc[page] = (acc[page] || 0) + 1;
    return acc;
  }, {});
  const topPages = Object.entries(pageVisits)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

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
          <h1 className="text-3xl font-display text-text-primary mb-2">
            🔍 Monitoring Dashboard
          </h1>
          <p className="text-text-secondary">Real-time errors, performance & user behavior</p>
        </div>

        {/* Time Range Filter */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTimeRange('1h')}
            className={`px-4 py-2 rounded-full font-semibold ${
              timeRange === '1h' ? 'bg-primary text-white' : 'bg-white text-text-primary'
            }`}
          >
            Last Hour
          </button>
          <button
            onClick={() => setTimeRange('24h')}
            className={`px-4 py-2 rounded-full font-semibold ${
              timeRange === '24h' ? 'bg-primary text-white' : 'bg-white text-text-primary'
            }`}
          >
            Last 24h
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-4 py-2 rounded-full font-semibold ${
              timeRange === '7d' ? 'bg-primary text-white' : 'bg-white text-text-primary'
            }`}
          >
            Last 7 Days
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4 text-center">
            <div className={`text-3xl font-display ${errors.length > 0 ? 'text-danger' : 'text-success'}`}>
              {errors.length}
            </div>
            <div className="text-sm text-text-secondary">Total Errors</div>
          </div>

          <div className="card p-4 text-center">
            <div className="text-3xl font-display text-warning">
              {errorRate}%
            </div>
            <div className="text-sm text-text-secondary">Error Rate</div>
          </div>

          <div className="card p-4 text-center">
            <div className="text-3xl font-display text-primary">
              {avgPageLoad}ms
            </div>
            <div className="text-sm text-text-secondary">Avg Page Load</div>
          </div>

          <div className="card p-4 text-center">
            <div className="text-3xl font-display text-secondary">
              {userActions.length}
            </div>
            <div className="text-sm text-text-secondary">User Actions</div>
          </div>
        </div>

        {/* Recent Errors */}
        <div className="mb-6">
          <h2 className="text-2xl font-display text-text-primary mb-4">
            🐛 Recent Errors ({errors.length})
          </h2>
          
          {errors.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-text-secondary">No errors! Everything is working perfectly!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {errors.slice(0, 10).map(error => (
                <div key={error.id} className="card p-4 border-l-4 border-danger">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge badge-danger">{error.type}</span>
                        <span className="text-sm text-text-secondary">
                          {error.createdAt && new Date(error.createdAt.toDate()).toLocaleString()}
                        </span>
                      </div>
                      <div className="font-semibold text-text-primary mb-1">
                        {error.message}
                      </div>
                      <div className="text-sm text-text-secondary mb-2">
                        {error.url}
                      </div>
                      {error.userId && (
                        <div className="text-xs text-text-secondary">
                          User: {error.userId}
                        </div>
                      )}
                    </div>
                  </div>
                  {error.stack && (
                    <details className="text-xs text-text-secondary mt-2">
                      <summary className="cursor-pointer">Stack Trace</summary>
                      <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto max-h-40">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Types Breakdown */}
        {Object.keys(errorsByType).length > 0 && (
          <div className="card p-6 mb-6">
            <h3 className="font-display text-lg text-text-primary mb-4">
              Error Types Breakdown
            </h3>
            <div className="space-y-2">
              {Object.entries(errorsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-text-primary">{type}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 bg-danger/20 rounded-full" style={{ width: `${(count / errors.length) * 200}px` }}>
                      <div className="h-full bg-danger rounded-full" style={{ width: '100%' }} />
                    </div>
                    <span className="text-text-secondary text-sm w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        <div className="mb-6">
          <h2 className="text-2xl font-display text-text-primary mb-4">
            ⚡ Performance Issues
          </h2>
          
          {performance.filter(p => p.type === 'slow_resource').length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-4xl mb-2">🚀</div>
              <p className="text-text-secondary">No slow resources detected!</p>
            </div>
          ) : (
            <div className="card p-6">
              <div className="space-y-2">
                {performance
                  .filter(p => p.type === 'slow_resource')
                  .slice(0, 10)
                  .map((perf, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-text-primary truncate">
                          {perf.name}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {perf.createdAt && new Date(perf.createdAt.toDate()).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-warning font-semibold ml-4">
                        {Math.round(perf.duration)}ms
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Page Performance */}
        {pageLoads.length > 0 && (
          <div className="card p-6 mb-6">
            <h3 className="font-display text-lg text-text-primary mb-4">
              Page Load Breakdown (avg)
            </h3>
            <div className="space-y-2">
              {['dns', 'tcp', 'request', 'response', 'dom', 'load'].map(metric => {
                const avg = pageLoads.reduce((sum, p) => sum + (p.metrics?.[metric] || 0), 0) / pageLoads.length;
                return (
                  <div key={metric} className="flex items-center justify-between">
                    <span className="text-text-primary capitalize">{metric}</span>
                    <span className="text-text-secondary">{Math.round(avg)}ms</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Pages */}
        <div className="card p-6 mb-6">
          <h3 className="font-display text-lg text-text-primary mb-4">
            📊 Top Pages
          </h3>
          <div className="space-y-2">
            {topPages.map(([page, count]) => (
              <div key={page} className="flex items-center justify-between">
                <span className="text-text-primary">{page}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-primary/20 rounded-full" style={{ width: `${(count / pageViews.length) * 200}px` }}>
                    <div className="h-full bg-primary rounded-full" style={{ width: '100%' }} />
                  </div>
                  <span className="text-text-secondary text-sm w-12 text-right">{count} views</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel Analysis */}
        {Object.keys(funnelData).length > 0 && (
          <div className="card p-6 mb-6">
            <h3 className="font-display text-lg text-text-primary mb-4">
              🎯 Conversion Funnels
            </h3>
            {Object.entries(funnelData).map(([funnel, steps]) => {
              const stepEntries = Object.entries(steps).sort();
              const maxCount = Math.max(...Object.values(steps));
              
              return (
                <div key={funnel} className="mb-6 last:mb-0">
                  <div className="font-semibold text-text-primary mb-3 capitalize">
                    {funnel.replace(/_/g, ' ')} Funnel
                  </div>
                  <div className="space-y-2">
                    {stepEntries.map(([step, count], idx) => {
                      const percentage = idx === 0 ? 100 : ((count / stepEntries[0][1]) * 100).toFixed(1);
                      const dropOff = idx > 0 ? (((stepEntries[idx - 1][1] - count) / stepEntries[idx - 1][1]) * 100).toFixed(1) : 0;
                      
                      return (
                        <div key={step}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-text-primary capitalize">{step.replace(/_/g, ' ')}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-text-secondary text-sm">{count} users</span>
                              <span className="text-text-secondary text-sm">({percentage}%)</span>
                              {dropOff > 0 && (
                                <span className="text-danger text-sm">-{dropOff}%</span>
                              )}
                            </div>
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${dropOff > 20 ? 'bg-danger' : 'bg-primary'}`}
                              style={{ width: `${(count / maxCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={loadMonitoringData}
          className="w-full btn btn-primary"
          disabled={loading}
        >
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
};

export default MonitoringDashboard;
