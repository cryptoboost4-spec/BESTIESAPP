import React from 'react';

const TopLocations = ({ topLocations }) => {
  return (
    <div className="card p-6">
      <h3 className="font-display text-xl text-text-primary mb-4">📍 Top Check-in Locations</h3>
      {topLocations.length > 0 ? (
        <div className="space-y-2">
          {topLocations.map((loc, idx) => (
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
  );
};

export default TopLocations;
