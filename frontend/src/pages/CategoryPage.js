import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  Users, 
  Star,
  Heart,
  ArrowLeft,
  ChevronDown,
  HelpCircle,
  Filter,
  SlidersHorizontal,
  X,
  Mountain,
  Waves,
  Building,
  Trees,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { createSlug } from '../utils/slug';
import { useAuth } from '../App';
import { updateSEOTags, getSEOData } from '../utils/seo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CategoryPage = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const { user, setShowLoginModal } = useAuth();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [categoryData, setCategoryData] = useState(null);
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

  const defaultLocations = [
    { value: '', label: 'Tüm Lokasyonlar' },
    { value: 'Fethiye', label: 'Fethiye' },
    { value: 'Marmaris', label: 'Marmaris' },
    { value: 'Bodrum', label: 'Bodrum' },
    { value: 'Göcek', label: 'Göcek' },
    { value: 'Kaş', label: 'Kaş' },
    { value: 'Antalya', label: 'Antalya' }
  ];

  // Default category data based on URL param
  const getDefaultCategoryData = (categoryParam) => {
    const defaultCategories = {
      'cultural': {
        title: 'Kültürel Turlar',
        description: 'Tarihi yerler, müzeler ve kültürel keşifler ile dolu unutulmaz bir yolculuk deneyimi yaşayın. Türkiye\'nin zengin tarihine tanıklık edin.',
        icon: '🏛️',
        features: [
          'Antik kentleri keşfedin',
          'Müze ziyaretleri',
          'Tarihi yapılar',
          'Kültürel etkinlikler',
          'Yerel rehber eşliği',
          'Fotoğraf çekimi'
        ]
      },
      'nature': {
        title: 'Doğa Turları',
        description: 'Milli parklar, ormanlar ve doğal güzelliklerle dolu rotalar. Temiz hava ve eşsiz manzaralar eşliğinde doğayla iç içe tatil.',
        icon: '🌲',
        features: [
          'Milli park gezileri',
          'Yürüyüş parkurları',
          'Flora ve fauna keşfi',
          'Fotoğraf safari',
          'Kuş gözlemciliği',
          'Doğa yürüyüşü'
        ]
      },
      'adventure': {
        title: 'Macera Turları',
        description: 'Adrenalin dolu aktiviteler ve heyecan verici deneyimler. Dağcılık, su sporları ve ekstrem sporlar ile sınırlarınızı zorlayın.',
        icon: '🏔️',
        features: [
          'Ekstrem sporlar',
          'Dağcılık aktiviteleri',
          'Su sporları',
          'Paraşüt atlayışı',
          'Kaya tırmanışı',
          'Rafting'
        ]
      },
      'city': {
        title: 'Şehir Turları',
        description: 'Şehirlerin nabzını tutun, modern yaşamı keşfedin. Alışveriş, gastronomi ve şehir kültürü ile dolu şehir turları.',
        icon: '🏙️',
        features: [
          'Şehir merkezi gezisi',
          'Alışveriş turları',
          'Gastronomi keşfi',
          'Gece hayatı',
          'Müze ve galeri',
          'Mimari gezi'
        ]
      },
      'food': {
        title: 'Gastronomi Turları',
        description: 'Yerel lezzetler ve mutfak kültürü. Geleneksel tatları keşfedin, yemek atölyelerine katılın ve damak zevkinizi şımartın.',
        icon: '🍽️',
        features: [
          'Yerel mutfak deneyimi',
          'Yemek atölyeleri',
          'Pazar gezileri',
          'Şarap tadımı',
          'Geleneksel yemekler',
          'Aşçılık kursu'
        ]
      },
      'cruise': {
        title: 'Kabin Turları',
        description: 'Denizde lüks tatil deneyimi. Türkiye\'nin eşsiz koylarında kabin kiralama ile profesyonel mürettebat eşliğinde unutulmaz deniz tatili.',
        icon: '⚓',
        features: [
          'Özel kabin konaklaması',
          'Profesyonel mürettebat',
          'Su sporları',
          'Gece yemekleri',
          'Koylarda yüzme',
          'Güneşlenme decks'
        ]
      }
    };

    return defaultCategories[categoryParam] || {
      title: 'Tur Kategorisi',
      description: 'Seçtiğiniz kategorideki turları keşfedin ve unutulmaz deneyimler yaşayın.',
      icon: '🎯',
      features: ['Özel deneyim', 'Profesyonel rehber', 'Unutulmaz anılar']
    };
  };

  useEffect(() => {
    loadCategoryData();
    loadTours();
  }, [category]);

  const loadCategoryData = async () => {
    try {
      // Try to load category from API
      const response = await axios.get(`${API}/categories/${category}`);
      if (response.data) {
        setCategoryData(response.data);
      } else {
        // Use default data
        setCategoryData(getDefaultCategoryData(category));
      }
    } catch (error) {
      console.log('Category API not available, using default data');
      setCategoryData(getDefaultCategoryData(category));
    }
    
    // Update SEO after category data is loaded
    setTimeout(() => updateSEO(tours), 50);
  };

  // Map URL category to backend category format
  const getCategoryForAPI = (categorySlug) => {
    const categoryMapping = {
      'mavi-yolculuk': 'Mavi yolculuk',
      'gunubirlik-tekne': 'Günübirlik Tekne Turları', 
      'kabin-turlari': 'Kabin Turları',
      'balik-dalis': 'Balık & Dalış',
      'yuzme-turlari': 'Yüzme Turları'
    };
    
    return categoryMapping[categorySlug] || categorySlug;
  };

  const loadTours = async () => {
    try {
      setLoading(true);
      
      // Convert category slug to proper category name
      const apiCategory = getCategoryForAPI(category);
      console.log(`🔄 Converting category: '${category}' -> '${apiCategory}'`);
      
      // Try backend filtering first
      const params = new URLSearchParams();
      
      if (apiCategory) {
        params.append('category', apiCategory);
      }
      
      // Add other filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value);
        }
      });

      console.log('📡 Loading tours with params:', params.toString());
      
      let response;
      try {
        response = await axios.get(`${API}/tours?${params.toString()}`);
      } catch (error) {
        console.log('⚠️ Backend filtering failed, trying fallback');
        response = await axios.get(`${API}/tours`);
      }
      
      if (response.data && Array.isArray(response.data)) {
        let tours = response.data;
        
        // Apply frontend filtering if backend didn't filter properly
        if (apiCategory) {
          tours = tours.filter(tour => {
            const tourCategory = tour.category || '';
            return tourCategory.toLowerCase().includes(apiCategory.toLowerCase()) ||
                   tourCategory === apiCategory ||
                   (category === 'mavi-yolculuk' && tourCategory.toLowerCase().includes('mavi'));
          });
        }
        
        // Apply other frontend filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== '') {
            if (key === 'location') {
              tours = tours.filter(tour => 
                tour.location && tour.location.toLowerCase().includes(value.toLowerCase())
              );
            }
            // Add other filter logic as needed
          }
        });
        
        console.log(`✅ Found ${tours.length} tours for category '${category}'`);
        setTours(tours);
        
        // Update SEO after tours are loaded
        setTimeout(() => updateSEO(tours), 100);
        
      } else {
        setTours([]);
        setTimeout(() => updateSEO([]), 100);
      }

    } catch (error) {
      console.error('❌ Error loading tours:', error);
      setTours([]);
      toast.error('Turlar yüklenirken hata oluştu');
      setTimeout(() => updateSEO([]), 100);
    } finally {
      setLoading(false);
    }
  };

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
    loadTours();
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    loadTours();
  };

  // SEO update function - uses admin SEO settings if available
  const updateSEO = (toursArray = []) => {
    // Get proper category title using API mapping
    const apiCategory = getCategoryForAPI(category);
    let categoryTitle = categoryData?.title || apiCategory || category;
    
    // Always format the title properly, regardless of source
    if (categoryTitle && categoryTitle.includes('-')) {
      // Convert slug to proper format: mavi-yolculuk -> Mavi Yolculuk
      categoryTitle = categoryTitle.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    
    console.log(`🔍 SEO Update - Category: ${category} -> Title: ${categoryTitle}`);
    console.log(`📊 Category Data:`, categoryData);
    console.log(`📊 Tours Count:`, toursArray.length);
    
    // Check for admin-defined SEO settings first
    if (categoryData && (categoryData.seo_title || categoryData.seo_description || categoryData.seo_keywords)) {
      // Use admin SEO settings
      console.log('📍 Using admin SEO settings for category');
      updateSEOTags({
        title: categoryData.seo_title || `${categoryTitle} Turları - Mavibilet`,
        description: categoryData.seo_description || `${categoryTitle} kategorisindeki en iyi turları keşfedin. ${toursArray.length} farklı seçenek ile unutulmaz anılar biriktirin.`,
        keywords: categoryData.seo_keywords || `${categoryTitle.toLowerCase()} turları, tekne turu, mavi yolculuk`,
        canonicalUrl: `${window.location.origin}/${category}`,
        structuredData: {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": `${categoryTitle} Turları`,
          "description": categoryData.seo_description || `${categoryTitle} kategorisindeki tekne turları`,
          "url": `${window.location.origin}/${category}`,
          "numberOfItems": toursArray.length
        }
      });
    } else {
      // Use default SEO template
      console.log('📍 Using default SEO template for category');
      const seoData = getSEOData.category({
        categoryTitle,
        categorySlug: category,
        tourCount: toursArray.length
      });
      updateSEOTags(seoData);
    }
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

  // Tour Card Component - Same as ToursPage
  const TourCard = ({ tour }) => (
    <Link 
      to={`/turlar/${createSlug(tour.title)}`} 
      className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 block group"
    >
      <div className="relative">
        <img
          src={tour.images?.[0] || '/placeholder-tour.jpg'}
          alt={tour.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
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

        {tour.category && (
          <div className="absolute top-3 left-3">
            <span className="bg-blue-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
              {tour.category}
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
          <MapPin className="w-4 h-4" />
          <span>{tour.location}</span>
        </div>

        <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 leading-tight">
          {tour.title}
        </h3>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
          {tour.short_description || tour.description}
        </p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(tour.rating || 4.5)
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
              {tour.duration_unit === 'hours' ? 'Saat' : 'Gün'}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xl font-bold text-blue-600">
            ₺{(tour.minimum_price || tour.base_price || 0).toLocaleString('tr-TR')}
          </div>
          <div className="text-sm text-gray-500">den başlayan</div>
        </div>

        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2">
          <span>Detayları Görüntüle</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </Link>
  );

  if (!categoryData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Kategori yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - ToursPage Style */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ana Sayfa</span>
          </button>

          {/* Page Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <span className="text-4xl">{categoryData.icon}</span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                {categoryData.title}
              </h1>
            </div>
            <div className="w-full">
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto">
                {categoryData.description}
              </p>
            </div>
            
            {/* Category Stats */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-gray-600 mt-6">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>{tours.length} Tur</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span>4.8 Ortalama Puan</span>
              </div>
              {tours.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span>₺{Math.min(...tours.map(t => t.minimum_price || t.base_price || 0)).toLocaleString('tr-TR')} den başlayan</span>
                </div>
              )}
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

      {/* Main Content Area - Same 4 Column Layout as ToursPage */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          
          {/* Left Sidebar - Filters - Same as ToursPage */}
          <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden'} lg:block mb-8 lg:mb-0`}>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 lg:sticky lg:top-6">
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
                    {defaultLocations.map((location) => (
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

                {/* Category Features */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Bu Kategorinin Özellikleri</h4>
                  <div className="space-y-2">
                    {categoryData.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bu Kategori Lokasyonları */}
                {categoryData && categoryData.subcategories && categoryData.subcategories.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Bu Kategori Lokasyonları:</h4>
                    <ul className="space-y-2">
                      {categoryData.subcategories.map((subcategory) => (
                        <li key={subcategory.id}>
                          <button
                            onClick={() => {
                              // Create slug from location_name ONLY (not including parent category)
                              let locationSlug = subcategory.location_slug;
                              
                              // If location_slug is null/undefined, create from location_name
                              if (!locationSlug) {
                                locationSlug = createSlug(subcategory.location_name || subcategory.title || '');
                              }
                              
                              // Remove any parent category prefix if it exists  
                              if (locationSlug && locationSlug.includes('/')) {
                                locationSlug = locationSlug.split('/').pop(); // Take only the last part
                              }
                              
                              // Debug logs
                              console.log('🔍 DEBUG CategoryPage - category:', category);
                              console.log('🔍 DEBUG CategoryPage - raw subcategory.location_slug:', subcategory.location_slug);
                              console.log('🔍 DEBUG CategoryPage - processed locationSlug:', locationSlug);
                              console.log('🔍 DEBUG CategoryPage - Final URL:', `/${category}/${locationSlug}`);
                              
                              navigate(`/${category}/${locationSlug}`);
                            }}
                            className="flex items-center justify-between w-full text-left text-sm text-blue-600 hover:text-blue-800 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <span>{subcategory.location_name || subcategory.title}</span>
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

          {/* Right Content - Tours */}
          <div className="lg:col-span-3">
            
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                {tours.length} tur bulundu
              </p>
            </div>

            {/* Tours Grid - Same as ToursPage */}
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
                <div className="text-6xl mb-4">{categoryData.icon}</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Bu kategoride henüz tur bulunmuyor
                </h3>
                <p className="text-gray-600 mb-6">
                  Yakında {categoryData.title.toLowerCase()} eklenecek
                </p>
                <button
                  onClick={() => navigate('/turlar')}
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

      {/* Category Description Section - Below Tours */}
      <div className="mt-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {categoryData.title} Hakkında
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {categoryData.title} kategorisindeki turlar hakkında detaylı bilgi
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                <p className="text-lg mb-6">
                  {categoryData.description}
                </p>
                
                {/* Category Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Bu Kategorinin Özellikleri
                    </h3>
                    <ul className="space-y-3">
                      {categoryData.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Kategori İstatistikleri
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Toplam Tur:</span>
                        <span className="font-semibold text-blue-600">{tours.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ortalama Puan:</span>
                        <span className="font-semibold text-yellow-600">4.8</span>
                      </div>
                      {tours.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Başlangıç Fiyatı:</span>
                          <span className="font-semibold text-green-600">
                            ₺{Math.min(...tours.map(t => t.minimum_price || t.base_price || 0)).toLocaleString('tr-TR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;