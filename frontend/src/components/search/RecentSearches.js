import React from 'react';
import { Clock, MapPin, Filter, Calendar, X } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const RecentSearches = ({ searches = [], onSelect, onClear }) => {
  const { t } = useTranslation();

  const formatSearchDisplay = (search) => {
    const parts = [];
    
    if (search.filters?.location) {
      parts.push(search.filters.location);
    }
    
    if (search.filters?.category) {
      parts.push(search.filters.category);
    }
    
    if (search.filters?.dateRange?.start && search.filters?.dateRange?.end) {
      const start = new Date(search.filters.dateRange.start);
      const end = new Date(search.filters.dateRange.end);
      parts.push(`${start.toLocaleDateString('tr-TR')} - ${end.toLocaleDateString('tr-TR')}`);
    }
    
    if (search.query) {
      parts.push(search.query);
    }
    
    return parts.length > 0 ? parts.join(' • ') : t('search.recent.noFilters');
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const searchDate = new Date(timestamp);
    const diffInHours = Math.floor((now - searchDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return t('time.justNow');
    } else if (diffInHours < 24) {
      return t('time.hoursAgo', { count: diffInHours });
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return t('time.daysAgo', { count: diffInDays });
    }
  };

  const getSearchIcon = (search) => {
    if (search.filters?.location) return MapPin;
    if (search.filters?.category) return Filter;
    if (search.filters?.dateRange?.start) return Calendar;
    return Clock;
  };

  if (searches.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          {t('search.recent.title')}
        </h3>
        <button
          onClick={onClear}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          aria-label={t('search.recent.clear')}
        >
          {t('search.recent.clearAll')}
        </button>
      </div>
      
      <div className="space-y-2">
        {searches.map((search) => {
          const IconComponent = getSearchIcon(search);
          
          return (
            <button
              key={search.id}
              onClick={() => onSelect(search)}
              className="w-full flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left group"
            >
              <div className="flex-shrink-0 mt-0.5">
                <IconComponent className="w-4 h-4 text-gray-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {formatSearchDisplay(search)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatTimeAgo(search.timestamp)}
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Remove individual search
                  // This would need to be implemented in the parent component
                }}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                aria-label={t('search.recent.remove')}
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </button>
          );
        })}
      </div>
      
      {searches.length >= 5 && (
        <div className="text-center">
          <button
            onClick={onClear}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            {t('search.recent.seeAll')}
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentSearches;