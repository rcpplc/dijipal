import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, 
  Users, 
  Calendar, 
  Star, 
  ArrowLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
  Heart,
  ArrowRight
} from 'lucide-react';
import axios from 'axios';
import { updateSEOTags } from '../utils/seo';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { createSlug } from '../utils/slug';
import TourDetailPage from './TourDetailPage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CategoryDetailPage = () => {
  const { categorySlug, locationSlug, slug } = useParams();
  // slug parametresi /:slug route'undan gelir, categorySlug ise /:categorySlug/:locationSlug'dan
  const actualCategorySlug = categorySlug || slug;
  const navigate = useNavigate();
  const { user, token, setShowLoginModal } = useAuth();
  const [searchParams] = React.useState(() => new URLSearchParams(window.location.search));
  const [categoryData, setCategoryData] = useState(null);
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState(new Set());
  const [isTourPage, setIsTourPage] = useState(false);
  const [filters, setFilters] = useState({
    location: '',
    category: '',
    duration: '',
    classification: '',
    minRating: '',
    minPrice: '',
    maxPrice: ''
  });

  useEffect(() => {
    loadCategoryData();
  }, [actualCategorySlug, locationSlug]);

  useEffect(() => {
    loadUserFavorites();
  }, [actualCategorySlug, locationSlug, user, token]);

  const loadCategoryData = async () => {
    try {
      setLoading(true);
      let data;
      
      // ÖNEMLI: Eğer 'fromBackButton' parametresi varsa, bu bir kategori sayfası
      // TourDetailPage'den "Geri Git" ile gelindiyse, tur olarak algılama
      const fromBackButton = searchParams.get('fromBackButton');
      
      if (locationSlug) {
        // Alt kategori (lokasyon) sayfası
        const response = await axios.get(`${API}/categories/${actualCategorySlug}/${locationSlug}`);
        data = response.data;
      } else {
        // Ana kategori sayfası
        const response = await axios.get(`${API}/categories/${actualCategorySlug}`);
        data = response.data;
      }
      
      setCategoryData(data);
      setTours(data.tours || []);
      
      // SEO güncellemeleri
      const seoData = {
        title: data.meta_title || data.title,
        description: data.meta_description || data.description,
        keywords: data.meta_keywords || '',
        canonical: `${window.location.origin}${window.location.pathname}`,
        ogTitle: data.meta_title || data.title,
        ogDescription: data.meta_description || data.description,
        ogImage: data.image || null
      };
      
      updateSEOTags(seoData);
      
    } catch (error) {
      console.error('Kategori verileri yüklenirken hata:', error);
      
      // ÖNEMLI FIX: Eğer 'fromBackButton' parametresi varsa, TurDetailPage olarak render ETME
      const fromBackButton = searchParams.get('fromBackButton');
      
      // Eğer kategori bulunamadıysa ve location slug yoksa VE back button ile gelinmediyse,
      // bu bir tur slug'ı olabilir
      if (error.response?.status === 404 && !locationSlug && !fromBackButton) {
        console.log('Kategori bulunamadı, tur sayfası olarak render edilecek:', actualCategorySlug);
        setIsTourPage(true);
      }
    } finally {
      setLoading(false);
    }
  };

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
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          newFavorites.delete(tourId);
          return newFavorites;
        });
        toast.success('Favorilerden kaldırıldı');
      } else {
        await axios.post(`${API}/favorites`, { tour_id: tourId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites(prev => new Set(prev).add(tourId));
        toast.success('Favorilere eklendi');
      }
    } catch (error) {
      console.error('Favori işlemi hatası:', error);
      toast.error('Bir hata oluştu');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/turlar?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('tr-TR').format(price);
  };

  // Tour Card Component (same as ToursPage)
  const TourCard = ({ tour }) => (
    <Link 
      to={`/${createSlug(tour.title)}?from=${encodeURIComponent(window.location.pathname)}`}
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

  const renderBreadcrumb = () => {
    if (locationSlug) {
      // Alt kategori breadcrumb: Ana Sayfa → [Ana Kategori Adı] → [Lokasyon Adı]
      const parentCategoryTitle = categoryData?.parent_category?.title || categoryData?.subcategory?.parent_category_title || 'Kategori';
      const locationName = categoryData?.subcategory?.location_name || categoryData?.location_name || 'Lokasyon';
      
      return (
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-blue-600">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to={`/${actualCategorySlug}`} className="hover:text-blue-600">
            {parentCategoryTitle}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-800 font-medium">{locationName}</span>
        </nav>
      );
    } else {
      // Ana kategori breadcrumb: Ana Sayfa → [Kategori Adı]
      return (
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-blue-600">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-800 font-medium">{categoryData?.title || 'Kategori'}</span>
        </nav>
      );
    }
  };

  const renderBackButton = () => {
    const handleBackClick = () => {
      if (locationSlug) {
        // Alt kategoriden ana kategoriye dön
        navigate(`/${actualCategorySlug}`);
      } else {
        // Ana kategoriden ana sayfaya dön
        navigate('/');
      }
    };

    let backText = 'Ana Sayfa';
    if (locationSlug) {
      // Alt kategorideyse ana kategori adını göster
      backText = categoryData?.parent_category?.title || categoryData?.subcategory?.parent_category_title || 'Ana Kategori';
    }

    return (
      <button
        onClick={handleBackClick}
        className="inline-flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors duration-200"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">{backText}</span>
      </button>
    );
  };

  // Eğer tur sayfası olduğu tespit edildiyse TourDetailPage render et
  if (isTourPage) {
    return <TourDetailPage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Kategori yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!categoryData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Kategori Bulunamadı</h1>
          <p className="text-gray-600 mb-6">Aradığınız kategori mevcut değil.</p>
          <button
            onClick={() => navigate('/kategoriler')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Kategorilere Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderBreadcrumb()}
          {renderBackButton()}
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {locationSlug 
                  ? (categoryData?.page_title || categoryData?.subcategory?.title || categoryData?.title)
                  : categoryData?.title
                }
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className={`lg:col-span-1 ${filtersVisible ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <h3 className="text-lg font-semibold text-gray-900">Filtreler</h3>
                <button
                  onClick={() => setFiltersVisible(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4 hidden lg:block">Filtreler</h3>
              
              {/* Search */}
              <form onSubmit={handleSearch} className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tur ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </form>

              {/* Alt Kategoriler (sadece ana kategori sayfasında) */}
              {!locationSlug && categoryData.subcategories && categoryData.subcategories.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Bu Kategori Lokasyonları:</h4>
                  <div className="space-y-2">
                    {categoryData.subcategories.map((subcategory) => (
                      <Link
                        key={subcategory.id}
                        to={`/${categorySlug}/${subcategory.location_slug}`}
                        className="block p-3 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      >
                        {subcategory.location_name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tours Grid */}
          <div className="lg:col-span-3">
            {/* Mobile Filter Toggle */}
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h2 className="text-xl font-semibold text-gray-900">
                {tours.length} tur bulundu
              </h2>
              <button
                onClick={() => setFiltersVisible(true)}
                className="flex items-center space-x-2 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>Filtreler</span>
              </button>
            </div>

            <div className="hidden lg:block mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {tours.length} tur bulundu
              </h2>
            </div>

            {/* Tours Grid */}
            {tours.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {tours.map((tour) => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="max-w-md mx-auto">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Bu kategoride tur bulunamadı
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Şu anda bu kategoride aktif tur bulunmuyor. Diğer kategorileri inceleyebilirsiniz.
                  </p>
                  <Link
                    to="/turlar"
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Tüm Turları Görüntüle
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Category Description Section - Only for main categories */}
        {!locationSlug && categoryData?.description && (
          <div className="mt-12 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Hakkında</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 leading-relaxed">
                {categoryData.description}
              </p>
            </div>
          </div>
        )}

        {/* Admin Description Section - Only for subcategories */}
        {locationSlug && categoryData?.subcategory?.description && (
          <div className="mt-12 bg-white rounded-lg shadow-md p-8">

            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 leading-relaxed">
                {categoryData.subcategory.description}
              </p>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        {(() => {
          let faqData = null;
          
          if (locationSlug) {
            // Alt kategori için subcategory FAQ'ini kullan
            faqData = categoryData?.subcategory?.faq || categoryData?.parent_category?.faq;
          } else {
            // Ana kategori için category FAQ'ini kullan
            faqData = categoryData?.faq;
          }
          
          
          return faqData && faqData.length > 0;
        })() && (
          <div className="mt-12 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sıkça Sorulan Sorular</h2>
            <div className="space-y-4">
              {(() => {
                let faqData = null;
                
                if (locationSlug) {
                  faqData = categoryData?.subcategory?.faq || categoryData?.parent_category?.faq || [];
                } else {
                  faqData = categoryData?.faq || [];
                }
                
                return faqData.map((item, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {item.question}
                    </h3>
                    <p className="text-gray-600">
                      {item.answer}
                    </p>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryDetailPage;