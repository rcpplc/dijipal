import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const LocationPicker = ({ 
  value, 
  onChange, 
  suggestions = [], 
  onSuggestionSelect,
  loading = false,
  error = null 
}) => {
  const { t } = useTranslation();
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const popularLocations = [
    { id: 1, name: 'Muğla, Fethiye', type: 'city', tours: 12 },
    { id: 2, name: 'Muğla, Göcek', type: 'city', tours: 8 },
    { id: 3, name: 'Antalya, Kaş', type: 'city', tours: 15 },
    { id: 4, name: 'İzmir, Çeşme', type: 'city', tours: 6 },
    { id: 5, name: 'Muğla, Bodrum', type: 'city', tours: 10 },
    { id: 6, name: 'Balıkesir, Ayvalık', type: 'city', tours: 4 }
  ];

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert(t('location.error.noSupport'));
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Reverse geocoding API call (mock for now)
          const response = await fetch(`/api/geocoding/reverse?lat=${latitude}&lng=${longitude}`);
          const data = await response.json();
          
          if (data.location) {
            onChange(data.location);
            onSuggestionSelect?.({ name: data.location, type: 'current' });
          }
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          alert(t('location.error.geocoding'));
        } finally {
          setIsGettingLocation(false);
        }
      },
      () => {
        setIsGettingLocation(false);
        alert(t('location.error.permission'));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Current Location Button */}
      <button
        onClick={getCurrentLocation}
        disabled={isGettingLocation}
        className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label={t('location.current.button')}
      >
        {isGettingLocation ? (
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        ) : (
          <Navigation className="w-5 h-5 text-blue-500" />
        )}
        <div className="flex-1 text-left">
          <div className="font-medium text-gray-900">
            {isGettingLocation ? t('location.current.getting') : t('location.current.title')}
          </div>
          <div className="text-sm text-gray-500">
            {t('location.current.subtitle')}
          </div>
        </div>
      </button>

      {/* Error State */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Suggestions List */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 px-2">
            {t('location.suggestions.title')}
          </h3>
          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}
          <div className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestionSelect(suggestion)}
                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <MapPin className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{suggestion.name}</div>
                  {suggestion.region && (
                    <div className="text-sm text-gray-500">{suggestion.region}</div>
                  )}
                </div>
                {suggestion.tours && (
                  <div className="text-xs text-gray-500">
                    {suggestion.tours} {t('common.tours')}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular Locations */}
      {suggestions.length === 0 && !loading && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 px-2">
            {t('location.popular.title')}
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {popularLocations.map((location) => (
              <button
                key={location.id}
                onClick={() => {
                  onChange(location.name);
                  onSuggestionSelect?.(location);
                }}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  value === location.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{location.name}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {location.tours} {t('common.tours')}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {suggestions.length === 0 && !loading && !error && popularLocations.length === 0 && (
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t('location.empty')}</p>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;