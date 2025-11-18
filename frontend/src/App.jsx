import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { auth } from './services/firebase';

// Pages
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import HomePage from './pages/HomePage';
import CreateCheckInPage from './pages/CreateCheckInPage';
import ProfilePage from './pages/ProfilePage';
import ViewUserProfilePage from './pages/ViewUserProfilePage';
import BestiesPage from './pages/BestiesPage';
import SettingsPage from './pages/SettingsPage';
import BadgesPage from './pages/BadgesPage';
import EditProfilePage from './pages/EditProfilePage';
import CheckInHistoryPage from './pages/CheckInHistoryPage';
import TemplatesPage from './pages/TemplatesPage';
import DevAnalyticsPage from './pages/DevAnalyticsPage';
import LocationFavoritesPage from './pages/LocationFavoritesPage';
import ExportDataPage from './pages/ExportDataPage';
import MonitoringDashboard from './pages/MonitoringDashboard';
import SocialFeedPage from './pages/SocialFeedPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import ErrorDashboard from './pages/ErrorDashboard';
import AlertViewPage from './pages/AlertViewPage';

// Context
import { AuthProvider } from './contexts/AuthContext';
import { DarkModeProvider } from './contexts/DarkModeContext';

// Components
import ErrorBoundary from './components/ErrorBoundary';
import AdminRoute from './components/AdminRoute';
import ScrollToTop from './components/ScrollToTop';

// Services
import errorTracker from './services/errorTracking';

// Route tracker component
function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    errorTracker.trackPageView(location.pathname);
  }, [location]);

  return null;
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
            <div className="App">
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

            {/* Protected routes */}
            <Route 
              path="/onboarding" 
              element={user ? <OnboardingPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/" 
              element={user ? <HomePage /> : <Navigate to="/login" />} 
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

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>

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
