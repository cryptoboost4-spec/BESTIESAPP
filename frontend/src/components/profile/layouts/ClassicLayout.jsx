import React from 'react';

// Classic Centered Layout - Traditional, easy to read
const ClassicLayout = ({
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
      heart: 'rounded-full' // Will add custom shape later
    };
    return shapes[photoShape] || 'rounded-full';
  };

  const getPhotoBorderClass = () => {
    const borders = {
      none: '',
      classic: 'border-4 border-white shadow-2xl ring-4 ring-purple-200',
      metallic: 'border-4 border-yellow-400 shadow-2xl ring-4 ring-yellow-300',
      scalloped: 'border-4 border-white shadow-2xl',
      dotted: 'border-4 border-dashed border-white shadow-xl'
    };
    return borders[photoBorder] || '';
  };

  return (
    <div className="relative w-full p-8 text-center">
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

      {/* Profile Photo */}
      <div className="relative inline-block z-10 mb-4">
        <div
          className={`w-36 h-36 bg-gradient-primary flex items-center justify-center text-white text-5xl font-display overflow-hidden hover:scale-105 transition-all ${getPhotoShapeClass()} ${getPhotoBorderClass()}`}
        >
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span>{displayName?.[0] || 'U'}</span>
          )}
        </div>
      </div>

      {/* Name */}
      <h1
        className={`${nameSizeClass || 'text-4xl'} font-display bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3`}
        style={nameStyle}
      >
        {displayName || 'User'}
      </h1>

      {/* Bio */}
      {bio && (
        <p
          className={`${bioSizeClass || 'text-xl'} text-gray-800 dark:text-gray-200 max-w-md mx-auto mt-4`}
          style={bioStyle}
        >
          "{bio}"
        </p>
      )}

      {/* Badges */}
      {badges && badges.length > 0 && (
        <div className="flex gap-3 justify-center mt-6 flex-wrap">
          {badges.slice(0, 3).map((badge, index) => (
            <div
              key={index}
              className="w-16 h-16 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-3xl hover:scale-110 transition-transform"
              title={badge.name}
            >
              {badge.icon || badge.emoji}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="mt-6 text-sm font-semibold text-gray-700 dark:text-gray-300 space-y-1">
          {stats.besties && <div>👥 {stats.besties} Besties</div>}
          {stats.checkIns && <div>✨ {stats.checkIns} Check-ins</div>}
        </div>
      )}
    </div>
  );
};

export default ClassicLayout;
