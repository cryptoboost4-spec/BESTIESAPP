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
        <div className="card p-8 mb-6 bg-gradient-to-br from-pink-50 to-purple-50 border-4 border-pink-300">
          <h2 className="text-2xl font-display text-text-primary mb-2 text-center">
            ✨ SVG Style Gallery - Pick Your Perfect Vibe! ✨
          </h2>
          <p className="text-center text-sm text-gray-600 mb-6">
            10 girly styles that match Besties' vibe. Which one captures the feeling you want?
          </p>

          {/* Style 1: Soft Pastel Clouds */}
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-pink-200">
            <h3 className="font-semibold text-lg text-pink-900 mb-3">Style 1: Soft Pastel Clouds</h3>
            <p className="text-xs text-gray-600 mb-4">Dreamy gradients, soft edges, gentle floating elements</p>
            <div className="flex items-center justify-center gap-8">
              {/* Soft cloud heart */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <linearGradient id="cloudHeart1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fce7f3" />
                      <stop offset="50%" stopColor="#fbcfe8" />
                      <stop offset="100%" stopColor="#f9a8d4" />
                    </linearGradient>
                    <filter id="softBlur1">
                      <feGaussianBlur stdDeviation="0.5" />
                    </filter>
                  </defs>

                  {/* Soft heart shape */}
                  <path d="M60,85 C60,85 35,70 35,50 C35,40 42,33 50,33 C55,33 58,36 60,42 C62,36 65,33 70,33 C78,33 85,40 85,50 C85,70 60,85 60,85 Z"
                        fill="url(#cloudHeart1)"
                        filter="url(#softBlur1)"
                        opacity="0.9"
                        className="animate-pulse"
                        style={{animationDuration: '3s'}} />

                  {/* Inner glow */}
                  <path d="M60,78 C60,78 42,66 42,52 C42,44 47,39 53,39 C56,39 58,41 60,45 C62,41 64,39 67,39 C73,39 78,44 78,52 C78,66 60,78 60,78 Z"
                        fill="#fff"
                        opacity="0.4" />

                  {/* Soft sparkles */}
                  <g className="animate-pulse" style={{animationDuration: '2s'}}>
                    <circle cx="45" cy="35" r="3" fill="#fbbf24" opacity="0.6" />
                    <circle cx="75" cy="38" r="2" fill="#fbbf24" opacity="0.6" />
                    <circle cx="50" cy="75" r="2.5" fill="#ec4899" opacity="0.5" />
                  </g>
                </svg>
                <p className="text-xs text-gray-600 mt-2">Gentle Love</p>
              </div>

              {/* Soft protective bubble */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <radialGradient id="bubble1">
                      <stop offset="0%" stopColor="#ddd6fe" />
                      <stop offset="70%" stopColor="#c4b5fd" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </radialGradient>
                  </defs>

                  {/* Protective bubble */}
                  <circle cx="60" cy="60" r="35"
                          fill="url(#bubble1)"
                          opacity="0.3"
                          className="animate-pulse"
                          style={{animationDuration: '4s'}} />

                  {/* Person inside - simple and contained */}
                  <g opacity="0.8">
                    <circle cx="60" cy="55" r="10" fill="#f9a8d4" />
                    <ellipse cx="60" cy="72" rx="12" ry="15" fill="#f9a8d4" />
                  </g>

                  {/* Shimmer effect */}
                  <ellipse cx="48" cy="45" rx="8" ry="12"
                           fill="#fff"
                           opacity="0.4"
                           transform="rotate(-30 48 45)" />
                </svg>
                <p className="text-xs text-gray-600 mt-2">Safe Space</p>
              </div>
            </div>
          </div>

          {/* Style 2: Delicate Floral Lines */}
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-rose-200">
            <h3 className="font-semibold text-lg text-rose-900 mb-3">Style 2: Delicate Floral Lines</h3>
            <p className="text-xs text-gray-600 mb-4">Elegant line work, botanical touches, feminine details</p>
            <div className="flex items-center justify-center gap-8">
              {/* Floral frame with heart */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <linearGradient id="floralPink" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fda4af" />
                      <stop offset="100%" stopColor="#fb7185" />
                    </linearGradient>
                  </defs>

                  {/* Delicate flower petals in corners */}
                  <g className="animate-pulse" style={{animationDuration: '3s'}}>
                    <path d="M25,25 Q20,20 25,15 Q30,20 25,25" fill="#fda4af" opacity="0.4" />
                    <path d="M95,25 Q100,20 95,15 Q90,20 95,25" fill="#fda4af" opacity="0.4" />
                    <path d="M25,95 Q20,100 25,105 Q30,100 25,95" fill="#fda4af" opacity="0.4" />
                    <path d="M95,95 Q100,100 95,105 Q90,100 95,95" fill="#fda4af" opacity="0.4" />
                  </g>

                  {/* Center heart - line art */}
                  <path d="M60,75 C60,75 42,62 42,48 C42,40 46,35 51,35 C55,35 58,38 60,43 C62,38 65,35 69,35 C74,35 78,40 78,48 C78,62 60,75 60,75 Z"
                        fill="none"
                        stroke="url(#floralPink)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="animate-pulse"
                        style={{animationDuration: '2s'}} />

                  {/* Inner heart fill - subtle */}
                  <path d="M60,70 C60,70 46,60 46,50 C46,44 49,40 53,40 C56,40 58,42 60,46 C62,42 64,40 67,40 C71,40 74,44 74,50 C74,60 60,70 60,70 Z"
                        fill="#fce7f3"
                        opacity="0.5" />

                  {/* Tiny leaf accents */}
                  <g stroke="#86efac" strokeWidth="1" fill="none">
                    <path d="M35,60 Q32,58 30,60" opacity="0.6" />
                    <path d="M85,60 Q88,58 90,60" opacity="0.6" />
                  </g>
                </svg>
                <p className="text-xs text-gray-600 mt-2">Blooming Care</p>
              </div>

              {/* Connected flowers */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <radialGradient id="flower1">
                      <stop offset="0%" stopColor="#fde047" />
                      <stop offset="100%" stopColor="#fbbf24" />
                    </radialGradient>
                  </defs>

                  {/* Connecting vine */}
                  <path d="M30,60 Q45,50 60,55 Q75,60 90,55"
                        fill="none"
                        stroke="#86efac"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity="0.6"
                        className="animate-pulse"
                        style={{animationDuration: '3s'}} />

                  {/* Three flowers */}
                  <g className="animate-pulse" style={{animationDuration: '2s'}}>
                    <circle cx="30" cy="60" r="8" fill="#f9a8d4" opacity="0.7" />
                    <circle cx="30" cy="60" r="4" fill="url(#flower1)" />
                  </g>

                  <g className="animate-pulse" style={{animationDuration: '2s', animationDelay: '0.3s'}}>
                    <circle cx="60" cy="55" r="10" fill="#c4b5fd" opacity="0.7" />
                    <circle cx="60" cy="55" r="5" fill="url(#flower1)" />
                  </g>

                  <g className="animate-pulse" style={{animationDuration: '2s', animationDelay: '0.6s'}}>
                    <circle cx="90" cy="55" r="8" fill="#fda4af" opacity="0.7" />
                    <circle cx="90" cy="55" r="4" fill="url(#flower1)" />
                  </g>

                  {/* Small leaves */}
                  <ellipse cx="45" cy="52" rx="4" ry="6" fill="#d1fae5" opacity="0.6" transform="rotate(30 45 52)" />
                  <ellipse cx="75" cy="57" rx="4" ry="6" fill="#d1fae5" opacity="0.6" transform="rotate(-30 75 57)" />
                </svg>
                <p className="text-xs text-gray-600 mt-2">Growing Together</p>
              </div>
            </div>
          </div>

          {/* Style 4: Minimal with Sparkle */}
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-fuchsia-200">
            <h3 className="font-semibold text-lg text-fuchsia-900 mb-3">Style 4: Minimal with Sparkle</h3>
            <p className="text-xs text-gray-600 mb-4">Clean lines, strategic color pops, modern elegance</p>
            <div className="flex items-center justify-center gap-8">
              {/* Minimal shield with accent */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <linearGradient id="minimalAccent1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f9a8d4" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>

                  {/* Simple shield outline */}
                  <path d="M60,25 L85,35 L85,60 C85,75 72,88 60,95 C48,88 35,75 35,60 L35,35 Z"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="2" />

                  {/* Inner shield with gradient */}
                  <path d="M60,32 L78,40 L78,58 C78,70 69,80 60,86 C51,80 42,70 42,58 L42,40 Z"
                        fill="url(#minimalAccent1)"
                        opacity="0.2"
                        className="animate-pulse"
                        style={{animationDuration: '3s'}} />

                  {/* Minimal checkmark */}
                  <path d="M50,58 L56,65 L70,48"
                        fill="none"
                        stroke="url(#minimalAccent1)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round" />

                  {/* Small sparkle accent */}
                  <circle cx="75" cy="45" r="2" fill="#f9a8d4" className="animate-pulse" />
                </svg>
                <p className="text-xs text-gray-600 mt-2">Simply Safe</p>
              </div>

              {/* Minimal connection icon */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <linearGradient id="minimalLine" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#c4b5fd" />
                      <stop offset="50%" stopColor="#f9a8d4" />
                      <stop offset="100%" stopColor="#fda4af" />
                    </linearGradient>
                  </defs>

                  {/* Three connected circles */}
                  <line x1="40" y1="45" x2="60" y2="60"
                        stroke="url(#minimalLine)"
                        strokeWidth="2"
                        className="animate-pulse"
                        style={{animationDuration: '2s'}} />
                  <line x1="60" y1="60" x2="80" y2="45"
                        stroke="url(#minimalLine)"
                        strokeWidth="2"
                        className="animate-pulse"
                        style={{animationDuration: '2s'}} />

                  <circle cx="40" cy="45" r="8" fill="#fff" stroke="#c4b5fd" strokeWidth="2" />
                  <circle cx="40" cy="45" r="4" fill="#c4b5fd" />

                  <circle cx="60" cy="60" r="10" fill="#fff" stroke="#f9a8d4" strokeWidth="2" />
                  <circle cx="60" cy="60" r="5" fill="#f9a8d4" />

                  <circle cx="80" cy="45" r="8" fill="#fff" stroke="#fda4af" strokeWidth="2" />
                  <circle cx="80" cy="45" r="4" fill="#fda4af" />

                  {/* Small heart accent */}
                  <path d="M60,80 C60,80 52,75 52,70 C52,67 54,65 56,65 C57,65 58,66 60,68 C62,66 63,65 64,65 C66,65 68,67 68,70 C68,75 60,80 60,80 Z"
                        fill="#ec4899"
                        opacity="0.6" />
                </svg>
                <p className="text-xs text-gray-600 mt-2">Connected Dots</p>
              </div>
            </div>
          </div>

          {/* Style 5: Soft Neon Glow */}
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-pink-200">
            <h3 className="font-semibold text-lg text-pink-900 mb-3">Style 5: Soft Neon Glow</h3>
            <p className="text-xs text-gray-600 mb-4">Gentle glows, luminous edges, dreamy atmosphere</p>
            <div className="flex items-center justify-center gap-8">
              {/* Glowing heart */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <filter id="softGlow2">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    <linearGradient id="neonPink" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f9a8d4" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>

                  {/* Glowing heart */}
                  <path d="M60,82 C60,82 36,68 36,48 C36,38 42,32 50,32 C55,32 58,35 60,42 C62,35 65,32 70,32 C78,32 84,38 84,48 C84,68 60,82 60,82 Z"
                        fill="url(#neonPink)"
                        filter="url(#softGlow2)"
                        opacity="0.8"
                        className="animate-pulse"
                        style={{animationDuration: '2.5s'}} />

                  {/* Inner glow */}
                  <path d="M60,75 C60,75 43,64 43,50 C43,42 48,37 54,37 C58,37 60,40 60,45 C60,40 62,37 66,37 C72,37 77,42 77,50 C77,64 60,75 60,75 Z"
                        fill="#fff"
                        opacity="0.4" />
                </svg>
                <p className="text-xs text-gray-600 mt-2">Glowing Care</p>
              </div>

              {/* Glowing stars circle */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <filter id="starGlow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Center circle with glow */}
                  <circle cx="60" cy="60" r="18"
                          fill="#c4b5fd"
                          filter="url(#starGlow)"
                          opacity="0.6"
                          className="animate-pulse"
                          style={{animationDuration: '3s'}} />

                  {/* Orbiting sparkles */}
                  <g className="animate-pulse" style={{animationDuration: '2s'}}>
                    <circle cx="60" cy="35" r="3" fill="#f9a8d4" filter="url(#starGlow)" />
                    <circle cx="85" cy="60" r="3" fill="#fda4af" filter="url(#starGlow)" />
                    <circle cx="60" cy="85" r="3" fill="#fbbf24" filter="url(#starGlow)" />
                    <circle cx="35" cy="60" r="3" fill="#c4b5fd" filter="url(#starGlow)" />
                  </g>

                  {/* Subtle connecting lines */}
                  <circle cx="60" cy="60" r="25"
                          fill="none"
                          stroke="#e9d5ff"
                          strokeWidth="1"
                          opacity="0.3"
                          strokeDasharray="2,3" />
                </svg>
                <p className="text-xs text-gray-600 mt-2">Magic Circle</p>
              </div>
            </div>
          </div>

          {/* Style 7: Soft Geometry */}
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-purple-200">
            <h3 className="font-semibold text-lg text-purple-900 mb-3">Style 7: Soft Geometry</h3>
            <p className="text-xs text-gray-600 mb-4">Geometric shapes with rounded corners, modern meets gentle</p>
            <div className="flex items-center justify-center gap-8">
              {/* Geometric heart */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <linearGradient id="geoHeart" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f472b6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>

                  {/* Geometric heart shape with soft edges */}
                  <path d="M60,75 L40,55 Q35,50 35,45 Q35,38 42,38 Q48,38 52,42 L60,50 L68,42 Q72,38 78,38 Q85,38 85,45 Q85,50 80,55 L60,75 Z"
                        fill="url(#geoHeart)"
                        opacity="0.8"
                        className="animate-pulse"
                        style={{animationDuration: '3s'}} />

                  {/* Inner geometric detail */}
                  <path d="M60,68 L46,54 Q43,51 43,48 Q43,44 48,44 Q51,44 54,47 L60,53 L66,47 Q69,44 72,44 Q77,44 77,48 Q77,51 74,54 L60,68 Z"
                        fill="#fff"
                        opacity="0.3" />

                  {/* Corner accents */}
                  <rect x="35" y="35" width="4" height="4" rx="1" fill="#fbbf24" opacity="0.6" />
                  <rect x="81" y="35" width="4" height="4" rx="1" fill="#fbbf24" opacity="0.6" />
                </svg>
                <p className="text-xs text-gray-600 mt-2">Structured Love</p>
              </div>

              {/* Geometric connection */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <linearGradient id="geoGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#c4b5fd" />
                    </linearGradient>
                  </defs>

                  {/* Rounded rectangles connected */}
                  <rect x="30" y="45" width="20" height="20" rx="6" fill="#f9a8d4" opacity="0.7" />
                  <rect x="70" y="45" width="20" height="20" rx="6" fill="#c4b5fd" opacity="0.7" />
                  <rect x="48" y="60" width="24" height="24" rx="6" fill="#fda4af" opacity="0.7" />

                  {/* Connecting lines */}
                  <line x1="50" y1="55" x2="60" y2="72"
                        stroke="url(#geoGrad1)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="animate-pulse"
                        style={{animationDuration: '2s'}} />
                  <line x1="70" y1="55" x2="60" y2="72"
                        stroke="url(#geoGrad1)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="animate-pulse"
                        style={{animationDuration: '2s'}} />

                  {/* Small accent squares */}
                  <rect x="58" y="38" width="4" height="4" rx="1" fill="#fbbf24"
                        className="animate-pulse" />
                </svg>
                <p className="text-xs text-gray-600 mt-2">Linked Up</p>
              </div>
            </div>
          </div>

          {/* Style 10: Ombre Magic */}
          <div className="p-6 bg-white rounded-xl border-2 border-purple-200">
            <h3 className="font-semibold text-lg text-purple-900 mb-3">Style 10: Ombre Magic</h3>
            <p className="text-xs text-gray-600 mb-4">Smooth color transitions, flowing gradients, cohesive harmony</p>
            <div className="flex items-center justify-center gap-8">
              {/* Ombre heart */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <linearGradient id="ombreHeart" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#c4b5fd" />
                      <stop offset="50%" stopColor="#f9a8d4" />
                      <stop offset="100%" stopColor="#fda4af" />
                    </linearGradient>
                  </defs>

                  {/* Smooth ombre heart */}
                  <path d="M60,82 C60,82 36,68 36,48 C36,38 42,32 50,32 C55,32 58,35 60,42 C62,35 65,32 70,32 C78,32 84,38 84,48 C84,68 60,82 60,82 Z"
                        fill="url(#ombreHeart)"
                        opacity="0.9"
                        className="animate-pulse"
                        style={{animationDuration: '4s'}} />

                  {/* Subtle shine */}
                  <ellipse cx="52" cy="43" rx="8" ry="10" fill="#fff" opacity="0.2" />
                </svg>
                <p className="text-xs text-gray-600 mt-2">Fading Love</p>
              </div>

              {/* Ombre connection flow */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <linearGradient id="ombreFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="33%" stopColor="#f9a8d4" />
                      <stop offset="66%" stopColor="#c4b5fd" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>

                  {/* Flowing wave connecting elements */}
                  <path d="M25,60 Q40,50 60,55 Q80,60 95,50"
                        fill="none"
                        stroke="url(#ombreFlow)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        opacity="0.6"
                        className="animate-pulse"
                        style={{animationDuration: '3s'}} />

                  {/* Gradient circles at endpoints */}
                  <circle cx="25" cy="60" r="8" fill="#fbbf24" opacity="0.7" />
                  <circle cx="60" cy="55" r="10" fill="#f9a8d4" opacity="0.7" />
                  <circle cx="95" cy="50" r="8" fill="#a78bfa" opacity="0.7" />

                  {/* Small flowing particles */}
                  <g className="animate-pulse" style={{animationDuration: '2s', animationDelay: '0.5s'}}>
                    <circle cx="42" cy="53" r="2" fill="#fbbf24" opacity="0.5" />
                    <circle cx="78" cy="56" r="2" fill="#c4b5fd" opacity="0.5" />
                  </g>
                </svg>
                <p className="text-xs text-gray-600 mt-2">Flowing Together</p>
              </div>
            </div>
          </div>

          {/* APP LOGO CONCEPTS - 5 Girls Around 1 Girl */}
          <div className="mt-8 pt-8 border-t-4 border-pink-200">
            <h3 className="text-xl font-display text-text-primary mb-4 text-center">
              💗 App Logo Concepts - 5 Friends, 1 Circle 💗
            </h3>
            <div className="grid grid-cols-5 gap-4">

              {/* Logo 1: Classic Dots */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-500 p-3 shadow-lg">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Center dot - main girl */}
                    <circle cx="50" cy="50" r="12" fill="white" />
                    {/* 5 surrounding dots - friends */}
                    <circle cx="50" cy="20" r="8" fill="white" opacity="0.9" />
                    <circle cx="75" cy="35" r="8" fill="white" opacity="0.9" />
                    <circle cx="75" cy="65" r="8" fill="white" opacity="0.9" />
                    <circle cx="50" cy="80" r="8" fill="white" opacity="0.9" />
                    <circle cx="25" cy="65" r="8" fill="white" opacity="0.9" />
                  </svg>
                </div>
                <p className="text-xs text-gray-600 mt-2">Classic</p>
              </div>

              {/* Logo 2: Gradient Circles */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 p-3 shadow-lg">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <radialGradient id="logoGlow1">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#fce7f3" />
                      </radialGradient>
                      <filter id="logoShadow1">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#db2777" floodOpacity="0.3"/>
                      </filter>
                    </defs>
                    {/* Center circle with glow */}
                    <circle cx="50" cy="50" r="14" fill="url(#logoGlow1)" filter="url(#logoShadow1)" />
                    {/* 5 surrounding circles */}
                    <circle cx="50" cy="18" r="9" fill="white" opacity="0.95" filter="url(#logoShadow1)" />
                    <circle cx="77" cy="33" r="9" fill="white" opacity="0.95" filter="url(#logoShadow1)" />
                    <circle cx="77" cy="67" r="9" fill="white" opacity="0.95" filter="url(#logoShadow1)" />
                    <circle cx="50" cy="82" r="9" fill="white" opacity="0.95" filter="url(#logoShadow1)" />
                    <circle cx="23" cy="67" r="9" fill="white" opacity="0.95" filter="url(#logoShadow1)" />
                  </svg>
                </div>
                <p className="text-xs text-gray-600 mt-2">Glow</p>
              </div>

              {/* Logo 3: Simple Figures */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-600 p-3 shadow-lg">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Center figure - larger */}
                    <g>
                      <circle cx="50" cy="45" r="8" fill="white" />
                      <circle cx="50" cy="60" r="10" fill="white" />
                    </g>
                    {/* 5 surrounding figures - smaller */}
                    <g opacity="0.9">
                      <circle cx="50" cy="15" r="5" fill="white" />
                      <circle cx="50" cy="25" r="6" fill="white" />
                    </g>
                    <g opacity="0.9">
                      <circle cx="80" cy="30" r="5" fill="white" />
                      <circle cx="80" cy="40" r="6" fill="white" />
                    </g>
                    <g opacity="0.9">
                      <circle cx="80" cy="60" r="5" fill="white" />
                      <circle cx="80" cy="70" r="6" fill="white" />
                    </g>
                    <g opacity="0.9">
                      <circle cx="50" cy="75" r="5" fill="white" />
                      <circle cx="50" cy="85" r="6" fill="white" />
                    </g>
                    <g opacity="0.9">
                      <circle cx="20" cy="60" r="5" fill="white" />
                      <circle cx="20" cy="70" r="6" fill="white" />
                    </g>
                  </svg>
                </div>
                <p className="text-xs text-gray-600 mt-2">Friends</p>
              </div>

              {/* Logo 4: Connected Network */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 p-3 shadow-lg">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Connection lines */}
                    <line x1="50" y1="50" x2="50" y2="20" stroke="white" strokeWidth="2" opacity="0.4" />
                    <line x1="50" y1="50" x2="75" y2="35" stroke="white" strokeWidth="2" opacity="0.4" />
                    <line x1="50" y1="50" x2="75" y2="65" stroke="white" strokeWidth="2" opacity="0.4" />
                    <line x1="50" y1="50" x2="50" y2="80" stroke="white" strokeWidth="2" opacity="0.4" />
                    <line x1="50" y1="50" x2="25" y2="65" stroke="white" strokeWidth="2" opacity="0.4" />
                    {/* Center node */}
                    <circle cx="50" cy="50" r="10" fill="white" />
                    {/* 5 surrounding nodes */}
                    <circle cx="50" cy="20" r="7" fill="white" opacity="0.95" />
                    <circle cx="75" cy="35" r="7" fill="white" opacity="0.95" />
                    <circle cx="75" cy="65" r="7" fill="white" opacity="0.95" />
                    <circle cx="50" cy="80" r="7" fill="white" opacity="0.95" />
                    <circle cx="25" cy="65" r="7" fill="white" opacity="0.95" />
                  </svg>
                </div>
                <p className="text-xs text-gray-600 mt-2">Connected</p>
              </div>

              {/* Logo 5: Hearts Pattern */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-300 to-purple-400 p-3 shadow-lg">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Center heart - main girl */}
                    <path d="M 50 55 C 50 50, 45 45, 40 45 C 35 45, 32 48, 32 52 C 32 58, 40 65, 50 68 C 60 65, 68 58, 68 52 C 68 48, 65 45, 60 45 C 55 45, 50 50, 50 55 Z" fill="white" />
                    {/* 5 surrounding hearts - smaller friends */}
                    <path d="M 50 25 C 50 22, 47 20, 45 20 C 43 20, 42 21, 42 23 C 42 26, 46 29, 50 31 C 54 29, 58 26, 58 23 C 58 21, 57 20, 55 20 C 53 20, 50 22, 50 25 Z" fill="white" opacity="0.9" />
                    <path d="M 78 38 C 78 35, 75 33, 73 33 C 71 33, 70 34, 70 36 C 70 39, 74 42, 78 44 C 82 42, 86 39, 86 36 C 86 34, 85 33, 83 33 C 81 33, 78 35, 78 38 Z" fill="white" opacity="0.9" />
                    <path d="M 78 68 C 78 65, 75 63, 73 63 C 71 63, 70 64, 70 66 C 70 69, 74 72, 78 74 C 82 72, 86 69, 86 66 C 86 64, 85 63, 83 63 C 81 63, 78 65, 78 68 Z" fill="white" opacity="0.9" />
                    <path d="M 50 85 C 50 82, 47 80, 45 80 C 43 80, 42 81, 42 83 C 42 86, 46 89, 50 91 C 54 89, 58 86, 58 83 C 58 81, 57 80, 55 80 C 53 80, 50 82, 50 85 Z" fill="white" opacity="0.9" />
                    <path d="M 22 68 C 22 65, 19 63, 17 63 C 15 63, 14 64, 14 66 C 14 69, 18 72, 22 74 C 26 72, 30 69, 30 66 C 30 64, 29 63, 27 63 C 25 63, 22 65, 22 68 Z" fill="white" opacity="0.9" />
                  </svg>
                </div>
                <p className="text-xs text-gray-600 mt-2">Hearts</p>
              </div>

            </div>
          </div>

          <div className="text-center mt-6 p-4 bg-gradient-to-r from-pink-100 via-purple-100 to-pink-100 rounded-lg">
            <p className="font-semibold text-gray-900 mb-2">Which style captures Besties' heart?</p>
            <p className="text-sm text-gray-700">
              Choose your favorite and I'll redesign all the icons site-wide in that style!
            </p>
          </div>
        </div>

        {/* ARCHIVED STYLES + CUSTOM ICON DESIGNS - DO NOT DELETE UNTIL USER APPROVAL */}
        <div className="card p-6 mb-6 bg-gradient-to-br from-rose-50 to-pink-50 border-4 border-rose-300">
          <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 mb-4">
            <p className="text-sm font-semibold text-yellow-900">⚠️ DO NOT DELETE - Archived styles & custom icon designs for user review</p>
          </div>

          <h2 className="text-2xl font-display text-text-primary mb-6 text-center">Archived Styles</h2>

          <h3 className="font-semibold text-xl text-purple-900 mb-3 text-center mt-8">Style 3: Watercolor Dream</h3>
          <p className="text-sm text-gray-600 mb-4 text-center">Soft washes, blended colors, artistic and organic</p>
          <div className="flex items-center justify-center gap-8 flex-wrap mb-8">
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 120 120" className="w-32 h-32">
                <defs>
                  <radialGradient id="watercolor1">
                    <stop offset="0%" stopColor="#f9a8d4" opacity="0.8" />
                    <stop offset="70%" stopColor="#f472b6" opacity="0.4" />
                    <stop offset="100%" stopColor="#ec4899" opacity="0.1" />
                  </radialGradient>
                  <radialGradient id="watercolor2">
                    <stop offset="0%" stopColor="#c4b5fd" opacity="0.6" />
                    <stop offset="100%" stopColor="#a78bfa" opacity="0.1" />
                  </radialGradient>
                </defs>
                <circle cx="60" cy="60" r="40" fill="url(#watercolor2)" />
                <path d="M60,80 C60,80 38,68 38,50 C38,42 43,37 49,37 C54,37 57,40 60,46 C63,40 66,37 71,37 C77,37 82,42 82,50 C82,68 60,80 60,80 Z" fill="url(#watercolor1)" />
                <ellipse cx="55" cy="52" rx="15" ry="12" fill="#fda4af" opacity="0.3" />
                <ellipse cx="65" cy="55" rx="12" ry="15" fill="#f9a8d4" opacity="0.2" />
              </svg>
              <p className="text-xs text-gray-600 mt-2">Painted Love</p>
            </div>
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 120 120" className="w-32 h-32">
                <defs>
                  <radialGradient id="person1wash">
                    <stop offset="0%" stopColor="#fbbf24" opacity="0.7" />
                    <stop offset="100%" stopColor="#fbbf24" opacity="0.1" />
                  </radialGradient>
                  <radialGradient id="person2wash">
                    <stop offset="0%" stopColor="#c4b5fd" opacity="0.7" />
                    <stop offset="100%" stopColor="#c4b5fd" opacity="0.1" />
                  </radialGradient>
                </defs>
                <g>
                  <circle cx="40" cy="50" r="20" fill="url(#person1wash)" />
                  <circle cx="40" cy="48" r="10" fill="#fbbf24" opacity="0.6" />
                  <ellipse cx="40" cy="65" rx="12" ry="18" fill="#fbbf24" opacity="0.5" />
                </g>
                <g>
                  <circle cx="80" cy="50" r="20" fill="url(#person2wash)" />
                  <circle cx="80" cy="48" r="10" fill="#c4b5fd" opacity="0.6" />
                  <ellipse cx="80" cy="65" rx="12" ry="18" fill="#c4b5fd" opacity="0.5" />
                </g>
                <ellipse cx="60" cy="65" rx="25" ry="8" fill="#f9a8d4" opacity="0.3" />
              </svg>
              <p className="text-xs text-gray-600 mt-2">Together Always</p>
            </div>
          </div>

          <h3 className="font-semibold text-xl text-rose-900 mb-3 text-center mt-8">Style 6: Bubbly & Round</h3>
          <p className="text-sm text-gray-600 mb-4 text-center">Rounded shapes, soft circles, friendly and approachable</p>
          <div className="flex items-center justify-center gap-8 flex-wrap mb-8">
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 120 120" className="w-32 h-32">
                <defs>
                  <linearGradient id="bubble2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fda4af" />
                    <stop offset="100%" stopColor="#fb7185" />
                  </linearGradient>
                </defs>
                <g>
                  <circle cx="48" cy="48" r="14" fill="url(#bubble2)" opacity="0.7" />
                  <circle cx="72" cy="48" r="14" fill="url(#bubble2)" opacity="0.7" />
                  <circle cx="60" cy="56" r="16" fill="url(#bubble2)" opacity="0.7" />
                  <circle cx="60" cy="70" r="12" fill="url(#bubble2)" opacity="0.7" />
                </g>
                <circle cx="52" cy="44" r="4" fill="#fff" opacity="0.6" />
                <circle cx="68" cy="46" r="3" fill="#fff" opacity="0.6" />
                <circle cx="40" cy="70" r="4" fill="#fbbf24" opacity="0.5" />
                <circle cx="80" cy="75" r="5" fill="#f9a8d4" opacity="0.5" />
                <circle cx="60" cy="30" r="3" fill="#c4b5fd" opacity="0.5" />
              </svg>
              <p className="text-xs text-gray-600 mt-2">Bubble Love</p>
            </div>
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 120 120" className="w-32 h-32">
                <defs>
                  <linearGradient id="bubblePerson1" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                  <linearGradient id="bubblePerson2" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f9a8d4" />
                    <stop offset="100%" stopColor="#f472b6" />
                  </linearGradient>
                  <linearGradient id="bubblePerson3" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#c4b5fd" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
                <g>
                  <circle cx="35" cy="55" r="12" fill="url(#bubblePerson1)" />
                  <circle cx="35" cy="73" r="14" fill="url(#bubblePerson1)" opacity="0.8" />
                </g>
                <g>
                  <circle cx="60" cy="48" r="14" fill="url(#bubblePerson2)" />
                  <circle cx="60" cy="68" r="16" fill="url(#bubblePerson2)" opacity="0.8" />
                </g>
                <g>
                  <circle cx="85" cy="55" r="12" fill="url(#bubblePerson3)" />
                  <circle cx="85" cy="73" r="14" fill="url(#bubblePerson3)" opacity="0.8" />
                </g>
                <circle cx="47" cy="62" r="3" fill="#fff" opacity="0.5" />
                <circle cx="73" cy="62" r="3" fill="#fff" opacity="0.5" />
              </svg>
              <p className="text-xs text-gray-600 mt-2">Bubble Squad</p>
            </div>
          </div>

          <h3 className="font-semibold text-xl text-pink-900 mb-3 text-center mt-8">Style 8: Stardust Dreams</h3>
          <p className="text-sm text-gray-600 mb-4 text-center">Sparkles, twinkles, magical particles, whimsical feel</p>
          <div className="flex items-center justify-center gap-8 flex-wrap mb-8">
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 120 120" className="w-32 h-32">
                <defs>
                  <radialGradient id="sparkle1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#fbbf24" opacity="0" />
                  </radialGradient>
                </defs>
                <g>
                  <path d="M45,48 L46,51 L49,52 L46,53 L45,56 L44,53 L41,52 L44,51 Z" fill="#ec4899" />
                  <path d="M75,48 L76,51 L79,52 L76,53 L75,56 L74,53 L71,52 L74,51 Z" fill="#ec4899" />
                  <path d="M38,56 L39,59 L42,60 L39,61 L38,64 L37,61 L34,60 L37,59 Z" fill="#f472b6" />
                  <path d="M82,56 L83,59 L86,60 L83,61 L82,64 L81,61 L78,60 L81,59 Z" fill="#f472b6" />
                  <path d="M60,75 L61,78 L64,79 L61,80 L60,83 L59,80 L56,79 L59,78 Z" fill="#ec4899" />
                  <path d="M35,68 L36,71 L39,72 L36,73 L35,76 L34,73 L31,72 L34,71 Z" fill="#f9a8d4" />
                  <path d="M85,68 L86,71 L89,72 L86,73 L85,76 L84,73 L81,72 L84,71 Z" fill="#f9a8d4" />
                </g>
                <circle cx="50" cy="40" r="1.5" fill="#fbbf24" opacity="0.8" />
                <circle cx="70" cy="42" r="1" fill="#fbbf24" opacity="0.8" />
                <circle cx="60" cy="35" r="1.5" fill="#fbbf24" opacity="0.8" />
                <circle cx="45" cy="80" r="1" fill="#c4b5fd" opacity="0.8" />
                <circle cx="75" cy="82" r="1.5" fill="#c4b5fd" opacity="0.8" />
                <circle cx="60" cy="60" r="30" fill="url(#sparkle1)" opacity="0.1" />
              </svg>
              <p className="text-xs text-gray-600 mt-2">Starry Heart</p>
            </div>
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 120 120" className="w-32 h-32">
                <g>
                  <path d="M60,25 L61,28 L64,29 L61,30 L60,33 L59,30 L56,29 L59,28 Z" fill="#a78bfa" />
                  <path d="M85,45 L86,48 L89,49 L86,50 L85,53 L84,50 L81,49 L84,48 Z" fill="#f9a8d4" />
                  <path d="M90,70 L91,73 L94,74 L91,75 L90,78 L89,75 L86,74 L89,73 Z" fill="#fda4af" />
                  <path d="M70,90 L71,93 L74,94 L71,95 L70,98 L69,95 L66,94 L69,93 Z" fill="#fbbf24" />
                  <path d="M40,90 L41,93 L44,94 L41,95 L40,98 L39,95 L36,94 L39,93 Z" fill="#c4b5fd" />
                  <path d="M25,70 L26,73 L29,74 L26,75 L25,78 L24,75 L21,74 L24,73 Z" fill="#f472b6" />
                  <path d="M30,45 L31,48 L34,49 L31,50 L30,53 L29,50 L26,49 L29,48 Z" fill="#fbbf24" />
                </g>
                <circle cx="60" cy="60" r="15" fill="#f9a8d4" opacity="0.3" />
                <circle cx="60" cy="58" r="8" fill="#f9a8d4" opacity="0.6" />
                <circle cx="50" cy="50" r="1" fill="#fbbf24" opacity="0.6" />
                <circle cx="70" cy="55" r="1" fill="#c4b5fd" opacity="0.6" />
                <circle cx="55" cy="70" r="1" fill="#fda4af" opacity="0.6" />
              </svg>
              <p className="text-xs text-gray-600 mt-2">Magic Shield</p>
            </div>
          </div>

          <h3 className="font-semibold text-xl text-rose-900 mb-3 text-center mt-8">Style 9: Sketchy & Sweet</h3>
          <p className="text-sm text-gray-600 mb-4 text-center">Hand-drawn lines, imperfect charm, personal touch</p>

          <div className="flex items-center justify-center gap-8 flex-wrap">
            {/* Sketchy heart */}
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 120 120" className="w-32 h-32">
                <defs>
                  <linearGradient id="sketchFill" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fce7f3" />
                    <stop offset="100%" stopColor="#fbcfe8" />
                  </linearGradient>
                </defs>

                {/* Sketchy heart outline - slightly wobbly */}
                <path d="M60,80 C60,80 38,67 38,49 C38,41 43,36 49,36 C54,36 57,39 60,45 C63,39 66,36 71,36 C77,36 82,41 82,49 C82,67 60,80 60,80 Z"
                      fill="url(#sketchFill)"
                      stroke="#f472b6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.8" />

                {/* Inner sketch lines for shading effect */}
                <g stroke="#f472b6" strokeWidth="1" opacity="0.3">
                  <line x1="45" y1="48" x2="52" y2="48" strokeLinecap="round" />
                  <line x1="68" y1="48" x2="75" y2="48" strokeLinecap="round" />
                  <line x1="48" y1="55" x2="56" y2="55" strokeLinecap="round" />
                  <line x1="64" y1="55" x2="72" y2="55" strokeLinecap="round" />
                  <line x1="52" y1="62" x2="58" y2="62" strokeLinecap="round" />
                  <line x1="62" y1="62" x2="68" y2="62" strokeLinecap="round" />
                </g>

                {/* Small sketchy sparkles */}
                <g className="animate-pulse" style={{animationDuration: '2s'}}>
                  <line x1="35" y1="35" x2="38" y2="38" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
                  <line x1="38" y1="35" x2="35" y2="38" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
                  <line x1="82" y1="38" x2="85" y2="41" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
                  <line x1="85" y1="38" x2="82" y2="41" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
                </g>
              </svg>
              <p className="text-xs text-gray-600 mt-2">Drawn with Love</p>
            </div>

            {/* Sketchy holding hands */}
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 120 120" className="w-32 h-32">
                {/* Two figures holding hands - sketchy style */}
                <g stroke="#c4b5fd" strokeWidth="2.5" fill="none" strokeLinecap="round">
                  {/* Left person */}
                  <circle cx="38" cy="48" r="10" opacity="0.7" />
                  <path d="M38,58 L38,75" />
                  <path d="M30,65 L38,65 L46,65" />

                  {/* Right person */}
                  <circle cx="82" cy="48" r="10" opacity="0.7" />
                  <path d="M82,58 L82,75" />
                  <path d="M74,65 L82,65 L90,65" />
                </g>

                {/* Holding hands line - slightly wavy for sketch effect */}
                <path d="M46,65 Q55,63 60,65 Q65,67 74,65"
                      fill="none"
                      stroke="#f472b6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="animate-pulse"
                      style={{animationDuration: '3s'}} />

                {/* Sketchy heart above */}
                <path d="M60,30 C60,30 54,26 54,22 C54,20 55,19 57,19 C58,19 59,20 60,22 C61,20 62,19 63,19 C65,19 66,20 66,22 C66,26 60,30 60,30 Z"
                      fill="#f9a8d4"
                      stroke="#f472b6"
                      strokeWidth="1"
                      opacity="0.7" />
              </svg>
              <p className="text-xs text-gray-600 mt-2">Hand in Hand</p>
            </div>
          </div>

          <hr className="my-8 border-t-2 border-rose-300" />

          <h2 className="text-2xl font-display text-text-primary mb-6 text-center mt-8">Custom Icon Designs</h2>

          {/* OUR MISSION ICONS - Style 4 (Minimal with Sparkle) */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-fuchsia-900 mb-4 text-center">Our Mission Icons - Minimal with Sparkle Style</h3>

            {/* Keep You Safe - 3 designs */}
            <div className="mb-6">
              <h4 className="font-semibold text-sm text-gray-800 mb-3">Keep You Safe (3 variations)</h4>
              <div className="flex gap-4 flex-wrap justify-center">
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 48 48" className="w-16 h-16">
                    <defs>
                      <linearGradient id="safe1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <path d="M24,8 L36,12 L36,24 C36,32 30,38 24,42 C18,38 12,32 12,24 L12,12 Z" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                    <path d="M24,12 L32,15 L32,23 C32,29 28,34 24,37 C20,34 16,29 16,23 L16,15 Z" fill="url(#safe1)" opacity="0.2" />
                    <path d="M20,23 L22,26 L28,19" fill="none" stroke="url(#safe1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="30" cy="16" r="1.5" fill="#fbbf24" />
                  </svg>
                  <p className="text-xs text-gray-600 mt-1">V1: Shield Check</p>
                </div>
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 48 48" className="w-16 h-16">
                    <defs>
                      <linearGradient id="safe2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <circle cx="24" cy="24" r="14" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                    <circle cx="24" cy="24" r="10" fill="url(#safe2)" opacity="0.2" />
                    <path d="M24,16 L24,24 L28,28" fill="none" stroke="url(#safe2)" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="32" cy="16" r="1.5" fill="#fbbf24" />
                  </svg>
                  <p className="text-xs text-gray-600 mt-1">V2: Protection Circle</p>
                </div>
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 48 48" className="w-16 h-16">
                    <defs>
                      <linearGradient id="safe3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <rect x="16" y="20" width="16" height="16" rx="2" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                    <path d="M20,20 L20,16 C20,13 21.5,11 24,11 C26.5,11 28,13 28,16 L28,20" fill="none" stroke="url(#safe3)" strokeWidth="2" strokeLinecap="round"/>
                    <rect x="19" y="23" width="10" height="9" rx="1" fill="url(#safe3)" opacity="0.2" />
                    <circle cx="32" cy="14" r="1.5" fill="#fbbf24" />
                  </svg>
                  <p className="text-xs text-gray-600 mt-1">V3: Secure Lock</p>
                </div>
              </div>
            </div>

            {/* Build Community - 3 designs */}
            <div className="mb-6">
              <h4 className="font-semibold text-sm text-gray-800 mb-3">Build Community (3 variations)</h4>
              <div className="flex gap-4 flex-wrap justify-center">
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 48 48" className="w-16 h-16">
                    <defs>
                      <linearGradient id="comm1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#c4b5fd" />
                        <stop offset="50%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#fda4af" />
                      </linearGradient>
                    </defs>
                    <line x1="16" y1="18" x2="24" y2="24" stroke="url(#comm1)" strokeWidth="1.5" />
                    <line x1="24" y1="24" x2="32" y2="18" stroke="url(#comm1)" strokeWidth="1.5" />
                    <circle cx="16" cy="18" r="4" fill="#fff" stroke="#c4b5fd" strokeWidth="1.5" />
                    <circle cx="16" cy="18" r="2" fill="#c4b5fd" />
                    <circle cx="24" cy="24" r="5" fill="#fff" stroke="#f9a8d4" strokeWidth="1.5" />
                    <circle cx="24" cy="24" r="2.5" fill="#f9a8d4" />
                    <circle cx="32" cy="18" r="4" fill="#fff" stroke="#fda4af" strokeWidth="1.5" />
                    <circle cx="32" cy="18" r="2" fill="#fda4af" />
                    <circle cx="34" cy="12" r="1.5" fill="#fbbf24" />
                  </svg>
                  <p className="text-xs text-gray-600 mt-1">V1: Connected Trio</p>
                </div>
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 48 48" className="w-16 h-16">
                    <defs>
                      <linearGradient id="comm2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <circle cx="24" cy="24" r="12" fill="none" stroke="#e5e7eb" strokeWidth="1.5" strokeDasharray="2,2" />
                    <circle cx="24" cy="16" r="3" fill="#c4b5fd" />
                    <circle cx="30" cy="28" r="3" fill="#f9a8d4" />
                    <circle cx="18" cy="28" r="3" fill="#fda4af" />
                    <circle cx="24" cy="24" r="1.5" fill="url(#comm2)" />
                    <circle cx="34" cy="14" r="1.5" fill="#fbbf24" />
                  </svg>
                  <p className="text-xs text-gray-600 mt-1">V2: Circle of Friends</p>
                </div>
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 48 48" className="w-16 h-16">
                    <defs>
                      <linearGradient id="comm3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <path d="M14,26 C14,26 12,22 12,20 C12,18 13,17 14.5,17 C15.5,17 16,18 16,19 C16,18 16.5,17 17.5,17 C19,17 20,18 20,20 C20,22 18,26 18,26 L14,26 Z" fill="url(#comm3)" opacity="0.3" />
                    <path d="M20,24 C20,24 18,20 18,18 C18,16 19,15 20.5,15 C21.5,15 22,16 22,17 C22,16 22.5,15 23.5,15 C25,15 26,16 26,18 C26,20 24,24 24,24 L20,24 Z" fill="url(#comm3)" opacity="0.5" />
                    <path d="M26,22 C26,22 24,18 24,16 C24,14 25,13 26.5,13 C27.5,13 28,14 28,15 C28,14 28.5,13 29.5,13 C31,13 32,14 32,16 C32,18 30,22 30,22 L26,22 Z" fill="url(#comm3)" />
                    <line x1="16" y1="26" x2="16" y2="32" stroke="url(#comm3)" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="22" y1="24" x2="22" y2="32" stroke="url(#comm3)" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="28" y1="22" x2="28" y2="32" stroke="url(#comm3)" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="34" cy="12" r="1.5" fill="#fbbf24" />
                  </svg>
                  <p className="text-xs text-gray-600 mt-1">V3: Growing Together</p>
                </div>
              </div>
            </div>

            {/* Stay Free - 3 designs */}
            <div className="mb-6">
              <h4 className="font-semibold text-sm text-gray-800 mb-3">Stay Free (3 variations)</h4>
              <div className="flex gap-4 flex-wrap justify-center">
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 48 48" className="w-16 h-16">
                    <defs>
                      <linearGradient id="free1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <path d="M24,34 L14,24 C12,22 12,19 14,17 C16,15 19,15 21,17 L24,20 L27,17 C29,15 32,15 34,17 C36,19 36,22 34,24 Z" fill="none" stroke="url(#free1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M20,24 L28,24" stroke="url(#free1)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
                    <circle cx="34" cy="14" r="1.5" fill="#fbbf24" />
                  </svg>
                  <p className="text-xs text-gray-600 mt-1">V1: Open Heart</p>
                </div>
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 48 48" className="w-16 h-16">
                    <defs>
                      <linearGradient id="free2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <path d="M18,18 C18,18 18,16 18,14 C18,12 19,11 20.5,11 C21.5,11 22,12 22,13 C22,12 22.5,11 23.5,11 C25,11 26,12 26,14 C26,16 26,18 26,18" fill="none" stroke="url(#free2)" strokeWidth="2" strokeLinecap="round" />
                    <ellipse cx="22" cy="22" rx="8" ry="6" fill="none" stroke="url(#free2)" strokeWidth="2" />
                    <path d="M18,24 Q22,27 26,24" fill="none" stroke="url(#free2)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
                    <circle cx="34" cy="12" r="1.5" fill="#fbbf24" />
                  </svg>
                  <p className="text-xs text-gray-600 mt-1">V2: Caring Hands</p>
                </div>
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 48 48" className="w-16 h-16">
                    <defs>
                      <linearGradient id="free3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <path d="M12,24 C12,18 16,14 24,14 C32,14 36,18 36,24" fill="none" stroke="url(#free3)" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="24" cy="24" r="4" fill="none" stroke="url(#free3)" strokeWidth="2" />
                    <line x1="20" y1="28" x2="28" y2="28" stroke="url(#free3)" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="34" cy="12" r="1.5" fill="#fbbf24" />
                  </svg>
                  <p className="text-xs text-gray-600 mt-1">V3: Accessible</p>
                </div>
              </div>
            </div>
          </div>

          {/* OTHER WAYS TO HELP ICONS - Style 5 (Soft Neon Glow) */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-pink-900 mb-4 text-center">Other Ways to Help Icons - Soft Neon Glow Style</h3>

            {/* Spread the Word - 3 designs */}
            <div className="mb-6">
              <h4 className="font-semibold text-sm text-gray-800 mb-3">Spread the Word (3 variations)</h4>
              <div className="flex gap-4 flex-wrap justify-center">
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 48 48" className="w-16 h-16">
                    <defs>
                      <filter id="glow1">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <linearGradient id="spread1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <path d="M14,18 L20,18 L26,14 L26,34 L20,30 L14,30 Z" fill="url(#spread1)" filter="url(#glow1)" opacity="0.8" />
                    <path d="M28,20 Q32,24 28,28" fill="none" stroke="url(#spread1)" strokeWidth="2" strokeLinecap="round" filter="url(#glow1)" />
                    <path d="M32,18 Q38,24 32,30" fill="none" stroke="url(#spread1)" strokeWidth="1.5" strokeLinecap="round" filter="url(#glow1)" opacity="0.6" />
                  </svg>
                  <p className="text-xs text-gray-600 mt-1">V1: Megaphone</p>
                </div>
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 48 48" className="w-16 h-16">
                    <defs>
                      <filter id="glow2">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <linearGradient id="spread2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <ellipse cx="24" cy="26" rx="10" ry="8" fill="url(#spread2)" filter="url(#glow2)" opacity="0.8" />
                    <path d="M24,18 C24,18 22,16 22,14 C22,13 23,12 24,12 C25,12 26,13 26,14 C26,16 24,18 24,18 Z" fill="url(#spread2)" filter="url(#glow2)" opacity="0.8" />
                    <path d="M18,22 L14,18" stroke="url(#spread2)" strokeWidth="2" strokeLinecap="round" filter="url(#glow2)" />
                    <path d="M30,22 L34,18" stroke="url(#spread2)" strokeWidth="2" strokeLinecap="round" filter="url(#glow2)" />
                  </svg>
                  <p className="text-xs text-gray-600 mt-1">V2: Speech Bubble</p>
                </div>
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 48 48" className="w-16 h-16">
                    <defs>
                      <filter id="glow3">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <linearGradient id="spread3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <circle cx="20" cy="20" r="6" fill="url(#spread3)" filter="url(#glow3)" opacity="0.6" />
                    <circle cx="28" cy="20" r="6" fill="url(#spread3)" filter="url(#glow3)" opacity="0.6" />
                    <circle cx="34" cy="26" r="6" fill="url(#spread3)" filter="url(#glow3)" opacity="0.6" />
                    <line x1="24" y1="20" x2="28" y2="20" stroke="url(#spread3)" strokeWidth="1.5" filter="url(#glow3)" />
                    <line x1="30" y1="23" x2="32" y2="24" stroke="url(#spread3)" strokeWidth="1.5" filter="url(#glow3)" />
                  </svg>
                  <p className="text-xs text-gray-600 mt-1">V3: Share Network</p>
                </div>
              </div>
            </div>

            {/* Share Ideas - 3 designs */}
            <div className="mb-6">
              <h4 className="font-semibold text-sm text-gray-800 mb-3">Share Ideas (3 variations)</h4>
              <div className="flex gap-4 flex-wrap justify-center">
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 48 48" className="w-16 h-16">
                    <defs>
                      <filter id="glow4">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <linearGradient id="idea1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                    <circle cx="24" cy="20" r="8" fill="url(#idea1)" filter="url(#glow4)" opacity="0.8" />
                    <path d="M20,28 L20,32 L28,32 L28,28" fill="url(#idea1)" opacity="0.4" />
                    <line x1="20" y1="32" x2="28" y2="32" stroke="url(#idea1)" strokeWidth="2" strokeLinecap="round" filter="url(#glow4)" />
                    <circle cx="24" cy="20" r="4" fill="#fff" opacity="0.4" />
                  </svg>
                  <p className="text-xs text-gray-600 mt-1">V1: Light Bulb</p>
                </div>
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 48 48" className="w-16 h-16">
                    <defs>
                      <filter id="glow5">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <linearGradient id="idea2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                    <circle cx="24" cy="24" r="10" fill="url(#idea2)" filter="url(#glow5)" opacity="0.6" />
                    <circle cx="20" cy="20" r="2" fill="#fbbf24" filter="url(#glow5)" />
                    <circle cx="28" cy="20" r="2" fill="#fbbf24" filter="url(#glow5)" />
                    <circle cx="24" cy="28" r="2" fill="#fbbf24" filter="url(#glow5)" />
                    <circle cx="30" cy="26" r="2" fill="#fbbf24" filter="url(#glow5)" />
                  </svg>
                  <p className="text-xs text-gray-600 mt-1">V2: Brainstorm</p>
                </div>
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 48 48" className="w-16 h-16">
                    <defs>
                      <filter id="glow6">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <linearGradient id="idea3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                    <ellipse cx="24" cy="22" rx="8" ry="10" fill="url(#idea3)" filter="url(#glow6)" opacity="0.8" />
                    <path d="M18,26 L18,30 L30,30 L30,26" fill="url(#idea3)" opacity="0.4" />
                    <path d="M24,16 L24,12 M18,18 L15,15 M30,18 L33,15" stroke="url(#idea3)" strokeWidth="1.5" strokeLinecap="round" filter="url(#glow6)" />
                  </svg>
                  <p className="text-xs text-gray-600 mt-1">V3: Bright Idea</p>
                </div>
              </div>
            </div>

            {/* Leave a Review - 3 designs */}
            <div className="mb-6">
              <h4 className="font-semibold text-sm text-gray-800 mb-3">Leave a Review (3 variations)</h4>
              <div className="flex gap-4 flex-wrap justify-center">
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 48 48" className="w-16 h-16">
                    <defs>
                      <filter id="glow7">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <linearGradient id="review1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a78bfa" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                    <path d="M24,14 L26,20 L32,21 L28,26 L29,32 L24,29 L19,32 L20,26 L16,21 L22,20 Z" fill="url(#review1)" filter="url(#glow7)" opacity="0.8" />
                    <path d="M24,18 L25,22 L28,22 L26,24 L27,28 L24,26 L21,28 L22,24 L20,22 L23,22 Z" fill="#fff" opacity="0.4" />
                  </svg>
                  <p className="text-xs text-gray-600 mt-1">V1: Single Star</p>
                </div>
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 48 48" className="w-16 h-16">
                    <defs>
                      <filter id="glow8">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <linearGradient id="review2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a78bfa" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                    <path d="M16,18 L17,21 L20,21 L18,23 L19,26 L16,24 L13,26 L14,23 L12,21 L15,21 Z" fill="url(#review2)" filter="url(#glow8)" opacity="0.8" />
                    <path d="M24,14 L25,18 L29,18 L26,21 L27,25 L24,23 L21,25 L22,21 L19,18 L23,18 Z" fill="url(#review2)" filter="url(#glow8)" opacity="0.8" />
                    <path d="M32,18 L33,21 L36,21 L34,23 L35,26 L32,24 L29,26 L30,23 L28,21 L31,21 Z" fill="url(#review2)" filter="url(#glow8)" opacity="0.8" />
                  </svg>
                  <p className="text-xs text-gray-600 mt-1">V2: Triple Stars</p>
                </div>
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 48 48" className="w-16 h-16">
                    <defs>
                      <filter id="glow9">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <linearGradient id="review3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a78bfa" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                    <circle cx="24" cy="24" r="12" fill="url(#review3)" filter="url(#glow9)" opacity="0.3" />
                    <path d="M24,16 L25,20 L29,20 L26,23 L27,27 L24,25 L21,27 L22,23 L19,20 L23,20 Z" fill="url(#review3)" filter="url(#glow9)" opacity="0.8" />
                    <circle cx="18" cy="30" r="1.5" fill="#a78bfa" filter="url(#glow9)" />
                    <circle cx="30" cy="30" r="1.5" fill="#a78bfa" filter="url(#glow9)" />
                  </svg>
                  <p className="text-xs text-gray-600 mt-1">V3: Star Badge</p>
                </div>
              </div>
            </div>

            {/* Use the App - 3 designs */}
            <div className="mb-6">
              <h4 className="font-semibold text-sm text-gray-800 mb-3">Use the App (3 variations)</h4>
              <div className="flex gap-4 flex-wrap justify-center">
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 48 48" className="w-16 h-16">
                    <defs>
                      <filter id="glow10">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <linearGradient id="app1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <rect x="16" y="12" width="16" height="24" rx="2" fill="url(#app1)" filter="url(#glow10)" opacity="0.8" />
                    <rect x="18" y="14" width="12" height="18" rx="1" fill="#fff" opacity="0.3" />
                    <path d="M20,24 L22,27 L28,20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="22" y1="34" x2="26" y2="34" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <p className="text-xs text-gray-600 mt-1">V1: Phone Check</p>
                </div>
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 48 48" className="w-16 h-16">
                    <defs>
                      <filter id="glow11">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <linearGradient id="app2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <rect x="16" y="12" width="16" height="24" rx="2" fill="url(#app2)" filter="url(#glow11)" opacity="0.8" />
                    <rect x="18" y="14" width="12" height="18" rx="1" fill="#fff" opacity="0.3" />
                    <path d="M24,22 C24,22 22,20 22,18 C22,17 23,16 24,16 C25,16 26,17 26,18 C26,20 24,22 24,22 Z" fill="#fff" />
                    <line x1="22" y1="34" x2="26" y2="34" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <p className="text-xs text-gray-600 mt-1">V2: App Love</p>
                </div>
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 48 48" className="w-16 h-16">
                    <defs>
                      <filter id="glow12">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <linearGradient id="app3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <rect x="16" y="12" width="16" height="24" rx="2" fill="url(#app3)" filter="url(#glow12)" opacity="0.8" />
                    <rect x="18" y="14" width="12" height="18" rx="1" fill="#fff" opacity="0.3" />
                    <circle cx="24" cy="24" r="4" fill="url(#app3)" filter="url(#glow12)" />
                    <circle cx="24" cy="24" r="2" fill="#fff" opacity="0.6" />
                    <line x1="22" y1="34" x2="26" y2="34" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <p className="text-xs text-gray-600 mt-1">V3: Active App</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* SECTION REDESIGNS - OUR MISSION */}
        <div className="card p-6 mb-6 bg-gradient-to-br from-fuchsia-50 to-pink-50 border-4 border-fuchsia-300">
          <h2 className="text-2xl font-display text-text-primary mb-6 text-center">Our Mission - 4 Style Variations</h2>

          {/* Style 4: Minimal with Sparkle */}
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-fuchsia-200">
            <h3 className="font-semibold text-lg text-fuchsia-900 mb-4">Style 4: Minimal with Sparkle</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0">
                  <svg viewBox="0 0 48 48" className="w-full h-full">
                    <defs>
                      <linearGradient id="mission4-1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <path d="M24,8 L36,12 L36,24 C36,32 30,38 24,42 C18,38 12,32 12,24 L12,12 Z" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
                    <path d="M24,12 L32,15 L32,23 C32,29 28,34 24,37 C20,34 16,29 16,23 L16,15 Z" fill="url(#mission4-1)" opacity="0.2" />
                    <path d="M20,23 L22,26 L28,19" fill="none" stroke="url(#mission4-1)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="32" cy="14" r="2" fill="#fbbf24" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Keep You Safe</h4>
                  <p className="text-sm text-gray-700">Make safety simple, automatic, and always there when you need it</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0">
                  <svg viewBox="0 0 48 48" className="w-full h-full">
                    <defs>
                      <linearGradient id="mission4-2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#c4b5fd" />
                        <stop offset="50%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#fda4af" />
                      </linearGradient>
                    </defs>
                    <line x1="16" y1="20" x2="24" y2="26" stroke="url(#mission4-2)" strokeWidth="2.5" />
                    <line x1="24" y1="26" x2="32" y2="20" stroke="url(#mission4-2)" strokeWidth="2.5" />
                    <circle cx="16" cy="20" r="5" fill="#fff" stroke="#c4b5fd" strokeWidth="2.5" />
                    <circle cx="16" cy="20" r="2.5" fill="#c4b5fd" />
                    <circle cx="24" cy="26" r="6" fill="#fff" stroke="#f9a8d4" strokeWidth="2.5" />
                    <circle cx="24" cy="26" r="3" fill="#f9a8d4" />
                    <circle cx="32" cy="20" r="5" fill="#fff" stroke="#fda4af" strokeWidth="2.5" />
                    <circle cx="32" cy="20" r="2.5" fill="#fda4af" />
                    <circle cx="36" cy="14" r="2" fill="#fbbf24" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Build Community</h4>
                  <p className="text-sm text-gray-700">Create a network of people who look out for each other</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0">
                  <svg viewBox="0 0 48 48" className="w-full h-full">
                    <defs>
                      <linearGradient id="mission4-3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <path d="M24,36 L14,26 C12,24 12,21 14,19 C16,17 19,17 21,19 L24,22 L27,19 C29,17 32,17 34,19 C36,21 36,24 34,26 Z" fill="none" stroke="url(#mission4-3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M20,26 L28,26" stroke="url(#mission4-3)" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
                    <circle cx="36" cy="14" r="2" fill="#fbbf24" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Stay Free</h4>
                  <p className="text-sm text-gray-700">Keep Besties accessible to everyone, regardless of their ability to pay</p>
                </div>
              </div>
            </div>
          </div>

          {/* Style 5: Soft Neon Glow */}
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-pink-200">
            <h3 className="font-semibold text-lg text-pink-900 mb-4">Style 5: Soft Neon Glow</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0">
                  <svg viewBox="0 0 48 48" className="w-full h-full">
                    <defs>
                      <filter id="mission5-glow1">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <linearGradient id="mission5-1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <path d="M24,8 L36,12 L36,24 C36,32 30,38 24,42 C18,38 12,32 12,24 L12,12 Z" fill="url(#mission5-1)" filter="url(#mission5-glow1)" opacity="0.8" />
                    <path d="M20,23 L22,26 L28,19" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="24" cy="24" r="3" fill="#fff" opacity="0.4" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Keep You Safe</h4>
                  <p className="text-sm text-gray-700">Make safety simple, automatic, and always there when you need it</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0">
                  <svg viewBox="0 0 48 48" className="w-full h-full">
                    <defs>
                      <filter id="mission5-glow2">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <linearGradient id="mission5-2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a78bfa" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                    <circle cx="24" cy="24" r="14" fill="url(#mission5-2)" filter="url(#mission5-glow2)" opacity="0.7" />
                    <circle cx="18" cy="20" r="3" fill="#c4b5fd" filter="url(#mission5-glow2)" />
                    <circle cx="30" cy="20" r="3" fill="#f9a8d4" filter="url(#mission5-glow2)" />
                    <circle cx="24" cy="28" r="3" fill="#fda4af" filter="url(#mission5-glow2)" />
                    <circle cx="24" cy="24" r="2" fill="#fff" opacity="0.6" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Build Community</h4>
                  <p className="text-sm text-gray-700">Create a network of people who look out for each other</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0">
                  <svg viewBox="0 0 48 48" className="w-full h-full">
                    <defs>
                      <filter id="mission5-glow3">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <linearGradient id="mission5-3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <path d="M24,36 C24,36 14,29 14,20 C14,15 17,12 21,12 C23,12 24,13 24,16 C24,13 25,12 27,12 C31,12 34,15 34,20 C34,29 24,36 24,36 Z" fill="url(#mission5-3)" filter="url(#mission5-glow3)" opacity="0.8" />
                    <path d="M24,30 C24,30 19,25 19,20 C19,17 21,15 23,15 C24,15 24,16 24,18 C24,16 24,15 25,15 C27,15 29,17 29,20 C29,25 24,30 24,30 Z" fill="#fff" opacity="0.4" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Stay Free</h4>
                  <p className="text-sm text-gray-700">Keep Besties accessible to everyone, regardless of their ability to pay</p>
                </div>
              </div>
            </div>
          </div>

          {/* Style 7: Soft Geometry */}
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-purple-200">
            <h3 className="font-semibold text-lg text-purple-900 mb-4">Style 7: Soft Geometry</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0">
                  <svg viewBox="0 0 48 48" className="w-full h-full">
                    <defs>
                      <linearGradient id="mission7-1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fda4af" />
                        <stop offset="100%" stopColor="#f43f5e" />
                      </linearGradient>
                    </defs>
                    <rect x="12" y="12" width="24" height="24" rx="4" fill="none" stroke="url(#mission7-1)" strokeWidth="2.5" />
                    <rect x="16" y="16" width="16" height="16" rx="3" fill="url(#mission7-1)" opacity="0.2" />
                    <path d="M20,24 L22,27 L28,20" fill="none" stroke="url(#mission7-1)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="34" y="10" width="4" height="4" rx="1" fill="#fbbf24" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Keep You Safe</h4>
                  <p className="text-sm text-gray-700">Make safety simple, automatic, and always there when you need it</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0">
                  <svg viewBox="0 0 48 48" className="w-full h-full">
                    <defs>
                      <linearGradient id="mission7-2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#c4b5fd" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                    <rect x="14" y="16" width="8" height="8" rx="2" fill="url(#mission7-2)" opacity="0.6" />
                    <rect x="20" y="20" width="10" height="10" rx="2" fill="url(#mission7-2)" opacity="0.8" />
                    <rect x="26" y="16" width="8" height="8" rx="2" fill="url(#mission7-2)" opacity="0.6" />
                    <line x1="22" y1="20" x2="18" y2="16" stroke="url(#mission7-2)" strokeWidth="2" strokeLinecap="round" />
                    <line x1="28" y1="20" x2="30" y2="16" stroke="url(#mission7-2)" strokeWidth="2" strokeLinecap="round" />
                    <rect x="34" y="10" width="4" height="4" rx="1" fill="#fbbf24" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Build Community</h4>
                  <p className="text-sm text-gray-700">Create a network of people who look out for each other</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0">
                  <svg viewBox="0 0 48 48" className="w-full h-full">
                    <defs>
                      <linearGradient id="mission7-3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <path d="M24,12 L16,20 L16,28 C16,32 19,35 24,36 C29,35 32,32 32,28 L32,20 Z" fill="none" stroke="url(#mission7-3)" strokeWidth="2.5" strokeLinejoin="round" />
                    <rect x="20" y="22" width="8" height="8" rx="2" fill="url(#mission7-3)" opacity="0.3" />
                    <rect x="34" y="10" width="4" height="4" rx="1" fill="#fbbf24" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Stay Free</h4>
                  <p className="text-sm text-gray-700">Keep Besties accessible to everyone, regardless of their ability to pay</p>
                </div>
              </div>
            </div>
          </div>

          {/* Style 9: Sketchy & Sweet */}
          <div className="p-6 bg-white rounded-xl border-2 border-rose-200">
            <h3 className="font-semibold text-lg text-rose-900 mb-4">Style 9: Sketchy & Sweet</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0">
                  <svg viewBox="0 0 48 48" className="w-full h-full">
                    <defs>
                      <linearGradient id="mission9-fill1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fce7f3" />
                        <stop offset="100%" stopColor="#fbcfe8" />
                      </linearGradient>
                    </defs>
                    <path d="M24,8 L36,12 L36,24 C36,32 30,38 24,42 C18,38 12,32 12,24 L12,12 Z" fill="url(#mission9-fill1)" stroke="#f472b6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
                    <g stroke="#f472b6" strokeWidth="1.5" opacity="0.4">
                      <line x1="18" y1="20" x2="22" y2="20" strokeLinecap="round" />
                      <line x1="26" y1="20" x2="30" y2="20" strokeLinecap="round" />
                      <line x1="20" y1="26" x2="28" y2="26" strokeLinecap="round" />
                    </g>
                    <path d="M20,24 L22,27 L28,20" fill="none" stroke="#f472b6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="34" y1="12" x2="36" y2="14" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="36" y1="12" x2="34" y2="14" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Keep You Safe</h4>
                  <p className="text-sm text-gray-700">Make safety simple, automatic, and always there when you need it</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0">
                  <svg viewBox="0 0 48 48" className="w-full h-full">
                    <g stroke="#c4b5fd" strokeWidth="3" fill="none" strokeLinecap="round">
                      <circle cx="18" cy="20" r="6" opacity="0.7" />
                      <line x1="18" y1="26" x2="18" y2="34" />
                      <circle cx="30" cy="20" r="6" opacity="0.7" />
                      <line x1="30" y1="26" x2="30" y2="34" />
                      <circle cx="24" cy="26" r="6" opacity="0.7" />
                      <line x1="24" y1="32" x2="24" y2="36" />
                    </g>
                    <path d="M18,32 Q24,30 30,32" fill="none" stroke="#f472b6" strokeWidth="3" strokeLinecap="round" />
                    <line x1="34" y1="12" x2="36" y2="14" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="36" y1="12" x2="34" y2="14" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Build Community</h4>
                  <p className="text-sm text-gray-700">Create a network of people who look out for each other</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0">
                  <svg viewBox="0 0 48 48" className="w-full h-full">
                    <defs>
                      <linearGradient id="mission9-fill3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fce7f3" />
                        <stop offset="100%" stopColor="#fbcfe8" />
                      </linearGradient>
                    </defs>
                    <path d="M24,36 C24,36 14,29 14,20 C14,15 17,12 21,12 C23,12 24,13 24,16 C24,13 25,12 27,12 C31,12 34,15 34,20 C34,29 24,36 24,36 Z" fill="url(#mission9-fill3)" stroke="#f472b6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
                    <g stroke="#f472b6" strokeWidth="1.5" opacity="0.3">
                      <line x1="19" y1="19" x2="22" y2="19" strokeLinecap="round" />
                      <line x1="26" y1="19" x2="29" y2="19" strokeLinecap="round" />
                      <line x1="21" y1="24" x2="27" y2="24" strokeLinecap="round" />
                    </g>
                    <line x1="34" y1="12" x2="36" y2="14" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="36" y1="12" x2="34" y2="14" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Stay Free</h4>
                  <p className="text-sm text-gray-700">Keep Besties accessible to everyone, regardless of their ability to pay</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION REDESIGNS - WHAT MAKES US DIFFERENT */}
        <div className="card p-6 mb-6 bg-gradient-to-br from-purple-50 to-pink-50 border-4 border-purple-300">
          <h2 className="text-2xl font-display text-text-primary mb-6 text-center">What Makes Us Different - 4 Style Variations</h2>

          {/* Style 4: Minimal with Sparkle */}
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-fuchsia-200">
            <h3 className="font-semibold text-lg text-fuchsia-900 mb-4">Style 4: Minimal with Sparkle</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg viewBox="0 0 32 32" className="w-10 h-10">
                    <defs>
                      <linearGradient id="diff4-1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <path d="M16,26 L6,16 C4,14 4,10 6,8 C8,6 12,6 14,8 L16,10 L18,8 C20,6 24,6 26,8 C28,10 28,14 26,16 Z" fill="none" stroke="url(#diff4-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12,14 L20,14" stroke="url(#diff4-1)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
                    <circle cx="24" cy="6" r="1.5" fill="#fbbf24" />
                  </svg>
                  <h4 className="font-semibold text-sm">Good Over Profit</h4>
                </div>
                <p className="text-xs text-gray-700">We're here to keep people safe. Every decision puts your safety first, not our profit margins.</p>
              </div>

              <div className="p-3 bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg viewBox="0 0 32 32" className="w-10 h-10">
                    <defs>
                      <linearGradient id="diff4-2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                    <rect x="11" y="15" width="10" height="10" rx="1.5" fill="none" stroke="url(#diff4-2)" strokeWidth="2" strokeLinecap="round" />
                    <path d="M13,15 L13,11 C13,8.8 14.3,7 16,7 C17.7,7 19,8.8 19,11 L19,15" fill="none" stroke="url(#diff4-2)" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="16" cy="20" r="1.5" fill="#a855f7"/>
                    <circle cx="8" cy="8" r="1" fill="#fbbf24" />
                  </svg>
                  <h4 className="font-semibold text-sm">Privacy First</h4>
                </div>
                <p className="text-xs text-gray-700">Your data is yours. We don't sell it, we don't mine it, and we delete it when you ask.</p>
              </div>

              <div className="p-3 bg-gradient-to-br from-fuchsia-50 to-pink-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg viewBox="0 0 32 32" className="w-10 h-10">
                    <defs>
                      <linearGradient id="diff4-3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#d946ef" />
                        <stop offset="100%" stopColor="#c026d3" />
                      </linearGradient>
                    </defs>
                    <path d="M16,6 L16,26" stroke="url(#diff4-3)" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12,10 L18,10 C20,10 21,11 21,13 C21,15 20,16 18,16 L14,16 C12,16 11,17 11,19 C11,21 12,22 14,22 L20,22" fill="none" stroke="url(#diff4-3)" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="24" cy="12" r="1" fill="#fbbf24" />
                  </svg>
                  <h4 className="font-semibold text-sm">Transparent Pricing</h4>
                </div>
                <p className="text-xs text-gray-700">No hidden fees, no surprises. Most features free forever. Premium costs what it costs to run.</p>
              </div>

              <div className="p-3 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg viewBox="0 0 32 32" className="w-10 h-10">
                    <defs>
                      <linearGradient id="diff4-4" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#c4b5fd" />
                        <stop offset="50%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#fda4af" />
                      </linearGradient>
                    </defs>
                    <line x1="16" y1="16" x2="16" y2="8" stroke="url(#diff4-4)" strokeWidth="1.5" opacity="0.4" />
                    <line x1="16" y1="16" x2="24" y2="12" stroke="url(#diff4-4)" strokeWidth="1.5" opacity="0.4" />
                    <line x1="16" y1="16" x2="24" y2="20" stroke="url(#diff4-4)" strokeWidth="1.5" opacity="0.4" />
                    <line x1="16" y1="16" x2="8" y2="12" stroke="url(#diff4-4)" strokeWidth="1.5" opacity="0.4" />
                    <line x1="16" y1="16" x2="8" y2="20" stroke="url(#diff4-4)" strokeWidth="1.5" opacity="0.4" />
                    <circle cx="16" cy="16" r="3" fill="none" stroke="#f43f5e" strokeWidth="2" />
                    <circle cx="16" cy="8" r="2" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
                    <circle cx="24" cy="12" r="2" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
                    <circle cx="24" cy="20" r="2" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
                    <circle cx="8" cy="12" r="2" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
                    <circle cx="8" cy="20" r="2" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
                    <circle cx="26" cy="26" r="1" fill="#fbbf24" />
                  </svg>
                  <h4 className="font-semibold text-sm">Community Driven</h4>
                </div>
                <p className="text-xs text-gray-700">You're part of the Besties family. We listen, adapt, and build features you actually want.</p>
              </div>
            </div>
          </div>

          {/* Style 5: Soft Neon Glow */}
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-pink-200">
            <h3 className="font-semibold text-lg text-pink-900 mb-4">Style 5: Soft Neon Glow</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg viewBox="0 0 32 32" className="w-10 h-10">
                    <defs>
                      <filter id="diff5-glow1">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <linearGradient id="diff5-1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <path d="M16,26 C16,26 6,20 6,12 C6,8 9,5 12,5 C14,5 15,6 16,8 C17,6 18,5 20,5 C23,5 26,8 26,12 C26,20 16,26 16,26 Z" fill="url(#diff5-1)" filter="url(#diff5-glow1)" opacity="0.8" />
                    <path d="M16,22 C16,22 11,18 11,12 C11,10 12,9 14,9 C15,9 16,10 16,11 C16,10 17,9 18,9 C20,9 21,10 21,12 C21,18 16,22 16,22 Z" fill="#fff" opacity="0.3" />
                  </svg>
                  <h4 className="font-semibold text-sm">Good Over Profit</h4>
                </div>
                <p className="text-xs text-gray-700">We're here to keep people safe. Every decision puts your safety first, not our profit margins.</p>
              </div>

              <div className="p-3 bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg viewBox="0 0 32 32" className="w-10 h-10">
                    <defs>
                      <filter id="diff5-glow2">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <linearGradient id="diff5-2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                    <rect x="11" y="15" width="10" height="10" rx="2" fill="url(#diff5-2)" filter="url(#diff5-glow2)" opacity="0.8" />
                    <path d="M13,15 L13,11 C13,8.8 14.3,7 16,7 C17.7,7 19,8.8 19,11 L19,15" fill="none" stroke="url(#diff5-2)" strokeWidth="2" filter="url(#diff5-glow2)" strokeLinecap="round"/>
                    <circle cx="16" cy="20" r="2" fill="#fff" opacity="0.6" />
                  </svg>
                  <h4 className="font-semibold text-sm">Privacy First</h4>
                </div>
                <p className="text-xs text-gray-700">Your data is yours. We don't sell it, we don't mine it, and we delete it when you ask.</p>
              </div>

              <div className="p-3 bg-gradient-to-br from-fuchsia-50 to-pink-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg viewBox="0 0 32 32" className="w-10 h-10">
                    <defs>
                      <filter id="diff5-glow3">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <linearGradient id="diff5-3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#d946ef" />
                        <stop offset="100%" stopColor="#c026d3" />
                      </linearGradient>
                    </defs>
                    <circle cx="16" cy="16" r="10" fill="url(#diff5-3)" filter="url(#diff5-glow3)" opacity="0.7" />
                    <path d="M16,10 L16,22" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12,13 L18,13 C19,13 20,14 20,15 C20,16 19,17 18,17 L14,17 C13,17 12,18 12,19 C12,20 13,21 14,21 L20,21" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <h4 className="font-semibold text-sm">Transparent Pricing</h4>
                </div>
                <p className="text-xs text-gray-700">No hidden fees, no surprises. Most features free forever. Premium costs what it costs to run.</p>
              </div>

              <div className="p-3 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg viewBox="0 0 32 32" className="w-10 h-10">
                    <defs>
                      <filter id="diff5-glow4">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <linearGradient id="diff5-4" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#e11d48" />
                      </linearGradient>
                    </defs>
                    <circle cx="16" cy="16" r="10" fill="url(#diff5-4)" filter="url(#diff5-glow4)" opacity="0.6" />
                    <circle cx="12" cy="13" r="2" fill="#f9a8d4" filter="url(#diff5-glow4)" />
                    <circle cx="20" cy="13" r="2" fill="#f9a8d4" filter="url(#diff5-glow4)" />
                    <circle cx="16" cy="19" r="2" fill="#f9a8d4" filter="url(#diff5-glow4)" />
                    <circle cx="16" cy="16" r="1.5" fill="#fff" opacity="0.6" />
                  </svg>
                  <h4 className="font-semibold text-sm">Community Driven</h4>
                </div>
                <p className="text-xs text-gray-700">You're part of the Besties family. We listen, adapt, and build features you actually want.</p>
              </div>
            </div>
          </div>

          {/* Style 7: Soft Geometry */}
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-purple-200">
            <h3 className="font-semibold text-lg text-purple-900 mb-4">Style 7: Soft Geometry</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg viewBox="0 0 32 32" className="w-10 h-10">
                    <defs>
                      <linearGradient id="diff7-1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f9a8d4" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <path d="M16,8 L8,16 L8,22 C8,25 11,27 16,28 C21,27 24,25 24,22 L24,16 Z" fill="none" stroke="url(#diff7-1)" strokeWidth="2" strokeLinejoin="round" />
                    <rect x="12" y="15" width="8" height="8" rx="2" fill="url(#diff7-1)" opacity="0.2" />
                    <rect x="28" y="4" width="3" height="3" rx="0.8" fill="#fbbf24" />
                  </svg>
                  <h4 className="font-semibold text-sm">Good Over Profit</h4>
                </div>
                <p className="text-xs text-gray-700">We're here to keep people safe. Every decision puts your safety first, not our profit margins.</p>
              </div>

              <div className="p-3 bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg viewBox="0 0 32 32" className="w-10 h-10">
                    <defs>
                      <linearGradient id="diff7-2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                    <rect x="8" y="12" width="16" height="16" rx="3" fill="none" stroke="url(#diff7-2)" strokeWidth="2" />
                    <rect x="12" y="8" width="8" height="8" rx="2" fill="url(#diff7-2)" opacity="0.3" />
                    <circle cx="16" cy="20" r="2" fill="url(#diff7-2)" />
                    <rect x="28" y="4" width="3" height="3" rx="0.8" fill="#fbbf24" />
                  </svg>
                  <h4 className="font-semibold text-sm">Privacy First</h4>
                </div>
                <p className="text-xs text-gray-700">Your data is yours. We don't sell it, we don't mine it, and we delete it when you ask.</p>
              </div>

              <div className="p-3 bg-gradient-to-br from-fuchsia-50 to-pink-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg viewBox="0 0 32 32" className="w-10 h-10">
                    <defs>
                      <linearGradient id="diff7-3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#d946ef" />
                        <stop offset="100%" stopColor="#c026d3" />
                      </linearGradient>
                    </defs>
                    <rect x="10" y="10" width="12" height="12" rx="2" fill="none" stroke="url(#diff7-3)" strokeWidth="2" />
                    <rect x="14" y="14" width="4" height="4" rx="1" fill="url(#diff7-3)" opacity="0.4" />
                    <line x1="16" y1="10" x2="16" y2="22" stroke="url(#diff7-3)" strokeWidth="1.5" opacity="0.6" />
                    <rect x="28" y="4" width="3" height="3" rx="0.8" fill="#fbbf24" />
                  </svg>
                  <h4 className="font-semibold text-sm">Transparent Pricing</h4>
                </div>
                <p className="text-xs text-gray-700">No hidden fees, no surprises. Most features free forever. Premium costs what it costs to run.</p>
              </div>

              <div className="p-3 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg viewBox="0 0 32 32" className="w-10 h-10">
                    <defs>
                      <linearGradient id="diff7-4" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#e11d48" />
                      </linearGradient>
                    </defs>
                    <rect x="10" y="10" width="6" height="6" rx="1.5" fill="url(#diff7-4)" opacity="0.5" />
                    <rect x="13" y="13" width="8" height="8" rx="1.5" fill="url(#diff7-4)" opacity="0.7" />
                    <rect x="16" y="10" width="6" height="6" rx="1.5" fill="url(#diff7-4)" opacity="0.5" />
                    <rect x="28" y="4" width="3" height="3" rx="0.8" fill="#fbbf24" />
                  </svg>
                  <h4 className="font-semibold text-sm">Community Driven</h4>
                </div>
                <p className="text-xs text-gray-700">You're part of the Besties family. We listen, adapt, and build features you actually want.</p>
              </div>
            </div>
          </div>

          {/* Style 9: Sketchy & Sweet */}
          <div className="p-6 bg-white rounded-xl border-2 border-rose-200">
            <h3 className="font-semibold text-lg text-rose-900 mb-4">Style 9: Sketchy & Sweet</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg viewBox="0 0 32 32" className="w-10 h-10">
                    <defs>
                      <linearGradient id="diff9-fill1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fce7f3" />
                        <stop offset="100%" stopColor="#fbcfe8" />
                      </linearGradient>
                    </defs>
                    <path d="M16,26 C16,26 6,20 6,12 C6,8 9,5 12,5 C14,5 15,6 16,8 C17,6 18,5 20,5 C23,5 26,8 26,12 C26,20 16,26 16,26 Z" fill="url(#diff9-fill1)" stroke="#f472b6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
                    <g stroke="#f472b6" strokeWidth="1.5" opacity="0.3">
                      <line x1="11" y1="12" x2="15" y2="12" strokeLinecap="round" />
                      <line x1="17" y1="12" x2="21" y2="12" strokeLinecap="round" />
                      <line x1="13" y1="16" x2="19" y2="16" strokeLinecap="round" />
                    </g>
                    <line x1="24" y1="6" x2="26" y2="8" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="26" y1="6" x2="24" y2="8" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  <h4 className="font-semibold text-sm">Good Over Profit</h4>
                </div>
                <p className="text-xs text-gray-700">We're here to keep people safe. Every decision puts your safety first, not our profit margins.</p>
              </div>

              <div className="p-3 bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg viewBox="0 0 32 32" className="w-10 h-10">
                    <defs>
                      <linearGradient id="diff9-fill2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#e9d5ff" />
                        <stop offset="100%" stopColor="#d8b4fe" />
                      </linearGradient>
                    </defs>
                    <rect x="11" y="15" width="10" height="10" rx="2" fill="url(#diff9-fill2)" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                    <path d="M13,15 L13,11 C13,8.8 14.3,7 16,7 C17.7,7 19,8.8 19,11 L19,15" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round"/>
                    <g stroke="#a855f7" strokeWidth="1.5" opacity="0.4">
                      <line x1="14" y1="19" x2="18" y2="19" strokeLinecap="round" />
                      <line x1="14" y1="21" x2="18" y2="21" strokeLinecap="round" />
                    </g>
                    <line x1="24" y1="6" x2="26" y2="8" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="26" y1="6" x2="24" y2="8" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  <h4 className="font-semibold text-sm">Privacy First</h4>
                </div>
                <p className="text-xs text-gray-700">Your data is yours. We don't sell it, we don't mine it, and we delete it when you ask.</p>
              </div>

              <div className="p-3 bg-gradient-to-br from-fuchsia-50 to-pink-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg viewBox="0 0 32 32" className="w-10 h-10">
                    <circle cx="16" cy="16" r="12" fill="none" stroke="#d946ef" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
                    <path d="M16,10 L16,22" stroke="#d946ef" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M12,13 L18,13 C19,13 20,14 20,15 C20,16 19,17 18,17 L14,17 C13,17 12,18 12,19 C12,20 13,21 14,21 L20,21" fill="none" stroke="#d946ef" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="24" y1="6" x2="26" y2="8" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="26" y1="6" x2="24" y2="8" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  <h4 className="font-semibold text-sm">Transparent Pricing</h4>
                </div>
                <p className="text-xs text-gray-700">No hidden fees, no surprises. Most features free forever. Premium costs what it costs to run.</p>
              </div>

              <div className="p-3 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg viewBox="0 0 32 32" className="w-10 h-10">
                    <g stroke="#f43f5e" strokeWidth="2.5" fill="none" strokeLinecap="round">
                      <circle cx="12" cy="14" r="5" opacity="0.7" />
                      <line x1="12" y1="19" x2="12" y2="24" />
                      <circle cx="20" cy="14" r="5" opacity="0.7" />
                      <line x1="20" y1="19" x2="20" y2="24" />
                      <circle cx="16" cy="18" r="5" opacity="0.7" />
                      <line x1="16" y1="23" x2="16" y2="26" />
                    </g>
                    <path d="M12,23 Q16,21 20,23" fill="none" stroke="#f472b6" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="24" y1="6" x2="26" y2="8" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="26" y1="6" x2="24" y2="8" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  <h4 className="font-semibold text-sm">Community Driven</h4>
                </div>
                <p className="text-xs text-gray-700">You're part of the Besties family. We listen, adapt, and build features you actually want.</p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION REDESIGNS - WHAT'S COMING NEXT */}
        <div className="card p-6 mb-6 bg-gradient-to-br from-blue-50 to-purple-50 border-4 border-blue-300">
          <h2 className="text-2xl font-display text-text-primary mb-6 text-center">What's Coming Next - 4 Style Variations</h2>

          {/* Style 4: Minimal with Sparkle */}
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-fuchsia-200">
            <h3 className="font-semibold text-lg text-fuchsia-900 mb-4">Style 4: Minimal with Sparkle</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                <svg viewBox="0 0 48 48" className="w-12 h-12">
                  <defs>
                    <linearGradient id="next4-1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>
                  <rect x="16" y="8" width="16" height="28" rx="3" fill="none" stroke="url(#next4-1)" strokeWidth="2" />
                  <rect x="18" y="10" width="12" height="22" rx="1.5" fill="url(#next4-1)" opacity="0.1" />
                  <circle cx="24" cy="34" r="1.5" fill="url(#next4-1)" />
                  <line x1="22" y1="12" x2="26" y2="12" stroke="url(#next4-1)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
                  <circle cx="36" cy="10" r="1.5" fill="#fbbf24" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Native Mobile Apps</h4>
                  <p className="text-xs text-gray-600">iOS & Android with push notifications</p>
                </div>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">In Dev</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg border border-pink-100">
                <svg viewBox="0 0 48 48" className="w-12 h-12">
                  <defs>
                    <linearGradient id="next4-2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f9a8d4" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                  <path d="M32,10 L16,10 C14,10 12,11 12,13 L12,26 C12,28 14,29 16,29 L20,29 L24,34 L28,29 L32,29 C34,29 36,28 36,26 L36,13 C36,11 34,10 32,10 Z" fill="none" stroke="url(#next4-2)" strokeWidth="2" strokeLinejoin="round"/>
                  <circle cx="20" cy="18" r="1.5" fill="url(#next4-2)" />
                  <circle cx="24" cy="18" r="1.5" fill="url(#next4-2)" />
                  <circle cx="28" cy="18" r="1.5" fill="url(#next4-2)" />
                  <circle cx="36" cy="10" r="1.5" fill="#fbbf24" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">WhatsApp & Facebook</h4>
                  <p className="text-xs text-gray-600">Free alerts via messaging apps</p>
                </div>
                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-semibold">Q1 2025</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-fuchsia-50 to-purple-50 rounded-lg border border-fuchsia-100">
                <svg viewBox="0 0 48 48" className="w-12 h-12">
                  <defs>
                    <linearGradient id="next4-3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d946ef" />
                      <stop offset="100%" stopColor="#c026d3" />
                    </linearGradient>
                  </defs>
                  <path d="M24,12 C20,12 16,15 16,19 C16,25 24,34 24,34 C24,34 32,25 32,19 C32,15 28,12 24,12 Z" fill="none" stroke="url(#next4-3)" strokeWidth="2" strokeLinejoin="round"/>
                  <circle cx="24" cy="19" r="3" fill="url(#next4-3)" opacity="0.3" />
                  <circle cx="36" cy="10" r="1.5" fill="#fbbf24" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Live Location Sharing</h4>
                  <p className="text-xs text-gray-600">Real-time location during check-ins</p>
                </div>
                <span className="text-xs bg-fuchsia-100 text-fuchsia-700 px-2 py-1 rounded-full font-semibold">Q2 2025</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg border border-rose-100">
                <svg viewBox="0 0 48 48" className="w-12 h-12">
                  <defs>
                    <linearGradient id="next4-4" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#e11d48" />
                    </linearGradient>
                  </defs>
                  <circle cx="24" cy="24" r="12" fill="none" stroke="url(#next4-4)" strokeWidth="2"/>
                  <path d="M24,16 L24,24" stroke="url(#next4-4)" strokeWidth="2.5" strokeLinecap="round"/>
                  <circle cx="24" cy="28" r="1.5" fill="url(#next4-4)"/>
                  <circle cx="36" cy="10" r="1.5" fill="#fbbf24" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Quick SOS Button</h4>
                  <p className="text-xs text-gray-600">One-tap emergency alerts</p>
                </div>
                <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded-full font-semibold">Planning</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg border border-pink-100">
                <svg viewBox="0 0 48 48" className="w-12 h-12">
                  <defs>
                    <linearGradient id="next4-5" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f9a8d4" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                  <circle cx="24" cy="24" r="12" fill="none" stroke="url(#next4-5)" strokeWidth="2"/>
                  <ellipse cx="24" cy="24" rx="6" ry="12" fill="none" stroke="url(#next4-5)" strokeWidth="1.5" opacity="0.6"/>
                  <path d="M12,24 L36,24" stroke="url(#next4-5)" strokeWidth="1.5" opacity="0.6"/>
                  <circle cx="36" cy="10" r="1.5" fill="#fbbf24" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Global Safety Network</h4>
                  <p className="text-xs text-gray-600">Verified safety resources</p>
                </div>
                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-semibold">2025</span>
              </div>
            </div>
          </div>

          {/* Style 5: Soft Neon Glow */}
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-pink-200">
            <h3 className="font-semibold text-lg text-pink-900 mb-4">Style 5: Soft Neon Glow</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                <svg viewBox="0 0 48 48" className="w-12 h-12">
                  <defs>
                    <filter id="next5-glow1">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    <linearGradient id="next5-1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>
                  <rect x="16" y="8" width="16" height="28" rx="3" fill="url(#next5-1)" filter="url(#next5-glow1)" opacity="0.8" />
                  <rect x="18" y="10" width="12" height="22" rx="1.5" fill="#fff" opacity="0.3" />
                  <circle cx="24" cy="34" r="2" fill="#fff" opacity="0.6" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Native Mobile Apps</h4>
                  <p className="text-xs text-gray-600">iOS & Android with push notifications</p>
                </div>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">In Dev</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg border border-pink-100">
                <svg viewBox="0 0 48 48" className="w-12 h-12">
                  <defs>
                    <filter id="next5-glow2">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    <linearGradient id="next5-2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f9a8d4" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                  <ellipse cx="24" cy="20" rx="12" ry="10" fill="url(#next5-2)" filter="url(#next5-glow2)" opacity="0.8" />
                  <path d="M24,30 L24,30 L20,34 L24,34 L28,34" fill="url(#next5-2)" filter="url(#next5-glow2)" opacity="0.8" />
                  <circle cx="20" cy="18" r="1.5" fill="#fff" />
                  <circle cx="24" cy="18" r="1.5" fill="#fff" />
                  <circle cx="28" cy="18" r="1.5" fill="#fff" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">WhatsApp & Facebook</h4>
                  <p className="text-xs text-gray-600">Free alerts via messaging apps</p>
                </div>
                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-semibold">Q1 2025</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-fuchsia-50 to-purple-50 rounded-lg border border-fuchsia-100">
                <svg viewBox="0 0 48 48" className="w-12 h-12">
                  <defs>
                    <filter id="next5-glow3">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    <linearGradient id="next5-3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d946ef" />
                      <stop offset="100%" stopColor="#c026d3" />
                    </linearGradient>
                  </defs>
                  <path d="M24,12 C20,12 16,15 16,19 C16,25 24,34 24,34 C24,34 32,25 32,19 C32,15 28,12 24,12 Z" fill="url(#next5-3)" filter="url(#next5-glow3)" opacity="0.8" />
                  <circle cx="24" cy="19" r="4" fill="#fff" opacity="0.5" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Live Location Sharing</h4>
                  <p className="text-xs text-gray-600">Real-time location during check-ins</p>
                </div>
                <span className="text-xs bg-fuchsia-100 text-fuchsia-700 px-2 py-1 rounded-full font-semibold">Q2 2025</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg border border-rose-100">
                <svg viewBox="0 0 48 48" className="w-12 h-12">
                  <defs>
                    <filter id="next5-glow4">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    <linearGradient id="next5-4" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#e11d48" />
                    </linearGradient>
                  </defs>
                  <circle cx="24" cy="24" r="12" fill="url(#next5-4)" filter="url(#next5-glow4)" opacity="0.8" />
                  <path d="M24,16 L24,24" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                  <circle cx="24" cy="28" r="2" fill="#fff"/>
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Quick SOS Button</h4>
                  <p className="text-xs text-gray-600">One-tap emergency alerts</p>
                </div>
                <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded-full font-semibold">Planning</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg border border-pink-100">
                <svg viewBox="0 0 48 48" className="w-12 h-12">
                  <defs>
                    <filter id="next5-glow5">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    <linearGradient id="next5-5" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f9a8d4" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                  <circle cx="24" cy="24" r="12" fill="url(#next5-5)" filter="url(#next5-glow5)" opacity="0.8" />
                  <ellipse cx="24" cy="24" rx="6" ry="12" fill="none" stroke="#fff" strokeWidth="1.5"/>
                  <path d="M12,24 L36,24" stroke="#fff" strokeWidth="1.5"/>
                  <circle cx="24" cy="24" r="3" fill="#fff" opacity="0.6" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Global Safety Network</h4>
                  <p className="text-xs text-gray-600">Verified safety resources</p>
                </div>
                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-semibold">2025</span>
              </div>
            </div>
          </div>

          {/* Style 7: Soft Geometry */}
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-purple-200">
            <h3 className="font-semibold text-lg text-purple-900 mb-4">Style 7: Soft Geometry</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                <svg viewBox="0 0 48 48" className="w-12 h-12">
                  <defs>
                    <linearGradient id="next7-1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>
                  <rect x="16" y="8" width="16" height="28" rx="4" fill="none" stroke="url(#next7-1)" strokeWidth="2" />
                  <rect x="18" y="10" width="12" height="22" rx="2" fill="url(#next7-1)" opacity="0.2" />
                  <rect x="22" y="33" width="4" height="2" rx="1" fill="url(#next7-1)" />
                  <rect x="36" y="8" width="4" height="4" rx="1" fill="#fbbf24" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Native Mobile Apps</h4>
                  <p className="text-xs text-gray-600">iOS & Android with push notifications</p>
                </div>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">In Dev</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg border border-pink-100">
                <svg viewBox="0 0 48 48" className="w-12 h-12">
                  <defs>
                    <linearGradient id="next7-2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f9a8d4" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                  <rect x="12" y="14" width="24" height="16" rx="3" fill="none" stroke="url(#next7-2)" strokeWidth="2" />
                  <rect x="16" y="18" width="16" height="8" rx="2" fill="url(#next7-2)" opacity="0.2" />
                  <path d="M24,30 L20,34 L28,34 Z" fill="url(#next7-2)" opacity="0.5" />
                  <rect x="36" y="8" width="4" height="4" rx="1" fill="#fbbf24" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">WhatsApp & Facebook</h4>
                  <p className="text-xs text-gray-600">Free alerts via messaging apps</p>
                </div>
                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-semibold">Q1 2025</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-fuchsia-50 to-purple-50 rounded-lg border border-fuchsia-100">
                <svg viewBox="0 0 48 48" className="w-12 h-12">
                  <defs>
                    <linearGradient id="next7-3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d946ef" />
                      <stop offset="100%" stopColor="#c026d3" />
                    </linearGradient>
                  </defs>
                  <path d="M24,14 L18,18 L18,24 C18,28 20,31 24,32 C28,31 30,28 30,24 L30,18 Z" fill="none" stroke="url(#next7-3)" strokeWidth="2" strokeLinejoin="round" />
                  <rect x="21" y="20" width="6" height="6" rx="1.5" fill="url(#next7-3)" opacity="0.3" />
                  <rect x="36" y="8" width="4" height="4" rx="1" fill="#fbbf24" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Live Location Sharing</h4>
                  <p className="text-xs text-gray-600">Real-time location during check-ins</p>
                </div>
                <span className="text-xs bg-fuchsia-100 text-fuchsia-700 px-2 py-1 rounded-full font-semibold">Q2 2025</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg border border-rose-100">
                <svg viewBox="0 0 48 48" className="w-12 h-12">
                  <defs>
                    <linearGradient id="next7-4" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#e11d48" />
                    </linearGradient>
                  </defs>
                  <rect x="14" y="14" width="20" height="20" rx="10" fill="none" stroke="url(#next7-4)" strokeWidth="2"/>
                  <rect x="22" y="18" width="4" height="8" rx="1" fill="url(#next7-4)"/>
                  <rect x="22" y="28" width="4" height="4" rx="1" fill="url(#next7-4)"/>
                  <rect x="36" y="8" width="4" height="4" rx="1" fill="#fbbf24" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Quick SOS Button</h4>
                  <p className="text-xs text-gray-600">One-tap emergency alerts</p>
                </div>
                <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded-full font-semibold">Planning</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg border border-pink-100">
                <svg viewBox="0 0 48 48" className="w-12 h-12">
                  <defs>
                    <linearGradient id="next7-5" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f9a8d4" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                  <rect x="14" y="14" width="20" height="20" rx="10" fill="none" stroke="url(#next7-5)" strokeWidth="2"/>
                  <rect x="22" y="16" width="4" height="16" rx="1" fill="url(#next7-5)" opacity="0.3"/>
                  <rect x="16" y="22" width="16" height="4" rx="1" fill="url(#next7-5)" opacity="0.3"/>
                  <rect x="36" y="8" width="4" height="4" rx="1" fill="#fbbf24" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Global Safety Network</h4>
                  <p className="text-xs text-gray-600">Verified safety resources</p>
                </div>
                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-semibold">2025</span>
              </div>
            </div>
          </div>

          {/* Style 9: Sketchy & Sweet */}
          <div className="p-6 bg-white rounded-xl border-2 border-rose-200">
            <h3 className="font-semibold text-lg text-rose-900 mb-4">Style 9: Sketchy & Sweet</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                <svg viewBox="0 0 48 48" className="w-12 h-12">
                  <defs>
                    <linearGradient id="next9-fill1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e9d5ff" />
                      <stop offset="100%" stopColor="#d8b4fe" />
                    </linearGradient>
                  </defs>
                  <rect x="16" y="8" width="16" height="28" rx="3" fill="url(#next9-fill1)" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                  <g stroke="#a855f7" strokeWidth="1.5" opacity="0.4">
                    <line x1="20" y1="14" x2="28" y2="14" strokeLinecap="round" />
                    <line x1="20" y1="18" x2="28" y2="18" strokeLinecap="round" />
                    <line x1="20" y1="22" x2="28" y2="22" strokeLinecap="round" />
                  </g>
                  <circle cx="24" cy="34" r="2" fill="#a855f7" />
                  <line x1="34" y1="10" x2="36" y2="12" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="36" y1="10" x2="34" y2="12" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Native Mobile Apps</h4>
                  <p className="text-xs text-gray-600">iOS & Android with push notifications</p>
                </div>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">In Dev</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg border border-pink-100">
                <svg viewBox="0 0 48 48" className="w-12 h-12">
                  <defs>
                    <linearGradient id="next9-fill2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fce7f3" />
                      <stop offset="100%" stopColor="#fbcfe8" />
                    </linearGradient>
                  </defs>
                  <path d="M32,14 L16,14 C14,14 12,15 12,17 L12,28 C12,30 14,31 16,31 L20,31 L24,35 L28,31 L32,31 C34,31 36,30 36,28 L36,17 C36,15 34,14 32,14 Z" fill="url(#next9-fill2)" stroke="#f472b6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
                  <g stroke="#f472b6" strokeWidth="1.5" opacity="0.5">
                    <circle cx="20" cy="22" r="1.5" />
                    <circle cx="24" cy="22" r="1.5" />
                    <circle cx="28" cy="22" r="1.5" />
                  </g>
                  <line x1="34" y1="10" x2="36" y2="12" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="36" y1="10" x2="34" y2="12" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">WhatsApp & Facebook</h4>
                  <p className="text-xs text-gray-600">Free alerts via messaging apps</p>
                </div>
                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-semibold">Q1 2025</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-fuchsia-50 to-purple-50 rounded-lg border border-fuchsia-100">
                <svg viewBox="0 0 48 48" className="w-12 h-12">
                  <defs>
                    <linearGradient id="next9-fill3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fae8ff" />
                      <stop offset="100%" stopColor="#f5d0fe" />
                    </linearGradient>
                  </defs>
                  <path d="M24,14 C20,14 16,17 16,21 C16,27 24,35 24,35 C24,35 32,27 32,21 C32,17 28,14 24,14 Z" fill="url(#next9-fill3)" stroke="#d946ef" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
                  <circle cx="24" cy="21" r="3" fill="none" stroke="#d946ef" strokeWidth="2" />
                  <line x1="34" y1="10" x2="36" y2="12" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="36" y1="10" x2="34" y2="12" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Live Location Sharing</h4>
                  <p className="text-xs text-gray-600">Real-time location during check-ins</p>
                </div>
                <span className="text-xs bg-fuchsia-100 text-fuchsia-700 px-2 py-1 rounded-full font-semibold">Q2 2025</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg border border-rose-100">
                <svg viewBox="0 0 48 48" className="w-12 h-12">
                  <circle cx="24" cy="24" r="12" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
                  <path d="M24,16 L24,24" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round"/>
                  <circle cx="24" cy="28" r="2" fill="#f43f5e"/>
                  <g stroke="#f43f5e" strokeWidth="1.5" opacity="0.3">
                    <line x1="18" y1="20" x2="16" y2="18" strokeLinecap="round" />
                    <line x1="30" y1="20" x2="32" y2="18" strokeLinecap="round" />
                  </g>
                  <line x1="34" y1="10" x2="36" y2="12" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="36" y1="10" x2="34" y2="12" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Quick SOS Button</h4>
                  <p className="text-xs text-gray-600">One-tap emergency alerts</p>
                </div>
                <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded-full font-semibold">Planning</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg border border-pink-100">
                <svg viewBox="0 0 48 48" className="w-12 h-12">
                  <circle cx="24" cy="24" r="12" fill="none" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" />
                  <ellipse cx="24" cy="24" rx="6" ry="12" fill="none" stroke="#ec4899" strokeWidth="2" opacity="0.6"/>
                  <path d="M12,24 L36,24" stroke="#ec4899" strokeWidth="2" opacity="0.6"/>
                  <g stroke="#ec4899" strokeWidth="1.5" opacity="0.4">
                    <line x1="18" y1="18" x2="16" y2="16" strokeLinecap="round" />
                    <line x1="30" y1="18" x2="32" y2="16" strokeLinecap="round" />
                  </g>
                  <line x1="34" y1="10" x2="36" y2="12" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="36" y1="10" x2="34" y2="12" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Global Safety Network</h4>
                  <p className="text-xs text-gray-600">Verified safety resources</p>
                </div>
                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-semibold">2025</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION REDESIGNS - OTHER WAYS TO HELP */}
        <div className="card p-6 mb-6 bg-gradient-to-br from-green-50 to-blue-50 border-4 border-green-300">
          <h2 className="text-2xl font-display text-text-primary mb-6 text-center">Other Ways to Help - 4 Style Variations</h2>

          {/* Style 4: Minimal with Sparkle */}
          <div className="mb-12 p-6 bg-white rounded-2xl shadow-lg border-2 border-pink-200">
            <h3 className="text-xl font-semibold text-pink-900 mb-6 text-center">Style 4: Minimal with Sparkle</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Spread the Word */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <linearGradient id="megaphone-gradient-4" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#1D4ED8', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                    {/* Megaphone */}
                    <path d="M30 35 L70 25 L70 75 L30 65 Z" fill="url(#megaphone-gradient-4)" stroke="#1E3A8A" strokeWidth="2"/>
                    <ellipse cx="30" cy="50" rx="8" ry="15" fill="url(#megaphone-gradient-4)" stroke="#1E3A8A" strokeWidth="2"/>
                    {/* Sound waves */}
                    <path d="M75 35 Q80 35 80 40" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M75 50 Q85 50 85 50" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M75 65 Q80 65 80 60" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
                    {/* Sparkle */}
                    <path d="M85 30 L86 35 L91 36 L86 37 L85 42 L84 37 L79 36 L84 35 Z" fill="#FCD34D"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-blue-900 mb-2 text-center">Spread the Word</h3>
                <p className="text-sm text-blue-800 text-center">Tell your friends! Every person who joins makes our community stronger and safer.</p>
              </div>

              {/* Share Ideas */}
              <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <linearGradient id="lightbulb-gradient-4" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#10B981', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                    {/* Bulb */}
                    <circle cx="50" cy="35" r="18" fill="url(#lightbulb-gradient-4)" stroke="#065F46" strokeWidth="2"/>
                    {/* Base */}
                    <rect x="44" y="53" width="12" height="8" rx="2" fill="#9CA3AF" stroke="#4B5563" strokeWidth="1.5"/>
                    <rect x="42" y="61" width="16" height="6" rx="2" fill="#6B7280" stroke="#374151" strokeWidth="1.5"/>
                    {/* Light rays */}
                    <line x1="50" y1="10" x2="50" y2="15" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="25" y1="20" x2="29" y2="24" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="75" y1="20" x2="71" y2="24" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
                    {/* Sparkle */}
                    <path d="M20 50 L21 55 L26 56 L21 57 L20 62 L19 57 L14 56 L19 55 Z" fill="#FCD34D"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-green-900 mb-2 text-center">Share Ideas</h3>
                <p className="text-sm text-green-800 text-center">Got a feature idea? Found a bug? Your feedback makes Besties better for everyone.</p>
              </div>

              {/* Leave a Review */}
              <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <linearGradient id="star-gradient-4" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#A855F7', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#7C3AED', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                    {/* Star */}
                    <path d="M50 15 L58 40 L85 40 L63 55 L71 80 L50 65 L29 80 L37 55 L15 40 L42 40 Z"
                          fill="url(#star-gradient-4)" stroke="#5B21B6" strokeWidth="2"/>
                    {/* Inner lines */}
                    <line x1="50" y1="30" x2="50" y2="60" stroke="#DDD6FE" strokeWidth="1.5"/>
                    <line x1="35" y1="45" x2="65" y2="45" stroke="#DDD6FE" strokeWidth="1.5"/>
                    {/* Sparkle */}
                    <path d="M80 20 L81 25 L86 26 L81 27 L80 32 L79 27 L74 26 L79 25 Z" fill="#FCD34D"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-purple-900 mb-2 text-center">Leave a Review</h3>
                <p className="text-sm text-purple-800 text-center">Reviews help others discover Besties and know it's legit.</p>
              </div>

              {/* Use the App */}
              <div className="p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <linearGradient id="app-gradient-4" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#EC4899', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#BE185D', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                    {/* Phone outline */}
                    <rect x="30" y="15" width="40" height="70" rx="6" fill="url(#app-gradient-4)" stroke="#831843" strokeWidth="2"/>
                    {/* Screen */}
                    <rect x="35" y="22" width="30" height="50" rx="2" fill="#FCE7F3"/>
                    {/* Home button */}
                    <circle cx="50" cy="78" r="3" fill="#FCE7F3"/>
                    {/* Heart on screen */}
                    <path d="M50 38 L45 33 Q42 30 42 27 Q42 24 44 24 Q47 24 50 27 Q53 24 56 24 Q58 24 58 27 Q58 30 55 33 Z" fill="#EC4899"/>
                    {/* Sparkle */}
                    <path d="M75 30 L76 35 L81 36 L76 37 L75 42 L74 37 L69 36 L74 35 Z" fill="#FCD34D"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-pink-900 mb-2 text-center">Use the App</h3>
                <p className="text-sm text-pink-800 text-center">Check in regularly, add your besties, and stay safe. That's what we're here for.</p>
              </div>
            </div>
          </div>

          {/* Style 5: Soft Neon Glow */}
          <div className="mb-12 p-6 bg-white rounded-2xl shadow-lg border-2 border-purple-200">
            <h3 className="text-xl font-semibold text-purple-900 mb-6 text-center">Style 5: Soft Neon Glow</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Spread the Word */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <filter id="glow-megaphone-5">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <radialGradient id="megaphone-glow-5">
                        <stop offset="0%" style={{ stopColor: '#60A5FA', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 0.8 }} />
                      </radialGradient>
                    </defs>
                    {/* Megaphone with glow */}
                    <path d="M30 35 L70 25 L70 75 L30 65 Z" fill="url(#megaphone-glow-5)" filter="url(#glow-megaphone-5)"/>
                    <ellipse cx="30" cy="50" rx="8" ry="15" fill="url(#megaphone-glow-5)" filter="url(#glow-megaphone-5)"/>
                    {/* Glowing sound waves */}
                    <circle cx="78" cy="38" r="2" fill="#60A5FA" filter="url(#glow-megaphone-5)"/>
                    <circle cx="85" cy="50" r="2" fill="#60A5FA" filter="url(#glow-megaphone-5)"/>
                    <circle cx="78" cy="62" r="2" fill="#60A5FA" filter="url(#glow-megaphone-5)"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-blue-900 mb-2 text-center">Spread the Word</h3>
                <p className="text-sm text-blue-800 text-center">Tell your friends! Every person who joins makes our community stronger and safer.</p>
              </div>

              {/* Share Ideas */}
              <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <filter id="glow-bulb-5">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <radialGradient id="bulb-glow-5">
                        <stop offset="0%" style={{ stopColor: '#34D399', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#10B981', stopOpacity: 0.8 }} />
                      </radialGradient>
                    </defs>
                    {/* Glowing bulb */}
                    <circle cx="50" cy="35" r="18" fill="url(#bulb-glow-5)" filter="url(#glow-bulb-5)"/>
                    <rect x="44" y="53" width="12" height="8" rx="2" fill="#9CA3AF"/>
                    <rect x="42" y="61" width="16" height="6" rx="2" fill="#6B7280"/>
                    {/* Glowing rays */}
                    <circle cx="50" cy="12" r="2" fill="#34D399" filter="url(#glow-bulb-5)"/>
                    <circle cx="27" cy="22" r="2" fill="#34D399" filter="url(#glow-bulb-5)"/>
                    <circle cx="73" cy="22" r="2" fill="#34D399" filter="url(#glow-bulb-5)"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-green-900 mb-2 text-center">Share Ideas</h3>
                <p className="text-sm text-green-800 text-center">Got a feature idea? Found a bug? Your feedback makes Besties better for everyone.</p>
              </div>

              {/* Leave a Review */}
              <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <filter id="glow-star-5">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <radialGradient id="star-glow-5">
                        <stop offset="0%" style={{ stopColor: '#C084FC', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#A855F7', stopOpacity: 0.8 }} />
                      </radialGradient>
                    </defs>
                    {/* Glowing star */}
                    <path d="M50 15 L58 40 L85 40 L63 55 L71 80 L50 65 L29 80 L37 55 L15 40 L42 40 Z"
                          fill="url(#star-glow-5)" filter="url(#glow-star-5)"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-purple-900 mb-2 text-center">Leave a Review</h3>
                <p className="text-sm text-purple-800 text-center">Reviews help others discover Besties and know it's legit.</p>
              </div>

              {/* Use the App */}
              <div className="p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <filter id="glow-app-5">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <radialGradient id="app-glow-5">
                        <stop offset="0%" style={{ stopColor: '#F472B6', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#EC4899', stopOpacity: 0.8 }} />
                      </radialGradient>
                    </defs>
                    {/* Glowing phone */}
                    <rect x="30" y="15" width="40" height="70" rx="6" fill="url(#app-glow-5)" filter="url(#glow-app-5)"/>
                    <rect x="35" y="22" width="30" height="50" rx="2" fill="#FCE7F3"/>
                    <circle cx="50" cy="78" r="3" fill="#FCE7F3"/>
                    {/* Glowing heart */}
                    <path d="M50 38 L45 33 Q42 30 42 27 Q42 24 44 24 Q47 24 50 27 Q53 24 56 24 Q58 24 58 27 Q58 30 55 33 Z"
                          fill="#F472B6" filter="url(#glow-app-5)"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-pink-900 mb-2 text-center">Use the App</h3>
                <p className="text-sm text-pink-800 text-center">Check in regularly, add your besties, and stay safe. That's what we're here for.</p>
              </div>
            </div>
          </div>

          {/* Style 7: Soft Geometry */}
          <div className="mb-12 p-6 bg-white rounded-2xl shadow-lg border-2 border-blue-200">
            <h3 className="text-xl font-semibold text-blue-900 mb-6 text-center">Style 7: Soft Geometry</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Spread the Word */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <linearGradient id="megaphone-geo-7" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#60A5FA', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                    {/* Geometric megaphone */}
                    <rect x="25" y="35" width="20" height="30" rx="4" fill="url(#megaphone-geo-7)"/>
                    <rect x="45" y="30" width="30" height="40" rx="4" fill="url(#megaphone-geo-7)"/>
                    {/* Sound circles */}
                    <circle cx="82" cy="38" r="4" fill="#3B82F6" opacity="0.7"/>
                    <circle cx="88" cy="50" r="4" fill="#3B82F6" opacity="0.5"/>
                    <circle cx="82" cy="62" r="4" fill="#3B82F6" opacity="0.7"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-blue-900 mb-2 text-center">Spread the Word</h3>
                <p className="text-sm text-blue-800 text-center">Tell your friends! Every person who joins makes our community stronger and safer.</p>
              </div>

              {/* Share Ideas */}
              <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <linearGradient id="bulb-geo-7" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#34D399', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#10B981', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                    {/* Geometric bulb */}
                    <circle cx="50" cy="35" r="18" fill="url(#bulb-geo-7)"/>
                    <rect x="44" y="53" width="12" height="8" rx="2" fill="#9CA3AF"/>
                    <rect x="42" y="61" width="16" height="6" rx="2" fill="#6B7280"/>
                    {/* Light rays as rounded rects */}
                    <rect x="48" y="8" width="4" height="8" rx="2" fill="#34D399"/>
                    <rect x="23" y="18" width="8" height="4" rx="2" fill="#34D399"/>
                    <rect x="69" y="18" width="8" height="4" rx="2" fill="#34D399"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-green-900 mb-2 text-center">Share Ideas</h3>
                <p className="text-sm text-green-800 text-center">Got a feature idea? Found a bug? Your feedback makes Besties better for everyone.</p>
              </div>

              {/* Leave a Review */}
              <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <linearGradient id="star-geo-7" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#C084FC', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#A855F7', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                    {/* Geometric star (octagon) */}
                    <path d="M50 20 L65 30 L70 45 L65 60 L50 70 L35 60 L30 45 L35 30 Z"
                          fill="url(#star-geo-7)"/>
                    {/* Inner circle */}
                    <circle cx="50" cy="45" r="12" fill="#DDD6FE"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-purple-900 mb-2 text-center">Leave a Review</h3>
                <p className="text-sm text-purple-800 text-center">Reviews help others discover Besties and know it's legit.</p>
              </div>

              {/* Use the App */}
              <div className="p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <linearGradient id="app-geo-7" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#F472B6', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#EC4899', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                    {/* Geometric phone */}
                    <rect x="30" y="15" width="40" height="70" rx="8" fill="url(#app-geo-7)"/>
                    <rect x="35" y="22" width="30" height="50" rx="4" fill="#FCE7F3"/>
                    <circle cx="50" cy="78" r="3" fill="#FCE7F3"/>
                    {/* Geometric heart */}
                    <rect x="43" y="35" width="8" height="8" rx="4" fill="#EC4899" transform="rotate(45 47 39)"/>
                    <rect x="49" y="35" width="8" height="8" rx="4" fill="#EC4899" transform="rotate(45 53 39)"/>
                    <rect x="46" y="40" width="8" height="12" rx="2" fill="#EC4899"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-pink-900 mb-2 text-center">Use the App</h3>
                <p className="text-sm text-pink-800 text-center">Check in regularly, add your besties, and stay safe. That's what we're here for.</p>
              </div>
            </div>
          </div>

          {/* Style 9: Sketchy & Sweet */}
          <div className="mb-12 p-6 bg-white rounded-2xl shadow-lg border-2 border-green-200">
            <h3 className="text-xl font-semibold text-green-900 mb-6 text-center">Style 9: Sketchy & Sweet</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Spread the Word */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Sketchy megaphone */}
                    <path d="M30 35 L70 25 L70.5 26 L71 75 L70.5 74 L30 65 L30.5 64 Z"
                          fill="#93C5FD" stroke="#1E3A8A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <ellipse cx="30" cy="50" rx="8" ry="15" fill="#93C5FD" stroke="#1E3A8A" strokeWidth="2.5"/>
                    {/* Sketchy detail lines */}
                    <line x1="35" y1="40" x2="65" y2="35" stroke="#1E3A8A" strokeWidth="1.5" opacity="0.5"/>
                    <line x1="35" y1="50" x2="65" y2="50" stroke="#1E3A8A" strokeWidth="1.5" opacity="0.5"/>
                    <line x1="35" y1="60" x2="65" y2="65" stroke="#1E3A8A" strokeWidth="1.5" opacity="0.5"/>
                    {/* Sketchy sound waves */}
                    <path d="M75 35 Q76 35 78 37 Q79 38 80 40" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round"/>
                    <path d="M75 50 Q80 50 85 50" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round"/>
                    <path d="M75 65 Q76 65 78 63 Q79 62 80 60" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-blue-900 mb-2 text-center">Spread the Word</h3>
                <p className="text-sm text-blue-800 text-center">Tell your friends! Every person who joins makes our community stronger and safer.</p>
              </div>

              {/* Share Ideas */}
              <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Sketchy bulb */}
                    <path d="M50 17 Q35 17 35 35 Q35 45 42 50 L42 53 L58 53 L58 50 Q65 45 65 35 Q65 17 50 17 Z"
                          fill="#6EE7B7" stroke="#065F46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    {/* Sketchy base */}
                    <rect x="44" y="53" width="12" height="8" rx="2" fill="#9CA3AF" stroke="#4B5563" strokeWidth="2"/>
                    <rect x="42" y="61" width="16" height="6" rx="2" fill="#6B7280" stroke="#374151" strokeWidth="2"/>
                    {/* Sketchy rays */}
                    <line x1="50" y1="8" x2="50" y2="14" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"/>
                    <line x1="24" y1="20" x2="30" y2="26" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"/>
                    <line x1="76" y1="20" x2="70" y2="26" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"/>
                    {/* Inner sketch lines */}
                    <line x1="45" y1="30" x2="47" y2="40" stroke="#065F46" strokeWidth="1" opacity="0.4"/>
                    <line x1="55" y1="30" x2="53" y2="40" stroke="#065F46" strokeWidth="1" opacity="0.4"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-green-900 mb-2 text-center">Share Ideas</h3>
                <p className="text-sm text-green-800 text-center">Got a feature idea? Found a bug? Your feedback makes Besties better for everyone.</p>
              </div>

              {/* Leave a Review */}
              <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Sketchy star */}
                    <path d="M50 15 L52 16 L58 40 L59 41 L85 40 L84 42 L63 55 L64 56 L71 80 L70 81 L50 65 L49 66 L29 80 L28 79 L37 55 L36 54 L15 40 L16 39 L42 40 L43 39 Z"
                          fill="#DDA0DD" stroke="#5B21B6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    {/* Sketchy inner details */}
                    <line x1="50" y1="30" x2="51" y2="55" stroke="#5B21B6" strokeWidth="1.5" opacity="0.4"/>
                    <line x1="40" y1="42" x2="60" y2="43" stroke="#5B21B6" strokeWidth="1.5" opacity="0.4"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-purple-900 mb-2 text-center">Leave a Review</h3>
                <p className="text-sm text-purple-800 text-center">Reviews help others discover Besties and know it's legit.</p>
              </div>

              {/* Use the App */}
              <div className="p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Sketchy phone */}
                    <path d="M30 15 Q30 14 31 15 L69 15 Q70 15 70 16 L70 84 Q70 85 69 85 L31 85 Q30 85 30 84 Z"
                          fill="#FBCFE8" stroke="#831843" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    {/* Screen */}
                    <rect x="35" y="22" width="30" height="50" rx="2" fill="white" stroke="#831843" strokeWidth="1.5"/>
                    {/* Home button sketch */}
                    <circle cx="50" cy="78" r="3" fill="white" stroke="#831843" strokeWidth="1.5"/>
                    {/* Sketchy heart on screen */}
                    <path d="M50 38 L46 34 Q44 32 44 29 Q44 27 45 26 Q46 25 48 26 Q49 27 50 28 Q51 27 52 26 Q54 25 55 26 Q56 27 56 29 Q56 32 54 34 Z"
                          fill="#F472B6" stroke="#831843" strokeWidth="1.5"/>
                    {/* Texture lines */}
                    <line x1="32" y1="25" x2="32" y2="80" stroke="#831843" strokeWidth="1" opacity="0.3"/>
                    <line x1="68" y1="25" x2="68" y2="80" stroke="#831843" strokeWidth="1" opacity="0.3"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-pink-900 mb-2 text-center">Use the App</h3>
                <p className="text-sm text-pink-800 text-center">Check in regularly, add your besties, and stay safe. That's what we're here for.</p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION REDESIGNS - OUR STORY */}
        <div className="card p-6 mb-6 bg-gradient-to-br from-pink-50 to-purple-50 border-4 border-pink-300">
          <h2 className="text-2xl font-display text-text-primary mb-6 text-center">Our Story - Beautiful Layout Variations</h2>

          {/* Design 1: Gradient Card with Large Quote */}
          <div className="mb-12 p-8 bg-gradient-to-br from-fuchsia-100 via-pink-100 to-purple-100 rounded-3xl shadow-2xl border border-pink-200">
            <div className="text-center mb-8">
              <div className="inline-block">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-2">
                  Our Story
                </h3>
                <div className="h-1 bg-gradient-to-r from-pink-400 via-purple-400 to-fuchsia-400 rounded-full"></div>
              </div>
            </div>

            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="relative pl-6 border-l-4 border-pink-400">
                <p className="text-lg text-gray-700 leading-relaxed">
                  Besties was born from a simple truth: <span className="font-bold text-pink-600">everyone deserves to feel safe</span>, especially when they're out there living their life.
                </p>
              </div>

              <div className="relative pl-6 border-l-4 border-purple-400">
                <p className="text-lg text-gray-700 leading-relaxed">
                  We've all been there - walking home alone at night, going on a first date, traveling somewhere new, or just wanting someone to know you made it home okay. Those moments when you wish your best friend could be right there with you, even when they can't.
                </p>
              </div>

              <div className="text-center mt-8 p-6 bg-white/60 rounded-2xl backdrop-blur-sm">
                <p className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  That's why we built Besties.
                </p>
              </div>
            </div>
          </div>

          {/* Design 2: Split Panel Design */}
          <div className="mb-12 overflow-hidden rounded-3xl shadow-2xl">
            <div className="grid md:grid-cols-2">
              {/* Left Panel - Title */}
              <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-fuchsia-500 p-12 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-5xl font-black text-white mb-4 drop-shadow-lg">Our Story</h3>
                  <div className="w-24 h-1 bg-white mx-auto rounded-full"></div>
                  <div className="mt-6 space-y-2">
                    <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <div className="w-8 h-8 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Content */}
              <div className="bg-white p-12">
                <div className="space-y-6 text-gray-700">
                  <p className="text-base leading-relaxed">
                    Besties was born from a simple truth: <span className="font-bold text-pink-600">everyone deserves to feel safe</span>, especially when they're out there living their life.
                  </p>

                  <p className="text-base leading-relaxed">
                    We've all been there - walking home alone at night, going on a first date, traveling somewhere new, or just wanting someone to know you made it home okay. Those moments when you wish your best friend could be right there with you, even when they can't.
                  </p>

                  <div className="pt-4 border-t-2 border-pink-200">
                    <p className="text-xl font-bold text-purple-600">
                      That's why we built Besties.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Design 3: Card Stack Design */}
          <div className="mb-12 relative">
            {/* Background decorative cards */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full max-w-4xl h-64 bg-gradient-to-br from-purple-200 to-pink-200 rounded-3xl transform rotate-2 opacity-30"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full max-w-4xl h-64 bg-gradient-to-br from-pink-200 to-fuchsia-200 rounded-3xl transform -rotate-1 opacity-50"></div>
            </div>

            {/* Main card */}
            <div className="relative bg-white p-10 rounded-3xl shadow-2xl max-w-4xl mx-auto">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-3 rounded-full shadow-lg">
                  <h3 className="text-2xl font-bold">Our Story</h3>
                </div>
              </div>

              <div className="mt-8 space-y-6 text-gray-700">
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-2xl">
                  <p className="text-lg leading-relaxed">
                    Besties was born from a simple truth: <span className="font-bold text-pink-600">everyone deserves to feel safe</span>, especially when they're out there living their life.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 p-6 rounded-2xl">
                  <p className="text-lg leading-relaxed">
                    We've all been there - walking home alone at night, going on a first date, traveling somewhere new, or just wanting someone to know you made it home okay. Those moments when you wish your best friend could be right there with you, even when they can't.
                  </p>
                </div>

                <div className="text-center bg-gradient-to-r from-pink-500 to-purple-500 p-6 rounded-2xl">
                  <p className="text-2xl font-bold text-white">
                    That's why we built Besties.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Design 4: Timeline Style */}
          <div className="mb-12 p-8 bg-white rounded-3xl shadow-2xl">
            <div className="text-center mb-10">
              <h3 className="text-4xl font-black bg-gradient-to-r from-pink-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent inline-block">
                Our Story
              </h3>
            </div>

            <div className="max-w-3xl mx-auto">
              {/* Timeline item 1 */}
              <div className="flex gap-6 mb-8">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow-lg flex-shrink-0">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                  <div className="w-1 h-full bg-gradient-to-b from-pink-400 to-purple-400 flex-grow mt-2"></div>
                </div>
                <div className="flex-grow pb-8">
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-2xl shadow-md">
                    <p className="text-gray-700 leading-relaxed">
                      Besties was born from a simple truth: <span className="font-bold text-pink-600">everyone deserves to feel safe</span>, especially when they're out there living their life.
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline item 2 */}
              <div className="flex gap-6 mb-8">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                  <div className="w-1 h-full bg-gradient-to-b from-purple-400 to-fuchsia-400 flex-grow mt-2"></div>
                </div>
                <div className="flex-grow pb-8">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl shadow-md">
                    <p className="text-gray-700 leading-relaxed">
                      We've all been there - walking home alone at night, going on a first date, traveling somewhere new, or just wanting someone to know you made it home okay. Those moments when you wish your best friend could be right there with you, even when they can't.
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline item 3 */}
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fuchsia-400 to-fuchsia-600 flex items-center justify-center shadow-lg flex-shrink-0">
                    <div className="w-6 h-6 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="bg-gradient-to-br from-fuchsia-500 to-purple-600 p-6 rounded-2xl shadow-lg">
                    <p className="text-xl font-bold text-white text-center">
                      That's why we built Besties.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Design 5: Floating Bubble Design */}
          <div className="mb-12 relative p-12 bg-gradient-to-br from-pink-100 via-purple-100 to-fuchsia-100 rounded-3xl overflow-hidden">
            {/* Decorative bubbles */}
            <div className="absolute top-4 right-4 w-32 h-32 bg-pink-300/30 rounded-full blur-2xl"></div>
            <div className="absolute bottom-8 left-8 w-40 h-40 bg-purple-300/30 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-fuchsia-300/30 rounded-full blur-2xl"></div>

            <div className="relative">
              <div className="text-center mb-8">
                <div className="inline-block bg-white px-10 py-4 rounded-full shadow-xl">
                  <h3 className="text-3xl font-black bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    Our Story
                  </h3>
                </div>
              </div>

              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl transform hover:scale-105 transition-transform duration-300">
                  <p className="text-lg text-gray-700 leading-relaxed text-center">
                    Besties was born from a simple truth: <span className="font-bold text-pink-600">everyone deserves to feel safe</span>, especially when they're out there living their life.
                  </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl transform hover:scale-105 transition-transform duration-300">
                  <p className="text-lg text-gray-700 leading-relaxed text-center">
                    We've all been there - walking home alone at night, going on a first date, traveling somewhere new, or just wanting someone to know you made it home okay. Those moments when you wish your best friend could be right there with you, even when they can't.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-fuchsia-500 p-8 rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <p className="text-2xl font-bold text-white text-center drop-shadow-lg">
                    That's why we built Besties.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Design 6: Newspaper/Magazine Style */}
          <div className="mb-12 bg-white p-10 rounded-3xl shadow-2xl border-4 border-gray-200">
            <div className="border-b-4 border-pink-500 pb-4 mb-8">
              <h3 className="text-5xl font-black text-gray-900 text-center tracking-tight">OUR STORY</h3>
              <div className="flex justify-center gap-2 mt-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="w-2 h-2 bg-fuchsia-500 rounded-full"></div>
              </div>
            </div>

            <div className="columns-1 md:columns-2 gap-8 text-gray-700">
              <p className="text-lg leading-relaxed mb-6 first-letter:text-7xl first-letter:font-bold first-letter:text-pink-600 first-letter:mr-2 first-letter:float-left">
                Besties was born from a simple truth: <span className="font-bold text-pink-600">everyone deserves to feel safe</span>, especially when they're out there living their life.
              </p>

              <p className="text-lg leading-relaxed mb-6">
                We've all been there - walking home alone at night, going on a first date, traveling somewhere new, or just wanting someone to know you made it home okay. Those moments when you wish your best friend could be right there with you, even when they can't.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t-2 border-gray-200">
              <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-6 rounded-xl">
                <p className="text-2xl font-bold text-white text-center">
                  That's why we built Besties.
                </p>
              </div>
            </div>
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
                    {/* Minimal heart with sparkle accent */}
                    <path d="M16,26 L6,16 C4,14 4,10 6,8 C8,6 12,6 14,8 L16,10 L18,8 C20,6 24,6 26,8 C28,10 28,14 26,16 Z"
                          fill="none"
                          stroke="#ec4899"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round" />
                    {/* Sparkle accent */}
                    <circle cx="24" cy="6" r="1.5" fill="#fbbf24" className="animate-pulse" style={{animationDuration: '2s'}} />
                    <path d="M24,3 L24,9 M21,6 L27,6" stroke="#fbbf24" strokeWidth="1" className="animate-pulse" style={{animationDuration: '2s'}} />
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
                    {/* Minimal lock outline */}
                    <rect x="11" y="15" width="10" height="10" rx="1.5"
                          fill="none"
                          stroke="#a855f7"
                          strokeWidth="2"
                          strokeLinecap="round" />
                    <path d="M13,15 L13,11 C13,8.8 14.3,7 16,7 C17.7,7 19,8.8 19,11 L19,15"
                          fill="none"
                          stroke="#a855f7"
                          strokeWidth="2"
                          strokeLinecap="round"/>
                    <circle cx="16" cy="20" r="1.5" fill="#a855f7"/>
                    {/* Sparkle accent */}
                    <circle cx="8" cy="8" r="1" fill="#fbbf24" className="animate-pulse" style={{animationDuration: '2s'}} />
                    <path d="M8,6 L8,10 M6,8 L10,8" stroke="#fbbf24" strokeWidth="0.8" className="animate-pulse" style={{animationDuration: '2s'}} />
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
                    {/* Minimal dollar sign */}
                    <path d="M16,6 L16,26" stroke="#d946ef" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12,10 L18,10 C20,10 21,11 21,13 C21,15 20,16 18,16 L14,16 C12,16 11,17 11,19 C11,21 12,22 14,22 L20,22"
                          fill="none"
                          stroke="#d946ef"
                          strokeWidth="2"
                          strokeLinecap="round" />
                    {/* Three sparkles */}
                    <g className="animate-pulse" style={{animationDuration: '2s'}}>
                      <circle cx="8" cy="8" r="1" fill="#fbbf24" />
                      <path d="M8,6 L8,10 M6,8 L10,8" stroke="#fbbf24" strokeWidth="0.8" />
                      <circle cx="24" cy="12" r="1" fill="#fbbf24" />
                      <path d="M24,10 L24,14 M22,12 L26,12" stroke="#fbbf24" strokeWidth="0.8" />
                      <circle cx="24" cy="24" r="1" fill="#fbbf24" />
                      <path d="M24,22 L24,26 M22,24 L26,24" stroke="#fbbf24" strokeWidth="0.8" />
                    </g>
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
                    {/* Connection lines - inspired by Logo 4 */}
                    <line x1="16" y1="16" x2="16" y2="8" stroke="#f43f5e" strokeWidth="1.5" opacity="0.4" />
                    <line x1="16" y1="16" x2="24" y2="12" stroke="#f43f5e" strokeWidth="1.5" opacity="0.4" />
                    <line x1="16" y1="16" x2="24" y2="20" stroke="#f43f5e" strokeWidth="1.5" opacity="0.4" />
                    <line x1="16" y1="16" x2="8" y2="12" stroke="#f43f5e" strokeWidth="1.5" opacity="0.4" />
                    <line x1="16" y1="16" x2="8" y2="20" stroke="#f43f5e" strokeWidth="1.5" opacity="0.4" />
                    {/* Center circle - main */}
                    <circle cx="16" cy="16" r="3" fill="none" stroke="#f43f5e" strokeWidth="2" />
                    {/* 5 surrounding circles - community */}
                    <circle cx="16" cy="8" r="2" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
                    <circle cx="24" cy="12" r="2" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
                    <circle cx="24" cy="20" r="2" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
                    <circle cx="8" cy="12" r="2" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
                    <circle cx="8" cy="20" r="2" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
                    {/* Sparkle accent */}
                    <circle cx="26" cy="26" r="1" fill="#fbbf24" className="animate-pulse" style={{animationDuration: '2s'}} />
                    <path d="M26,24 L26,28 M24,26 L28,26" stroke="#fbbf24" strokeWidth="0.8" className="animate-pulse" style={{animationDuration: '2s'}} />
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
