import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Users, 
  Star,
  Heart,
  Grid,
  List,
  SlidersHorizontal
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../App';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ToursPage = () => {
  const { user, setShowLoginModal } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [favorites, setFavorites] = useState(new Set());
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    location: '',
    min_price: '',
    max_price: '',
    duration_days: '',
    min_rating: '',
    max_rating: '',
    classification: ''
  });

  // Dynamic data states
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [durationRange, setDurationRange] = useState({ min: 1, max: 15 });
  const [ratingRange, setRatingRange] = useState({ min: 1, max: 5 });

  useEffect(() => {
    loadFilterData();
    loadTours();
    if (user) {
      loadFavorites();
    }
  }, []);

  useEffect(() => {
    loadTours();
  }, [filters, searchQuery]);

  const loadFilterData = async () => {
    try {
      // Get all tours to calculate ranges
      const toursResponse = await axios.get(`${API}/tours`);
      const allTours = toursResponse.data;

      // Extract unique categories
      const uniqueCategories = [...new Set(allTours.map(tour => tour.category).filter(Boolean))];
      setCategories([
        { value: '', label: 'Tüm Kategoriler' },
        ...uniqueCategories.map(cat => ({ 
          value: cat, 
          label: getCategoryLabel(cat) 
        }))
      ]);

      // Extract unique locations
      const uniqueLocations = [...new Set(allTours.map(tour => tour.location).filter(Boolean))];
      setLocations([
        { value: '', label: 'Tüm Lokasyonlar' },
        ...uniqueLocations.map(loc => ({ value: loc, label: loc }))
      ]);

      // Calculate price ranges from tour dates
      let minPrice = Infinity, maxPrice = 0;
      allTours.forEach(tour => {
        if (tour.tour_dates && tour.tour_dates.length > 0) {
          tour.tour_dates.forEach(date => {
            const singlePrice = date.single_cabin_price || date.price || 0;
            const doublePrice = date.double_cabin_price || date.price || 0;
            const minTourPrice = Math.min(singlePrice, doublePrice);
            const maxTourPrice = Math.max(singlePrice, doublePrice);
            
            if (minTourPrice > 0 && minTourPrice < minPrice) minPrice = minTourPrice;
            if (maxTourPrice > maxPrice) maxPrice = maxTourPrice;
          });
        }
      });
      
      if (minPrice === Infinity) minPrice = 0;
      setPriceRange({ min: Math.floor(minPrice), max: Math.ceil(maxPrice) });

      // Calculate duration range
      const durations = allTours.map(tour => tour.duration_days).filter(d => d > 0);
      if (durations.length > 0) {
        setDurationRange({ 
          min: Math.min(...durations), 
          max: Math.max(...durations) 
        });
      }

      // Rating range is typically 1-5
      setRatingRange({ min: 1, max: 5 });

    } catch (error) {
      console.error('Error loading filter data:', error);
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      'cultural': 'Kültürel Turlar',
      'nature': 'Doğa Turları', 
      'adventure': 'Macera Turları',
      'city': 'Şehir Turları',
      'historical': 'Tarihi Turlar',
      'food': 'Gastronomi Turları',
      'boat': 'Tekne Turları',
      'diving': 'Dalış Turları'
    };
    return labels[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  const loadTours = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.category) params.append('category', filters.category);
      if (filters.location) params.append('location', filters.location);
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);
      if (filters.duration_days) params.append('duration_days', filters.duration_days);
      
      const response = await axios.get(`${API}/tours?${params.toString()}`);
      setTours(response.data);
    } catch (error) {
      console.error('Error loading tours:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    const newSearchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) newSearchParams.set(k, v);
    });
    
    setSearchParams(newSearchParams);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    handleFilterChange('location', searchQuery);
  };

  const loadFavorites = async () => {
    try {
      const response = await axios.get(`${API}/favorites`);
      const favoriteIds = new Set(response.data.map(tour => tour.id));
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (tourId) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    try {
      const isFavorited = favorites.has(tourId);
      
      if (isFavorited) {
        await axios.delete(`${API}/favorites/${tourId}`);
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(tourId);
          return newSet;
        });
        toast.success('Favorilerden çıkarıldı');
      } else {
        await axios.post(`${API}/favorites/${tourId}`);
        setFavorites(prev => new Set([...prev, tourId]));
        toast.success('Favorilere eklendi');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Bir hata oluştu');
    }
  };

  const TourCard = ({ tour, isListView = false }) => (
    <div className={`bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 ${isListView ? 'flex flex-col sm:flex-row' : ''}`}>
      <div className={`relative overflow-hidden ${isListView ? 'w-full sm:w-1/3' : ''}`}>
        <img
          src={tour.images[0] || '/placeholder-tour.jpg'}
          alt={tour.title}
          className={`object-cover group-hover:scale-110 transition-transform duration-300 ${isListView ? 'w-full h-48 sm:h-full' : 'w-full h-48'}`}
        />
        <div className="absolute top-4 right-4">
          <button 
            onClick={() => toggleFavorite(tour.id)}
            className="bg-white/80 backdrop-blur-sm hover:bg-white p-2 rounded-full transition-colors duration-200"
          >
            <Heart 
              className={`w-5 h-5 transition-colors duration-200 ${
                favorites.has(tour.id) 
                  ? 'text-red-500 fill-current' 
                  : 'text-gray-600 hover:text-red-500'
              }`} 
            />
          </button>
        </div>
        {tour.category && (
          <div className="absolute top-4 left-4">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              {tour.category}
            </span>
          </div>
        )}
      </div>

      <div className={`p-4 sm:p-6 ${isListView ? 'flex-1' : ''}`}>
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <MapPin className="w-4 h-4" />
          <span>{tour.location}</span>
        </div>

        <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-2 line-clamp-2">
          {tour.title}
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {tour.short_description}
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(tour.rating || 0)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              ({tour.review_count || 0})
            </span>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{tour.duration_days || 1} gün</span>
            {tour.classification && (
              <span className="text-gray-500 font-medium">
                • {tour.classification.charAt(0).toUpperCase() + tour.classification.slice(1)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-600">
            {(() => {
              if (tour.minimum_price) {
                return `₺${tour.minimum_price.toLocaleString('tr-TR')}`;
              } else if (tour.tour_dates && tour.tour_dates.length > 0) {
                // Fallback: calculate from tour dates
                const allPrices = tour.tour_dates.flatMap(date => [
                  date.single_cabin_price || 0,
                  date.double_cabin_price || 0
                ]).filter(price => price > 0);
                
                return allPrices.length > 0 
                  ? `₺${Math.min(...allPrices).toLocaleString('tr-TR')}` 
                  : `₺${(tour.base_price || 0).toLocaleString('tr-TR')}`;
              } else {
                return `₺${(tour.base_price || 0).toLocaleString('tr-TR')}`;
              }
            })()}
            <span className="text-sm font-normal text-gray-600 ml-1">
              den başlayan
            </span>
          </div>

          <Link
            to={`/tours/${tour.id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Detaylar
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Turları Keşfet</h1>
          
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="flex bg-gray-50 rounded-lg overflow-hidden">
                <div className="flex-1 flex items-center px-4 py-3">
                  <Search className="w-5 h-5 text-gray-400 mr-3" />
                  <input
                    type="text"
                    placeholder="Destinasyon, tur adı veya lokasyon ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 outline-none bg-transparent text-gray-800 placeholder-gray-500"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-3 text-sm sm:text-base transition-colors duration-200"
                >
                  Ara
                </button>
              </div>
            </form>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-1 sm:space-x-2 bg-gray-100 hover:bg-gray-200 px-2 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors duration-200 text-sm sm:text-base"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>Filtreler</span>
              </button>
              
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors duration-200 ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors duration-200 ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Kategori */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lokasyon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lokasyon
                  </label>
                  <select
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {locations.map((loc) => (
                      <option key={loc.value} value={loc.value}>
                        {loc.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sınıflandırma */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sınıflandırma
                  </label>
                  <select
                    value={filters.classification}
                    onChange={(e) => handleFilterChange('classification', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Tüm Sınıflar</option>
                    <option value="standart">Standart</option>
                    <option value="lux">Lux</option>
                    <option value="delux">Delux</option>
                  </select>
                </div>
                
                {/* Fiyat Aralığı */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Fiyat
                  </label>
                  <input
                    type="number"
                    value={filters.min_price}
                    onChange={(e) => handleFilterChange('min_price', e.target.value)}
                    placeholder={`₺${priceRange.min.toLocaleString()}`}
                    min={priceRange.min}
                    max={priceRange.max}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Fiyat
                  </label>
                  <input
                    type="number"
                    value={filters.max_price}
                    onChange={(e) => handleFilterChange('max_price', e.target.value)}
                    placeholder={`₺${priceRange.max.toLocaleString()}`}
                    min={priceRange.min}
                    max={priceRange.max}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                
                {/* Süre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Süre (Gün)
                  </label>
                  <select
                    value={filters.duration_days}
                    onChange={(e) => handleFilterChange('duration_days', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Tüm Süreler</option>
                    {Array.from(
                      { length: durationRange.max - durationRange.min + 1 }, 
                      (_, i) => durationRange.min + i
                    ).map(day => (
                      <option key={day} value={day}>
                        {day} Gün
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* İkinci satır - Puan Aralığı ve Temizle Butonu */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Puan
                  </label>
                  <select
                    value={filters.min_rating}
                    onChange={(e) => handleFilterChange('min_rating', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Tüm Puanlar</option>
                    {[1, 2, 3, 4, 5].map(rating => (
                      <option key={rating} value={rating}>
                        {rating}+ Yıldız
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fiyat Aralığı: ₺{priceRange.min.toLocaleString()} - ₺{priceRange.max.toLocaleString()}
                  </label>
                  <div className="text-xs text-gray-500">
                    Süre Aralığı: {durationRange.min} - {durationRange.max} gün
                  </div>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setFilters({
                        category: '',
                        location: '',
                        min_price: '',
                        max_price: '',
                        duration_days: '',
                        min_rating: '',
                        max_rating: '',
                        classification: ''
                      });
                      setSearchParams(new URLSearchParams());
                    }}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors duration-200 text-sm"
                  >
                    Filtreleri Temizle
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {tours.length} tur bulundu
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-lg animate-pulse">
                <div className="bg-gray-200 h-48"></div>
                <div className="p-6 space-y-4">
                  <div className="bg-gray-200 h-4 rounded"></div>
                  <div className="bg-gray-200 h-6 rounded"></div>
                  <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                  <div className="flex justify-between">
                    <div className="bg-gray-200 h-8 w-20 rounded"></div>
                    <div className="bg-gray-200 h-8 w-16 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tours.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Aradığınız kriterlere uygun tur bulunamadı
            </h3>
            <p className="text-gray-600 mb-6">
              Farklı filtreler deneyerek arama yapmayı deneyin
            </p>
            <button
              onClick={() => {
                setFilters({
                  category: '',
                  location: '',
                  min_price: '',
                  max_price: '',
                  duration_days: ''
                });
                setSearchParams(new URLSearchParams());
                setSearchQuery('');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Filtreleri Temizle
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" 
            : "space-y-4 sm:space-y-6"
          }>
            {tours.map((tour) => (
              <TourCard key={tour.id} tour={tour} isListView={viewMode === 'list'} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToursPage;