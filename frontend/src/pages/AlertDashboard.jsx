import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, functions } from '../services/firebase';
import { doc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const AlertDashboard = () => {
  const { alertId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [alert, setAlert] = useState(null);
  const [alertUser, setAlertUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [responseNote, setResponseNote] = useState('');
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedResponseType, setSelectedResponseType] = useState(null);

  useEffect(() => {
    loadAlert();
  }, [alertId]);

  const loadAlert = async () => {
    try {
      // Get check-in/alert data
      const alertDoc = await getDoc(doc(db, 'checkins', alertId));

      if (!alertDoc.exists()) {
        toast.error('Alert not found');
        navigate('/');
        return;
      }

      const alertData = alertDoc.data();

      // Verify user is authorized to view this alert
      if (!alertData.selectedBesties?.includes(currentUser.uid)) {
        toast.error('You are not authorized to view this alert');
        navigate('/');
        return;
      }

      setAlert({ id: alertDoc.id, ...alertData });

      // Get user data
      const userDoc = await getDoc(doc(db, 'users', alertData.userId));
      if (userDoc.exists()) {
        setAlertUser(userDoc.data());
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading alert:', error);
      toast.error('Failed to load alert');
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (alertUser?.phoneNumber) {
      window.location.href = `tel:${alertUser.phoneNumber}`;
      // Log the call attempt
      logResponse('called');
    } else {
      toast.error('No phone number available');
    }
  };

  const handleSMS = () => {
    if (alertUser?.phoneNumber) {
      window.location.href = `sms:${alertUser.phoneNumber}`;
      logResponse('messaged');
    } else {
      toast.error('No phone number available');
    }
  };

  const openResponseModal = (responseType) => {
    setSelectedResponseType(responseType);
    setShowResponseModal(true);
  };

  const logResponse = async (responseType, note = '') => {
    try {
      setResponding(true);

      // Log response to alert_responses collection
      await addDoc(collection(db, 'alert_responses'), {
        alertId: alert.id,
        userId: alert.userId,
        responderId: currentUser.uid,
        responderName: userData?.displayName || 'Bestie',
        responseType,
        note,
        createdAt: Timestamp.now(),
      });

      // Call cloud function to acknowledge alert
      const acknowledgeAlert = httpsCallable(functions, 'acknowledgeAlert');
      await acknowledgeAlert({ checkInId: alert.id });

      toast.success('Response logged!');
      setShowResponseModal(false);
      setResponseNote('');
    } catch (error) {
      console.error('Error logging response:', error);
      toast.error('Failed to log response');
    } finally {
      setResponding(false);
    }
  };

  const submitResponse = () => {
    if (selectedResponseType) {
      logResponse(selectedResponseType, responseNote);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pattern flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="min-h-screen bg-pattern flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-text-secondary">Alert not found</p>
        </div>
      </div>
    );
  }

  const timeElapsed = alert.alertedAt ? new Date() - alert.alertedAt.toDate() : 0;
  const minutesElapsed = Math.floor(timeElapsed / 60000);

  return (
    <div className="min-h-screen bg-pattern">
      <div className="max-w-4xl mx-auto p-4 pb-20">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-primary hover:text-primary-dark mb-3 flex items-center gap-2"
          >
            ← Back
          </button>

          <div className="card p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 border-4 border-red-500 dark:border-red-600">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-4xl animate-bounce shadow-lg">
                🚨
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-display font-bold text-red-900 dark:text-red-100">
                  URGENT ALERT
                </h1>
                <p className="text-red-700 dark:text-red-300 font-semibold">
                  {alertUser?.displayName || 'Someone'} needs help!
                </p>
              </div>
              <div className="text-right">
                <div className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full animate-pulse mb-1">
                  ACTIVE
                </div>
                <div className="text-xs text-red-700 dark:text-red-300">
                  {minutesElapsed} min ago
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCall}
                className="btn bg-green-500 hover:bg-green-600 text-white font-bold py-4 flex items-center justify-center gap-2 shadow-lg"
              >
                📞 Call Now
              </button>
              <button
                onClick={handleSMS}
                className="btn bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 flex items-center justify-center gap-2 shadow-lg"
              >
                💬 Send SMS
              </button>
            </div>
          </div>
        </div>

        {/* Location Section */}
        {alert.location && (
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-display text-text-primary mb-4 flex items-center gap-2">
              📍 Location
            </h2>
            <p className="text-lg text-text-primary mb-4">{alert.location}</p>

            {/* Map */}
            {alert.coordinates && (
              <div className="rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-600 mb-4">
                <iframe
                  title="Location Map"
                  width="100%"
                  height="300"
                  frameBorder="0"
                  src={`https://www.google.com/maps?q=${alert.coordinates.latitude},${alert.coordinates.longitude}&output=embed`}
                  allowFullScreen
                ></iframe>
              </div>
            )}

            {/* Open in Maps buttons */}
            {alert.coordinates && (
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${alert.coordinates.latitude},${alert.coordinates.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary text-center"
                >
                  🗺️ Google Maps
                </a>
                <a
                  href={`https://maps.apple.com/?daddr=${alert.coordinates.latitude},${alert.coordinates.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary text-center"
                >
                  🍎 Apple Maps
                </a>
              </div>
            )}
          </div>
        )}

        {/* Notes Section */}
        {alert.notes && (
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-display text-text-primary mb-4 flex items-center gap-2">
              📝 Notes
            </h2>
            <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
              {alert.notes}
            </p>
          </div>
        )}

        {/* Photos Section */}
        {alert.photoURL && (
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-display text-text-primary mb-4 flex items-center gap-2">
              📸 Photos
            </h2>
            <div className="rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-600">
              <img
                src={alert.photoURL}
                alt="Check-in"
                className="w-full h-auto"
              />
            </div>
          </div>
        )}

        {/* Timeline Section */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-display text-text-primary mb-4 flex items-center gap-2">
            ⏰ Timeline
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                ✓
              </div>
              <div>
                <p className="font-semibold text-text-primary">Check-in Started</p>
                <p className="text-sm text-text-secondary">
                  {alert.createdAt?.toDate().toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 animate-pulse">
                🚨
              </div>
              <div>
                <p className="font-semibold text-text-primary">Alert Triggered</p>
                <p className="text-sm text-text-secondary">
                  {alert.alertedAt?.toDate().toLocaleString()}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {minutesElapsed} minutes ago
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Response Actions */}
        <div className="card p-6 mb-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30">
          <h2 className="text-xl font-display text-text-primary mb-4 text-center">
            How are you responding?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => openResponseModal('acknowledged')}
              className="btn bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 flex items-center justify-center gap-2"
            >
              👀 I've Seen This
            </button>
            <button
              onClick={() => openResponseModal('on_my_way')}
              className="btn bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 flex items-center justify-center gap-2"
            >
              🏃 On My Way
            </button>
            <button
              onClick={() => openResponseModal('contacted_them')}
              className="btn bg-green-500 hover:bg-green-600 text-white font-semibold py-4 flex items-center justify-center gap-2"
            >
              ✅ Contacted Them
            </button>
            <button
              onClick={() => openResponseModal('contacted_authorities')}
              className="btn bg-red-500 hover:bg-red-600 text-white font-semibold py-4 flex items-center justify-center gap-2"
            >
              🚓 Called Authorities
            </button>
          </div>
        </div>

        {/* Contact Information */}
        {alertUser && (
          <div className="card p-6">
            <h2 className="text-xl font-display text-text-primary mb-4">
              Contact Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-display text-lg">
                  {alertUser.photoURL ? (
                    <img
                      src={alertUser.photoURL}
                      alt={alertUser.displayName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    alertUser.displayName?.[0] || '?'
                  )}
                </div>
                <div>
                  <p className="font-semibold text-text-primary">
                    {alertUser.displayName}
                  </p>
                  {alertUser.phoneNumber && (
                    <p className="text-sm text-text-secondary">
                      {alertUser.phoneNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-display text-text-primary mb-4">
              Add Response Note (Optional)
            </h3>
            <textarea
              value={responseNote}
              onChange={(e) => setResponseNote(e.target.value)}
              placeholder="Add any additional details..."
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-primary focus:outline-none mb-4 min-h-[100px]"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setResponseNote('');
                }}
                className="flex-1 btn btn-secondary"
                disabled={responding}
              >
                Cancel
              </button>
              <button
                onClick={submitResponse}
                className="flex-1 btn btn-primary"
                disabled={responding}
              >
                {responding ? 'Submitting...' : 'Submit Response'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertDashboard;
