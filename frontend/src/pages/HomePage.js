import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  Search, 
  MapPin, 
  Users, 
  Calendar, 
  Star, 
  ArrowRight,
  Award,
  Shield,
  Clock,
  Phone,
  Heart,
  Trees,
  Mountain,
  Building,
  Castle,
  UtensilsCrossed,
  Anchor,
  Waves,
  Compass,
  Camera,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { createSlug } from '../utils/slug';
import { updateSEOTags, getSEOData } from '../utils/seo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredTours, setFeaturedTours] = useState([]);
  const [popularTours, setPopularTours] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Hero carousel images
  const heroImages = [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5", 
    "https://images.unsplash.com/photo-1520637836862-4d197d17c982"
  ];

  // Default categories with icons
  const defaultCategories = [
    {
      id: 'cultural',
      title: 'Kültürel Turlar',
      description: 'Tarihi yerler ve kültürel keşifler',
      icon: Castle,
      color: 'from-purple-500 to-pink-500',
      tours_count: 0
    },
    {
      id: 'nature',
      title: 'Doğa Turları',
      description: 'Milli parklar ve doğal güzellikler',
      icon: Trees,
      color: 'from-green-500 to-emerald-500',
      tours_count: 0
    },
    {
      id: 'adventure',
      title: 'Macera Turları',
      description: 'Adrenalin dolu aktiviteler',
      icon: Mountain,
      color: 'from-orange-500 to-red-500',
      tours_count: 0
    },
    {
      id: 'city',
      title: 'Şehir Turları',
      description: 'Şehirlerin nabzını tutun',
      icon: Building,
      color: 'from-blue-500 to-indigo-500',
      tours_count: 0
    },
    {
      id: 'food',
      title: 'Gastronomi Turları',
      description: 'Yerel lezzetler ve mutfak kültürü',
      icon: UtensilsCrossed,
      color: 'from-yellow-500 to-orange-500',
      tours_count: 0
    },
    {
      id: 'cruise',
      title: 'Kabin Turları',
      description: 'Denizde lüks tatil deneyimi',
      icon: Anchor,
      color: 'from-cyan-500 to-blue-500',
      tours_count: 0
    }
  ];

  useEffect(() => {
    loadData();
    startHeroSlider();
    initializeHomepageSEO();
  }, []);

  // Initialize modern homepage SEO
  const initializeHomepageSEO = () => {
    const seoData = getSEOData.homepage();
    updateSEOTags(seoData);
    
    // Add homepage-specific structured data
    updateSEOTags({
      ...seoData,
      structuredData: {
        ...seoData.structuredData,
        "@graph": [
          seoData.structuredData,
          {
            "@type": "WebSite",
            "@id": `${window.location.origin}/#website`,
            "url": window.location.origin,
            "name": "Mavibilet",
            "description": "Türkiye'nin en kapsamlı mavi yolculuk platformu",
            "potentialAction": [
              {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${window.location.origin}/turlar?search={search_term_string}`
                },
                "query-input": "required name=search_term_string"
              }
            ]
          }
        ]
      }
    });
  };

  const startHeroSlider = () => {
    setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroImages.length);
    }, 5000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load featured tours
      const toursResponse = await axios.get(`${API}/tours?limit=6`);
      if (toursResponse.data && Array.isArray(toursResponse.data)) {
        setFeaturedTours(toursResponse.data.slice(0, 3));
        setPopularTours(toursResponse.data.slice(3, 6));
      }

      // Try to load categories from public API
      try {
        const categoriesResponse = await axios.get(`${API}/public/categories`);
        if (categoriesResponse.data?.categories && Array.isArray(categoriesResponse.data.categories)) {
          const categoryCards = categoriesResponse.data.categories.map(category => ({
            id: category.id,
            slug: category.slug,
            title: category.title,
            description: category.description || `${category.title} kategorisindeki turları keşfedin`,
            image: category.image,
            icon: Anchor, // Default icon, can be customized
            color: 'from-blue-500 to-indigo-500', // Default gradient
            tours_count: category.tours_count || 0
          }));
          setCategories(categoryCards);
        } else {
          setCategories(defaultCategories);
        }
      } catch (error) {
        console.log('Categories API not available, using default categories');
        setCategories(defaultCategories);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setCategories(defaultCategories);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Arama terimi varsa, arama sonuçlarıyla tours sayfasına git
      navigate(`/turlar?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      // Arama kutusu boşsa, sadece turlar sayfasına git
      navigate('/turlar');
    }
  };

  const navigateToCategory = (category) => {
    // Eğer admin panelden gelen kategori ise slug'ına göre yönlendir
    if (category.slug) {
      navigate(`/${category.slug}`);
    } else {
      // Default kategoriler için turlar sayfasına filtre ile git
      navigate(`/turlar?category=${category.id}`);
    }
  };

  const navigateToTour = (tour) => {
    navigate(`/${createSlug(tour.title)}`);
  };

  // Tour Card Component
  const TourCard = ({ tour, featured = false }) => (
    <div 
      onClick={() => navigateToTour(tour)}
      className={`bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group ${
        featured ? 'lg:col-span-2' : ''
      }`}
    >
      <div className="relative">
        <img
          src={tour.images?.[0] || '/placeholder-tour.jpg'}
          alt={tour.title}
          className={`w-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            featured ? 'h-64' : 'h-48'
          }`}
        />
        <div className="absolute top-4 left-4">
          <span className="bg-blue-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
            {tour.category || 'Tur'}
          </span>
        </div>
        <div className="absolute bottom-4 right-4">
          <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium ml-1">{tour.rating || '4.8'}</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center space-x-1 text-sm text-gray-500 mb-3">
          <MapPin className="w-4 h-4" />
          <span>{tour.location}</span>
        </div>

        <h3 className={`font-bold text-gray-900 mb-3 line-clamp-2 leading-tight ${
          featured ? 'text-xl' : 'text-lg'
        }`}>
          {tour.title}
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {tour.short_description || tour.description}
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>
              {tour.duration || tour.duration_days || 1}{' '}
              {tour.duration_unit === 'hours' ? 'Saat' : 'Gün'}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            <span>Max {tour.capacity || 12} kişi</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className={`font-bold text-blue-600 ${featured ? 'text-2xl' : 'text-xl'}`}>
              ₺{(tour.minimum_price || tour.base_price || 0).toLocaleString('tr-TR')}
            </div>
            <div className="text-sm text-gray-500">den başlayan</div>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2">
            <span>İncele</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // Category Card Component
  const CategoryCard = ({ category }) => {
    const IconComponent = category.icon || Compass;
    
    return (
      <div
        onClick={() => navigateToCategory(category)}
        className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
      >
        {/* Category Image */}
        <div className="relative h-48">
          {category.image ? (
            <img
              src={category.image}
              alt={category.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${category.color} flex items-center justify-center`}>
              <IconComponent className="w-16 h-16 text-white opacity-80" />
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all duration-300"></div>
          
          {/* Category badge */}
          <div className="absolute top-4 left-4">
            <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
              {category.tours_count || 0} tur
            </span>
          </div>
        </div>
        
        {/* Category Info */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {category.title}
          </h3>
          
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {category.description || 'Kategori açıklaması bulunamadı'}
          </p>
          
          <div className="flex items-center justify-end">
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-[600px] lg:h-[700px] overflow-hidden">
        {/* Background Images Carousel */}
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image}
              alt={`Hero ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
        ))}

        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="text-center text-white">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
                mavibilet.com
              </h1>
              <p className="text-xl md:text-2xl lg:text-3xl mb-8 opacity-90">
                Akdeniz ve Ege'nin eşsiz koylarında unutulmaz bir deniz tatili yapın
              </p>
              
              {/* Search Bar */}
              <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSearch} className="flex">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                    <input
                      type="text"
                      placeholder="Ara, Keşfet & Rezervasyon Yap"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-14 pr-4 py-4 text-lg rounded-l-2xl border-0 focus:ring-0 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-r-2xl font-semibold text-lg transition-colors duration-200"
                  >
                    Ara
                  </button>
                </form>
                
                {/* Popular Search Terms */}
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <span className="text-white/80 text-sm"></span>
                  {['Fethiye', 'Göcek', 'Marmaris', 'Bodrum'].map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setSearchQuery(term);
                        navigate(`/turlar?search=${term}`);
                      }}
                      className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-full text-sm transition-all duration-200 border border-white/20"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-white scale-125' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Categories Section */}
      <div className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Kategorilere Göre Keşfet
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              İlgi alanınıza uygun tur kategorilerini seçin ve unutulmaz deneyimler yaşayın
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
                  <div className="w-16 h-16 bg-gray-200 rounded-2xl mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}

          {/* View All Categories */}
          <div className="text-center mt-12">
            <Link
              to="/turlar"
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold transition-colors duration-200"
            >
              <span>Tüm Turları Görüntüle</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Tours Section */}
      <div className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Öne Çıkan Turlar
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              En popüler ve beğenilen turlarımızı keşfedin
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl overflow-hidden shadow-lg animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="flex justify-between">
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredTours.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredTours.map((tour, index) => (
                <TourCard 
                  key={tour.id} 
                  tour={tour} 
                  featured={index === 0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚢</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Öne çıkan turlar yükleniyor
              </h3>
              <p className="text-gray-600">
                En popüler turlarımız yakında burada olacak
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="py-16 lg:py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Neden mavibilet.com?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Türkiye'nin en güvenilir kabin kiralama platformu olarak size en iyi hizmeti sunuyoruz
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: 'Güvenli Ödeme',
                description: 'SSL sertifikalı güvenli ödeme altyapısı ile %100 güvenli işlemler'
              },
              {
                icon: Award,
                title: 'Kaliteli Hizmet',
                description: 'Deneyimli mürettebat ve kaliteli teknelerle unutulmaz deneyim'
              },
              {
                icon: Clock,
                title: '7/24 Destek',
                description: 'Uzman müşteri hizmetleri ekibimiz her zaman yanınızda'
              },
              {
                icon: CheckCircle,
                title: 'Kolay Rezervasyon',
                description: 'Sadece birkaç tıkla hızlı ve kolay rezervasyon yapın'
              }
            ].map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-8 h-8 text-blue-600 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 lg:py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Hayalinizdeki Kabin Tatili Sizi Bekliyor
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Türkiye'nin en güzel koylarında unutulmaz anılar biriktirmek için hemen rezervasyon yapın
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/turlar"
              className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-100 transition-colors duration-200 inline-flex items-center justify-center space-x-2"
            >
              <span>Turları Keşfet</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="#"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "tel:+908502555335";
              }}
                className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-100 transition-colors duration-200 inline-flex items-center justify-center space-x-2"            >
              <Phone className="w-5 h-5" />
              <span>Bizi Arayın</span>
            </Link>


            
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;