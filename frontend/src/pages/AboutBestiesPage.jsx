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
        <div className="card p-8 mb-6">
          <h2 className="text-2xl font-display text-text-primary mb-4">
            What Makes Us Different ✨
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl">
              <h3 className="font-semibold text-blue-900 mb-2">🌟 Good Over Profit</h3>
              <p className="text-sm text-blue-800">
                We're not here to make millions. We're here to keep people safe. Every decision we make puts your safety and privacy first, not our profit margins.
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl">
              <h3 className="font-semibold text-green-900 mb-2">🔒 Privacy First</h3>
              <p className="text-sm text-green-800">
                Your data is yours. We don't sell it, we don't mine it, and we delete it when you ask us to. Simple as that.
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl">
              <h3 className="font-semibold text-purple-900 mb-2">💸 Transparent Pricing</h3>
              <p className="text-sm text-purple-800">
                No hidden fees, no surprise charges. Most features are free forever. Premium features cost what they cost to run - nothing more.
              </p>
            </div>
            <div className="bg-pink-50 p-4 rounded-xl">
              <h3 className="font-semibold text-pink-900 mb-2">🚀 Community Driven</h3>
              <p className="text-sm text-pink-800">
                You're not just a user - you're part of the Besties family. We listen, we adapt, and we build features you actually want.
              </p>
            </div>
          </div>
        </div>

        {/* Future Plans */}
        <div className="card p-8 mb-6">
          <h2 className="text-2xl font-display text-text-primary mb-4">
            What's Coming Next 🚀
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl">📱</span>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary">Native Mobile Apps</h3>
                <p className="text-sm text-text-secondary">iOS and Android apps with reliable push notifications</p>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">In Development</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl">💬</span>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary">WhatsApp & Facebook Integration</h3>
                <p className="text-sm text-text-secondary">Free unlimited alerts through your favorite messaging apps</p>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">Q1 2025</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl">📍</span>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary">Live Location Sharing</h3>
                <p className="text-sm text-text-secondary">Share your real-time location with besties during check-ins</p>
              </div>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">Q2 2025</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl">🆘</span>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary">Quick SOS Button</h3>
                <p className="text-sm text-text-secondary">Instantly alert all besties with one tap in emergencies</p>
              </div>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">Planning</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl">🌍</span>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary">Global Safety Network</h3>
                <p className="text-sm text-text-secondary">Connect with verified safety resources in your area</p>
              </div>
              <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-semibold">2025</span>
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
              <span className="font-semibold text-primary">If you can afford to donate</span>, it helps us keep the lights on and build cool new features faster. Every dollar goes directly into making Besties better and keeping it running.
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
                onClick={() => navigate('/invite')}
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
