import React from 'react';

// Polaroid Stack Layout - Nostalgic, scrapbook vibes
const PolaroidLayout = ({
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
    <div className="relative w-full p-6 text-center">
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

      {/* Main Polaroid */}
      <div className="inline-block bg-white shadow-2xl p-3 pb-12 transform rotate-1 hover:rotate-0 transition-transform z-10 relative">
        <div className="w-56 h-56 bg-gradient-primary flex items-center justify-center text-white text-5xl font-display overflow-hidden">
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span>{displayName?.[0] || 'U'}</span>
          )}
        </div>
        <div className="mt-3 text-center">
          <h1
            className={`${nameSizeClass || 'text-2xl'} font-display text-gray-800`}
            style={{...nameStyle, background: 'none', WebkitTextFillColor: 'initial'}}
          >
            {displayName || 'User'}
          </h1>
        </div>
      </div>

      {/* Bio */}
      {bio && (
        <p
          className={`${bioSizeClass || 'text-sm'} text-gray-800 dark:text-gray-200 mt-4 max-w-xs mx-auto`}
          style={bioStyle}
        >
          "{bio}"
        </p>
      )}

      {/* Badge Polaroids */}
      {badges && badges.length > 0 && (
        <div className="flex gap-3 justify-center mt-4 flex-wrap">
          {badges.slice(0, 3).map((badge, index) => (
            <div
              key={index}
              className="inline-block bg-white shadow-lg p-2 pb-6 transform -rotate-2 hover:rotate-0 transition-transform"
            >
              <div className="w-12 h-12 flex items-center justify-center text-2xl">
                {badge.icon || badge.emoji}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="mt-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
          {stats.besties && stats.checkIns && (
            <span>{stats.besties} Besties • {stats.checkIns} Check-ins</span>
          )}
        </div>
      )}
    </div>
  );
};

export default PolaroidLayout;
