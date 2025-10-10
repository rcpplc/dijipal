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
  Trees,
  HelpCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { createSlug } from '../utils/slug';
import { useAuth } from '../App';
import { updateSEOTags, getSEOData } from '../utils/seo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CategoryDetailPage = () => {
  const { category: categorySlug, location: locationSlug } = useParams();
  const navigate = useNavigate();
  const { user, setShowLoginModal } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tours, setTours] = useState([]);
  const [categoryData, setCategoryData] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState({});
  const [availableFilters, setAvailableFilters] = useState({
    locations: [],
    durations: [],
    classifications: [],
    priceRange: { min: 0, max: 10000 }
  });
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

  // Check if this is a location page (subcategory)
  const isLocationPage = !!(locationSlug && typeof locationSlug === 'string');

  // Category and location configuration
  const getCategoryConfig = () => {
    const categoryMapping = {
      'mavi-yolculuk': {
        name: 'Mavi yolculuk',
        title: 'Mavi Yolculuk',
        icon: '🌊',
        color: 'blue'
      },
      'gunubirlik-tekne': {
        name: 'Günübirlik Tekne Turları',
        title: 'Günübirlik Tekne Turları',
        icon: '⛵',
        color: 'green'
      },
      'kabin-turlari': {
        name: 'Kabin Turları',
        title: 'Kabin Turları',
        icon: '🛥️',
        color: 'purple'
      },
      'balik-dalis': {
        name: 'Balık & Dalış',
        title: 'Balık & Dalış',
        icon: '🐠',
        color: 'teal'
      },
      'yuzme-turlari': {
        name: 'Yüzme Turları',
        title: 'Yüzme Turları',
        icon: '🏊',
        color: 'cyan'
      }
    };
    
    return categoryMapping[categorySlug] || {
      name: categorySlug || 'Kategori',
      title: (categorySlug || 'Kategori').charAt(0).toUpperCase() + (categorySlug || 'kategori').slice(1),
      icon: '🚢',
      color: 'gray'
    };
  };

  const getLocationConfig = () => {
    if (!locationSlug || typeof locationSlug !== 'string') return null;
    
    return {
      name: locationSlug.charAt(0).toUpperCase() + locationSlug.slice(1),
      title: locationSlug.charAt(0).toUpperCase() + locationSlug.slice(1),
      slug: locationSlug
    };
  };

  useEffect(() => {
    if (categorySlug) {
      loadData();
    }
  }, [categorySlug, locationSlug]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load category/subcategory data from admin panel
      let adminCategoryData = null;
      try {
        if (isLocationPage) {
          // Try to load subcategory data
          const subcategoryResponse = await axios.get(`${API}/categories/${categorySlug}/locations/${locationSlug}`);
          adminCategoryData = subcategoryResponse.data;
        } else {
          // Try to load main category data
          const categoryResponse = await axios.get(`${API}/categories/${categorySlug}`);
          adminCategoryData = categoryResponse.data;
        }
      } catch (error) {
        console.log('Admin API not available, using default data');
      }
      
      // Merge admin data with default configuration
      const categoryConfig = getCategoryConfig();
      const locationConfig = getLocationConfig();
      
      if (adminCategoryData) {
        // Use admin data
        setCategoryData(adminCategoryData);
      } else {
        // Create default data structure compatible with admin format
        const defaultData = {
          id: categorySlug,
          name: categoryConfig.name,
          title: isLocationPage ? `${locationConfig?.name || ''} ${categoryConfig.title}` : categoryConfig.title,
          description: isLocationPage 
            ? `${locationConfig?.name || ''} bölgesindeki en güzel ${categoryConfig.title.toLowerCase()} turlarını keşfedin. Profesyonel rehberlik eşliğinde unutulmaz deneyimler yaşayın.`
            : `${categoryConfig.title} kategorisindeki en iyi turları keşfedin ve unutulmaz anılar biriktirin.`,
          seo_title: null,
          seo_description: null,
          seo_keywords: null,
          faq: [
            {
              question: "Rezervasyon nasıl yapılır?",
              answer: "Online rezervasyon sistemimizi kullanarak kolayca rezervasyon yapabilirsiniz. Tur tarihini seçin, kişi sayısını belirleyin ve güvenli ödeme adımlarını tamamlayın."
            },
            {
              question: "İptal ve değişiklik koşulları nelerdir?",
              answer: "Turdan 7 gün öncesine kadar ücretsiz iptal yapabilirsiniz. 7 günden daha kısa sürede yapılan iptallerde %50 kesinti uygulanır."
            },
            {
              question: "Fiyatlara neler dahildir?",
              answer: "Fiyatlara rehberlik hizmeti, güvenlik ekipmanları ve belirtilen aktiviteler dahildir. Kişisel harcamalar ve ekstra aktiviteler dahil değildir."
            },
            {
              question: "Çocuklu ailelere indirim var mı?",
              answer: "12 yaş altı çocuklar için %50 indirim uygulanır. 2 yaş altı çocuklar ücretsizdir."
            }
          ],
          is_active: true
        };
        
        if (isLocationPage) {
          defaultData.location = {
            location_name: locationConfig?.name || locationSlug,
            description: `${locationConfig?.name || ''} bölgesindeki premium ${categoryConfig.title.toLowerCase()} turları`,
            seo_title: null,
            seo_description: null,
            seo_keywords: null
          };
        }
        
        setCategoryData(defaultData);
      }
      
      // Load tours and filters
      await loadTours();
      await loadAvailableFilters();
      
      // Update SEO after all data is loaded
      updateSEO();

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Load available filter options from tour data
  const loadAvailableFilters = async () => {
    try {
      const categoryConfig = getCategoryConfig();
      const params = new URLSearchParams();
      params.append('category', categoryConfig.name);
      
      if (isLocationPage) {
        const locationConfig = getLocationConfig();
        if (locationConfig) {
          params.append('location', locationConfig.name);
        }
      }

      const response = await axios.get(`${API}/tours?${params.toString()}`);
      
      if (response.data && Array.isArray(response.data)) {
        const tours = response.data;
        
        // Extract unique filter values
        const locations = [...new Set(tours.map(tour => tour.location).filter(Boolean))];
        const durations = [...new Set(tours.map(tour => tour.duration).filter(Boolean))];
        const classifications = [...new Set(tours.map(tour => tour.classification).filter(Boolean))];
        const prices = tours.map(tour => tour.minimum_price).filter(price => price > 0);
        
        setAvailableFilters({
          locations,
          durations,
          classifications,
          priceRange: {
            min: prices.length > 0 ? Math.min(...prices) : 0,
            max: prices.length > 0 ? Math.max(...prices) : 10000
          }
        });
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  // SEO update with admin settings priority
  const updateSEO = () => {
    const categoryConfig = getCategoryConfig();
    const locationConfig = getLocationConfig();
    const tourCount = tours.length;
    
    if (isLocationPage) {
      // Subcategory SEO - prioritize admin settings
      const adminSEO = categoryData?.location;
      if (adminSEO?.seo_title || adminSEO?.seo_description || adminSEO?.seo_keywords) {
        updateSEOTags({
          title: adminSEO.seo_title || `${locationConfig?.name || ''} ${categoryConfig.title} Turları - Mavibilet`,
          description: adminSEO.seo_description || `${locationConfig?.name || ''} bölgesindeki premium ${categoryConfig.title.toLowerCase()} turları. ${tourCount} farklı seçenek ile unutulmaz deneyimler.`,
          keywords: adminSEO.seo_keywords || `${locationConfig?.name || ''} ${categoryConfig.title.toLowerCase()}, ${locationConfig?.name || ''} tekne turu, mavi yolculuk`,
          canonicalUrl: `${window.location.origin}/${categorySlug}/${locationSlug}`
        });
      } else {
        const seoData = getSEOData.subcategory({
          locationName: locationConfig?.name || locationSlug,
          categoryTitle: categoryConfig.title,
          categorySlug,
          locationSlug,
          tourCount
        });
        updateSEOTags(seoData);
      }
    } else {
      // Main category SEO - prioritize admin settings
      if (categoryData?.seo_title || categoryData?.seo_description || categoryData?.seo_keywords) {
        updateSEOTags({
          title: categoryData.seo_title || `${categoryConfig.title} Turları - Mavibilet`,
          description: categoryData.seo_description || `${categoryConfig.title} kategorisindeki en iyi turları keşfedin. ${tourCount} farklı seçenek ile unutulmaz anılar biriktirin.`,
          keywords: categoryData.seo_keywords || `${categoryConfig.title.toLowerCase()} turları, tekne turu, mavi yolculuk`,
          canonicalUrl: `${window.location.origin}/${categorySlug}`
        });
      } else {
        const seoData = getSEOData.category({
          categoryTitle: categoryConfig.title,
          categorySlug,
          tourCount
        });
        updateSEOTags(seoData);
      }
    }
  };

  const loadTours = async () => {
    const categoryConfig = getCategoryConfig();
    const locationConfig = getLocationConfig();
    
    try {
      const params = new URLSearchParams();
      params.append('category', categoryConfig.name);
      
      if (isLocationPage && locationConfig) {
        params.append('location', locationConfig.name);
      }
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value);
        }
      });

      const response = await axios.get(`${API}/tours?${params.toString()}`);
      
      if (response.data && Array.isArray(response.data)) {
        let filteredTours = response.data;
        
        // Additional filtering for better matching
        filteredTours = filteredTours.filter(tour => {
          const tourCategory = (tour.category || '').toLowerCase();
          const tourLocation = (tour.location || '').toLowerCase();
          const configName = categoryConfig.name.toLowerCase();
          
          const categoryMatch = tourCategory.includes(configName) || 
                               tourCategory === categoryConfig.name ||
                               (categorySlug === 'mavi-yolculuk' && tourCategory.includes('mavi'));
          
          if (isLocationPage && locationConfig) {
            const locationMatch = tourLocation.includes(locationConfig.name.toLowerCase());
            return categoryMatch && locationMatch;
          }
          
          return categoryMatch;
        });
        
        setTours(filteredTours);
      } else {
        setTours([]);
      }
    } catch (error) {
      console.error('Error loading tours:', error);
      setTours([]);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Reload tours with new filters
    setTimeout(() => loadTours(), 100);
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
    
    setTimeout(() => loadTours(), 100);
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
          const newSet = new Set(prev);
          newSet.delete(tourId);
          return newSet;
        });
        toast.success('Favorilerden kaldırıldı');
      } else {
        await axios.post(`${API}/favorites`, { tour_id: tourId }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setFavorites(prev => new Set([...prev, tourId]));
        toast.success('Favorilere eklendi');
      }
    } catch (error) {
      toast.error('Favori işlemi başarısız');
    }
  };

  const toggleFAQ = (index) => {
    setExpandedFAQ(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const categoryConfig = getCategoryConfig();
  const locationConfig = getLocationConfig();

  // Get display title from admin data or generate from config
  const getDisplayTitle = () => {
    if (categoryData?.title) {
      return categoryData.title;
    }
    
    if (isLocationPage && locationConfig) {
      return `${locationConfig.name} ${categoryConfig.title} Turları`;
    }
    
    return categoryConfig.title;
  };

  // Get display description from admin data or generate from config
  const getDisplayDescription = () => {
    if (categoryData?.description) {
      return categoryData.description;
    }
    
    if (isLocationPage && locationConfig) {
      return `${locationConfig.name} bölgesindeki en güzel ${categoryConfig.title.toLowerCase()} turlarını keşfedin. Profesyonel rehberlik eşliğinde unutulmaz tatil deneyimi yaşayın.`;
    }
    
    return `${categoryConfig.title} kategorisindeki en iyi turları keşfedin ve unutulmaz anılar biriktirin.`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Hierarchical Back Button */}
          <button
            onClick={() => {
              if (isLocationPage) {
                // Alt kategori sayfasındaysa ana kategoriye git
                navigate(`/${categorySlug}`);
              } else {
                // Ana kategori sayfasındaysa tüm kategorilere git
                navigate('/kategoriler');
              }
            }}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              {isLocationPage ? categoryConfig.title : 'Tüm Kategoriler'}
            </span>
          </button>

          {/* Page Title - Using Admin Data */}
          <div className="flex items-center justify-between">
            <div className="w-full">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                {getDisplayTitle()}
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                {getDisplayDescription()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mt-4">
            <MapPin className="w-5 h-5 text-gray-400" />
            <span className="text-gray-500">{tours.length} tur bulundu</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Filtreler</h2>
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Temizle
                </button>
              </div>

              <div className="space-y-6">
                {/* Location Filter */}
                {availableFilters.locations.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lokasyon
                    </label>
                    <select
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tüm Lokasyonlar</option>
                      {availableFilters.locations.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Duration Filter */}
                {availableFilters.durations.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Süre
                    </label>
                    <select
                      value={filters.duration}
                      onChange={(e) => handleFilterChange('duration', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tüm Süreler</option>
                      {availableFilters.durations.map((duration) => (
                        <option key={duration} value={duration}>
                          {duration}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fiyat Aralığı
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Puan
                  </label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => handleFilterChange('minRating', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tüm Puanlar</option>
                    <option value="4.5">4.5+ Yıldız</option>
                    <option value="4.0">4.0+ Yıldız</option>
                    <option value="3.5">3.5+ Yıldız</option>
                    <option value="3.0">3.0+ Yıldız</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Tours */}
          <div className="lg:col-span-3">
            {tours.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {tours.map((tour) => (
                  <Link
                    key={tour.id}
                    to={`/turlar/${tour.slug || createSlug(tour.title)}`}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
                  >
                    <div className="relative">
                      <img
                        src={tour.images?.[0] || '/api/placeholder/400/250'}
                        alt={tour.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        onClick={(e) => toggleFavorite(tour.id, e)}
                        className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
                          favorites.has(tour.id)
                            ? 'bg-red-500 text-white'
                            : 'bg-white/90 text-gray-600 hover:bg-red-500 hover:text-white'
                        }`}
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                      {tour.classification && (
                        <div className="absolute bottom-3 left-3">
                          <span className="bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                            {tour.classification}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {tour.title}
                      </h3>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {tour.location}
                        </span>
                        {tour.rating && (
                          <span className="flex items-center">
                            <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" />
                            {tour.rating}
                          </span>
                        )}
                      </div>
                      
                      {tour.duration && (
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <Clock className="w-4 h-4 mr-1" />
                          {tour.duration}
                        </div>
                      )}
                      
                      {tour.minimum_price && (
                        <div className="text-right">
                          <span className="text-2xl font-bold text-blue-600">
                            ₺{tour.minimum_price.toLocaleString('tr-TR')}
                          </span>
                          <span className="text-gray-500 text-sm ml-1">/ kişi</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 mb-12">
                <div className={`w-24 h-24 bg-${categoryConfig.color}-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl`}>
                  {categoryConfig.icon}
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Henüz tur yok
                </h3>
                <p className="text-gray-600 mb-6">
                  Bu {isLocationPage ? 'bölgede' : 'kategoride'} henüz tur bulunmuyor. Filtreleri temizleyebilir veya diğer seçenekleri kontrol edebilirsiniz.
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-4"
                >
                  Filtreleri Temizle
                </button>
                <Link
                  to="/turlar"
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Tüm Turları Gör
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* FAQ Section - Admin Data */}
        {categoryData?.faq && categoryData.faq.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Sıkça Sorulan Sorular
            </h2>
            <div className="max-w-4xl mx-auto">
              <div className="space-y-6">
                {categoryData.faq.map((faq, index) => (
                  <div 
                    key={index} 
                    className="bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <button
                      className="w-full px-6 py-4 text-left flex items-center justify-between focus:outline-none"
                      onClick={() => toggleFAQ(index)}
                    >
                      <span className="font-medium text-gray-900 pr-4">
                        {faq.question}
                      </span>
                      <ChevronDown 
                        className={`w-5 h-5 text-gray-500 transition-transform duration-200 flex-shrink-0 ${
                          expandedFAQ[index] ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedFAQ[index] && (
                      <div className="px-6 pb-4">
                        <p className="text-gray-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryDetailPage;