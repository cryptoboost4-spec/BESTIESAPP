import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import Header from '../components/Header';
import CheckInCard from '../components/CheckInCard';
import QuickButtons from '../components/QuickButtons';
import DonationCard from '../components/DonationCard';
import TemplateSelector from '../components/TemplateSelector';
import EmergencySOSButton from '../components/EmergencySOSButton';
import BestieCelebrationModal from '../components/BestieCelebrationModal';
import toast from 'react-hot-toast';

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

  // Request Attention state
  const [showRequestAttention, setShowRequestAttention] = useState(false);
  const [attentionTag, setAttentionTag] = useState('');

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
              className="w-full btn btn-primary text-lg py-4 mb-4"
            >
              ✨ Create Custom Check-In
            </button>

            {/* Request Attention Button */}
            {userData?.requestAttention?.active ? (
              <div className="card p-4 mb-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">💜</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-display text-purple-900 mb-2">
                      You're requesting attention
                    </h3>
                    <div className="inline-block px-3 py-1 bg-purple-200 text-purple-900 rounded-full text-sm font-semibold mb-2">
                      {userData.requestAttention.tag}
                    </div>
                    <p className="text-sm text-purple-700 mt-2">
                      Your besties can see this on your profile 💜
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await updateDoc(doc(db, 'users', currentUser.uid), {
                          'requestAttention.active': false,
                        });
                        toast.success('Request removed');
                      } catch (error) {
                        console.error('Error canceling request:', error);
                        toast.error('Failed to cancel request');
                      }
                    }}
                    className="text-purple-700 hover:text-purple-900 font-semibold text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="card p-4 mb-6 bg-gradient-to-br from-blue-50 to-purple-50 border border-purple-100">
                <h3 className="text-lg font-display text-gray-800 mb-3">
                  Need Support?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Let your besties know you could use some attention. They'll see a badge on your profile everywhere in the app.
                </p>

                {/* Preview Example */}
                <div className="bg-white rounded-xl p-4 mb-4 border-2 border-purple-200">
                  <p className="text-xs font-semibold text-purple-700 mb-2">Preview:</p>
                  <div className="flex items-center gap-3">
                    {/* User Profile Picture */}
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white text-lg font-display overflow-hidden flex-shrink-0 border-2 border-purple-300">
                      {userData?.photoURL ? (
                        <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        userData?.displayName?.[0] || currentUser?.email?.[0] || 'U'
                      )}
                    </div>

                    {/* Animated Message */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-800 mb-1">
                        {userData?.displayName || 'You'}
                      </div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 border border-purple-300 rounded-full">
                        <span className="text-lg">💬</span>
                        <span className="text-xs font-semibold text-purple-900 scrolling-message">
                          Needs to vent
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowRequestAttention(true)}
                  className="btn btn-primary w-full"
                >
                  💜 Request Attention
                </button>

                {/* CSS for scrolling animation */}
                <style>{`
                  @keyframes scrollMessages {
                    0%, 20% { content: "Needs to vent 💬"; }
                    25%, 45% { content: "Needs a shoulder 🫂"; }
                    50%, 70% { content: "Could use support 💜"; }
                    75%, 95% { content: "Having a rough day 😔"; }
                  }

                  .scrolling-message {
                    animation: fadeText 8s ease-in-out infinite;
                  }

                  .scrolling-message::after {
                    content: "Needs to vent";
                    animation: scrollMessages 8s ease-in-out infinite;
                  }

                  @keyframes fadeText {
                    0%, 18%, 100% { opacity: 1; }
                    20%, 23% { opacity: 0; }
                    25%, 43% { opacity: 1; }
                    45%, 48% { opacity: 0; }
                    50%, 68% { opacity: 1; }
                    70%, 73% { opacity: 0; }
                    75%, 93% { opacity: 1; }
                    95%, 98% { opacity: 0; }
                  }
                `}</style>
              </div>
            )}
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
              <div className="text-sm text-text-secondary">Safe Check-ins</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display text-secondary">
                {userData?.stats?.totalBesties || 0}
              </div>
              <div className="text-sm text-text-secondary">Besties</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display text-accent">
                {activeCheckIns.length}
              </div>
              <div className="text-sm text-text-secondary">Active Now</div>
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

        {/* Want to help us out? Section */}
        {!userData?.donationStats?.isActive && (
          <>
            <div className="text-center mb-4">
              <h2 className="text-2xl font-display text-gradient mb-2">
                Want to help us out? 💜
              </h2>
              <p className="text-text-secondary text-sm">
                Here are all the ways you can support Besties and keep safety accessible for everyone
              </p>
            </div>

            {/* Donation Card */}
            <DonationCard />

            {/* OR Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-text-secondary font-semibold">OR</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* Invite Friends Card */}
            <div className="card p-6 mb-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-100">
              <div className="text-center">
                <div className="text-4xl mb-3">👯‍♀️</div>
                <h3 className="font-display text-2xl text-gradient mb-3">
                  Grow the Squad!
                </h3>
                <p className="text-text-secondary leading-relaxed mb-4">
                  Love Besties? Invite your friends! The more people who join,
                  the stronger our safety network becomes. Plus, it helps us keep
                  the app free for everyone. Share the love! 💖
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
          </>
        )}
      </div>

      {/* Emergency SOS Button */}
      <EmergencySOSButton />

      {/* Bestie Celebration Modal */}
      <BestieCelebrationModal />

      {/* Request Attention Modal */}
      {showRequestAttention && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-display text-text-primary mb-4">
              💜 Request Attention
            </h2>
            <p className="text-base text-text-secondary mb-6">
              Let your besties know you could use some support. This is a non-urgent request - they'll see a badge on your profile throughout the app.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-text-primary mb-2">
                How can your besties help?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAttentionTag('Needs to vent 💬')}
                  className={`p-3 rounded-xl border-2 text-left ${
                    attentionTag === 'Needs to vent 💬'
                      ? 'border-primary bg-purple-50'
                      : 'border-gray-200 hover:border-primary'
                  }`}
                >
                  <div className="text-2xl mb-1">💬</div>
                  <div className="text-sm font-semibold">Needs to vent</div>
                </button>
                <button
                  onClick={() => setAttentionTag('Needs a shoulder 🫂')}
                  className={`p-3 rounded-xl border-2 text-left ${
                    attentionTag === 'Needs a shoulder 🫂'
                      ? 'border-primary bg-purple-50'
                      : 'border-gray-200 hover:border-primary'
                  }`}
                >
                  <div className="text-2xl mb-1">🫂</div>
                  <div className="text-sm font-semibold">Needs a shoulder</div>
                </button>
                <button
                  onClick={() => setAttentionTag('Could use support 💜')}
                  className={`p-3 rounded-xl border-2 text-left ${
                    attentionTag === 'Could use support 💜'
                      ? 'border-primary bg-purple-50'
                      : 'border-gray-200 hover:border-primary'
                  }`}
                >
                  <div className="text-2xl mb-1">💜</div>
                  <div className="text-sm font-semibold">Could use support</div>
                </button>
                <button
                  onClick={() => setAttentionTag('Having a rough day 😔')}
                  className={`p-3 rounded-xl border-2 text-left ${
                    attentionTag === 'Having a rough day 😔'
                      ? 'border-primary bg-purple-50'
                      : 'border-gray-200 hover:border-primary'
                  }`}
                >
                  <div className="text-2xl mb-1">😔</div>
                  <div className="text-sm font-semibold">Rough day</div>
                </button>
                <button
                  onClick={() => setAttentionTag("Let's do something 🎉")}
                  className={`p-3 rounded-xl border-2 text-left ${
                    attentionTag === "Let's do something 🎉"
                      ? 'border-primary bg-purple-50'
                      : 'border-gray-200 hover:border-primary'
                  }`}
                >
                  <div className="text-2xl mb-1">🎉</div>
                  <div className="text-sm font-semibold">Let's hang out</div>
                </button>
                <button
                  onClick={() => setAttentionTag('Want to chat 📱')}
                  className={`p-3 rounded-xl border-2 text-left ${
                    attentionTag === 'Want to chat 📱'
                      ? 'border-primary bg-purple-50'
                      : 'border-gray-200 hover:border-primary'
                  }`}
                >
                  <div className="text-2xl mb-1">📱</div>
                  <div className="text-sm font-semibold">Want to chat</div>
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRequestAttention(false);
                  setAttentionTag('');
                }}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!attentionTag) {
                    toast.error('Please select an option');
                    return;
                  }

                  try {
                    await updateDoc(doc(db, 'users', currentUser.uid), {
                      requestAttention: {
                        active: true,
                        tag: attentionTag,
                        timestamp: Timestamp.now(),
                      }
                    });

                    toast.success('Your besties will see your request 💜');
                    setShowRequestAttention(false);
                    setAttentionTag('');
                  } catch (error) {
                    console.error('Error requesting attention:', error);
                    toast.error('Failed to send request');
                  }
                }}
                className="flex-1 btn btn-primary"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
