import React, { useState } from 'react';
import { Search } from 'lucide-react';
import SearchBottomSheet from '../SearchBottomSheet';

/**
 * Temel kullanım örneği
 * Basic usage example for SearchBottomSheet component
 */
const BasicUsageExample = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchData) => {
    console.log('Arama verileri:', searchData);
    setLoading(true);
    
    try {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock search results
      setSearchResults({
        query: searchData.query,
        filters: searchData.filters,
        totalResults: 25,
        tours: [
          {
            id: 1,
            title: 'Fethiye Göcek Tekne Turu',
            location: 'Muğla, Fethiye',
            price: 12000,
            rating: 4.8
          },
          // ... more results
        ]
      });
    } catch (error) {
      console.error('Arama hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Temel Kullanım</h2>
      
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsSearchOpen(true)}
        className="w-full flex items-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Search className="w-5 h-5 text-gray-400" />
        <span className="text-gray-500 text-left">Nereye gitmek istiyorsunuz?</span>
      </button>

      {/* Search Results */}
      {loading && (
        <div className="mt-4 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-gray-600">Aranıyor...</p>
        </div>
      )}

      {searchResults && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Arama Sonuçları</h3>
          <p className="text-sm text-gray-600 mb-3">
            "{searchResults.query}" için {searchResults.totalResults} sonuç bulundu
          </p>
          
          {searchResults.filters.location && (
            <div className="mb-2">
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                📍 {searchResults.filters.location}
              </span>
            </div>
          )}
          
          {searchResults.filters.category && (
            <div className="mb-2">
              <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                🏷️ {searchResults.filters.category}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Search Bottom Sheet */}
      <SearchBottomSheet
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={handleSearch}
        initialFilters={{}}
      />
    </div>
  );
};

export default BasicUsageExample;