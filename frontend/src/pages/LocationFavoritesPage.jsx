import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Header from '../components/Header';

const LocationFavoritesPage = () => {
  const { currentUser } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [newLocation, setNewLocation] = useState('');
  const [newEmoji, setNewEmoji] = useState('📍');
  const [loading, setLoading] = useState(true);

  const emojiOptions = ['📍', '☕', '🍽️', '🎬', '🍻', '🏠', '🏃', '🛍️', '🎵', '🏢', '🏫', '🏥'];

  useEffect(() => {
    loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadFavorites = async () => {
    if (!currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setFavorites(userDoc.data().favoriteLocations || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newLocation.trim()) {
      toast.error('Please enter a location');
      return;
    }

    if (favorites.length >= 20) {
      toast.error('Maximum 20 favorite locations');
      return;
    }

    const newFavorite = {
      id: Date.now().toString(),
      name: newLocation.trim(),
      emoji: newEmoji,
      usedCount: 0,
    };

    const updated = [...favorites, newFavorite];

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        favoriteLocations: updated,
      });
      setFavorites(updated);
      setNewLocation('');
      setNewEmoji('📍');
      toast.success('Location added!');
    } catch (error) {
      console.error('Error adding favorite:', error);
      toast.error('Failed to add location');
    }
  };

  const handleDelete = async (id) => {
    const updated = favorites.filter(f => f.id !== id);

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        favoriteLocations: updated,
      });
      setFavorites(updated);
      toast.success('Location removed');
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove location');
    }
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
          <h1 className="text-3xl font-display text-text-primary mb-2">Favorite Locations</h1>
          <p className="text-text-secondary">
            Save your frequently visited places for quick check-ins
          </p>
        </div>

        {/* Add New Location */}
        <div className="card p-6 mb-6">
          <h3 className="font-display text-lg text-text-primary mb-4">Add Location</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Choose Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {emojiOptions.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setNewEmoji(emoji)}
                    className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all ${
                      newEmoji === emoji
                        ? 'bg-primary text-white scale-110'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Location Name
              </label>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="input"
                placeholder="e.g., Local Coffee Shop"
                maxLength={50}
              />
            </div>

            <button
              onClick={handleAdd}
              className="w-full btn btn-primary"
            >
              ➕ Add to Favorites
            </button>
          </div>
        </div>

        {/* Favorites List */}
        <div className="mb-6">
          <h3 className="font-display text-lg text-text-primary mb-4">
            Your Favorites ({favorites.length}/20)
          </h3>

          {favorites.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-6xl mb-4">📍</div>
              <h2 className="text-2xl font-display text-text-primary mb-2">
                No favorites yet
              </h2>
              <p className="text-text-secondary">
                Add your frequently visited locations for quick access
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favorites.map((favorite) => (
                <div key={favorite.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-3xl">{favorite.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-text-primary truncate">
                          {favorite.name}
                        </div>
                        {favorite.usedCount > 0 && (
                          <div className="text-sm text-text-secondary">
                            Used {favorite.usedCount} times
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(favorite.id)}
                      className="text-danger hover:bg-danger/10 p-2 rounded-lg transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationFavoritesPage;
