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
  User,
  ChevronDown,
  ChevronUp,
  X
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
  const [reviews, setReviews] = useState([
    {
      id: 1,
      user_name: "Ahmet Yılmaz",
      rating: 5,
      title: "Harika bir deneyim!",
      comment: "Bu tur gerçekten muhteşemdi. Kaptanımız çok bilgiliydi ve tekne çok temizdi. Yemekler de lezzetliydi. Kesinlikle tavsiye ederim!",
      created_at: "2024-02-15T10:30:00Z",
      is_verified: true
    },
    {
      id: 2,
      user_name: "Elif Kaya",
      rating: 4,
      title: "Güzel bir gün geçirdik",
      comment: "Genel olarak memnun kaldık. Sadece beklediğimizden biraz daha kalabalıktı. Ama manzaralar çok güzeldi.",
      created_at: "2024-02-10T14:20:00Z",
      is_verified: false
    }
  ]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [participants, setParticipants] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [isFavorited, setIsFavorited] = useState(false);
  
  // Month filter for dates
  const [selectedMonth, setSelectedMonth] = useState('');
  const [filteredDates, setFilteredDates] = useState([]);
  
  // User behavior tracking
  const [suggestedParticipants, setSuggestedParticipants] = useState(null);
  
  // Cabin system
  const [cabinType, setCabinType] = useState('single'); // 'single' or 'double' - default to single
  
  // Modal states
  const [showProgramModal, setShowProgramModal] = useState(false);
  
  // Accordion states
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  // Accordion state for cancellation policy
  const [showFullCancellation, setShowFullCancellation] = useState(false);
  
  // Reviews modal
  const [showReviewsModal, setShowReviewsModal] = useState(false);

  useEffect(() => {
    loadTour();
    loadReviews();
    if (tourId) {
      loadAvailableDates();
      if (user) {
        checkIfFavorited();
      }
      
      // Load user preferences and suggest participants
      loadUserPreferences();
    }
  }, [tourId, user]);
  
  // Safety check removed - causing infinite loop

  // Filter dates when availableDates or selectedMonth changes
  useEffect(() => {
    if (availableDates.length > 0) {
      if (selectedMonth === '') {
        setFilteredDates(availableDates);
      } else {
        const filtered = availableDates.filter(date => {
          const dateObj = new Date(date.start_date);
          const monthYear = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
          return monthYear === selectedMonth;
        });
        setFilteredDates(filtered);
      }
    }
  }, [availableDates, selectedMonth]);

  // Generate available months from dates
  const getAvailableMonths = () => {
    const months = [];
    availableDates.forEach(date => {
      const dateObj = new Date(date.start_date);
      const monthYear = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthName = dateObj.toLocaleDateString('tr-TR', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      if (!months.find(m => m.value === monthYear)) {
        months.push({
          value: monthYear,
          label: monthName
        });
      }
    });
    
    return months.sort((a, b) => a.value.localeCompare(b.value));
  };

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

  // User behavior tracking functions
  const getUserSearchHistory = () => {
    try {
      const history = localStorage.getItem('tourSearchHistory');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error reading search history:', error);
      return [];
    }
  };

  const saveSearchBehavior = (tourId, participants, priceRange) => {
    try {
      const history = getUserSearchHistory();
      const searchData = {
        tourId,
        participants,
        priceRange,
        timestamp: new Date().toISOString(),
        category: tour?.category,
        location: tour?.location
      };
      
      // Keep last 20 searches
      const updatedHistory = [searchData, ...history.slice(0, 19)];
      localStorage.setItem('tourSearchHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving search behavior:', error);
    }
  };

  const loadUserPreferences = () => {
    try {
      const history = getUserSearchHistory();
      
      if (history.length > 0) {
        // Calculate average participants from recent searches
        const recentSearches = history.slice(0, 10); // Last 10 searches
        const avgParticipants = Math.round(
          recentSearches.reduce((sum, search) => sum + search.participants, 0) / recentSearches.length
        );
        
        // Similar tours preference (same category or location)
        const similarTours = history.filter(search => 
          search.category === tour?.category || search.location === tour?.location
        ).slice(0, 5);
        
        if (similarTours.length > 0) {
          const similarAvg = Math.round(
            similarTours.reduce((sum, search) => sum + search.participants, 0) / similarTours.length
          );
          setSuggestedParticipants(Math.max(1, similarAvg || 1));
          // Don't auto-set participants, keep default 1
          
          console.log(`Önerilen katılımcı sayısı: ${similarAvg} (${similarTours.length} benzer tura dayanarak)`);
        } else if (avgParticipants && avgParticipants !== 1) {
          setSuggestedParticipants(Math.max(1, avgParticipants || 1));
          // Don't auto-set participants, keep default 1
          
          console.log(`Önerilen katılımcı sayısı: ${avgParticipants} (geçmiş aramalarınıza dayanarak)`);
        }
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
      // Silently fail - default to 1 participant
    }
  };

  const handleBooking = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    if (!selectedDate) {
      toast.error('Lütfen bir tarih seçin');
      return;
    }

    // Save user behavior before booking
    const cabinCount = typeof participants === 'number' ? participants : 1;
    saveSearchBehavior(tourId, cabinCount, selectedDate.single_cabin_price || selectedDate.price);

    // Navigate to booking page with tour and date info
    navigate('/booking', {
      state: {
        tour: tour,
        selectedDate: selectedDate,
        participants: cabinCount,
        cabinType: cabinType
      }
    });
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

    // Save user behavior before adding to cart
    const currentCabinPrice = cabinType === 'single' 
      ? selectedDate.single_cabin_price
      : selectedDate.double_cabin_price;
    
    saveSearchBehavior(tourId, participants, currentCabinPrice);

    const cartItem = {
      tourId: tour.id,
      title: tour.title,
      location: tour.location,
      duration: tour.duration_days,
      price: currentCabinPrice, // Seçilen kabin tipinin fiyatı
      single_cabin_price: selectedDate.single_cabin_price,
      double_cabin_price: selectedDate.double_cabin_price,
      cabinType: cabinType, // 'single' veya 'double'
      participants: participants,
      image: tour.images[0] || '/placeholder-tour.jpg',
      selectedDate: {
        date: selectedDate.start_date, // API'den gelen field adı
        single_cabin_price: selectedDate.single_cabin_price,
        double_cabin_price: selectedDate.double_cabin_price,
        capacity: selectedDate.capacity, // Kabin kapasitesi
        available_cabins: selectedDate.available_cabins, // Mevcut kabin sayısı
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

    // Aynı tur, tarih ve kabin tipi kombinasyonu var mı kontrol et
    const existingItemIndex = cartItems.findIndex(item => 
      item.tourId === tour.id && 
      item.selectedDate?.date === selectedDate.start_date &&
      item.cabinType === cabinType
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

  const images = tour.images && tour.images.length > 0 ? tour.images : ['/placeholder-tour.jpg'];
  const currentPrice = selectedDate ? selectedDate.price : tour.base_price;

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
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex space-x-1 sm:space-x-2">
                <button
                  onClick={toggleFavorite}
                  className={`p-2 sm:p-3 rounded-full backdrop-blur-sm transition-all duration-200 ${
                    isFavorited 
                      ? 'bg-red-500 text-white' 
                      : 'bg-white/80 text-gray-600 hover:bg-white'
                  }`}
                >
                  <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 sm:p-3 bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white rounded-full transition-all duration-200"
                >
                  <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
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
                  {tour.classification && (
                    <span className="text-gray-500 font-medium">
                      • {tour.classification.charAt(0).toUpperCase() + tour.classification.slice(1)}
                    </span>
                  )}
                </div>

                {/* Max participants removed per user request */}
              </div>

              {/* Description */}
              <div className="py-6 border-b border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Açıklama
                </h3>
                <div className="text-gray-700 leading-relaxed">
                  <p className="mb-3">
                    {tour.description && tour.description.length > 200 
                      ? `${tour.description.substring(0, 200)}...`
                      : tour.description
                    }
                  </p>
                  {tour.description && tour.description.length > 200 && (
                    <button
                      onClick={() => setShowDescriptionModal(true)}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                    >
                      Tümünü oku →
                    </button>
                  )}
                </div>
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
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed mb-3">
                      {tour.program_details && tour.program_details.length > 300 
                        ? `${tour.program_details.substring(0, 300)}...`
                        : tour.program_details
                      }
                    </div>
                    {tour.program_details && tour.program_details.length > 300 && (
                      <button
                        onClick={() => setShowProgramModal(true)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                      >
                        Detaylı programı görüntüle →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              {(tour.meeting_point || tour.languages || tour.pickup_time || tour.dropoff_time) && (
                <div className="py-6 border-t border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-4">Ek Bilgiler</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
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
                    {tour.pickup_time && (
                      <div>
                        <span className="font-medium text-gray-700 flex items-center space-x-1">
                          <Clock className="w-4 h-4 text-green-500" />
                          <span>Tur Biniş Saati:</span>
                        </span>
                        <p className="text-gray-600 mt-1">{tour.pickup_time}</p>
                      </div>
                    )}
                    {tour.dropoff_time && (
                      <div>
                        <span className="font-medium text-gray-700 flex items-center space-x-1">
                          <Clock className="w-4 h-4 text-red-500" />
                          <span>Tur İniş Saati:</span>
                        </span>
                        <p className="text-gray-600 mt-1">{tour.dropoff_time}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cancellation Policy */}
              {tour.cancellation_policy && (
                <div className="py-6 border-t border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span>İptal Politikası</span>
                  </h4>
                  <div className="text-gray-700 leading-relaxed">
                    <div 
                      className={`whitespace-pre-wrap ${!showFullCancellation ? 'line-clamp-5' : ''}`}
                      style={!showFullCancellation ? {
                        display: '-webkit-box',
                        WebkitLineClamp: 5,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      } : {}}
                    >
                      {tour.cancellation_policy}
                    </div>
                    {tour.cancellation_policy && tour.cancellation_policy.split('\n').length > 5 && (
                      <button
                        onClick={() => setShowFullCancellation(!showFullCancellation)}
                        className="mt-3 flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                      >
                        <span>{showFullCancellation ? 'Daha az göster' : 'Devamını gör'}</span>
                        {showFullCancellation ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                        }
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Değerlendirmeler alanı tamamen kaldırıldı */}
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
              {/* Pricing - Show minimum available price */}
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  ₺{availableDates.length > 0 
                    ? (() => {
                        const allPrices = [];
                        availableDates.forEach(date => {
                          if (date.single_cabin_price) allPrices.push(date.single_cabin_price);
                          if (date.double_cabin_price) allPrices.push(date.double_cabin_price);
                          if (!date.single_cabin_price && date.price) allPrices.push(date.price);
                        });
                        return allPrices.length > 0 ? Math.min(...allPrices).toLocaleString('tr-TR') : '0';
                      })()
                    : (tour.minimum_price?.toLocaleString('tr-TR') || tour.base_price?.toLocaleString('tr-TR') || '0')
                  }
                  <span className="text-lg font-normal text-gray-600 ml-1"> den başlayan</span>
                </div>
                <p className="text-sm text-gray-500">Vergiler dahil • Kabin başı fiyat</p>
              </div>

              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tarih Seçin
                </label>
                
                {/* Month Filter - Enhanced */}
                {availableDates.length > 0 && getAvailableMonths().length > 1 && (
                  <div className="mb-4">
                    <div className="relative">
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full p-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 font-medium appearance-none cursor-pointer transition-all duration-200 hover:border-gray-400"
                      >
                        <option value="" className="font-medium">◦ Tüm Ayları Göster ({availableDates.length} Planlanmış Tur)</option>
                        {getAvailableMonths().map((month) => {
                          const monthDatesCount = availableDates.filter(date => {
                            const dateObj = new Date(date.start_date);
                            const monthYear = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
                            return monthYear === month.value;
                          }).length;
                          
                          return (
                            <option key={month.value} value={month.value} className="font-medium">
                              ◦ {month.label} ({monthDatesCount} Planlanmış Tur)
                            </option>
                          );
                        })}
                      </select>
                      {/* Custom dropdown arrow */}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {selectedMonth && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Seçili: {getAvailableMonths().find(m => m.value === selectedMonth)?.label}
                        </span>
                        <button
                          onClick={() => setSelectedMonth('')}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Filtreyi Temizle
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {filteredDates.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {filteredDates.map((date) => (
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
                    <p className="text-sm">
                      {selectedMonth ? 'Seçilen ayda uygun tarih bulunamadı' : 'Uygun tarih bulunamadı'}
                    </p>
                    {selectedMonth && (
                      <button
                        onClick={() => setSelectedMonth('')}
                        className="text-blue-600 hover:text-blue-700 text-sm mt-2 underline"
                      >
                        Tüm ayları göster
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Cabin Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Kabin Tipi
                </label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => setCabinType('single')}
                    className={`p-3 rounded-md border transition-all duration-200 ${
                      cabinType === 'single'
                        ? 'border-gray-800 bg-gray-800 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-medium text-sm">Tek Kişilik Kabin</div>
                      <div className="text-xs opacity-75 mt-1">1 kişi kapasiteli</div>
                      {selectedDate && selectedDate.single_cabin_price && (
                        <div className="text-xs font-medium mt-2">
                          ₺{selectedDate.single_cabin_price.toLocaleString('tr-TR')}
                        </div>
                      )}
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setCabinType('double')}
                    className={`p-3 rounded-md border transition-all duration-200 ${
                      cabinType === 'double'
                        ? 'border-gray-800 bg-gray-800 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-medium text-sm">Çift Kişilik Kabin</div>
                      <div className="text-xs opacity-75 mt-1">2 kişi kapasiteli</div>
                      {selectedDate && selectedDate.double_cabin_price && (
                        <div className="text-xs font-medium mt-2">
                          ₺{selectedDate.double_cabin_price.toLocaleString('tr-TR')}
                        </div>
                      )}
                    </div>
                  </button>
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Kabin Sayısı
                  </label>
                </div>
                <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <button
                    onClick={() => {
                      if (participants > 1) {
                        setParticipants(participants - 1);
                      }
                    }}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    disabled={participants <= 1}
                  >
                    -
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-xl font-bold text-gray-900">
                      {participants || 1} kabin
                    </div>
                    {selectedDate && (
                      <div className="text-sm text-gray-600">
                        ₺{(() => {
                          const cabinPrice = cabinType === 'single' 
                            ? (selectedDate.single_cabin_price || selectedDate.price)
                            : (selectedDate.double_cabin_price || selectedDate.price);
                          const cabinCount = participants || 1;
                        return (cabinPrice * cabinCount).toLocaleString('tr-TR');
                        })()} toplam
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      const maxCapacity = selectedDate ? (selectedDate.capacity || selectedDate.available_cabins) : 20;
                      if (participants < maxCapacity) {
                        setParticipants((participants || 1) + 1);
                      }
                    }}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    disabled={participants >= (selectedDate ? (selectedDate.capacity || selectedDate.available_cabins || 20) : 20)}
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {selectedDate 
                    ? `Bu tarih için maksimum ${selectedDate.capacity || selectedDate.available_cabins || 0} kabin rezerve edebilirsiniz` 
                    : 'Önce tarih seçin, sonra kabin sayısını belirleyin'
                  }
                </p>
              </div>

              {/* Booking Summary */}
              {selectedDate && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-800 mb-2">
                      ◦ {new Date(selectedDate.start_date).toLocaleDateString('tr-TR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      ₺{(() => {
                        const cabinPrice = cabinType === 'single' 
                          ? (selectedDate.single_cabin_price || selectedDate.price)
                          : (selectedDate.double_cabin_price || selectedDate.price);
                        const cabinCount = participants || 1;
                        return (cabinPrice * cabinCount).toLocaleString('tr-TR');
                      })()}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {participants || 1} × {cabinType === 'single' ? 'Tek Kişilik' : 'Çift Kişilik'} Kabin
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ₺{(() => {
                        const cabinPrice = cabinType === 'single' 
                          ? (selectedDate.single_cabin_price || selectedDate.price)
                          : (selectedDate.double_cabin_price || selectedDate.price);
                        return cabinPrice.toLocaleString('tr-TR');
                      })()} × {participants || 1} kabin + Vergiler dahil
                    </p>
                  </div>
                </div>
              )}

              {/* Booking Buttons - Corporate Style */}
              <div className="space-y-3">
                <button
                  onClick={handleBooking}
                  disabled={!selectedDate}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <span>🎫</span>
                  <span>{user ? 'Rezervasyon Tamamla' : 'Giriş Yapın & Rezervasyon Yapın'}</span>
                </button>
                
                <button
                  onClick={addToCart}
                  disabled={!selectedDate}
                  className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 px-6 rounded-lg transition-all duration-200 border-2 border-gray-300 hover:border-blue-500 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <span>🛒</span>
                  <span>Sepete Ekle</span>
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mb-4">
                Ücretsiz iptal • 24 saat öncesine kadar
              </p>

              {/* Sidebar değerlendirmeler kaldırıldı - Ana içerikteki kalıyor */}

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

      {/* Description Modal */}
      {showDescriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Tur Açıklaması</h3>
              <button
                onClick={() => setShowDescriptionModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {tour.description}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Program Modal */}
      {showProgramModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Calendar className="w-6 h-6 text-blue-500" />
                <span>Detaylı Tur Programı</span>
              </h3>
              <button
                onClick={() => setShowProgramModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed prose prose-sm max-w-none">
                {tour.program_details}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Modal */}
      {showReviewsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Tüm Değerlendirmeler ({reviews.length})
              </h3>
              <button
                onClick={() => setShowReviewsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>Henüz değerlendirme yok</p>
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
        </div>
      )}
    </div>
  );
};

export default TourDetailPage;