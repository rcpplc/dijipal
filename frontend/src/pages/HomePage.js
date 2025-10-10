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
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredTours, setFeaturedTours] = useState([]);
  const [popularTours, setPopularTours] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [favorites, setFavorites] = useState(new Set());

  // Hero carousel images - Fethiye, Göcek, Marmaris Koyları
  const heroImages = [
    "https://images.unsplash.com/photo-1498222954553-93fc8d1941da?w=1920&q=85", // Fethiye Ölüdeniz - Mavi Lagün havadan
    "https://images.unsplash.com/photo-1754212398287-753f400bd1ef?w=1920&q=85", // Göcek Koyu - Yelkenli tekne turkuaz suda
    "https://images.unsplash.com/photo-1529528018027-2ee0409703af?w=1920&q=85"  // Marmaris Koyu - Koy manzarası tekne ve dağlar
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
    navigate(`/tur/${createSlug(tour.title)}`);
  };

  // Tour Card Component
  // Toggle favorite function
  const toggleFavorite = async (tourId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Favorilere eklemek için giriş yapmalısınız');
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
        toast.success('Favorilerden çıkarıldı');
      } else {
        await axios.post(`${API}/favorites/${tourId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites(prev => new Set([...prev, tourId]));
        toast.success('Favorilere eklendi');
      }
    } catch (error) {
      console.error('Favorite toggle error:', error);
      toast.error('Bir hata oluştu');
    }
  };

  // Load user favorites
  useEffect(() => {
    const loadFavorites = async () => {
      if (user && token) {
        try {
          const response = await axios.get(`${API}/favorites`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setFavorites(new Set(response.data.map(fav => fav.tour_id)));
        } catch (error) {
          console.error('Error loading favorites:', error);
        }
      }
    };
    loadFavorites();
  }, [user, token]);

  const TourCard = ({ tour }) => (
    <Link 
      to={`/tur/${createSlug(tour.title)}`} 
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
                return 'Gün';
              })()}
            </span>
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

  // Category Card Component
  const CategoryCard = ({ category }) => {
    const IconComponent = category.icon || Compass;
    
    return (
      <div
        onClick={() => navigateToCategory(category)}
        className="group relative bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-blue-300 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
      >
        {/* Category Image with Gradient Overlay */}
        <div className="relative h-56 overflow-hidden">
          {category.image ? (
            <>
              <img
                src={category.image}
                alt={category.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            </>
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${category.color} flex items-center justify-center relative`}>
              <IconComponent className="w-20 h-20 text-white opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
          )}
          
          {/* Tour Count Badge - Modern Design */}
          <div className="absolute top-4 right-4">
            <div className="bg-white/95 backdrop-blur-md rounded-lg px-3 py-1.5 shadow-lg">
              <div className="flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-sm font-semibold text-gray-800">
                  {category.tours_count || 0} Tur
                </span>
              </div>
            </div>
          </div>

          {/* Category Title on Image */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">
              {category.title}
            </h3>
          </div>
        </div>
        
        {/* Category Info - Cleaner Design */}
        <div className="p-5">
          <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2 min-h-[40px]">
            {category.description || 'En güzel rotalar ve deneyimler sizi bekliyor'}
          </p>
          
          {/* Action Button */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
              Turları Keşfet
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-all duration-300">
              <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition-transform duration-300" />
            </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
                  <div className="w-16 h-16 bg-gray-200 rounded-2xl mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

      {/* Locations Section - Premium Design */}
      <div className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-md rounded-full px-6 py-2 mb-6">
              <MapPin className="w-5 h-5 text-white" />
              <span className="text-white font-medium">Bölgelere Göre Keşfet</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Popüler Destinasyonlar
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Türkiye'nin en güzel kıyılarında unutulmaz anılar biriktirin
            </p>
          </div>

          {/* Location Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              {
                name: 'Göcek',
                description: '12 Ada ve kristal berraklığında koylar',
                image: 'https://images.unsplash.com/photo-1664268406960-7dbe536f987e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxHJUMzJUI2Y2VrJTIwVHVya2V5JTIwbWFyaW5hfGVufDB8fHx8MTc2MDEwODEzOHww&ixlib=rb-4.1.0&q=85',
                tours: 2,
                highlight: 'Mavi Yolculuk Başkenti'
              },
              {
                name: 'Fethiye',
                description: 'Ölüdeniz ve Kelebek Vadisi',
                image: 'https://images.unsplash.com/photo-1686465602845-868cebea024a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwyfHxGZXRoaXllJTIwJUMzJTk2bCVDMyVCQ2Rlbml6JTIwYmVhY2h8ZW58MHx8fHwxNzYwMTA4MTQ2fDA&ixlib=rb-4.1.0&q=85',
                tours: 1,
                highlight: 'Doğa Harikası'
              },
              {
                name: 'Marmaris',
                description: 'Canlı marina ve turkuaz sular',
                image: 'https://images.unsplash.com/photo-1529528018027-2ee0409703af?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwxfHxNYXJtYXJpcyUyMFR1cmtleSUyMGJheXxlbnwwfHx8fDE3NjAxMDgxNTN8MA&ixlib=rb-4.1.0&q=85',
                tours: 0,
                highlight: 'Eğlence Merkezi'
              },
              {
                name: 'Bodrum',
                description: 'Gökova Körfezi ve Orak Adası',
                image: 'https://images.unsplash.com/photo-1580492327426-62eaa87cdda4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxCb2RydW0lMjBUdXJrZXklMjBjYXN0bGV8ZW58MHx8fHwxNzYwMTA4MTYwfDA&ixlib=rb-4.1.0&q=85',
                tours: 0,
                highlight: 'Ege İncisi'
              }
            ].map((location, index) => (
              <Link
                key={location.name}
                to={`/turlar?location=${location.name}`}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Location Image */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={location.image}
                    alt={location.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                  
                  {/* Highlight Badge */}
                  <div className="absolute top-4 left-4">
                    <div className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                      {location.highlight}
                    </div>
                  </div>

                  {/* Location Name */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-3xl font-bold text-white mb-2">
                      {location.name}
                    </h3>
                    <p className="text-blue-100 text-sm mb-3">
                      {location.description}
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                        <Compass className="w-4 h-4 text-white" />
                        <span className="text-white text-sm font-medium">{location.tours} Tur</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hover Action */}
                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-white rounded-full p-4 shadow-2xl transform scale-0 group-hover:scale-100 transition-transform duration-300">
                    <ArrowRight className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <Link
              to="/turlar"
              className="inline-flex items-center space-x-3 bg-white hover:bg-gray-50 text-blue-600 px-8 py-4 rounded-full font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <span>Tüm Lokasyonları Keşfet</span>
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