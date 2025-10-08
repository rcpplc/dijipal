import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  CreditCard,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const BookingPage = () => {
  const { tourId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // YENİ REZERVASYON SİSTEMİ - SIFIRDAN YAZILDI
  const [tour, setTour] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [reservationData, setReservationData] = useState({});
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    // State'den gelen veriler
    const { state } = location;
    if (state) {
      setTour(state.tour);
      setSelectedDate(state.selectedDate);
      
      // Rezervasyon tipine göre veriyi ayarla
      if (state.tour?.reservation_type === 'cabin_based') {
        setReservationData({
          type: 'cabin_based',
          singleCabinCount: state.singleCabinCount || 0,
          doubleCabinCount: state.doubleCabinCount || 0
        });
      } else if (state.tour?.reservation_type === 'person_based') {
        setReservationData({
          type: 'person_based',
          adultCount: state.adultCount || 1,
          childCount: state.childCount || 0
        });
      } else if (state.tour?.reservation_type === 'reservation') {
        setReservationData({
          type: 'reservation'
        });
      }
    }

    // User bilgilerini form'a doldur
    if (user) {
      console.log('👤 User data for auto-fill:', user);
      console.log('👤 User keys:', Object.keys(user));
      console.log('👤 Testing fields:', {
        firstName: user.firstName,
        first_name: user.first_name,
        name: user.name,
        email: user.email,
        phone: user.phone
      });
      
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || user.first_name || user.name?.split(' ')[0] || user.username || '',
        lastName: user.lastName || user.last_name || user.name?.split(' ')[1] || user.surname || '',
        email: user.email || user.emailAddress || '',
        phone: user.phone || user.phoneNumber || user.mobile || user.tel || ''
      }));
    }

    setLoading(false);
  }, [location.state, user, navigate]);

  // User değişikliklerini izle ve form'u güncelle
  useEffect(() => {
    if (user) {
      console.log('🔄 User changed, updating form with:', user);
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || user.first_name || user.name?.split(' ')[0] || user.username || '',
        lastName: user.lastName || user.last_name || user.name?.split(' ')[1] || user.surname || '',
        email: user.email || user.emailAddress || '',
        phone: user.phone || user.phoneNumber || user.mobile || user.tel || ''
      }));
    }
  }, [user]);

  // Fiyat hesaplama
  const calculateTotalPrice = () => {
    // SEPETTEN GELİNDİYSE SEPET TOPLAMINI KULLAN
    if (location.state?.fromCart && location.state?.cartTotal) {
      return location.state.cartTotal;
    }
    
    // DOĞRUDAN ÜRÜN SAYFASINDAN GELİNDİYSE HESAPLA
    if (!selectedDate || !reservationData.type) return 0;

    if (reservationData.type === 'cabin_based') {
      const singleTotal = (selectedDate.single_cabin_price || 0) * (reservationData.singleCabinCount || 0);
      const doubleTotal = (selectedDate.double_cabin_price || 0) * (reservationData.doubleCabinCount || 0);
      return singleTotal + doubleTotal;
    } else if (reservationData.type === 'person_based') {
      const adultTotal = (selectedDate.person_price || 0) * (reservationData.adultCount || 0);
      const childTotal = (selectedDate.child_price || 0) * (reservationData.childCount || 0);
      return adultTotal + childTotal;
    } else if (reservationData.type === 'reservation') {
      return selectedDate.total_reservation_price || 0;
    }

    return 0;
  };

  // KDV hesaplama - Fiyatlar KDV DAHİL
  const calculateTax = () => {
    const totalWithTax = calculateTotalPrice(); // Bu zaten KDV dahil
    const taxRate = 0.20; // %20 KDV
    const subtotal = totalWithTax / (1 + taxRate); // KDV hariç tutar
    const taxAmount = totalWithTax - subtotal; // KDV tutarı
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      taxRate: taxRate * 100,
      total: totalWithTax
    };
  };

  // Rezervasyon özeti metni
  const getReservationSummary = () => {
    if (reservationData.type === 'cabin_based') {
      const parts = [];
      if (reservationData.singleCabinCount > 0) {
        parts.push(`${reservationData.singleCabinCount} × Tek Kişilik Kabin`);
      }
      if (reservationData.doubleCabinCount > 0) {
        parts.push(`${reservationData.doubleCabinCount} × Çift Kişilik Kabin`);
      }
      return parts.join(' + ');
    } else if (reservationData.type === 'person_based') {
      const parts = [];
      if (reservationData.adultCount > 0) {
        parts.push(`${reservationData.adultCount} × Yetişkin`);
      }
      if (reservationData.childCount > 0) {
        parts.push(`${reservationData.childCount} × Çocuk`);
      }
      return parts.join(' + ');
    } else if (reservationData.type === 'reservation') {
      return 'Özel Rezervasyon';
    }
    
    return '';
  };

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast.error('Lütfen tüm gerekli alanları doldurun');
      return;
    }

    try {
      setLoading(true);

      // Rezervasyon verisi hazırla
      const bookingData = {
        tourId: tour.id,
        userId: user.id,
        selectedDate: selectedDate,
        reservationType: reservationData.type,
        reservationDetails: reservationData,
        customerInfo: formData,
        totalPrice: calculateTotalPrice(),
        tax: calculateTax(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // API'ye gönder (şimdilik localStorage'a kaydet)
      const existingBookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
      const newBooking = {
        id: Date.now().toString(),
        ...bookingData
      };
      existingBookings.push(newBooking);
      localStorage.setItem('user_bookings', JSON.stringify(existingBookings));

      // Sepeti temizle (eğer sepetten gelmişse)
      if (location.state?.fromCart) {
        localStorage.removeItem('tour_cart');
        window.dispatchEvent(new Event('storage'));
      }

      toast.success('Rezervasyonunuz başarıyla oluşturuldu!');
      
      // Ödeme sayfasına yönlendir
      navigate('/payment', {
        state: {
          booking: newBooking
        }
      });
      
    } catch (error) {
      console.error('Rezervasyon hatası:', error);
      toast.error('Rezervasyon oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!tour || !selectedDate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Rezervasyon Bulunamadı</h2>
          <p className="text-gray-600 mb-4">Lütfen tekrar tur seçimi yapın.</p>
          <button
            onClick={() => navigate('/turlar')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Turları Görüntüle
          </button>
        </div>
      </div>
    );
  }

  const taxInfo = calculateTax();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Geri
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Rezervasyon Tamamla</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Alanı */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Kişisel Bilgiler */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Kişisel Bilgiler</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ad *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Soyad *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-posta *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Özel Notlar
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Özel istekleriniz varsa buraya yazabilirsiniz..."
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Rezervasyonu Tamamla
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Rezervasyon Özeti */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rezervasyon Özeti</h3>
              
              {/* Tur Bilgileri */}
              <div className="mb-6">
                <div className="flex items-start space-x-3 mb-4">
                  <img
                    src={tour.images?.[0] || '/placeholder-tour.jpg'}
                    alt={tour.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm leading-tight mb-1">
                      {tour.title}
                    </h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {tour.location}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {selectedDate?.formattedDate || new Date(selectedDate.date).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Rezervasyon Detayları - Ticket Format */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-800 mb-3">
                    🎫 Rezervasyon Bileti
                  </div>
                  
                  {/* SEPETTEN GELDİYSE TÜM ÖĞELERİ GÖSTER */}
                  {location.state?.fromCart && location.state?.cartItems ? (
                    <div className="space-y-2">
                      {location.state.cartItems.map((item, index) => (
                        <div key={index} className="bg-white border border-green-200 rounded-md p-3">
                          <div className="text-xs font-medium text-gray-800 mb-1">
                            🏷️ {item.title}
                          </div>
                          <div className="text-xs text-gray-600 mb-1">
                            📅 {item.selectedDate?.formattedDate}
                          </div>
                          <div className="text-xs text-green-700">
                            {item.reservation_type === 'cabin_based' && '🏨 Kabin: '}
                            {item.reservation_type === 'person_based' && '👥 Kişi: '}
                            {item.reservation_type === 'reservation' && '🚢 Özel: '}
                            {item.reservation_type === 'cabin_based' && 
                              `${item.singleCabinCount || 0} Tek + ${item.doubleCabinCount || 0} Çift`}
                            {item.reservation_type === 'person_based' && 
                              `${item.adultCount || 0} Yetişkin + ${item.childCount || 0} Çocuk`}
                            {item.reservation_type === 'reservation' && 'Rezervasyon'}
                          </div>
                          <div className="text-xs font-medium text-blue-600 mt-1">
                            ₺{(() => {
                              if (item.reservation_type === 'cabin_based') {
                                return ((item.selectedDate?.single_cabin_price || 0) * (item.singleCabinCount || 0)) + 
                                       ((item.selectedDate?.double_cabin_price || 0) * (item.doubleCabinCount || 0));
                              } else if (item.reservation_type === 'person_based') {
                                return ((item.selectedDate?.person_price || 0) * (item.adultCount || 0)) + 
                                       ((item.selectedDate?.child_price || 0) * (item.childCount || 0));
                              } else {
                                return item.selectedDate?.total_reservation_price || 0;
                              }
                            })().toLocaleString('tr-TR')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* TEK ÜRÜN İÇİN ESKİ FORMAT */
                    <div className="bg-white border border-green-200 rounded-md p-3">
                      <div className="text-xs font-medium text-gray-800 mb-1">
                        🏷️ {tour?.title}
                      </div>
                      <div className="text-xs text-gray-600 mb-1">
                        📅 {selectedDate?.formattedDate}
                      </div>
                      <div className="text-xs text-green-700">
                        {reservationData.type === 'cabin_based' && '🏨 Kabin: '}
                        {reservationData.type === 'person_based' && '👥 Kişi: '}
                        {reservationData.type === 'reservation' && '🚢 Özel: '}
                        {getReservationSummary()}
                      </div>
                      <div className="text-xs font-medium text-blue-600 mt-1">
                        ₺{calculateTotalPrice().toLocaleString('tr-TR')}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fiyat Detayları */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ara Toplam:</span>
                  <span className="font-medium">₺{taxInfo.subtotal.toLocaleString('tr-TR')}</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>KDV Hariç Tutar:</span>
                    <span>₺{taxInfo.subtotal.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>KDV Oranı:</span>
                    <span>%{taxInfo.taxRate}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-3">
                    <span>KDV Tutarı:</span>
                    <span>₺{taxInfo.taxAmount.toLocaleString('tr-TR')}</span>
                  </div>
                  
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Toplam:</span>
                    <span className="text-blue-600">₺{taxInfo.total.toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 text-center">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Güvenli rezervasyon sistemi
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;