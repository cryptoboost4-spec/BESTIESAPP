import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Header from '../components/Header';

const TemplatesPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleDelete = async (templateId) => {
    if (!window.confirm('Delete this template?')) return;

    try {
      await deleteDoc(doc(db, 'templates', templateId));
      toast.success('Template deleted');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleUse = (template) => {
    navigate('/create', { state: { template } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pattern">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pattern">
      <Header />

      <div className="max-w-4xl mx-auto p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-3xl font-display text-text-primary mb-2">My Templates</h1>
          <p className="text-text-secondary">
            Quickly start check-ins with saved templates
          </p>
        </div>

        {templates.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-display text-text-primary mb-2">
              No templates yet
            </h2>
            <p className="text-text-secondary mb-6">
              Save templates when completing check-ins for quick access
            </p>
            <button
              onClick={() => navigate('/create')}
              className="btn btn-primary"
            >
              Create Check-In
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
                    onClick={() => handleDelete(template.id)}
                    className="btn bg-danger text-white hover:bg-red-600"
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
      </div>
    </div>
  );
};

export default TemplatesPage;
