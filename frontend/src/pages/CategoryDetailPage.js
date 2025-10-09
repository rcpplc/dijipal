import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, Users, Calendar, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { createSlug } from '../utils/slug';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CategoryDetailPage = () => {
  const { categorySlug, locationSlug } = useParams();
  const navigate = useNavigate();
  const [categoryData, setCategoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tours, setTours] = useState([]);

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
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {isLocationPage ? categoryData.title : displayCategory.title}
            </h1>
            
            {isLocationPage && categoryData.description && (
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                {categoryData.description}
              </p>
            )}
            
            {!isLocationPage && displayCategory.description && (
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                {displayCategory.description}
              </p>
            )}

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

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Tours Grid */}
        {tours.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tours.map((tour) => (
              <div
                key={tour.id}
                onClick={() => navigateToTour(tour)}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
              >
                <div className="relative h-48">
                  <img
                    src={tour.images?.[0] || '/placeholder-tour.jpg'}
                    alt={tour.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {tour.category}
                    </span>
                  </div>
                  {tour.minimum_price && (
                    <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 text-gray-900 px-3 py-1 rounded-lg font-bold text-sm">
                      ₺{tour.minimum_price.toLocaleString('tr-TR')}
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {tour.title}
                  </h3>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{tour.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>{tour.pickup_time || '09:00'} - {tour.dropoff_time || '18:00'}</span>
                    </div>
                    {tour.max_participants && (
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span>Max {tour.max_participants} kişi</span>
                      </div>
                    )}
                  </div>

                  {tour.description && (
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {tour.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">4.8</span>
                      <span className="text-sm text-gray-500">(24 değerlendirme)</span>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Detaylar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🚢</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              {isLocationPage 
                ? `${categoryData.location.location_name} bölgesinde henüz ${displayCategory.title.toLowerCase()} turu yok` 
                : `Bu kategoride henüz tur yok`
              }
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Yeni turlar eklendikçe burada görünecek. Bu arada diğer kategorilere göz atabilirsiniz.
            </p>
            <button
              onClick={() => navigate('/tours')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Tüm Turları Görüntüle
            </button>
          </div>
        )}

        {/* FAQ Section */}
        {displayCategory.faq && displayCategory.faq.length > 0 && (
          <div className="mt-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
                Sıkça Sorulan Sorular
              </h2>
              
              <div className="space-y-6">
                {displayCategory.faq.map((item, index) => (
                  <details key={index} className="bg-white rounded-lg shadow p-6 group">
                    <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                      {item.question}
                      <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="mt-4 text-gray-600 leading-relaxed">
                      {item.answer}
                    </div>
                  </details>
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