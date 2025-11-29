import React from 'react';

// Split Screen Layout - Modern, balanced
const SplitScreenLayout = ({
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
  photoBorder,
  decorativeElements
}) => {
  const getPhotoShapeClass = () => {
    const shapes = {
      circle: 'rounded-full',
      square: 'rounded-none',
      rounded: 'rounded-2xl',
      heart: 'rounded-full'
    };
    return shapes[photoShape] || 'rounded-2xl';
  };

  const getPhotoBorderClass = () => {
    const borders = {
      none: 'shadow-xl',
      classic: 'border-4 border-white shadow-2xl',
      metallic: 'border-4 border-gradient-to-r from-yellow-400 to-pink-500 shadow-2xl',
      scalloped: 'border-4 border-white shadow-2xl'
    };
    return borders[photoBorder] || 'shadow-xl';
  };

  return (
    <div className="relative w-full p-6">
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

      {/* Main Content - Split Layout */}
      <div className="flex items-center gap-4 mb-4 z-10 relative">
        {/* Left: Photo */}
        <div
          className={`w-28 h-28 bg-gradient-primary flex items-center justify-center text-white text-4xl font-display overflow-hidden flex-shrink-0 ${getPhotoShapeClass()} ${getPhotoBorderClass()}`}
        >
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span>{displayName?.[0] || 'U'}</span>
          )}
        </div>

        {/* Right: Info */}
        <div className="flex-1">
          <h1
            className={`${nameSizeClass || 'text-2xl'} font-display bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight mb-1`}
            style={nameStyle}
          >
            {displayName || 'User'}
          </h1>
          {bio && (
            <p
              className={`${bioSizeClass || 'text-sm'} text-gray-800 dark:text-gray-200 line-clamp-2`}
              style={bioStyle}
            >
              "{bio}"
            </p>
          )}
        </div>
      </div>

      {/* Bottom Section - Split */}
      <div className="flex gap-4 items-center z-10 relative">
        {/* Left: Badges */}
        {badges && badges.length > 0 && (
          <div className="flex gap-2 flex-1">
            {badges.slice(0, 3).map((badge, index) => (
              <div
                key={index}
                className="w-12 h-12 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md flex items-center justify-center text-2xl"
                title={badge.name}
              >
                {badge.icon || badge.emoji}
              </div>
            ))}
          </div>
        )}

        {/* Right: Stats */}
        {stats && (
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-right">
            {stats.besties && <div>👥 {stats.besties}</div>}
            {stats.checkIns && <div>✨ {stats.checkIns}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default SplitScreenLayout;
