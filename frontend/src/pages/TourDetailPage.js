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
  ChevronLeft,
  ShoppingCart,
  ChevronRight,
  X
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { createSlug, createSeoTitle, createSeoDescription } from '../utils/slug';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TourDetailPage = () => {
  const { tourSlug } = useParams();
  const { user, setShowLoginModal } = useAuth();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [participants, setParticipants] = useState(1); // For person-based (adults)
  const [childCount, setChildCount] = useState(0); // For person-based (children)
  const [singleCabinCount, setSingleCabinCount] = useState(1); // For cabin-based (single cabins)
  const [doubleCabinCount, setDoubleCabinCount] = useState(0); // For cabin-based (double cabins)
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [isFavorited, setIsFavorited] = useState(false);
  
  // Month filter for dates
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [filteredDates, setFilteredDates] = useState([]);
  
  // User behavior tracking
  const [suggestedParticipants, setSuggestedParticipants] = useState(null);
  
  // Mobile bottom bar states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCabinType, setSelectedCabinType] = useState('single'); // 'single' or 'double'
  const [cabinCount, setCabinCount] = useState(1);
  
  // Cabin system
  const [cabinType, setCabinType] = useState('single'); // 'single' or 'double' - default to single
  
  // Accordion states
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullProgram, setShowFullProgram] = useState(false);
  
  // Accordion state for cancellation policy
  const [showFullCancellation, setShowFullCancellation] = useState(false);
  
  // Reviews modal
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [modalReviews, setModalReviews] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const reviewsPerPage = 10;

  useEffect(() => {
    loadTour();
      
    // Load user preferences and suggest participants
    loadUserPreferences();
  }, [tourSlug, user]);

  // Restore booking state after login
  useEffect(() => {
    console.log('🔄 useEffect triggered - checking for booking restoration:', { 
      hasUser: !!user, 
      hasTour: !!tour,
      userEmail: user?.email,
      tourId: tour?.id,
      tourSlug: tourSlug
    });
    
    if (user && tour) {
      const savedState = localStorage.getItem('pendingBookingState');
      if (savedState) {
        try {
          const bookingState = JSON.parse(savedState);
          console.log('🔄 Restoring booking state after login:', bookingState);
          
          // Check if the saved state is for the current tour and not too old (5 minutes)
          const isCurrentTour = bookingState.tourId === tour.id || 
                               (tourSlug && tour?.slug && tourSlug.includes(tour.slug)) ||
                               (bookingState.tourSlug && bookingState.tourSlug === tourSlug);
          const isRecent = (Date.now() - bookingState.timestamp) < 5 * 60 * 1000; // 5 minutes
          
          console.log('🔍 Tour matching check:', {
            savedTourId: bookingState.tourId,
            currentTourId: tour.id,
            savedTourSlug: bookingState.tourSlug,
            currentTourSlug: tourSlug,
            isCurrentTour,
            isRecent
          });
          
          if (isCurrentTour && isRecent) {
            // Restore the saved state
            if (bookingState.selectedDate) {
              setSelectedDate(bookingState.selectedDate);
            }
            if (bookingState.selectedCabinType) {
              setSelectedCabinType(bookingState.selectedCabinType);
              setCabinType(bookingState.selectedCabinType); // Also set for desktop
            }
            if (bookingState.cabinCount) {
              setCabinCount(bookingState.cabinCount);
            }
            if (bookingState.participants) {
              setParticipants(bookingState.participants);
            }
            
            console.log('✅ Booking state restored successfully - redirecting immediately');
            
            // Immediately redirect to booking page after successful state restoration (no alerts)
            const bookingData = {
              tourId: tour.id,
              title: tour.title,
              images: tour.images,
              location: tour.location,
              selectedDate: bookingState.selectedDate,
              cabinType: bookingState.selectedCabinType,
              participants: bookingState.cabinCount,
              single_cabin_price: bookingState.selectedDate?.single_cabin_price,
              double_cabin_price: bookingState.selectedDate?.double_cabin_price,
              price: bookingState.selectedCabinType === 'double' 
                ? bookingState.selectedDate?.double_cabin_price || bookingState.selectedDate?.price || 0
                : bookingState.selectedDate?.single_cabin_price || bookingState.selectedDate?.price || 0
            };

            // Immediate redirect - no delay, no toast
            navigate(`/booking/${tour.id}`, {
              state: {
                tour: bookingData,
                selectedDate: bookingState.selectedDate,
                cabinType: bookingState.selectedCabinType,
                participants: bookingState.cabinCount,
                fromLogin: true // Flag to indicate this came from login restoration
              }
            });
            
            // Clear the saved state
            localStorage.removeItem('pendingBookingState');
          } else {
            // Clear old or irrelevant state
            localStorage.removeItem('pendingBookingState');
            console.log('🗑️ Cleared old booking state');
          }
        } catch (error) {
          console.error('❌ Error restoring booking state:', error);
          localStorage.removeItem('pendingBookingState');
        }
      }
    }
  }, [user, tour, navigate]);
  
  // Safety check removed - causing infinite loop

  // Filter dates when availableDates or selectedMonth changes
  useEffect(() => {
    if (availableDates.length > 0) {
      if (selectedMonth === 'all' || selectedMonth === '') {
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
      const response = await axios.get(`${API}/tours/${tourSlug}`);
      setTour(response.data);
      
      // SEO Optimizasyonu
      const tourData = response.data;
      updateSEO(tourData);
      
      // Tour yüklendikten sonra tarihleri, yorumları ve favori durumunu yükle
      if (tourData.id) {
        await loadAvailableDates(tourData.id);
        await loadReviews(tourData.id);
        if (user) {
          await checkIfFavorited(tourData.id);
        }
      }
    } catch (error) {
      console.error('Error loading tour:', error);
      if (error.response?.status === 404) {
        navigate('/turlar');
        toast.error('Tur bulunamadı');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSEO = (tourData) => {
    // Sayfa başlığını güncelle
    document.title = createSeoTitle(tourData.title, tourData.location);
    
    // Meta description güncelle
    const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    metaDescription.setAttribute('content', createSeoDescription(
      tourData.title, 
      tourData.location, 
      tourData.short_description, 
      tourData.minimum_price
    ));
    if (!document.head.contains(metaDescription)) {
      document.head.appendChild(metaDescription);
    }
    
    // Open Graph meta etiketleri
    updateMetaTag('property', 'og:title', `${tourData.title} | DijipalTour`);
    updateMetaTag('property', 'og:description', tourData.short_description);
    updateMetaTag('property', 'og:image', tourData.images?.[0] || '');
    updateMetaTag('property', 'og:url', `${window.location.origin}/turlar/${createSlug(tourData.title)}`);
    updateMetaTag('property', 'og:type', 'website');
    
    // Twitter Card
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', `${tourData.title} | DijipalTour`);
    updateMetaTag('name', 'twitter:description', tourData.short_description);
    updateMetaTag('name', 'twitter:image', tourData.images?.[0] || '');
    
    // Schema.org JSON-LD
    const schemaScript = document.querySelector('#tour-schema') || document.createElement('script');
    schemaScript.id = 'tour-schema';
    schemaScript.type = 'application/ld+json';
    schemaScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      "name": tourData.title,
      "description": tourData.short_description,
      "image": tourData.images?.[0] || '',
      "brand": {
        "@type": "Brand",
        "name": "DijipalTour"
      },
      "offers": {
        "@type": "Offer",
        "price": tourData.minimum_price || 0,
        "priceCurrency": "TRY",
        "availability": "https://schema.org/InStock"
      },
      "aggregateRating": tourData.rating ? {
        "@type": "AggregateRating", 
        "ratingValue": tourData.rating,
        "reviewCount": tourData.review_count || 0
      } : undefined
    });
    
    if (!document.head.contains(schemaScript)) {
      document.head.appendChild(schemaScript);
    }
  };

  const updateMetaTag = (attribute, value, content) => {
    let meta = document.querySelector(`meta[${attribute}="${value}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, value);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  };

  const loadReviews = async (tourId = null, page = 1, limit = 3) => {
    if (!tourId) return; // tourId olmadan çalıştırma
    
    setReviewsLoading(true);
    try {
      // İlk olarak toplam sayıyı almak için tüm reviewları çek
      const totalResponse = await axios.get(`${API}/reviews?tour_id=${tourId}`);
      const allReviews = totalResponse.data.reviews || totalResponse.data;
      const totalCount = allReviews.length;
      
      if (page === 1) {
        // Ana sayfa için sadece ilk 3'ü göster
        const reviewsData = allReviews.slice(0, 3);
        
        setReviews(reviewsData);
        setTotalReviews(totalCount);
      } else {
        // Modal için tüm reviews
        return { reviews: allReviews, total: totalCount };
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
      setTotalReviews(0);
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadModalReviews = async (page = 1) => {
    setModalLoading(true);
    try {
      // Tüm reviewları çek
      const response = await axios.get(`${API}/reviews?tour_id=${tourSlug}`);
      const allReviews = response.data.reviews || response.data;
      const totalCount = allReviews.length;
      
      // Pagination için hesapla
      const startIndex = (page - 1) * reviewsPerPage;
      const endIndex = startIndex + reviewsPerPage;
      const paginatedReviews = allReviews.slice(startIndex, endIndex);
      
      setModalReviews(paginatedReviews);
      setTotalReviews(totalCount);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading modal reviews:', error);
      setModalReviews([]);
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalOpen = () => {
    setShowReviewsModal(true);
    loadModalReviews(1);
  };

  const loadAvailableDates = async (tourId) => {
    try {
      const response = await axios.get(`${API}/tours/${tourId}/dates`);
      
      // Sadece aktif tarihleri filtrele (geçmiş tarihler cron job ile pasif yapılıyor)
      const activeDates = response.data.filter(date => {
        // Status kontrolü
        if (date.status && date.status !== 'active') {
          return false;
        }
        
        // Ek kontrol: tarih geçmişse client-side da filtrele
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const dateValue = date.date || date.start_date;
        if (dateValue) {
          const tourDate = new Date(dateValue);
          tourDate.setHours(0, 0, 0, 0);
          return tourDate >= today;
        }
        
        return true; // Date parse edilemezse göster
      });
      
      console.log(`🗓️  Filtered dates: ${response.data.length} → ${activeDates.length} active dates`);
      
      setAvailableDates(activeDates);
      if (activeDates.length > 0) {
        setSelectedDate(activeDates[0]);
      }
    } catch (error) {
      console.error('Error loading dates:', error);
    }
  };

  const checkIfFavorited = async (tourId) => {
    if (!tourId) return;
    
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
      // Save current booking state before showing login modal
      const bookingState = {
        tourId: tour.id,
        tourSlug: tourSlug, // Add slug for better matching
        selectedDate: selectedDate,
        selectedCabinType: selectedCabinType,
        // Reservation type'a göre doğru veriyi kaydet
        ...(tour.reservation_type === 'cabin_based' ? {
          singleCabinCount: singleCabinCount,
          doubleCabinCount: doubleCabinCount,
          cabinCount: singleCabinCount + doubleCabinCount
        } : tour.reservation_type === 'person_based' ? {
          participants: participants,
          childCount: childCount,
          totalPersons: participants + childCount
        } : {
          participants: 1
        }),
        timestamp: Date.now()
      };
      
      localStorage.setItem('pendingBookingState', JSON.stringify(bookingState));
      console.log('💾 Saved booking state before login:', bookingState);
      
      setShowLoginModal(true);
      return;
    }
    
    if (!selectedDate || !selectedCabinType) {
      toast.error('Lütfen tarih ve kabin tipi seçin');
      return;
    }

    // Save user behavior before booking
    saveSearchBehavior(tour.id, cabinCount, selectedDate.single_cabin_price || selectedDate.price);

    // Navigate to booking page with complete tour data (like cart does)
    const bookingData = {
      tourId: tour.id,
      title: tour.title,
      images: tour.images,
      location: tour.location,
      selectedDate: selectedDate,
      cabinType: selectedCabinType,
      participants: cabinCount,
      single_cabin_price: selectedDate.single_cabin_price,
      double_cabin_price: selectedDate.double_cabin_price,
      // Add price calculation
      price: selectedCabinType === 'double' 
        ? selectedDate.double_cabin_price || selectedDate.price || 0
        : selectedDate.single_cabin_price || selectedDate.price || 0
    };

    // Clear any pending booking state since we're proceeding
    localStorage.removeItem('pendingBookingState');

    navigate(`/booking/${tour.id}`, {
      state: {
        tour: bookingData,
        selectedDate: selectedDate,
        // Reservation type'a göre doğru veriyi gönder
        ...(tour.reservation_type === 'cabin_based' ? {
          cabinType: selectedCabinType,
          singleCabinCount: singleCabinCount,
          doubleCabinCount: doubleCabinCount,
          participants: singleCabinCount + doubleCabinCount // Toplam kabin sayısı
        } : tour.reservation_type === 'person_based' ? {
          participants: participants,
          childCount: childCount,
          totalPersons: participants + childCount
        } : {
          participants: 1 // Reservation type için
        })
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

    if (!tour?.id) {
      toast.error('Tur bilgileri yüklenemedi');
      return;
    }

    try {
      if (isFavorited) {
        // Remove from favorites
        await axios.delete(`${API}/favorites/${tour.id}`);
        setIsFavorited(false);
        toast.success('Favorilerden çıkarıldı');
      } else {
        // Add to favorites
        await axios.post(`${API}/favorites/${tour.id}`);
        setIsFavorited(true);
        toast.success('Favorilere eklendi');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Mobile booking bar add to cart handler
  const handleAddToCart = () => {
    if (!selectedDate || !selectedCabinType) {
      toast.error('Lütfen tarih ve kabin tipi seçin');
      return;
    }
    
    // Add to cart with cabin count (not participant count)
    addToCart(selectedCabinType, cabinCount);
  };

  const addToCart = (cabinType = selectedCabinType, participantsParam = tour?.reservation_type === 'person_based' ? participants : cabinCount) => {
    if (!selectedDate) {
      toast.error('Lütfen önce bir tarih seçin');
      return;
    }

    // Save user behavior before adding to cart
    const currentCabinPrice = (() => {
      if (tour?.reservation_type === 'person_based') {
        return selectedDate.person_price || 0;
      } else if (tour?.reservation_type === 'reservation') {
        return selectedDate.total_reservation_price || 0;
      } else {
        // cabin_based
        return cabinType === 'single' 
          ? selectedDate.single_cabin_price
          : selectedDate.double_cabin_price;
      }
    })();
    
    saveSearchBehavior(tour.id, participantsParam, currentCabinPrice);

    const cartItem = {
      tourId: tour.id,
      title: tour.title,
      location: tour.location,
      duration: tour.duration || tour.duration_days,
      duration_unit: tour.duration_unit || (tour.duration_days ? 'days' : 'hours'), // Fallback logic
      price: currentCabinPrice, // Seçilen kabin tipinin fiyatı
      single_cabin_price: selectedDate.single_cabin_price,
      double_cabin_price: selectedDate.double_cabin_price,
      person_price: selectedDate.person_price, // Kişi bazlı fiyat
      child_price: selectedDate.child_price, // Çocuk fiyatı
      total_reservation_price: selectedDate.total_reservation_price, // Toplam rezervasyon fiyatı
      cabinType: cabinType, // 'single' veya 'double'
      participants: participantsParam,
      childCount: childCount, // Çocuk sayısı
      singleCabinCount: singleCabinCount, // Tek kişilik kabin sayısı
      doubleCabinCount: doubleCabinCount, // Çift kişilik kabin sayısı
      reservation_type: tour.reservation_type, // Rezervasyon tipi
      image: tour.images[0] || '/placeholder-tour.jpg',
      selectedDate: {
        date: selectedDate.start_date, // API'den gelen field adı
        single_cabin_price: selectedDate.single_cabin_price,
        double_cabin_price: selectedDate.double_cabin_price,
        person_price: selectedDate.person_price,
        child_price: selectedDate.child_price,
        total_reservation_price: selectedDate.total_reservation_price,
        max_persons: selectedDate.max_persons,
        capacity: selectedDate.capacity, // Kabin kapasitesi
        available_cabins: selectedDate.available_cabins, // Mevcut kabin sayısı
        childCount: childCount, // Çocuk sayısını selectedDate içinde de sakla
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

    if (tour?.reservation_type === 'cabin_based') {
      // Kabin bazlı: Aynı tur ve tarih için tek item, kabin sayılarını birleştir
      const existingItemIndex = cartItems.findIndex(item => 
        item.tourId === tour.id && 
        item.selectedDate?.date === selectedDate.start_date
      );
      
      if (existingItemIndex >= 0) {
        // Var olan item'ı güncelle - mevcut kabin sayılarını koru ve yenilerini ekle
        cartItems[existingItemIndex] = {
          ...cartItems[existingItemIndex],
          singleCabinCount: singleCabinCount,
          doubleCabinCount: doubleCabinCount,
          participants: singleCabinCount + doubleCabinCount // Toplam kabin sayısı
        };
        toast.success('Sepetteki kabin seçimi güncellendi');
      } else {
        // Yeni kabin bazlı item ekle
        cartItems.push(cartItem);
        toast.success('Kabin seçimi sepete eklendi');
      }
    } else {
      // Kişi bazlı ve rezervasyon bazlı için eski mantık
      const existingItemIndex = cartItems.findIndex(item => 
        item.tourId === tour.id && 
        item.selectedDate?.date === selectedDate.start_date &&
        item.cabinType === cabinType
      );
      
      if (existingItemIndex >= 0) {
        cartItems[existingItemIndex].participants = participantsParam;
        cartItems[existingItemIndex].childCount = childCount;
        toast.success('Sepetteki tur güncellendi');
      } else {
        cartItems.push(cartItem);
        toast.success('Tur sepete eklendi');
      }
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
            to="/turlar"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
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
          to="/turlar"
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
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-3 sm:space-y-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{tour.location}</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    {tour.title}
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
                    {tour.short_description}
                  </p>
                </div>
                
                {tour.category && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium self-start sm:ml-4 shrink-0">
                    {tour.category}
                  </span>
                )}
              </div>

              {/* Rating and Meta */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-6 pb-6 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          i < Math.floor(tour.rating || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600">
                    {tour.rating > 0 ? tour.rating.toFixed(1) : 'Değerlendirme yok'} 
                    {tour.rating > 0 && ` (${tour.review_count || 0} değerlendirme)`}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>
                    {tour.duration || tour.duration_days || 1} {(() => {
                      if (tour.duration_unit === 'hours') return 'Saat';
                      if (tour.duration_unit === 'days') return 'Gün';
                      return tour.duration_days ? 'Gün' : 'Saat'; // fallback
                    })()}
                  </span>
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
                  <div 
                    className={`whitespace-pre-wrap ${!showFullDescription && tour.description && tour.description.length > 200 ? 'line-clamp-3' : ''}`}
                    style={!showFullDescription && tour.description && tour.description.length > 200 ? {
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    } : {}}
                  >
                    {tour.description}
                  </div>
                  {tour.description && tour.description.length > 200 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors mt-3"
                    >
                      <span>{showFullDescription ? 'Daha az göster' : 'Devamını oku'}</span>
                      {showFullDescription ? 
                        <ChevronUp className="w-4 h-4" /> : 
                        <ChevronDown className="w-4 h-4" />
                      }
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
                    <div 
                      className={`whitespace-pre-wrap text-gray-700 leading-relaxed ${!showFullProgram && tour.program_details && tour.program_details.length > 300 ? 'line-clamp-3' : ''}`}
                      style={!showFullProgram && tour.program_details && tour.program_details.length > 300 ? {
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      } : {}}
                    >
                      {tour.program_details}
                    </div>
                    {tour.program_details && tour.program_details.length > 300 && (
                      <button
                        onClick={() => setShowFullProgram(!showFullProgram)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors mt-3"
                      >
                        <span>{showFullProgram ? 'Daha az göster' : 'Detaylı programı görüntüle'}</span>
                        {showFullProgram ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                        }
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

            {/* Değerlendirmeler - En fazla 3 tane */}
            <div className="bg-white rounded-xl p-6 shadow-lg mt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Değerlendirmeler ({totalReviews || reviews.length})
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
                <div>
                  <div className="space-y-4">
                    {reviews.slice(0, 3).map((review) => (
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
                
                {/* Daha fazla gör butonu */}
                {totalReviews > 3 && (
                  <div className="text-center mt-6">
                    <button
                      onClick={handleModalOpen}
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 cursor-pointer"
                    >
                      Daha Fazla Gör ({totalReviews - 3} değerlendirme daha)
                    </button>
                  </div>
                )}
                </div>
              )}
            </div>
          </div>

          {/* Booking Sidebar - Desktop Only */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="bg-white rounded-xl p-6 shadow-lg sticky top-8">
              {/* Pricing - Show minimum available price */}
              <div className="text-left mb-6">
                <div className="text-xl font-bold text-blue-600 mb-1">
                  ₺{availableDates.length > 0 
                    ? (() => {
                        const allPrices = [];
                        availableDates.forEach(date => {
                          if (date.single_cabin_price && date.single_cabin_price > 0) allPrices.push(date.single_cabin_price);
                          if (date.double_cabin_price && date.double_cabin_price > 0) allPrices.push(date.double_cabin_price);
                          if (date.person_price && date.person_price > 0) allPrices.push(date.person_price);
                          if (date.total_reservation_price && date.total_reservation_price > 0) allPrices.push(date.total_reservation_price);
                          if (!date.single_cabin_price && !date.person_price && !date.total_reservation_price && date.price) allPrices.push(date.price);
                        });
                        return allPrices.length > 0 ? Math.min(...allPrices).toLocaleString('tr-TR') : '0';
                      })()
                    : (tour.minimum_price?.toLocaleString('tr-TR') || tour.base_price?.toLocaleString('tr-TR') || '0')
                  }
                  <span className="text-sm font-normal text-gray-600 ml-1"> den başlayan</span>
                </div>
                <p className="text-xs text-gray-500">
                  Vergiler dahil • {tour && tour.reservation_type === 'person_based' ? 'Kişi başı fiyat' : 
                                   tour && tour.reservation_type === 'reservation' ? 'Toplam rezervasyon' : 
                                   'Kabin başı fiyat'}
                </p>
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
                        <option value="all" className="font-medium">◦ Tüm Ayları Göster ({availableDates.length} Planlanmış Tur)</option>
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
                          onClick={() => setSelectedMonth('all')}
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
                            <div className="font-semibold text-blue-600 text-sm">
                              {(() => {
                                if (tour && tour.reservation_type === 'person_based') {
                                  if (date.person_price) {
                                    return `₺${(date.person_price || 0).toLocaleString('tr-TR')}`;
                                  }
                                } else if (tour && tour.reservation_type === 'reservation') {
                                  if (date.total_reservation_price) {
                                    return `₺${(date.total_reservation_price || 0).toLocaleString('tr-TR')}`;
                                  }
                                } else {
                                  // cabin_based
                                  if (date.single_cabin_price) {
                                    return `₺${(date.single_cabin_price || 0).toLocaleString('tr-TR')}`;
                                  } else if (date.price) {
                                    return `₺${date.price}`;
                                  }
                                }
                                return 'Fiyat';
                              })()}
                            </div>
                            {tour && tour.reservation_type === 'person_based' && date.child_price && (
                              <div className="text-xs text-gray-500">
                                Çocuk: ₺{(date.child_price || 0).toLocaleString('tr-TR')}
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
                    {selectedMonth && selectedMonth !== 'all' && (
                      <button
                        onClick={() => setSelectedMonth('all')}
                        className="text-blue-600 hover:text-blue-700 text-sm mt-2 underline"
                      >
                        Tüm ayları göster
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Dynamic Selection Based on Reservation Type */}
              {tour && (!tour.reservation_type || tour.reservation_type === 'cabin_based') && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Kabin Seçimi
                  </label>
                  
                  {/* Tek Kişilik Kabin Sayısı */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Tek Kişilik / 1 Kişi</div>
                    <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <button
                        onClick={() => {
                          if (singleCabinCount > 0) {
                            setSingleCabinCount(singleCabinCount - 1);
                          }
                        }}
                        className="w-10 h-10 rounded-lg bg-white border-2 border-blue-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-blue-600 transition-all duration-200 shadow-sm"
                        disabled={singleCabinCount <= 0}
                      >
                        -
                      </button>
                      <div className="flex-1 text-center">
                        <div className="text-xl font-bold text-gray-900">
                          {singleCabinCount} kabin
                        </div>
                        {selectedDate && selectedDate.single_cabin_price && singleCabinCount > 0 && (
                          <div className="text-sm text-gray-600">
                            ₺{(selectedDate.single_cabin_price || 0).toLocaleString('tr-TR')} × {singleCabinCount}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const maxCapacity = selectedDate ? (selectedDate.single_cabin_count || 10) : 10;
                          if (singleCabinCount < maxCapacity) {
                            setSingleCabinCount(singleCabinCount + 1);
                          }
                        }}
                        className="w-10 h-10 rounded-lg bg-white border-2 border-blue-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-blue-600 transition-all duration-200 shadow-sm"
                        disabled={singleCabinCount >= (selectedDate ? (selectedDate.single_cabin_count || 10) : 10)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Çift Kişilik Kabin Sayısı */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Çift Kişilik / 2 Kişi</div>
                    <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <button
                        onClick={() => {
                          if (doubleCabinCount > 0) {
                            setDoubleCabinCount(doubleCabinCount - 1);
                          }
                        }}
                        className="w-10 h-10 rounded-lg bg-white border-2 border-blue-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-blue-600 transition-all duration-200 shadow-sm"
                        disabled={doubleCabinCount <= 0}
                      >
                        -
                      </button>
                      <div className="flex-1 text-center">
                        <div className="text-xl font-bold text-gray-900">
                          {doubleCabinCount} kabin
                        </div>
                        {selectedDate && selectedDate.double_cabin_price && doubleCabinCount > 0 && (
                          <div className="text-sm text-gray-600">
                            ₺{(selectedDate.double_cabin_price || 0).toLocaleString('tr-TR')} × {doubleCabinCount}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const maxCapacity = selectedDate ? (selectedDate.double_cabin_count || 10) : 10;
                          if (doubleCabinCount < maxCapacity) {
                            setDoubleCabinCount(doubleCabinCount + 1);
                          }
                        }}
                        className="w-10 h-10 rounded-lg bg-white border-2 border-blue-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-blue-600 transition-all duration-200 shadow-sm"
                        disabled={doubleCabinCount >= (selectedDate ? (selectedDate.double_cabin_count || 10) : 10)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Total price display removed for cabin selection */}
                  
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {selectedDate 
                      ? `Müsait: ${selectedDate.single_cabin_count || 0} tek kişilik, ${selectedDate.double_cabin_count || 0} çift kişilik kabin` 
                      : 'Önce tarih seçin, sonra kabin adedini belirleyin'
                    }
                  </p>
                </div>
              )}

              {tour && tour.reservation_type === 'person_based' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Katılımcı Sayısı
                  </label>
                  
                  {/* Yetişkin Sayısı */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Yetişkin Sayısı</div>
                    <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <button
                        onClick={() => {
                          if (participants > 1) {
                            setParticipants(participants - 1);
                          }
                        }}
                        className="w-10 h-10 rounded-lg bg-white border-2 border-blue-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-blue-600 transition-all duration-200 shadow-sm"
                        disabled={participants <= 1}
                      >
                        -
                      </button>
                      <div className="flex-1 text-center">
                        <div className="text-xl font-bold text-gray-900">
                          {participants || 1} Yetişkin
                        </div>
                        {selectedDate && selectedDate.person_price && (
                          <div className="text-sm text-gray-600">
                            ₺{(selectedDate.person_price || 0).toLocaleString('tr-TR')} kişi başı
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const maxCapacity = selectedDate ? (selectedDate.max_persons || 50) : 50;
                          if ((participants + childCount) < maxCapacity) {
                            setParticipants((participants || 1) + 1);
                          }
                        }}
                        className="w-10 h-10 rounded-lg bg-white border-2 border-blue-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-blue-600 transition-all duration-200 shadow-sm"
                        disabled={(participants + childCount) >= (selectedDate ? (selectedDate.max_persons || 50) : 50)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Çocuk Sayısı */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Çocuk Sayısı</div>
                    <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <button
                        onClick={() => {
                          if (childCount > 0) {
                            setChildCount(childCount - 1);
                          }
                        }}
                        className="w-10 h-10 rounded-lg bg-white border-2 border-blue-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-blue-600 transition-all duration-200 shadow-sm"
                        disabled={childCount <= 0}
                      >
                        -
                      </button>
                      <div className="flex-1 text-center">
                        <div className="text-xl font-bold text-gray-900">
                          {childCount} Çocuk
                        </div>
                        {selectedDate && selectedDate.child_price && (
                          <div className="text-sm text-gray-600">
                            ₺{(selectedDate.child_price || 0).toLocaleString('tr-TR')} kişi başı
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const maxCapacity = selectedDate ? (selectedDate.max_persons || 50) : 50;
                          if ((participants + childCount) < maxCapacity) {
                            setChildCount(childCount + 1);
                          }
                        }}
                        className="w-10 h-10 rounded-lg bg-white border-2 border-blue-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-blue-600 transition-all duration-200 shadow-sm"
                        disabled={(participants + childCount) >= (selectedDate ? (selectedDate.max_persons || 50) : 50)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Total price display removed for person-based selection */}
                  
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {selectedDate 
                      ? `Bu tarih için maksimum ${selectedDate.max_persons || 0} kişi katılabilir` 
                      : 'Önce tarih seçin, sonra katılımcı sayısını belirleyin'
                    }
                  </p>
                </div>
              )}

              {/* Desktop Rezervasyon Bilgileri section removed for all reservation types */}

              {/* Booking Summary section removed as requested */}

              {/* Desktop Booking Summary - Dynamic Based on Selections */}
              {selectedDate && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700 mb-2">
                      ₺{(() => {
                        if (!tour) return '0';
                        
                        if (tour.reservation_type === 'person_based') {
                          const adultTotal = (selectedDate.person_price || 0) * participants;
                          const childTotal = (selectedDate.child_price || 0) * childCount;
                          return (adultTotal + childTotal).toLocaleString('tr-TR');
                        } else if (tour.reservation_type === 'reservation') {
                          return (selectedDate.total_reservation_price || 0).toLocaleString('tr-TR');
                        } else {
                          // cabin_based - show selected cabins only
                          const singleTotal = (selectedDate.single_cabin_price || 0) * singleCabinCount;
                          const doubleTotal = (selectedDate.double_cabin_price || 0) * doubleCabinCount;
                          return (singleTotal + doubleTotal).toLocaleString('tr-TR');
                        }
                      })()}
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-1">
                      {(() => {
                        if (!tour) return 'Yükleniyor...';
                        
                        if (tour.reservation_type === 'person_based') {
                          const total = participants + childCount;
                          if (total === 0) return 'Katılımcı seçin';
                          return `${participants} Yetişkin + ${childCount} Çocuk = ${total} kişi`;
                        } else if (tour.reservation_type === 'reservation') {
                          return `Özel rezervasyon - Max ${selectedDate.max_persons || 0} kişi`;
                        } else {
                          // cabin_based - show selected cabins
                          const totalCabins = singleCabinCount + doubleCabinCount;
                          if (totalCabins === 0) return 'Kabin seçin';
                          
                          const parts = [];
                          if (singleCabinCount > 0) parts.push(`${singleCabinCount} tek kişilik`);
                          if (doubleCabinCount > 0) parts.push(`${doubleCabinCount} çift kişilik`);
                          return parts.join(' + ') + ' kabin seçildi';
                        }
                      })()}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {new Date(selectedDate.start_date || selectedDate.date).toLocaleDateString('tr-TR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })} • Vergiler dahil
                    </div>
                    
                    {/* Selection Details */}
                    <div className="mt-3 pt-2 border-t border-blue-200 text-xs text-gray-600">
                      {(() => {
                        if (tour && tour.reservation_type === 'person_based') {
                          return `Yetişkin: ₺${(selectedDate.person_price || 0).toLocaleString('tr-TR')} × ${participants}${childCount > 0 ? ` • Çocuk: ₺${(selectedDate.child_price || 0).toLocaleString('tr-TR')} × ${childCount}` : ''}`;
                        } else if (tour && tour.reservation_type === 'reservation') {
                          return `Sabit Fiyat Toplam Rezervasyon`;
                        } else {
                          // cabin_based
                          const parts = [];
                          if (singleCabinCount > 0) {
                            parts.push(`Tek kabin: ₺${(selectedDate.single_cabin_price || 0).toLocaleString('tr-TR')} × ${singleCabinCount}`);
                          }
                          if (doubleCabinCount > 0) {
                            parts.push(`Çift kabin: ₺${(selectedDate.double_cabin_price || 0).toLocaleString('tr-TR')} × ${doubleCabinCount}`);
                          }
                          return parts.length > 0 ? parts.join(' • ') : 'Seçim yapın';
                        }
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop Booking Buttons - Grid Layout */}
              <div className="grid grid-cols-12 gap-3">
                {/* Sepete Ekle Butonu - 3 sütun (Sol taraf - Sadece İkon) */}
                <button
                  onClick={() => addToCart()}
                  disabled={!selectedDate}
                  className="col-span-3 p-3 rounded-lg transition-colors duration-200 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed border border-gray-300"
                  title="Sepete Ekle"
                >
                  <ShoppingCart className="w-5 h-5" />
                </button>
                
                {/* Rezervasyon Yap Butonu - 9 sütun (Sağ taraf) */}
                <button
                  onClick={handleBooking}
                  disabled={!selectedDate}
                  className="col-span-9 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 disabled:cursor-not-allowed"
                >
                  {user ? 'Rezervasyon Tamamla' : 'Giriş Yapın & Rezervasyon Yapın'}
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
                    <span>0850 255 53 35</span>
                  </a>
                  <a
                    href="mailto:info@dijipaltour.com"
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200"
                  >
                    <Mail className="w-4 h-4" />
                    <span>info@dijipaltour.com</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Modal with Pagination */}
      {showReviewsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Tüm Değerlendirmeler ({totalReviews})
              </h3>
              <button
                onClick={() => setShowReviewsModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {modalLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
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
              ) : modalReviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>Henüz değerlendirme yok</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {modalReviews.map((review) => (
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
            
            {/* Pagination */}
            {totalReviews > reviewsPerPage && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Sayfa {currentPage} / {Math.ceil(totalReviews / reviewsPerPage)}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => loadModalReviews(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Önceki
                    </button>
                    
                    <span className="text-sm text-gray-500 px-3">
                      {Math.min((currentPage - 1) * reviewsPerPage + 1, totalReviews)}-{Math.min(currentPage * reviewsPerPage, totalReviews)} / {totalReviews}
                    </span>
                    
                    <button
                      onClick={() => loadModalReviews(currentPage + 1)}
                      disabled={currentPage >= Math.ceil(totalReviews / reviewsPerPage)}
                      className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Sonraki
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Booking Summary removed from inline - will be in modal */}

      {/* Mobile Bottom Booking Bar - Original Design */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-3 py-2 lg:hidden z-50 shadow-lg">
        <div className="flex items-center justify-between space-x-2">
          {/* Price Section - Original */}
          <div className="flex-1 min-w-0">
            <div className="text-base font-bold text-gray-900 truncate">
              {(() => {
                if (!selectedDate) return 'Tarih Seçin';
                
                if (tour && tour.reservation_type === 'person_based') {
                  const adultPrice = selectedDate.person_price || 0;
                  const childPrice = selectedDate.child_price || 0;
                  if (!adultPrice && !childPrice) return 'Fiyat Yükleniyor...';
                  const totalPrice = (adultPrice * participants) + (childPrice * childCount);
                  if (totalPrice === 0) return 'Katılımcı Seçin';
                  return '₺' + totalPrice.toLocaleString('tr-TR');
                } else if (tour && tour.reservation_type === 'reservation') {
                  const price = selectedDate.total_reservation_price;
                  if (!price || isNaN(price)) return 'Fiyat Yükleniyor...';
                  return '₺' + price.toLocaleString('tr-TR');
                } else {
                  // cabin_based - show selection-based pricing
                  const singleTotal = (selectedDate.single_cabin_price || 0) * singleCabinCount;
                  const doubleTotal = (selectedDate.double_cabin_price || 0) * doubleCabinCount;
                  const totalPrice = singleTotal + doubleTotal;
                  
                  if (totalPrice === 0) return 'Kabin Seçin';
                  return '₺' + totalPrice.toLocaleString('tr-TR');
                }
              })()}
            </div>
            <div className="text-xs text-gray-600 truncate">
              {(() => {
                if (tour && tour.reservation_type === 'person_based') {
                  const total = participants + childCount;
                  if (total === 0) return 'Katılımcı seçin';
                  return `${participants} Yetişkin + ${childCount} Çocuk seçildi`;
                } else if (tour && tour.reservation_type === 'reservation') {
                  const maxCapacity = selectedDate ? (selectedDate.max_persons || 0) : 0;
                  return `Sabit Fiyat Toplam Rezervasyon - Max ${maxCapacity} kişi`;
                } else {
                  // cabin_based - show selection status
                  const totalCabins = singleCabinCount + doubleCabinCount;
                  if (totalCabins === 0) return 'Kabin seçin';
                  
                  const parts = [];
                  if (singleCabinCount > 0) parts.push(`${singleCabinCount} tek`);
                  if (doubleCabinCount > 0) parts.push(`${doubleCabinCount} çift`);
                  return parts.join(' + ') + ' kabin seçildi';
                }
              })()}
              {selectedDate && (
                <span className="ml-1">
                  • {new Date(selectedDate.start_date || selectedDate.date).toLocaleDateString('tr-TR', { 
                    day: '2-digit', 
                    month: '2-digit',
                    year: '2-digit'
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Action Button - Original */}
          <div className="flex items-center">
            <button
              onClick={() => setShowBookingModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 text-sm min-h-[44px] w-full flex items-center justify-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Rezervasyon Yap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Combined Booking Modal - Full Screen on Mobile */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white w-full h-full lg:w-auto lg:h-auto lg:max-w-md lg:rounded-lg lg:max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">Rezervasyon Detayları</h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 space-y-6 flex-1 overflow-y-auto">
              {/* Date Selection Section */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Tur Tarihi Seçin
                </h4>
                
                {/* Month Filter */}
                {availableDates.length > 0 && (
                  <div className="mb-3">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white"
                    >
                      <option value="all">Tüm Aylar</option>
                      {(() => {
                        const months = [...new Set(availableDates.map(date => {
                          const d = new Date(date.start_date);
                          return `${d.getFullYear()}-${d.getMonth()}`;
                        }))].map(monthKey => {
                          const [year, month] = monthKey.split('-');
                          const monthName = new Date(year, month).toLocaleDateString('tr-TR', { 
                            month: 'long', 
                            year: 'numeric' 
                          });
                          return { key: monthKey, name: monthName };
                        });
                        
                        return months.map(month => (
                          <option key={month.key} value={month.key}>
                            {month.name}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                )}

                {availableDates.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availableDates
                      .filter(date => {
                        if (selectedMonth === 'all') return true;
                        const d = new Date(date.start_date);
                        const dateKey = `${d.getFullYear()}-${d.getMonth()}`;
                        return dateKey === selectedMonth;
                      })
                      .map((date, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedDate(date)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedDate?.start_date === date.start_date
                              ? 'bg-blue-50 border-blue-200 text-blue-800'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="font-medium text-sm">
                            {new Date(date.start_date).toLocaleDateString('tr-TR', {
                              weekday: 'long',
                              year: 'numeric', 
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {(() => {
                              if (tour && tour.reservation_type === 'person_based') {
                                return `Kişi başı: ₺${date.person_price?.toLocaleString('tr-TR') || '0'}${date.child_price ? ` • Çocuk: ₺${(date.child_price || 0).toLocaleString('tr-TR')}` : ''}`;
                              } else if (tour && tour.reservation_type === 'reservation') {
                                return `Toplam: ₺${date.total_reservation_price?.toLocaleString('tr-TR') || '0'}`;
                              } else {
                                return `Tek Kabin: ₺${date.single_cabin_price?.toLocaleString('tr-TR') || '0'} • Çift Kabin: ₺${date.double_cabin_price?.toLocaleString('tr-TR') || '0'}`;
                              }
                            })()}
                          </div>
                        </button>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Şu anda müsait tarih bulunmuyor</p>
                  </div>
                )}
              </div>

              {/* Dynamic Selection Based on Reservation Type */}
              
              {/* Kabin Bazlı Rezervasyon */}
              {tour && (!tour.reservation_type || tour.reservation_type === 'cabin_based') && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Kabin Seçimi
                  </h4>
                  
                  {/* Tek Kişilik Kabin */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Tek Kişilik / 1 Kişi</span>
                      {selectedDate && selectedDate.single_cabin_price && (
                        <span className="text-sm text-blue-600 font-medium">
                          ₺{(selectedDate.single_cabin_price || 0).toLocaleString('tr-TR')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-center space-x-4 py-2">
                      <button
                        onClick={() => setSingleCabinCount(Math.max(0, singleCabinCount - 1))}
                        className="w-10 h-10 rounded-lg bg-white border-2 border-blue-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-blue-600 transition-all duration-200 shadow-sm"
                        disabled={singleCabinCount <= 0}
                      >
                        -
                      </button>
                      <span className="text-lg font-semibold min-w-[3rem] text-center">
                        {singleCabinCount}
                      </span>
                      <button
                        onClick={() => setSingleCabinCount(singleCabinCount + 1)}
                        className="w-10 h-10 rounded-lg bg-white border-2 border-blue-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-blue-600 transition-all duration-200 shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Çift Kişilik Kabin */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Çift Kişilik / 2 Kişi</span>
                      {selectedDate && selectedDate.double_cabin_price && (
                        <span className="text-sm text-blue-600 font-medium">
                          ₺{(selectedDate.double_cabin_price || 0).toLocaleString('tr-TR')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-center space-x-4 py-2">
                      <button
                        onClick={() => setDoubleCabinCount(Math.max(0, doubleCabinCount - 1))}
                        className="w-10 h-10 rounded-lg bg-white border-2 border-blue-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-blue-600 transition-all duration-200 shadow-sm"
                        disabled={doubleCabinCount <= 0}
                      >
                        -
                      </button>
                      <span className="text-lg font-semibold min-w-[3rem] text-center">
                        {doubleCabinCount}
                      </span>
                      <button
                        onClick={() => setDoubleCabinCount(doubleCabinCount + 1)}
                        className="w-10 h-10 rounded-lg bg-white border-2 border-blue-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-blue-600 transition-all duration-200 shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Kişi Bazlı Rezervasyon */}
              {tour && tour.reservation_type === 'person_based' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Katılımcı Sayısı
                  </h4>
                  
                  {/* Yetişkin Sayısı */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Yetişkin Sayısı</span>
                      {selectedDate && selectedDate.person_price && (
                        <span className="text-sm text-blue-600 font-medium">
                          ₺{(selectedDate.person_price || 0).toLocaleString('tr-TR')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-center space-x-4 py-2">
                      <button
                        onClick={() => setParticipants(Math.max(1, participants - 1))}
                        className="w-10 h-10 rounded-lg bg-white border-2 border-blue-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-blue-600 transition-all duration-200 shadow-sm"
                        disabled={participants <= 1}
                      >
                        -
                      </button>
                      <span className="text-lg font-semibold min-w-[3rem] text-center">
                        {participants}
                      </span>
                      <button
                        onClick={() => setParticipants(participants + 1)}
                        className="w-10 h-10 rounded-lg bg-white border-2 border-blue-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-blue-600 transition-all duration-200 shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Çocuk Sayısı */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Çocuk Sayısı</span>
                      {selectedDate && selectedDate.child_price && (
                        <span className="text-sm text-blue-600 font-medium">
                          ₺{(selectedDate.child_price || 0).toLocaleString('tr-TR')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-center space-x-4 py-2">
                      <button
                        onClick={() => setChildCount(Math.max(0, childCount - 1))}
                        className="w-10 h-10 rounded-lg bg-white border-2 border-blue-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-blue-600 transition-all duration-200 shadow-sm"
                        disabled={childCount <= 0}
                      >
                        -
                      </button>
                      <span className="text-lg font-semibold min-w-[3rem] text-center">
                        {childCount}
                      </span>
                      <button
                        onClick={() => setChildCount(childCount + 1)}
                        className="w-10 h-10 rounded-lg bg-white border-2 border-blue-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-blue-600 transition-all duration-200 shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Rezervasyon Bilgileri section removed for all reservation types */}

              {/* Mobile Modal Booking Summary */}
              {selectedDate && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 mb-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-700 mb-2">
                      ₺{(() => {
                        if (!tour) return '0';
                        
                        if (tour.reservation_type === 'person_based') {
                          const adultTotal = (selectedDate.person_price || 0) * participants;
                          const childTotal = (selectedDate.child_price || 0) * childCount;
                          return (adultTotal + childTotal).toLocaleString('tr-TR');
                        } else if (tour.reservation_type === 'reservation') {
                          return (selectedDate.total_reservation_price || 0).toLocaleString('tr-TR');
                        } else {
                          // cabin_based - show selected cabins only
                          const singleTotal = (selectedDate.single_cabin_price || 0) * singleCabinCount;
                          const doubleTotal = (selectedDate.double_cabin_price || 0) * doubleCabinCount;
                          return (singleTotal + doubleTotal).toLocaleString('tr-TR');
                        }
                      })()}
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      {(() => {
                        if (!tour) return 'Yükleniyor...';
                        
                        if (tour.reservation_type === 'person_based') {
                          const total = participants + childCount;
                          return `${participants} Yetişkin + ${childCount} Çocuk = ${total} kişi`;
                        } else if (tour.reservation_type === 'reservation') {
                          return `Özel rezervasyon - Max ${selectedDate.max_persons || 0} kişi`;
                        } else {
                          // cabin_based - show selected cabins
                          const totalCabins = singleCabinCount + doubleCabinCount;
                          if (totalCabins === 0) return 'Kabin seçin';
                          
                          const parts = [];
                          if (singleCabinCount > 0) parts.push(`${singleCabinCount} tek kişilik`);
                          if (doubleCabinCount > 0) parts.push(`${doubleCabinCount} çift kişilik`);
                          return parts.join(' + ') + ' kabin seçildi';
                        }
                      })()}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {new Date(selectedDate.start_date || selectedDate.date).toLocaleDateString('tr-TR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })} • 
                      {(() => {
                        if (tour && tour.reservation_type === 'person_based') {
                          return `₺${(selectedDate.person_price || 0).toLocaleString('tr-TR')} Yetişkin${childCount > 0 ? ` • ₺${(selectedDate.child_price || 0).toLocaleString('tr-TR')} Çocuk` : ''}`;
                        } else if (tour && tour.reservation_type === 'reservation') {
                          return `Sabit Fiyat Toplam Rezervasyon`;
                        } else {
                          // cabin_based
                          const parts = [];
                          if (singleCabinCount > 0) {
                            parts.push(`₺${(selectedDate.single_cabin_price || 0).toLocaleString('tr-TR')}×${singleCabinCount}`);
                          }
                          if (doubleCabinCount > 0) {
                            parts.push(`₺${(selectedDate.double_cabin_price || 0).toLocaleString('tr-TR')}×${doubleCabinCount}`);
                          }
                          return parts.length > 0 ? parts.join(' • ') + ' • Vergiler dahil' : 'Seçim yapın';
                        }
                      })()} • Vergiler dahil
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer with Action Buttons */}
            <div className="p-4 border-t bg-white sticky bottom-0">
              <div className="flex items-center space-x-3">
                {/* Add to Cart Button */}
                <button
                  onClick={() => {
                    if (!selectedDate || !selectedCabinType) {
                      toast.error('Lütfen tarih ve kabin tipi seçin');
                      return;
                    }
                    handleAddToCart();
                    setShowBookingModal(false);
                  }}
                  disabled={!selectedDate || !selectedCabinType}
                  className={`flex-shrink-0 p-3 rounded-lg transition-colors duration-200 ${
                    selectedDate && selectedCabinType
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                </button>
                
                {/* Book Now Button */}
                <button
                  onClick={() => {
                    if (!selectedDate || !selectedCabinType) {
                      toast.error('Lütfen tarih ve kabin tipi seçin');
                      return;
                    }
                    setShowBookingModal(false);
                    handleBooking();
                  }}
                  disabled={!selectedDate || !selectedCabinType}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
                    selectedDate && selectedCabinType
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Rezervasyon Yap
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add bottom padding to prevent content overlap with fixed bar on mobile */}
      <div className="h-20 lg:hidden"></div>
    </div>
  );
};

export default TourDetailPage;