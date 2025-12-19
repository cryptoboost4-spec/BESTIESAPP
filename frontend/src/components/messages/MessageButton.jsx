import React, { useState } from 'react';
import MessageDrawer from './MessageDrawer';

const MessageButton = ({ 
  recipientId, 
  recipientName, 
  recipientPhotoURL,
  contextType = 'spontaneous',
  contextId = null,
  preselectedMessage = null,
  className = '',
  variant = 'default' // 'default', 'support', 'small'
}) => {
  const [showDrawer, setShowDrawer] = useState(false);

  const getButtonContent = () => {
    if (variant === 'support') {
      return (
        <>
          <span>💬</span>
          <span>Send Support</span>
        </>
      );
    }
    if (variant === 'small') {
      return '💬';
    }
    return (
      <>
        <span>💬</span>
        <span>Send Message</span>
      </>
    );
  };

  const getButtonClasses = () => {
    const base = 'btn flex items-center justify-center gap-2';
    
    if (variant === 'support') {
      return `${base} btn-sm bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold ${className}`;
    }
    if (variant === 'small') {
      return `${base} btn-sm btn-primary ${className}`;
    }
    return `${base} btn-primary ${className}`;
  };

  return (
    <>
      <button
        onClick={() => setShowDrawer(true)}
        className={getButtonClasses()}
      >
        {getButtonContent()}
      </button>

      <MessageDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        recipientId={recipientId}
        recipientName={recipientName}
        recipientPhotoURL={recipientPhotoURL}
        contextType={contextType}
        contextId={contextId}
        preselectedMessage={preselectedMessage}
      />
    </>
  );
};

export default MessageButton;

