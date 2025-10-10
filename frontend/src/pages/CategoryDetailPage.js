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
  Heart
} from 'lucide-react';
import axios from 'axios';
import { updateSEOTags } from '../utils/seo';
import { useAuth } from '../App';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CategoryDetailPage = () => {
  const { categorySlug, locationSlug } = useParams();
  const navigate = useNavigate();
  const { user, token, setShowLoginModal } = useAuth();
  const [categoryData, setCategoryData] = useState(null);
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState(new Set());
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
    loadUserFavorites();
  }, [categorySlug, locationSlug, user]);

  const loadCategoryData = async () => {
    try {
      setLoading(true);
      let data;
      
      if (locationSlug) {
        // Alt kategori (lokasyon) sayfası
        const response = await axios.get(`${API}/categories/${categorySlug}/${locationSlug}`);
        data = response.data;
      } else {
        // Ana kategori sayfası
        const response = await axios.get(`${API}/categories/${categorySlug}`);
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
    } finally {
      setLoading(false);
    }
  };

  const loadUserFavorites = async () => {
    if (!user) {
      setFavorites(new Set());
      return;
    }

    try {
      const response = await axios.get(`${API}/favorites`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const favoriteIds = response.data.map(fav => fav.tour_id);
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

  const renderBreadcrumb = () => {
    if (locationSlug) {
      // Alt kategori breadcrumb: Ana Sayfa → [Ana Kategori Adı] → [Lokasyon Adı]
      const parentCategoryTitle = categoryData?.parent_category?.title || categoryData?.subcategory?.parent_category_title || 'Kategori';
      const locationName = categoryData?.subcategory?.location_name || categoryData?.location_name || 'Lokasyon';
      
      return (
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-blue-600">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to={`/${categorySlug}`} className="hover:text-blue-600">
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
        navigate(`/${categorySlug}`);
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
              {(categoryData.description || categoryData.page_description || categoryData.subcategory?.description) && (
                <p className="text-lg text-gray-600 max-w-4xl">
                  {locationSlug 
                    ? (categoryData?.page_description || categoryData?.subcategory?.description || categoryData?.description)
                    : categoryData?.description
                  }
                </p>
              )}
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
                  <div key={tour.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
                    {/* Tour Image */}
                    <div className="aspect-w-16 aspect-h-9 bg-gray-200 relative">
                      {tour.images && tour.images[0] ? (
                        <img
                          src={tour.images[0]}
                          alt={tour.title}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                          <MapPin className="w-12 h-12 text-blue-400" />
                        </div>
                      )}
                      
                      {/* Favorite Button */}
                      <button
                        onClick={(e) => toggleFavorite(tour.id, e)}
                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200 z-20 flex items-center justify-center w-10 h-10"
                        style={{ pointerEvents: 'auto' }}
                      >
                        <Heart 
                          className={`w-5 h-5 ${
                            favorites.has(tour.id) 
                              ? 'text-red-500 fill-current' 
                              : 'text-gray-600'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Tour Info */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {tour.title}
                      </h3>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{tour.location}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{tour.duration}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          <span>Max {tour.max_participants} kişi</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          <span className="text-sm font-medium">{tour.rating || '5.0'}</span>
                          <span className="text-sm text-gray-500 ml-1">
                            ({tour.review_count || 0})
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            ₺{formatPrice(tour.minimum_price || 0)}
                          </div>
                          <div className="text-sm text-gray-500">kişi başı</div>
                        </div>
                      </div>

                      <Link
                        to={`/turlar/${tour.slug}`}
                        className="block w-full mt-4 bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        Detayları Gör
                      </Link>
                    </div>
                  </div>
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
        {((locationSlug ? categoryData?.subcategory?.faq : categoryData?.faq) || categoryData?.parent_category?.faq) && 
         ((locationSlug ? categoryData?.subcategory?.faq : categoryData?.faq) || categoryData?.parent_category?.faq).length > 0 && (
          <div className="mt-12 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sıkça Sorulan Sorular</h2>
            <div className="space-y-4">
              {((locationSlug ? categoryData?.subcategory?.faq : categoryData?.faq) || categoryData?.parent_category?.faq || []).map((item, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.question}
                  </h3>
                  <p className="text-gray-600">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryDetailPage;