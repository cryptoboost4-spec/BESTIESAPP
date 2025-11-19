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

        {/* SVG STYLE TEST GALLERY - Testing different illustration styles */}
        <div className="card p-8 mb-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-4 border-yellow-300">
          <h2 className="text-2xl font-display text-text-primary mb-2 text-center">
            🎨 SVG Style Gallery - Pick Your Vibe! 🎨
          </h2>
          <p className="text-center text-sm text-gray-600 mb-6">
            Each style is bigger, more detailed, and tells a story. Which feels right for Besties?
          </p>

          {/* Style 1: Kawaii Cute Style */}
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-pink-200">
            <h3 className="font-semibold text-lg text-pink-900 mb-3">Style 1: Kawaii Cute 💕</h3>
            <p className="text-xs text-gray-600 mb-4">Big eyes, sparkles, super girly, tells emotional stories</p>
            <div className="flex items-center justify-center gap-8">
              {/* Kawaii Heart with Face */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <linearGradient id="kawaiiHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff6b9d" />
                      <stop offset="50%" stopColor="#ffa6c9" />
                      <stop offset="100%" stopColor="#ffc2e0" />
                    </linearGradient>
                    <filter id="softGlow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Main heart body */}
                  <path d="M60,100 C60,100 25,75 25,50 C25,35 35,25 45,25 C52,25 57,28 60,35 C63,28 68,25 75,25 C85,25 95,35 95,50 C95,75 60,100 60,100 Z"
                        fill="url(#kawaiiHeartGrad)"
                        stroke="#ff1493"
                        strokeWidth="2"
                        filter="url(#softGlow)"
                        className="animate-pulse" />

                  {/* Cheek blushes */}
                  <ellipse cx="40" cy="55" rx="8" ry="6" fill="#ff69b4" opacity="0.4" className="animate-pulse" />
                  <ellipse cx="80" cy="55" rx="8" ry="6" fill="#ff69b4" opacity="0.4" className="animate-pulse" />

                  {/* Eyes */}
                  <g className="animate-bounce" style={{animationDuration: '2s'}}>
                    <ellipse cx="45" cy="48" rx="4" ry="6" fill="#000" />
                    <ellipse cx="75" cy="48" rx="4" ry="6" fill="#000" />
                    <circle cx="46" cy="46" r="1.5" fill="#fff" />
                    <circle cx="76" cy="46" r="1.5" fill="#fff" />
                  </g>

                  {/* Happy mouth */}
                  <path d="M50,62 Q60,70 70,62" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" />

                  {/* Sparkles around it */}
                  <g className="animate-pulse" style={{animationDuration: '1.5s'}}>
                    <path d="M20,30 L22,35 L27,37 L22,39 L20,44 L18,39 L13,37 L18,35 Z" fill="#ffd700" />
                    <path d="M100,35 L102,40 L107,42 L102,44 L100,49 L98,44 L93,42 L98,40 Z" fill="#ffd700" />
                    <path d="M105,70 L107,75 L112,77 L107,79 L105,84 L103,79 L98,77 L103,75 Z" fill="#ff69b4" />
                    <path d="M15,65 L17,70 L22,72 L17,74 L15,79 L13,74 L8,72 L13,70 Z" fill="#ff69b4" />
                  </g>

                  {/* Little hearts floating */}
                  <g className="animate-bounce" style={{animationDuration: '3s'}}>
                    <path d="M30,20 C30,20 22,15 22,10 C22,7 24,5 26,5 C27.5,5 28.5,6 30,8 C31.5,6 32.5,5 34,5 C36,5 38,7 38,10 C38,15 30,20 30,20 Z"
                          fill="#ff69b4" opacity="0.6" />
                    <path d="M90,20 C90,20 82,15 82,10 C82,7 84,5 86,5 C87.5,5 88.5,6 90,8 C91.5,6 92.5,5 94,5 C96,5 98,7 98,10 C98,15 90,20 90,20 Z"
                          fill="#ff69b4" opacity="0.6" />
                  </g>
                </svg>
                <p className="text-xs text-gray-600 mt-2">Happy & Protected</p>
              </div>

              {/* Kawaii Safety Shield Character */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <linearGradient id="kawaiiShieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="50%" stopColor="#c4b5fd" />
                      <stop offset="100%" stopColor="#ddd6fe" />
                    </linearGradient>
                  </defs>

                  {/* Shield body */}
                  <path d="M60,15 L90,25 L90,55 C90,75 75,95 60,105 C45,95 30,75 30,55 L30,25 Z"
                        fill="url(#kawaiiShieldGrad)"
                        stroke="#7c3aed"
                        strokeWidth="3"
                        filter="url(#softGlow)"
                        className="animate-pulse" />

                  {/* Face */}
                  <circle cx="50" cy="50" rx="3" ry="5" fill="#000" />
                  <circle cx="70" cy="50" rx="3" ry="5" fill="#000" />
                  <circle cx="51" cy="48" r="1" fill="#fff" />
                  <circle cx="71" cy="48" r="1" fill="#fff" />

                  {/* Smile */}
                  <path d="M52,62 Q60,68 68,62" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" />

                  {/* Cheeks */}
                  <circle cx="42" cy="58" r="6" fill="#f472b6" opacity="0.3" />
                  <circle cx="78" cy="58" r="6" fill="#f472b6" opacity="0.3" />

                  {/* Arms holding/protecting */}
                  <g className="animate-bounce" style={{animationDuration: '2.5s'}}>
                    <path d="M25,45 Q20,50 25,55" fill="none" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" />
                    <path d="M95,45 Q100,50 95,55" fill="none" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" />
                  </g>

                  {/* Sparkle effects */}
                  <g className="animate-pulse">
                    <circle cx="60" cy="30" r="2" fill="#ffd700" />
                    <circle cx="45" cy="35" r="1.5" fill="#ffd700" />
                    <circle cx="75" cy="35" r="1.5" fill="#ffd700" />
                  </g>
                </svg>
                <p className="text-xs text-gray-600 mt-2">Safety Guardian</p>
              </div>
            </div>
          </div>

          {/* Style 2: Flat Modern Illustration */}
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-purple-200">
            <h3 className="font-semibold text-lg text-purple-900 mb-3">Style 2: Flat Modern 🎨</h3>
            <p className="text-xs text-gray-600 mb-4">Clean geometric shapes, bold colors, professional but friendly</p>
            <div className="flex items-center justify-center gap-8">
              {/* Modern flat phone */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <linearGradient id="flatPhoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>

                  {/* Phone body */}
                  <rect x="35" y="15" width="50" height="90" rx="8" fill="url(#flatPhoneGrad)" />
                  <rect x="40" y="22" width="40" height="70" rx="4" fill="#1e40af" opacity="0.2" />

                  {/* Screen content - check-in interface */}
                  <circle cx="50" cy="40" r="8" fill="#10b981" className="animate-pulse" />
                  <rect x="62" y="35" width="15" height="3" rx="1.5" fill="#e0e7ff" />
                  <rect x="62" y="42" width="10" height="2" rx="1" fill="#e0e7ff" opacity="0.6" />

                  <circle cx="50" cy="60" r="8" fill="#10b981" className="animate-pulse" style={{animationDelay: '0.3s'}} />
                  <rect x="62" y="55" width="15" height="3" rx="1.5" fill="#e0e7ff" />
                  <rect x="62" y="62" width="10" height="2" rx="1" fill="#e0e7ff" opacity="0.6" />

                  {/* Home button */}
                  <circle cx="60" cy="98" r="3" fill="#1e40af" opacity="0.3" />

                  {/* Notification dots */}
                  <g className="animate-bounce" style={{animationDuration: '2s'}}>
                    <circle cx="75" cy="20" r="4" fill="#ef4444" />
                    <text x="75" y="22" fontSize="6" fill="#fff" textAnchor="middle" fontWeight="bold">3</text>
                  </g>
                </svg>
                <p className="text-xs text-gray-600 mt-2">Always Connected</p>
              </div>

              {/* Flat people network */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <linearGradient id="person1" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#f472b6" />
                    </linearGradient>
                    <linearGradient id="person2" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                    <linearGradient id="person3" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>

                  {/* Connection lines */}
                  <line x1="35" y1="60" x2="60" y2="40" stroke="#e0e7ff" strokeWidth="2" className="animate-pulse" />
                  <line x1="85" y1="60" x2="60" y2="40" stroke="#e0e7ff" strokeWidth="2" className="animate-pulse" />
                  <line x1="35" y1="60" x2="60" y2="85" stroke="#e0e7ff" strokeWidth="2" className="animate-pulse" />
                  <line x1="85" y1="60" x2="60" y2="85" stroke="#e0e7ff" strokeWidth="2" className="animate-pulse" />

                  {/* People */}
                  <g className="animate-bounce" style={{animationDuration: '2s'}}>
                    <circle cx="60" cy="35" r="12" fill="url(#person1)" />
                    <path d="M60,47 L60,65 M52,53 L60,53 L68,53 M60,65 L52,80 M60,65 L68,80"
                          stroke="url(#person1)" strokeWidth="4" strokeLinecap="round" />
                  </g>

                  <g className="animate-bounce" style={{animationDuration: '2s', animationDelay: '0.3s'}}>
                    <circle cx="35" cy="55" r="10" fill="url(#person2)" />
                    <path d="M35,65 L35,78 M28,70 L35,70 L42,70 M35,78 L28,88 M35,78 L42,88"
                          stroke="url(#person2)" strokeWidth="3.5" strokeLinecap="round" />
                  </g>

                  <g className="animate-bounce" style={{animationDuration: '2s', animationDelay: '0.6s'}}>
                    <circle cx="85" cy="55" r="10" fill="url(#person3)" />
                    <path d="M85,65 L85,78 M78,70 L85,70 L92,70 M85,78 L78,88 M85,78 L92,88"
                          stroke="url(#person3)" strokeWidth="3.5" strokeLinecap="round" />
                  </g>

                  <g className="animate-bounce" style={{animationDuration: '2s', animationDelay: '0.9s'}}>
                    <circle cx="60" cy="80" r="10" fill="url(#person1)" />
                    <path d="M60,90 L60,103 M53,95 L60,95 L67,95 M60,103 L53,113 M60,103 L67,113"
                          stroke="url(#person1)" strokeWidth="3.5" strokeLinecap="round" />
                  </g>
                </svg>
                <p className="text-xs text-gray-600 mt-2">Circle of Care</p>
              </div>
            </div>
          </div>

          {/* Style 3: Whimsical Playful */}
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-fuchsia-200">
            <h3 className="font-semibold text-lg text-fuchsia-900 mb-3">Style 3: Whimsical Playful ✨</h3>
            <p className="text-xs text-gray-600 mb-4">Bouncy, exaggerated, fun, makes you smile</p>
            <div className="flex items-center justify-center gap-8">
              {/* Bouncy safety umbrella */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <linearGradient id="umbrellaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="33%" stopColor="#ec4899" />
                      <stop offset="66%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>

                  {/* Umbrella top - wavy and fun */}
                  <g className="animate-bounce" style={{animationDuration: '1.5s'}}>
                    <path d="M60,25 Q40,15 25,30 Q30,40 35,35 Q45,25 60,30 Q75,25 85,35 Q90,40 95,30 Q80,15 60,25 Z"
                          fill="url(#umbrellaGrad)"
                          stroke="#dc2626"
                          strokeWidth="2" />

                    {/* Scalloped edge details */}
                    <circle cx="35" cy="32" r="3" fill="#fecdd3" opacity="0.8" />
                    <circle cx="60" cy="28" r="3" fill="#fecdd3" opacity="0.8" />
                    <circle cx="85" cy="32" r="3" fill="#fecdd3" opacity="0.8" />
                  </g>

                  {/* Handle/pole */}
                  <path d="M60,30 L60,85 Q60,95 68,95"
                        fill="none"
                        stroke="#7c3aed"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="animate-pulse" />

                  {/* Person under umbrella */}
                  <g className="animate-bounce" style={{animationDuration: '2s', animationDelay: '0.3s'}}>
                    <circle cx="60" cy="55" r="10" fill="#fde047" />
                    <circle cx="56" cy="52" r="2" fill="#000" />
                    <circle cx="64" cy="52" r="2" fill="#000" />
                    <path d="M56,60 Q60,63 64,60" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />

                    {/* Body */}
                    <ellipse cx="60" cy="75" rx="12" ry="15" fill="#a78bfa" />
                  </g>

                  {/* Rain drops bouncing off */}
                  <g className="animate-pulse">
                    <path d="M20,45 L22,50 L20,55" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                    <path d="M100,45 L98,50 L100,55" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                    <path d="M30,60 L32,65 L30,70" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                    <path d="M90,60 L88,65 L90,70" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                  </g>

                  {/* Stars/sparkles */}
                  <g className="animate-pulse" style={{animationDuration: '1.5s'}}>
                    <path d="M15,25 L17,30 L22,32 L17,34 L15,39 L13,34 L8,32 L13,30 Z" fill="#fbbf24" />
                    <path d="M105,25 L107,30 L112,32 L107,34 L105,39 L103,34 L98,32 L103,30 Z" fill="#fbbf24" />
                  </g>
                </svg>
                <p className="text-xs text-gray-600 mt-2">Protected & Dry</p>
              </div>

              {/* Playful buddy characters holding hands */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <linearGradient id="buddy1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f472b6" />
                      <stop offset="100%" stopColor="#fb923c" />
                    </linearGradient>
                    <linearGradient id="buddy2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>

                  {/* Left buddy */}
                  <g className="animate-bounce" style={{animationDuration: '2s'}}>
                    <ellipse cx="35" cy="65" rx="18" ry="22" fill="url(#buddy1)" />
                    <circle cx="35" cy="45" r="15" fill="url(#buddy1)" />
                    <circle cx="30" cy="42" r="3" fill="#000" />
                    <circle cx="40" cy="42" r="3" fill="#000" />
                    <circle cx="31" cy="41" r="1" fill="#fff" />
                    <circle cx="41" cy="41" r="1" fill="#fff" />
                    <path d="M30,50 Q35,54 40,50" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="25" cy="48" r="5" fill="#f472b6" opacity="0.4" />
                    <circle cx="45" cy="48" r="5" fill="#f472b6" opacity="0.4" />
                  </g>

                  {/* Right buddy */}
                  <g className="animate-bounce" style={{animationDuration: '2s', animationDelay: '0.5s'}}>
                    <ellipse cx="85" cy="65" rx="18" ry="22" fill="url(#buddy2)" />
                    <circle cx="85" cy="45" r="15" fill="url(#buddy2)" />
                    <circle cx="80" cy="42" r="3" fill="#000" />
                    <circle cx="90" cy="42" r="3" fill="#000" />
                    <circle cx="81" cy="41" r="1" fill="#fff" />
                    <circle cx="91" cy="41" r="1" fill="#fff" />
                    <path d="M80,50 Q85,54 90,50" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="75" cy="48" r="5" fill="#a78bfa" opacity="0.4" />
                    <circle cx="95" cy="48" r="5" fill="#a78bfa" opacity="0.4" />
                  </g>

                  {/* Holding hands - curved connection */}
                  <path d="M50,70 Q60,65 70,70"
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className="animate-pulse" />

                  {/* Hearts above them */}
                  <g className="animate-bounce" style={{animationDuration: '3s'}}>
                    <path d="M60,20 C60,20 52,15 52,10 C52,7 54,5 56,5 C57.5,5 58.5,6 60,8 C61.5,6 62.5,5 64,5 C66,5 68,7 68,10 C68,15 60,20 60,20 Z"
                          fill="#f87171" />
                  </g>

                  {/* Sparkles */}
                  <g className="animate-pulse">
                    <circle cx="20" cy="60" r="2" fill="#fbbf24" />
                    <circle cx="100" cy="60" r="2" fill="#fbbf24" />
                    <circle cx="60" cy="90" r="2" fill="#fbbf24" />
                  </g>
                </svg>
                <p className="text-xs text-gray-600 mt-2">Together Forever</p>
              </div>
            </div>
          </div>

          {/* Style 4: Elegant Minimalist */}
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-gray-200">
            <h3 className="font-semibold text-lg text-gray-900 mb-3">Style 4: Elegant Minimalist 🌸</h3>
            <p className="text-xs text-gray-600 mb-4">Delicate, sophisticated, subtle gradients, refined</p>
            <div className="flex items-center justify-center gap-8">
              {/* Minimal lotus/flower */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <linearGradient id="petalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fce7f3" />
                      <stop offset="50%" stopColor="#fbcfe8" />
                      <stop offset="100%" stopColor="#f9a8d4" />
                    </linearGradient>
                    <radialGradient id="centerGrad">
                      <stop offset="0%" stopColor="#fde047" />
                      <stop offset="100%" stopColor="#fbbf24" />
                    </radialGradient>
                  </defs>

                  {/* Petals - elegant curves */}
                  <g className="animate-pulse" style={{animationDuration: '4s'}}>
                    <ellipse cx="60" cy="45" rx="15" ry="25" fill="url(#petalGrad)" opacity="0.9"
                             transform="rotate(-30 60 60)" />
                    <ellipse cx="60" cy="45" rx="15" ry="25" fill="url(#petalGrad)" opacity="0.9"
                             transform="rotate(30 60 60)" />
                    <ellipse cx="60" cy="45" rx="15" ry="25" fill="url(#petalGrad)" opacity="0.9"
                             transform="rotate(90 60 60)" />
                    <ellipse cx="60" cy="45" rx="15" ry="25" fill="url(#petalGrad)" opacity="0.9"
                             transform="rotate(150 60 60)" />
                    <ellipse cx="60" cy="45" rx="15" ry="25" fill="url(#petalGrad)" opacity="0.9"
                             transform="rotate(210 60 60)" />
                    <ellipse cx="60" cy="45" rx="15" ry="25" fill="url(#petalGrad)" opacity="0.9"
                             transform="rotate(270 60 60)" />
                  </g>

                  {/* Center */}
                  <circle cx="60" cy="60" r="12" fill="url(#centerGrad)" opacity="0.8" />

                  {/* Delicate details */}
                  <g opacity="0.3">
                    <circle cx="60" cy="60" r="8" fill="none" stroke="#ec4899" strokeWidth="0.5" />
                    <circle cx="60" cy="60" r="6" fill="none" stroke="#ec4899" strokeWidth="0.5" />
                  </g>

                  {/* Stem */}
                  <path d="M60,75 Q58,90 60,105" fill="none" stroke="#86efac" strokeWidth="2" opacity="0.6" />

                  {/* Subtle leaves */}
                  <path d="M60,85 Q45,88 42,95" fill="#d1fae5" stroke="#86efac" strokeWidth="1" opacity="0.4" />
                  <path d="M60,85 Q75,88 78,95" fill="#d1fae5" stroke="#86efac" strokeWidth="1" opacity="0.4" />
                </svg>
                <p className="text-xs text-gray-600 mt-2">Gentle Bloom</p>
              </div>

              {/* Minimal moon & stars scene */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fef3c7" />
                      <stop offset="100%" stopColor="#fde68a" />
                    </linearGradient>
                  </defs>

                  {/* Crescent moon */}
                  <g className="animate-pulse" style={{animationDuration: '5s'}}>
                    <circle cx="55" cy="55" r="25" fill="url(#moonGrad)" opacity="0.9" />
                    <circle cx="65" cy="50" r="22" fill="#fafafa" />
                  </g>

                  {/* Stars - elegant and simple */}
                  <g className="animate-pulse" style={{animationDuration: '3s'}}>
                    <circle cx="30" cy="30" r="2" fill="#fde047" opacity="0.8" />
                    <circle cx="85" cy="25" r="1.5" fill="#fde047" opacity="0.8" />
                    <circle cx="95" cy="50" r="2" fill="#fde047" opacity="0.8" />
                    <circle cx="25" cy="70" r="1.5" fill="#fde047" opacity="0.8" />
                    <circle cx="90" cy="80" r="2" fill="#fde047" opacity="0.8" />
                  </g>

                  {/* Delicate constellation lines */}
                  <g opacity="0.2" className="animate-pulse" style={{animationDuration: '4s'}}>
                    <line x1="30" y1="30" x2="85" y2="25" stroke="#fde047" strokeWidth="0.5" />
                    <line x1="85" y1="25" x2="95" y2="50" stroke="#fde047" strokeWidth="0.5" />
                  </g>
                </svg>
                <p className="text-xs text-gray-600 mt-2">Night Watch</p>
              </div>
            </div>
          </div>

          {/* Style 5: Line Art Botanical */}
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-green-200">
            <h3 className="font-semibold text-lg text-green-900 mb-3">Style 5: Line Art Botanical 🌿</h3>
            <p className="text-xs text-gray-600 mb-4">Delicate lines, natural, organic, hand-drawn feel</p>
            <div className="flex items-center justify-center gap-8">
              {/* Botanical wreath with heart */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#86efac" />
                      <stop offset="100%" stopColor="#4ade80" />
                    </linearGradient>
                  </defs>

                  {/* Circular wreath base */}
                  <circle cx="60" cy="60" r="40" fill="none" stroke="#d1fae5" strokeWidth="1" opacity="0.3" />

                  {/* Leaves around circle - delicate line art */}
                  <g className="animate-pulse" style={{animationDuration: '4s'}}>
                    {/* Top leaves */}
                    <path d="M60,15 Q50,20 55,25" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M60,15 Q70,20 65,25" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />

                    {/* Right leaves */}
                    <path d="M100,60 Q95,50 90,55" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M100,60 Q95,70 90,65" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />

                    {/* Bottom leaves */}
                    <path d="M60,105 Q50,100 55,95" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M60,105 Q70,100 65,95" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />

                    {/* Left leaves */}
                    <path d="M20,60 Q25,50 30,55" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M20,60 Q25,70 30,65" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />

                    {/* Diagonal leaves */}
                    <path d="M30,30 Q35,32 35,37" fill="none" stroke="#22c55e" strokeWidth="1" strokeLinecap="round" />
                    <path d="M90,30 Q85,32 85,37" fill="none" stroke="#22c55e" strokeWidth="1" strokeLinecap="round" />
                    <path d="M30,90 Q35,88 35,83" fill="none" stroke="#22c55e" strokeWidth="1" strokeLinecap="round" />
                    <path d="M90,90 Q85,88 85,83" fill="none" stroke="#22c55e" strokeWidth="1" strokeLinecap="round" />
                  </g>

                  {/* Small flowers */}
                  <g className="animate-pulse" style={{animationDuration: '3s'}}>
                    <circle cx="60" cy="20" r="3" fill="#fbbf24" opacity="0.8" />
                    <circle cx="95" cy="60" r="3" fill="#fbbf24" opacity="0.8" />
                    <circle cx="60" cy="100" r="3" fill="#fbbf24" opacity="0.8" />
                    <circle cx="25" cy="60" r="3" fill="#fbbf24" opacity="0.8" />
                  </g>

                  {/* Heart in center - line art style */}
                  <path d="M60,75 C60,75 45,65 45,55 C45,50 48,47 51,47 C54,47 56,49 60,53 C64,49 66,47 69,47 C72,47 75,50 75,55 C75,65 60,75 60,75 Z"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="animate-pulse" />
                </svg>
                <p className="text-xs text-gray-600 mt-2">Natural Growth</p>
              </div>

              {/* Line art bird carrying message */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <linearGradient id="birdGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#e9d5ff" />
                    </linearGradient>
                  </defs>

                  {/* Bird body - delicate lines */}
                  <g className="animate-bounce" style={{animationDuration: '2s'}}>
                    <ellipse cx="60" cy="50" rx="15" ry="12" fill="url(#birdGrad)" opacity="0.6" />
                    <circle cx="65" cy="48" r="8" fill="url(#birdGrad)" opacity="0.6" />

                    {/* Eye */}
                    <circle cx="68" cy="47" r="2" fill="#000" />
                    <circle cx="69" cy="46" r="0.5" fill="#fff" />

                    {/* Beak */}
                    <path d="M73,48 L78,48" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />

                    {/* Wings - elegant curved lines */}
                    <path d="M55,45 Q40,35 35,40" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"
                          className="animate-pulse" style={{animationDuration: '1s'}} />
                    <path d="M55,50 Q35,50 30,55" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round"
                          className="animate-pulse" style={{animationDuration: '1s', animationDelay: '0.2s'}} />

                    {/* Tail */}
                    <path d="M48,55 Q40,60 42,65" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" />
                  </g>

                  {/* Message/envelope in beak */}
                  <g className="animate-bounce" style={{animationDuration: '2.5s'}}>
                    <rect x="78" y="44" width="18" height="12" rx="1" fill="#fef3c7" stroke="#fbbf24" strokeWidth="1" />
                    <path d="M78,44 L87,52 L96,44" fill="none" stroke="#fbbf24" strokeWidth="1" />
                    <line x1="80" y1="50" x2="85" y2="50" stroke="#fbbf24" strokeWidth="0.5" />
                    <line x1="80" y1="53" x2="94" y2="53" stroke="#fbbf24" strokeWidth="0.5" />
                  </g>

                  {/* Flight path/motion lines */}
                  <g className="animate-pulse" style={{animationDuration: '3s'}}>
                    <path d="M20,70 Q30,72 40,70" fill="none" stroke="#e9d5ff" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                    <path d="M15,80 Q25,82 35,80" fill="none" stroke="#e9d5ff" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                  </g>
                </svg>
                <p className="text-xs text-gray-600 mt-2">Safe Delivery</p>
              </div>
            </div>
          </div>

          {/* Style 6: 3D Gradient Depth */}
          <div className="p-6 bg-white rounded-xl border-2 border-blue-200">
            <h3 className="font-semibold text-lg text-blue-900 mb-3">Style 6: 3D Gradient Depth 💎</h3>
            <p className="text-xs text-gray-600 mb-4">Layered, shadowed, dimensional, premium feel</p>
            <div className="flex items-center justify-center gap-8">
              {/* 3D Shield with layers */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <linearGradient id="shield3D" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="50%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#1e40af" />
                    </linearGradient>
                    <linearGradient id="shieldHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" opacity="0.8" />
                      <stop offset="100%" stopColor="#ffffff" opacity="0" />
                    </linearGradient>
                    <filter id="shadow3D">
                      <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3"/>
                    </filter>
                  </defs>

                  {/* Shadow layer */}
                  <path d="M60,20 L95,32 L95,62 C95,82 78,100 60,108 C42,100 25,82 25,62 L25,32 Z"
                        fill="#000"
                        opacity="0.1"
                        transform="translate(2, 4)" />

                  {/* Main shield */}
                  <path d="M60,20 L95,32 L95,62 C95,82 78,100 60,108 C42,100 25,82 25,62 L25,32 Z"
                        fill="url(#shield3D)"
                        filter="url(#shadow3D)"
                        className="animate-pulse"
                        style={{animationDuration: '4s'}} />

                  {/* Highlight layer */}
                  <path d="M60,20 L95,32 L95,62 C95,82 78,100 60,108 L60,20 Z"
                        fill="url(#shieldHighlight)"
                        opacity="0.3" />

                  {/* Inner detail layer */}
                  <path d="M60,30 L85,38 L85,60 C85,75 72,88 60,94 C48,88 35,75 35,60 L35,38 Z"
                        fill="none"
                        stroke="#60a5fa"
                        strokeWidth="2"
                        opacity="0.6" />

                  {/* Checkmark with depth */}
                  <g className="animate-bounce" style={{animationDuration: '2s'}}>
                    <path d="M45,58 L54,68 L75,45"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.3"
                          transform="translate(1, 2)" />
                    <path d="M45,58 L54,68 L75,45"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeLinejoin="round" />
                  </g>
                </svg>
                <p className="text-xs text-gray-600 mt-2">Protected</p>
              </div>

              {/* 3D Layered hearts */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <linearGradient id="heart3D1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f87171" />
                      <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                    <linearGradient id="heart3D2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fb923c" />
                      <stop offset="100%" stopColor="#ea580c" />
                    </linearGradient>
                    <linearGradient id="heart3D3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>

                  {/* Back heart - smallest */}
                  <g className="animate-pulse" style={{animationDuration: '3s', animationDelay: '0.6s'}}>
                    <path d="M80,55 C80,55 65,45 65,35 C65,30 68,27 71,27 C73,27 75,28 80,32 C85,28 87,27 89,27 C92,27 95,30 95,35 C95,45 80,55 80,55 Z"
                          fill="url(#heart3D3)"
                          filter="url(#shadow3D)" />
                  </g>

                  {/* Middle heart */}
                  <g className="animate-pulse" style={{animationDuration: '3s', animationDelay: '0.3s'}}>
                    <path d="M60,70 C60,70 40,55 40,40 C40,33 44,29 48,29 C51,29 54,31 60,37 C66,31 69,29 72,29 C76,33 80,33 80,40 C80,55 60,70 60,70 Z"
                          fill="url(#heart3D2)"
                          filter="url(#shadow3D)" />
                  </g>

                  {/* Front heart - largest */}
                  <g className="animate-pulse" style={{animationDuration: '3s'}}>
                    <path d="M45,85 C45,85 20,65 20,45 C20,36 25,31 30,31 C34,31 38,33 45,41 C52,33 56,31 60,31 C65,31 70,36 70,45 C70,65 45,85 45,85 Z"
                          fill="url(#heart3D1)"
                          filter="url(#shadow3D)" />

                    {/* Highlight */}
                    <ellipse cx="35" cy="42" rx="6" ry="4" fill="#fff" opacity="0.4" />
                  </g>
                </svg>
                <p className="text-xs text-gray-600 mt-2">Love Layers</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-6 p-4 bg-yellow-100 rounded-lg">
            <p className="font-semibold text-gray-900 mb-2">Which style speaks to you?</p>
            <p className="text-sm text-gray-700">
              Pick your favorite and I'll redesign all the icons on the site in that style!
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
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg viewBox="0 0 32 32" className="w-8 h-8 drop-shadow-md">
                    <defs>
                      <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="50%" stopColor="#f472b6" />
                        <stop offset="100%" stopColor="#fbcfe8" />
                      </linearGradient>
                    </defs>
                    <path d="M16,28 C16,28 4,20 4,12 C4,8 7,5 10,5 C12,5 14,6 16,8 C18,6 20,5 22,5 C25,5 28,8 28,12 C28,20 16,28 16,28 Z"
                          fill="url(#heartGradient)"
                          stroke="#db2777"
                          strokeWidth="1"
                          className="animate-pulse-slow" />
                  </svg>
                </div>
                <h3 className="font-semibold text-sm text-pink-900">Good Over Profit</h3>
              </div>
              <p className="text-xs text-gray-700 leading-snug">
                We're here to keep people safe. Every decision puts your safety first, not our profit margins.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-100 to-fuchsia-100 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg viewBox="0 0 32 32" className="w-8 h-8 drop-shadow-md">
                    <defs>
                      <linearGradient id="lockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="50%" stopColor="#c084fc" />
                        <stop offset="100%" stopColor="#e9d5ff" />
                      </linearGradient>
                    </defs>
                    <rect x="10" y="14" width="12" height="12" rx="2" fill="url(#lockGradient)" stroke="#9333ea" strokeWidth="1.5"/>
                    <path d="M12,14 L12,10 C12,7.8 13.8,6 16,6 C18.2,6 20,7.8 20,10 L20,14"
                          fill="none"
                          stroke="url(#lockGradient)"
                          strokeWidth="2"
                          strokeLinecap="round"/>
                    <circle cx="16" cy="20" r="1.5" fill="#f3e8ff"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-sm text-purple-900">Privacy First</h3>
              </div>
              <p className="text-xs text-gray-700 leading-snug">
                Your data is yours. We don't sell it, we don't mine it, and we delete it when you ask.
              </p>
            </div>

            <div className="bg-gradient-to-br from-fuchsia-100 to-pink-100 p-4 rounded-xl border border-fuchsia-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg viewBox="0 0 32 32" className="w-8 h-8 drop-shadow-md">
                    <defs>
                      <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#d946ef" />
                        <stop offset="50%" stopColor="#e879f9" />
                        <stop offset="100%" stopColor="#fae8ff" />
                      </linearGradient>
                    </defs>
                    <path d="M16,4 L17,12 L25,13 L17,14 L16,22 L15,14 L7,13 L15,12 Z"
                          fill="url(#sparkleGradient)"
                          stroke="#c026d3"
                          strokeWidth="1"
                          className="animate-pulse-slow" />
                    <path d="M24,6 L25,10 L29,11 L25,12 L24,16 L23,12 L19,11 L23,10 Z"
                          fill="url(#sparkleGradient)"
                          stroke="#c026d3"
                          strokeWidth="0.8"
                          opacity="0.8"/>
                    <path d="M8,22 L9,25 L12,26 L9,27 L8,30 L7,27 L4,26 L7,25 Z"
                          fill="url(#sparkleGradient)"
                          stroke="#c026d3"
                          strokeWidth="0.8"
                          opacity="0.8"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-sm text-fuchsia-900">Transparent Pricing</h3>
              </div>
              <p className="text-xs text-gray-700 leading-snug">
                No hidden fees, no surprises. Most features free forever. Premium costs what it costs to run.
              </p>
            </div>

            <div className="bg-gradient-to-br from-rose-100 to-pink-100 p-4 rounded-xl border border-rose-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg viewBox="0 0 32 32" className="w-8 h-8 drop-shadow-md">
                    <defs>
                      <linearGradient id="crownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="50%" stopColor="#fb7185" />
                        <stop offset="100%" stopColor="#fecdd3" />
                      </linearGradient>
                    </defs>
                    <path d="M6,24 L8,12 L12,18 L16,8 L20,18 L24,12 L26,24 Z"
                          fill="url(#crownGradient)"
                          stroke="#e11d48"
                          strokeWidth="1.5"
                          strokeLinejoin="round"/>
                    <circle cx="8" cy="12" r="2" fill="#fef2f2"/>
                    <circle cx="16" cy="8" r="2" fill="#fef2f2"/>
                    <circle cx="24" cy="12" r="2" fill="#fef2f2"/>
                    <path d="M6,24 L26,24" stroke="#e11d48" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
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
