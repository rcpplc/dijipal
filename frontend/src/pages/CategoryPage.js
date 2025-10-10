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
  ArrowRight,
  Clock
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
  const [expandedFAQ, setExpandedFAQ] = useState({});

  // Category configuration
  const getCategoryConfig = () => {
    const categoryMapping = {
      'mavi-yolculuk': {
        name: 'Mavi yolculuk',
        title: 'Mavi Yolculuk',
        icon: '🌊',
        color: 'blue',
        description: 'Türkiye\'nin en güzel koylarında mavi yolculuk deneyimi'
      },
      'gunubirlik-tekne': {
        name: 'Günübirlik Tekne Turları',
        title: 'Günübirlik Tekne Turları',
        icon: '⛵',
        color: 'green',
        description: 'Günübirlik tekne turları ile denize açılın'
      },
      'kabin-turlari': {
        name: 'Kabin Turları',
        title: 'Kabin Turları',
        icon: '🛥️',
        color: 'purple',
        description: 'Konforlu kabin turları ile tatil yapın'
      },
      'balik-dalis': {
        name: 'Balık & Dalış',
        title: 'Balık & Dalış',
        icon: '🐠',
        color: 'teal',
        description: 'Balık avı ve dalış turları'
      },
      'yuzme-turlari': {
        name: 'Yüzme Turları',
        title: 'Yüzme Turları',
        icon: '🏊',
        color: 'cyan',
        description: 'Eşsiz koylarda yüzme turları'
      }
    };
    
    return categoryMapping[category] || {
      name: category || 'Kategori',
      title: (category || 'Kategori').charAt(0).toUpperCase() + (category || 'kategori').slice(1),
      icon: '🚢',
      color: 'gray',
      description: `${category || 'Bu'} kategorisindeki turlar`
    };
  };

  useEffect(() => {
    if (category) {
      loadCategoryData();
      loadTours();
    }
  }, [category]);

  useEffect(() => {
    loadAvailableFilters();
  }, [tours]);

  const loadCategoryData = async () => {
    try {
      const response = await axios.get(`${API}/categories/${category}`);
      if (response.data) {
        setCategoryData(response.data);
      } else {
        // Use default category config
        const config = getCategoryConfig();
        setCategoryData({
          id: category,
          name: config.name,
          title: config.title,
          description: config.description,
          seo_title: null,
          seo_description: null,
          seo_keywords: null,
          faq: [
            {
              question: "Bu kategorideki turlar nasıl seçilir?",
              answer: `${config.title} kategorisindeki turları fiyat, süre, lokasyon ve puan kriterlerine göre filtreleyebilir, size en uygun seçeneği bulabilirsiniz.`
            },
            {
              question: "Rezervasyon nasıl yapılır?",
              answer: "Beğendiğiniz turun detay sayfasına giderek tarih seçimi yapabilir, kişi sayısını belirleyebilir ve güvenli ödeme ile rezervasyonunuzu tamamlayabilirsiniz."
            },
            {
              question: "İptal koşulları nelerdir?",
              answer: "Turdan 7 gün öncesine kadar ücretsiz iptal hakkınız bulunmaktadır. Daha kısa sürede yapılan iptallerde kesinti uygulanabilir."
            }
          ],
          is_active: true
        });
      }
    } catch (error) {
      console.log('Category API not available, using default data');
      // Use default category config even on error
      const config = getCategoryConfig();
      setCategoryData({
        id: category,
        name: config.name,
        title: config.title,
        description: config.description,
        seo_title: null,
        seo_description: null,
        seo_keywords: null,
        faq: [],
        is_active: true
      });
    }
  };

  // Load available filter options from tour data
  const loadAvailableFilters = () => {
    if (tours.length === 0) return;

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
  };

  // Modern SEO update with admin settings priority
  const updateSEO = () => {
    const config = getCategoryConfig();
    const tourCount = tours.length;
    
    // Priority: Admin SEO > Category Config > Default Template
    if (categoryData?.seo_title || categoryData?.seo_description || categoryData?.seo_keywords) {
      // Use admin SEO settings
      updateSEOTags({
        title: categoryData.seo_title || `${config.title} Turları - Mavibilet`,
        description: categoryData.seo_description || `${config.title} kategorisindeki en iyi turları keşfedin. ${tourCount} farklı seçenek ile unutulmaz anılar biriktirin.`,
        keywords: categoryData.seo_keywords || `${config.title.toLowerCase()} turları, tekne turu, mavi yolculuk`,
        canonicalUrl: `${window.location.origin}/${category}`,
        structuredData: {
          "@context": "https://schema.org",
          "@type": "TouristDestination",
          "name": `${config.title} Turları`,
          "description": categoryData.seo_description || config.description,
          "url": `${window.location.origin}/${category}`,
          "numberOfItems": tourCount
        }
      });
    } else {
      // Use default SEO template
      const seoData = getSEOData.category({
        categoryTitle: config.title,
        categorySlug: category,
        tourCount: tourCount,
        categoryIcon: config.icon
      });
      updateSEOTags(seoData);
    }
  };

  const loadTours = async () => {
    try {
      setLoading(true);
      const config = getCategoryConfig();
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('category', config.name);
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value);
        }
      });

      const response = await axios.get(`${API}/tours?${params.toString()}`);
      
      if (response.data && Array.isArray(response.data)) {
        let filteredTours = response.data;
        
        // Additional frontend filtering if needed
        filteredTours = filteredTours.filter(tour => {
          const tourCategory = (tour.category || '').toLowerCase();
          const configName = config.name.toLowerCase();
          return tourCategory.includes(configName) ||
                 tourCategory === config.name ||
                 (category === 'mavi-yolculuk' && tourCategory.includes('mavi'));
        });
        
        setTours(filteredTours);
      } else {
        setTours([]);
      }
      
      // Update SEO after tours are loaded
      updateSEO();

    } catch (error) {
      console.error('Error loading tours:', error);
      setTours([]);
      toast.error('Turlar yüklenirken hata oluştu');
      updateSEO(); // Update SEO even on error
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
    setTimeout(() => loadTours(), 100);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
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

  const config = getCategoryConfig();

  // Get display data from admin or config
  const getDisplayTitle = () => {
    return categoryData?.title || config.title;
  };

  const getDisplayDescription = () => {
    return categoryData?.description || config.description;
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
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Hierarchical Back Button */}
          <button
            onClick={() => navigate('/kategoriler')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tüm Kategoriler</span>
          </button>

          {/* Page Header - Admin Data */}
          <div className="flex items-center justify-between">
            <div className="w-full">
              <div className="flex items-center space-x-4 mb-4">
                <div className={`w-16 h-16 bg-${config.color}-100 rounded-2xl flex items-center justify-center text-3xl`}>
                  {config.icon}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                    {getDisplayTitle()}
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-2">
                    {getDisplayDescription()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {tours.length} tur bulundu
                </span>
                {availableFilters.locations.length > 0 && (
                  <span className="flex items-center">
                    <Building className="w-4 h-4 mr-1" />
                    {availableFilters.locations.length} lokasyon
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Dynamic Filters */}
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

                {/* Classification Filter */}
                {availableFilters.classifications.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sınıflandırma
                    </label>
                    <select
                      value={filters.classification}
                      onChange={(e) => handleFilterChange('classification', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tüm Sınıflar</option>
                      {availableFilters.classifications.map((classification) => (
                        <option key={classification} value={classification}>
                          {classification}
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

              {/* Subcategories - Show popular locations */}
              {availableFilters.locations.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Bu Kategori Lokasyonları
                  </h3>
                  <div className="space-y-2">
                    {availableFilters.locations.slice(0, 5).map((location) => (
                      <Link
                        key={location}
                        to={`/${category}/${createSlug(location)}`}
                        className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{location}</span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tours Grid */}
          <div className="lg:col-span-3">
            {tours.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="text-center py-12">
                <div className={`w-24 h-24 bg-${config.color}-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl`}>
                  {config.icon}
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Henüz tur yok
                </h3>
                <p className="text-gray-600 mb-6">
                  Bu kategoride henüz tur bulunmuyor. Filtreleri temizleyebilir veya diğer kategorileri kontrol edebilirsiniz.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Filtreleri Temizle
                  </button>
                  <Link
                    to="/kategoriler"
                    className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Tüm Kategoriler
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FAQ Section - Admin Data */}
        {categoryData?.faq && categoryData.faq.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mt-12">
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

export default CategoryPage;