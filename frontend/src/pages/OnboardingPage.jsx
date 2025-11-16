import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OnboardingPage = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const steps = [
    {
      emoji: '💜',
      title: 'Welcome to Besties!',
      description: 'Your safety network for dates, meetups, and going out. Your besties have your back.',
    },
    {
      emoji: '⏰',
      title: 'Check In When You Go Out',
      description: 'Set a timer before your date or meetup. If you don\'t check in as safe, we alert your besties.',
    },
    {
      emoji: '🛡️',
      title: 'Your Besties Get Alerted',
      description: 'Choose up to 5 trusted friends. They\'ll get notified if something seems wrong.',
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      navigate('/');
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === step ? 'w-8 bg-primary' : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Content Card */}
        <div className="card p-8 text-center animate-fade-in">
          <div className="text-7xl mb-6 animate-bounce-slow">
            {steps[step].emoji}
          </div>
          
          <h2 className="font-display text-3xl text-text-primary mb-4">
            {steps[step].title}
          </h2>
          
          <p className="text-lg text-text-secondary mb-8">
            {steps[step].description}
          </p>

          <div className="space-y-3">
            <button
              onClick={handleNext}
              className="w-full btn btn-primary"
            >
              {step < steps.length - 1 ? 'Next' : 'Get Started'}
            </button>

            {step < steps.length - 1 && (
              <button
                onClick={handleSkip}
                className="w-full text-text-secondary hover:text-primary font-semibold"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
