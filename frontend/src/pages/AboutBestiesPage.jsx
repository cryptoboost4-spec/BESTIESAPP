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
  const [showShareMenu, setShowShareMenu] = useState(false);

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

  const handleShare = (platform) => {
    const shareUrl = 'https://besties.app';
    const shareText = 'Join the safety movement! Besties helps you and your friends stay safe together. 💜';

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      copy: shareUrl
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } else {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
    setShowShareMenu(false);
  };

  return (
    <div className="min-h-screen bg-pattern">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
        {/* Hero Section - Powerful Movement Message */}
        <div className="text-center mb-10 animate-fade-in">
          {/* Connected circles - representing community */}
          <div className="flex justify-center mb-6">
            <svg viewBox="0 0 140 100" className="w-40 h-28 md:w-48 md:h-32">
              <defs>
                <filter id="softGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <linearGradient id="connection1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f9a8d4" />
                  <stop offset="100%" stopColor="#c4b5fd" />
                </linearGradient>
              </defs>

              {/* Connecting lines */}
              <line x1="35" y1="50" x2="70" y2="50" stroke="url(#connection1)" strokeWidth="3" opacity="0.6" className="animate-pulse" style={{animationDuration: '2s'}} />
              <line x1="70" y1="50" x2="105" y2="50" stroke="url(#connection1)" strokeWidth="3" opacity="0.6" className="animate-pulse" style={{animationDuration: '2s'}} />

              {/* Three connected people - representing the movement */}
              <g className="animate-pulse" style={{animationDuration: '3s'}}>
                <circle cx="35" cy="50" r="16" fill="#f9a8d4" opacity="0.9" filter="url(#softGlow)" />
                <circle cx="35" cy="45" r="6" fill="#fff" opacity="0.6" />
                <ellipse cx="35" cy="56" rx="8" ry="10" fill="#fff" opacity="0.5" />
              </g>

              <g className="animate-pulse" style={{animationDuration: '3s', animationDelay: '0.3s'}}>
                <circle cx="70" cy="50" r="18" fill="#c4b5fd" opacity="0.9" filter="url(#softGlow)" />
                <circle cx="70" cy="44" r="7" fill="#fff" opacity="0.6" />
                <ellipse cx="70" cy="57" rx="9" ry="11" fill="#fff" opacity="0.5" />
                <path d="M70,80 C70,80 62,75 62,70 C62,67 64,65 66,65 C67,65 68,66 70,68 C72,66 73,65 74,65 C76,65 78,67 78,70 C78,75 70,80 70,80 Z" fill="#ec4899" opacity="0.7" />
              </g>

              <g className="animate-pulse" style={{animationDuration: '3s', animationDelay: '0.6s'}}>
                <circle cx="105" cy="50" r="16" fill="#fda4af" opacity="0.9" filter="url(#softGlow)" />
                <circle cx="105" cy="45" r="6" fill="#fff" opacity="0.6" />
                <ellipse cx="105" cy="56" rx="8" ry="10" fill="#fff" opacity="0.5" />
              </g>

              {/* Sparkles */}
              <circle cx="52" cy="30" r="2" fill="#fbbf24" opacity="0.8" className="animate-pulse" />
              <circle cx="88" cy="28" r="2.5" fill="#fbbf24" opacity="0.8" className="animate-pulse" style={{animationDelay: '0.5s'}} />
              <circle cx="70" cy="20" r="2" fill="#ec4899" opacity="0.7" className="animate-pulse" style={{animationDelay: '0.8s'}} />
            </svg>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display bg-gradient-to-r from-pink-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-4 px-2 leading-tight">
            Join the Safety Movement
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed px-4">
            Where women refuse to accept anything less than <span className="font-bold text-primary">absolute safety</span> for themselves and their friends.
          </p>
        </div>

        {/* This Is Bigger Than You - The Movement */}
        <div className="mb-8">
          <div className="card p-6 md:p-8 bg-gradient-to-br from-pink-50 via-purple-50 to-fuchsia-50 border-2 border-pink-200">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 mb-4 shadow-lg">
                <svg viewBox="0 0 48 48" className="w-8 h-8 md:w-10 md:h-10">
                  <path d="M24,8 L36,12 L36,24 C36,32 30,38 24,42 C18,38 12,32 12,24 L12,12 Z"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round" />
                  <path d="M20,23 L22,26 L28,19"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-display bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
                This Is Bigger Than You
              </h2>
            </div>

            <div className="space-y-4 text-base md:text-lg text-gray-700 max-w-3xl mx-auto">
              <p className="leading-relaxed">
                Every woman has that story. Walking home with keys between your fingers. Sharing your location before a first date. Checking in so someone knows you made it safely.
              </p>
              <p className="leading-relaxed font-semibold text-pink-700">
                What if we stopped accepting that as normal? What if we built something better?
              </p>
              <p className="leading-relaxed">
                Besties isn't just an app — it's a <span className="font-bold text-purple-700">movement of women who refuse to compromise on safety</span>. Women who hold their friends accountable. Women who say "I won't let you walk alone" and actually mean it.
              </p>
              <div className="bg-white rounded-2xl p-5 md:p-6 shadow-md border-2 border-purple-200 mt-6">
                <p className="text-lg md:text-xl font-bold text-center text-transparent bg-gradient-to-r from-pink-600 via-purple-600 to-fuchsia-600 bg-clip-text">
                  You're not just protecting yourself. You're changing the culture.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* The Accountability Pledge */}
        <div className="mb-8">
          <div className="card p-6 md:p-8 bg-gradient-to-br from-purple-50 to-pink-50">
            <h2 className="text-2xl md:text-3xl font-display text-text-primary mb-6 text-center">
              The Safety Pledge
            </h2>

            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="flex items-start gap-3 md:gap-4 p-4 bg-white rounded-xl shadow-sm border-l-4 border-pink-400">
                <div className="flex-shrink-0 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">I check in when it matters</p>
                  <p className="text-sm text-gray-600">Walking alone, first dates, late nights — I let my people know I'm okay.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 md:gap-4 p-4 bg-white rounded-xl shadow-sm border-l-4 border-purple-400">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">I hold my friends accountable</p>
                  <p className="text-sm text-gray-600">If you're not checking in, I'm calling. Because your safety isn't optional.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 md:gap-4 p-4 bg-white rounded-xl shadow-sm border-l-4 border-fuchsia-400">
                <div className="flex-shrink-0 w-8 h-8 bg-fuchsia-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">I refuse to accept anything less</p>
                  <p className="text-sm text-gray-600">We deserve to feel safe, every single time. No compromises. No exceptions.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 italic">
                By using Besties, you're joining thousands of women who've taken the pledge.
              </p>
            </div>
          </div>
        </div>

        {/* When You Need Besties - Real Scenarios */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-display text-text-primary mb-6 text-center px-4">
            We've Got You In Every Moment
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-5 bg-gradient-to-br from-indigo-50 to-purple-50 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-2xl">
                  🌙
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Walking Home</h3>
              </div>
              <p className="text-sm text-gray-700">
                Late night. Quiet streets. Someone's watching your route and ready to call if you don't make it.
              </p>
            </div>

            <div className="card p-5 bg-gradient-to-br from-pink-50 to-rose-50 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center text-2xl">
                  💝
                </div>
                <h3 className="font-bold text-gray-900 text-lg">First Dates</h3>
              </div>
              <p className="text-sm text-gray-700">
                Meeting someone new? Your bestie knows where, when, and who. One tap if things go wrong.
              </p>
            </div>

            <div className="card p-5 bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-2xl">
                  ✈️
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Solo Travel</h3>
              </div>
              <p className="text-sm text-gray-700">
                Exploring the world alone? Check in from anywhere. Someone back home is watching out.
              </p>
            </div>

            <div className="card p-5 bg-gradient-to-br from-emerald-50 to-green-50 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-2xl">
                  🏃
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Running Alone</h3>
              </div>
              <p className="text-sm text-gray-700">
                Morning run. New trail. Your people know your route and when you should be back.
              </p>
            </div>

            <div className="card p-5 bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-2xl">
                  🚗
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Late Night Uber</h3>
              </div>
              <p className="text-sm text-gray-700">
                Getting in a stranger's car? Share your ride details. Your friends are tracking you home.
              </p>
            </div>

            <div className="card p-5 bg-gradient-to-br from-violet-50 to-purple-50 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center text-2xl">
                  🌃
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Girls Night Out</h3>
              </div>
              <p className="text-sm text-gray-700">
                Leaving the club? Your whole crew checks in. Nobody gets left behind.
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-base md:text-lg text-gray-700 font-semibold px-4">
              Every moment you deserve protection. Every moment, Besties is there.
            </p>
          </div>
        </div>

        {/* How It Works - Simple Steps */}
        <div className="mb-8">
          <div className="card p-6 md:p-8 bg-white">
            <h2 className="text-2xl md:text-3xl font-display text-text-primary mb-6 text-center">
              So Simple, You'll Actually Use It
            </h2>

            <div className="max-w-2xl mx-auto space-y-5">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1 text-base md:text-lg">Create a Check-In</h3>
                  <p className="text-sm md:text-base text-gray-700">
                    Tap once. Say where you're going and when you'll be back. Pick your besties. Done in 10 seconds.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1 text-base md:text-lg">Your Friends Get Notified</h3>
                  <p className="text-sm md:text-base text-gray-700">
                    They know you're out. They know where. They know when to expect you back. They're ready.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1 text-base md:text-lg">Mark Safe or Get Help</h3>
                  <p className="text-sm md:text-base text-gray-700">
                    Made it home? One tap. Didn't check in? Your friends get alerted automatically. No one slips through.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-5 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl text-center">
              <p className="text-base md:text-lg font-semibold text-gray-900">
                That's it. Three steps. Complete protection. Always free.
              </p>
            </div>
          </div>
        </div>

        {/* The Reality - Keeping It Free */}
        {!userData?.donationStats?.isActive && (
          <div className="mb-8">
            <div className="card p-6 md:p-8 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 border-2 border-pink-300">
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-display bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
                  Here's the Hard Truth
                </h2>
              </div>

              <div className="max-w-2xl mx-auto space-y-4 text-base md:text-lg text-gray-700">
                <p className="leading-relaxed">
                  Safety shouldn't cost money. <span className="font-bold text-pink-700">Period.</span>
                </p>
                <p className="leading-relaxed">
                  The woman walking home alone at 2am shouldn't have to pay for protection. The college student on a tight budget shouldn't have to choose between safety and groceries. The single mom checking in from work shouldn't face a paywall.
                </p>
                <p className="leading-relaxed font-semibold text-purple-700">
                  That's why Besties is free. For everyone. Forever.
                </p>
                <p className="leading-relaxed">
                  But... servers cost money. SMS notifications cost money. Development time costs money. <span className="font-bold text-gray-900">We're running this movement on fumes and credit cards.</span>
                </p>

                <div className="bg-white rounded-2xl p-5 md:p-6 shadow-md border-2 border-purple-200 my-6">
                  <p className="text-lg md:text-xl font-bold text-center bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
                    If you can afford to contribute, you'll be keeping it free for everyone who can't.
                  </p>
                  <p className="text-sm md:text-base text-gray-600 text-center">
                    That's the movement. Those who have, protect those who don't.
                  </p>
                </div>
              </div>

              {/* Donation Options */}
              <div className="max-w-3xl mx-auto mt-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <button
                    onClick={() => handleDonation(5)}
                    disabled={loading}
                    className="card p-5 text-center hover:shadow-xl transition-all hover:scale-105 border-2 border-pink-200 hover:border-pink-400 active:scale-95"
                  >
                    <div className="text-3xl mb-2">☕</div>
                    <div className="text-2xl font-bold text-pink-600 mb-1">$5</div>
                    <div className="text-xs text-gray-600">Covers 50 check-ins</div>
                  </button>

                  <button
                    onClick={() => handleDonation(10)}
                    disabled={loading}
                    className="card p-5 text-center hover:shadow-xl transition-all hover:scale-105 border-2 border-purple-400 hover:border-purple-600 bg-gradient-to-br from-pink-50 to-purple-50 active:scale-95 relative"
                  >
                    <div className="absolute -top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                      Popular
                    </div>
                    <div className="text-3xl mb-2">💜</div>
                    <div className="text-2xl font-bold text-purple-600 mb-1">$10</div>
                    <div className="text-xs text-gray-600">A week of safety for everyone</div>
                  </button>

                  <button
                    onClick={() => handleDonation(25)}
                    disabled={loading}
                    className="card p-5 text-center hover:shadow-xl transition-all hover:scale-105 border-2 border-yellow-300 hover:border-yellow-500 active:scale-95"
                  >
                    <div className="text-3xl mb-2">⭐</div>
                    <div className="text-2xl font-bold text-yellow-600 mb-1">$25</div>
                    <div className="text-xs text-gray-600">Powers the movement</div>
                  </button>
                </div>

                <p className="text-center text-sm text-gray-600 mb-6">
                  One-time donation. No subscription. Cancel never, because there's nothing to cancel.
                </p>
              </div>

              {/* Can't Donate Section */}
              <div className="bg-white rounded-2xl p-5 md:p-6 border-2 border-purple-200 max-w-3xl mx-auto">
                <h3 className="text-lg md:text-xl font-display text-gray-900 mb-3 text-center">
                  Can't Donate? You're Still Part of This.
                </h3>
                <p className="text-sm md:text-base text-gray-700 mb-4 text-center">
                  Seriously. Your safety matters whether you can pay or not. But here's how else you can help:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowShareMenu(true)}
                    className="btn btn-secondary text-sm py-3"
                  >
                    📱 Share with Friends
                  </button>

                  <button
                    onClick={() => navigate('/feedback')}
                    className="btn btn-secondary text-sm py-3"
                  >
                    💬 Give Feedback
                  </button>

                  <button
                    onClick={() => window.open('https://instagram.com/bestiesapp', '_blank')}
                    className="btn btn-secondary text-sm py-3"
                  >
                    📸 Follow on Instagram
                  </button>

                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'Join the Safety Movement',
                          text: 'Besties is keeping women safe, for free. Join us. 💜',
                          url: 'https://besties.app'
                        });
                      } else {
                        handleShare('copy');
                      }
                    }}
                    className="btn btn-secondary text-sm py-3"
                  >
                    💜 Spread the Word
                  </button>
                </div>

                <p className="text-xs text-gray-600 mt-5 text-center italic">
                  Every person who joins makes the movement stronger. That's contribution enough.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Thank You Donors */}
        {userData?.donationStats?.isActive && (
          <div className="mb-8">
            <div className="card p-6 md:p-8 bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 border-2 border-yellow-400 shadow-lg">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4 shadow-lg">
                  <svg viewBox="0 0 48 48" className="w-10 h-10">
                    <path d="M24,10 L27,20 L37,21 L29,28 L32,38 L24,33 L16,38 L19,28 L11,21 L21,20 Z" fill="#fff" />
                  </svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-display bg-gradient-to-r from-yellow-600 to-pink-600 bg-clip-text text-transparent mb-4">
                  You're Keeping Everyone Safe
                </h2>
                <p className="text-base md:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
                  Because of you, someone who can't afford to donate is still getting protected. You're not just supporting an app — you're <span className="font-bold text-pink-700">funding a movement</span>. Thank you for being part of something bigger.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Final CTA - Join the Movement */}
        <div className="mb-4">
          <div className="card p-6 md:p-8 bg-gradient-to-br from-pink-100 via-purple-100 to-fuchsia-100 border-2 border-pink-300 text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display bg-gradient-to-r from-pink-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-4">
              Ready to Join the Movement?
            </h2>
            <p className="text-base md:text-lg text-gray-700 mb-6 max-w-2xl mx-auto leading-relaxed">
              Thousands of women are already holding each other accountable, refusing to accept anything less than complete safety. <span className="font-bold">Be one of them.</span>
            </p>

            <button
              onClick={() => navigate('/')}
              className="btn btn-primary text-base md:text-lg px-6 md:px-10 py-3 md:py-4 shadow-lg hover:shadow-xl transition-all"
            >
              Start Checking In Now
            </button>

            <p className="text-xs md:text-sm text-gray-600 mt-4">
              Free forever. No credit card. No catch.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-gray-600">
              <span className="px-3 py-1 bg-white rounded-full">✓ Always Free</span>
              <span className="px-3 py-1 bg-white rounded-full">✓ Real SMS Alerts</span>
              <span className="px-3 py-1 bg-white rounded-full">✓ Unlimited Check-Ins</span>
              <span className="px-3 py-1 bg-white rounded-full">✓ Safety First</span>
            </div>
          </div>
        </div>
      </div>

      {/* Share Menu Modal */}
      {showShareMenu && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowShareMenu(false)}>
          <div className="card p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-display text-text-primary mb-4">Share Besties 💜</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleShare('twitter')}
                className="w-full btn btn-secondary"
              >
                🐦 Share on Twitter
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="w-full btn btn-secondary"
              >
                📘 Share on Facebook
              </button>
              <button
                onClick={() => handleShare('whatsapp')}
                className="w-full btn btn-secondary"
              >
                💚 Share on WhatsApp
              </button>
              <button
                onClick={() => handleShare('copy')}
                className="w-full btn btn-secondary"
              >
                🔗 Copy Link
              </button>
            </div>
            <button
              onClick={() => setShowShareMenu(false)}
              className="w-full btn btn-primary mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AboutBestiesPage;
