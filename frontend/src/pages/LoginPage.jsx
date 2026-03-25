import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/firebase';
import toast from 'react-hot-toast';
import errorTracker from '../services/errorTracking';
import useFormValidation from '../hooks/useFormValidation';

const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form validation for email/password
  const {
    values,
    errors,
    handleChange,
    handleBlur,
    validateAll
  } = useFormValidation(
    { email: '', password: '' },
    {
      email: {
        required: true,
        email: true,
        requiredMessage: 'Email is required 📧',
        emailMessage: 'Please enter a valid email address 💜'
      },
      password: {
        required: true,
        minLength: 6,
        requiredMessage: 'Password is required 🔒',
        minLengthMessage: 'Password must be at least 6 characters 🔐'
      }
    }
  );

  const [loadingStep, setLoadingStep] = useState(''); // For showing progress
  const navigate = useNavigate();

  useEffect(() => {
    errorTracker.trackFunnelStep('signup', 'view_login_page');
  }, []);



  const handleGoogleSignIn = async () => {
    setLoading(true);
    setLoadingStep('Opening Google sign-in...');
    errorTracker.trackFunnelStep('signup', 'click_google_signin');

    try {
      const result = await authService.signInWithGoogle();

      if (result.success && result.usedRedirect) {
        setLoadingStep('Redirecting to Google…');
        // Full-page redirect; leave loading on until navigation completes
        return;
      }

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

    // Validate form before submission
    if (!validateAll()) {
      toast.error('Please fix the errors before continuing 💜');
      return;
    }

    setLoading(true);
    errorTracker.trackFunnelStep('signup', isSignUp ? 'click_email_signup' : 'click_email_signin');

    let result;
    if (isSignUp) {
      result = await authService.signUpWithEmail(values.email, values.password, null);
    } else {
      result = await authService.signInWithEmail(values.email, values.password);
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

          {/* Loading Progress Indicator */}
          {loadingStep && (
            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
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
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-text-secondary">Or</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Email
              </label>
              <input
                type="email"
                value={values.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={`input ${errors.email ? 'border-red-500 dark:border-red-400' : ''}`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Password
              </label>
              <input
                type="password"
                value={values.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                className={`input ${errors.password ? 'border-red-500 dark:border-red-400' : ''}`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.password}</p>
              )}
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
          <p>
            By continuing, you agree to our{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Terms of Service
            </a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
