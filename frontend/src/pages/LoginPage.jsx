import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/firebase';
import toast from 'react-hot-toast';
import errorTracker from '../services/errorTracking';

// Skeleton Loader Component
const SkeletonLoader = () => {
  const supportiveMessages = [
    "You're amazing for being here! 💖",
    "Your besties are waiting for you! ✨",
    "Taking care of yourself is so important! 🌸",
    "We're so glad you're here, bestie! 💕",
    "You deserve to feel safe and supported! 🦋",
    "Your safety matters, and we've got your back! 💜"
  ];

  const [message, setMessage] = useState(supportiveMessages[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessage(supportiveMessages[Math.floor(Math.random() * supportiveMessages.length)]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-pattern flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-4xl animate-float opacity-60">💖</div>
        <div className="absolute top-40 right-20 text-3xl animate-float delay-1s opacity-50">✨</div>
        <div className="absolute bottom-32 left-20 text-3xl animate-float delay-2s opacity-60">🌸</div>
        <div className="absolute top-60 right-40 text-2xl animate-float delay-3s opacity-50">🦋</div>
        <div className="absolute bottom-20 right-10 text-4xl animate-float opacity-60">💕</div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Message */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="font-display text-6xl text-gradient mb-2">Besties</h1>
          <p className="text-xl text-text-secondary font-semibold animate-pulse-slow">{message}</p>
        </div>

        {/* Skeleton Card */}
        <div className="card p-8 animate-slide-up">
          <div className="space-y-4">
            <div className="h-12 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full animate-pulse"></div>
            <div className="h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full animate-pulse delay-100"></div>
            <div className="h-12 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full animate-pulse delay-200"></div>
            <div className="h-px bg-gradient-primary my-6 animate-pulse"></div>
            <div className="h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg animate-pulse"></div>
            <div className="h-10 bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg animate-pulse delay-100"></div>
            <div className="h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full animate-pulse delay-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [countryCode, setCountryCode] = useState('+61'); // Default to Australia
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [loadingStep, setLoadingStep] = useState(''); // For showing progress
  const navigate = useNavigate();

  useEffect(() => {
    errorTracker.trackFunnelStep('signup', 'view_login_page');
    // Show skeleton loader for 1.5 seconds
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Preload reCAPTCHA when phone auth section opens
  useEffect(() => {
    if (showPhoneAuth && !recaptchaReady) {
      const setupRecaptcha = async () => {
        try {
          setLoadingStep('Setting up verification... 🔐');
          const result = authService.setupRecaptcha('recaptcha-container');
          if (result.success) {
            setRecaptchaReady(true);
            setLoadingStep('');
          } else {
            setLoadingStep('');
            toast.error('Verification setup failed. Please refresh the page.');
          }
        } catch (error) {
          setLoadingStep('');
          console.error('reCAPTCHA setup error:', error);
        }
      };

      // Small delay to let the UI render first
      setTimeout(setupRecaptcha, 100);
    }
  }, [showPhoneAuth, recaptchaReady]);

  // Show skeleton loader
  if (pageLoading) {
    return <SkeletonLoader />;
  }

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setLoadingStep('Opening Google sign-in... ✨');
    errorTracker.trackFunnelStep('signup', 'click_google_signin');

    try {
      const result = await authService.signInWithGoogle();
      setLoading(false);
      setLoadingStep('');

      if (result.success) {
        errorTracker.trackFunnelStep('signup', 'complete_google_signin');
        toast.success('Welcome to Besties!');
        // Navigate to home - HomePage will handle onboarding redirect if needed
        navigate('/');
      } else {
        errorTracker.logCustomError('Google sign-in failed', { error: result.error });
        toast.error(result.error || 'Sign in failed');
      }
    } catch (error) {
      setLoading(false);
      setLoadingStep('');
      toast.error('Sign in failed. Please try again.');
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    errorTracker.trackFunnelStep('signup', isSignUp ? 'click_email_signup' : 'click_email_signin');

    let result;
    if (isSignUp) {
      result = await authService.signUpWithEmail(email, password, displayName);
    } else {
      result = await authService.signInWithEmail(email, password);
    }

    setLoading(false);

    if (result.success) {
      errorTracker.trackFunnelStep('signup', isSignUp ? 'complete_email_signup' : 'complete_email_signin');
      toast.success(isSignUp ? 'Account created!' : 'Welcome back!');
      // Navigate to home - HomePage will handle onboarding redirect if needed
      navigate('/');
    } else {
      errorTracker.logCustomError('Email auth failed', { error: result.error, isSignUp });
      toast.error(result.error || 'Authentication failed');
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();

    if (!recaptchaReady) {
      toast.error('Please wait for verification to be ready...');
      return;
    }

    setLoading(true);
    setLoadingStep('Sending verification code... 💌');
    errorTracker.trackFunnelStep('signup', 'click_phone_send_code');

    try {
      // Format phone number with selected country code
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `${countryCode}${phoneNumber.replace(/\s/g, '')}`;

      // Get the pre-loaded reCAPTCHA verifier
      const recaptchaResult = authService.setupRecaptcha('recaptcha-container');
      if (!recaptchaResult.success) {
        toast.error('Verification not ready. Please try again.');
        setLoading(false);
        setLoadingStep('');
        return;
      }

      // Send verification code
      const result = await authService.sendPhoneVerification(formattedPhone, recaptchaResult.verifier);
      setLoading(false);
      setLoadingStep('');

      if (result.success) {
        setConfirmationResult(result.confirmationResult);
        toast.success('Code sent! Check your phone 📱');
        errorTracker.trackFunnelStep('signup', 'phone_code_sent');
      } else {
        errorTracker.logCustomError('Phone verification failed', { error: result.error });
        toast.error(result.error || 'Failed to send code');
      }
    } catch (error) {
      setLoading(false);
      setLoadingStep('');
      errorTracker.logCustomError('Phone send code error', { error: error.message });
      toast.error('Failed to send code. Please try again.');
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoadingStep('Verifying code... 🔍');
    errorTracker.trackFunnelStep('signup', 'click_phone_verify_code');

    try {
      const result = await authService.verifyPhoneCode(confirmationResult, verificationCode);
      setLoading(false);
      setLoadingStep('');

      if (result.success) {
        errorTracker.trackFunnelStep('signup', 'complete_phone_signin');
        toast.success('Welcome to Besties! 💖');
        // Navigate to home - HomePage will handle onboarding redirect if needed
        navigate('/');
      } else {
        errorTracker.logCustomError('Phone code verification failed', { error: result.error });
        toast.error(result.error || 'Invalid code. Please try again.');
      }
    } catch (error) {
      setLoading(false);
      setLoadingStep('');
      toast.error('Verification failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-pattern flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-4xl animate-float opacity-60">💖</div>
        <div className="absolute top-40 right-20 text-3xl animate-float delay-1s opacity-50">✨</div>
        <div className="absolute bottom-32 left-20 text-3xl animate-float delay-2s opacity-60">🌸</div>
        <div className="absolute top-60 right-40 text-2xl animate-float delay-3s opacity-50">🦋</div>
        <div className="absolute bottom-20 right-10 text-4xl animate-float opacity-60">💕</div>
        <div className="absolute top-1/3 left-1/4 text-2xl animate-float delay-4s opacity-40">⭐</div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Tagline */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="font-display text-6xl text-gradient mb-2">Besties</h1>
          <p className="text-xl text-text-secondary font-semibold">Your besties have your back 💜</p>
        </div>

        {/* Main Card with gradient border */}
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-primary rounded-2xl opacity-20 blur"></div>
          <div className="card p-8 animate-slide-up relative bg-white">

          {/* Loading Progress Indicator */}
          {loadingStep && (
            <div className="mb-4 p-3 bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl text-center animate-pulse">
              <p className="text-sm font-semibold text-primary flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                {loadingStep}
              </p>
            </div>
          )}

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full btn btn-primary mb-3 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google ✨
          </button>

          {/* Phone Sign In */}
          <button
            onClick={() => setShowPhoneAuth(!showPhoneAuth)}
            className="w-full btn btn-secondary mb-3 shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Sign in with your number 📱
          </button>

          {/* Phone Auth Form */}
          {showPhoneAuth && (
            <div className="mb-4 p-5 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl border-2 border-pink-100 shadow-inner">
              {!confirmationResult ? (
                <form onSubmit={handleSendCode} className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="input w-20"
                      >
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                        <option value="+61">+61</option>
                        <option value="+91">+91</option>
                      </select>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                          // Format with spaces as user types
                          const value = e.target.value.replace(/\s/g, ''); // Remove existing spaces
                          let formatted = value;

                          // Format Australian numbers: 435 853 854
                          if (countryCode === '+61' && value.length > 3) {
                            formatted = value.slice(0, 3);
                            if (value.length > 3) formatted += ' ' + value.slice(3, 6);
                            if (value.length > 6) formatted += ' ' + value.slice(6, 9);
                          }
                          // Format US/Canada numbers: (435) 853-8540
                          else if (countryCode === '+1' && value.length > 3) {
                            formatted = value.slice(0, 3);
                            if (value.length > 3) formatted += ' ' + value.slice(3, 6);
                            if (value.length > 6) formatted += ' ' + value.slice(6, 10);
                          }
                          // Format UK numbers: 7911 123456
                          else if (countryCode === '+44' && value.length > 4) {
                            formatted = value.slice(0, 4);
                            if (value.length > 4) formatted += ' ' + value.slice(4, 10);
                          }
                          // Format Indian numbers: 98765 43210
                          else if (countryCode === '+91' && value.length > 5) {
                            formatted = value.slice(0, 5);
                            if (value.length > 5) formatted += ' ' + value.slice(5, 10);
                          }

                          setPhoneNumber(formatted);
                        }}
                        className="input flex-1"
                        placeholder={
                          countryCode === '+61' ? '412 345 678' :
                          countryCode === '+1' ? '555 123 4567' :
                          countryCode === '+44' ? '7911 123456' :
                          '98765 43210'
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* reCAPTCHA Ready Indicator */}
                  {!recaptchaReady && (
                    <div className="flex items-center justify-center gap-2 text-xs text-text-secondary">
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span>Preparing verification...</span>
                    </div>
                  )}
                  {recaptchaReady && (
                    <div className="flex items-center justify-center gap-2 text-xs text-success">
                      <span>✅</span>
                      <span>Ready to send code!</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !recaptchaReady}
                    className="w-full btn btn-primary flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading && (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {loading ? 'Sending magic code... ✨' : 'Send Verification Code 💌'}
                  </button>

                  {/* Invisible reCAPTCHA container */}
                  <div id="recaptcha-container"></div>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      ✨ Verification Code
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-2xl">🔐</span>
                      </div>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="input pl-14"
                        placeholder="123456"
                        required
                        maxLength={6}
                      />
                    </div>
                    <p className="text-xs text-text-secondary mt-1">
                      Enter the 6-digit code sent to your phone 💌
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn btn-primary shadow-md hover:shadow-lg"
                  >
                    {loading ? 'Verifying... 🔍' : 'Verify Code ✅'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmationResult(null);
                      setVerificationCode('');
                    }}
                    className="w-full btn btn-secondary shadow-sm hover:shadow-md"
                  >
                    ← Back
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Facebook Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={true}
            className="w-full btn bg-[#1877F2] text-white hover:bg-[#166FE5] mb-6 opacity-50 cursor-not-allowed shadow-md"
            title="Facebook login coming soon"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continue with Facebook (Coming Soon) 🎀
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-pink-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-text-secondary font-semibold">Or continue with email 💌</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  ✨ Display Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-xl">👤</span>
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input pl-12 focus:ring-2 focus:ring-pink-200"
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                📧 Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-xl">✉️</span>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-12 focus:ring-2 focus:ring-pink-200"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                🔒 Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-xl">🔐</span>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-12 focus:ring-2 focus:ring-pink-200"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-secondary shadow-md hover:shadow-lg"
            >
              {loading ? 'Please wait... ✨' : (isSignUp ? 'Join the besties! 🎀' : 'Welcome back, bestie! 💕')}
            </button>
          </form>

          {/* Toggle Sign Up/In */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary font-semibold hover:underline transition-all hover:scale-105"
            >
              {isSignUp ? 'Already have an account? Welcome back! 💕' : "New here? Join the besties! ✨"}
            </button>
          </div>
        </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-text-secondary">
          <p className="flex items-center justify-center gap-1">
            By continuing, you agree to our Terms of Service
            <span className="text-pink-400">💖</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
