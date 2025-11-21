import React from 'react';

// Minimal Layout - Clean, zen, sophisticated
const MinimalLayout = ({
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
    <div className="relative w-full p-12 text-center">
      {/* Decorative Elements (minimal, sparse) */}
      {decorativeElements && decorativeElements.length > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {decorativeElements.slice(0, 2).map((element, index) => (
            <div
              key={index}
              className="absolute"
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                width: element.size || 20,
                height: element.size || 20,
                color: element.color || 'currentColor',
                opacity: (element.opacity || 1) * 0.3,
                transform: 'translate(-50%, -50%)'
              }}
              dangerouslySetInnerHTML={{ __html: element.svg }}
            />
          ))}
        </div>
      )}

      {/* Spacer */}
      <div className="h-6" />

      {/* Small, elegant photo */}
      <div className="relative inline-block z-10 mb-6">
        <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center text-white text-3xl font-display overflow-hidden shadow-lg">
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span>{displayName?.[0] || 'U'}</span>
          )}
        </div>
      </div>

      {/* Name - Elegant */}
      <h1
        className={`${nameSizeClass || 'text-3xl'} font-display bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4`}
        style={nameStyle}
      >
        {displayName || 'User'}
      </h1>

      {/* Thin divider */}
      <div className="w-12 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent mx-auto mb-4" />

      {/* Bio - Minimal */}
      {bio && (
        <p
          className={`${bioSizeClass || 'text-sm'} text-gray-600 dark:text-gray-400 max-w-xs mx-auto mb-6 leading-relaxed`}
          style={bioStyle}
        >
          {bio}
        </p>
      )}

      {/* Badges - Minimal icons only */}
      {badges && badges.length > 0 && (
        <div className="flex gap-4 justify-center mb-6">
          {badges.slice(0, 3).map((badge, index) => (
            <div
              key={index}
              className="text-2xl opacity-70 hover:opacity-100 transition-opacity"
              title={badge.name}
            >
              {badge.icon || badge.emoji}
            </div>
          ))}
        </div>
      )}

      {/* Stats - Minimal */}
      {stats && (
        <div className="text-xs font-light text-gray-500 dark:text-gray-500 space-x-3">
          {stats.besties && <span>{stats.besties} besties</span>}
          {stats.besties && stats.checkIns && <span>•</span>}
          {stats.checkIns && <span>{stats.checkIns} check-ins</span>}
        </div>
      )}

      {/* Spacer */}
      <div className="h-6" />
    </div>
  );
};

export default MinimalLayout;
