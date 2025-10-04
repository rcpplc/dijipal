import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  Users, 
  Star,
  Heart,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CategoryPage = () => {
  const { category } = useParams();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Helper function to get classification styling
  const getClassificationStyle = (classification) => {
    switch(classification?.toLowerCase()) {
      case 'lux':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 'delux':
        return 'bg-gradient-to-r from-purple-500 to-purple-700 text-white';
      case 'standart':
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

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
    loadTours();
  }, [category]);

  const loadTours = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/tours?category=${category}&limit=20`);
      setTours(response.data);
    } catch (error) {
      console.error('Error loading tours:', error);
    } finally {
      setLoading(false);
    }
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
                    ₺{tours.length > 0 ? Math.min(...tours.map(t => t.base_price)) : 0}
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
                            <span>{tour.duration_days} gün</span>
                            {tour.classification && (
                              <span className="text-gray-500 font-medium">
                                • {tour.classification.charAt(0).toUpperCase() + tour.classification.slice(1)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold text-blue-600">
                            ₺{tour.base_price}
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
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center space-x-3 mb-6">
                <HelpCircle className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Sıkça Sorulan Sorular
                </h2>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                    >
                      <span className="font-semibold text-gray-900">
                        {faq.question}
                      </span>
                      {expandedFaq === index ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    
                    {expandedFaq === index && (
                      <div className="px-6 pb-4">
                        <p className="text-gray-700 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;