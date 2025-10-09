import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const ImageGalleryModal = ({ 
  images, 
  isOpen, 
  onClose, 
  initialIndex = 0 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Update current index when modal opens with new initial index
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      // Center thumbnails around current image
      const thumbnailsToShow = 5;
      const centerStart = Math.max(0, initialIndex - Math.floor(thumbnailsToShow / 2));
      setThumbnailStartIndex(centerStart);
    }
  }, [isOpen, initialIndex]);

  // Navigation functions
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goToPrevious, goToNext]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Thumbnail navigation
  const scrollThumbnails = (direction) => {
    const newStart = direction === 'left' 
      ? Math.max(0, thumbnailStartIndex - 1)
      : Math.min(images.length - 5, thumbnailStartIndex + 1);
    
    setThumbnailStartIndex(newStart);
  };

  // Auto-scroll thumbnails to keep current image visible
  useEffect(() => {
    const thumbnailsToShow = 5;
    const isCurrentVisible = currentIndex >= thumbnailStartIndex && 
                           currentIndex < thumbnailStartIndex + thumbnailsToShow;
    
    if (!isCurrentVisible) {
      const newStart = Math.max(0, Math.min(
        currentIndex - Math.floor(thumbnailsToShow / 2),
        images.length - thumbnailsToShow
      ));
      setThumbnailStartIndex(newStart);
    }
  }, [currentIndex, thumbnailStartIndex, images.length]);

  // Touch/swipe handling for mobile
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  if (!isOpen || !images || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const visibleThumbnails = images.slice(
    thumbnailStartIndex, 
    thumbnailStartIndex + 5
  );

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Image Counter */}
      <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Main Image Container */}
      <div 
        className="relative w-full h-full flex items-center justify-center px-4 pb-24"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Previous Button */}
        <button
          onClick={goToPrevious}
          className="absolute left-2 md:left-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 md:p-3 rounded-full transition-all duration-200 flex items-center justify-center"
        >
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
        </button>

        {/* Main Image */}
        <div className="relative max-w-7xl max-h-full">
          <img
            src={currentImage}
            alt={`Tour image ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onLoad={() => setIsLoading(false)}
            onLoadStart={() => setIsLoading(true)}
            style={{ maxHeight: 'calc(100vh - 200px)' }}
          />
          
          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={goToNext}
          className="absolute right-2 md:right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 md:p-3 rounded-full transition-all duration-200 flex items-center justify-center"
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
        </button>
      </div>

      {/* Thumbnail Strip */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black bg-opacity-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            {/* Left Scroll Arrow */}
            {thumbnailStartIndex > 0 ? (
              <button
                onClick={() => scrollThumbnails('left')}
                className="text-white hover:text-gray-300 p-2 rounded-full bg-black bg-opacity-30 hover:bg-opacity-50 transition-all duration-200"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-9 h-9"></div>
            )}

            {/* Thumbnails */}
            <div className="flex space-x-2 overflow-hidden scrollbar-hide">
              {visibleThumbnails.map((image, index) => {
                const actualIndex = thumbnailStartIndex + index;
                return (
                  <button
                    key={actualIndex}
                    onClick={() => setCurrentIndex(actualIndex)}
                    className={`relative overflow-hidden rounded-lg transition-all duration-200 flex-shrink-0 ${
                      actualIndex === currentIndex
                        ? 'ring-2 ring-white scale-110'
                        : 'hover:scale-105 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${actualIndex + 1}`}
                      className="w-16 h-16 object-cover"
                    />
                    {actualIndex === currentIndex && (
                      <div className="absolute inset-0 bg-white bg-opacity-20"></div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right Scroll Arrow */}
            {thumbnailStartIndex + 5 < images.length ? (
              <button
                onClick={() => scrollThumbnails('right')}
                className="text-white hover:text-gray-300 p-2 rounded-full bg-black bg-opacity-30 hover:bg-opacity-50 transition-all duration-200"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-9 h-9"></div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Hints */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white text-sm opacity-75 md:hidden">
        Kaydırarak gezinebilirsiniz
      </div>
    </div>
  );
};

export default ImageGalleryModal;