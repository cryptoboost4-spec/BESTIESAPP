import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { loadTutorialState } from '../../utils/tutorialHelpers';
import haptic from '../../utils/hapticFeedback';
import toast from 'react-hot-toast';

const TutorialsSection = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tutorialStates, setTutorialStates] = useState({
    home: { completed: false, loading: true },
    checkIn: { completed: false, loading: true },
    besties: { completed: false, loading: true },
    profile: { completed: false, loading: true },
    settings: { completed: false, loading: true }
  });

  // Load tutorial completion states
  useEffect(() => {
    if (!currentUser) return;

    const loadStates = async () => {
      const states = {
        home: { completed: false, loading: true },
        checkIn: { completed: false, loading: true },
        besties: { completed: false, loading: true },
        profile: { completed: false, loading: true },
        settings: { completed: false, loading: true }
      };

      // Home tutorial (uses useTutorialState)
      const homeComplete = localStorage.getItem('tutorial_complete') === 'true';
      states.home = { completed: homeComplete, loading: false };

      // Check-in tutorial
      const checkInComplete = loadTutorialState('checkIn', 'completed');
      states.checkIn = { completed: checkInComplete === true, loading: false };

      // Besties tutorial (new simple system)
      const bestiesComplete = localStorage.getItem('bestiesTutorial_complete') === 'true';
      states.besties = { completed: bestiesComplete, loading: false };

      // Profile tutorial (new simple system)
      const profileComplete = localStorage.getItem('profileTutorial_complete') === 'true';
      states.profile = { completed: profileComplete, loading: false };

      // Settings tutorial (new simple system)
      const settingsComplete = localStorage.getItem('settingsTutorial_complete') === 'true';
      states.settings = { completed: settingsComplete, loading: false };

      // Note: New simple tutorial system uses localStorage only
      // Firestore sync is optional and non-blocking

      setTutorialStates(states);
    };

    loadStates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, location.state]); // tutorialStates intentionally excluded - we create fresh state object

  const handleResetAllTutorials = async () => {
    haptic.medium();
    
    if (!window.confirm('Reset all tutorials? This will clear all tutorial progress and allow you to replay them.')) {
      return;
    }

    try {
      // Clear all tutorial localStorage keys
      localStorage.removeItem('tutorial_complete');
      localStorage.removeItem('current_tutorial_step');
      localStorage.removeItem('checkInTutorial_complete');
      localStorage.removeItem('current_checkInTutorial_step');
      localStorage.removeItem('bestiesTutorial_complete');
      localStorage.removeItem('besties_tooltip_dismissed');
      localStorage.removeItem('profileTutorial_complete');
      localStorage.removeItem('settingsTutorial_complete');
      
      // Clear Firestore (optional, non-blocking)
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, {
            tutorialComplete: false,
            currentTutorialStep: null,
            checkInTutorialComplete: false,
            currentCheckInTutorialStep: null
          });
          
          const tutorialsRef = doc(db, 'users', currentUser.uid, 'settings', 'tutorials');
          await updateDoc(tutorialsRef, {
            'besties.completed': false,
            'profile.completed': false,
            'settings.completed': false
          });
        } catch (error) {
          console.error('Error clearing Firestore tutorial states:', error);
          // Non-critical - localStorage is cleared
        }
      }
      
      // Reload states
      setTutorialStates({
        home: { completed: false, loading: false },
        checkIn: { completed: false, loading: false },
        besties: { completed: false, loading: false },
        profile: { completed: false, loading: false },
        settings: { completed: false, loading: false }
      });
      
      toast.success('All tutorials reset! You can now replay them. 🎉', { duration: 3000 });
    } catch (error) {
      console.error('Error resetting all tutorials:', error);
      toast.error('Failed to reset tutorials. Please try again.');
    }
  };

  const handleRestartTutorial = async (tutorialName) => {
    haptic.light();
    
    try {
      // Clear localStorage for the tutorial
      switch (tutorialName) {
        case 'home':
          localStorage.removeItem('tutorial_complete');
          localStorage.removeItem('current_tutorial_step');
          // Clear Firestore
          if (currentUser) {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
              tutorialComplete: false,
              currentTutorialStep: null
            });
          }
          navigate('/', { state: { restartTutorial: true } });
          toast.success('Home tutorial restarted! 🏠', { duration: 2000 });
          break;
        case 'checkIn':
          localStorage.removeItem('checkInTutorial_complete');
          localStorage.removeItem('current_checkInTutorial_step');
          // Clear Firestore
          if (currentUser) {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
              checkInTutorialComplete: false,
              currentCheckInTutorialStep: 'location'
            });
          }
          // Set tutorial step in localStorage before navigating
          localStorage.setItem('current_checkInTutorial_step', 'location');
          navigate('/create', { state: { showTutorial: true, restartTutorial: true } });
          toast.success('Check-in tutorial restarted! 🛡️', { duration: 2000 });
          break;
        case 'besties':
          // New simple tutorial system
          localStorage.removeItem('bestiesTutorial_complete');
          localStorage.removeItem('besties_tooltip_dismissed');
          navigate('/besties');
          toast.success('Besties tutorial restarted! 💜', { duration: 2000 });
          break;
        case 'profile':
          // New simple tutorial system
          localStorage.removeItem('profileTutorial_complete');
          navigate('/profile');
          toast.success('Profile tutorial restarted! ✨', { duration: 2000 });
          break;
        case 'settings':
          // New simple tutorial system
          localStorage.removeItem('settingsTutorial_complete');
          // Reload page to restart tutorial
          window.location.reload();
          toast.success('Settings tutorial restarted! ⚙️', { duration: 2000 });
          break;
        default:
          // Unknown tutorial name
          break;
      }
    } catch (error) {
      console.error(`Error restarting ${tutorialName} tutorial:`, error);
      toast.error('Failed to restart tutorial. Please try again.');
    }
  };

  const tutorials = [
    {
      id: 'home',
      name: 'Home Page',
      description: 'Learn how to create check-ins',
      emoji: '🏠',
      route: '/',
      completed: tutorialStates.home.completed
    },
    {
      id: 'checkIn',
      name: 'Check-In Tutorial',
      description: 'Practice creating your first check-in',
      emoji: '🛡️',
      route: '/create',
      completed: tutorialStates.checkIn.completed
    },
    {
      id: 'besties',
      name: 'Besties Page',
      description: 'Explore your social feed and besties',
      emoji: '💜',
      route: '/besties',
      completed: tutorialStates.besties.completed
    },
    {
      id: 'profile',
      name: 'Profile Page',
      description: 'Learn about your profile and stats',
      emoji: '✨',
      route: '/profile',
      completed: tutorialStates.profile.completed
    },
    {
      id: 'settings',
      name: 'Settings',
      description: 'Learn about app settings',
      emoji: '⚙️',
      route: '/settings',
      completed: tutorialStates.settings.completed
    }
  ];

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display text-text-primary">Tutorials</h2>
        <button
          onClick={handleResetAllTutorials}
          className="btn btn-secondary text-sm px-4 py-2"
        >
          Reset All
        </button>
      </div>
      <p className="text-sm text-text-secondary mb-4">
        Restart any tutorial to learn or review features. Tutorials will automatically start when you navigate to the page.
      </p>
      
      <div className="space-y-3">
        {tutorials.map((tutorial) => (
          <div
            key={tutorial.id}
            className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary transition-colors bg-gray-50 dark:bg-gray-800/50"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="text-3xl">{tutorial.emoji}</div>
              <div className="flex-1">
                <div className="font-semibold text-text-primary flex items-center gap-2">
                  {tutorial.name}
                  {tutorial.completed && (
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                      ✓ Completed
                    </span>
                  )}
                </div>
                <div className="text-sm text-text-secondary">{tutorial.description}</div>
              </div>
            </div>
            <button
              onClick={() => handleRestartTutorial(tutorial.id)}
              className="btn btn-secondary text-sm px-4 py-2 whitespace-nowrap"
            >
              Restart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TutorialsSection;

