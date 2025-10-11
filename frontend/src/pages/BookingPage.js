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

  // ✅ Sadece mobilde footer'ı gizle (sayfadan çıkınca geri getir)
  useEffect(() => {
    const footer = document.querySelector('footer');
    const mq = window.matchMedia('(max-width: 768px)');

    const apply = () => {
      if (!footer) return;
      footer.style.display = mq.matches ? 'none' : '';
    };

    apply();
    if (mq.addEventListener) {
      mq.addEventListener('change', apply);
    } else {
      // Safari/eski tarayıcılar
      mq.addListener(apply);
    }

    return () => {
      if (footer) footer.style.display = '';
      if (mq.removeEventListener) {
        mq.removeEventListener('change', apply);
      } else {
        mq.removeListener(apply);
      }
    };
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const { state } = location;
    if (state) {
      setTour(state.tour);
      setSelectedDate(state.selectedDate);
      
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

    setLoading(false);
  }, [location.state, user, navigate]);

  // User bilgilerini form data'ya yükle
  useEffect(() => {
    if (user) {
      // full_name field'ından ad/soyad parse et
      let firstName = '';
      let lastName = '';
      
      if (user.full_name) {
        const nameParts = user.full_name.trim().split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      } else {
        // Fallback options
        firstName = user.firstName || user.first_name || user.name?.split(' ')[0] || user.username || user.displayName?.split(' ')[0] || '';
        lastName = user.lastName || user.last_name || user.name?.split(' ').slice(1).join(' ') || user.surname || user.displayName?.split(' ').slice(1).join(' ') || '';
      }
      
      const email = user.email || user.emailAddress || user.mail || '';
      const phone = user.phone || user.phoneNumber || user.mobile || user.tel || user.telephone || '';
      
      console.log('User bilgileri yükleniyor:', { 
        fullName: user.full_name, 
        firstName, 
        lastName, 
        email, 
        phone 
      }); // Debug için
      
      setFormData(prev => ({
        ...prev,
        firstName: firstName,
        lastName: lastName, 
        email: email,
        phone: phone
      }));
    }
  }, [user]);

  const calculateTotalPrice = () => {
    if (location.state?.fromCart && location.state?.cartTotal) {
      return location.state.cartTotal;
    }
    
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

  const calculateTax = () => {
    const totalWithTax = calculateTotalPrice();
    const taxRate = 0.20;
    const subtotal = totalWithTax / (1 + taxRate);
    const taxAmount = totalWithTax - subtotal;
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      taxRate: taxRate * 100,
      total: totalWithTax
    };
  };

  const getReservationSummary = () => {
    if (reservationData.type === 'cabin_based') {
      const parts = [];
      if (reservationData.singleCabinCount > 0) parts.push(`${reservationData.singleCabinCount} × Tek Kişilik Kabin`);
      if (reservationData.doubleCabinCount > 0) parts.push(`${reservationData.doubleCabinCount} × Çift Kişilik Kabin`);
      return parts.join(' + ');
    } else if (reservationData.type === 'person_based') {
      const parts = [];
      if (reservationData.adultCount > 0) parts.push(`${reservationData.adultCount} × Yetişkin`);
      if (reservationData.childCount > 0) parts.push(`${reservationData.childCount} × Çocuk`);
      return parts.join(' + ');
    } else if (reservationData.type === 'reservation') {
      return 'Özel Rezervasyon';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast.error('Lütfen tüm gerekli alanları doldurun');
      return;
    }

    try {
      setLoading(true);

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

      const existingBookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
      const newBooking = {
        id: Date.now().toString(),
        ...bookingData
      };
      existingBookings.push(newBooking);
      localStorage.setItem('user_bookings', JSON.stringify(existingBookings));

      if (location.state?.fromCart) {
        localStorage.removeItem('tour_cart');
        window.dispatchEvent(new Event('storage'));
      }

      navigate('/payment', { state: { booking: newBooking } });
      
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
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

              {/* Masaüstü Submit Butonu */}
              <button
                type="submit"
                disabled={loading}
                className="hidden md:flex w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Ödeme 
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Rezervasyon Özeti */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Rezervasyon Özetiniz</h3>
              <p className=" flex justify-between text-sm text-gray-600 mb-3">
                Bilgilerinizi kontrol edin, ardından ödemeye geçin.
              </p>

              <div className="mb-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-800 mb-3">
                    🎫 Rezervasyon Bileti
                  </div>
                  
                  {location.state?.fromCart && location.state?.cartItems ? (
                    <div className="space-y-2">
                      {location.state.cartItems.map((item, index) => (
                        <div key={index} className="bg-white border border-blue-200 rounded-md p-3">
                          <div className="text-xs font-medium text-gray-800 mb-1">
                            🏷️ {item.title}
                          </div>
                          <div className="text-xs text-gray-600 mb-1">
                            📅 {item.selectedDate?.formattedDate}
                          </div>
                          <div className="text-xs text-gray-700">
                            {item.reservation_type === 'cabin_based' && '🏨 Kabin: '}
                            {item.reservation_type === 'person_based' && '👥 Kişi: '}
                            {item.reservation_typ === 'reservation' && '🚢 Özel: '}
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
                    <div className="bg-white border border-gray-200 rounded-md p-3">
                      <div className="text-xs font-medium text-gray-800 mb-1">
                        🏷️ {tour?.title}
                      </div>
                      <div className="text-xs text-gray-600 mb-1">
                        📅 {selectedDate?.formattedDate}
                      </div>
                      <div className="text-xs text-gray-700">
                        {reservationData.type === 'cabin_based' && '🏨 Kabin: '}
                        {reservationData.type === 'person_based' && '👥 Kişi: '}
                        {reservationData.type === 'reservation' && '🚢 Özel: '}
                        {getReservationSummary()}
                      </div>
                      <div className="text-xs font-medium text-gray-600 mt-1">
                        ₺{calculateTotalPrice().toLocaleString('tr-TR')}
                      </div>
                    </div>
                  )}
                </div>
              </div>

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

      {/* 📱 Mobil Sabit Rezervasyon Butonu */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 md:hidden z-50">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              Ödeme
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BookingPage;
