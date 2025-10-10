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
      name: category,
      title: category,
      icon: '🚢',
      color: 'gray',
      description: `${category} kategorisindeki turlar`
    };
  };

  useEffect(() => {
    loadCategoryData();
    loadTours();
  }, [category]);

  const loadCategoryData = async () => {
    try {
      const response = await axios.get(`${API}/categories/${category}`);
      setCategoryData(response.data);
    } catch (error) {
      // Use default category config if API fails
      setCategoryData(getCategoryConfig());
    }
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
          const tourCategory = tour.category || '';
          return tourCategory.toLowerCase().includes(config.name.toLowerCase()) ||
                 tourCategory === config.name ||
                 (category === 'mavi-yolculuk' && tourCategory.toLowerCase().includes('mavi'));
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

  const config = getCategoryConfig();

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

          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="w-full">
              <div className="flex items-center space-x-4 mb-4">
                <div className={`w-16 h-16 bg-${config.color}-100 rounded-2xl flex items-center justify-center text-3xl`}>
                  {config.icon}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                    {categoryData?.title || config.title}
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-2">
                    {categoryData?.description || config.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {tours.length} tur bulundu
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tours Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {config.icon}
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Henüz tur yok
            </h3>
            <p className="text-gray-600 mb-6">
              Bu kategoride henüz tur bulunmuyor. Diğer kategorileri kontrol edebilirsiniz.
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
      </div>
    </div>
  );
};

export default CategoryPage;