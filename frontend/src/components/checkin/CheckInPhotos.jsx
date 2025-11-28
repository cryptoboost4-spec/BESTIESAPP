import React from 'react';
import { useDarkMode } from '../../contexts/DarkModeContext';

const CheckInPhotos = ({
  photoURLs,
  isAlerted,
  uploadingPhoto,
  onPhotoUpload,
  onRemovePhoto
}) => {
  const { isDark } = useDarkMode();

  return (
    <div className="mb-4">
      <div className="text-sm font-semibold text-text-secondary mb-2">
        Photos ({photoURLs.length}/5)
      </div>

      {/* Placeholder broken image when no photos */}
      {photoURLs.length === 0 && (
        <div className={`mb-3 p-8 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'} flex flex-col items-center justify-center border-2 border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
          <div className="text-6xl mb-2 opacity-50">🖼️</div>
          <div className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No photos yet</div>
        </div>
      )}

      {/* Photo grid */}
      {photoURLs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          {photoURLs.map((url, index) => (
            <div key={index} className="relative aspect-square">
              <img
                src={url}
                alt={`Check-in ${index + 1}`}
                className="w-full h-full object-cover rounded-xl"
              />
              {!isAlerted && (
                <button
                  onClick={() => onRemovePhoto(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-sm font-bold hover:bg-red-600 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add more photos */}
      {!isAlerted && photoURLs.length < 5 && (
        <label className={`border-2 border-dashed ${isDark ? 'border-gray-600 hover:bg-primary/10' : 'border-gray-300 hover:bg-primary/5'} rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all`}>
          <div className="text-4xl mb-2">📷</div>
          <div className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {uploadingPhoto ? 'Uploading...' : photoURLs.length > 0 ? 'Add More Photos' : 'Add Photos'}
          </div>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            Click to upload (up to 5, max 5MB each)
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onPhotoUpload}
            className="hidden"
            disabled={uploadingPhoto}
          />
        </label>
      )}
    </div>
  );
};

export default CheckInPhotos;
