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
  SlidersHorizontal,
  ChevronDown,
  Mountain,
  Waves,
  Building,
  Trees,
  X,
  ArrowRight
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { createSlug } from '../utils/slug';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ToursPage = () => {
  const { user, setShowLoginModal } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(window.innerWidth >= 1024);
  const [favorites, setFavorites] = useState(new Set());
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    minPrice: '',
    maxPrice: '',
    duration: '',
    minRating: '',
    classification: '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || ''
  });

  // Dynamic data states
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 12;

  // Static filter options
  const classifications = [
    { value: '', label: 'Tüm Sınıflar' },
    { value: 'standart', label: 'Standart' },
    { value: 'lux', label: 'Lux' },
    { value: 'delux', label: 'Delux' }
  ];

  const durations = [
    { value: '', label: 'Tüm Süreler' },
    { value: '1', label: '1 Gün' },
    { value: '2', label: '2 Gün' },
    { value: '3', label: '3 Gün' },
    { value: '4', label: '4 Gün' },
    { value: '5', label: '5 Gün' },
    { value: '7', label: '7 Gün' },
    { value: '10', label: '10 Gün' },
    { value: '14', label: '14 Gün' }
  ];

  const minRatings = [
    { value: '', label: 'Tüm Puanlar' },
    { value: '1', label: '1+ Yıldız' },
    { value: '2', label: '2+ Yıldız' },
    { value: '3', label: '3+ Yıldız' },
    { value: '4', label: '4+ Yıldız' },
    { value: '5', label: '5 Yıldız' }
  ];

  // Default categories and locations
  const defaultCategories = [
    { value: '', label: 'Tüm Kategoriler' },
    { value: 'cultural', label: 'Kültürel Turlar' },
    { value: 'nature', label: 'Doğa Turları' },
    { value: 'adventure', label: 'Macera Turları' },
    { value: 'city', label: 'Şehir Turları' },
    { value: 'food', label: 'Gastronomi Turları' },
    { value: 'cruise', label: 'Kabin Turları' }
  ];

  const defaultLocations = [
    { value: '', label: 'Tüm Lokasyonlar' },
    { value: 'Fethiye', label: 'Fethiye' },
    { value: 'Marmaris', label: 'Marmaris' },
    { value: 'Bodrum', label: 'Bodrum' },
    { value: 'Göcek', label: 'Göcek' },
    { value: 'Kaş', label: 'Kaş' },
    { value: 'Antalya', label: 'Antalya' }
  ];

  useEffect(() => {
    loadTours();
    loadFilterData();
  }, [searchParams]);

  const loadFilterData = async () => {
    try {
      // Load categories
      try {
        const categoriesResponse = await axios.get(`${API}/categories`);
        if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
          const categoryOptions = [
            { value: '', label: 'Tüm Kategoriler' },
            ...categoriesResponse.data.map(cat => ({
              value: cat.id || cat.slug,
              label: cat.title || cat.name
            }))
          ];
          setCategories(categoryOptions);
        } else {
          setCategories(defaultCategories);
        }
      } catch (error) {
        console.log('Categories API not available, using defaults');
        setCategories(defaultCategories);
      }

      // Load locations  
      try {
        const locationsResponse = await axios.get(`${API}/locations`);
        if (locationsResponse.data && Array.isArray(locationsResponse.data)) {
          const locationOptions = [
            { value: '', label: 'Tüm Lokasyonlar' },
            ...locationsResponse.data.map(loc => ({
              value: loc.name || loc.location_name,
              label: loc.name || loc.location_name
            }))
          ];
          setLocations(locationOptions);
        } else {
          setLocations(defaultLocations);
        }
      } catch (error) {
        console.log('Locations API not available, using defaults');
        setLocations(defaultLocations);
      }

    } catch (error) {
      console.error('Error loading filter data:', error);
      setCategories(defaultCategories);
      setLocations(defaultLocations);
    }
  };

  const loadTours = async (page = 1, loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams();
      
      // Add search query
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value);
        }
      });
      
      // Add pagination
      params.append('page', page.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());

      const response = await axios.get(`${API}/tours?${params.toString()}`);
      
      if (response.data && Array.isArray(response.data)) {
        if (loadMore) {
          setTours(prev => [...prev, ...response.data]);
        } else {
          setTours(response.data);
        }
        
        setHasMore(response.data.length === ITEMS_PER_PAGE);
        setCurrentPage(page);
      } else {
        setTours([]);
        setHasMore(false);
      }

    } catch (error) {
      console.error('Error loading tours:', error);
      if (!loadMore) {
        setTours([]);
      }
      toast.error('Turlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreTours = () => {
    if (!loadingMore && hasMore) {
      loadTours(currentPage + 1, true);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      newParams.set('search', searchQuery.trim());
    } else {
      newParams.delete('search');
    }
    
    setSearchParams(newParams);
    setCurrentPage(1);
    loadTours(1);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      location: '',
      minPrice: '',
      maxPrice: '',
      duration: '',
      minRating: '',
      classification: '',
      startDate: '',
      endDate: ''
    });
    setSearchQuery('');
    
    // Clear URL params
    setSearchParams(new URLSearchParams());
    setCurrentPage(1);
    loadTours(1);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== '') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    
    setSearchParams(newParams);
    setCurrentPage(1);
    
    // Apply filters
    loadTours(1);
  };

  const toggleFavorite = async (tourId, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    try {
      if (favorites.has(tourId)) {
        await axios.delete(`${API}/favorites/${tourId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          newFavorites.delete(tourId);
          return newFavorites;
        });
        toast.success('Favorilerden kaldırıldı');
      } else {
        await axios.post(`${API}/favorites`, { tour_id: tourId }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setFavorites(prev => new Set(prev).add(tourId));
        toast.success('Favorilere eklendi');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    }
  };

  // Tour Card Component
  const TourCard = ({ tour }) => (
    <Link 
      to={`/turlar/${createSlug(tour.title)}`} 
      className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 block group"
    >
      {/* Image Section */}
      <div className="relative">
        <img
          src={tour.images?.[0] || '/placeholder-tour.jpg'}
          alt={tour.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Favorite Button */}
        <button
          onClick={(e) => toggleFavorite(tour.id, e)}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200 z-10"
        >
          <Heart 
            className={`w-5 h-5 ${
              favorites.has(tour.id) 
                ? 'text-red-500 fill-current' 
                : 'text-gray-600'
            }`}
          />
        </button>

        {/* Category Badge */}
        {tour.category && (
          <div className="absolute top-3 left-3">
            <span className="bg-blue-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
              {tour.category}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Location */}
        <div className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
          <MapPin className="w-4 h-4" />
          <span>{tour.location}</span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 leading-tight">
          {tour.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
          {tour.short_description || tour.description}
        </p>

        {/* Rating and Duration */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1">
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
            <span className="text-sm text-gray-500">
              ({tour.review_count || 0})
            </span>
          </div>

          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>
              {tour.duration || tour.duration_days || 1}{' '}
              {(() => {
                if (tour.duration_unit === 'hours') return 'Saat';
                if (tour.duration_unit === 'days') return 'Gün';
                return 'Gün'; // fallback
              })()}
            </span>
            {tour.classification && (
              <span className="font-medium">• {tour.classification}</span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="text-xl font-bold text-blue-600">
            {(() => {
              if (tour.minimum_price) {
                return `₺${(tour.minimum_price || 0).toLocaleString('tr-TR')}`;
              } else if (tour.tour_dates && tour.tour_dates.length > 0) {
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
          </div>
          <div className="text-sm text-gray-500">den başlayan</div>
        </div>

        {/* Details Button */}
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2">
          <span>Detayları Görüntüle</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
              Mavi Yolculuk Turları
            </h1>
            <div className="w-full">
              <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                Türkiye'nin eşsiz koylarında kabin kiralama ile profesyonel kaptan eşliğinde unutulmaz deniz tatili deneyimi yaşayın
              </p>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <form onSubmit={handleSearch} className="flex">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tur ara... (örn: Fethiye, Göcek, Kabin)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-r-lg font-medium transition-colors duration-200"
              >
                Ara
              </button>
            </form>
          </div>
          
          {/* Mobile Filter Button */}
          <div className="flex justify-start mb-6 lg:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200 border border-gray-300"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filtreler</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area - 4 Column Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* Desktop: 4-column grid (1 sidebar + 3 tours), Mobile: Stacked */}
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          
          {/* Left Sidebar - Filters */}
          <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden'} lg:block mb-8 lg:mb-0`}>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 lg:sticky lg:top-6">
              {/* Filter Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filtreler</h3>
                <button
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-200 flex items-center space-x-1 text-sm"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Temizle</span>
                </button>
              </div>
              
              {/* Filter Options */}
              <div className="space-y-6">
                {/* Location Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-600" />
                    Lokasyon
                  </label>
                  <select
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                  >
                    {locations.map((location) => (
                      <option key={location.value} value={location.value}>
                        {location.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Mountain className="w-4 h-4 mr-2 text-gray-600" />
                    Kategori
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-600" />
                    Süre
                  </label>
                  <select
                    value={filters.duration}
                    onChange={(e) => handleFilterChange('duration', e.target.value)}
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                  >
                    {durations.map((duration) => (
                      <option key={duration.value} value={duration.value}>
                        {duration.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Classification Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Building className="w-4 h-4 mr-2 text-gray-600" />
                    Sınıf
                  </label>
                  <select
                    value={filters.classification}
                    onChange={(e) => handleFilterChange('classification', e.target.value)}
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                  >
                    {classifications.map((classification) => (
                      <option key={classification.value} value={classification.value}>
                        {classification.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rating Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Star className="w-4 h-4 mr-2 text-yellow-500" />
                    Min. Puan
                  </label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => handleFilterChange('minRating', e.target.value)}
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                  >
                    {minRatings.map((rating) => (
                      <option key={rating.value} value={rating.value}>
                        {rating.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range Filter */}
                <div className="border-t pt-4">
                  <div className="space-y-2 mb-4">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      💰 Fiyat Aralığı
                    </label>
                    <div className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded">
                      ₺{filters.minPrice?.toLocaleString('tr-TR') || '0'} - ₺{filters.maxPrice?.toLocaleString('tr-TR') || '50.000'}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      placeholder="Min fiyat"
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      placeholder="Max fiyat"
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Tours (3 columns on desktop, responsive on mobile) */}
          <div className="lg:col-span-3">
            
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                {tours.length} tur bulundu
              </p>
            </div>

            {/* Tours Grid */}
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
                  onClick={clearFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Filtreleri Temizle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tours.map((tour) => (
                  <TourCard 
                    key={tour.id} 
                    tour={tour} 
                  />
                ))}
              </div>
            )}
            
            {/* Load More Button */}
            {!loading && tours.length > 0 && hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMoreTours}
                  disabled={loadingMore}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 inline-flex items-center space-x-2"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Yükleniyor...</span>
                    </>
                  ) : (
                    <>
                      <span>Daha Fazla Gör</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          
        </div>
      </div>

      {/* About Cabin Rental Section */}
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
                Kabin kiralama, deniz tutkunlarının teknelerde özel kabinleri kiralayarak, günlük yaşamın stresinden uzaklaştığı eşsiz bir tatil deneyimidir. Bu konsept, özellikle Türkiye'nin Akdeniz ve Ege kıyılarında son yıllarda büyük popülerlik kazanmıştır.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Neden Kabin Kiralama?</h3>
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <Waves className="w-6 h-6 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Eşsiz Deneyim</h4>
                    <p className="text-gray-700 text-sm">Her gün farklı bir koyu keşfetme, kristal berraklığındaki sularda yüzme imkanı.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Heart className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Özel Alan</h4>
                    <p className="text-gray-700 text-sm">Kalabalıktan uzak, sadece sizin grubunuzla paylaştığınız özel tatil alanı.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Star className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Kaliteli Hizmet</h4>
                    <p className="text-gray-700 text-sm">Deneyimli mürettebat ile 7/24 hizmet ve kişiselleştirilmiş aktiviteler.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="prose prose-lg max-w-none">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Popüler Destinasyonlar</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                Türkiye'nin 8.000 kilometrelik sahil şeridi, kabin kiralama için sayısız seçenek sunar. Fethiye-Göcek-Kaş üçgeni, berrak suları ve korumalı koylarıyla en popüler rotadır.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Fethiye', description: 'Doğal güzellikler' },
                  { name: 'Göcek', description: 'Sakin koylar' },
                  { name: 'Marmaris', description: 'Canlı atmosfer' },
                  { name: 'Bodrum', description: 'Tarihi doku' }
                ].map((destination) => (
                  <div key={destination.name} className="bg-white p-4 rounded-lg shadow-sm border">
                    <h4 className="font-semibold text-gray-900 mb-2">{destination.name}</h4>
                    <p className="text-gray-600 text-sm">{destination.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToursPage;