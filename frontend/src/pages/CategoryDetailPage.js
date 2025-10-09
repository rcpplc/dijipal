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

  const navigateToTour = (tour) => {
    navigate(`/turlar/${createSlug(tour.title)}`);
  };

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
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-white">
        {displayCategory.image && (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
            style={{ backgroundImage: `url(${displayCategory.image})` }}
          ></div>
        )}
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-blue-200 text-sm mb-8">
            <button onClick={() => navigate('/')} className="hover:text-white">Ana Sayfa</button>
            <ChevronRight className="w-4 h-4" />
            <button onClick={() => navigate(`/${categorySlug}`)} className="hover:text-white">
              {displayCategory.title}
            </button>
            {isLocationPage && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white">{categoryData.location.location_name}</span>
              </>
            )}
          </nav>

          <div className="max-w-4xl">
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-4xl">{isLocationPage ? '📍' : '🏷️'}</span>
              <h1 className="text-4xl md:text-5xl font-bold">
                {isLocationPage ? categoryData.title : displayCategory.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-blue-100">
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Category Features */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Bu Kategorinin Özellikleri
              </h3>
              {/* Show subcategories if main category */}
              {!isLocationPage && categoryData.subcategories && categoryData.subcategories.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Lokasyonlar:</h4>
                  <ul className="space-y-2">
                    {categoryData.subcategories.map((subcategory) => (
                      <li key={subcategory.id}>
                        <button
                          onClick={() => navigate(`/${categorySlug}/${subcategory.location_slug}`)}
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

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Kategori İstatistikleri
              </h3>
              <div className="space-y-4">
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
                      ₺{Math.min(...tours.map(t => t.minimum_price || 0).filter(p => p > 0)).toLocaleString('tr-TR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tours Grid */}
            <div className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isLocationPage ? categoryData.title : displayCategory.title} ({tours.length})
                </h2>
              </div>

              {tours.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tours.map((tour) => (
                    <div
                      key={tour.id}
                      onClick={() => navigateToTour(tour)}
                      className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden cursor-pointer group"
                    >
                      <div className="relative">
                        <img
                          src={tour.images?.[0] || '/placeholder-tour.jpg'}
                          alt={tour.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                            {tour.category}
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>{tour.location}</span>
                        </div>

                        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                          {tour.title}
                        </h3>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {tour.description || tour.short_description}
                        </p>

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">(24)</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{tour.duration_days || 1} Gün</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold text-blue-600">
                            ₺{(tour.minimum_price || 0).toLocaleString('tr-TR')}
                            <span className="text-sm font-normal text-gray-600 ml-1">/kişi</span>
                          </div>

                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                            Detaylar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
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
              )}
            </div>

            {/* Description Section */}
            {(isLocationPage ? categoryData.description : displayCategory.description) && (
              <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {isLocationPage ? categoryData.title : displayCategory.title} Hakkında
                </h2>
                <div className="text-gray-700 leading-relaxed">
                  <p>{isLocationPage ? categoryData.description : displayCategory.description}</p>
                </div>
              </div>
            )}

            {/* FAQ Section */}
            {displayCategory.faq && displayCategory.faq.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-6 h-6 text-blue-600">❓</div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Sıkça Sorulan Sorular
                  </h2>
                </div>

                <div className="space-y-4">
                  {displayCategory.faq.map((faq, index) => (
                    <details key={index} className="border border-gray-200 rounded-lg group">
                      <summary className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 cursor-pointer list-none">
                        <span className="font-semibold text-gray-900">
                          {faq.question}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-500 group-open:rotate-90 transition-transform" />
                      </summary>
                      
                      <div className="px-6 pb-4">
                        <p className="text-gray-700 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryDetailPage;