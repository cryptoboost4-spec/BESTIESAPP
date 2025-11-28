import React from 'react';

const StatsCard = ({ value, label, colorClass = 'text-primary', bgClass = '' }) => {
  return (
    <div className={`card p-4 text-center ${bgClass}`}>
      <div className={`text-3xl font-display ${colorClass}`}>{value}</div>
      <div className="text-sm text-text-secondary">{label}</div>
    </div>
  );
};

export default StatsCard;
