import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import Header from '../components/Header';
import CheckInCard from '../components/CheckInCard';
import QuickButtons from '../components/QuickButtons';
import DonationCard from '../components/DonationCard';
import TemplateSelector from '../components/TemplateSelector';
import EmergencySOSButton from '../components/EmergencySOSButton';
import BestieCelebrationModal from '../components/BestieCelebrationModal';

// Dynamic supportive messages for girls 💜
const SUPPORTIVE_MESSAGES = [
  "Stay safe out there, queen! 👑",
  "Your besties have your back! 💜",
  "Looking out for you, babe! ✨",
  "Let's keep you safe, hun! 🛡️",
  "Ready to slay safely? 💅",
  "Your safety squad is here! 🌟",
  "Go live your life, we got you! 💕",
  "Be bold, be safe, be you! ⚡",
  "Adventure awaits safely! 🌸",
  "Your crew is watching out! 👯‍♀️",
  "Stay fierce, stay safe! 🔥",
  "We're here if you need us! 🤗",
  "Go make memories safely! 📸",
  "Your safety, your way! 💖",
  "Protected and empowered! ⭐",
  "Living your best life safely! 🦋",
  "Your peace of mind matters! 🌺",
  "Safe vibes only! ✌️",
  "Let's keep you covered, sis! 💪",
  "Confidence + Safety = You! 💎"
];

