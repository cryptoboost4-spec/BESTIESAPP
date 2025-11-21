import React from 'react';

// Scrapbook Layout - Playful, creative, journaling aesthetic
const ScrapbookLayout = ({
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
      {/* Scattered Decorative Elements */}
      {decorativeElements && decorativeElements.length > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {decorativeElements.map((element, index) => (
            <div
              key={index}
              className="absolute animate-pulse"
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                width: element.size || 24,
                height: element.size || 24,
                color: element.color || 'currentColor',
                opacity: element.opacity || 0.8,
                transform: `translate(-50%, -50%) rotate(${index * 15}deg)`,
                animationDuration: `${2 + index}s`,
                animationDelay: `${index * 0.3}s`
              }}
              dangerouslySetInnerHTML={{ __html: element.svg }}
            />
          ))}
        </div>
      )}

      {/* Additional decorative doodles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        {/* Wavy line doodle */}
        <svg className="absolute top-[20%] left-[10%] w-16 h-8" viewBox="0 0 100 50" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M0,25 Q25,10 50,25 T100,25" />
        </svg>
        {/* Circle doodle */}
        <svg className="absolute bottom-[25%] right-[15%] w-12 h-12" viewBox="0 0 50 50" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="25" cy="25" r="20" />
        </svg>
        {/* Star doodle */}
        <svg className="absolute top-[70%] left-[20%] w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>

      {/* Photo - Slightly rotated */}
      <div className="relative inline-block z-10 mb-4 transform rotate-2">
        <div className="w-32 h-32 bg-gradient-primary rounded-2xl flex items-center justify-center text-white text-4xl font-display overflow-hidden shadow-xl border-4 border-white">
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span>{displayName?.[0] || 'U'}</span>
          )}
        </div>
        {/* Tape effect */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-yellow-100 opacity-70 rounded-sm shadow-md" style={{transform: 'translateX(-50%) rotate(-5deg)'}} />
      </div>

      {/* Name - Playful */}
      <h1
        className={`${nameSizeClass || 'text-3xl'} font-display bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2 relative z-10`}
        style={nameStyle}
      >
        {displayName || 'User'}
        <span className="absolute -right-4 -top-1 text-2xl">✨</span>
      </h1>

      {/* Wavy underline */}
      <svg className="w-32 h-2 mx-auto mb-3 relative z-10" viewBox="0 0 100 10" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M0,5 Q25,0 50,5 T100,5" />
      </svg>

      {/* Bio - Handwritten style */}
      {bio && (
        <p
          className={`${bioSizeClass || 'text-base'} text-gray-800 dark:text-gray-200 max-w-xs mx-auto mb-4 relative z-10`}
          style={bioStyle}
        >
          "{bio}"
        </p>
      )}

      {/* Badges - Sticker style */}
      {badges && badges.length > 0 && (
        <div className="flex gap-3 justify-center mb-4 z-10 relative flex-wrap">
          {badges.slice(0, 3).map((badge, index) => (
            <div
              key={index}
              className="transform hover:scale-110 transition-transform"
              style={{rotate: `${(index - 1) * 5}deg`}}
            >
              <div className="bg-white dark:bg-gray-800 rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-lg border-2 border-gray-200 dark:border-gray-600">
                <span className="text-2xl">{badge.icon || badge.emoji}</span>
                <span className="text-[8px] font-bold text-gray-600 dark:text-gray-400 mt-1">
                  {badge.name?.split(' ')[0] || ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats - Casual */}
      {stats && (
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 z-10 relative">
          {stats.besties && <span>👥{stats.besties} </span>}
          {stats.checkIns && <span>✨{stats.checkIns} </span>}
          {stats.checkIns && <span>☕5</span>}
        </div>
      )}
    </div>
  );
};

export default ScrapbookLayout;
