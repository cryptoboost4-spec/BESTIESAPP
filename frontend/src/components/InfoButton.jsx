import React from 'react';
import toast from 'react-hot-toast';

const InfoButton = ({ message }) => {
  const handleClick = () => {
    toast((t) => (
      <div className="text-sm max-w-sm">
        <div className="flex items-start gap-2">
          <span className="text-lg">ℹ️</span>
          <div>
            <p>{message}</p>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="mt-2 text-primary text-xs underline hover:no-underline"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    ), { duration: 6000 });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="ml-2 text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-purple-400 transition-colors"
      title="Learn more"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    </button>
  );
};

export default InfoButton;
