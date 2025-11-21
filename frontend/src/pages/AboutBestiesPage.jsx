import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import apiService from '../services/api';
import toast from 'react-hot-toast';

const AboutBestiesPage = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDonation = async (amount) => {
    setLoading(true);
    try {
      const result = await apiService.createCheckoutSession({ amount, type: 'donation' });

      if (result.data && result.data.url) {
        window.location.href = result.data.url;
      } else {
        toast.error('Failed to start donation');
      }
    } catch (error) {
      console.error('Donation error:', error);
      toast.error('Failed to start donation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pattern">
      <Header />

      <div className="max-w-4xl mx-auto p-4 pb-24 md:pb-6">
        {/* Hero Section */}
        <div className="text-center mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-purple-100 to-pink-100 dark:from-pink-900/10 dark:via-purple-900/10 dark:to-pink-900/10 rounded-3xl opacity-50 -z-10"></div>
          <div className="py-12">
            <div className="text-7xl mb-4 animate-pulse-slow">💜</div>
            <h1 className="text-5xl font-display text-gradient mb-6">
              Hey Girl, We've Got Your Back
            </h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              You shouldn't have to worry about your safety when you're just trying to live your life. So we built something to help. 💕
            </p>
          </div>
        </div>

        {/* Why We Exist */}
        <div className="card p-8 mb-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-pink-200 dark:border-pink-700">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-5xl">🌟</div>
            <div>
              <h2 className="text-3xl font-display text-primary dark:text-purple-400 mb-3">You Know That Feeling...</h2>
              <p className="text-lg text-text-secondary leading-relaxed">
                When you're walking to your car at night and text your bestie "text me when I get home"?
              </p>
            </div>
          </div>
          <div className="space-y-4 text-text-secondary text-lg leading-relaxed">
            <p>
              Or when you're on a first date and share your location with your roommate? Or when your mom asks you to check in when you get back from a night out?
            </p>
            <p className="font-semibold text-gray-800 dark:text-gray-200">
              We ALL do this. We're constantly looking out for each other in little ways.
            </p>
            <p>
              Besties just makes it easier. <span className="text-primary font-semibold">You shouldn't have to remember to text everyone</span>. You shouldn't have to explain where you are or why you're worried. Your people should just... know. And be ready to help if something goes wrong.
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mt-6 border-2 border-pink-300 dark:border-pink-600">
              <p className="text-primary dark:text-purple-400 font-display text-xl text-center">
                That's what Besties does. We've got your back, so you can focus on living. 💕
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="card p-8 mb-6">
          <h2 className="text-3xl font-display text-gradient mb-6 text-center">How Besties Works 💜</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-display text-xl flex-shrink-0">1</div>
              <div>
                <h3 className="font-display text-lg text-primary dark:text-purple-400 mb-2">Choose Your Circle</h3>
                <p className="text-text-secondary">Pick up to 5 people you trust - your besties, your mom, your roommate, whoever makes you feel safest.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-display text-xl flex-shrink-0">2</div>
              <div>
                <h3 className="font-display text-lg text-primary dark:text-purple-400 mb-2">Check In When You're Out</h3>
                <p className="text-text-secondary">Going somewhere? Create a quick check-in. Your circle gets notified and keeps an eye on the time.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-display text-xl flex-shrink-0">3</div>
              <div>
                <h3 className="font-display text-lg text-primary dark:text-purple-400 mb-2">They've Got Your Back</h3>
                <p className="text-text-secondary">If you don't check in on time, they get an alert. If something's wrong, they know exactly where you are and can help.</p>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-lg text-gray-700 dark:text-gray-300 italic">
              "Simple, automatic, and always there when you need it. That's the whole point." ✨
            </p>
          </div>
        </div>

        {/* Why We're Different */}
        <div className="card p-8 mb-6 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
          <h2 className="text-3xl font-display text-gradient mb-6 text-center">
            Why Besties is Different 🌸
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border-2 border-pink-200 dark:border-pink-700">
              <div className="text-4xl mb-3">💕</div>
              <h3 className="font-display text-lg text-primary dark:text-purple-400 mb-2">Safety Over Profit</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                We're not here to make money off your fear. Every feature, every decision - it's about keeping you safe, not padding our wallets.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border-2 border-purple-200 dark:border-purple-700">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="font-display text-lg text-primary dark:text-purple-400 mb-2">Your Privacy Matters</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Your location, your check-ins, your data - it's yours. We don't sell it, we don't snoop, and we'll delete it whenever you want.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border-2 border-fuchsia-200 dark:border-fuchsia-700">
              <div className="text-4xl mb-3">✨</div>
              <h3 className="font-display text-lg text-primary dark:text-purple-400 mb-2">Free For Real</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Most apps say "free" but lock everything behind paywalls. Not us. The core features that keep you safe? Always free. Forever.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border-2 border-rose-200 dark:border-rose-700">
              <div className="text-4xl mb-3">🫶</div>
              <h3 className="font-display text-lg text-primary dark:text-purple-400 mb-2">You're Not a Product</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                You're not a data point or a target audience. You're a person who deserves to feel safe. That's how we treat you - like the person you are.
              </p>
            </div>
          </div>
        </div>

        {/* Future Plans */}
        <div className="card p-6 mb-6 bg-gradient-to-br from-purple-50 to-pink-50">
          <h2 className="text-xl font-display text-text-primary mb-4 text-center">
            What's Coming Next 🚀
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-100">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-white text-lg shadow-sm flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-6 h-6 drop-shadow-md">
                  <defs>
                    <linearGradient id="phoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="50%" stopColor="#f3e8ff" />
                      <stop offset="100%" stopColor="#e9d5ff" />
                    </linearGradient>
                  </defs>
                  <rect x="7" y="2" width="10" height="20" rx="2" fill="url(#phoneGradient)" stroke="#ffffff" strokeWidth="1.5"/>
                  <circle cx="12" cy="19" r="1" fill="#a855f7"/>
                  <rect x="9" y="4" width="6" height="0.5" rx="0.5" fill="#c084fc"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900">Native Mobile Apps</h3>
                <p className="text-xs text-gray-600">iOS & Android with push notifications</p>
              </div>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold flex-shrink-0">
                In Dev
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-pink-100">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-lg flex items-center justify-center text-white text-lg shadow-sm flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-6 h-6 drop-shadow-md">
                  <defs>
                    <linearGradient id="chatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="50%" stopColor="#ffe4e6" />
                      <stop offset="100%" stopColor="#fecdd3" />
                    </linearGradient>
                  </defs>
                  <path d="M20,2 L4,2 C2.9,2 2,2.9 2,4 L2,16 C2,17.1 2.9,18 4,18 L8,18 L12,22 L16,18 L20,18 C21.1,18 22,17.1 22,16 L22,4 C22,2.9 21.1,2 20,2 Z"
                        fill="url(#chatGradient)"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeLinejoin="round"/>
                  <circle cx="8" cy="9" r="1.2" fill="#ec4899"/>
                  <circle cx="12" cy="9" r="1.2" fill="#ec4899"/>
                  <circle cx="16" cy="9" r="1.2" fill="#ec4899"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900">WhatsApp & Facebook</h3>
                <p className="text-xs text-gray-600">Free alerts via messaging apps</p>
              </div>
              <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-semibold flex-shrink-0">
                Q1 2025
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-fuchsia-100">
              <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-400 to-fuchsia-600 rounded-lg flex items-center justify-center text-white text-lg shadow-sm flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-6 h-6 drop-shadow-md animate-pulse-slow">
                  <defs>
                    <linearGradient id="pinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="50%" stopColor="#fae8ff" />
                      <stop offset="100%" stopColor="#f5d0fe" />
                    </linearGradient>
                  </defs>
                  <path d="M12,2 C8.13,2 5,5.13 5,9 C5,14.25 12,22 12,22 C12,22 19,14.25 19,9 C19,5.13 15.87,2 12,2 Z"
                        fill="url(#pinGradient)"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeLinejoin="round"/>
                  <circle cx="12" cy="9" r="2.5" fill="#d946ef"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900">Live Location Sharing</h3>
                <p className="text-xs text-gray-600">Real-time location during check-ins</p>
              </div>
              <span className="text-xs bg-fuchsia-100 text-fuchsia-700 px-2 py-1 rounded-full font-semibold flex-shrink-0">
                Q2 2025
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-rose-100">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-rose-600 rounded-lg flex items-center justify-center text-white text-lg shadow-sm flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-6 h-6 drop-shadow-md">
                  <defs>
                    <linearGradient id="sosGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="50%" stopColor="#ffe4e6" />
                      <stop offset="100%" stopColor="#fecdd3" />
                    </linearGradient>
                  </defs>
                  <circle cx="12" cy="12" r="9" fill="url(#sosGradient)" stroke="#ffffff" strokeWidth="2"/>
                  <path d="M12,7 L12,13" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round"/>
                  <circle cx="12" cy="16.5" r="1.2" fill="#f43f5e"/>
                  <circle cx="12" cy="12" r="9" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900">Quick SOS Button</h3>
                <p className="text-xs text-gray-600">One-tap emergency alerts</p>
              </div>
              <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded-full font-semibold flex-shrink-0">
                Planning
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-pink-100">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg flex items-center justify-center text-white text-lg shadow-sm flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-6 h-6 drop-shadow-md">
                  <defs>
                    <linearGradient id="globeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="50%" stopColor="#fce7f3" />
                      <stop offset="100%" stopColor="#fbcfe8" />
                    </linearGradient>
                  </defs>
                  <circle cx="12" cy="12" r="9" fill="url(#globeGradient)" stroke="#ffffff" strokeWidth="1.5"/>
                  <ellipse cx="12" cy="12" rx="4" ry="9" fill="none" stroke="#ec4899" strokeWidth="1.2"/>
                  <path d="M3,12 L21,12" stroke="#ec4899" strokeWidth="1.2"/>
                  <path d="M12,3 Q16,6 16,12 T12,21" fill="none" stroke="#f472b6" strokeWidth="1" opacity="0.6"/>
                  <path d="M12,3 Q8,6 8,12 T12,21" fill="none" stroke="#f472b6" strokeWidth="1" opacity="0.6"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900">Global Safety Network</h3>
                <p className="text-xs text-gray-600">Verified safety resources</p>
              </div>
              <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-semibold flex-shrink-0">
                2025
              </span>
            </div>
          </div>
        </div>

        {/* The Real Talk Section */}
        <div className="card p-8 mb-6 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-purple-900/20 border-2 border-primary dark:border-purple-600 shadow-lg">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">☕</div>
            <h2 className="text-3xl font-display text-gradient mb-3">
              Let's Be Real For A Sec
            </h2>
          </div>
          <div className="space-y-6 text-text-secondary text-lg leading-relaxed max-w-2xl mx-auto">
            <p>
              Running Besties costs money. Servers, SMS messages, development time - it all adds up. We could have slapped ads everywhere or locked features behind paywalls. But that felt...wrong.
            </p>
            <p className="font-semibold text-gray-800 dark:text-gray-200">
              Your safety shouldn't depend on your wallet.
            </p>
            <p>
              So here's the deal: <span className="text-primary font-semibold">Besties is free</span>. The core features that keep you safe? Free. Always have been, always will be.
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-pink-300 dark:border-pink-600">
              <p className="text-primary dark:text-purple-400 font-display text-xl mb-3 text-center">
                If you can chip in, that's amazing 💕
              </p>
              <p className="text-base text-center">
                Every dollar helps us keep the lights on and build new features faster. It means we can say no to investors who want to monetize your data. It means we stay independent and focused on YOU.
              </p>
            </div>
            <p className="text-2xl font-display text-primary dark:text-purple-400 text-center">
              But if you can't? Use the app anyway.
            </p>
            <p className="text-center italic">
              Seriously. Stay safe. Look out for your friends. That's what matters. We'll figure out the rest because keeping you safe is worth more than any profit margin.
            </p>
          </div>
        </div>

        {/* Support Section */}
        {!userData?.donationStats?.isActive && (
          <div className="card p-8 mb-6 bg-gradient-to-br from-pink-100 via-purple-100 to-pink-100 dark:from-pink-900/30 dark:via-purple-900/30 dark:to-pink-900/30 border-2 border-pink-300 dark:border-pink-600 shadow-xl">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">💜</div>
              <h2 className="text-3xl font-display text-gradient mb-3">
                Wanna Help Keep the Lights On?
              </h2>
              <p className="text-text-secondary text-lg">
                Pick whatever works for you - honestly, every little bit makes a huge difference
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => handleDonation(1)}
                disabled={loading}
                className="btn btn-secondary p-6 flex flex-col items-center gap-2"
              >
                <span className="text-2xl">☕</span>
                <span className="font-display text-xl">$1</span>
                <span className="text-xs text-text-secondary">Coffee</span>
              </button>
              <button
                onClick={() => handleDonation(5)}
                disabled={loading}
                className="btn btn-primary p-6 flex flex-col items-center gap-2 transform scale-105 shadow-lg"
              >
                <span className="text-2xl">🍕</span>
                <span className="font-display text-xl">$5</span>
                <span className="text-xs">Pizza Slice</span>
              </button>
              <button
                onClick={() => handleDonation(10)}
                disabled={loading}
                className="btn btn-secondary p-6 flex flex-col items-center gap-2"
              >
                <span className="text-2xl">🎬</span>
                <span className="font-display text-xl">$10</span>
                <span className="text-xs text-text-secondary">Movie Night</span>
              </button>
            </div>
            <p className="text-xs text-center text-text-secondary italic">
              Monthly contribution - cancel anytime, no questions asked
            </p>
          </div>
        )}

        {/* Other Ways to Help */}
        <div className="card p-8 mb-6">
          <h2 className="text-2xl font-display text-text-primary mb-4">
            Other Ways to Help 🙌
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl">
              <h3 className="font-semibold text-blue-900 mb-2">📣 Spread the Word</h3>
              <p className="text-sm text-blue-800 mb-3">
                Tell your friends! Every person who joins makes our community stronger and safer.
              </p>
              <button
                onClick={() => navigate('/besties')}
                className="text-sm font-semibold text-blue-700 hover:underline"
              >
                Invite Friends →
              </button>
            </div>
            <div className="p-4 bg-green-50 rounded-xl">
              <h3 className="font-semibold text-green-900 mb-2">💡 Share Ideas</h3>
              <p className="text-sm text-green-800 mb-3">
                Got a feature idea? Found a bug? Your feedback makes Besties better for everyone.
              </p>
              <a
                href="mailto:feedback@besties.app"
                className="text-sm font-semibold text-green-700 hover:underline"
              >
                Send Feedback →
              </a>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <h3 className="font-semibold text-purple-900 mb-2">⭐ Leave a Review</h3>
              <p className="text-sm text-purple-800 mb-3">
                Reviews help others discover Besties and know it's legit.
              </p>
              <span className="text-sm font-semibold text-purple-700">
                Coming soon on app stores!
              </span>
            </div>
            <div className="p-4 bg-pink-50 rounded-xl">
              <h3 className="font-semibold text-pink-900 mb-2">🌟 Use the App</h3>
              <p className="text-sm text-pink-800 mb-3">
                Seriously! Check in regularly, add your besties, and stay safe. That's what we're here for.
              </p>
              <button
                onClick={() => navigate('/')}
                className="text-sm font-semibold text-pink-700 hover:underline"
              >
                Create Check-in →
              </button>
            </div>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center py-8">
          <p className="text-2xl text-primary dark:text-purple-400 font-display italic mb-4">
            "Safety shouldn't be a luxury. It should be a given."
          </p>
          <p className="text-lg text-text-secondary mb-2">
            You deserve to feel safe, always.
          </p>
          <p className="text-sm text-text-secondary mb-6">
            That's why we built Besties 💕
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary text-lg px-8 py-3"
          >
            Start Using Besties →
          </button>
        </div>

        {/* CSS for animations */}
        <style>{`
          @keyframes pulse-slow {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
          }
          .animate-pulse-slow {
            animation: pulse-slow 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    </div>
  );
};

export default AboutBestiesPage;
