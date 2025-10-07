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
  UtensilsCrossed
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { createSlug } from '../utils/slug';
import SearchBottomSheet from '../components/search/SearchBottomSheet';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const { user, setShowLoginModal, setLoginMode } = useAuth();
  // Component refresh
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredTours, setFeaturedTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [favorites, setFavorites] = useState(new Set());
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const heroImages = [
    "https://images.pexels.com/photos/18754200/pexels-photo-18754200.jpeg", // Göcek Bay aerial view
    "https://images.unsplash.com/photo-1529528018027-2ee0409703af", // Marmaris Bay sailing boat
    "https://images.unsplash.com/photo-1727715220090-8e05aaa5b4fa" // Bodrum Bay crystal waters
  ];

  const heroTitles = [
    {
      main: " ile",
      subtitle: "Mavi Yolculuğun Keyfini Çıkarın"
    },
    {
      main: "Kabin Kiralama ile", 
      subtitle: "Göcek Koylarının Keyfini Çıkarın"
    },
    {
      main: "Kabin Kiralama ile",
      subtitle: "Rüzgarın Keyfini Çıkarın"
    }
  ];

  useEffect(() => {
    loadFeaturedTours();
    seedSampleData();
    if (user) {
      loadFavorites();
    }
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const seedSampleData = async () => {
    try {
      await axios.post(`${API}/seed-data`);
    } catch (error) {
      console.log('Sample data already exists or error occurred');
    }
  };

  const loadFeaturedTours = async () => {
    try {
      const response = await axios.get(`${API}/tours?limit=6`);
      setFeaturedTours(response.data);
    } catch (error) {
      console.error('Error loading tours:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    // Track search behavior if there's a query
    if (searchQuery.trim()) {
      try {
        const history = JSON.parse(localStorage.getItem('tourSearchHistory') || '[]');
        const searchData = {
          searchQuery: searchQuery.trim(),
          timestamp: new Date().toISOString(),
          searchLocation: 'homepage'
        };
        
        const updatedHistory = [searchData, ...history.slice(0, 19)];
        localStorage.setItem('tourSearchHistory', JSON.stringify(updatedHistory));
      } catch (error) {
        console.error('Error tracking search:', error);
      }
      
      navigate(`/turlar?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      // If no search query, show all tours
      navigate('/turlar');
    }
  };

  // Advanced search handler for SearchBottomSheet
  const handleAdvancedSearch = (searchData) => {
    console.log('Gelişmiş arama verileri:', searchData);
    
    // Build query parameters
    const params = new URLSearchParams();
    
    if (searchData.query && searchData.query.trim()) {
      params.set('search', searchData.query.trim());
    }
    
    if (searchData.filters.location) {
      params.set('location', searchData.filters.location);
    }
    
    if (searchData.filters.category) {
      params.set('category', searchData.filters.category);
    }
    
    if (searchData.filters.dateRange?.start) {
      params.set('startDate', searchData.filters.dateRange.start);
    }
    
    if (searchData.filters.dateRange?.end) {
      params.set('endDate', searchData.filters.dateRange.end);
    }
    
    // Navigate to tours page with filters
    const queryString = params.toString();
    navigate(`/turlar${queryString ? `?${queryString}` : ''}`);
  };

  const loadFavorites = async () => {
    try {
      const response = await axios.get(`${API}/favorites`);
      const favoriteIds = new Set(response.data.map(tour => tour.id));
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (tourId) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    try {
      const isFavorited = favorites.has(tourId);
      
      if (isFavorited) {
        await axios.delete(`${API}/favorites/${tourId}`);
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(tourId);
          return newSet;
        });
        toast.success('Favorilerden çıkarıldı');
      } else {
        await axios.post(`${API}/favorites/${tourId}`);
        setFavorites(prev => new Set([...prev, tourId]));
        toast.success('Favorilere eklendi');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Bir hata oluştu');
    }
  };

  const categories = [
    {
      name: 'Kültürel',
      icon: 'MapPin',
      value: 'cultural',
      description: 'Tarihi yerler ve müzeler',
      color: 'blue'
    },
    {
      name: 'Doğa',
      icon: 'Trees',
      value: 'nature',
      description: 'Doğal güzellikler',
      color: 'green'
    },
    {
      name: 'Macera',
      icon: 'Mountain',
      value: 'adventure',
      description: 'Adrenalin ve heyecan',
      color: 'orange'
    },
    {
      name: 'Şehir',
      icon: 'Building',
      value: 'city',
      description: 'Şehir keşfi',
      color: 'purple'
    },
    {
      name: 'Tarihi',
      icon: 'Castle',
      value: 'historical',
      description: 'Antik medeniyetler',
      color: 'amber'
    },
    {
      name: 'Gastronomi',
      icon: 'UtensilsCrossed',
      value: 'food',
      description: 'Lezzet turları',
      color: 'red'
    }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Güvenli Rezervasyon',
      description: 'SSL sertifikası ve güvenli ödeme altyapısı ile korumalı rezervasyon sistemi'
    },
    {
      icon: Award,
      title: 'Kaliteli Operatörler',
      description: 'Deneyimli ve sertifikalı tur operatörleri ile unutulmaz deneyimler'
    },
    {
      icon: Clock,
      title: '7/24 Destek',
      description: 'Seyahatiniz süresince kesintisiz müşteri desteği'
    },
    {
      icon: Phone,
      title: 'Anında Onay',
      description: 'Rezervasyon onayınızı SMS ve e-posta ile anında alın'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] overflow-hidden">
        {/* Background Images */}
        <div className="absolute inset-0">
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
              <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            </div>
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
              <span className="block transition-all duration-1000">{heroTitles[currentSlide].main}</span>
              <span 
                key={currentSlide} 
                className="block text-blue-300 text-xl sm:text-2xl md:text-3xl lg:text-4xl opacity-0 animate-fade-in-subtitle"
                style={{
                  animation: 'fadeInSubtitle 1000ms ease-in-out 1000ms forwards'
                }}
              >
                {heroTitles[currentSlide].subtitle}
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-gray-100 px-2">
              Akdeniz ve Ege'nin eşsiz koylarında unutulmaz bir deniz tatili yapın
            </p>

            {/* Enhanced Search Bar */}
            <div className="max-w-2xl mx-auto mb-6 sm:mb-8 animate-fade-in-up px-4 space-y-3">
              {/* Main Search Form */}
              <form onSubmit={handleSearch}>
                <div className="flex bg-white rounded-full shadow-2xl overflow-hidden">
                  <div className="flex-1 flex items-center px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Hangi koya yelken açmak istiyorsunuz?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 outline-none text-gray-800 placeholder-gray-500 text-sm sm:text-base"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 transition-colors duration-200 flex items-center space-x-1 sm:space-x-2"
                  >
                    <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline text-sm sm:text-base">Ara</span>
                  </button>
                </div>
              </form>
              
              {/* Advanced Search Button */}
              <div className="text-center">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="text-white/80 hover:text-white text-sm underline transition-colors duration-200 flex items-center space-x-1 mx-auto"
                >
                  <span>Gelişmiş Arama</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CTA Section Removed - Clean search-focused design */}
          </div>
        </div>

        {/* Slide Navigation */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Navigation arrows removed for cleaner design */}
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Kategorilere Göre Keşfet
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              İlgi alanınıza uygun tur kategorilerinden birini seçin ve hayalinizdeki tatili planlayın
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => {
              let IconComponent;
              switch(category.icon) {
                case 'MapPin': IconComponent = MapPin; break;
                case 'Trees': IconComponent = Trees; break;
                case 'Mountain': IconComponent = Mountain; break;
                case 'Building': IconComponent = Building; break;
                case 'Castle': IconComponent = Castle; break;
                case 'UtensilsCrossed': IconComponent = UtensilsCrossed; break;
                default: IconComponent = MapPin;
              }
              
              return (
                <Link
                  key={category.value}
                  to={`/category/${category.value}`}
                  className="group bg-white rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 ${
                    category.color === 'blue' ? 'bg-blue-100' :
                    category.color === 'green' ? 'bg-green-100' :
                    category.color === 'orange' ? 'bg-orange-100' :
                    category.color === 'purple' ? 'bg-purple-100' :
                    category.color === 'amber' ? 'bg-amber-100' :
                    'bg-red-100'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      category.color === 'blue' ? 'text-blue-600' :
                      category.color === 'green' ? 'text-green-600' :
                      category.color === 'orange' ? 'text-orange-600' :
                      category.color === 'purple' ? 'text-purple-600' :
                      category.color === 'amber' ? 'text-amber-600' :
                      'text-red-600'
                    }`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                    {category.name}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {category.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Regions Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Bölgelere Göre Keşfet
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Türkiye'nin her köşesinde sizi bekleyen eşsiz deneyimler
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'İstanbul & Marmara',
                image: 'https://images.unsplash.com/photo-1613381234024-4e0bdcaf86ce',
                tourCount: 15,
                description: 'Tarihi yarımada, Boğaz turları'
              },
              {
                name: 'Kapadokya',
                image: 'https://images.pexels.com/photos/34020240/pexels-photo-34020240.jpeg',
                tourCount: 12,
                description: 'Balon turları, peribacaları'
              },
              {
                name: 'Antalya & Akdeniz',
                image: 'https://images.unsplash.com/photo-1563999774341-62c6656086cb',
                tourCount: 18,
                description: 'Deniz, güneş, antik şehirler'
              },
              {
                name: 'Ege Bölgesi',
                image: 'https://images.unsplash.com/photo-1605640840605-14ac1855827b',
                tourCount: 10,
                description: 'Antik şehirler, doğal güzellikler'
              },
              {
                name: 'Karadeniz',
                image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
                tourCount: 8,
                description: 'Yaylalar, yeşil doğa'
              },
              {
                name: 'Doğu Anadolu',
                image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a8e',
                tourCount: 6,
                description: 'Dağlar, göller, kültür'
              }
            ].map((region, index) => (
              <Link
                key={index}
                to={`/turlar?region=${region.name}`}
                className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="aspect-video">
                  <img
                    src={region.image}
                    alt={region.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">{region.name}</h3>
                  <p className="text-sm text-gray-200 mb-2">{region.description}</p>
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{region.tourCount} tur</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tours Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Öne Çıkan Turlar
              </h2>
              <p className="text-lg text-gray-600">
                En popüler ve beğenilen turlarımızı keşfedin
              </p>
            </div>
            <Link
              to="/turlar"
              className="hidden md:flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              <span>Tümünü Gör</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTours.map((tour) => (
              <Link 
                key={tour.id}
                to={`/turlar/${createSlug(tour.title)}`}
                className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1"
              >
                {/* Resim Alanı */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={tour.images[0] || '/placeholder-tour.jpg'}
                    alt={tour.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Favoriye Ekleme Butonu */}
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite(tour.id);
                    }}
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200"
                  >
                    <Heart 
                      className={`w-4 h-4 transition-colors duration-200 ${
                        favorites.has(tour.id) 
                          ? 'text-red-500 fill-current' 
                          : 'text-gray-600 hover:text-red-500'
                      }`} 
                    />
                  </button>

                  {/* Kategori Badge */}
                  {tour.category && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                        {tour.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* İçerik Alanı */}
                <div className="p-4">
                  {/* Lokasyon */}
                  <div className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{tour.location}</span>
                  </div>

                  {/* Başlık */}
                  <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 leading-tight">
                    {tour.title}
                  </h3>

                  {/* Açıklama */}
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
                    {tour.short_description}
                  </p>

                  {/* Rating ve Süre */}
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

                  {/* Fiyat */}
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

                  {/* Detaylar Butonu */}
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors duration-200">
                    Detayları Görüntüle
                  </button>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12 md:hidden">
            <Link
              to="/turlar"
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              <span>Tüm Turları Gör</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Neden TurPlatform?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Güvenilir, kaliteli ve unutulmaz seyahat deneyimleri için doğru adrestesiniz
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100"
              >
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Hayalinizdeki Tatili Planlamaya Hazır Mısınız?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Binlerce destinasyon ve güvenilir operatörlerle unutulmaz anılar oluşturun
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/turlar"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold transition-colors duration-200 transform hover:scale-105"
            >
              Turları Keşfet
            </Link>
            {!user && (
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
              >
                Hemen Üye Ol
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Advanced Search Bottom Sheet */}
      <SearchBottomSheet
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={handleAdvancedSearch}
        initialFilters={{}}
      />
    </div>
  );
};

export default HomePage;