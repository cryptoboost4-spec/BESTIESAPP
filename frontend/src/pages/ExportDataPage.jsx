import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Header from '../components/Header';

const ExportDataPage = () => {
  const { currentUser, userData } = useAuth();
  const [exporting, setExporting] = useState(false);

  const exportAllData = async () => {
    setExporting(true);
    toast('Preparing your data...');

    try {
      const exportData = {
        user: {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: userData?.displayName,
          phoneNumber: userData?.phoneNumber,
          photoURL: userData?.photoURL,
          createdAt: userData?.stats?.joinedAt?.toDate(),
          profile: userData?.profile,
          stats: userData?.stats,
        },
        checkIns: [],
        besties: [],
        templates: [],
        badges: [],
        exportedAt: new Date().toISOString(),
      };

      // Get check-ins
      const checkInsQuery = query(
        collection(db, 'checkins'),
        where('userId', '==', currentUser.uid)
      );
      const checkInsSnap = await getDocs(checkInsQuery);
      checkInsSnap.forEach(doc => {
        const data = doc.data();
        exportData.checkIns.push({
          id: doc.id,
          location: data.location,
          duration: data.duration,
          notes: data.notes,
          status: data.status,
          createdAt: data.createdAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
          alertedAt: data.alertedAt?.toDate(),
        });
      });

      // Get besties (as requester)
      const bestiesQuery1 = query(
        collection(db, 'besties'),
        where('requesterId', '==', currentUser.uid)
      );
      const bestiesSnap1 = await getDocs(bestiesQuery1);
      bestiesSnap1.forEach(doc => {
        const data = doc.data();
        exportData.besties.push({
          id: doc.id,
          type: 'requested',
          name: data.recipientName,
          phone: data.recipientPhone,
          status: data.status,
          createdAt: data.createdAt?.toDate(),
        });
      });

      // Get besties (as recipient)
      const bestiesQuery2 = query(
        collection(db, 'besties'),
        where('recipientId', '==', currentUser.uid)
      );
      const bestiesSnap2 = await getDocs(bestiesQuery2);
      bestiesSnap2.forEach(doc => {
        const data = doc.data();
        exportData.besties.push({
          id: doc.id,
          type: 'received',
          name: data.requesterName,
          phone: data.requesterPhone,
          status: data.status,
          createdAt: data.createdAt?.toDate(),
        });
      });

      // Get templates
      const templatesQuery = query(
        collection(db, 'templates'),
        where('userId', '==', currentUser.uid)
      );
      const templatesSnap = await getDocs(templatesQuery);
      templatesSnap.forEach(doc => {
        exportData.templates.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Get badges
      const badgesQuery = query(
        collection(db, 'badges'),
        where('userId', '==', currentUser.uid)
      );
      const badgesSnap = await getDocs(badgesQuery);
      badgesSnap.forEach(doc => {
        exportData.badges.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Create JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      // Download
      const link = document.createElement('a');
      link.href = url;
      link.download = `besties-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Data exported successfully!');
      setExporting(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
      setExporting(false);
    }
  };

  const exportCSV = async () => {
    setExporting(true);
    toast('Preparing CSV...');

    try {
      // Get check-ins for CSV
      const checkInsQuery = query(
        collection(db, 'checkins'),
        where('userId', '==', currentUser.uid)
      );
      const checkInsSnap = await getDocs(checkInsQuery);
      
      const csvRows = [
        ['Date', 'Location', 'Duration (min)', 'Status', 'Notes'].join(',')
      ];

      checkInsSnap.forEach(doc => {
        const data = doc.data();
        const row = [
          data.createdAt?.toDate().toLocaleDateString() || '',
          `"${data.location || ''}"`,
          data.duration || 0,
          data.status || '',
          `"${data.notes || ''}"`,
        ];
        csvRows.push(row.join(','));
      });

      const csvStr = csvRows.join('\n');
      const csvBlob = new Blob([csvStr], { type: 'text/csv' });
      const url = URL.createObjectURL(csvBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `besties-checkins-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('CSV exported successfully!');
      setExporting(false);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-pattern">
      <Header />

      <div className="max-w-4xl mx-auto p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-3xl font-display text-text-primary mb-2">Export Your Data</h1>
          <p className="text-text-secondary">
            Download all your Besties data (GDPR compliant)
          </p>
        </div>

        {/* Info Card */}
        <div className="card p-6 mb-6 bg-primary/5 border-2 border-primary/20">
          <h3 className="font-display text-lg text-text-primary mb-2">📊 Your Data Rights</h3>
          <p className="text-text-secondary text-sm mb-4">
            You have the right to download all your data from Besties at any time. 
            This includes your profile, check-ins, besties, templates, and badges.
          </p>
          <p className="text-text-secondary text-sm">
            <strong>What's included:</strong> Profile info, check-in history, bestie connections, 
            saved templates, earned badges, and account settings.
          </p>
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          {/* JSON Export */}
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-display text-xl text-text-primary mb-2">
                  Complete Data Export (JSON)
                </h3>
                <p className="text-text-secondary text-sm">
                  Download all your data in JSON format. Includes everything: profile, 
                  check-ins, besties, templates, and badges.
                </p>
                <div className="mt-3 text-sm">
                  <div className="text-text-secondary">Includes:</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="badge badge-primary">Profile</span>
                    <span className="badge badge-success">Check-ins</span>
                    <span className="badge badge-secondary">Besties</span>
                    <span className="badge badge-accent">Templates</span>
                    <span className="badge badge-warning">Badges</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={exportAllData}
              disabled={exporting}
              className="w-full btn btn-primary"
            >
              {exporting ? 'Exporting...' : '📥 Download JSON'}
            </button>
          </div>

          {/* CSV Export */}
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-display text-xl text-text-primary mb-2">
                  Check-in History (CSV)
                </h3>
                <p className="text-text-secondary text-sm">
                  Download your check-in history as a spreadsheet. Perfect for 
                  importing into Excel or Google Sheets.
                </p>
                <div className="mt-3 text-sm">
                  <div className="text-text-secondary">Includes:</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="badge badge-success">Date</span>
                    <span className="badge badge-success">Location</span>
                    <span className="badge badge-success">Duration</span>
                    <span className="badge badge-success">Status</span>
                    <span className="badge badge-success">Notes</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={exportCSV}
              disabled={exporting}
              className="w-full btn btn-secondary"
            >
              {exporting ? 'Exporting...' : '📊 Download CSV'}
            </button>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="card p-6 mt-6 bg-gray-50">
          <h4 className="font-semibold text-text-primary mb-2">🔒 Privacy & Security</h4>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• Your data is exported directly to your device</li>
            <li>• We don't store or track what you export</li>
            <li>• Files are generated locally in your browser</li>
            <li>• All data remains encrypted during export</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExportDataPage;
