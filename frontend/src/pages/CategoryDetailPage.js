import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, 
  Star, 
  Clock, 
  Users, 
  Calendar, 
  ChevronRight,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  X,
  Heart,
  Mountain,
  Waves,
  Building,
  Trees
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { createSlug } from '../utils/slug';
import { useAuth } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CategoryDetailPage = () => {
  const { categorySlug, locationSlug } = useParams();
  const navigate = useNavigate();
  const { user, setShowLoginModal } = useAuth();
  const [categoryData, setCategoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tours, setTours] = useState([]);
  const [showFilters, setShowFilters] = useState(window.innerWidth >= 1024);
  const [favorites, setFavorites] = useState(new Set());
  const [filters, setFilters] = useState({
    location: '',
    minPrice: '',
    maxPrice: '',
    duration: '',
    minRating: '',
    classification: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadCategoryData();
  }, [categorySlug, locationSlug]);

  const loadCategoryData = async () => {
    try {
      setLoading(true);
      
      const endpoint = locationSlug 
        ? `/categories/${categorySlug}/${locationSlug}`
        : `/categories/${categorySlug}`;
      
      const response = await axios.get(`${API}${endpoint}`);
      
      if (locationSlug) {
        // Category + Location combination page
        setCategoryData({
          title: response.data.page_title,
          description: response.data.page_description,
          meta_title: response.data.meta_title,
          meta_description: response.data.meta_description,
          category: response.data.category,
          location: response.data.location,
          tours: response.data.tours || []
        });
        setTours(response.data.tours || []);
        
        // Update page meta
        document.title = response.data.meta_title;
        document.querySelector('meta[name="description"]')?.setAttribute('content', response.data.meta_description);
      } else {
        // Main category page
        setCategoryData(response.data);
        setTours(response.data.tours || []);
        
        // Update page meta
        document.title = response.data.meta_title || response.data.title;
        document.querySelector('meta[name="description"]')?.setAttribute('content', 
          response.data.meta_description || response.data.description
        );
      }
    } catch (error) {
      console.error('Error loading category data:', error);
      toast.error('Sayfa yüklenirken hata oluştu');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // Filter options
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
      location: '',
      minPrice: '',
      maxPrice: '',
      duration: '',
      minRating: '',
      classification: '',
      startDate: '',
      endDate: ''
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const navigateToTour = (tour) => {
    navigate(`/turlar/${createSlug(tour.title)}`);
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

  // TourCard component - matching ToursPage design
  const TourCard = ({ tour }) => (
    <Link 
      to={`/turlar/${createSlug(tour.title)}`} 
      className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 block group"
    >
      {/* Resim Alanı */}
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
          {tour.short_description || tour.description}
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

        {/* Fiyat */}
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

        {/* Detaylar Butonu */}
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors duration-200">
          Detayları Görüntüle
        </button>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Loading skeleton */}
        <div className="animate-pulse">
          <div className="h-64 bg-gray-300"></div>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="h-8 bg-gray-300 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-8"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-300 rounded-xl h-80"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!categoryData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sayfa Bulunamadı</h2>
          <p className="text-gray-600 mb-4">Aradığınız kategori bulunamadı.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  const isLocationPage = locationSlug && categoryData.location;
  const displayCategory = isLocationPage ? categoryData.category : categoryData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - ToursPage Style */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Page Title */}
          <div className="text-center mb-8">
            {/* Breadcrumbs */}
            <nav className="flex items-center justify-center space-x-2 text-gray-500 text-sm mb-4">
              <button onClick={() => navigate('/')} className="hover:text-blue-600">Ana Sayfa</button>
              <ChevronRight className="w-4 h-4" />
              <button onClick={() => navigate(`/categories/${categorySlug}`)} className="hover:text-blue-600">
                {displayCategory.title}
              </button>
              {isLocationPage && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-gray-900">{categoryData.location.location_name}</span>
                </>
              )}
            </nav>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
              {isLocationPage ? categoryData.title : displayCategory.title}
            </h1>
            <div className="w-full">
              <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                {(isLocationPage ? categoryData.description : displayCategory.description) || 
                 `${isLocationPage ? categoryData.title : displayCategory.title} kategorisindeki turları keşfedin`}
              </p>
            </div>
            
            {/* Category Stats */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-gray-600 mt-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>
                  {isLocationPage 
                    ? categoryData.location.location_name 
                    : 'Tüm Lokasyonlar'
                  }
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>{tours.length} Tur</span>
              </div>
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

                {/* Category Stats */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Kategori İstatistikleri</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Toplam Tur:</span>
                      <span className="font-semibold text-blue-600">{tours.length}</span>
                    </div>
                    {tours.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Başlangıç:</span>
                        <span className="font-semibold text-green-600">
                          ₺{Math.min(...tours.map(t => t.minimum_price || 0).filter(p => p > 0)).toLocaleString('tr-TR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subcategories/Locations */}
                {!isLocationPage && categoryData && categoryData.subcategories && categoryData.subcategories.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Bu Kategori Lokasyonları:</h4>
                    <ul className="space-y-2">
                      {categoryData.subcategories.map((subcategory) => (
                        <li key={subcategory.id}>
                          <button
                            onClick={() => navigate(`/categories/${categorySlug}/${subcategory.location_slug}`)}
                            className="flex items-center justify-between w-full text-left text-sm text-blue-600 hover:text-blue-800 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <span>{subcategory.location_name}</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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

            {/* Tours Grid - ToursPage Style */}
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
                  {isLocationPage 
                    ? `${categoryData.location.location_name} bölgesinde henüz ${displayCategory.title.toLowerCase()} turu yok` 
                    : `Bu kategoride henüz tur yok`
                  }
                </h3>
                <p className="text-gray-600 mb-6">
                  Yakında yeni turlar eklenecek
                </p>
                <button
                  onClick={() => navigate('/tours')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Diğer Turları Keşfet
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

      {/* Category Description Section - Full Width Below Tours */}
      {(isLocationPage ? categoryData.description : displayCategory.description) && (
        <div className="mt-16 bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {isLocationPage ? categoryData.title : displayCategory.title} Hakkında
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {isLocationPage ? categoryData.title : displayCategory.title} kategorisindeki turlar hakkında detaylı bilgi
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                  <p className="text-lg">
                    {isLocationPage ? categoryData.description : displayCategory.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section - Sıkça Sorulan Sorular */}
      {displayCategory.faq && displayCategory.faq.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-full">
                  <HelpCircle className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Sıkça Sorulan Sorular
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {isLocationPage ? categoryData.title : displayCategory.title} hakkında en çok merak edilen sorular ve cevapları
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="space-y-6">
                {displayCategory.faq.map((faq, index) => (
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

              {/* FAQ CTA Section */}
              <div className="mt-12 text-center">
                <div className="bg-blue-600 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Başka sorunuz mu var?
                  </h3>
                  <p className="text-blue-100 mb-6">
                    Aklınıza takılan başka sorular varsa bizimle iletişime geçin
                  </p>
                  <button
                    onClick={() => navigate('/contact')}
                    className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200"
                  >
                    İletişime Geç
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryDetailPage;