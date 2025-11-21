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
    const shareText = 'Check out Besties - the safety app that helps you stay safe with your friends! 💜';

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

      <div className="max-w-4xl mx-auto p-4 pb-24 md:pb-6">
        {/* Hero Section - The Welcome */}
        <div className="text-center mb-12 animate-fade-in">
          {/* Soft heart illustration */}
          <div className="flex justify-center mb-6">
            <svg viewBox="0 0 120 120" className="w-32 h-32">
              <defs>
                <linearGradient id="heroHeart" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fce7f3" />
                  <stop offset="50%" stopColor="#fbcfe8" />
                  <stop offset="100%" stopColor="#f9a8d4" />
                </linearGradient>
                <filter id="softGlow">
                  <feGaussianBlur stdDeviation="0.5" />
                </filter>
              </defs>
              <path d="M60,85 C60,85 35,70 35,50 C35,40 42,33 50,33 C55,33 58,36 60,42 C62,36 65,33 70,33 C78,33 85,40 85,50 C85,70 60,85 60,85 Z"
                    fill="url(#heroHeart)"
                    filter="url(#softGlow)"
                    opacity="0.9"
                    className="animate-pulse"
                    style={{animationDuration: '3s'}} />
              <path d="M60,78 C60,78 42,66 42,52 C42,44 47,39 53,39 C56,39 58,41 60,45 C62,41 64,39 67,39 C73,39 78,44 78,52 C78,66 60,78 60,78 Z"
                    fill="#fff"
                    opacity="0.4" />
            </svg>
          </div>

          <h1 className="text-5xl font-display bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
            You Deserve to Feel Safe
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Every single time you step out your door, meet someone new, or head home after dark — <span className="font-semibold text-primary">you deserve to feel protected</span>.
          </p>
        </div>

        {/* Our Story - The Connection */}
        <div className="card p-8 mb-8 animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            {/* Soft illustration */}
            <svg viewBox="0 0 60 60" className="w-16 h-16">
              <defs>
                <radialGradient id="storyGlow">
                  <stop offset="0%" stopColor="#ddd6fe" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </radialGradient>
              </defs>
              <circle cx="30" cy="30" r="20" fill="url(#storyGlow)" opacity="0.3" className="animate-pulse" style={{animationDuration: '4s'}} />
              <g opacity="0.8">
                <circle cx="30" cy="27" r="6" fill="#f9a8d4" />
                <ellipse cx="30" cy="38" rx="7" ry="9" fill="#f9a8d4" />
              </g>
            </svg>
            <h2 className="text-3xl font-display text-text-primary">Why Besties Exists</h2>
          </div>

          <div className="space-y-4 text-lg text-text-secondary">
            <p>
              We've all been there. That moment when you're walking home alone and you text your friend, "Text me when I get home." That first date where you share your location with your bestie, just in case. That trip where you check in every night so someone knows you're okay.
            </p>
            <p>
              These moments aren't just about safety — they're about <span className="font-semibold text-primary">having someone who cares</span>. Someone who's got your back. Someone who'll notice if you don't make it home.
            </p>
            <p className="text-xl font-semibold text-primary">
              That's the heart of Besties. 💜
            </p>
            <p>
              We built this app because everyone deserves that feeling of being looked after. Whether you're walking alone, going on a date, meeting someone from the internet, traveling, or just want someone to know you're safe — Besties is here for you.
            </p>
          </div>
        </div>

        {/* How It Works - The Journey */}
        <div className="mb-8">
          <h2 className="text-3xl font-display text-text-primary mb-6 text-center">How Besties Has Your Back</h2>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="card p-6 bg-gradient-to-br from-pink-50 to-purple-50">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-display text-text-primary mb-2">Create a Check-In</h3>
                  <p className="text-text-secondary">
                    Going somewhere? Set up a quick check-in. Tell Besties where you're going, who you want to notify, and when you'll be done.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="card p-6 bg-gradient-to-br from-purple-50 to-blue-50">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-display text-text-primary mb-2">Your Besties Get Notified</h3>
                  <p className="text-text-secondary">
                    Your chosen besties receive a notification letting them know you're checking in. They know where you are, what you're doing, and when to expect you back.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="card p-6 bg-gradient-to-br from-blue-50 to-green-50">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-display text-text-primary mb-2">Mark Yourself Safe (or Don't)</h3>
                  <p className="text-text-secondary">
                    When you're done, mark yourself safe with one tap. If you forget or can't check in, your besties get an alert automatically — they'll know to reach out.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="card p-6 bg-gradient-to-br from-green-50 to-pink-50">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-display text-text-primary mb-2">Feel Protected, Feel Loved</h3>
                  <p className="text-text-secondary">
                    That's it. Simple, easy, and it works. You get to live your life knowing someone's watching out for you. Because you matter.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why It Matters - The Truth */}
        <div className="card p-8 mb-8 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
          <h2 className="text-3xl font-display text-text-primary mb-6 text-center">This Isn't Just About Safety</h2>

          <div className="space-y-6 text-lg text-text-secondary">
            <p>
              Besties is about <span className="font-semibold text-primary">feeling seen</span>. It's about knowing that someone cares enough to check on you. It's about not having to be brave all the time because you have people who've got your back.
            </p>

            <div className="grid md:grid-cols-2 gap-6 my-6">
              <div className="bg-white rounded-xl p-6 border-2 border-pink-200">
                <div className="text-3xl mb-3">🌙</div>
                <h3 className="font-semibold text-text-primary mb-2">Walking Home Late</h3>
                <p className="text-sm">Your bestie knows your route and when you should be home. You're not alone.</p>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-purple-200">
                <div className="text-3xl mb-3">💝</div>
                <h3 className="font-semibold text-text-primary mb-2">First Dates</h3>
                <p className="text-sm">Someone knows where you are and who you're with. You can relax and enjoy yourself.</p>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-blue-200">
                <div className="text-3xl mb-3">✈️</div>
                <h3 className="font-semibold text-text-primary mb-2">Solo Travel</h3>
                <p className="text-sm">Check in from anywhere in the world. Your people know you're safe.</p>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-green-200">
                <div className="text-3xl mb-3">🏃</div>
                <h3 className="font-semibold text-text-primary mb-2">Running Alone</h3>
                <p className="text-sm">Share your route and duration. If you don't return, someone will notice.</p>
              </div>
            </div>

            <p className="text-center text-xl font-semibold text-primary">
              You deserve to feel safe. You deserve to be protected. You deserve Besties.
            </p>
          </div>
        </div>

        {/* Support Section - The Ask (But Not Really) */}
        {!userData?.donationStats?.isActive && (
          <div className="card p-8 mb-8">
            <h2 className="text-3xl font-display text-text-primary mb-4 text-center">Help Us Keep Besties Free 💜</h2>

            <div className="space-y-4 text-lg text-text-secondary mb-6">
              <p>
                Right now, Besties is completely free. We built it because we believe safety shouldn't cost money — everyone deserves to feel protected, regardless of their financial situation.
              </p>
              <p>
                But keeping Besties running costs money. Servers, SMS notifications, development time — it all adds up. Here's the truth: <span className="font-semibold text-primary">we need your help to keep this going</span>.
              </p>
            </div>

            {/* Donation Options */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <button
                onClick={() => handleDonation(5)}
                disabled={loading}
                className="card p-6 text-center hover:shadow-xl transition-all hover:scale-105 border-2 border-pink-200 hover:border-pink-400"
              >
                <div className="text-4xl mb-2">☕</div>
                <div className="text-2xl font-bold text-primary mb-1">$5</div>
                <div className="text-sm text-text-secondary">Buy us a coffee</div>
              </button>

              <button
                onClick={() => handleDonation(10)}
                disabled={loading}
                className="card p-6 text-center hover:shadow-xl transition-all hover:scale-105 border-2 border-purple-300 hover:border-purple-500 bg-gradient-to-br from-pink-50 to-purple-50"
              >
                <div className="text-4xl mb-2">💜</div>
                <div className="text-2xl font-bold text-primary mb-1">$10</div>
                <div className="text-sm text-text-secondary">Support a month</div>
                <div className="text-xs text-primary font-semibold mt-1">Most Popular!</div>
              </button>

              <button
                onClick={() => handleDonation(25)}
                disabled={loading}
                className="card p-6 text-center hover:shadow-xl transition-all hover:scale-105 border-2 border-yellow-200 hover:border-yellow-400"
              >
                <div className="text-4xl mb-2">⭐</div>
                <div className="text-2xl font-bold text-primary mb-1">$25</div>
                <div className="text-sm text-text-secondary">Keep us going strong</div>
              </button>
            </div>

            {/* Can't Donate? That's Okay! */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
              <h3 className="text-xl font-display text-text-primary mb-4 text-center">Can't Donate? That's Totally Okay! 💕</h3>
              <p className="text-text-secondary mb-4 text-center">
                We get it — money's tight. Here are other ways you can help us grow:
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => setShowShareMenu(true)}
                  className="w-full btn btn-secondary"
                >
                  📱 Share Besties with Friends
                </button>

                <button
                  onClick={() => navigate('/feedback')}
                  className="w-full btn btn-secondary"
                >
                  💬 Leave Us Feedback
                </button>

                <button
                  onClick={() => window.open('https://instagram.com/bestiesapp', '_blank')}
                  className="w-full btn btn-secondary"
                >
                  📸 Follow Us on Instagram
                </button>

                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'Besties - Stay Safe Together',
                        text: 'Check out Besties - the safety app that helps you stay safe with your friends! 💜',
                        url: 'https://besties.app'
                      });
                    } else {
                      handleShare('copy');
                    }
                  }}
                  className="w-full btn btn-secondary"
                >
                  💜 Tell Others About Us
                </button>
              </div>

              <p className="text-sm text-text-secondary mt-6 text-center italic">
                Every share, every follow, every kind word helps us reach more people who need safety in their lives. Thank you for being part of our community. 💜
              </p>
            </div>
          </div>
        )}

        {/* Thank You Donors */}
        {userData?.donationStats?.isActive && (
          <div className="card p-8 mb-8 bg-gradient-to-br from-yellow-50 to-pink-50 border-2 border-yellow-300">
            <div className="text-center">
              <div className="text-6xl mb-4">🌟</div>
              <h2 className="text-3xl font-display text-text-primary mb-3">You're Amazing!</h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                Thank you for supporting Besties. Because of you, we can keep this app free for everyone who needs it. You're literally helping keep people safe. That's incredible. 💜
              </p>
            </div>
          </div>
        )}

        {/* Final CTA - The Beginning */}
        <div className="text-center card p-8 bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
          <h2 className="text-3xl font-display text-text-primary mb-4">Ready to Feel Safe?</h2>
          <p className="text-lg text-text-secondary mb-6 max-w-2xl mx-auto">
            Join thousands of people who use Besties to stay safe. Download the app, add your besties, and start checking in. It's free, it's easy, and it works.
          </p>

          <button
            onClick={() => navigate('/')}
            className="btn btn-primary text-lg px-8 py-3"
          >
            Get Started Now 💜
          </button>

          <p className="text-sm text-text-secondary mt-4">
            No credit card required. Always free.
          </p>
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
