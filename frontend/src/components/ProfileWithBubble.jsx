import React from 'react';

/**
 * Reusable component that wraps profile photos and shows support message bubble
 * Shows everywhere a user's profile photo appears
 */
const ProfileWithBubble = ({
  photoURL,
  name,
  requestAttention,
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  className = '',
  showBubble = true,
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  // Bubble size based on profile size
  const bubbleSizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1',
    xl: 'text-sm px-3 py-2',
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const bubbleSize = bubbleSizes[size] || bubbleSizes.md;

  // Show bubble only if requestAttention is active and showBubble is true
  const shouldShowBubble = showBubble && requestAttention?.active && requestAttention?.tag;

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Profile Photo */}
      {photoURL ? (
        <img
          src={photoURL}
          alt={name}
          className={`${sizeClass} rounded-full object-cover ring-2 ring-white shadow-md`}
          onError={(e) => {
            // Fallback to gradient circle if image fails
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}

      {/* Fallback gradient circle */}
      <div
        className={`${sizeClass} bg-gradient-primary rounded-full flex items-center justify-center text-white font-display ring-2 ring-white shadow-md`}
        style={{ display: photoURL ? 'none' : 'flex' }}
      >
        {name?.[0]?.toUpperCase() || '?'}
      </div>

      {/* Speech Bubble - Only shows when user requests attention */}
      {shouldShowBubble && (
        <div className="absolute -top-2 -right-2 z-10 animate-bounce-slow">
          {/* Speech bubble */}
          <div className={`bg-purple-500 text-white rounded-full ${bubbleSize} font-semibold whitespace-nowrap shadow-lg relative`}>
            {requestAttention.tag}

            {/* Small triangle pointer to profile */}
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-purple-500"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileWithBubble;
