import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getConnectionEmoji, formatTimeAgo } from '../../services/connectionStrength';

const ConnectionsList = ({ connections, circleBesties }) => {
  const navigate = useNavigate();

  return (
    <div className="card p-6 mb-6">
      <h2 className="text-xl font-display text-gradient mb-4">Your Connections</h2>

      <div className="space-y-3">
        {connections.map((connection, idx) => {
          const bestie = circleBesties.find(b => b.id === connection.id) || circleBesties[idx];
          if (!bestie) return null;

          return (
            <button
              key={bestie.id}
              onClick={() => navigate(`/user/${bestie.id}`)}
              className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-lg transition-all border-2 border-transparent hover:border-purple-200"
            >
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                {bestie.photoURL ? (
                  <img
                    src={bestie.photoURL}
                    alt={bestie.name}
                    className="w-14 h-14 rounded-full object-cover ring-4 ring-purple-200"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center text-white font-display text-xl ring-4 ring-purple-200">
                    {bestie.name[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-left">
                <div className="font-semibold text-text-primary text-lg">{bestie.name}</div>
                <div className="text-sm text-gray-600">
                  Last interaction: {formatTimeAgo(bestie.lastInteraction)}
                </div>
              </div>

              {/* Connection Score */}
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getConnectionEmoji(connection.total)}</span>
                  <span className="font-bold text-2xl text-gradient">{connection.total}</span>
                </div>
                <div className="text-xs font-semibold text-gray-500 capitalize">{connection.level}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ConnectionsList;
