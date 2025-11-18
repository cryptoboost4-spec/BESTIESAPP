import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import Header from '../components/Header';
import { formatDistanceToNow } from 'date-fns';

const ErrorDashboard = () => {
  const [errors, setErrors] = useState([]);
  const [filter, setFilter] = useState('all'); // all, uncaught_error, custom_error, unhandled_promise
  const [timeFilter, setTimeFilter] = useState('24h'); // 24h, 7d, 30d, all
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = collection(db, 'errors');

    // Apply time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const timeMap = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      const cutoff = new Date(now.getTime() - timeMap[timeFilter]);
      q = query(q, where('timestamp', '>=', cutoff.getTime()));
    }

    // Apply type filter
    if (filter !== 'all') {
      q = query(q, where('type', '==', filter));
    }

    // Order by timestamp descending and limit
    q = query(q, orderBy('timestamp', 'desc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const errorList = [];
      snapshot.forEach((doc) => {
        errorList.push({ id: doc.id, ...doc.data() });
      });
      setErrors(errorList);
      setLoading(false);
    }, (error) => {
      console.error('Error loading errors:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filter, timeFilter]);

  const getErrorSeverity = (error) => {
    if (error.type === 'uncaught_error') return 'critical';
    if (error.type === 'unhandled_promise') return 'high';
    if (error.message?.includes('verification failed')) return 'high';
    if (error.message?.includes('permission-denied')) return 'medium';
    return 'low';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const errorStats = {
    total: errors.length,
    critical: errors.filter(e => getErrorSeverity(e) === 'critical').length,
    high: errors.filter(e => getErrorSeverity(e) === 'high').length,
    medium: errors.filter(e => getErrorSeverity(e) === 'medium').length,
    low: errors.filter(e => getErrorSeverity(e) === 'low').length,
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
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-display text-text-primary mb-2">🚨 Error Dashboard</h1>
          <p className="text-text-secondary">Monitor and track application errors</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="card p-4">
            <div className="text-2xl font-bold text-text-primary">{errorStats.total}</div>
            <div className="text-sm text-text-secondary">Total Errors</div>
          </div>
          <div className="card p-4 border-2 border-red-300">
            <div className="text-2xl font-bold text-red-600">{errorStats.critical}</div>
            <div className="text-sm text-text-secondary">Critical</div>
          </div>
          <div className="card p-4 border-2 border-orange-300">
            <div className="text-2xl font-bold text-orange-600">{errorStats.high}</div>
            <div className="text-sm text-text-secondary">High</div>
          </div>
          <div className="card p-4 border-2 border-yellow-300">
            <div className="text-2xl font-bold text-yellow-600">{errorStats.medium}</div>
            <div className="text-sm text-text-secondary">Medium</div>
          </div>
          <div className="card p-4 border-2 border-blue-300">
            <div className="text-2xl font-bold text-blue-600">{errorStats.low}</div>
            <div className="text-sm text-text-secondary">Low</div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">Type</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Types</option>
                <option value="uncaught_error">Uncaught Errors</option>
                <option value="custom_error">Custom Errors</option>
                <option value="unhandled_promise">Promise Rejections</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">Time Range</label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="input"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error List */}
        <div className="space-y-4">
          {errors.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-4xl mb-4">✨</div>
              <div className="text-xl font-semibold text-text-primary mb-2">No Errors Found</div>
              <div className="text-text-secondary">Everything is running smoothly!</div>
            </div>
          ) : (
            errors.map((error) => {
              const severity = getErrorSeverity(error);
              const severityColor = getSeverityColor(severity);

              return (
                <div key={error.id} className={`card p-4 border-2 ${severityColor}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${severityColor}`}>
                          {severity}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-700">
                          {error.type}
                        </span>
                        <span className="text-sm text-text-secondary">
                          {formatDistanceToNow(error.timestamp)} ago
                        </span>
                      </div>
                      <div className="font-semibold text-text-primary mb-1">
                        {error.message}
                      </div>
                      {error.userId && (
                        <div className="text-sm text-text-secondary">
                          User: {error.userId}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-semibold text-primary hover:underline">
                      View Details
                    </summary>
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>URL:</strong> {error.url}
                        </div>
                        <div>
                          <strong>Session:</strong> {error.sessionId}
                        </div>
                        {error.filename && (
                          <div>
                            <strong>File:</strong> {error.filename}:{error.lineno}:{error.colno}
                          </div>
                        )}
                        {error.details && (
                          <div>
                            <strong>Details:</strong>
                            <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
                              {JSON.stringify(error.details, null, 2)}
                            </pre>
                          </div>
                        )}
                        {error.stack && (
                          <div>
                            <strong>Stack Trace:</strong>
                            <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
                              {error.stack}
                            </pre>
                          </div>
                        )}
                        <div>
                          <strong>User Agent:</strong> {error.userAgent}
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDashboard;
