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
  const [availableLocations, setAvailableLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  // Fetch available locations from API
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${BACKEND_URL}/api/search/locations`);
        const data = await response.json();
        setAvailableLocations(data.locations || []);
      } catch (error) {
        console.error('Error fetching locations:', error);
        // Fallback to default locations
        setAvailableLocations([
          { id: 1, name: 'Muğla, Fethiye', tours: 12, popular: true },
          { id: 2, name: 'Muğla, Göcek', tours: 8, popular: true },
          { id: 3, name: 'Antalya, Kaş', tours: 15, popular: true },
          { id: 4, name: 'İzmir, Çeşme', tours: 6, popular: false },
          { id: 5, name: 'Muğla, Bodrum', tours: 10, popular: true }
        ]);
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchLocations();
  }, []);

  const popularLocations = availableLocations.filter(loc => loc.popular);

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

      {/* Available Locations */}
      {suggestions.length === 0 && !loading && !loadingLocations && (
        <div className="space-y-4">
          {/* Popular Locations */}
          {popularLocations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">
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
                    className={`flex items-center justify-between p-5 min-h-[60px] rounded-lg border-2 transition-colors ${
                      value === location.name
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">{location.name}</span>
                    </div>
                    <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {location.tours} {t('common.tours')}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* All Locations */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">
              Tüm Lokasyonlar
            </h3>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {availableLocations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => {
                    onChange(location.name);
                    onSuggestionSelect?.(location);
                  }}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    value === location.name
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-1.5 rounded-md ${location.popular ? 'bg-blue-600' : 'bg-gray-400'}`}>
                      <MapPin className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-medium text-gray-900">{location.name}</span>
                    {location.popular && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                        Popüler
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {location.tours}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading State for Locations */}
      {loadingLocations && (
        <div className="flex justify-center py-8">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-sm text-gray-600">Lokasyonlar yükleniyor...</span>
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