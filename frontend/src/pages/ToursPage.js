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
import { updateSEOTags, getSEOData } from '../utils/seo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ToursPage = () => {
  const { user, token, setShowLoginModal } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);
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
  const [durations, setDurations] = useState([]);
  const [classifications, setClassifications] = useState([]);
  const [minRatings, setMinRatings] = useState([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 12;

  // Default filter options (fallbacks)
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

  // Duplicate declarations removed

  useEffect(() => {
    loadTours();
    loadFilterData();
  }, [searchParams]);

  useEffect(() => {
    loadUserFavorites();
  }, [user, token]);

  const loadUserFavorites = async () => {
    if (!user || !token) {
      setFavorites(new Set());
      return;
    }

    try {
      const response = await axios.get(`${API}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const favoriteIds = response.data.map(fav => fav.id);
      setFavorites(new Set(favoriteIds));
    } catch (error) {
      console.log('Favoriler yüklenirken hata:', error);
      setFavorites(new Set());
    }
  };

  const loadFilterData = async () => {
    try {
      console.log('🔍 Loading filter data from real tours...');
      
      // Get all tours first to extract real filter options
      const toursResponse = await axios.get(`${API}/tours`);
      const allTours = toursResponse.data && Array.isArray(toursResponse.data) ? toursResponse.data : [];
      
      console.log(`📊 Found ${allTours.length} tours for filter analysis`);

      // Extract real categories from tours
      const realCategories = [...new Set(
        allTours
          .map(tour => tour.category)
          .filter(category => category && category.trim() !== '')
      )].sort();
      
      const categoryOptions = [
        { value: '', label: 'Tüm Kategoriler' },
        ...realCategories.map(category => ({
          value: category,
          label: category
        }))
      ];
      setCategories(categoryOptions);
      console.log('📂 Categories loaded:', realCategories);

      // Extract real locations from tours
      const realLocations = [...new Set(
        allTours
          .map(tour => tour.location)
          .filter(location => location && location.trim() !== '')
      )].sort();
      
      const locationOptions = [
        { value: '', label: 'Tüm Lokasyonlar' },
        ...realLocations.map(location => ({
          value: location,
          label: location
        }))
      ];
      setLocations(locationOptions);
      console.log('📍 Locations loaded:', realLocations);

      // Extract real durations from tours
      const realDurations = [...new Set(
        allTours.map(tour => {
          // Handle different duration formats
          if (tour.duration) {
            return tour.duration;
          }
          if (tour.duration_days) {
            return `${tour.duration_days}_days`;
          }
          if (tour.duration_hours) {
            return `${tour.duration_hours}_hours`;
          }
          return null;
        }).filter(duration => duration)
      )].sort();
      
      console.log('⏱️ Real durations found:', realDurations);

      // Create duration options from real data
      const durationOptions = [
        { value: '', label: 'Tüm Süreler' },
        ...realDurations.map(duration => {
          if (duration.includes('_days')) {
            const days = duration.replace('_days', '');
            return { value: duration, label: `${days} Gün` };
          } else if (duration.includes('_hours')) {
            const hours = duration.replace('_hours', '');
            return { value: duration, label: `${hours} Saat` };
          } else {
            return { value: duration, label: duration };
          }
        })
      ];
      setDurations(durationOptions);

      // Extract real classifications from tours
      const realClassifications = [...new Set(
        allTours
          .map(tour => tour.classification)
          .filter(classification => classification && classification.trim() !== '')
      )].sort();
      
      const classificationOptions = [
        { value: '', label: 'Tüm Sınıflar' },
        ...realClassifications.map(classification => ({
          value: classification,
          label: classification
        }))
      ];
      setClassifications(classificationOptions);
      console.log('🏷️ Classifications loaded:', realClassifications);

      // Extract real ratings from tours for min rating filter
      const realRatings = allTours
        .map(tour => tour.rating)
        .filter(rating => rating && !isNaN(rating))
        .map(rating => Math.floor(rating));
      
      const uniqueRatings = [...new Set(realRatings)].sort();
      const minRatingOptions = [
        { value: '', label: 'Tüm Puanlar' },
        ...uniqueRatings.map(rating => ({
          value: rating.toString(),
          label: `${rating}+ Yıldız`
        }))
      ];
      setMinRatings(minRatingOptions);
      console.log('⭐ Ratings loaded:', uniqueRatings);

    } catch (error) {
      console.error('❌ Error loading filter data:', error);
      // Fallback to defaults
      setCategories(defaultCategories);
      setLocations(defaultLocations);
      setDurations([{ value: '', label: 'Tüm Süreler' }]);
      setClassifications([{ value: '', label: 'Tüm Sınıflar' }]);
      setMinRatings([{ value: '', label: 'Tüm Puanlar' }]);
    }
  };

  const loadTours = async (page = 1, loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      console.log('🔍 Loading tours with filters:', filters);
      console.log('🔍 Search query:', searchQuery);

      // Get all tours first (backend filtering may not work perfectly)
      let response;
      try {
        // Try with backend filtering first
        const params = new URLSearchParams();
        
        if (searchQuery.trim()) {
          params.append('search', searchQuery.trim());
        }
        
        // Add basic filters that backend might support
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== '') {
            params.append(key, value);
          }
        });

        const queryString = params.toString();
        console.log('📡 Backend query:', queryString);
        
        response = await axios.get(`${API}/tours${queryString ? '?' + queryString : ''}`);
      } catch (error) {
        console.log('⚠️ Backend filtering failed, trying without filters');
        response = await axios.get(`${API}/tours`);
      }
      
      let allTours = response.data && Array.isArray(response.data) ? response.data : [];
      console.log(`📊 Retrieved ${allTours.length} tours from backend`);

      // Apply frontend filtering for precise results
      let filteredTours = allTours;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filteredTours = filteredTours.filter(tour => 
          (tour.title && tour.title.toLowerCase().includes(query)) ||
          (tour.description && tour.description.toLowerCase().includes(query)) ||
          (tour.location && tour.location.toLowerCase().includes(query)) ||
          (tour.category && tour.category.toLowerCase().includes(query))
        );
      }

      // Category filter
      if (filters.category) {
        filteredTours = filteredTours.filter(tour => 
          tour.category && tour.category.toLowerCase().includes(filters.category.toLowerCase())
        );
      }

      // Location filter
      if (filters.location) {
        filteredTours = filteredTours.filter(tour => 
          tour.location && tour.location.toLowerCase().includes(filters.location.toLowerCase())
        );
      }

      // Duration filter
      if (filters.duration) {
        filteredTours = filteredTours.filter(tour => {
          if (filters.duration.includes('_days')) {
            const days = parseInt(filters.duration.replace('_days', ''));
            return (tour.duration_days && tour.duration_days === days) ||
                   (tour.duration && tour.duration.includes(days.toString()));
          } else if (filters.duration.includes('_hours')) {
            const hours = parseInt(filters.duration.replace('_hours', ''));
            return (tour.duration_hours && tour.duration_hours === hours) ||
                   (tour.duration && tour.duration.includes(hours.toString()));
          } else {
            return tour.duration && tour.duration.toLowerCase().includes(filters.duration.toLowerCase());
          }
        });
      }

      // Classification filter
      if (filters.classification) {
        filteredTours = filteredTours.filter(tour => 
          tour.classification && tour.classification.toLowerCase().includes(filters.classification.toLowerCase())
        );
      }

      // Min rating filter
      if (filters.minRating) {
        const minRating = parseFloat(filters.minRating);
        filteredTours = filteredTours.filter(tour => 
          tour.rating && tour.rating >= minRating
        );
      }

      // Price range filter
      if (filters.minPrice) {
        const minPrice = parseFloat(filters.minPrice);
        filteredTours = filteredTours.filter(tour => {
          const price = tour.minimum_price || tour.base_price || 0;
          return price >= minPrice;
        });
      }

      if (filters.maxPrice) {
        const maxPrice = parseFloat(filters.maxPrice);
        filteredTours = filteredTours.filter(tour => {
          const price = tour.minimum_price || tour.base_price || 999999;
          return price <= maxPrice;
        });
      }

      console.log(`✅ Filtered to ${filteredTours.length} tours`);

      // Handle pagination
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const paginatedTours = filteredTours.slice(startIndex, endIndex);

      if (loadMore) {
        setTours(prev => [...prev, ...paginatedTours]);
      } else {
        setTours(paginatedTours);
      }
      
      setHasMore(endIndex < filteredTours.length);
      setCurrentPage(page);

    } catch (error) {
      console.error('❌ Error loading tours:', error);
      if (!loadMore) {
        setTours([]);
      }
      toast.error('Turlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      
      // Update SEO after tours are loaded
      if (!loadMore) {
        updateSEO();
      }
    }
  };

  const loadMoreTours = () => {
    if (!loadingMore && hasMore) {
      loadTours(currentPage + 1, true);
    }
  };

  // Modern SEO update with filter context
  const updateSEO = () => {
    // Get active filters for SEO context
    const activeFilters = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        activeFilters[key] = value;
      }
    });
    
    // Get search params for additional context
    const searchQuery = searchParams.get('search') || '';
    if (searchQuery) {
      activeFilters.search = searchQuery;
    }
    
    const seoData = getSEOData.tours({
      totalTours: tours.length,
      appliedFilters: activeFilters
    });
    
    // Enhance with tour-specific structured data
    if (tours.length > 0) {
      const tourStructuredData = {
        ...seoData.structuredData,
        "itemListElement": tours.slice(0, 10).map((tour, index) => ({
          "@type": "TouristTrip",
          "position": index + 1,
          "name": tour.title,
          "description": tour.short_description,
          "url": `${window.location.origin}/turlar/${tour.slug || createSlug(tour.title)}`,
          "image": tour.images?.[0],
          "offers": {
            "@type": "Offer",
            "price": tour.minimum_price,
            "priceCurrency": "TRY"
          }
        }))
      };
      
      updateSEOTags({
        ...seoData,
        structuredData: tourStructuredData
      });
    } else {
      updateSEOTags(seoData);
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

    console.log('🎯 toggleFavorite called:', { user: user?.id, token: token ? 'Present' : 'Missing' });

    try {
      if (favorites.has(tourId)) {
        await axios.delete(`${API}/favorites/${tourId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          newFavorites.delete(tourId);
          return newFavorites;
        });
        toast.success('Favorilerden kaldırıldı');
      } else {
        await axios.post(`${API}/favorites/${tourId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
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
      to={`/tur/${createSlug(tour.title)}`} 
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
          <div className="text-center mb-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
              Mavi Yolculuk Turları
            </h1>
            <div className="w-full">
              <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                Türkiye'nin eşsiz koylarında kabin kiralama ile profesyonel kaptan eşliğinde unutulmaz deniz tatili deneyimi yaşayın
              </p>
            </div>
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

      
      {/* Mavi Yolculuk ve Deniz Turları Rehberi */}
      <div className="mt-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Ana Başlık */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Mavi Yolculuk ve Deniz Turları Rehberi
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Ege ve Akdeniz'in büyüleyici kıyılarında; mavi yolculuk, kabin turları, balık turları, dalış turları, 
              günübirlik tekne turları ve yüzme turları ile size özel planlanmış, güvenli ve konforlu bir deniz tatili deneyimi.
            </p>
          </div>

          {/* 1-Column Grid Layout */}
          <div className="space-y-16">

            {/* Mavi Yolculuk Deneyimi */}
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <div className="text-center mb-8">
                <span className="text-4xl mb-4 block">⛵</span>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Mavi Yolculuk Deneyimi</h3>
              </div>
              <div className="prose prose-lg max-w-none text-gray-700">
                <p className="text-lg leading-relaxed mb-6">
                  Klasik guletlerle 3–7 gece arası rotalarda; korunaklı koylarda demir atma, gün batımında 
                  denize karşı akşam yemekleri, yıldızlı gökyüzünde konaklama. Yarım pansiyon/tam pansiyon 
                  seçenekleri ve rota içi su sporlarıyla zenginleştirilmiş, konforlu bir deniz seyahati.
                </p>
              </div>
            </div>

            {/* Kabin Turları */}
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <div className="text-center mb-8">
                <span className="text-4xl mb-4 block">🛏️</span>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Kabin Turları</h3>
              </div>
              <div className="prose prose-lg max-w-none text-gray-700">
                <p className="text-lg leading-relaxed mb-4">
                  Tüm tekneyi kapatmadan, yalnızca bir kabin ayırtarak sabit güzergâh, belirli kalkış günleri 
                  ve sosyal atmosfer; çiftler ve solo gezginler için idealdir.
                </p>
                <p className="text-lg leading-relaxed">
                  Ayrıca sadece sizin grubunuza özel kiralama imkanıyla VIP deneyim.
                </p>
              </div>
            </div>

            {/* Günübirlik Tekne Turları */}
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <div className="text-center mb-8">
                <span className="text-4xl mb-4 block">🚤</span>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Günübirlik Tekne Turları</h3>
              </div>
              <div className="prose prose-lg max-w-none text-gray-700">
                <p className="text-lg leading-relaxed">
                  Sabah çıkış–akşam dönüş; 3–5 koyda yüzme molaları ve özel kiralama imkanıyla 
                  VIP deneyim seçenekleri.
                </p>
              </div>
            </div>

            {/* Balık & Dalış Turları */}
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <div className="text-center mb-8">
                <span className="text-4xl mb-4 block">🐟</span>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Balık & Dalış Turları</h3>
              </div>
              <div className="prose prose-lg max-w-none text-gray-700">
                <p className="text-lg leading-relaxed mb-4">
                  Amatör balıkçılıktan profesyonel dalışlara kadar. Kaş–Kekova ve Datça çevresi 
                  popüler dalış/balık noktalarıyla ön plana çıkar.
                </p>
                <p className="text-lg leading-relaxed">
                  Ekipman, rehber ve güvenlik standartları her turda eksiksizdir.
                </p>
              </div>
            </div>

            {/* Yüzme Turları */}
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <div className="text-center mb-8">
                <span className="text-4xl mb-4 block">🏊‍♀️</span>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Yüzme Turları</h3>
              </div>
              <div className="prose prose-lg max-w-none text-gray-700">
                <p className="text-lg leading-relaxed">
                  Berrak koylarda uzun yüzme molaları için tasarlanmış rotalar. Şnorkel ve deniz gözlüğü 
                  gibi ekipmanlarla gün boyu serinleme ve keşif imkanı.
                </p>
              </div>
            </div>

            {/* Bölgelere Göre Turlar */}
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <div className="text-center mb-12">
                <span className="text-4xl mb-4 block">🗺️</span>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Bölgelere Göre Turlar</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="border-l-4 border-blue-500 pl-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Bodrum</h4>
                    <p className="text-gray-700">Mavi yolculuğun simgesi. Bodrum Kalesi, Akvaryum Koyu, Orak Adası ve Gökova Körfezi bağlantılı rotalar.</p>
                  </div>
                  
                  <div className="border-l-4 border-blue-500 pl-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Marmaris</h4>
                    <p className="text-gray-700">Canlı marina, İçmeler–Turunç–Kumlubük üçlüsü ve özel kiralama için zengin seçenekler.</p>
                  </div>
                  
                  <div className="border-l-4 border-blue-500 pl-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Bozburun</h4>
                    <p className="text-gray-700">Butik gulet yapımıyla ünlü; sakin, derin mavi koylar ve romantik akşamüstleri.</p>
                  </div>
                  
                  <div className="border-l-4 border-blue-500 pl-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Datça</h4>
                    <p className="text-gray-700">Knidos antik kenti, dalış ve balık turları için ideal sular.</p>
                  </div>
                  
                  <div className="border-l-4 border-blue-500 pl-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Dalyan</h4>
                    <p className="text-gray-700">Kaya mezarları, İztuzu Plajı ve Caretta-caretta gözlemleri.</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="border-l-4 border-green-500 pl-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Göcek</h4>
                    <p className="text-gray-700">12 Ada, Hamam Koyu, Bedri Rahmi Koyu – klasik mavi yolculuk güzergahı.</p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Fethiye / Ölüdeniz</h4>
                    <p className="text-gray-700">Kelebekler Vadisi, Mavi Mağara ve turkuaz sular.</p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Kaş</h4>
                    <p className="text-gray-700">Dalış merkezleri, kaya oluşumları, antik kalıntılar.</p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Kekova</h4>
                    <p className="text-gray-700">Batık Şehir, Simena–Kaleköy; kano ve şnorkelle keşif.</p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Akyaka</h4>
                    <p className="text-gray-700">Azmak Nehri ve doğal yaşamla iç içe günübirlik turlar.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fiyat Bilgisi */}
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <div className="text-center mb-12">
                <span className="text-4xl mb-4 block">💰</span>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Fiyat Bilgisi</h3>
                <p className="text-lg text-gray-600">Ortalama Aralıklar</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-left">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="border border-gray-300 px-6 py-4 font-semibold text-gray-900">Tur Türü</th>
                      <th className="border border-gray-300 px-6 py-4 font-semibold text-gray-900">Fiyat Aralığı</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-6 py-4 text-gray-700">Mavi Yolculuk</td>
                      <td className="border border-gray-300 px-6 py-4 font-semibold text-blue-600">₺24.000 – ₺42.000 / kişi haftalık</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-6 py-4 text-gray-700">Kabin Turu</td>
                      <td className="border border-gray-300 px-6 py-4 font-semibold text-blue-600">₺16.000 – ₺30.000 / kişi</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-6 py-4 text-gray-700">Günübirlik Tekne</td>
                      <td className="border border-gray-300 px-6 py-4 font-semibold text-blue-600">₺1.400 – ₺2.400 / kişi</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-6 py-4 text-gray-700">Özel Tekne Kiralama</td>
                      <td className="border border-gray-300 px-6 py-4 font-semibold text-blue-600">₺15.000 – ₺35.000 / gün</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-6 py-4 text-gray-700">Balık / Dalış Turu</td>
                      <td className="border border-gray-300 px-6 py-4 font-semibold text-blue-600">₺1.100 – ₺3.600 / kişi</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dahil Olanlar ve Hariç Olanlar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-green-50 rounded-2xl shadow-lg p-8">
                <div className="text-center mb-6">
                  <span className="text-3xl mb-3 block">✅</span>
                  <h4 className="text-2xl font-bold text-green-800">Dahil Olanlar</h4>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <span className="text-green-600 mt-1">•</span>
                    <span className="text-gray-700">Mürettebat, yakıt, sigorta, güvenlik ekipmanları</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-600 mt-1">•</span>
                    <span className="text-gray-700">Yemek ve içecek hizmeti (pakete göre)</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-600 mt-1">•</span>
                    <span className="text-gray-700">Rehberlik ve rota planlaması</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-red-50 rounded-2xl shadow-lg p-8">
                <div className="text-center mb-6">
                  <span className="text-3xl mb-3 block">❌</span>
                  <h4 className="text-2xl font-bold text-red-800">Hariç Olanlar</h4>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <span className="text-red-600 mt-1">•</span>
                    <span className="text-gray-700">Özel menüler, marinada bağlama ücretleri</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-red-600 mt-1">•</span>
                    <span className="text-gray-700">Kişisel harcamalar, kara transferleri</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Sıkça Sorulan Sorular (SSS) */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-4xl mb-4 block">❓</span>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Sıkça Sorulan Sorular
            </h3>
            <p className="text-xl text-gray-600">
              Mavi yolculuk ve deniz turları hakkında merak ettiğiniz her şey
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                question: "Kabin turu ile özel kiralama arasındaki fark nedir?",
                answer: "Kabin turunda teknenin kabinleri farklı misafirlere satılır; özel kiralamada tüm tekne size aittir."
              },
              {
                question: "Yemekler dahil mi?",
                answer: "Paket türüne göre değişir; genellikle mavi yolculukta tam pansiyon hizmet sunulur."
              },
              {
                question: "Hava muhalefetinde ne olur?",
                answer: "Kaptan kararıyla rota değişikliği veya tarih erteleme yapılabilir; güvenlik önceliklidir."
              },
              {
                question: "Balık / dalış ekipmanları sağlanıyor mu?",
                answer: "Evet, tüm turlar ekipmanlıdır ve güvenlik brifingi verilir."
              },
              {
                question: "Çocuklar için uygun mu?",
                answer: "Evet. Aile dostu koylar ve ekipmanlar standarttır."
              }
            ].map((faq, index) => (
              <div 
                key={index} 
                className="bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <details className="group">
                  <summary className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 rounded-2xl transition-colors duration-200 cursor-pointer list-none">
                    <span className="font-semibold text-gray-900 text-lg pr-8">
                      {faq.question}
                    </span>
                    <div className="flex-shrink-0 ml-4">
                      <div className="p-2 bg-blue-50 rounded-full group-open:bg-blue-100 transition-colors duration-200">
                        <ChevronDown className="w-5 h-5 text-blue-600 group-open:rotate-180 transition-transform duration-300" />
                      </div>
                    </div>
                  </summary>
                  <div className="px-8 pb-8">
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-gray-700 leading-relaxed text-base">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </div>

          {/* Sonuç CTA */}
          {/* Description Section */}
          <div className="mt-12 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Turlarımız Hakkında</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                Türkiye'nin eşsiz kıyılarında unutulmaz bir deneyim için özenle hazırlanmış turlarımızı keşfedin. 
                Mavi yolculuktan günübirlik tekne turlarına, kabin turlarından özel organizasyonlara kadar geniş 
                bir yelpazede hizmet sunuyoruz.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Profesyonel ekibimiz ve kaliteli teknelerimizle güvenli, konforlu ve keyifli bir tatil deneyimi 
                yaşamanızı sağlıyoruz. Her bütçeye uygun seçeneklerimizle hayalinizdeki deniz tatilini 
                gerçekleştirin.
              </p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-12 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sıkça Sorulan Sorular</h2>
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Rezervasyon yapmak için ne kadar önceden başvurmalıyım?
                </h3>
                <p className="text-gray-600">
                  Rezervasyonlarınızı en az 3-5 gün önceden yapmanızı öneriyoruz. Yoğun sezonlarda (Haziran-Eylül) 
                  daha erken rezervasyon yapmanız avantajlı olacaktır.
                </p>
              </div>
              
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  İptal ve iade koşulları nelerdir?
                </h3>
                <p className="text-gray-600">
                  Tur tarihinden 7 gün öncesine kadar yapılan iptallerde %100 iade yapılır. 7 gün içinde yapılan 
                  iptallerde iade koşulları turun özelliğine göre değişiklik gösterebilir.
                </p>
              </div>
              
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Turlarda yemek dahil mi?
                </h3>
                <p className="text-gray-600">
                  Yemek ve içecek dahiliyeti tur tipine göre değişmektedir. Her turun detay sayfasında 
                  "Dahil Olan Hizmetler" bölümünde bu bilgiyi bulabilirsiniz.
                </p>
              </div>
              
              <div className="pb-4 last:border-0 last:pb-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Hava koşulları turları etkiler mi?
                </h3>
                <p className="text-gray-600">
                  Güvenliğiniz için kötü hava koşullarında turlar iptal edilebilir veya ertelenebilir. 
                  Bu durumda tarafınıza önceden bilgilendirme yapılır ve alternatif tarih önerilir veya 
                  tam iade yapılır.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <div className="bg-blue-600 rounded-2xl p-8 md:p-12">
              <h4 className="text-2xl md:text-3xl font-bold text-white mb-6">
                CRP Turizm Güvencesiyle Unutulmaz Bir Deneyim
              </h4>
              <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                Türkiye'nin en özel kıyılarında denizle yeniden buluşun. Mavi yolculuk, kabin turları, 
                günübirlik tekne kiralama, balık ve dalış turlarıyla doğanın huzurunu keşfedin.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200">
                  Hemen Rezervasyon Yap
                </button>
                <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-200">
                  Daha Fazla Bilgi Al
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToursPage;