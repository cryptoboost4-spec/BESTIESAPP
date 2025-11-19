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

          {/* Style 3: Watercolor Dream */}
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-purple-200">
            <h3 className="font-semibold text-lg text-purple-900 mb-3">Style 3: Watercolor Dream</h3>
            <p className="text-xs text-gray-600 mb-4">Soft washes, blended colors, artistic and organic</p>
            <div className="flex items-center justify-center gap-8">
              {/* Watercolor heart splash */}
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

                  {/* Background wash */}
                  <circle cx="60" cy="60" r="40" fill="url(#watercolor2)" />

                  {/* Heart shape with watercolor effect */}
                  <path d="M60,80 C60,80 38,68 38,50 C38,42 43,37 49,37 C54,37 57,40 60,46 C63,40 66,37 71,37 C77,37 82,42 82,50 C82,68 60,80 60,80 Z"
                        fill="url(#watercolor1)"
                        className="animate-pulse"
                        style={{animationDuration: '4s'}} />

                  {/* Overlapping wash layers */}
                  <ellipse cx="55" cy="52" rx="15" ry="12" fill="#fda4af" opacity="0.3" />
                  <ellipse cx="65" cy="55" rx="12" ry="15" fill="#f9a8d4" opacity="0.2" />
                </svg>
                <p className="text-xs text-gray-600 mt-2">Painted Love</p>
              </div>

              {/* Watercolor figures holding hands */}
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

                  {/* Two figures - watercolor style */}
                  <g className="animate-pulse" style={{animationDuration: '3s'}}>
                    <circle cx="40" cy="50" r="20" fill="url(#person1wash)" />
                    <circle cx="40" cy="48" r="10" fill="#fbbf24" opacity="0.6" />
                    <ellipse cx="40" cy="65" rx="12" ry="18" fill="#fbbf24" opacity="0.5" />
                  </g>

                  <g className="animate-pulse" style={{animationDuration: '3s', animationDelay: '0.5s'}}>
                    <circle cx="80" cy="50" r="20" fill="url(#person2wash)" />
                    <circle cx="80" cy="48" r="10" fill="#c4b5fd" opacity="0.6" />
                    <ellipse cx="80" cy="65" rx="12" ry="18" fill="#c4b5fd" opacity="0.5" />
                  </g>

                  {/* Connection between them */}
                  <ellipse cx="60" cy="65" rx="25" ry="8" fill="#f9a8d4" opacity="0.3" />
                </svg>
                <p className="text-xs text-gray-600 mt-2">Together Always</p>
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

          {/* Style 6: Bubbly & Round */}
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-rose-200">
            <h3 className="font-semibold text-lg text-rose-900 mb-3">Style 6: Bubbly & Round</h3>
            <p className="text-xs text-gray-600 mb-4">Rounded shapes, soft circles, friendly and approachable</p>
            <div className="flex items-center justify-center gap-8">
              {/* Bubble heart stack */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <linearGradient id="bubble2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fda4af" />
                      <stop offset="100%" stopColor="#fb7185" />
                    </linearGradient>
                  </defs>

                  {/* Bubble heart made of circles */}
                  <g className="animate-pulse" style={{animationDuration: '2s'}}>
                    <circle cx="48" cy="48" r="14" fill="url(#bubble2)" opacity="0.7" />
                    <circle cx="72" cy="48" r="14" fill="url(#bubble2)" opacity="0.7" />
                    <circle cx="60" cy="56" r="16" fill="url(#bubble2)" opacity="0.7" />
                    <circle cx="60" cy="70" r="12" fill="url(#bubble2)" opacity="0.7" />
                  </g>

                  {/* Shine effects */}
                  <circle cx="52" cy="44" r="4" fill="#fff" opacity="0.6" />
                  <circle cx="68" cy="46" r="3" fill="#fff" opacity="0.6" />

                  {/* Small floating bubbles */}
                  <g className="animate-pulse" style={{animationDuration: '3s', animationDelay: '0.5s'}}>
                    <circle cx="40" cy="70" r="4" fill="#fbbf24" opacity="0.5" />
                    <circle cx="80" cy="75" r="5" fill="#f9a8d4" opacity="0.5" />
                    <circle cx="60" cy="30" r="3" fill="#c4b5fd" opacity="0.5" />
                  </g>
                </svg>
                <p className="text-xs text-gray-600 mt-2">Bubble Love</p>
              </div>

              {/* Bubbly people group */}
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

                  {/* Three round figures */}
                  <g className="animate-pulse" style={{animationDuration: '2s'}}>
                    <circle cx="35" cy="55" r="12" fill="url(#bubblePerson1)" />
                    <circle cx="35" cy="73" r="14" fill="url(#bubblePerson1)" opacity="0.8" />
                  </g>

                  <g className="animate-pulse" style={{animationDuration: '2s', animationDelay: '0.3s'}}>
                    <circle cx="60" cy="48" r="14" fill="url(#bubblePerson2)" />
                    <circle cx="60" cy="68" r="16" fill="url(#bubblePerson2)" opacity="0.8" />
                  </g>

                  <g className="animate-pulse" style={{animationDuration: '2s', animationDelay: '0.6s'}}>
                    <circle cx="85" cy="55" r="12" fill="url(#bubblePerson3)" />
                    <circle cx="85" cy="73" r="14" fill="url(#bubblePerson3)" opacity="0.8" />
                  </g>

                  {/* Connecting bubbles */}
                  <circle cx="47" cy="62" r="3" fill="#fff" opacity="0.5" />
                  <circle cx="73" cy="62" r="3" fill="#fff" opacity="0.5" />
                </svg>
                <p className="text-xs text-gray-600 mt-2">Bubble Squad</p>
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

          {/* Style 8: Stardust Dreams */}
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-pink-200">
            <h3 className="font-semibold text-lg text-pink-900 mb-3">Style 8: Stardust Dreams</h3>
            <p className="text-xs text-gray-600 mb-4">Sparkles, twinkles, magical particles, whimsical feel</p>
            <div className="flex items-center justify-center gap-8">
              {/* Sparkle heart constellation */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <defs>
                    <radialGradient id="sparkle1">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#fbbf24" opacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Heart made of sparkles */}
                  <g className="animate-pulse" style={{animationDuration: '2s'}}>
                    {/* Main sparkle stars forming heart shape */}
                    <path d="M45,48 L46,51 L49,52 L46,53 L45,56 L44,53 L41,52 L44,51 Z" fill="#ec4899" />
                    <path d="M75,48 L76,51 L79,52 L76,53 L75,56 L74,53 L71,52 L74,51 Z" fill="#ec4899" />
                    <path d="M38,56 L39,59 L42,60 L39,61 L38,64 L37,61 L34,60 L37,59 Z" fill="#f472b6" />
                    <path d="M82,56 L83,59 L86,60 L83,61 L82,64 L81,61 L78,60 L81,59 Z" fill="#f472b6" />
                    <path d="M60,75 L61,78 L64,79 L61,80 L60,83 L59,80 L56,79 L59,78 Z" fill="#ec4899" />
                    <path d="M35,68 L36,71 L39,72 L36,73 L35,76 L34,73 L31,72 L34,71 Z" fill="#f9a8d4" />
                    <path d="M85,68 L86,71 L89,72 L86,73 L85,76 L84,73 L81,72 L84,71 Z" fill="#f9a8d4" />
                  </g>

                  {/* Tiny floating sparkles */}
                  <g className="animate-pulse" style={{animationDuration: '3s', animationDelay: '0.5s'}}>
                    <circle cx="50" cy="40" r="1.5" fill="#fbbf24" opacity="0.8" />
                    <circle cx="70" cy="42" r="1" fill="#fbbf24" opacity="0.8" />
                    <circle cx="60" cy="35" r="1.5" fill="#fbbf24" opacity="0.8" />
                    <circle cx="45" cy="80" r="1" fill="#c4b5fd" opacity="0.8" />
                    <circle cx="75" cy="82" r="1.5" fill="#c4b5fd" opacity="0.8" />
                  </g>

                  {/* Glow effect */}
                  <circle cx="60" cy="60" r="30" fill="url(#sparkle1)" opacity="0.1" />
                </svg>
                <p className="text-xs text-gray-600 mt-2">Starry Heart</p>
              </div>

              {/* Magical protection circle */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  {/* Circle of sparkles */}
                  <g className="animate-pulse" style={{animationDuration: '3s'}}>
                    <path d="M60,25 L61,28 L64,29 L61,30 L60,33 L59,30 L56,29 L59,28 Z" fill="#a78bfa" />
                    <path d="M85,45 L86,48 L89,49 L86,50 L85,53 L84,50 L81,49 L84,48 Z" fill="#f9a8d4" />
                    <path d="M90,70 L91,73 L94,74 L91,75 L90,78 L89,75 L86,74 L89,73 Z" fill="#fda4af" />
                    <path d="M70,90 L71,93 L74,94 L71,95 L70,98 L69,95 L66,94 L69,93 Z" fill="#fbbf24" />
                    <path d="M40,90 L41,93 L44,94 L41,95 L40,98 L39,95 L36,94 L39,93 Z" fill="#c4b5fd" />
                    <path d="M25,70 L26,73 L29,74 L26,75 L25,78 L24,75 L21,74 L24,73 Z" fill="#f472b6" />
                    <path d="M30,45 L31,48 L34,49 L31,50 L30,53 L29,50 L26,49 L29,48 Z" fill="#fbbf24" />
                  </g>

                  {/* Center protected person - simple shape */}
                  <circle cx="60" cy="60" r="15" fill="#f9a8d4" opacity="0.3" />
                  <circle cx="60" cy="58" r="8" fill="#f9a8d4" opacity="0.6" />

                  {/* Subtle stardust particles */}
                  <g className="animate-pulse" style={{animationDuration: '2s', animationDelay: '1s'}}>
                    <circle cx="50" cy="50" r="1" fill="#fbbf24" opacity="0.6" />
                    <circle cx="70" cy="55" r="1" fill="#c4b5fd" opacity="0.6" />
                    <circle cx="55" cy="70" r="1" fill="#fda4af" opacity="0.6" />
                  </g>
                </svg>
                <p className="text-xs text-gray-600 mt-2">Magic Shield</p>
              </div>
            </div>
          </div>

          {/* Style 9: Sketchy & Sweet */}
          <div className="mb-8 p-6 bg-white rounded-xl border-2 border-rose-200">
            <h3 className="font-semibold text-lg text-rose-900 mb-3">Style 9: Sketchy & Sweet</h3>
            <p className="text-xs text-gray-600 mb-4">Hand-drawn lines, imperfect charm, personal touch</p>
            <div className="flex items-center justify-center gap-8">
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

          <div className="text-center mt-6 p-4 bg-gradient-to-r from-pink-100 via-purple-100 to-pink-100 rounded-lg">
            <p className="font-semibold text-gray-900 mb-2">Which style captures Besties' heart?</p>
            <p className="text-sm text-gray-700">
              Choose your favorite and I'll redesign all the icons site-wide in that style!
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
