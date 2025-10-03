import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  MapPin, 
  Calendar, 
  Users, 
  Star, 
  Clock,
  CheckCircle,
  XCircle,
  Heart,
  Share2,
  Phone,
  Mail,
  ArrowLeft,
  User
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TourDetailPage = () => {
  const { tourId } = useParams();
  const { user, setShowLoginModal } = useAuth();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [participants, setParticipants] = useState(2);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    loadTour();
    loadReviews();
    if (tourId) {
      loadAvailableDates();
      if (user) {
        checkIfFavorited();
      }
    }
  }, [tourId, user]);

  const loadTour = async () => {
    try {
      const response = await axios.get(`${API}/tours/${tourId}`);
      setTour(response.data);
    } catch (error) {
      console.error('Error loading tour:', error);
      if (error.response?.status === 404) {
        navigate('/tours');
        toast.error('Tur bulunamadı');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const response = await axios.get(`${API}/reviews?tour_id=${tourId}&verified_only=true&limit=20`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadAvailableDates = async () => {
    try {
      const response = await axios.get(`${API}/tours/${tourId}/dates`);
      setAvailableDates(response.data);
      if (response.data.length > 0) {
        setSelectedDate(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading dates:', error);
    }
  };

  const checkIfFavorited = async () => {
    try {
      const response = await axios.get(`${API}/favorites/check/${tourId}`);
      setIsFavorited(response.data.is_favorited);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      setIsFavorited(false);
    }
  };

  const handleBooking = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    navigate(`/booking/${tourId}?participants=${participants}`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: tour.title,
          text: tour.short_description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link panoya kopyalandı!');
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    try {
      if (isFavorited) {
        // Remove from favorites
        await axios.delete(`${API}/favorites/${tourId}`);
        setIsFavorited(false);
        toast.success('Favorilerden çıkarıldı');
      } else {
        // Add to favorites
        await axios.post(`${API}/favorites/${tourId}`);
        setIsFavorited(true);
        toast.success('Favorilere eklendi');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const addToCart = () => {
    if (!selectedDate) {
      toast.error('Lütfen önce bir tarih seçin');
      return;
    }

    const cartItem = {
      tourId: tour.id,
      title: tour.title,
      location: tour.location,
      duration: tour.duration_days,
      price: currentPrice, // Seçilen tarihin fiyatı
      participants: participants,
      image: tour.images[0] || '/placeholder-tour.jpg',
      selectedDate: {
        date: selectedDate.start_date, // API'den gelen field adı
        price: selectedDate.price,
        formattedDate: new Date(selectedDate.start_date).toLocaleDateString('tr-TR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
    };

    // Mevcut sepeti al
    const savedCart = localStorage.getItem('tour_cart');
    let cartItems = savedCart ? JSON.parse(savedCart) : [];

    // Aynı tur ve tarih kombinasyonu var mı kontrol et
    const existingItemIndex = cartItems.findIndex(item => 
      item.tourId === tour.id && item.selectedDate?.date === selectedDate.start_date
    );
    
    if (existingItemIndex >= 0) {
      // Varsa katılımcı sayısını güncelle
      cartItems[existingItemIndex].participants = participants;
      toast.success('Sepetteki tur güncellendi');
    } else {
      // Yoksa sepete ekle
      cartItems.push(cartItem);
      toast.success('Tur sepete eklendi');
    }

    // Sepeti kaydet
    localStorage.setItem('tour_cart', JSON.stringify(cartItems));
    
    // Storage event'i tetikle (Header'daki cart count'u güncellemek için)
    window.dispatchEvent(new Event('storage'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-gray-200 h-8 w-32 mb-6 rounded"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-gray-200 h-96 rounded-xl mb-6"></div>
              <div className="space-y-4">
                <div className="bg-gray-200 h-8 rounded"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                <div className="bg-gray-200 h-32 rounded"></div>
              </div>
            </div>
            <div className="bg-gray-200 h-96 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tur bulunamadı</h2>
          <p className="text-gray-600 mb-6">Aradığınız tur mevcut değil veya kaldırılmış olabilir.</p>
          <Link
            to="/tours"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Diğer Turları Keşfet
          </Link>
        </div>
      </div>
    );
  }

  const currentPrice = selectedDate?.price || tour.base_price;
  const totalPrice = (currentPrice * participants).toFixed(2);
  const images = tour.images && tour.images.length > 0 ? tour.images : ['/placeholder-tour.jpg'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/tours"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Turlar</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="relative mb-8">
              <div className="aspect-video rounded-xl overflow-hidden">
                <img
                  src={images[selectedImage]}
                  alt={tour.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  onClick={toggleFavorite}
                  className={`p-3 rounded-full backdrop-blur-sm transition-all duration-200 ${
                    isFavorited 
                      ? 'bg-red-500 text-white' 
                      : 'bg-white/80 text-gray-600 hover:bg-white'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-3 bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white rounded-full transition-all duration-200"
                >
                  <Share2 className="w-6 h-6" />
                </button>
              </div>

              {/* Image Thumbnails */}
              {images.length > 1 && (
                <div className="flex space-x-2 mt-4 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden transition-all duration-200 ${
                        selectedImage === index 
                          ? 'ring-2 ring-blue-500' 
                          : 'hover:opacity-80'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${tour.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tour Info */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{tour.location}</span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {tour.title}
                  </h1>
                  <p className="text-gray-600 text-lg">
                    {tour.short_description}
                  </p>
                </div>
                
                {tour.category && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {tour.category}
                  </span>
                )}
              </div>

              {/* Rating and Meta */}
              <div className="flex items-center space-x-6 pb-6 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(tour.rating || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {tour.rating > 0 ? tour.rating.toFixed(1) : 'Henüz değerlendirilmemiş'} 
                    {tour.rating > 0 && ` (${tour.review_count || 0} değerlendirme)`}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{tour.duration_days || 1} gün</span>
                </div>

                {/* Max participants removed per user request */}
              </div>

              {/* Description */}
              <div className="py-6 border-b border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Açıklama
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {tour.description}
                </p>
              </div>

              {/* Included/Excluded Services */}
              <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {tour.included_services && tour.included_services.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Dahil Olanlar</span>
                    </h4>
                    <ul className="space-y-2">
                      {tour.included_services.map((service, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{service}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {tour.excluded_services && tour.excluded_services.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span>Dahil Olmayanlar</span>
                    </h4>
                    <ul className="space-y-2">
                      {tour.excluded_services.map((service, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <span>{service}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Program Details */}
              {tour.program_details && (
                <div className="py-6 border-t border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <span>Tur Programı</span>
                  </h4>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {tour.program_details}
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Info */}
              {(tour.meeting_point || tour.languages || tour.difficulty_level) && (
                <div className="py-6 border-t border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-4">Ek Bilgiler</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {tour.meeting_point && (
                      <div>
                        <span className="font-medium text-gray-700">Buluşma Noktası:</span>
                        <p className="text-gray-600 mt-1">{tour.meeting_point}</p>
                      </div>
                    )}
                    {tour.languages && (
                      <div>
                        <span className="font-medium text-gray-700">Diller:</span>
                        <p className="text-gray-600 mt-1">{tour.languages.join(', ')}</p>
                      </div>
                    )}
                    {tour.difficulty_level && (
                      <div>
                        <span className="font-medium text-gray-700">Zorluk:</span>
                        <p className="text-gray-600 mt-1">{tour.difficulty_level}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-xl p-6 shadow-lg mt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Değerlendirmeler ({reviews.length})
              </h3>

              {reviewsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-gray-200 w-10 h-10 rounded-full"></div>
                        <div>
                          <div className="bg-gray-200 h-4 w-24 rounded mb-1"></div>
                          <div className="bg-gray-200 h-3 w-16 rounded"></div>
                        </div>
                      </div>
                      <div className="bg-gray-200 h-4 w-full rounded mb-2"></div>
                      <div className="bg-gray-200 h-4 w-3/4 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>Henüz değerlendirme yok</p>
                  <p className="text-sm mt-1">İlk değerlendirmeyi siz yapın!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {review.user_name}
                              </h4>
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {new Date(review.created_at).toLocaleDateString('tr-TR')}
                                </span>
                                {review.is_verified && (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {review.title && (
                            <h5 className="font-medium text-gray-900 mb-2">
                              {review.title}
                            </h5>
                          )}
                          
                          {review.comment && (
                            <p className="text-gray-700 leading-relaxed">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-lg sticky top-8">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  ₺{currentPrice}
                  <span className="text-lg font-normal text-gray-600 ml-1">/kişi</span>
                </div>
                {selectedDate?.price && selectedDate.price !== tour.base_price && (
                  <div className="text-sm text-gray-500 mb-1">
                    <span className="line-through">₺{tour.base_price}</span>
                    <span className="ml-2 text-green-600 font-medium">Özel Fiyat!</span>
                  </div>
                )}
                <p className="text-sm text-gray-500">Vergiler dahil</p>
              </div>

              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tarih Seçin
                </label>
                {availableDates.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availableDates.map((date) => (
                      <button
                        key={date.id}
                        onClick={() => setSelectedDate(date)}
                        className={`w-full p-3 text-left rounded-lg border transition-all duration-200 ${
                          selectedDate?.id === date.id
                            ? 'border-blue-600 bg-blue-50 text-blue-800'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">
                              {new Date(date.start_date).toLocaleDateString('tr-TR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                            {date.start_time && (
                              <div className="text-sm text-gray-600">
                                Saat: {date.start_time}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              {date.available_spots} yer
                            </div>
                            {date.price && (
                              <div className="font-semibold text-blue-600">
                                ₺{date.price}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Calendar className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Uygun tarih bulunamadı</p>
                  </div>
                )}
              </div>

              {/* Participants Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Katılımcı Sayısı
                </label>
                <div className="flex items-center justify-center space-x-4 bg-gray-50 rounded-lg p-4">
                  <button
                    onClick={() => setParticipants(Math.max(1, participants - 1))}
                    className="w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors duration-200"
                  >
                    -
                  </button>
                  <span className="text-xl font-semibold text-gray-900 min-w-[3rem] text-center">
                    {participants}
                  </span>
                  <button
                    onClick={() => setParticipants(Math.min(selectedDate ? selectedDate.available_spots : tour.max_participants, participants + 1))}
                    className="w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors duration-200"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  {selectedDate 
                    ? `Bu tarih için en fazla ${selectedDate.available_spots} kişi`
                    : `En fazla ${tour.max_participants} kişi`
                  }
                </p>
              </div>

              {/* Total Price */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Toplam Tutar:</span>
                  <span className="text-2xl font-bold text-blue-600">₺{totalPrice}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {participants} kişi × ₺{tour.base_price}
                </p>
              </div>

              {/* Booking Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleBooking}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {user ? 'Rezervasyon Yap' : 'Giriş Yaparak Rezervasyon Yap'}
                </button>
                
                <button
                  onClick={addToCart}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] border-2 border-gray-200 hover:border-gray-300"
                >
                  Sepete Ekle
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mb-4">
                Ücretsiz iptal • 24 saat öncesine kadar
              </p>

              {/* Contact Info */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Sorularınız mı var?
                </h4>
                <div className="space-y-2">
                  <a
                    href="tel:+902125550123"
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200"
                  >
                    <Phone className="w-4 h-4" />
                    <span>+90 (212) 555-0123</span>
                  </a>
                  <a
                    href="mailto:info@turplatform.com"
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200"
                  >
                    <Mail className="w-4 h-4" />
                    <span>info@turplatform.com</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourDetailPage;