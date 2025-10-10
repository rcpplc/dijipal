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
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    duration: '',
    minRating: '',
    classification: '',
    startDate: '',
    endDate: ''
  });

  // Check if this is a location page (subcategory)
  const isLocationPage = !!locationSlug;

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
      }
    };
    
    return categoryMapping[categorySlug] || {
      name: categorySlug,
      title: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1),
      icon: '🚢',
      color: 'gray'
    };
  };

  const getLocationConfig = () => {
    if (!locationSlug) return null;
    
    return {
      name: locationSlug.charAt(0).toUpperCase() + locationSlug.slice(1),
      title: locationSlug.charAt(0).toUpperCase() + locationSlug.slice(1),
      slug: locationSlug
    };
  };

  // Default content for categories/subcategories
  const getDefaultContent = () => {
    const category = getCategoryConfig();
    const location = getLocationConfig();
    
    const defaultFAQ = [
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
    ];

    if (isLocationPage) {
      return {
        title: `${location.name} ${category.title} Turları`,
        custom_title: `${location.name} ${category.title} Turları - Premium Deneyim`,
        description: `${location.name} bölgesindeki en güzel ${category.title.toLowerCase()} turlarını keşfedin. Profesyonel rehberlik, modern tekne filosu ve güvenli rezervasyon sistemi ile unutulmaz tatil deneyimi yaşayın.`,
        faq: defaultFAQ,
        category: {
          title: category.title,
          name: category.name
        },
        location: {
          location_name: location.name,
          description: `${location.name} bölgesindeki premium ${category.title.toLowerCase()} turları`,
          seo_title: null,
          seo_description: null,
          seo_keywords: null
        }
      };
    } else {
      return {
        title: category.title,
        description: `${category.title} kategorisindeki en iyi turları keşfedin ve unutulmaz anılar biriktirin.`,
        faq: defaultFAQ,
        seo_title: null,
        seo_description: null,
        seo_keywords: null
      };
    }
  };

  useEffect(() => {
    loadData();
  }, [categorySlug, locationSlug]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load category/subcategory data
      let categoryResponse = null;
      try {
        const url = isLocationPage 
          ? `${API}/categories/${categorySlug}/locations/${locationSlug}`
          : `${API}/categories/${categorySlug}`;
        categoryResponse = await axios.get(url);
      } catch (error) {
        console.log('Category API not available, using default data');
      }
      
      const data = categoryResponse?.data || getDefaultContent();
      setCategoryData(data);
      
      // Load tours
      await loadTours();
      
      // Update SEO after data is loaded
      updateSEO();

    } catch (error) {
      console.error('Error loading data:', error);
      setCategoryData(getDefaultContent());
      setTours([]);
      updateSEO();
    } finally {
      setLoading(false);
    }
  };

  // Modern SEO update with admin settings priority
  const updateSEO = () => {
    const category = getCategoryConfig();
    const location = getLocationConfig();
    const tourCount = tours.length;
    
    if (isLocationPage) {
      // Subcategory SEO - check admin settings first
      const adminSEO = categoryData?.location;
      if (adminSEO?.seo_title || adminSEO?.seo_description || adminSEO?.seo_keywords) {
        updateSEOTags({
          title: adminSEO.seo_title || `${location.name} ${category.title} Turları - Mavibilet`,
          description: adminSEO.seo_description || `${location.name} bölgesindeki premium ${category.title.toLowerCase()} turları. ${tourCount} farklı seçenek ile unutulmaz deneyimler.`,
          keywords: adminSEO.seo_keywords || `${location.name} ${category.title.toLowerCase()}, ${location.name} tekne turu, mavi yolculuk ${location.name}`,
          canonicalUrl: `${window.location.origin}/${categorySlug}/${locationSlug}`
        });
      } else {
        const seoData = getSEOData.subcategory({
          locationName: location.name,
          categoryTitle: category.title,
          categorySlug,
          locationSlug,
          tourCount
        });
        updateSEOTags(seoData);
      }
    } else {
      // Main category SEO - check admin settings first
      if (categoryData?.seo_title || categoryData?.seo_description || categoryData?.seo_keywords) {
        updateSEOTags({
          title: categoryData.seo_title || `${category.title} Turları - Mavibilet`,
          description: categoryData.seo_description || `${category.title} kategorisindeki en iyi turları keşfedin. ${tourCount} farklı seçenek ile unutulmaz anılar biriktirin.`,
          keywords: categoryData.seo_keywords || `${category.title.toLowerCase()} turları, tekne turu, mavi yolculuk`,
          canonicalUrl: `${window.location.origin}/${categorySlug}`
        });
      } else {
        const seoData = getSEOData.category({
          categoryTitle: category.title,
          categorySlug,
          tourCount
        });
        updateSEOTags(seoData);
      }
    }
  };

  const loadTours = async () => {
    const category = getCategoryConfig();
    const location = getLocationConfig();
    
    try {
      const params = new URLSearchParams();
      params.append('category', category.name);
      
      if (isLocationPage && location) {
        params.append('location', location.name);
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
        
        // Additional filtering
        filteredTours = filteredTours.filter(tour => {
          const tourCategory = tour.category || '';
          const tourLocation = tour.location || '';
          
          const categoryMatch = tourCategory.toLowerCase().includes(category.name.toLowerCase()) ||
                               tourCategory === category.name;
          
          if (isLocationPage && location) {
            const locationMatch = tourLocation.toLowerCase().includes(location.name.toLowerCase());
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

  const category = getCategoryConfig();
  const location = getLocationConfig();
  const displayCategory = isLocationPage ? categoryData?.category || categoryData : categoryData;

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
              {isLocationPage 
                ? (() => {
                    // Alt kategori sayfasında ana kategori adını göster
                    const categoryTitle = displayCategory?.title || categorySlug;
                    if (categoryTitle.includes('-')) {
                      return categoryTitle.split('-').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ');
                    }
                    return categoryTitle;
                  })()
                : 'Tüm Kategoriler' // Ana kategori sayfasında "Tüm Kategoriler" göster
              }
            </span>
          </button>

          {/* Page Title */}
          <div className="flex items-center justify-between">
            <div className="w-full">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                {isLocationPage 
                  ? (categoryData?.custom_title || 
                     `${categoryData?.location?.location_name || location?.name} ${displayCategory?.title || category.title} Turları`)
                  : (displayCategory?.title || category.title)
                }
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                {isLocationPage 
                  ? (categoryData?.location?.description || 
                     `${categoryData?.location?.location_name || location?.name} bölgesindeki en güzel ${displayCategory?.title || category.title.toLowerCase()} turlarını keşfedin. Profesyonel rehberlik ve modern tekne filosu ile unutulmaz tatil deneyimi yaşayın.`)
                  : (displayCategory?.description || 
                     `${displayCategory?.title || category.title} kategorisindeki en iyi turları keşfedin ve unutulmaz anılar biriktirin.`)
                }
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
        {/* Tours Grid */}
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
            <div className={`w-24 h-24 bg-${category.color}-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl`}>
              {category.icon}
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Henüz tur yok
            </h3>
            <p className="text-gray-600 mb-6">
              Bu {isLocationPage ? 'bölgede' : 'kategoride'} henüz tur bulunmuyor. Diğer seçenekleri kontrol edebilirsiniz.
            </p>
            <Link
              to="/turlar"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tüm Turları Gör
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        )}

        {/* FAQ Section */}
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