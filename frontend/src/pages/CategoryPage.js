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
  ChevronUp,
  HelpCircle,
  Filter,
  SlidersHorizontal,
  X,
  Mountain,
  Waves,
  Building,
  Trees,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { createSlug } from '../utils/slug';
import { useAuth } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CategoryPage = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const { user, setShowLoginModal } = useAuth();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
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
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 12;

  const categoryInfo = {
    cultural: {
      title: 'Kültürel Turlar',
      description: 'Tarih ve kültürün derinliklerinde kaybolun. Antik şehirler, müzeler ve tarihi yapılar sizi bekliyor.',
      icon: '🏛️',
      features: [
        'Profesyonel rehber eşliğinde',
        'Müze ve ören yeri giriş ücretleri dahil',
        'Tarihi bilgiler ve hikayeler',
        'Fotoğraf çekimi için en iyi noktalar'
      ]
    },
    nature: {
      title: 'Doğa Turları',
      description: 'Türkiye\'nin eşsiz doğal güzellikleri ile buluşun. Milli parklar, göller ve ormanlar sizi çağırıyor.',
      icon: '🌲',
      features: [
        'Doğa yürüyüşü ve trekking',
        'Vahşi yaşam gözlemi',
        'Temiz hava ve doğal ortam',
        'Fotoğrafçılık imkanları'
      ]
    },
    adventure: {
      title: 'Macera Turları',
      description: 'Adrenalin tutkunları için özel turlar. Paragliding\'den rafting\'e, macera sizi bekliyor.',
      icon: '🏔️',
      features: [
        'Profesyonel ekipman dahil',
        'Güvenlik eğitimi',
        'Deneyimli eğitmenler',
        'Sertifika imkanı'
      ]
    },
    city: {
      title: 'Şehir Turları',
      description: 'Büyülü şehirlerin sokakları, modern yaşam ve kentsel kültürü keşfedin.',
      icon: '🏙️',
      features: [
        'Şehir merkezinde gezinti',
        'Yerel lezzetler',
        'Alışveriş imkanları',
        'Gece hayatı deneyimi'
      ]
    },
    historical: {
      title: 'Tarihi Turlar',
      description: 'Binlerce yıllık medeniyetlerin izlerini takip edin. Antik kentler ve arkeolojik alanlar.',
      icon: '🏺',
      features: [
        'Arkeolojik alan ziyaretleri',
        'Antik kent turları',
        'Tarih uzmanı rehberlik',
        'Müze ziyaretleri'
      ]
    },
    food: {
      title: 'Gastronomi Turları',
      description: 'Türk mutfağının zengin lezzetlerini keşfedin. Yerel tatlar ve geleneksel yemekler.',
      icon: '🍽️',
      features: [
        'Yerel restoran ziyaretleri',
        'Geleneksel yemek deneyimi',
        'Pişirme atölyeleri',
        'Yerel ürün pazarı turu'
      ]
    }
  };

  const faqs = [
    {
      question: "Tur fiyatlarına neler dahil?",
      answer: "Tur fiyatlarına genellikle rehber hizmeti, ulaşım, müze/ören yeri giriş ücretleri ve belirtilen öğünler dahildir. Her turun detay sayfasında dahil olan ve olmayan hizmetler açık şekilde belirtilmiştir."
    },
    {
      question: "Rezervasyon iptali nasıl yapılır?",
      answer: "Rezervasyonunuzu tur tarihinden en az 24 saat öncesine kadar ücretsiz iptal edebilirsiniz. İptal işlemi için profil sayfanızdan rezervasyonlarım bölümüne gidin veya müşteri hizmetlerimiz ile iletişime geçin."
    },
    {
      question: "Grup indirimi var mı?",
      answer: "10 kişi ve üzeri gruplar için özel indirimler sunuyoruz. Grup rezervasyonu yapmak için iletişim sayfamızdan bizimle irtibata geçebilirsiniz."
    },
    {
      question: "Tur sırasında güvenlik nasıl sağlanıyor?",
      answer: "Tüm turlarımız deneyimli ve sertifikalı rehberler eşliğinde gerçekleştirilir. Macera turlarında profesyonel güvenlik ekipmanı kullanılır ve katılımcılara güvenlik eğitimi verilir."
    },
    {
      question: "Hava koşulları nedeniyle tur iptal olur mu?",
      answer: "Olumsuz hava koşullarında güvenlik nedeniyle turlar iptal edilebilir. Bu durumda tam ücret iadesi yapılır veya alternatif tarih önerilir."
    }
  ];

  useEffect(() => {
    loadTours(1, false); // Reset to page 1 when category changes
  }, [category]);

  const loadTours = async (page = 1, append = false) => {
    if (page === 1) {
      setLoading(true);
      setCurrentPage(1);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const params = new URLSearchParams();
      params.append('category', category);
      params.append('limit', ITEMS_PER_PAGE.toString());
      params.append('skip', ((page - 1) * ITEMS_PER_PAGE).toString());
      
      const response = await axios.get(`${API}/tours?${params.toString()}`);
      const newTours = response.data;
      
      if (append) {
        setTours(prevTours => [...prevTours, ...newTours]);
      } else {
        setTours(newTours);
      }
      
      // Check if there are more items to load
      setHasMore(newTours.length === ITEMS_PER_PAGE);
      
    } catch (error) {
      console.error('Error loading tours:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreTours = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadTours(nextPage, true);
  };

  const currentCategory = categoryInfo[category] || {
    title: 'Turlar',
    description: 'Seçili kategori turları',
    icon: '🗺️',
    features: []
  };

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to="/tours"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Tüm Turlar</span>
          </Link>

          <div className="text-center">
            <div className="text-6xl mb-4">{currentCategory.icon}</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {currentCategory.title}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {currentCategory.description}
            </p>
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
              <ul className="space-y-3">
                {currentCategory.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
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
                <div className="flex justify-between">
                  <span className="text-gray-600">Başlangıç Fiyatı:</span>
                  <span className="font-semibold text-green-600">
                    ₺{tours.length > 0 ? Math.min(...tours.map(t => t.base_price || 0)).toLocaleString('tr-TR') : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tours Grid */}
            <div className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentCategory.title} ({tours.length})
                </h2>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-lg animate-pulse overflow-hidden">
                      <div className="bg-gray-200 h-48"></div>
                      <div className="p-6 space-y-4">
                        <div className="bg-gray-200 h-4 rounded"></div>
                        <div className="bg-gray-200 h-6 rounded"></div>
                        <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : tours.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    Bu kategoride tur bulunamadı
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Yakında yeni turlar eklenecek
                  </p>
                  <Link
                    to="/tours"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    Diğer Turları Keşfet
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tours.map((tour) => (
                    <div key={tour.id} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                      <div className="relative">
                        <img
                          src={tour.images[0] || '/placeholder-tour.jpg'}
                          alt={tour.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-4 right-4">
                          <button className="bg-white/80 backdrop-blur-sm hover:bg-white p-2 rounded-full transition-colors duration-200">
                            <Heart className="w-5 h-5 text-gray-600 hover:text-red-500" />
                          </button>
                        </div>
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
                            <span>
                              {tour.duration || tour.duration_days || 1}{' '}
                              {(() => {
                                if (tour.duration_unit === 'hours') return 'Saat';
                                if (tour.duration_unit === 'days') return 'Gün';
                                return 'Gün'; // fallback
                              })()}
                            </span>
                            {tour.classification && (
                              <span className="text-gray-500 font-medium">
                                • {tour.classification.charAt(0).toUpperCase() + tour.classification.slice(1)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold text-blue-600">
                            ₺{(tour.base_price || 0).toLocaleString('tr-TR')}
                            <span className="text-sm font-normal text-gray-600 ml-1">
                              /kişi
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
              )}
              
              {/* Load More Button */}
              {!loading && tours.length > 0 && hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={loadMoreTours}
                    disabled={loadingMore}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 inline-flex items-center space-x-2"
                  >
                    {loadingMore ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Yükleniyor...</span>
                      </>
                    ) : (
                      <span>Daha Fazla Gör</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Description Section - Full Width Below Tours */}
      <div className="mt-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {currentCategory.title} Hakkında
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {currentCategory.title} kategorisindeki turlar hakkında detaylı bilgi
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                <p className="text-lg mb-6">
                  {currentCategory.description}
                </p>
                
                {/* Category Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Bu Kategorinin Özellikleri
                    </h3>
                    <ul className="space-y-3">
                      {currentCategory.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Kategori İstatistikleri
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Toplam Tur:</span>
                        <span className="font-semibold text-blue-600">{tours.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ortalama Puan:</span>
                        <span className="font-semibold text-yellow-600">4.8</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Başlangıç Fiyatı:</span>
                        <span className="font-semibold text-green-600">
                          ₺{tours.length > 0 ? Math.min(...tours.map(t => t.base_price || 0)).toLocaleString('tr-TR') : 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section - Sıkça Sorulan Sorular */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-full">
                <HelpCircle className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Sıkça Sorulan Sorular
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {currentCategory.title} hakkında en çok merak edilen sorular ve cevapları
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className="bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <details className="group">
                    <summary 
                      className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 rounded-2xl transition-colors duration-200 cursor-pointer list-none"
                    >
                      <span className="font-semibold text-gray-900 text-lg pr-8">
                        {faq.question}
                      </span>
                      <div className="flex-shrink-0 ml-4">
                        <div className="p-2 bg-blue-50 rounded-full group-open:bg-blue-100 transition-colors duration-200">
                          <ChevronDown className="w-5 h-5 text-blue-600 group-open:rotate-180 transition-transform duration-300" />
                        </div>
                      </div>
                    </summary>
                    <div className="px-8 pb-8">
                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-gray-700 leading-relaxed text-base">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </details>
                </div>
              ))}
            </div>

            {/* FAQ CTA Section */}
            <div className="mt-12 text-center">
              <div className="bg-blue-600 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Başka sorunuz mu var?
                </h3>
                <p className="text-blue-100 mb-6">
                  Aklınıza takılan başka sorular varsa bizimle iletişime geçin
                </p>
                <Link
                  to="/contact"
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200 inline-block"
                >
                  İletişime Geç
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;