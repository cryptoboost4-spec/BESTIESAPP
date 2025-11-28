import React from 'react';

const TimeRangeFilter = ({ timeRange, setTimeRange }) => {
  return (
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
  );
};

export default TimeRangeFilter;
