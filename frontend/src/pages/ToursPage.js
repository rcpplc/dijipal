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
  SlidersHorizontal,
  ChevronDown,
  Mountain,
  Waves,
  Building,
  Trees,
  X
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
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
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

  // Close location dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLocationDropdown && !event.target.closest('.relative')) {
        setShowLocationDropdown(false);
      }
    };

    if (showLocationDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLocationDropdown]);

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
      
      if (searchQuery) params.append('search', searchQuery);
      if (filters.category) params.append('category', filters.category);
      if (filters.location) params.append('location', filters.location);
      if (filters.classification) params.append('classification', filters.classification);
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);
      if (filters.duration_days) params.append('duration_days', filters.duration_days);
      if (filters.min_rating) params.append('min_rating', filters.min_rating);
      
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
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="flex-1 flex items-center px-4 py-3">
                  <Search className="w-5 h-5 text-gray-400 mr-3" />
                  <input
                    type="text"
                    placeholder="Destinasyon, tur adı ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 outline-none bg-transparent text-gray-800 placeholder-gray-400"
                  />
                </div>
                {/* ÇALIŞAN LOCATION DROPDOWN - Native Select */}
                <div className="sm:border-l border-gray-200 px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <select
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer min-w-[200px] font-medium shadow-sm hover:border-gray-400 transition-colors"
                    >
                      {locations.map((location, index) => {
                        // Her lokasyon için uygun emoji iconunu seçelim
                        let icon = '📍'; // Varsayılan
                        if (location.label && location.label !== 'Tüm Lokasyonlar') {
                          const locationName = location.label.toLowerCase();
                          if (locationName.includes('fethiye') || locationName.includes('göcek')) {
                            icon = '🌊'; // Deniz iconı
                          } else if (locationName.includes('istanbul') || locationName.includes('ankara')) {
                            icon = '🏙️'; // Şehir iconı  
                          } else if (locationName.includes('trabzon') || locationName.includes('rize')) {
                            icon = '🌲'; // Orman iconı
                          }
                        }
                        
                        return (
                          <option key={location.value || index} value={location.value}>
                            {icon} {location.label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
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
            <div className="mt-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Filtreler</h3>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Kategori */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Kategori
                    </label>
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm transition-all"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sınıflandırma */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Sınıflandırma
                    </label>
                    <select
                      value={filters.classification}
                      onChange={(e) => handleFilterChange('classification', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm transition-all"
                    >
                      <option value="">Tüm Sınıflar</option>
                      <option value="standart">Standart</option>
                      <option value="lux">Lux</option>
                      <option value="delux">Delux</option>
                    </select>
                  </div>

                  {/* Süre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Süre
                    </label>
                    <select
                      value={filters.duration_days}
                      onChange={(e) => handleFilterChange('duration_days', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm transition-all"
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

                  {/* Min Puan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Minimum Puan
                    </label>
                    <select
                      value={filters.min_rating}
                      onChange={(e) => handleFilterChange('min_rating', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm transition-all"
                    >
                      <option value="">Tüm Puanlar</option>
                      {[1, 2, 3, 4, 5].map(rating => (
                        <option key={rating} value={rating}>
                          {rating}+ Yıldız
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Fiyat Aralığı - Basit ve Çalışan */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Min Fiyat */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Min Fiyat
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₺</span>
                        <input
                          type="number"
                          value={filters.min_price}
                          onChange={(e) => handleFilterChange('min_price', e.target.value)}
                          placeholder={priceRange.min.toLocaleString()}
                          min={priceRange.min}
                          max={priceRange.max}
                          className="w-full pl-8 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm transition-all"
                        />
                      </div>
                    </div>

                    {/* Max Fiyat */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Max Fiyat
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₺</span>
                        <input
                          type="number"
                          value={filters.max_price}
                          onChange={(e) => handleFilterChange('max_price', e.target.value)}
                          placeholder={priceRange.max.toLocaleString()}
                          min={priceRange.min}
                          max={priceRange.max}
                          className="w-full pl-8 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  
                  {/* Filtre Temizle */}
                  <div className="flex justify-end items-center mt-4">
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
                      className="flex items-center space-x-2 px-3 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200 rounded-md"
                      title="Filtreleri Temizle"
                    >
                      <span className="text-sm font-medium">Filtreyi temizle</span>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
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

      {/* Kabin Kiralama Sektörü Hakkında */}
      <div className="mt-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Kabin Kiralama: Denizde Özgürlüğün Adresi
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Turkiye'nin eşsiz kıyılarında unutulmaz anılar biriktirin. Kabin kiralama ile denizde geçireceğiniz tatil, size tamamen özgür bir deneyim sunar.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="prose prose-lg max-w-none">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Kabin Kiralama Nedir?</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                Kabin kiralama, deniz tutkunlarının teknelerde özel kabinleri kiralayarak, günlük yaşamın stresinden uzaklaştığı eşsiz bir tatil deneyimidir. Bu konsept, özellikle Türkiye'nin Akdeniz ve Ege kıyılarında son yıllarda büyük popülerlik kazanmıştır. Geleneksel otel konaklamasından farklı olarak, misafirler denizin ortasında uyandığı, balık sesleri ve dalga seslerinin eşlik ettiği bir tatil geçirir.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Sektörün Gelişimi ve Önemi</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                Türkiye'de kabin kiralama sektörü, 2010'lu yıllardan itibaren hızla büyümeye başlamıştır. Özellikle pandemi sonrası dönemde, sosyal mesafeyi koruyarak tatil yapma ihtiyacı bu sektörü daha da öne çıkarmıştır. Fethiye, Marmaris, Bodrum, Kaş ve Antalya gibi destinasyonlar, kabin kiralama turizmi için Türkiye'nin öncü bölgeleri haline gelmiştir.
              </p>
              
              <p className="text-gray-700 leading-relaxed mb-6">
                Sektör, yıllık %15-20 büyüme oranıyla Türk turizm ekonomisine önemli katkı sağlamaktadır. 2023 verilerine göre, kabin kiralama sektörü yaklaşık 2 milyar dolarlık bir ekonomik hacme ulaşmıştır ve bu rakamın 2025 yılında 3.5 milyar doları bulması beklenmektedir.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Kabin Türleri ve Özellikleri</h3>
              <div className="space-y-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Standart Kabinler</h4>
                  <p className="text-gray-700 text-sm">Ekonomik seçenekler arayan misafirler için tasarlanmış, temel konfor unsurlarını içeren kabinler. Genellikle 2 kişilik yatak, dolap ve küçük banyo içerir.</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Lüks Kabinler</h4>
                  <p className="text-gray-700 text-sm">Daha geniş alan, panoramik pencereler, kaliteli mobilyalar ve ekstra konfora sahip kabinler. Klima, minibar ve çalışma masası gibi ek olanaklar sunar.</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Delüks Kabinler</h4>
                  <p className="text-gray-700 text-sm">En üst düzey konfor ve lüks sunan kabinler. Geniş yatak odası, oturma alanı, özel banyo, balkon ve VIP hizmetler içerir.</p>
                </div>
              </div>
            </div>

            <div className="prose prose-lg max-w-none">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Neden Kabin Kiralama?</h3>
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <Waves className="w-6 h-6 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Eşsiz Deneyim</h4>
                    <p className="text-gray-700 text-sm">Her gün farklı bir koyu keşfetme, kristal berraklığındaki sularda yüzme ve balık tutma imkanı.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Heart className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Özel Alan</h4>
                    <p className="text-gray-700 text-sm">Kalabalıktan uzak, sadece sizin grubunuzla paylaştığınız özel bir tatil alanı.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Star className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Kaliteli Hizmet</h4>
                    <p className="text-gray-700 text-sm">Deneyimli mürettebat ile 7/24 hizmet, özel yemek menüleri ve kişiselleştirilmiş aktiviteler.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Esnek Rotalar</h4>
                    <p className="text-gray-700 text-sm">İstediğiniz destinasyonları ziyaret etme, program değişiklikleri yapabilme esnekliği.</p>
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Popüler Destinasyonlar</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                Türkiye'nin 8.000 kilometrelik sahil şeridi, kabin kiralama için sayısız seçenek sunar. Fethiye-Göcek-Kaş üçgeni, berrak suları ve korumalı koylarıyla en popüler rotadır. Bodrum ve çevresindeki adalar, tarihi dokusu ve canlı gece hayatıyla farklı bir deneyim sunar. Antalya'dan başlayan rotalar ise antik şehirleri keşfetme fırsatı verir.
              </p>

              <p className="text-gray-700 leading-relaxed mb-6">
                Her destinasyon kendine özgü güzellikleri barındırır: Butterfly Valley'in eşsiz doğası, Kalkan'ın otantik balıkçı köyü atmosferi, Olympos'un tarihi kalıntıları ve Çıralı'nın yanmayan ateşi. Bu çeşitlilik, her turiste kendine uygun bir rota bulma imkanı sağlar.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Sürdürülebilir Turizm</h3>
              <p className="text-gray-700 leading-relaxed">
                Modern kabin kiralama sektörü, çevre bilinci ve sürdürülebilir turizm anlayışını benimser. Deniz ekosistemlerinin korunması, atık yönetimi ve yerel toplulukların desteklenmesi sektörün temel değerleridir. Birçok işletme, karbon ayak izini azaltmak için güneş enerjisi kullanımı, su tasarrufu sistemleri ve geri dönüştürülmüş malzemeler kullanmaktadır.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SSS Bölümü */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Sıkça Sorulan Sorular</h2>
            <p className="text-lg text-gray-600">Kabin kiralama hakkında merak ettikleriniz</p>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Kabin kiralama maliyeti nasıl hesaplanır?</h3>
              <p className="text-gray-700">
                Kabin kiralama fiyatları; sezon, kabin türü, tur süresi ve dahil edilen hizmetlere göre değişir. Standart kabinler günlük 800-1500 TL, lüks kabinler 1500-2500 TL, delüks kabinler ise 2500-4000 TL arasında fiyatlandırılır. Fiyatlara genellikle yakıt, mürettebat, temel yemekler ve sigorta dahildir.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Rezervasyon yaparken nelere dikkat etmeliyim?</h3>
              <p className="text-gray-700">
                Rezervasyon öncesi teknenin lisans durumunu, sigorta belgelerini ve mürettebatın sertifikalarını kontrol edin. İptal politikalarını okuyun ve hava durumu nedeniyle değişiklik durumlarını öğrenin. Tur rotası, dahil olan yemekler ve ekstra ücretlendirmeler hakkında detaylı bilgi alın.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Hava durumu kötüyse ne olur?</h3>
              <p className="text-gray-700">
                Güvenlik nedeniyle seferin iptali durumunda, %100 iade veya alternatif tarih seçeneği sunulur. Hafif yağmur gibi durumlar için kapalı alanları olan tekneler tercih edilebilir. Meteoroloji raporları sürekli takip edilir ve misafirler önceden bilgilendirilir.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tekneye getirilebilecek eşyalar konusunda kısıtlama var mı?</h3>
              <p className="text-gray-700">
                Alkol getirilmesine genellikle izin verilir ancak aşırı tüketimi engellemek için kısıtlamalar olabilir. Cam eşya yerine plastik tercih edilmesi tavsiye edilir. Büyük ve ağır eşyaların önceden bildirilmesi gerekir. Tehlikeli maddeler, silah ve uyuşturucu kesinlikle yasaktır.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Yemekler nasıl organize edilir?</h3>
              <p className="text-gray-700">
                Çoğu tur paketinde kahvaltı, öğle ve akşam yemeği dahildir. Menüler genellikle Türk ve Akdeniz mutfağından seçilir. Özel beslenme ihtiyaçları (vejeteryan, vegan, alerjiler) önceden bildirilmelidir. Bazı teknelerde canlı balık tutma ve pişirme deneyimi de sunulur.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Deniz tutması olanlar için önerileriniz nelerdir?</h3>
              <p className="text-gray-700">
                Deniz tutması yaşayanlar için büyük ve stabil tekneler tercih edilmelidir. Tur öncesi deniz tutması ilacı kullanımı ve hafif yemek tüketimi önerilir. Güvertede açık havada bulunmak, uzak noktalara odaklanmak ve mide boş durmayacak şekilde küçük atıştırmalıklar tüketmek faydalıdır.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Çocuklu aileler için güvenlik önlemleri nelerdir?</h3>
              <p className="text-gray-700">
                Tüm teknelerde çocuk can yelekleri bulunur ve kullanımı zorunludur. Güverte korkulukları çocuk güvenliği standartlarına uygun olmalıdır. Çocuk dostu teknelerde özel aktivite alanları ve güvenlik ekipmanları mevcuttur. 7 yaş altı çocuklar için sürekli yetişkin gözetimi şarttır.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Teknede internet erişimi mevcut mu?</h3>
              <p className="text-gray-700">
                Çoğu modern teknede WiFi bulunur ancak deniz ortasında sinyal gücü değişkenlik gösterebilir. Kıyıya yakın bölgelerde 4G bağlantısı genellikle sorunsuz çalışır. Bazı teknelerde uydu internet sistemi bulunur ancak bu hizmet için ekstra ücret talep edilebilir.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Özel kutlamalar için ek hizmetler var mı?</h3>
              <p className="text-gray-700">
                Doğum günü, evlilik teklifi, yıldönümü gibi özel günler için dekorasyon, özel menü, müzik sistemi ve fotoğraf hizmetleri sunulabilir. Bu hizmetler genellikle ek ücretlidir ve önceden rezervasyon gerektirir. Pasta, çiçek ve balon süslemesi gibi detaylar organize edilebilir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToursPage;