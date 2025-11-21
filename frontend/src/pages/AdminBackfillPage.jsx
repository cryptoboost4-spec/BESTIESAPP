import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { functions } from '../services/firebase';
import { httpsCallable } from 'firebase/functions';
import Header from '../components/Header';
import toast from 'react-hot-toast';

const AdminBackfillPage = () => {
  const { currentUser, userData } = useAuth();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const runBackfill = async () => {
    if (!window.confirm('Are you sure you want to run the bestieUserIds backfill? This will update all existing bestie relationships.')) {
      return;
    }

    setRunning(true);
    setResult(null);

    try {
      console.log('🚀 Calling backfill function...');
      const backfillFunc = httpsCallable(functions, 'backfillBestieUserIds');
      const response = await backfillFunc();

      console.log('✅ Backfill completed:', response.data);
      setResult(response.data);
      toast.success('Backfill completed successfully!');
    } catch (error) {
      console.error('❌ Backfill failed:', error);
      toast.error(`Backfill failed: ${error.message}`);
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setRunning(false);
    }
  };

  // Check if user is admin
  if (!userData?.isAdmin) {
    return (
      <div className="min-h-screen bg-pattern">
        <Header />
        <div className="max-w-4xl mx-auto p-4 pb-20">
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-display text-text-primary mb-2">Admin Only</h2>
            <p className="text-text-secondary">
              You must be an admin to access this page
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pattern">
      <Header />

      <div className="max-w-4xl mx-auto p-4 pb-20">
        <div className="card p-8">
          <h1 className="text-3xl font-display text-gradient mb-6">
            🔧 Admin Backfill Tools
          </h1>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-display text-yellow-900 mb-3">
              ⚠️ Backfill bestieUserIds
            </h2>
            <p className="text-gray-700 mb-4">
              This will populate the <code className="bg-yellow-100 px-2 py-1 rounded">bestieUserIds</code> array
              for all existing accepted bestie relationships.
            </p>
            <div className="bg-white rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-2">What this does:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>Queries all accepted besties in the database</li>
                <li>For each bestie pair, adds both users to each other's bestieUserIds array</li>
                <li>Enables besties to view each other's profiles (required by Firebase rules)</li>
                <li>Safe to run multiple times (won't create duplicates)</li>
              </ul>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">💡 When to use this:</h3>
              <p className="text-sm text-blue-800">
                Run this if besties can't view each other's profiles or see bestie data.
                This typically happens if the onCreate Cloud Function wasn't deployed when
                bestie relationships were created.
              </p>
            </div>
          </div>

          <button
            onClick={runBackfill}
            disabled={running}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
              running
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-primary hover:scale-105 shadow-lg'
            } text-white`}
          >
            {running ? (
              <span className="flex items-center justify-center gap-3">
                <div className="spinner"></div>
                Running backfill...
              </span>
            ) : (
              '▶️ Run Backfill Now'
            )}
          </button>

          {result && (
            <div className={`mt-6 p-6 rounded-xl ${
              result.success ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
            }`}>
              <h3 className={`text-xl font-display mb-4 ${
                result.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {result.success ? '✅ Success!' : '❌ Failed'}
              </h3>

              {result.success && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-3xl font-bold text-green-700">{result.processed || 0}</div>
                      <div className="text-sm text-gray-600">Besties Processed</div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-3xl font-bold text-blue-700">{result.updated || 0}</div>
                      <div className="text-sm text-gray-600">Successfully Updated</div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-3xl font-bold text-yellow-700">{result.skipped || 0}</div>
                      <div className="text-sm text-gray-600">Skipped</div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-3xl font-bold text-red-700">{result.errors?.length || 0}</div>
                      <div className="text-sm text-gray-600">Errors</div>
                    </div>
                  </div>

                  {result.errors && result.errors.length > 0 && (
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-2">Errors:</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {result.errors.map((err, idx) => (
                          <li key={idx}>
                            Bestie {err.bestieId}: {err.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-green-800 font-semibold mt-4">
                    🎉 All besties should now be able to view each other's profiles!
                  </p>
                </div>
              )}

              {!result.success && (
                <div className="text-red-800">
                  <p className="font-semibold mb-2">Error:</p>
                  <pre className="bg-white p-4 rounded overflow-auto text-sm">
                    {result.error || JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBackfillPage;
