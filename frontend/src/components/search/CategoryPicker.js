import React, { useState, useEffect } from 'react';
import { 
  Mountain, 
  Waves, 
  Camera, 
  Utensils, 
  MapPin, 
  History,
  TreePine,
  Compass,
  Check,
  Building,
  Castle,
  Fish,
  Loader2
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const CategoryPicker = ({ 
  value, 
  onChange, 
  suggestions = [], 
  onSuggestionSelect 
}) => {
  const { t } = useTranslation();
  const [availableCategories, setAvailableCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Icon mapping for different icons
  const iconComponents = {
    Camera,
    TreePine,
    Mountain,
    Building,
    Castle,
    Utensils,
    Waves,
    Compass,
    Fish,
    MapPin
  };

  // Simple color scheme - only gray, white, and blue
  const getColorClasses = (color, isSelected) => {
    if (isSelected) {
      return {
        container: 'border-blue-600 bg-blue-50',
        icon: 'bg-blue-600 text-white',
        text: 'text-blue-900'
      };
    }
    return {
      container: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
      icon: 'bg-gray-100 text-gray-600',
      text: 'text-gray-900'
    };
  };

  // Fetch available categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${BACKEND_URL}/api/search/categories`);
        const data = await response.json();
        setAvailableCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback categories
        setAvailableCategories([
          { id: 'kulturel', name: 'Kültürel', icon: 'Camera', color: 'purple', tours: 25, popular: true },
          { id: 'doga', name: 'Doğa', icon: 'TreePine', color: 'green', tours: 18, popular: true },
          { id: 'deniz', name: 'Deniz', icon: 'Waves', color: 'cyan', tours: 30, popular: true }
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const popularCategories = availableCategories.filter(cat => cat.popular);

  const handleCategorySelect = (category) => {
    const newValue = value === category.name ? '' : category.name;
    onChange(newValue);
    onSuggestionSelect?.({ 
      name: category.name, 
      id: category.id, 
      type: 'category' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loadingCategories && (
        <div className="flex justify-center py-8">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-sm text-gray-600">Kategoriler yükleniyor...</span>
          </div>
        </div>
      )}

      {/* Suggestions from Search */}
      {suggestions.length > 0 && !loadingCategories && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            {t('categories.suggestions')}
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {suggestions.map((suggestion, index) => {
              const availableCategory = availableCategories.find(cat => 
                cat.name.toLowerCase().includes(suggestion.name.toLowerCase())
              );
              const IconComponent = availableCategory ? iconComponents[availableCategory.icon] : MapPin;
              
              return (
                <button
                  key={index}
                  onClick={() => onSuggestionSelect(suggestion)}
                  className="flex items-center space-x-3 p-3 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors text-left"
                >
                  <div className="p-2 rounded-lg bg-blue-600">
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{suggestion.name}</div>
                    {suggestion.tours && (
                      <div className="text-sm text-gray-500">
                        {suggestion.tours} {t('common.tours')}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* All Categories */}
      {!loadingCategories && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            {t('categories.all')}
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {availableCategories.map((category) => {
              const IconComponent = iconComponents[category.icon] || MapPin;
              const isSelected = value === category.name;
              const colorClasses = getColorClasses(category.color, isSelected);
              
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${colorClasses.container}`}
                  role="radio"
                  aria-checked={isSelected}
                >
                  <div className={`p-2 rounded-lg ${colorClasses.icon}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`font-medium ${colorClasses.text}`}>{category.name}</div>
                    <div className="text-sm text-gray-500 flex items-center space-x-2">
                      <span>{category.tours} {t('common.tours')}</span>
                      {category.popular && (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                          Popüler
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Category Input */}
      <div className="pt-4 border-t border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('categories.custom')}
        </label>
        <input
          type="text"
          placeholder={t('categories.customPlaceholder')}
          value={!availableCategories.find(cat => cat.name === value) ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};

export default CategoryPicker;