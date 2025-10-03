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
  ChevronLeft,
  ChevronRight,
  Heart,
  Trees,
  Mountain,
  Building,
  Castle,
  UtensilsCrossed
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const { user, setShowLoginModal, setLoginMode } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredTours, setFeaturedTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroImages = [
    "https://images.unsplash.com/photo-1613381234024-4e0bdcaf86ce",
    "https://images.unsplash.com/photo-1563999774341-62c6656086cb",
    "https://images.pexels.com/photos/34020240/pexels-photo-34020240.jpeg"
  ];

  useEffect(() => {
    loadFeaturedTours();
    seedSampleData();
  }, []);

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
    if (searchQuery.trim()) {
      // Track search behavior
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
      
      navigate(`/tours?search=${encodeURIComponent(searchQuery.trim())}`);
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
          <div className="text-center text-white px-4 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Türkiye'yi
              <span className="block text-blue-300">
                Keşfedin
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-100">
              Binlerce destinasyon, güvenilir operatörler ve unutulmaz anılar
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8 animate-fade-in-up">
              <div className="flex bg-white rounded-full shadow-2xl overflow-hidden">
                <div className="flex-1 flex items-center px-6 py-4">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                  <input
                    type="text"
                    placeholder="Nereyi keşfetmek istiyorsunuz?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 outline-none text-gray-800 placeholder-gray-500"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Search className="w-5 h-5" />
                  <span className="hidden md:inline">Ara</span>
                </button>
              </div>
            </form>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up">
              <Link
                to="/tours"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
              >
                Turları Keşfet
              </Link>
              {!user && (
                <button
                  onClick={() => {
                    setLoginMode('register');
                    setShowLoginModal(true);
                  }}
                  className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-800 px-8 py-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Üye Ol
                </button>
              )}
            </div>
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

        {/* Navigation Arrows */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length)}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-colors duration-200"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % heroImages.length)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-colors duration-200"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
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
                to={`/tours?region=${region.name}`}
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
              to="/tours"
              className="hidden md:flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              <span>Tümünü Gör</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredTours.map((tour) => (
              <div
                key={tour.id}
                className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={tour.images[0] || '/placeholder-tour.jpg'}
                    alt={tour.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4">
                    <button className="bg-white/80 backdrop-blur-sm hover:bg-white p-2 rounded-full transition-colors duration-200">
                      <Heart className="w-5 h-5 text-gray-600 hover:text-red-500" />
                    </button>
                  </div>
                  {tour.category && (
                    <div className="absolute top-4 left-4">
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {tour.category}
                      </span>
                    </div>
                  )}
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
                    {tour.short_description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
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
                      <span className="text-sm text-gray-600">
                        ({tour.review_count || 0})
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{tour.duration_days || 1} gün</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-blue-600">
                      {tour.tour_dates && tour.tour_dates.length > 0 
                        ? `₺${Math.min(...tour.tour_dates.map(date => date.price))}` 
                        : `₺${tour.base_price || 0}`}
                      <span className="text-sm font-normal text-gray-600 ml-1">
                        /kabin
                      </span>
                    </div>

                    <Link
                      to={`/tours/${tour.id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                    >
                      Detaylar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12 md:hidden">
            <Link
              to="/tours"
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
              to="/tours"
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
    </div>
  );
};

export default HomePage;