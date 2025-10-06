import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Filter, 
  X, 
  Clock, 
  Star,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useDebounce } from '../hooks/useDebounce';
import LocationPicker from './LocationPicker';
import CategoryPicker from './CategoryPicker';
import DateRangePicker from './DateRangePicker';
import RecentSearches from './RecentSearches';
import SuggestionsList from './SuggestionsList';

const SearchBottomSheet = ({ 
  isOpen = false, 
  onClose, 
  onSearch,
  initialFilters = {},
  className = ""
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('location'); // 'location', 'category', 'date'
  const [filters, setFilters] = useState({
    location: '',
    category: '',
    dateRange: { start: null, end: null },
    ...initialFilters
  });
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const searchInputRef = useRef(null);
  const bottomSheetRef = useRef(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Keyboard safe area detection
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const handleKeyboard = () => {
      if (window.visualViewport) {
        const height = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(height);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleKeyboard);
      return () => window.visualViewport.removeEventListener('resize', handleKeyboard);
    }
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tour_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Fetch suggestions when search query changes
  useEffect(() => {
    if (debouncedSearchQuery.length > 2) {
      fetchSuggestions(debouncedSearchQuery);
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearchQuery]);

  const fetchSuggestions = async (query) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&type=${activeTab}`);
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      setError(t('search.error.suggestions'));
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const saveRecentSearch = useCallback((searchData) => {
    const newSearch = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...searchData
    };
    
    const updated = [newSearch, ...recentSearches.slice(0, 4)];
    setRecentSearches(updated);
    localStorage.setItem('tour_recent_searches', JSON.stringify(updated));
  }, [recentSearches]);

  const handleSearch = useCallback(() => {
    const searchData = {
      query: searchQuery,
      filters,
      timestamp: new Date().toISOString()
    };
    
    saveRecentSearch(searchData);
    onSearch?.(searchData);
    onClose?.();
  }, [searchQuery, filters, onSearch, onClose, saveRecentSearch]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleSuggestionSelect = useCallback((suggestion) => {
    if (activeTab === 'location') {
      setFilters(prev => ({ ...prev, location: suggestion.name }));
    } else if (activeTab === 'category') {
      setFilters(prev => ({ ...prev, category: suggestion.name }));
    }
    setSearchQuery(suggestion.name);
  }, [activeTab]);

  const clearFilters = useCallback(() => {
    setFilters({
      location: '',
      category: '',
      dateRange: { start: null, end: null }
    });
    setSearchQuery('');
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'location':
        return (
          <LocationPicker
            value={filters.location}
            onChange={(value) => handleFilterChange('location', value)}
            suggestions={suggestions}
            onSuggestionSelect={handleSuggestionSelect}
            loading={loading}
            error={error}
          />
        );
      case 'category':
        return (
          <CategoryPicker
            value={filters.category}
            onChange={(value) => handleFilterChange('category', value)}
            suggestions={suggestions}
            onSuggestionSelect={handleSuggestionSelect}
          />
        );
      case 'date':
        return (
          <DateRangePicker
            value={filters.dateRange}
            onChange={(value) => handleFilterChange('dateRange', value)}
          />
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        ref={bottomSheetRef}
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-xl z-50 transform transition-transform duration-300 ${
          isExpanded ? 'h-full' : 'h-auto max-h-[90vh]'
        } ${className}`}
        style={{ paddingBottom: keyboardHeight }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-title"
      >
        {/* Handle Bar */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full shadow-sm" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
          <h2 id="search-title" className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
            <span>{t('search.title')}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/80 hover:shadow-md rounded-xl transition-all duration-200 bg-white/60"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-blue-200">
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Search className="w-4 h-4 text-white" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full pl-16 pr-12 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 text-gray-800 font-medium shadow-sm"
              aria-label={t('search.input.label')}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 hover:bg-red-100 rounded-xl transition-all duration-200 bg-gray-100"
                aria-label={t('search.clear')}
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 bg-white">
          {[
            { key: 'location', icon: MapPin, label: t('search.tabs.location'), color: 'from-green-500 to-teal-500' },
            { key: 'category', icon: Filter, label: t('search.tabs.category'), color: 'from-purple-500 to-pink-500' },
            { key: 'date', icon: Calendar, label: t('search.tabs.date'), color: 'from-orange-500 to-red-500' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 border-b-3 transition-all duration-300 relative ${
                activeTab === tab.key
                  ? `border-transparent`
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`panel-${tab.key}`}
            >
              <div className={`p-2 rounded-lg transition-all duration-300 ${
                activeTab === tab.key 
                  ? `bg-gradient-to-r ${tab.color} shadow-lg transform scale-110` 
                  : 'bg-gray-100'
              }`}>
                <tab.icon className={`w-4 h-4 ${activeTab === tab.key ? 'text-white' : 'text-gray-600'}`} />
              </div>
              <span className={`text-sm font-bold transition-colors ${
                activeTab === tab.key ? 'text-gray-900' : 'text-gray-600'
              }`}>
                {tab.label}
              </span>
              {activeTab === tab.key && (
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${tab.color} rounded-t-lg`} />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto"
          style={{ maxHeight: `calc(90vh - 200px - ${keyboardHeight}px)` }}
        >
          {/* Active Tab Content */}
          <div
            id={`panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className="p-4"
          >
            {renderTabContent()}
          </div>

          {/* Recent Searches */}
          {!searchQuery && recentSearches.length > 0 && (
            <div className="px-4 pb-4">
              <RecentSearches
                searches={recentSearches}
                onSelect={(search) => {
                  setFilters(search.filters);
                  setSearchQuery(search.query);
                }}
                onClear={() => {
                  setRecentSearches([]);
                  localStorage.removeItem('tour_recent_searches');
                }}
              />
            </div>
          )}

          {/* Suggestions List */}
          {searchQuery && (
            <div className="px-4 pb-4">
              <SuggestionsList
                suggestions={suggestions}
                loading={loading}
                error={error}
                onSelect={handleSuggestionSelect}
                emptyMessage={t('search.suggestions.empty')}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gradient-to-r from-white to-blue-50 border-t-2 border-blue-200 p-6 space-y-4">
          <div className="flex space-x-4">
            <button
              onClick={clearFilters}
              className="flex-1 py-4 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-2xl font-bold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {t('search.clear')} 🗑️
            </button>
            <button
              onClick={handleSearch}
              disabled={!searchQuery && !filters.location && !filters.category}
              className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-2xl font-bold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {t('search.button')} 🔍
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchBottomSheet;