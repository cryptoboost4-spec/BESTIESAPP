import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/firebase';
import toast from 'react-hot-toast';
import errorTracker from '../services/errorTracking';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('+61'); // Default to Australia
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [recaptchaStatus, setRecaptchaStatus] = useState('idle'); // idle, checking, verified
  const navigate = useNavigate();

  useEffect(() => {
    errorTracker.trackFunnelStep('signup', 'view_login_page');
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    errorTracker.trackFunnelStep('signup', 'click_google_signin');

    const result = await authService.signInWithGoogle();
    setLoading(false);

    if (result.success) {
      errorTracker.trackFunnelStep('signup', 'complete_google_signin');
      toast.success('Welcome to Besties!');
      // Navigate to home - HomePage will handle onboarding redirect if needed
      navigate('/');
    } else {
      errorTracker.logCustomError('Google sign-in failed', { error: result.error });
      toast.error(result.error || 'Sign in failed');
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
    setLoading(true);
    setRecaptchaStatus('checking'); // Show checking animation
    errorTracker.trackFunnelStep('signup', 'click_phone_send_code');

    // Format phone number with selected country code
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `${countryCode}${phoneNumber}`;

    // Set up reCAPTCHA (invisible - auto-executes)
    const recaptchaResult = authService.setupRecaptcha('recaptcha-container');
    if (!recaptchaResult.success) {
      toast.error('Failed to set up verification. Please refresh the page.');
      setLoading(false);
      setRecaptchaStatus('idle');
      return;
    }

    // Send verification code (reCAPTCHA auto-executes in background)
    const result = await authService.sendPhoneVerification(formattedPhone, recaptchaResult.verifier);
    setLoading(false);

    if (result.success) {
      setRecaptchaStatus('verified'); // Show verified checkmark
      setConfirmationResult(result.confirmationResult);
      toast.success('Verification code sent!');
      errorTracker.trackFunnelStep('signup', 'phone_code_sent');
    } else {
      setRecaptchaStatus('idle');
      errorTracker.logCustomError('Phone verification failed', { error: result.error });
      toast.error(result.error || 'Failed to send code');
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    errorTracker.trackFunnelStep('signup', 'click_phone_verify_code');

    const result = await authService.verifyPhoneCode(confirmationResult, verificationCode);
    setLoading(false);

    if (result.success) {
      errorTracker.trackFunnelStep('signup', 'complete_phone_signin');
      toast.success('Welcome to Besties!');
      // Navigate to home - HomePage will handle onboarding redirect if needed
      navigate('/');
    } else {
      errorTracker.logCustomError('Phone code verification failed', { error: result.error });
      toast.error(result.error || 'Invalid code');
    }
  };

  return (
    <div className="min-h-screen bg-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Tagline */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="font-display text-6xl text-gradient mb-2">Besties</h1>
          <p className="text-xl text-text-secondary font-semibold">Your besties have your back 💜</p>
        </div>

        {/* Main Card */}
        <div className="card p-8 animate-slide-up">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full btn btn-primary mb-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Phone Sign In */}
          <button
            onClick={() => setShowPhoneAuth(!showPhoneAuth)}
            className="w-full btn btn-secondary mb-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Continue with Phone
          </button>

          {/* Phone Auth Form */}
          {showPhoneAuth && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
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
                        className="input w-24"
                      >
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+61">🇦🇺 +61</option>
                        <option value="+91">🇮🇳 +91</option>
                      </select>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="input flex-1"
                        placeholder="412345678"
                        required
                      />
                    </div>
                    <p className="text-xs text-text-secondary mt-1">
                      Enter your phone number without the country code
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn btn-primary"
                  >
                    {loading ? 'Sending...' : 'Send Verification Code'}
                  </button>

                  {/* Fake Google reCAPTCHA (looks exactly like the real thing) */}
                  <div className="mt-4 flex items-start gap-3 p-3 bg-gray-50 border border-gray-300 rounded">
                    {/* Checkbox */}
                    <div className={`w-7 h-7 border-2 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                      recaptchaStatus === 'idle'
                        ? 'border-gray-400 bg-white'
                        : recaptchaStatus === 'checking'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-green-500 bg-green-500'
                    }`}>
                      {recaptchaStatus === 'idle' && null}
                      {recaptchaStatus === 'checking' && (
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      )}
                      {recaptchaStatus === 'verified' && (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700">
                        {recaptchaStatus === 'idle' && "I'm not a robot"}
                        {recaptchaStatus === 'checking' && "Verifying..."}
                        {recaptchaStatus === 'verified' && "Verified"}
                      </div>
                      {/* reCAPTCHA branding */}
                      <div className="flex items-center gap-1 mt-1">
                        <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                        </svg>
                        <span className="text-xs text-gray-500">reCAPTCHA</span>
                        <span className="text-xs text-gray-400 ml-1">Privacy - Terms</span>
                      </div>
                    </div>
                  </div>

                  {/* Invisible reCAPTCHA container (hidden, auto-executes) */}
                  <div id="recaptcha-container" style={{ display: 'none' }}></div>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="input"
                      placeholder="123456"
                      required
                      maxLength={6}
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      Enter the 6-digit code sent to your phone
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn btn-primary"
                  >
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmationResult(null);
                      setVerificationCode('');
                    }}
                    className="w-full btn btn-secondary"
                  >
                    Back
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Facebook Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={true}
            className="w-full btn bg-[#1877F2] text-white hover:bg-[#166FE5] mb-6 opacity-50 cursor-not-allowed"
            title="Facebook login coming soon"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continue with Facebook (Coming Soon)
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-text-secondary">Or</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input"
                  placeholder="Your name"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-secondary"
            >
              {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          {/* Toggle Sign Up/In */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary font-semibold hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-text-secondary">
          <p>By continuing, you agree to our Terms of Service</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
