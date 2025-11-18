import React, { useState, useEffect } from 'react';
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

const HomePage = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [activeCheckIns, setActiveCheckIns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

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
              : 'Ready to check in?'}
          </p>
        </div>

        {/* Quick Check-In Buttons */}
        {activeCheckIns.length === 0 && (
          <QuickButtons onQuickCheckIn={handleQuickCheckIn} />
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

        {/* Donation Card */}
        {!userData?.donationStats?.isActive && <DonationCard />}

        {/* Create Check-In Button */}
        {activeCheckIns.length === 0 && (
          <button
            onClick={() => navigate('/create')}
            className="w-full btn btn-primary text-lg py-4"
          >
            ✨ Create Custom Check-In
          </button>
        )}
      </div>

      {/* Emergency SOS Button */}
      <EmergencySOSButton />
    </div>
  );
};

export default HomePage;
