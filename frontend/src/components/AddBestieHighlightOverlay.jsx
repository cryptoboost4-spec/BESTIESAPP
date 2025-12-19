import React, { useEffect, useState } from 'react';

/**
 * AddBestieHighlightOverlay - Highlights only the add bestie buttons
 * Shows a dark overlay with spotlight on empty slot buttons
 */
const AddBestieHighlightOverlay = ({ emptySlotRefs }) => {
  const [highlightRects, setHighlightRects] = useState([]);

  useEffect(() => {
    const updateHighlights = () => {
      const rects = emptySlotRefs
        .filter(ref => ref?.current)
        .map(ref => {
          const rect = ref.current.getBoundingClientRect();
          return {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          };
        });
      setHighlightRects(rects);
    };

    updateHighlights();
    window.addEventListener('resize', updateHighlights);
    window.addEventListener('scroll', updateHighlights);

    // Update periodically in case of layout changes
    const interval = setInterval(updateHighlights, 100);

    return () => {
      window.removeEventListener('resize', updateHighlights);
      window.removeEventListener('scroll', updateHighlights);
      clearInterval(interval);
    };
  }, [emptySlotRefs]);

  if (highlightRects.length === 0) return null;

  return (
    <>
      {/* Dark Overlay */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[55] transition-opacity duration-300"
        style={{ pointerEvents: 'auto' }}
        aria-hidden="true"
      />

      {/* Highlighted Buttons - Glow effect */}
      {highlightRects.map((rect, index) => (
        <React.Fragment key={index}>
          {/* Glow effect around button */}
          <div
            className="fixed z-[57] pointer-events-none transition-all duration-500"
            style={{
              top: `${rect.top - 8}px`,
              left: `${rect.left - 8}px`,
              width: `${rect.width + 16}px`,
              height: `${rect.height + 16}px`,
              borderRadius: '50%',
              boxShadow: '0 0 30px 8px rgba(168, 85, 247, 0.6), 0 0 60px 12px rgba(236, 72, 153, 0.4)',
              filter: 'brightness(1.3)',
            }}
          />
          {/* Ensure highlighted button is clickable above overlay */}
          <div
            className="fixed z-[58] pointer-events-auto"
            style={{
              top: `${rect.top}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </React.Fragment>
      ))}
    </>
  );
};

export default AddBestieHighlightOverlay;




