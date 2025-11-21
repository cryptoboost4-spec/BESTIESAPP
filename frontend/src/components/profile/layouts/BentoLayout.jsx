import React from 'react';

// Bento Grid Layout - Widget-style, modern and organized
const BentoLayout = ({
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
  const getPhotoShapeClass = () => {
    const shapes = {
      circle: 'rounded-full',
      square: 'rounded-xl',
      rounded: 'rounded-2xl',
      heart: 'rounded-full'
    };
    return shapes[photoShape] || 'rounded-2xl';
  };

  return (
    <div className="relative w-full p-4">
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

      {/* Bento Grid */}
      <div className="grid grid-cols-4 gap-3 z-10 relative">
        {/* Photo + Name (2x2) */}
        <div className="col-span-2 row-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg flex flex-col items-center justify-center text-center">
          <div
            className={`w-20 h-20 bg-gradient-primary flex items-center justify-center text-white text-3xl font-display overflow-hidden mb-2 shadow-md ${getPhotoShapeClass()}`}
          >
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{displayName?.[0] || 'U'}</span>
            )}
          </div>
          <h1
            className={`text-lg font-display bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight`}
            style={nameStyle}
          >
            {displayName || 'User'}
          </h1>
        </div>

        {/* Bio (2x1) */}
        {bio && (
          <div className="col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-3 shadow-lg flex items-center">
            <p
              className={`${bioSizeClass || 'text-base'} text-gray-800 dark:text-gray-200 line-clamp-3`}
              style={bioStyle}
            >
              "{bio}"
            </p>
          </div>
        )}

        {/* Badges (1x1 each) */}
        {badges && badges.slice(0, 3).map((badge, index) => (
          <div
            key={index}
            className="col-span-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-3 shadow-lg flex items-center justify-center text-2xl"
            title={badge.name}
          >
            {badge.icon || badge.emoji}
          </div>
        ))}

        {/* Stats (2x1) */}
        {stats && (
          <div className="col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-3 shadow-lg flex items-center justify-around text-xs font-semibold text-gray-700 dark:text-gray-300">
            {stats.besties && <div>👥 {stats.besties}</div>}
            {stats.checkIns && <div>✨ {stats.checkIns}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default BentoLayout;
