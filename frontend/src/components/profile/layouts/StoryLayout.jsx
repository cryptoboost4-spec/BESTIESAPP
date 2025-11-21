import React from 'react';

// Story/Full Bleed Layout - Instagram Story style, maximum impact
const StoryLayout = ({
  profilePhoto,
  displayName,
  bio,
  badges,
  stats,
  nameStyle,
  bioStyle,
  nameSizeClass,
  bioSizeClass,
  photoShape,
  decorativeElements
}) => {
  return (
    <div className="relative w-full min-h-[400px] p-6 flex flex-col items-center justify-center text-center">
      {/* Decorative Elements */}
      {decorativeElements && decorativeElements.length > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {decorativeElements.map((element, index) => (
            <div
              key={index}
              className="absolute"
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                width: element.size || 24,
                height: element.size || 24,
                color: element.color || 'currentColor',
                opacity: element.opacity || 1,
                transform: 'translate(-50%, -50%)'
              }}
              dangerouslySetInnerHTML={{ __html: element.svg }}
            />
          ))}
        </div>
      )}

      {/* Large Photo */}
      <div className="relative z-10 mb-6">
        <div className="w-40 h-40 bg-gradient-primary rounded-full flex items-center justify-center text-white text-6xl font-display overflow-hidden shadow-2xl ring-4 ring-white/50">
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span>{displayName?.[0] || 'U'}</span>
          )}
        </div>
      </div>

      {/* Name - Overlaid */}
      <h1
        className={`${nameSizeClass || 'text-5xl'} font-display text-white drop-shadow-2xl mb-3 z-10 relative`}
        style={{...nameStyle, textShadow: '0 2px 10px rgba(0,0,0,0.3)'}}
      >
        {displayName || 'User'}
      </h1>

      {/* Bio - Overlaid */}
      {bio && (
        <p
          className={`${bioSizeClass || 'text-lg'} text-white drop-shadow-lg max-w-xs mx-auto mb-6 z-10 relative`}
          style={{...bioStyle, textShadow: '0 1px 5px rgba(0,0,0,0.3)'}}
        >
          "{bio}"
        </p>
      )}

      {/* Badges - Overlaid */}
      {badges && badges.length > 0 && (
        <div className="flex gap-3 justify-center mb-4 z-10 relative">
          {badges.slice(0, 3).map((badge, index) => (
            <div
              key={index}
              className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm shadow-xl flex items-center justify-center text-2xl"
              title={badge.name}
            >
              {badge.icon || badge.emoji}
            </div>
          ))}
        </div>
      )}

      {/* Stats - Minimal */}
      {stats && (
        <div className="text-sm font-semibold text-white/90 drop-shadow-lg z-10 relative">
          {stats.besties && stats.checkIns && (
            <span>{stats.besties} • {stats.checkIns} • ✨</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StoryLayout;
