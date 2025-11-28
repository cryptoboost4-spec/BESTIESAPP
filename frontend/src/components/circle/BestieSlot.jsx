import React from 'react';
import ProfileWithBubble from '../ProfileWithBubble';
import { getConnectionEmoji, formatTimeAgo } from '../../services/connectionStrength';

const BestieSlot = ({
  bestie,
  index,
  selectedSlot,
  setSelectedSlot,
  connectionStrength,
  loadingConnections,
  lastSeenTime,
  getStatusInfo,
  handleViewProfile,
  setShowReplaceModal,
  handleRemoveFromCircle,
}) => {
  const status = getStatusInfo(bestie);
  const angle = (index * 72 - 90) * (Math.PI / 180);
  const radius = 45;
  const x = 50 + radius * Math.cos(angle);
  const y = 50 + radius * Math.sin(angle);

  return (
    <div
      className="absolute"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="relative group">
        {/* Bestie Circle - clickable with status ring */}
        <button
          onClick={() => setSelectedSlot(selectedSlot === index ? null : index)}
          className="relative hover:scale-110 transition-all duration-300"
        >
          <div
            className={`w-14 h-14 md:w-16 md:h-16 rounded-full shadow-xl border-4 border-white hover:shadow-2xl ${
              connectionStrength?.total >= 90
                ? 'ring-6 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)]'
                : `${status.ringColor} ring-4`
            } hover:ring-6 overflow-hidden flex items-center justify-center relative ${
              connectionStrength?.total >= 90 ? 'animate-breathe-glow' : 'animate-breathe-subtle'
            }`}
            style={{ animationDelay: `${index * 0.3}s` }}
          >
            <ProfileWithBubble
              photoURL={bestie.photoURL}
              name={bestie.name || 'Bestie'}
              requestAttention={bestie.requestAttention}
              size="xl"
              showBubble={true}
              className="w-full h-full"
            />

            {/* Status Badge */}
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${status.color} rounded-full border-2 border-white flex items-center justify-center text-xs shadow-lg animate-pulse-gentle`}>
              {status.emoji}
            </div>

            {/* Connection Strength Badge - Always Visible with Special Styling for Unbreakable */}
            {connectionStrength && !loadingConnections && (
              <div
                className={`absolute -top-1 -left-1 w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg ${
                  connectionStrength.total >= 90
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.8)] animate-pulse-glow'
                    : 'bg-gradient-to-br from-white to-gray-100 border-purple-300'
                }`}
              >
                <span className="text-base">{getConnectionEmoji(connectionStrength.total)}</span>
              </div>
            )}

            {/* Mutual Circle Badge - Top Right */}
            {bestie.isMutual && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg animate-pulse-gentle">
                <span className="text-xs">💕</span>
              </div>
            )}
          </div>
        </button>

        {/* Enhanced Tooltip with Connection Strength */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 transform group-hover:-translate-y-1">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-xl text-xs font-semibold shadow-2xl min-w-max">
            <div className="flex items-center gap-2 mb-2">
              <div className="font-bold text-sm">{bestie.name || 'Unknown'}</div>
              {bestie.isMutual && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  💕 Mutual
                </span>
              )}
            </div>
            {connectionStrength && !loadingConnections && (
              <>
                <div className="flex items-center gap-2 text-white/90 mb-1">
                  <span className="text-lg">{getConnectionEmoji(connectionStrength.total)}</span>
                  <span>{connectionStrength.total}/100</span>
                  <span className="capitalize px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {connectionStrength.level}
                  </span>
                </div>
              </>
            )}
            {lastSeenTime && (
              <div className="text-white/90 text-xs mt-2 flex items-center gap-1">
                <span>💬</span>
                <span>Last connected: {formatTimeAgo(lastSeenTime)}</span>
              </div>
            )}
            {bestie.isMutual && (
              <div className="text-white/80 text-xs mt-2 italic">
                You're both in each other's top 5 ✨
              </div>
            )}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-pink-600"></div>
          </div>
        </div>

        {/* Action Menu */}
        {selectedSlot === index && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-lg shadow-xl border-2 border-gray-200 p-2 z-[200] w-40">
            <button
              onClick={() => handleViewProfile(bestie.id)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm font-semibold text-gray-700"
            >
              👤 View Profile
            </button>
            <button
              onClick={() => setShowReplaceModal(true)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm font-semibold text-gray-700"
            >
              🔄 Replace
            </button>
            <button
              onClick={() => handleRemoveFromCircle(index)}
              className="w-full text-left px-3 py-2 hover:bg-red-50 rounded text-sm font-semibold text-red-600"
            >
              ❌ Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BestieSlot;
