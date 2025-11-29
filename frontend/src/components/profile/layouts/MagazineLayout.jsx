import React from 'react';

// Magazine Cover Layout - Editorial, sophisticated
const MagazineLayout = ({
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
    <div className="relative w-full p-6 text-left">
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

      {/* Photo and Name Section */}
      <div className="relative flex items-start gap-4 mb-4 z-10">
        <div
          className={`w-24 h-24 bg-gradient-primary flex items-center justify-center text-white text-3xl font-display overflow-hidden flex-shrink-0 ${getPhotoShapeClass()} ${getPhotoBorderClass()}`}
        >
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span>{displayName?.[0] || 'U'}</span>
          )}
        </div>

        <div className="flex-1 pt-2">
          <h1
            className={`${nameSizeClass || 'text-3xl'} font-display bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight`}
            style={nameStyle}
          >
            {displayName || 'User'}
          </h1>
        </div>
      </div>

      {/* Bio */}
      {bio && (
        <p
          className={`${bioSizeClass || 'text-base'} text-gray-800 dark:text-gray-200 mb-4`}
          style={bioStyle}
        >
          "{bio}"
        </p>
      )}

      {/* Badges - List Style */}
      {badges && badges.length > 0 && (
        <div className="space-y-2 mb-4">
          {badges.slice(0, 3).map((badge, index) => (
            <div
              key={index}
              className="flex items-center gap-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md"
            >
              <span className="text-2xl">{badge.icon || badge.emoji}</span>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {badge.name || 'Badge'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Stats - Inline */}
      {stats && (
        <div className="flex gap-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
          {stats.besties && <div>👥 {stats.besties}</div>}
          {stats.checkIns && <div>✨ {stats.checkIns}</div>}
        </div>
      )}
    </div>
  );
};

export default MagazineLayout;
