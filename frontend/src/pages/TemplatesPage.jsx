import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import LoadingSkeleton from '../components/LoadingSkeleton';
import haptic from '../utils/hapticFeedback';

const TemplatesPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'templates'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const temps = [];
        snapshot.forEach((doc) => {
          temps.push({ id: doc.id, ...doc.data() });
        });
        setTemplates(temps);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading templates:', error);
        setTemplates([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleDeleteClick = (template) => {
    haptic.light();
    setTemplateToDelete(template);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    haptic.medium();
    try {
      await deleteDoc(doc(db, 'templates', templateToDelete.id));
      toast.success('Template deleted');
      setShowDeleteModal(false);
      setTemplateToDelete(null);
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleDeleteCancel = () => {
    haptic.light();
    setShowDeleteModal(false);
    setTemplateToDelete(null);
  };

  const handleUse = (template) => {
    navigate('/create', { state: { template } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pattern">
        <LoadingSkeleton type="list" count={3} message="Loading templates... 📝" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pattern">

      <div className="max-w-4xl mx-auto p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-3xl font-display text-text-primary mb-2">My Templates</h1>
          <p className="text-text-secondary">
            Quickly start check-ins with saved templates
          </p>
        </div>

        {templates.length === 0 ? (
          <div className="card p-12 text-center bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-2 border-blue-200 dark:border-blue-700">
            <div className="text-6xl mb-4 animate-bounce-slow">📋</div>
            <h2 className="text-2xl font-display text-text-primary mb-3">
              No templates yet
            </h2>
            <p className="text-text-secondary mb-4">
              Templates let you quickly recreate check-ins you use often
            </p>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 mb-6 max-w-md mx-auto">
              <p className="text-sm font-semibold text-text-primary mb-2">
                💡 How to create templates:
              </p>
              <ol className="text-xs text-text-secondary space-y-1 text-left list-decimal list-inside">
                <li>Create a check-in with your usual settings</li>
                <li>When you mark yourself safe, you'll see an option to save it as a template</li>
                <li>Your saved templates will appear here for quick access</li>
              </ol>
            </div>
            <button
              onClick={() => navigate('/create')}
              className="btn btn-primary"
            >
              Create Your First Check-In →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-display text-xl text-text-primary mb-2">
                      {template.name}
                    </h3>
                    <div className="space-y-1 text-sm text-text-secondary">
                      <div>📍 {template.location}</div>
                      <div>⏰ {template.duration} minutes</div>
                      <div>👥 {template.bestieIds?.length || 0} besties</div>
                      {template.notes && (
                        <div className="italic">💬 {template.notes}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleUse(template)}
                    className="flex-1 btn btn-primary"
                  >
                    Use Template
                  </button>
                  <button
                    onClick={() => handleDeleteClick(template)}
                    className="btn bg-danger text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
                    aria-label="Delete template"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={() => navigate('/create')}
            className="w-full btn btn-secondary"
          >
            ➕ Create New Check-In
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && templateToDelete && (
          <div 
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleDeleteCancel}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-display text-text-primary dark:text-gray-200 mb-3">
                Delete Template?
              </h2>
              <p className="text-text-secondary dark:text-gray-400 mb-6">
                Are you sure you want to delete <strong>"{templateToDelete.name}"</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 btn btn-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 btn bg-danger text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatesPage;
