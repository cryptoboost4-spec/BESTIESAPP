import React from 'react';

const ActivityFilters = ({ activeFilter, setActiveFilter }) => {
  const filters = [
    { id: 'all', label: 'All Besties' },
    { id: 'circle', label: '💜 Circle' },
    { id: 'active', label: '🔔 Active' }
  ];

  return (
    <div className="card p-3 md:p-4">
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 md:mx-0 md:px-0">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-3 md:px-4 py-2 rounded-full whitespace-nowrap font-semibold text-xs md:text-sm flex-shrink-0 ${
              activeFilter === filter.id
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ActivityFilters;
