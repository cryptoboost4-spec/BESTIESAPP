import React from 'react';

const MeetingInfoSection = ({
  meetingWith,
  setMeetingWith,
  socialMediaLinks,
  setSocialMediaLinks,
  socialMediaExpanded,
  setSocialMediaExpanded
}) => {
  return (
    <div className="mb-6">
      <label className="block text-lg font-display text-text-primary mb-3">
        Who are you meeting? 👥 (Optional)
      </label>
      <input
        type="text"
        value={meetingWith}
        onChange={(e) => setMeetingWith(e.target.value)}
        className="input mb-3"
        placeholder="e.g., Alex, Sarah, John..."
      />

      {/* Social Media Button/Input */}
      {socialMediaExpanded ? (
        <div className="animate-fade-in">
          <label className="block text-sm font-semibold text-text-secondary mb-2">
            Their Social Media
          </label>
          <input
            type="text"
            value={socialMediaLinks}
            onChange={(e) => setSocialMediaLinks(e.target.value)}
            className="input mb-2"
            placeholder="e.g., @username on Instagram, facebook.com/profile..."
            autoFocus
          />
          <button
            type="button"
            onClick={() => setSocialMediaExpanded(false)}
            className="w-full btn btn-secondary text-sm py-2"
          >
            Done
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setSocialMediaExpanded(true)}
          className={`w-full border-2 ${
            socialMediaLinks
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-primary hover:bg-primary/5'
          } rounded-xl p-3 text-sm font-semibold transition-all`}
        >
          {socialMediaLinks ? '✓ Social Media Added' : '📱 Add Their Social Media'}
        </button>
      )}
    </div>
  );
};

export default MeetingInfoSection;
