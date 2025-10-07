import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  MapPin, 
  CreditCard,
  User,
  Mail,
  Phone,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { createSlug } from '../utils/slug';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BookingPage = () => {
  const { tourId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { 
    tour: stateTour, 
    selectedDate, 
    cabinType: stateCabinType, 
    participants: stateParticipants, 
    // Yeni format state'leri
    singleCabinCount: stateSingleCabinCount,
    doubleCabinCount: stateDoubleCabinCount,
    childCount: stateChildCount,
    totalPersons: stateTotalPersons,
    fromLogin 
  } = location.state || {};
  
  const [tour, setTour] = useState(stateTour || null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Reservation type'a göre state'leri set et
  const [participants, setParticipants] = useState(() => {
    if (stateTour?.reservation_type === 'person_based') {
      return stateParticipants || parseInt(searchParams.get('participants')) || 1;
    }
    return stateParticipants || parseInt(searchParams.get('participants')) || 1;
  });
  
  // Çocuk sayısı state'i
  const [childCount, setChildCount] = useState(
    stateChildCount || parseInt(searchParams.get('childCount')) || 0
  );
  
  // Kabin sayıları state'leri
  const [singleCabinCount, setSingleCabinCount] = useState(
    stateSingleCabinCount || parseInt(searchParams.get('singleCabinCount')) || 0
  );
  
  const [doubleCabinCount, setDoubleCabinCount] = useState(
    stateDoubleCabinCount || parseInt(searchParams.get('doubleCabinCount')) || 0
  );
  
  // State veya URL'den kabin tipini al (backward compatibility)
  const cabinType = stateCabinType || searchParams.get('cabinType') || 'single';
  
  // Debug için state'leri logla
  console.log('🔍 BookingPage State Debug:', {
    'reservation_type': stateTour?.reservation_type,
    'from_state': {
      stateParticipants,
      stateChildCount, 
      stateSingleCabinCount,
      stateDoubleCabinCount
    },
    'current_state': {
      participants,
      childCount,
      singleCabinCount,
      doubleCabinCount
    }
  });
  const singleCabinPrice = selectedDate?.single_cabin_price || parseFloat(searchParams.get('single_cabin_price')) || 0;
  const doubleCabinPrice = selectedDate?.double_cabin_price || parseFloat(searchParams.get('double_cabin_price')) || 0;
  
  const selectedPrice = cabinType === 'single' ? singleCabinPrice : doubleCabinPrice;
  
  // Debug için fiyat bilgilerini logla
  console.log('BookingPage Debug:', {
    selectedDate,
    cabinType,
    singleCabinPrice,
    doubleCabinPrice,
    selectedPrice,
    participants
  });
  
  // Kabin sayısı sepetten alınıyor, rezervasyonda değiştirilmiyor
  const formattedSelectedDate = selectedDate ? 
    (selectedDate.date ? 
      new Date(selectedDate.date).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 
      selectedDate.start_date ?
        new Date(selectedDate.start_date).toLocaleDateString('tr-TR', {
          year: 'numeric',
          month: 'long', 
          day: 'numeric'
        }) : null
    ) : null;
  
  const [customerInfo, setCustomerInfo] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    id_number: '',
    address: '',
    emergency_contact: '',
    dietary_requirements: '',
    medical_conditions: ''
  });

  const [paymentInfo, setPaymentInfo] = useState({
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    card_holder_name: ''
  });

  const [specialRequests, setSpecialRequests] = useState('');

  useEffect(() => {
    loadTour();
  }, [tourId]);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const loadTour = async () => {
    try {
      const response = await axios.get(`${API}/tours/${tourId}`);
      setTour(response.data);
    } catch (error) {
      console.error('Error loading tour:', error);
      navigate('/turlar');
      toast.error('Tur bulunamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerInfoChange = (field, value) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePaymentInfoChange = (field, value) => {
    setPaymentInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep = () => {
    if (step === 1) {
      const required = ['full_name', 'email', 'phone'];
      return required.every(field => customerInfo[field].trim());
    }
    if (step === 2) {
      const required = ['card_number', 'expiry_month', 'expiry_year', 'cvv', 'card_holder_name'];
      return required.every(field => paymentInfo[field].trim());
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error('Lütfen tüm gerekli alanları doldurun');
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBooking = async () => {
    if (!validateStep()) {
      toast.error('Lütfen tüm gerekli alanları doldurun');
      return;
    }

    setBookingLoading(true);
    try {
      // Create booking
      const bookingResponse = await axios.post(`${API}/bookings`, {
        tour_id: tourId,
        participants: participants,
        customer_info: customerInfo,
        special_requests: specialRequests
      });

      const booking = bookingResponse.data;

      // Process payment
      const paymentResponse = await axios.post(`${API}/bookings/${booking.id}/pay`, paymentInfo);

      toast.success('Rezervasyonunuz başarıyla oluşturuldu!');
      // Scroll to top before navigation
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        navigate('/profile?tab=bookings', { 
          state: { 
            booking: booking,
            success: true 
          }
        });
      }, 300);
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.detail || 'Rezervasyon sırasında bir hata oluştu');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            {fromLogin ? 'Rezervasyon sayfası hazırlanıyor...' : 'Yükleniyor...'}
          </p>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tur bulunamadı</h2>
          <button
            onClick={() => navigate('/turlar')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Turları Keşfet
          </button>
        </div>
      </div>
    );
  }

  // Seçilen tarih fiyatını kullan, yoksa base price
  // Debug fiyat hesaplama
  console.log('Booking Price Debug:', {
    selectedDate,
    cabinType,
    singleCabinPrice,
    doubleCabinPrice,
    selectedPrice,
    participants
  });

  const calculatePrice = () => {
    if (tour?.reservation_type === 'person_based') {
      const adultPrice = selectedDate?.person_price || 0;
      const childPrice = selectedDate?.child_price || 0;
      // State'deki childCount'u kullan
      const displayChildCount = childCount || selectedDate?.childCount || 0;
      
      console.log('🧮 Person-based Price Calculation:', {
        participants, adultPrice, adultTotal: adultPrice * participants,
        childCount: displayChildCount, childPrice, childTotal: childPrice * displayChildCount,
        total: (adultPrice * participants) + (childPrice * displayChildCount)
      });
      
      return (adultPrice * participants) + (childPrice * displayChildCount);
    } else if (tour?.reservation_type === 'reservation') {
      return selectedDate?.total_reservation_price || 0;
    } else {
      // Kabin bazlı - Sepetten gerçek kabin bilgilerini al (gelişmiş kontrol)
      try {
        const cartItems = JSON.parse(localStorage.getItem('tour_cart') || '[]');
        const cartItem = cartItems.find(item => 
          item.tourId === tour.id || item.tourId === tourId
        );
        
        if (cartItem && cartItem.reservation_type === 'cabin_based') {
          const singleCount = cartItem.singleCabinCount || 0;
          const doubleCount = cartItem.doubleCabinCount || 0;
          const singlePrice = cartItem.single_cabin_price || 0;
          const doublePrice = cartItem.double_cabin_price || 0;
          
          const singleTotal = singlePrice * singleCount;
          const doubleTotal = doublePrice * doubleCount;
          const totalCabinPrice = singleTotal + doubleTotal;
          
          console.log('🧮 Cart-based Price Calculation:', {
            singleCount, singlePrice, singleTotal,
            doubleCount, doublePrice, doubleTotal, 
            totalCabinPrice
          });
          
          return totalCabinPrice;
        }
        
        // State'den gelen veri kontrolü (öncelik ver)
        if (singleCabinCount > 0 || doubleCabinCount > 0) {
          const singlePrice = selectedDate?.single_cabin_price || 0;
          const doublePrice = selectedDate?.double_cabin_price || 0;
          
          const singleTotal = singlePrice * singleCabinCount;
          const doubleTotal = doublePrice * doubleCabinCount;
          
          console.log('🧮 State-based Price Calculation:', {
            singleCabinCount, singlePrice, singleTotal,
            doubleCabinCount, doublePrice, doubleTotal,
            total: singleTotal + doubleTotal
          });
          
          return singleTotal + doubleTotal;
        }
      } catch (error) {
        console.error('❌ Price calculation error:', error);
      }
      
      // Fallback: eski sistem
      const unitPrice = selectedPrice > 0 ? parseFloat(selectedPrice) : (tour?.base_price || 0);
      return unitPrice * participants;
    }
  };

  const subTotal = calculatePrice();
  
  // KDV %20 fiyata dahil hesaplama (fiyat KDV dahil, KDV'yi ayır)
  const kdvRate = 0.20;
  const priceWithoutKdv = subTotal / (1 + kdvRate);
  const kdvAmount = subTotal - priceWithoutKdv;
  
  const totalPrice = subTotal.toFixed(2);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate(tour?.title ? `/turlar/${createSlug(tour.title)}` : '/turlar')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Geri</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Rezervasyon</h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <React.Fragment key={stepNumber}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-medium transition-colors duration-200 ${
                  step >= stepNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > stepNumber ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    stepNumber
                  )}
                </div>
                {stepNumber < 3 && (
                  <div className={`flex-1 h-1 rounded-full ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2 px-4">
            <span>Bilgiler</span>
            <span>Ödeme</span>
            <span>Onay</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              {/* Step 1: Customer Information */}
              {step === 1 && (
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Katılımcı Bilgileri</h2>
                  
                  {/* Katılımcı sayısı kısmı kaldırıldı - sepetten gelen değer kullanılıyor */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ad Soyad *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={customerInfo.full_name}
                          onChange={(e) => handleCustomerInfoChange('full_name', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                          placeholder="Adınız ve soyadınız"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        E-posta *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                          placeholder="ornek@email.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefon *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                          placeholder="+90 5XX XXX XX XX"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        TC Kimlik No
                      </label>
                      <input
                        type="text"
                        value={customerInfo.id_number}
                        onChange={(e) => handleCustomerInfoChange('id_number', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="12345678901"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adres
                    </label>
                    <textarea
                      value={customerInfo.address}
                      onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Adres bilginiz"
                    />
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Özel İstekler
                    </label>
                    <textarea
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Diyet kısıtlamaları, erişilebilirlik ihtiyaçları vb."
                    />
                  </div>

                  <div className="flex justify-end mt-8">
                    <button
                      onClick={nextStep}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                    >
                      Devam Et
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Payment Information */}
              {step === 2 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                    <CreditCard className="w-6 h-6" />
                    <span>Ödeme Bilgileri</span>
                  </h2>

                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kart Üzerindeki İsim *
                      </label>
                      <input
                        type="text"
                        value={paymentInfo.card_holder_name}
                        onChange={(e) => handlePaymentInfoChange('card_holder_name', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="JOHN DOE"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kart Numarası *
                      </label>
                      <input
                        type="text"
                        value={paymentInfo.card_number}
                        onChange={(e) => handlePaymentInfoChange('card_number', e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 '))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ay *
                        </label>
                        <select
                          value={paymentInfo.expiry_month}
                          onChange={(e) => handlePaymentInfoChange('expiry_month', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Ay</option>
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                              {String(i + 1).padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Yıl *
                        </label>
                        <select
                          value={paymentInfo.expiry_year}
                          onChange={(e) => handlePaymentInfoChange('expiry_year', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Yıl</option>
                          {Array.from({ length: 10 }, (_, i) => {
                            const year = new Date().getFullYear() + i;
                            return (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV *
                        </label>
                        <input
                          type="text"
                          value={paymentInfo.cvv}
                          onChange={(e) => handlePaymentInfoChange('cvv', e.target.value.replace(/\D/g, ''))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="123"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <p className="text-sm text-blue-800">
                      🔒 Ödeme bilgileriniz SSL sertifikası ile korunmaktadır. 
                      Kart bilgileriniz güvenle işlenir ve saklanmaz.
                    </p>
                  </div>

                  <div className="flex justify-between mt-8">
                    <button
                      onClick={prevStep}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                    >
                      Geri
                    </button>
                    <button
                      onClick={nextStep}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                    >
                      Devam Et
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation */}
              {step === 3 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Rezervasyon Onayı</h2>

                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Katılımcı Bilgileri</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Ad Soyad:</span>
                          <p className="font-medium">{customerInfo.full_name}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">E-posta:</span>
                          <p className="font-medium">{customerInfo.email}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Telefon:</span>
                          <p className="font-medium">{customerInfo.phone}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Katılımcı:</span>
                          <p className="font-medium">{participants} kişi</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Ödeme Bilgileri</h3>
                      <div className="text-sm">
                        <div>
                          <span className="text-gray-600">Kart:</span>
                          <p className="font-medium">
                            **** **** **** {paymentInfo.card_number.slice(-4)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {specialRequests && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Özel İstekler</h3>
                        <p className="text-sm text-gray-700">{specialRequests}</p>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-900">İptal Politikası</span>
                      </div>
                      <p className="text-sm text-blue-800">
                        Tur tarihinden 24 saat öncesine kadar ücretsiz iptal edebilirsiniz.
                        İptal durumunda ödemeniz 3-5 iş günü içinde iade edilecektir.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <button
                      onClick={prevStep}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                    >
                      Geri
                    </button>
                    <button
                      onClick={handleBooking}
                      disabled={bookingLoading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                    >
                      {bookingLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>İşleniyor...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          <span>Ödemeyi Tamamla</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:sticky lg:top-8">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Rezervasyon Özeti</h3>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <img
                    src={tour.images[0] || '/placeholder-tour.jpg'}
                    alt={tour.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm leading-tight">
                      {tour.title}
                    </h4>
                    <div className="flex items-center space-x-1 text-xs text-gray-600 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{tour.location}</span>
                    </div>
                  </div>
                </div>

                {/* Seçilen Tarih ve Kabin */}
                <div className="border-t border-gray-100 pt-3 mt-3 space-y-2">
                  {(formattedSelectedDate || selectedDate) && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-800">
                          Seçilen Tarih: {formattedSelectedDate || 
                            (selectedDate?.start_date ? 
                              new Date(selectedDate.start_date).toLocaleDateString('tr-TR', {
                                year: 'numeric',
                                month: 'long', 
                                day: 'numeric'
                              }) : 
                              (selectedDate?.date ? 
                                new Date(selectedDate.date).toLocaleDateString('tr-TR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                }) : 
                                'Tarih seçilmedi'
                              )
                            )
                          }
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Yeşil kutu - rezervasyon tipi için gizle */}
                  {tour?.reservation_type !== 'reservation' && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm">
                        <Users className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800">
                          {(() => {
                            if (tour?.reservation_type === 'person_based') {
                              // State'den gelen childCount'u kullan
                              const displayChildCount = childCount || selectedDate?.childCount || 0;
                              return `${participants} × Yetişkin${displayChildCount > 0 ? ` + ${displayChildCount} × Çocuk` : ''}`;
                            } else {
                            // cabin_based - Sepetten kabin bilgilerini al (gelişmiş kontrol)
                            try {
                              const cartItems = JSON.parse(localStorage.getItem('tour_cart') || '[]');
                              const cartItem = cartItems.find(item => 
                                item.tourId === tour.id || item.tourId === tourId
                              );
                              
                              // State'den gelen veri kontrolü (öncelik ver)
                              if (singleCabinCount > 0 || doubleCabinCount > 0) {
                                const parts = [];
                                if (singleCabinCount > 0) parts.push(`${singleCabinCount} × Tek Kişilik Kabin`);
                                if (doubleCabinCount > 0) parts.push(`${doubleCabinCount} × Çift Kişilik Kabin`);
                                return parts.join(' + ');
                              }
                              
                              if (cartItem && cartItem.reservation_type === 'cabin_based') {
                                const singleCount = cartItem.singleCabinCount || 0;
                                const doubleCount = cartItem.doubleCabinCount || 0;
                                
                                if (singleCount > 0 || doubleCount > 0) {
                                  const parts = [];
                                  if (singleCount > 0) parts.push(`${singleCount} × Tek Kişilik Kabin`);
                                  if (doubleCount > 0) parts.push(`${doubleCount} × Çift Kişilik Kabin`);
                                  return parts.join(' + ');
                                }
                              }
                            } catch (error) {
                              console.error('Cart item parse error:', error);
                            }
                            
                            // Fallback: eski format
                            return `${participants} × ${cabinType === 'single' ? 'Tek Kişilik Kabin' : 'Çift Kişilik Kabin'}`;
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fiyat detayları tamamen gizlendi */}

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Toplam</span>
                    <span className="text-blue-600">₺{totalPrice}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;