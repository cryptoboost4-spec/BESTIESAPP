import React from 'react';
import CountUp from '../CountUp';

const DonationStatus = ({ userData }) => {
  if (!userData?.donationStats?.isActive) {
    return null;
  }

  return (
    <div className="card p-6 mb-6 bg-gradient-primary text-white">
      <h3 className="font-display text-xl mb-2">💜 Thank You!</h3>
      <p className="mb-2">
        You're helping keep Besties free for everyone
      </p>
      <div className="text-2xl font-display">
        $<CountUp end={userData.donationStats.totalDonated} duration={2000} /> donated
      </div>
    </div>
  );
};

export default DonationStatus;
