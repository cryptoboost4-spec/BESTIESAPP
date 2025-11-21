import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import { doc, getDoc, addDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Header from '../components/Header';

const AlertViewPage = () => {
  const { alertId } = useParams();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myResponse, setMyResponse] = useState(null);
  const [responding, setResponding] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [responseNote, setResponseNote] = useState('');
  const [pendingResponseType, setPendingResponseType] = useState(null);

  useEffect(() => {
    loadAlert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertId]);

  const loadAlert = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigate('/login');
        return;
      }

      // Try to load as check-in first
      let alertDoc = await getDoc(doc(db, 'checkins', alertId));
      let alertType = 'checkin';

      // If not found, try emergency SOS
      if (!alertDoc.exists()) {
        alertDoc = await getDoc(doc(db, 'emergency_sos', alertId));
        alertType = 'sos';
      }

      if (!alertDoc.exists()) {
        setLoading(false);
        return;
      }

      const alertData = { id: alertDoc.id, ...alertDoc.data(), type: alertType };
      setAlert(alertData);

      // Load user data
      const userDoc = await getDoc(doc(db, 'users', alertData.userId));
      if (userDoc.exists()) {
        setUser(userDoc.data());
      }

      // Check if current user has already responded
      const responsesQuery = query(
        collection(db, 'alert_responses'),
        where('alertId', '==', alertId),
        where('responderId', '==', currentUser.uid)
      );
      const responsesSnap = await getDocs(responsesQuery);

      if (!responsesSnap.empty) {
        setMyResponse(responsesSnap.docs[0].data());
      }
    } catch (error) {
      console.error('Error loading alert:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (responseType, withNote = false) => {
    if (withNote) {
      setPendingResponseType(responseType);
      setShowNoteModal(true);
      return;
    }

    await recordResponse(responseType, '');
  };

  const recordResponse = async (responseType, note) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !alert) return;

    setResponding(true);
    try {
      const now = Timestamp.now();
      const alertCreatedAt = alert.createdAt || alert.alertedAt || now;
      const responseTime = Math.floor((now.toMillis() - alertCreatedAt.toMillis()) / 1000);

      // Create alert response
      await addDoc(collection(db, 'alert_responses'), {
        alertId: alertId,
        alertType: alert.type,
        userId: alert.userId,
        responderId: currentUser.uid,
        responseType: responseType,
        responseTime: responseTime,
        note: note || null,
        createdAt: now,
      });

      // Create interaction record
      await addDoc(collection(db, 'interactions'), {
        userId: alert.userId,
        bestieId: currentUser.uid,
        type: 'alert_response',
        checkInId: alert.type === 'checkin' ? alertId : null,
        alertId: alertId,
        metadata: {
          responseTime: responseTime,
          action: responseType,
        },
        createdAt: now,
      });

      setMyResponse({ responseType, note, createdAt: now });
      setShowNoteModal(false);
      setResponseNote('');
      setPendingResponseType(null);

      const messages = {
        acknowledged: 'Response recorded - they\'ll know you saw this',
        called: 'Great! Hope they\'re okay',
        on_my_way: 'Stay safe! They\'ll be glad you\'re coming',
        contacted_them: 'Thanks for reaching out to them',
      };

      toast.success(messages[responseType] || 'Response recorded');
    } catch (error) {
      console.error('Error recording response:', error);
      toast.error('Failed to record response');
    } finally {
      setResponding(false);
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
      <div className="min-h-screen bg-pattern">
        <Header />
        <div className="max-w-2xl mx-auto p-4 text-center mt-20">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-display text-text-primary mb-2">Alert Not Found</h1>
          <p className="text-text-secondary mb-6">This alert may have been resolved or removed.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isCheckIn = alert.type === 'checkin';
  const isSOS = alert.type === 'sos';

  return (
    <div className="min-h-screen bg-pattern">
      <Header />

      <div className="max-w-2xl mx-auto p-4 pb-20">
        {/* Alert Header */}
        <div className={`card p-6 mb-6 ${isSOS ? 'bg-red-50 border-2 border-red-500' : 'bg-yellow-50 border-2 border-yellow-500'}`}>
          <div className="text-center">
            <div className="text-6xl mb-4">{isSOS ? '🆘' : '🚨'}</div>
            <h1 className="text-3xl font-display text-text-primary mb-2">
              {isSOS ? 'EMERGENCY ALERT' : 'SAFETY ALERT'}
            </h1>
            <p className="text-lg text-text-secondary">
              {user?.displayName || 'A friend'} {isSOS ? 'triggered an emergency SOS' : "hasn't checked in"}
            </p>
          </div>
        </div>

        {/* Alert Details */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-display text-text-primary mb-4">Details</h2>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-text-secondary mb-1">Person</div>
              <div className="font-semibold text-text-primary flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white">
                  {user?.displayName?.[0] || '?'}
                </div>
                {user?.displayName || 'Unknown'}
              </div>
            </div>

            <div>
              <div className="text-sm text-text-secondary mb-1">Location</div>
              <div className="font-semibold text-text-primary">
                {alert.location || 'Unknown'}
              </div>
            </div>

            {isCheckIn && alert.meetingWith && (
              <div>
                <div className="text-sm text-text-secondary mb-1">Meeting With</div>
                <div className="font-semibold text-text-primary">{alert.meetingWith}</div>
              </div>
            )}

            {isCheckIn && alert.notes && (
              <div>
                <div className="text-sm text-text-secondary mb-1">Notes</div>
                <div className="font-semibold text-text-primary">{alert.notes}</div>
              </div>
            )}

            {alert.photoURL && (
              <div>
                <div className="text-sm text-text-secondary mb-1">Photo</div>
                <img
                  src={alert.photoURL}
                  alt="Check-in"
                  className="w-full rounded-xl max-h-64 object-cover"
                />
              </div>
            )}

            <div>
              <div className="text-sm text-text-secondary mb-1">Time</div>
              <div className="font-semibold text-text-primary">
                {alert.createdAt?.toDate().toLocaleString()}
              </div>
            </div>

            {isCheckIn && alert.alertTime && (
              <div>
                <div className="text-sm text-text-secondary mb-1">Expected Check-In By</div>
                <div className="font-semibold text-text-primary">
                  {alert.alertTime.toDate().toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Instructions */}
        <div className="card p-6 bg-primary/10">
          <h3 className="font-display text-lg text-text-primary mb-3">
            What to do:
          </h3>
          <ul className="space-y-2 text-text-secondary">
            <li className="flex gap-2">
              <span>1.</span>
              <span>Try calling or messaging {user?.displayName}</span>
            </li>
            <li className="flex gap-2">
              <span>2.</span>
              <span>Check if they're at the location listed above</span>
            </li>
            <li className="flex gap-2">
              <span>3.</span>
              <span>If you can't reach them, consider contacting local authorities</span>
            </li>
            {isSOS && (
              <li className="flex gap-2 font-semibold text-red-600">
                <span>⚠️</span>
                <span>This is an EMERGENCY - act immediately!</span>
              </li>
            )}
          </ul>
        </div>

        {/* Response Tracking */}
        {myResponse ? (
          <div className="card p-6 mt-6 bg-green-50 border-2 border-green-500">
            <h3 className="font-display text-lg text-text-primary mb-2 flex items-center gap-2">
              <span className="text-2xl">✅</span>
              You responded to this alert
            </h3>
            <div className="text-sm text-text-secondary space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Action:</span>
                <span className="capitalize">{myResponse.responseType.replace(/_/g, ' ')}</span>
              </div>
              {myResponse.note && (
                <div className="flex items-start gap-2 mt-2">
                  <span className="font-semibold">Note:</span>
                  <span className="flex-1">{myResponse.note}</span>
                </div>
              )}
              <div className="text-xs text-gray-500 mt-2">
                Responded {myResponse.createdAt?.toDate().toLocaleString()}
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-6 mt-6 bg-gradient-to-br from-purple-50 to-pink-50">
            <h3 className="font-display text-lg text-text-primary mb-4 text-center">
              Let them know you're here to help
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => handleResponse('acknowledged')}
                disabled={responding}
                className="btn btn-secondary py-3 flex flex-col items-center gap-1"
              >
                <span className="text-2xl">👀</span>
                <span className="text-sm font-semibold">I saw this</span>
              </button>
              <button
                onClick={() => handleResponse('called')}
                disabled={responding}
                className="btn bg-blue-500 hover:bg-blue-600 text-white py-3 flex flex-col items-center gap-1"
              >
                <span className="text-2xl">📞</span>
                <span className="text-sm font-semibold">I called them</span>
              </button>
              <button
                onClick={() => handleResponse('on_my_way')}
                disabled={responding}
                className="btn bg-orange-500 hover:bg-orange-600 text-white py-3 flex flex-col items-center gap-1"
              >
                <span className="text-2xl">🚗</span>
                <span className="text-sm font-semibold">On my way</span>
              </button>
              <button
                onClick={() => handleResponse('contacted_them')}
                disabled={responding}
                className="btn bg-green-500 hover:bg-green-600 text-white py-3 flex flex-col items-center gap-1"
              >
                <span className="text-2xl">✅</span>
                <span className="text-sm font-semibold">Contacted</span>
              </button>
            </div>
            <button
              onClick={() => setShowNoteModal(true)}
              disabled={responding}
              className="w-full btn btn-outline text-sm py-2"
            >
              📝 Add a note about what you did
            </button>
          </div>
        )}

        {/* Contact Info */}
        {user?.phoneNumber && (
          <div className="mt-4">
            <a
              href={`tel:${user.phoneNumber}`}
              className="w-full btn btn-primary text-lg py-4 block text-center"
            >
              📞 Call {user.displayName}
            </a>
          </div>
        )}

        {/* Note Modal */}
        {showNoteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNoteModal(false)}>
            <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-display mb-4">Add a note</h3>
              <textarea
                value={responseNote}
                onChange={(e) => setResponseNote(e.target.value)}
                placeholder="What did you do to help? (optional)"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none min-h-32 resize-none"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowNoteModal(false);
                    setResponseNote('');
                    setPendingResponseType(null);
                  }}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => recordResponse(pendingResponseType || 'acknowledged', responseNote)}
                  disabled={responding}
                  className="flex-1 btn btn-primary"
                >
                  {responding ? 'Saving...' : 'Save Response'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertViewPage;
