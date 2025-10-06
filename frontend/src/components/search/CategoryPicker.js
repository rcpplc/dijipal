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

  // Color mapping for different colors
  const colorClasses = {
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      gradient: 'from-purple-500 to-purple-600',
      selected: 'border-purple-500 bg-gradient-to-r from-purple-50 to-purple-100'
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-600', 
      gradient: 'from-green-500 to-green-600',
      selected: 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50'
    },
    orange: {
      bg: 'bg-orange-100',
      text: 'text-orange-600',
      gradient: 'from-orange-500 to-orange-600',
      selected: 'border-orange-500 bg-gradient-to-r from-orange-50 to-red-50'
    },
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      gradient: 'from-blue-500 to-blue-600',
      selected: 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50'
    },
    amber: {
      bg: 'bg-amber-100',
      text: 'text-amber-600',
      gradient: 'from-amber-500 to-amber-600',
      selected: 'border-amber-500 bg-gradient-to-r from-amber-50 to-yellow-50'
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-600',
      gradient: 'from-red-500 to-red-600',
      selected: 'border-red-500 bg-gradient-to-r from-red-50 to-pink-50'
    },
    cyan: {
      bg: 'bg-cyan-100',
      text: 'text-cyan-600',
      gradient: 'from-cyan-500 to-cyan-600',
      selected: 'border-cyan-500 bg-gradient-to-r from-cyan-50 to-teal-50'
    },
    indigo: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-600',
      gradient: 'from-indigo-500 to-indigo-600',
      selected: 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50'
    },
    teal: {
      bg: 'bg-teal-100',
      text: 'text-teal-600',
      gradient: 'from-teal-500 to-teal-600',
      selected: 'border-teal-500 bg-gradient-to-r from-teal-50 to-green-50'
    },
    gray: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      gradient: 'from-gray-500 to-gray-600',
      selected: 'border-gray-500 bg-gradient-to-r from-gray-50 to-slate-50'
    }
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
          <h3 className="text-sm font-semibold text-gray-800 flex items-center">
            <span className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mr-2"></span>
            {t('categories.suggestions')}
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {suggestions.map((suggestion, index) => {
              const category = availableCategories.find(cat => 
                cat.name.toLowerCase().includes(suggestion.name.toLowerCase())
              );
              const IconComponent = category ? iconComponents[category.icon] : MapPin;
              const colors = category ? colorClasses[category.color] : colorClasses.gray;
              
              return (
                <button
                  key={index}
                  onClick={() => onSuggestionSelect(suggestion)}
                  className="flex items-center space-x-3 p-3 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 text-left"
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${colors.gradient} shadow-sm`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{suggestion.name}</div>
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

      {/* Popular Categories */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">
          {t('categories.popular')}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {popularCategories.map((category) => {
            const IconComponent = category.icon;
            const isSelected = value === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category)}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                role="radio"
                aria-checked={isSelected}
                aria-labelledby={`category-${category.id}`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className={`p-3 rounded-lg ${category.color}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <div 
                      id={`category-${category.id}`}
                      className="text-sm font-medium text-gray-900"
                    >
                      {category.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {category.tours} {t('common.tours')}
                    </div>
                  </div>
                </div>
                
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* All Categories */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">
          {t('categories.all')}
        </h3>
        <div className="space-y-2">
          {allCategories.map((category) => {
            const IconComponent = category.icon;
            const isSelected = value === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                role="radio"
                aria-checked={isSelected}
              >
                <div className={`p-2 rounded-lg ${category.color}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{category.name}</div>
                  <div className="text-sm text-gray-500">
                    {category.tours} {t('common.tours')} {category.popular && `• ${t('categories.popularTag')}`}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-blue-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Category Input */}
      <div className="pt-4 border-t border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('categories.custom')}
        </label>
        <input
          type="text"
          placeholder={t('categories.customPlaceholder')}
          value={!categories.find(cat => cat.id === value) ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};

export default CategoryPicker;