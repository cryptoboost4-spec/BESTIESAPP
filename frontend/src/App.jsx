import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { auth } from './services/firebase';

// Context
import { AuthProvider } from './contexts/AuthContext';
import { DarkModeProvider } from './contexts/DarkModeContext';

// Components
import ErrorBoundary from './components/ErrorBoundary';
import AdminRoute from './components/AdminRoute';
import ScrollToTop from './components/ScrollToTop';
import MilestoneCelebration from './components/MilestoneCelebration';
import BestieCelebrationModal from './components/BestieCelebrationModal';
import FloatingNotificationBell from './components/FloatingNotificationBell';
import MobileBottomNav from './components/MobileBottomNav';

// Services
import errorTracker from './services/errorTracking';

// Eagerly loaded pages (critical for initial load)
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';

// Lazy loaded pages (loaded on demand)
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const CreateCheckInPage = lazy(() => import('./pages/CreateCheckInPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ViewUserProfilePage = lazy(() => import('./pages/ViewUserProfilePage'));
const BestiesPage = lazy(() => import('./pages/BestiesPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const BadgesPage = lazy(() => import('./pages/BadgesPage'));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'));
const CheckInHistoryPage = lazy(() => import('./pages/CheckInHistoryPage'));
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'));
const DevAnalyticsPage = lazy(() => import('./pages/DevAnalyticsPage'));
const LocationFavoritesPage = lazy(() => import('./pages/LocationFavoritesPage'));
const ExportDataPage = lazy(() => import('./pages/ExportDataPage'));
const MonitoringDashboard = lazy(() => import('./pages/MonitoringDashboard'));
const SocialFeedPage = lazy(() => import('./pages/SocialFeedPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const ErrorDashboard = lazy(() => import('./pages/ErrorDashboard'));
const AlertViewPage = lazy(() => import('./pages/AlertViewPage'));
const SubscriptionSuccessPage = lazy(() => import('./pages/SubscriptionSuccessPage'));
const SubscriptionCancelPage = lazy(() => import('./pages/SubscriptionCancelPage'));
const AboutBestiesPage = lazy(() => import('./pages/AboutBestiesPage'));
const AdminBackfillPage = lazy(() => import('./pages/AdminBackfillPage'));
const CircleHealthPage = lazy(() => import('./pages/CircleHealthPage'));
const DataPolicyPage = lazy(() => import('./pages/DataPolicyPage'));

// Loading component for lazy-loaded routes
const PageLoader = () => (
  <div className="min-h-screen bg-pattern flex items-center justify-center">
    <div className="text-center">
      <div className="spinner mb-4"></div>
      <h2 className="font-display text-2xl text-primary">Loading...</h2>
    </div>
  </div>
);

// Route tracker component
function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    errorTracker.trackPageView(location.pathname);
  }, [location]);

  return null;
}

// Custom redirect component that preserves invite parameter
function ProtectedRoute({ user, children }) {
  const location = useLocation();

  if (!user) {
    // Preserve invite parameter when redirecting to login
    const searchParams = new URLSearchParams(location.search);
    const inviteParam = searchParams.get('invite');

    if (inviteParam) {
      return <Navigate to={`/login?invite=${inviteParam}`} />;
    }

    return <Navigate to="/login" />;
  }

  return children;
}

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-pattern flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <h2 className="font-display text-2xl text-primary">Besties</h2>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <DarkModeProvider>
        <AuthProvider>
          <Router>
            <RouteTracker />
            <ScrollToTop />
            <MilestoneCelebration />
            <BestieCelebrationModal />
            {user && (
              <div className="fixed top-16 right-4 z-50">
                <FloatingNotificationBell />
              </div>
            )}
            {/* DesktopNav removed per user request - notifications handled by FloatingNotificationBell */}
            {user && <MobileBottomNav />}
            <div className="App pb-20 md:pb-0">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes */}
                  <Route
                    path="/login"
                    element={user ? <Navigate to="/" /> : <LoginPage />}
                  />
                  <Route
                    path="/privacy"
                    element={<PrivacyPolicyPage />}
                  />
                  <Route
                    path="/terms"
                    element={<TermsOfServicePage />}
                  />
                  <Route
                    path="/alert/:alertId"
                    element={<AlertViewPage />}
                  />
                  <Route
                    path="/subscription-success"
                    element={user ? <SubscriptionSuccessPage /> : <Navigate to="/login" />}
                  />
                  <Route
                    path="/subscription-cancel"
                    element={user ? <SubscriptionCancelPage /> : <Navigate to="/login" />}
                  />

                  {/* Protected routes */}
                  <Route
                    path="/onboarding"
                    element={<ProtectedRoute user={user}><OnboardingPage /></ProtectedRoute>}
                  />
                  <Route
                    path="/"
                    element={<ProtectedRoute user={user}><HomePage /></ProtectedRoute>}
                  />
                  <Route
                    path="/create"
                    element={user ? <CreateCheckInPage /> : <Navigate to="/login" />}
                  />
                  <Route
                    path="/profile"
                    element={user ? <ProfilePage /> : <Navigate to="/login" />}
                  />
                  <Route
                    path="/user/:userId"
                    element={user ? <ViewUserProfilePage /> : <Navigate to="/login" />}
                  />
                  <Route
                    path="/edit-profile"
                    element={user ? <EditProfilePage /> : <Navigate to="/login" />}
                  />
                  <Route
                    path="/besties"
                    element={user ? <BestiesPage /> : <Navigate to="/login" />}
                  />
                  <Route
                    path="/settings"
                    element={user ? <SettingsPage /> : <Navigate to="/login" />}
                  />
                  <Route
                    path="/badges"
                    element={user ? <BadgesPage /> : <Navigate to="/login" />}
                  />
                  <Route
                    path="/history"
                    element={user ? <CheckInHistoryPage /> : <Navigate to="/login" />}
                  />
                  <Route
                    path="/templates"
                    element={user ? <TemplatesPage /> : <Navigate to="/login" />}
                  />
                  <Route
                    path="/favorites"
                    element={user ? <LocationFavoritesPage /> : <Navigate to="/login" />}
                  />
                  <Route
                    path="/export-data"
                    element={user ? <ExportDataPage /> : <Navigate to="/login" />}
                  />
                  <Route
                    path="/social-feed"
                    element={user ? <SocialFeedPage /> : <Navigate to="/login" />}
                  />
                  <Route
                    path="/about"
                    element={user ? <AboutBestiesPage /> : <Navigate to="/login" />}
                  />
                  <Route
                    path="/circle-health"
                    element={user ? <CircleHealthPage /> : <Navigate to="/login" />}
                  />
                  <Route
                    path="/data-policy"
                    element={user ? <DataPolicyPage /> : <Navigate to="/login" />}
                  />

                  {/* Admin-only routes */}
                  <Route
                    path="/dev-analytics"
                    element={user ? <AdminRoute><DevAnalyticsPage /></AdminRoute> : <Navigate to="/login" />}
                  />
                  <Route
                    path="/monitoring"
                    element={user ? <AdminRoute><MonitoringDashboard /></AdminRoute> : <Navigate to="/login" />}
                  />
                  <Route
                    path="/error-dashboard"
                    element={user ? <AdminRoute><ErrorDashboard /></AdminRoute> : <Navigate to="/login" />}
                  />
                  <Route
                    path="/admin/backfill"
                    element={user ? <AdminRoute><AdminBackfillPage /></AdminRoute> : <Navigate to="/login" />}
                  />

                  {/* Catch all */}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Suspense>

              {/* Toast notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#fff',
                    color: '#2D3748',
                    fontFamily: 'Quicksand, sans-serif',
                    fontWeight: '600',
                  },
                  success: {
                    iconTheme: {
                      primary: '#4CAF50',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#FF6B35',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </AuthProvider>
      </DarkModeProvider>
    </ErrorBoundary>
  );
}

export default App;
