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
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💜</div>
          <h1 className="text-4xl font-display text-gradient mb-4">
            Welcome to Besties
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Where safety meets friendship, and every check-in keeps someone you love a little bit safer
          </p>
        </div>

        {/* Our Story */}
        <div className="card p-8 mb-6">
          <h2 className="text-2xl font-display text-text-primary mb-4">Our Story 📖</h2>
          <div className="space-y-4 text-text-secondary">
            <p>
              Besties was born from a simple truth: <span className="font-semibold text-primary">everyone deserves to feel safe</span>, especially when they're out there living their life.
            </p>
            <p>
              We've all been there - walking home alone at night, going on a first date, traveling somewhere new, or just wanting someone to know you made it home okay. Those moments when you wish your best friend could be right there with you, even when they can't.
            </p>
            <p className="text-lg font-semibold text-primary">
              That's why we built Besties. 💪
            </p>
          </div>
        </div>

        {/* Our Mission */}
        <div className="card p-8 mb-6 bg-gradient-to-br from-pink-50 to-purple-50">
          <h2 className="text-2xl font-display text-text-primary mb-4">Our Mission 🎯</h2>
          <div className="space-y-3 text-gray-700">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🛡️</span>
              <div>
                <h3 className="font-semibold mb-1">Keep You Safe</h3>
                <p className="text-sm">Make safety simple, automatic, and always there when you need it</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤝</span>
              <div>
                <h3 className="font-semibold mb-1">Build Community</h3>
                <p className="text-sm">Create a network of people who look out for each other</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">💜</span>
              <div>
                <h3 className="font-semibold mb-1">Stay Free</h3>
                <p className="text-sm">Keep Besties accessible to everyone, regardless of their ability to pay</p>
              </div>
            </div>
          </div>
        </div>

        {/* What Makes Us Different */}
        <div className="card p-6 mb-6 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
          <h2 className="text-xl font-display text-text-primary mb-4 text-center">
            What Makes Us Different ✨
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-pink-100 to-purple-100 p-4 rounded-xl border border-pink-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white text-sm shadow-sm">
                  💖
                </div>
                <h3 className="font-semibold text-sm text-pink-900">Good Over Profit</h3>
              </div>
              <p className="text-xs text-gray-700 leading-snug">
                We're here to keep people safe. Every decision puts your safety first, not our profit margins.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-100 to-fuchsia-100 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm shadow-sm">
                  🔐
                </div>
                <h3 className="font-semibold text-sm text-purple-900">Privacy First</h3>
              </div>
              <p className="text-xs text-gray-700 leading-snug">
                Your data is yours. We don't sell it, we don't mine it, and we delete it when you ask.
              </p>
            </div>

            <div className="bg-gradient-to-br from-fuchsia-100 to-pink-100 p-4 rounded-xl border border-fuchsia-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-fuchsia-400 to-fuchsia-600 rounded-full flex items-center justify-center text-white text-sm shadow-sm">
                  ✨
                </div>
                <h3 className="font-semibold text-sm text-fuchsia-900">Transparent Pricing</h3>
              </div>
              <p className="text-xs text-gray-700 leading-snug">
                No hidden fees, no surprises. Most features free forever. Premium costs what it costs to run.
              </p>
            </div>

            <div className="bg-gradient-to-br from-rose-100 to-pink-100 p-4 rounded-xl border border-rose-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center text-white text-sm shadow-sm">
                  👑
                </div>
                <h3 className="font-semibold text-sm text-rose-900">Community Driven</h3>
              </div>
              <p className="text-xs text-gray-700 leading-snug">
                You're part of the Besties family. We listen, adapt, and build features you actually want.
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
                📱
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
                💬
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
                📍
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
                🆘
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
                🌍
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
        <div className="card p-8 mb-6 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200">
          <h2 className="text-2xl font-display text-text-primary mb-4">
            The Real Talk 💬
          </h2>
          <div className="space-y-4 text-gray-700">
            <p className="font-semibold text-lg text-orange-900">
              Here's the honest truth about running Besties:
            </p>
            <p>
              Servers cost money. SMS messages cost money. Development takes time. But we knew that going in, and we still chose to make Besties <span className="font-semibold">free for everyone</span>.
            </p>
            <p>
              <span className="font-semibold text-primary">If you can afford to donate</span>, it helps us keep the lights on and build cool new features faster. Every dollar goes directly into making Besties better.
            </p>
            <p className="text-lg font-semibold text-orange-900">
              But if you can't? That's totally okay. 💜
            </p>
            <p>
              Use the app. Stay safe. Look out for your friends. That's what matters. We'll cover the costs because keeping you safe is more important than making a profit.
            </p>
            <p className="italic text-sm">
              You're not a customer. You're not a product. You're part of our community, and we've got your back.
            </p>
          </div>
        </div>

        {/* Support Section */}
        {!userData?.donationStats?.isActive && (
          <div className="card p-8 mb-6">
            <h2 className="text-2xl font-display text-text-primary mb-4 text-center">
              Want to Help Out? 💜
            </h2>
            <p className="text-text-secondary text-center mb-6">
              Choose an amount that works for you - every bit helps keep Besties free for everyone
            </p>
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
          <p className="text-text-secondary italic mb-4">
            "Safety shouldn't be a luxury. It should be a given."
          </p>
          <p className="text-sm text-text-secondary">
            Built with 💜 by people who care about keeping you safe
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 btn btn-primary"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutBestiesPage;
