import React, { useRef } from 'react';
import toast from 'react-hot-toast';

const NotesPhotosSection = ({
  notes,
  setNotes,
  photoFiles,
  setPhotoFiles,
  photoPreviews,
  setPhotoPreviews,
  notesExpanded,
  setNotesExpanded,
  photosExpanded,
  setPhotosExpanded
}) => {
  const fileInputRef = useRef(null);

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check if adding these files would exceed the 5 photo limit
    if (photoFiles.length + files.length > 5) {
      toast.error('You can only upload up to 5 photos per check-in');
      return;
    }

    // Validate each file
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Photos must be less than 5MB`);
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return;
      }
    }

    // Add files and previews
    setPhotoFiles([...photoFiles, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPhotoPreviews([...photoPreviews, ...newPreviews]);

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index) => {
    setPhotoFiles(photoFiles.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

  return (
    <div className="card p-6">
      <label className="block text-lg font-display text-text-primary mb-3">
        Notes & Photos (Optional)
      </label>

      {/* Side-by-side buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          type="button"
          onClick={() => {
            setNotesExpanded(!notesExpanded);
            if (!notesExpanded) setPhotosExpanded(false);
          }}
          className={`py-4 px-4 rounded-xl font-semibold transition-all border-2 ${
            notesExpanded
              ? 'bg-gradient-primary text-white border-primary shadow-lg scale-105'
              : notes
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-text-primary hover:border-primary hover:bg-primary/5'
          }`}
        >
          <div className="text-2xl mb-1">📝</div>
          <div className="text-sm">Add Notes</div>
          {notes && !notesExpanded && <div className="text-xs mt-1 opacity-75">✓ Added</div>}
        </button>

        <button
          type="button"
          onClick={() => {
            setPhotosExpanded(!photosExpanded);
            if (!photosExpanded) setNotesExpanded(false);
          }}
          className={`py-4 px-4 rounded-xl font-semibold transition-all border-2 ${
            photosExpanded
              ? 'bg-gradient-primary text-white border-primary shadow-lg scale-105'
              : photoFiles.length > 0
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-text-primary hover:border-primary hover:bg-primary/5'
          }`}
        >
          <div className="text-2xl mb-1">📷</div>
          <div className="text-sm">Add Photos</div>
          {photoFiles.length > 0 && !photosExpanded && (
            <div className="text-xs mt-1 opacity-75">✓ {photoFiles.length}/5</div>
          )}
        </button>
      </div>

      {/* Expandable Notes Section */}
      {notesExpanded && (
        <div className="mb-4 animate-fade-in">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={(e) => {
              // Mobile keyboard "Done" or "Go" button (Enter without shift)
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                setNotesExpanded(false);
                e.target.blur(); // Dismiss keyboard
              }
            }}
            className="input min-h-[120px] resize-none"
            placeholder="Any additional info for your besties..."
            autoFocus
          />
          <button
            type="button"
            onClick={() => setNotesExpanded(false)}
            className="mt-2 w-full btn btn-secondary text-sm py-2"
          >
            Done
          </button>
        </div>
      )}

      {/* Expandable Photos Section */}
      {photosExpanded && (
        <div className="animate-fade-in">
          <div className="text-sm font-semibold text-text-primary mb-2">
            Add Photos ({photoFiles.length}/5)
          </div>

          {/* Photo grid */}
          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              {photoPreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-sm font-bold hover:bg-red-600 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add more photos button */}
          {photoFiles.length < 5 && (
            <div className="mb-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-input"
              />
              <label
                htmlFor="photo-input"
                className="block w-full p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="text-4xl mb-2">📷</div>
                <div className="text-sm text-text-secondary">
                  Click to add photos (up to 5, max 5MB each)
                </div>
              </label>
            </div>
          )}

          <button
            type="button"
            onClick={() => setPhotosExpanded(false)}
            className="w-full btn btn-secondary text-sm py-2"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};

export default NotesPhotosSection;
