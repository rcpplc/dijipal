import React, { useState, useEffect } from 'react';
import { MapPin, Filter, Calendar, Star } from 'lucide-react';
import SearchBottomSheet from '../SearchBottomSheet';
import { useTranslation } from '../hooks/useTranslation';

/**
 * Gelişmiş kullanım örneği
 * Advanced usage example with custom features
 */
const AdvancedUsageExample = () => {
  const { t, locale, changeLocale } = useTranslation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [quickFilters, setQuickFilters] = useState({
    location: '',
    category: '',
    dateRange: { start: null, end: null }
  });

  // Load search history
  useEffect(() => {
    const savedHistory = localStorage.getItem('tour_recent_searches');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleAdvancedSearch = async (searchData) => {
    console.log('Gelişmiş arama:', searchData);
    
    // Advanced search analytics
    const analyticsData = {
      searchId: Date.now(),
      query: searchData.query,
      filters: searchData.filters,
      locale: locale,
      timestamp: new Date().toISOString(),
      source: 'advanced_search_component'
    };
    
    // Send analytics (mock)
    console.log('Analytics:', analyticsData);
    
    // Perform search with additional parameters
    try {
      const searchParams = {
        ...searchData,
        page: 1,
        limit: 20,
        sortBy: 'relevance',
        includeAnalytics: true
      };
      
      // Mock API call with advanced features
      const response = await mockAdvancedSearch(searchParams);
      
      // Handle results with filtering and sorting
      processSearchResults(response);
      
    } catch (error) {
      console.error('Advanced search error:', error);
      // Error handling with user notification
      showErrorNotification(error.message);
    }
  };

  const mockAdvancedSearch = async (params) => {
    // Simulate advanced search with sorting, filtering, and analytics
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      results: [
        {
          id: 1,
          title: 'Premium Fethiye Göcek Luxury Yacht',
          location: 'Muğla, Fethiye',
          category: 'Luxury Sea Tours',
          price: 25000,
          rating: 4.9,
          reviewCount: 128,
          availability: 'High',
          tags: ['Luxury', 'All Inclusive', 'Captain Included'],
          relevanceScore: 0.95
        },
        {
          id: 2,
          title: 'Boutique Bodrum Bay Discovery',
          location: 'Muğla, Bodrum',
          category: 'Cultural Tours',
          price: 8500,
          rating: 4.7,
          reviewCount: 89,
          availability: 'Medium',
          tags: ['Cultural', 'Small Group', 'Local Guide'],
          relevanceScore: 0.87
        }
      ],
      totalCount: 47,
      facets: {
        categories: {
          'Luxury Sea Tours': 12,
          'Cultural Tours': 15,
          'Adventure Tours': 8,
          'Nature Tours': 12
        },
        priceRanges: {
          '0-5000': 15,
          '5001-15000': 20,
          '15001-30000': 8,
          '30001+': 4
        }
      },
      suggestions: [
        'Try "yacht tour" for luxury options',
        'Consider "weekend getaway" for short trips'
      ]
    };
  };

  const processSearchResults = (response) => {
    console.log('Processing results:', response);
    
    // Advanced result processing
    const enhancedResults = response.results.map(result => ({
      ...result,
      pricePerPerson: Math.round(result.price / 4), // Assuming 4 people
      availabilityColor: getAvailabilityColor(result.availability),
      matchScore: calculateMatchScore(result, quickFilters)
    }));
    
    // Sort by relevance and match score
    enhancedResults.sort((a, b) => 
      (b.relevanceScore * 0.7 + b.matchScore * 0.3) - 
      (a.relevanceScore * 0.7 + a.matchScore * 0.3)
    );
    
    console.log('Enhanced results:', enhancedResults);
  };

  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case 'High': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateMatchScore = (result, filters) => {
    let score = 0;
    
    if (filters.location && result.location.includes(filters.location)) {
      score += 0.4;
    }
    
    if (filters.category && result.category.includes(filters.category)) {
      score += 0.4;
    }
    
    // Price range matching logic would go here
    score += 0.2; // Base score
    
    return Math.min(score, 1.0);
  };

  const showErrorNotification = (message) => {
    // In a real app, this would show a toast or notification
    console.error('User notification:', message);
  };

  const handleQuickFilter = (type, value) => {
    setQuickFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const clearAllFilters = () => {
    setQuickFilters({
      location: '',
      category: '',
      dateRange: { start: null, end: null }
    });
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Header with Language Toggle */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">{t('search.title')} - Advanced</h2>
        <select 
          value={locale} 
          onChange={(e) => changeLocale(e.target.value)}
          className="px-3 py-1 border rounded"
        >
          <option value="tr">🇹🇷 TR</option>
          <option value="en">🇬🇧 EN</option>
        </select>
      </div>

      {/* Quick Filters */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Filters</h3>
        <div className="grid grid-cols-1 gap-3">
          {/* Location Quick Filter */}
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <select
              value={quickFilters.location}
              onChange={(e) => handleQuickFilter('location', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Locations</option>
              <option value="Fethiye">Fethiye</option>
              <option value="Bodrum">Bodrum</option>
              <option value="Kaş">Kaş</option>
            </select>
          </div>

          {/* Category Quick Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={quickFilters.category}
              onChange={(e) => handleQuickFilter('category', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Categories</option>
              <option value="Luxury">Luxury Tours</option>
              <option value="Cultural">Cultural Tours</option>
              <option value="Adventure">Adventure Tours</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(quickFilters.location || quickFilters.category) && (
          <button
            onClick={clearAllFilters}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Advanced Search Trigger */}
      <button
        onClick={() => setIsSearchOpen(true)}
        className="w-full flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
      >
        <div className="flex items-center space-x-2 text-gray-600">
          <MapPin className="w-5 h-5" />
          <Filter className="w-5 h-5" />
          <Calendar className="w-5 h-5" />
        </div>
        <span className="text-gray-700 font-medium">
          {t('search.placeholder')} (Advanced)
        </span>
      </button>

      {/* Search History Preview */}
      {searchHistory.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Searches</h3>
          <div className="space-y-2">
            {searchHistory.slice(0, 3).map((search) => (
              <button
                key={search.id}
                onClick={() => {
                  setQuickFilters(search.filters);
                  setIsSearchOpen(true);
                }}
                className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded border"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {search.query || 'No query'}
                  </span>
                  <div className="text-xs text-gray-500">
                    {search.filters.location && `📍 ${search.filters.location}`}
                    {search.filters.category && ` 🏷️ ${search.filters.category}`}
                  </div>
                </div>
                <Star className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Search Bottom Sheet */}
      <SearchBottomSheet
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={handleAdvancedSearch}
        initialFilters={quickFilters}
        className="advanced-search-theme"
      />

      {/* Performance Monitoring Info */}
      <div className="mt-6 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
        <div className="flex justify-between items-center">
          <span>Search Performance:</span>
          <span>Debounce: 300ms | Cache: Enabled</span>
        </div>
      </div>
    </div>
  );
};

export default AdvancedUsageExample;