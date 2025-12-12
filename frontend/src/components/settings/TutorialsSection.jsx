import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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

      // Besties tutorial
      const bestiesComplete = loadTutorialState('besties', 'completed');
      states.besties = { completed: bestiesComplete === true, loading: false };

      // Profile tutorial
      const profileComplete = loadTutorialState('profile', 'completed');
      states.profile = { completed: profileComplete === true, loading: false };

      // Settings tutorial
      const settingsComplete = loadTutorialState('settings', 'completed');
      states.settings = { completed: settingsComplete === true, loading: false };

      // Also check Firestore for cross-device sync
      try {
        const tutorialsRef = doc(db, 'users', currentUser.uid, 'settings', 'tutorials');
        const docSnap = await getDoc(tutorialsRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.besties?.completed) states.besties.completed = true;
          if (data.profile?.completed) states.profile.completed = true;
          if (data.settings?.completed) states.settings.completed = true;
        }
      } catch (error) {
        console.error('Error loading tutorial states from Firestore:', error);
      }

      setTutorialStates(states);
    };

    loadStates();
  }, [currentUser, location.state]);

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
              currentCheckInTutorialStep: null
            });
          }
          navigate('/create-check-in', { state: { showTutorial: true, restartTutorial: true } });
          toast.success('Check-in tutorial restarted! 🛡️', { duration: 2000 });
          break;
        case 'besties':
          localStorage.removeItem('besties_tutorial_completed');
          localStorage.removeItem('besties_tutorial_dismissed');
          localStorage.removeItem('besties_tutorial_completed_at');
          // Clear Firestore
          if (currentUser) {
            const tutorialsRef = doc(db, 'users', currentUser.uid, 'settings', 'tutorials');
            await updateDoc(tutorialsRef, {
              'besties.completed': false,
              'besties.completedAt': null,
              'besties.dismissed': false,
              'besties.dismissedAt': null
            });
          }
          navigate('/besties', { state: { restartTutorial: true } });
          toast.success('Besties tutorial restarted! 💜', { duration: 2000 });
          break;
        case 'profile':
          localStorage.removeItem('profile_tutorial_completed');
          localStorage.removeItem('profile_tutorial_dismissed');
          localStorage.removeItem('profile_tutorial_completed_at');
          // Clear Firestore
          if (currentUser) {
            const tutorialsRef = doc(db, 'users', currentUser.uid, 'settings', 'tutorials');
            await updateDoc(tutorialsRef, {
              'profile.completed': false,
              'profile.completedAt': null,
              'profile.dismissed': false,
              'profile.dismissedAt': null
            });
          }
          navigate('/profile', { state: { restartTutorial: true } });
          toast.success('Profile tutorial restarted! ✨', { duration: 2000 });
          break;
        case 'settings':
          localStorage.removeItem('settings_tutorial_completed');
          localStorage.removeItem('settings_tutorial_dismissed');
          localStorage.removeItem('settings_tutorial_completed_at');
          // Clear Firestore
          if (currentUser) {
            const tutorialsRef = doc(db, 'users', currentUser.uid, 'settings', 'tutorials');
            await updateDoc(tutorialsRef, {
              'settings.completed': false,
              'settings.completedAt': null,
              'settings.dismissed': false,
              'settings.dismissedAt': null
            });
          }
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
      route: '/create-check-in',
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
      description: 'Customize your profile and track progress',
      emoji: '✨',
      route: '/profile',
      completed: tutorialStates.profile.completed
    },
    {
      id: 'settings',
      name: 'Settings Page',
      description: 'Configure notifications and privacy',
      emoji: '⚙️',
      route: '/settings',
      completed: tutorialStates.settings.completed
    }
  ];

  return (
    <div className="card p-6 mb-6">
      <h2 className="text-xl font-display text-text-primary mb-4">Tutorials</h2>
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