const HomePage = () => {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeCheckIns, setActiveCheckIns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Random supportive message (changes on each page load)
  const welcomeMessage = useMemo(() => {
    return SUPPORTIVE_MESSAGES[Math.floor(Math.random() * SUPPORTIVE_MESSAGES.length)];
  }, []); // Empty deps = only runs once on mount

  // Auto-redirect to onboarding if user hasn't completed it
  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) return;

    if (userData && userData.onboardingCompleted === false) {
      navigate('/onboarding');
    }
  }, [userData, authLoading, navigate]);

  // Redirect to login if there's a pending invite and user is not logged in
  useEffect(() => {
    if (authLoading) return;

    const pendingInvite = localStorage.getItem('pending_invite');
    if (pendingInvite && !currentUser) {
      console.log('📨 Pending invite detected, redirecting to login...');
      navigate('/login');
    }
  }, [currentUser, authLoading, navigate]);

  useEffect(() => {
    if (!currentUser) return;

    // Listen to active check-ins
    const checkInsQuery = query(
      collection(db, 'checkins'),
      where('userId', '==', currentUser.uid),
      where('status', 'in', ['active', 'alerted'])
    );

    const unsubscribeCheckIns = onSnapshot(
      checkInsQuery, 
      (snapshot) => {
        const checkIns = [];
        snapshot.forEach((doc) => {
          checkIns.push({ id: doc.id, ...doc.data() });
        });
        setActiveCheckIns(checkIns);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading check-ins:', error);
        setActiveCheckIns([]);
        setLoading(false);
      }
    );

    // Listen to templates
    const templatesQuery = query(
      collection(db, 'templates'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribeTemplates = onSnapshot(
      templatesQuery, 
      (snapshot) => {
        const temps = [];
        snapshot.forEach((doc) => {
          temps.push({ id: doc.id, ...doc.data() });
        });
        setTemplates(temps);
      },
      (error) => {
        console.error('Error loading templates:', error);
        setTemplates([]);
      }
    );

    return () => {
      unsubscribeCheckIns();
      unsubscribeTemplates();
    };
  }, [currentUser]);

  const handleQuickCheckIn = (minutes) => {
    navigate('/create', { state: { quickMinutes: minutes } });
  };

  const handleTemplateSelect = (template) => {
    navigate('/create', { state: { template } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pattern">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pattern">
      <Header />

      <div className="max-w-4xl mx-auto p-4 pb-20">
        {/* Welcome Message */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-3xl font-display text-text-primary mb-2">
            Hey {userData?.displayName || 'there'}! 👋
          </h1>
          <p className="text-text-secondary">
            {activeCheckIns.length > 0
              ? `You have ${activeCheckIns.length} active check-in${activeCheckIns.length > 1 ? 's' : ''}`
              : welcomeMessage}
          </p>
        </div>

        {/* Quick Check-In Buttons */}
        {activeCheckIns.length === 0 && (
          <>
            <QuickButtons onQuickCheckIn={handleQuickCheckIn} />

            {/* Create Custom Check-In Button - Moved here! */}
            <button
              onClick={() => navigate('/create')}
              className="w-full btn btn-primary text-lg py-4 mb-6"
            >
              ✨ Create Custom Check-In
            </button>
          </>
        )}

        {/* Active Check-Ins */}
        {activeCheckIns.length > 0 && (
          <div className="mb-6 space-y-4">
            <h2 className="text-xl font-display text-text-primary">Active Check-Ins</h2>
            {activeCheckIns.map((checkIn) => (
              <CheckInCard key={checkIn.id} checkIn={checkIn} />
            ))}
          </div>
        )}

        {/* Templates */}
        {templates.length > 0 && activeCheckIns.length === 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-display text-text-primary mb-4">Your Templates</h2>
            <TemplateSelector
              templates={templates}
              onSelect={handleTemplateSelect}
            />
          </div>
        )}

        {/* Stats Card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg text-text-primary">Your Safety Stats</h3>
            <button
              onClick={() => navigate('/history')}
              className="text-primary font-semibold hover:underline text-sm"
            >
              View History →
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-display text-primary">
                {userData?.stats?.completedCheckIns || 0}
              </div>
              <div className="text-sm text-text-secondary">Check-ins</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display text-secondary">
                {userData?.stats?.totalBesties || 0}
              </div>
              <div className="text-sm text-text-secondary">Besties</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display text-accent">
                {userData?.stats?.totalCheckIns || 0}
              </div>
              <div className="text-sm text-text-secondary">Total</div>
            </div>
          </div>
        </div>

        {/* You're Part of Something Special - Appreciation Card */}
        <div className="card p-6 mb-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100">
          <div className="text-center">
            <div className="text-4xl mb-3">💜</div>
            <h3 className="font-display text-2xl text-gradient mb-3">
              You're Part of Something Special
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Hey bestie! We just wanted to say—you being here means everything.
              Every check-in you create, every friend you add, every safe moment you share...
              you're part of a community that's got each other's backs.
              We're building this together, and we couldn't do it without amazing people like you.
              You're not just using an app—you're one of the besties. 💕
            </p>
            <p className="text-sm text-primary font-semibold">
              Keep slaying safely, queen! 👑✨
            </p>
          </div>
        </div>

        {/* Donation Card */}
        {!userData?.donationStats?.isActive && <DonationCard />}

        {/* OR Divider */}
        {!userData?.donationStats?.isActive && (
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-text-secondary font-semibold">OR</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>
        )}

        {/* Invite Friends Card */}
        {!userData?.donationStats?.isActive && (
          <div className="card p-6 mb-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-100">
            <div className="text-center">
              <div className="text-4xl mb-3">👯‍♀️</div>
              <h3 className="font-display text-2xl text-gradient mb-3">
                Grow the Squad!
              </h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Love Besties? Invite your friends! The more people who join,
                the stronger our safety network becomes. Plus, spreading the word
                helps us keep the app free for everyone. Share the love! 💖
              </p>
              <button
                onClick={() => navigate('/besties')}
                className="btn btn-secondary w-full text-lg py-3"
              >
                🎉 Invite Friends
              </button>
              <p className="text-xs text-text-secondary mt-3">
                Every new friend makes Besties better for everyone!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Emergency SOS Button */}
      <EmergencySOSButton />

      {/* Bestie Celebration Modal */}
      <BestieCelebrationModal />
    </div>
  );
};

export default HomePage;
