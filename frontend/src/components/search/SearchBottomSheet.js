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
  const [isDesktop, setIsDesktop] = useState(false);
  
  const searchInputRef = useRef(null);
  const bottomSheetRef = useRef(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Keyboard safe area detection
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Desktop detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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

      {/* Modal Container */}
      <div
        ref={bottomSheetRef}
        className={`fixed z-50 bg-white transform transition-all duration-300 border ${
          isDesktop
            ? 'top-20 left-1/2 -translate-x-1/2 rounded-xl shadow-2xl w-[900px] max-h-[600px] border-gray-200'
            : `bottom-0 left-0 right-0 rounded-t-xl border-t-gray-200 ${isExpanded ? 'h-full' : 'h-auto max-h-[90vh]'}`
        } ${className}`}
        style={{ paddingBottom: !isDesktop ? keyboardHeight : 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-title"
      >
        {/* Handle Bar - Mobile Only */}
        {!isDesktop && (
          <div className="flex justify-center py-2">
            <div className="w-8 h-1 bg-gray-300 rounded-full" />
          </div>
        )}

        {/* Header */}
        <div className={`flex items-center justify-between border-b border-gray-200 ${isDesktop ? 'px-6 py-4' : 'px-4 py-3'}`}>
          <h2 id="search-title" className={`font-semibold text-gray-900 ${isDesktop ? 'text-xl' : 'text-lg'}`}>
            {t('search.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search Input */}
        <div className={`border-b border-gray-200 ${isDesktop ? 'px-6 py-4' : 'px-4 py-3'}`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label={t('search.input.label')}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                aria-label={t('search.clear')}
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex border-b border-gray-200 ${isDesktop ? 'px-6' : 'px-4'}`}>
          {[
            { key: 'location', icon: MapPin, label: t('search.tabs.location') },
            { key: 'category', icon: Filter, label: t('search.tabs.category') },
            { key: 'date', icon: Calendar, label: t('search.tabs.date') }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`panel-${tab.key}`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto"
          style={{ 
            maxHeight: isDesktop 
              ? '400px'
              : `calc(90vh - 200px - ${keyboardHeight}px)`
          }}
        >
          {/* Active Tab Content */}
          <div
            id={`panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className={isDesktop ? "p-6" : "p-4"}
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
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 space-y-3">
          <div className="flex space-x-3">
            <button
              onClick={clearFilters}
              className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              {t('search.clear')}
            </button>
            <button
              onClick={handleSearch}
              disabled={!searchQuery && !filters.location && !filters.category}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {t('search.button')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchBottomSheet;