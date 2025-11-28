import React from 'react';

const RecentAlerts = ({ recentAlerts }) => {
  return (
    <div className="card p-6">
      <h3 className="font-display text-xl text-text-primary mb-4">🚨 Recent Alerts</h3>
      {recentAlerts.length > 0 ? (
        <div className="space-y-2">
          {recentAlerts.map((alert) => (
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
  );
};

export default RecentAlerts;
