import React from 'react';
import { Search, MapPin, Filter, Star, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const SuggestionsList = ({ 
  suggestions = [], 
  loading = false, 
  error = null, 
  onSelect, 
  emptyMessage 
}) => {
  const { t } = useTranslation();

  const getSuggestionIcon = (suggestion) => {
    switch (suggestion.type) {
      case 'location':
        return MapPin;
      case 'category':
        return Filter;
      case 'tour':
        return Star;
      default:
        return Search;
    }
  };

  const formatSuggestionSubtitle = (suggestion) => {
    const parts = [];
    
    if (suggestion.type === 'tour') {
      if (suggestion.location) parts.push(suggestion.location);
      if (suggestion.category) parts.push(suggestion.category);
      if (suggestion.rating) parts.push(`⭐ ${suggestion.rating}`);
    } else if (suggestion.type === 'location') {
      if (suggestion.region) parts.push(suggestion.region);
      if (suggestion.tours) parts.push(`${suggestion.tours} ${t('common.tours')}`);
    } else if (suggestion.type === 'category') {
      if (suggestion.tours) parts.push(`${suggestion.tours} ${t('common.tours')}`);
    }
    
    return parts.join(' • ');
  };

  // Loading State
  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">
          {t('search.suggestions.title')}
        </h3>
        <div className="flex justify-center py-8">
          <div className="flex items-center space-x-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">{t('search.suggestions.loading')}</span>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">
          {t('search.suggestions.title')}
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              {t('common.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty State
  if (suggestions.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">
          {t('search.suggestions.title')}
        </h3>
        <div className="text-center py-8">
          <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {emptyMessage || t('search.suggestions.empty')}
          </p>
        </div>
      </div>
    );
  }

  // Group suggestions by type
  const groupedSuggestions = suggestions.reduce((groups, suggestion) => {
    const type = suggestion.type || 'general';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(suggestion);
    return groups;
  }, {});

  const typeOrder = ['tour', 'location', 'category', 'general'];
  const typeLabels = {
    tour: t('search.suggestions.tours'),
    location: t('search.suggestions.locations'), 
    category: t('search.suggestions.categories'),
    general: t('search.suggestions.general')
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700">
        {t('search.suggestions.title')} ({suggestions.length})
      </h3>
      
      {typeOrder.map(type => {
        const typeSuggestions = groupedSuggestions[type];
        if (!typeSuggestions || typeSuggestions.length === 0) return null;
        
        return (
          <div key={type} className="space-y-2">
            {Object.keys(groupedSuggestions).length > 1 && (
              <h4 className="text-xs font-medium text-gray-600 px-2">
                {typeLabels[type]} ({typeSuggestions.length})
              </h4>
            )}
            
            <div className="space-y-1">
              {typeSuggestions.map((suggestion, index) => {
                const IconComponent = getSuggestionIcon(suggestion);
                const subtitle = formatSuggestionSubtitle(suggestion);
                
                return (
                  <button
                    key={`${type}-${index}`}
                    onClick={() => onSelect(suggestion)}
                    className="w-full flex items-center space-x-4 p-4 min-h-[64px] hover:bg-gray-50 rounded-lg transition-colors text-left group"
                  >
                    <div className="flex-shrink-0">
                      <div className={`p-3 rounded-lg ${
                        suggestion.type === 'tour' ? 'bg-yellow-100 text-yellow-600' :
                        suggestion.type === 'location' ? 'bg-blue-100 text-blue-600' :
                        suggestion.type === 'category' ? 'bg-purple-100 text-purple-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {suggestion.name || suggestion.title}
                      </div>
                      {subtitle && (
                        <div className="text-sm text-gray-500 truncate">
                          {subtitle}
                        </div>
                      )}
                    </div>
                    
                    {suggestion.trending && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          🔥 {t('common.trending')}
                        </span>
                      </div>
                    )}
                    
                    {suggestion.price && (
                      <div className="flex-shrink-0 text-sm font-medium text-gray-900">
                        ₺{suggestion.price.toLocaleString('tr-TR')}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      
      {suggestions.length > 10 && (
        <div className="text-center py-2">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            {t('search.suggestions.showMore')}
          </button>
        </div>
      )}
    </div>
  );
};

export default SuggestionsList;