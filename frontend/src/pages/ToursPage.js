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
  X
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
  const [showFilters, setShowFilters] = useState(window.innerWidth >= 1024); // Desktop default true, mobile false
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  // Removed viewMode - only grid view now
  const [favorites, setFavorites] = useState(new Set());
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    location: '',
    minPrice: '',
    maxPrice: '',
    duration: '',
    minRating: '',
    max_rating: '',
    classification: ''
  });

  // Dynamic data states
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [durationRange, setDurationRange] = useState({ min: 1, max: 15 });
  const [ratingRange, setRatingRange] = useState({ min: 1, max: 5 });
  // Static filter options for the new design
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

  const clearFilters = () => {
    setFilters({
      category: '',
      location: '',
      minPrice: '',
      maxPrice: '',
      duration: '',
      minRating: '',
      max_rating: '',
      classification: ''
    });
    setSearchParams(new URLSearchParams());
  };

  useEffect(() => {
    // SEO Ayarları
    document.title = "Kabin Turları - DijipalTour | Mavi Yolculuk Kabin Kiralama";
    
    // Meta description güncelle
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Türkiye\'nin en güzel koylarında kabin kiralama ile mavi yolculuk. Göcek, Marmaris, Bodrum koylarında profesyonel kaptan eşliğinde unutulmaz deniz tatili.');
    }
    
    // Open Graph meta etiketleri
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', 'Kabin Turları - Mavi Yolculuk | DijipalTour');
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', 'Türkiye\'nin en güzel koylarında kabin kiralama ile mavi yolculuk deneyimi. Profesyonel kaptan eşliğinde unutulmaz deniz tatili.');
    }
    
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      ogImage.setAttribute('content', 'https://blog.yachtdunyasi.com/wp-content/uploads/2022/10/marmaris-en-guzel-koylari-400x400.webp');
    } else {
      // Eğer yoksa yeni meta etiketi oluştur
      const newOgImage = document.createElement('meta');
      newOgImage.setAttribute('property', 'og:image');
      newOgImage.setAttribute('content', 'https://blog.yachtdunyasi.com/wp-content/uploads/2022/10/marmaris-en-guzel-koylari-400x400.webp');
      document.head.appendChild(newOgImage);
    }
    
    loadFilterData();
    loadTours();
    if (user) {
      loadFavorites();
    }
  }, []);

  useEffect(() => {
    loadTours();
  }, [filters, searchQuery]);

  // Handle responsive filter visibility
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowFilters(true); // Desktop: always show filters
      } else {
        // Mobile: keep current state (user can toggle)
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      if (filters.minPrice) params.append('min_price', filters.minPrice);
      if (filters.maxPrice) params.append('max_price', filters.maxPrice);
      if (filters.duration) params.append('duration_days', filters.duration);
      if (filters.minRating) params.append('min_rating', filters.minRating);
      
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

  // YENİ TOUR CARD - SIFIRDAN TASARIM
  const TourCard = ({ tour }) => (
    <Link 
      to={`/turlar/${createSlug(tour.title)}`}
      className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1"
    >
      {/* Resim Alanı */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={tour.images[0] || '/placeholder-tour.jpg'}
          alt={tour.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Favoriye Ekleme Butonu */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(tour.id);
          }}
          className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200"
        >
          <Heart 
            className={`w-4 h-4 transition-colors duration-200 ${
              favorites.has(tour.id) 
                ? 'text-red-500 fill-current' 
                : 'text-gray-600 hover:text-red-500'
            }`} 
          />
        </button>

        {/* Kategori Badge */}
        {tour.category && (
          <div className="absolute top-3 left-3">
            <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
              {tour.category}
            </span>
          </div>
        )}
      </div>

      {/* İçerik Alanı */}
      <div className="p-4">
        {/* Lokasyon */}
        <div className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
          <MapPin className="w-4 h-4" />
          <span>{tour.location}</span>
        </div>

        {/* Başlık */}
        <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 leading-tight">
          {tour.title}
        </h3>

        {/* Açıklama */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
          {tour.short_description}
        </p>

        {/* Rating ve Süre */}
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
            <span>{tour.duration_days || 1} gün</span>
            {tour.classification && (
              <span className="font-medium">• {tour.classification}</span>
            )}
          </div>
        </div>

        {/* Fiyat */}
        <div className="mb-4">
          <div className="text-xl font-bold text-blue-600">
            {(() => {
              if (tour.minimum_price) {
                return `₺${tour.minimum_price.toLocaleString('tr-TR')}`;
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

        {/* Detaylar Butonu */}
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors duration-200">
          Detayları Görüntüle
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
          
          {/* Mobile Filter Button - Only show on mobile */}
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

        {/* Sade Filtreler */}
        {showFilters && (
          <div className="mb-8 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            {/* Filtre Başlığı */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Filtreler</h3>
              <button
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200 flex items-center space-x-1 text-sm"
              >
                <X className="w-4 h-4" />
                <span>Temizle</span>
              </button>
            </div>
            
            {/* Filtreler - İki Kolon Layout */}
            <div className="space-y-6">
              {/* Üst Sıra Filtreler */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Lokasyon */}
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
                    {locations.map((location, index) => (
                      <option key={location.value || index} value={location.value}>
                        {location.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kategori */}
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
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Sınıflandırma */}
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

                {/* Süre */}
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
                    {durations.map(dur => (
                      <option key={dur.value} value={dur.value}>{dur.label}</option>
                    ))}
                  </select>
                </div>

                {/* Minimum Puan - Yıldızlı */}
                <div className="space-y-2 sm:col-span-2 md:col-span-1">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Star className="w-4 h-4 mr-2 text-gray-600 fill-current" />
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
              </div>

              {/* Fiyat Aralığı - Alt Sıra */}
              <div className="border-t pt-4 bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    💰 Fiyat Aralığı
                  </label>
                  <span className="text-sm font-semibold text-blue-600 bg-white px-3 py-1 rounded-full">
                    ₺{filters.minPrice?.toLocaleString('tr-TR') || '0'} - ₺{filters.maxPrice?.toLocaleString('tr-TR') || '50.000'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    placeholder="Min fiyat"
                    className="w-full px-3 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                  />
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    placeholder="Max fiyat"
                    className="w-full px-3 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Mobile Filter Overlay */}
      {showFilters && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full max-h-[90vh] overflow-y-auto rounded-t-xl">
            <div className="p-6">
              {/* Mobile Filter Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filtreler</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Same filters as sidebar but in mobile format */}
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
                    <option value="">Tüm Lokasyonlar</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
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
                    <option value="">Tüm Kategoriler</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
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
                  
                  <div className="grid grid-cols-2 gap-3">
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

              {/* Mobile Filter Actions */}
              <div className="flex space-x-4 pt-6 border-t mt-6">
                <button
                  onClick={clearFilters}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors duration-200"
                >
                  Temizle
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
                >
                  Filtreleri Uygula
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - 4 Column Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* Desktop: 4-column grid (1 sidebar + 3 tours), Mobile: Stacked */}
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          
          {/* Left Sidebar - Filters (Desktop always visible, Mobile toggle) */}
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
              
              {/* Filters */}
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
                    <option value="">Tüm Lokasyonlar</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
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
                    <option value="">Tüm Kategoriler</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
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
                  onClick={() => {
                    clearFilters();
                    setSearchParams(new URLSearchParams());
                    setSearchQuery('');
                  }}
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
          </div>
          
        </div>
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