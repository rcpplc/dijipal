import React from 'react';
import { 
  Mountain, 
  Waves, 
  Camera, 
  Utensils, 
  MapPin, 
  History,
  TreePine,
  Compass,
  Check
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const CategoryPicker = ({ 
  value, 
  onChange, 
  suggestions = [], 
  onSuggestionSelect 
}) => {
  const { t } = useTranslation();

  const categories = [
    {
      id: 'kulturel',
      name: t('categories.cultural'),
      icon: Camera,
      color: 'bg-purple-100 text-purple-600',
      tours: 25,
      popular: true
    },
    {
      id: 'doga',
      name: t('categories.nature'),
      icon: TreePine,
      color: 'bg-green-100 text-green-600',
      tours: 18,
      popular: true
    },
    {
      id: 'macera',
      name: t('categories.adventure'),
      icon: Mountain,
      color: 'bg-orange-100 text-orange-600',
      tours: 12,
      popular: false
    },
    {
      id: 'sehir',
      name: t('categories.city'),
      icon: MapPin,
      color: 'bg-blue-100 text-blue-600',
      tours: 20,
      popular: true
    },
    {
      id: 'tarihi',
      name: t('categories.historical'),
      icon: History,
      color: 'bg-amber-100 text-amber-600',
      tours: 15,
      popular: false
    },
    {
      id: 'gastronomi',
      name: t('categories.gastronomy'),
      icon: Utensils,
      color: 'bg-red-100 text-red-600',
      tours: 8,
      popular: false
    },
    {
      id: 'deniz',
      name: t('categories.sea'),
      icon: Waves,
      color: 'bg-cyan-100 text-cyan-600',
      tours: 30,
      popular: true
    },
    {
      id: 'keşif',
      name: t('categories.exploration'),
      icon: Compass,
      color: 'bg-indigo-100 text-indigo-600',
      tours: 10,
      popular: false
    }
  ];

  const popularCategories = categories.filter(cat => cat.popular);
  const allCategories = categories;

  const handleCategorySelect = (category) => {
    const newValue = value === category.id ? '' : category.id;
    onChange(newValue);
    onSuggestionSelect?.({ 
      name: category.name, 
      id: category.id, 
      type: 'category' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Suggestions from Search */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            {t('categories.suggestions')}
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {suggestions.map((suggestion, index) => {
              const category = categories.find(cat => 
                cat.name.toLowerCase().includes(suggestion.name.toLowerCase())
              );
              const IconComponent = category?.icon || MapPin;
              
              return (
                <button
                  key={index}
                  onClick={() => onSuggestionSelect(suggestion)}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  <div className={`p-2 rounded-lg ${category?.color || 'bg-gray-100 text-gray-600'}`}>
                    <IconComponent className="w-4 h-4" />
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