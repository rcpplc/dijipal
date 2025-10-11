import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  CheckCircle, 
  Download, 
  Calendar, 
  MapPin, 
  Users,
  ArrowRight,
  Home,
  User,
  Clock,
  Ship,
  FileText,
  Info,
  CreditCard
} from 'lucide-react';

const PaymentSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [booking, setBooking] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  useEffect(() => {
    // Temporarily disabled for testing
    // if (!user) {
    //   navigate('/');
    //   return;
    // }

    if (location.state?.booking) {
      setBooking(location.state.booking);
      setPaymentAmount(location.state.paymentAmount || 0);
    } else {
      // For testing purposes, create mock data with multiple bookings
      const mockBooking = {
        id: 'booking-test-684824',
        tour: {
          title: 'Fethiye – Göcek 3 Gece 4 Gün Kabin Turu',
          duration: '4',
          location: 'Muğla, Göcek'
        },
        selectedDate: {
          formattedDate: '15 Ocak 2025'
        },
        reservationDetails: {
          type: 'cabin_based',
          singleCabinCount: 2,
          doubleCabinCount: 1
        },
        customerInfo: {
          firstName: 'Recep',
          lastName: 'PALİÇ',
          email: 'admin@example.com',
          phone: '0533 413 53 35'
        },
        // Multiple cart items for testing - different reservation types
        cartItems: [
          {
            title: 'Fethiye – Göcek 3 Gece 4 Gün Kabin Turu',
            location: 'Muğla, Göcek',
            duration: '4',
            reservation_type: 'cabin_based',
            singleCabinCount: 1,
            doubleCabinCount: 1,
            selectedDate: {
              formattedDate: '15 Ocak 2025',
              single_cabin_price: 4000,
              double_cabin_price: 6000
            }
          },
          {
            title: 'Bodrum Günübirlik Tekne Turu',
            location: 'Bodrum Marina',
            duration: '1',
            reservation_type: 'person_based',
            adultCount: 2,
            childCount: 1,
            selectedDate: {
              formattedDate: '20 Ocak 2025',
              person_price: 800,
              child_price: 400
            }
          },
          {
            title: 'Kaş Premium Özel Tekne Turu',
            location: 'Kaş',
            duration: '1',
            reservation_type: 'reservation',
            selectedDate: {
              formattedDate: '25 Ocak 2025',
              total_reservation_price: 12000
            }
          }
        ]
      };
      
      setBooking(mockBooking);
      setPaymentAmount(34400); // Total: 10000 + 2000 + 12000 = 24000 + KDV
      
      // Comment out redirect for testing
      // navigate('/profile?tab=bookings');
    }
  }, [location.state, user, navigate]);

  const getReservationSummary = () => {
    if (!booking?.reservationDetails) return 'Rezervasyon detayları';

    const { type } = booking.reservationDetails;
    
    if (type === 'cabin_based') {
      const parts = [];
      if (booking.reservationDetails.singleCabinCount > 0) {
        parts.push(`${booking.reservationDetails.singleCabinCount} × Tek Kişilik Kabin`);
      }
      if (booking.reservationDetails.doubleCabinCount > 0) {
        parts.push(`${booking.reservationDetails.doubleCabinCount} × Çift Kişilik Kabin`);
      }
      return parts.join(' + ');
    } else if (type === 'person_based') {
      const parts = [];
      if (booking.reservationDetails.adultCount > 0) {
        parts.push(`${booking.reservationDetails.adultCount} × Yetişkin`);
      }
      if (booking.reservationDetails.childCount > 0) {
        parts.push(`${booking.reservationDetails.childCount} × Çocuk`);
      }
      return parts.join(' + ');
    } else if (type === 'reservation') {
      return 'Özel Rezervasyon';
    }
    
    return 'Rezervasyon detayları';
  };

  const generateBookingCode = () => {
    return booking?.id ? `TR${booking.id.slice(-6).toUpperCase()}` : 'TR684824';
  };

  // Calculate tax breakdown
  const calculatePriceBreakdown = (totalAmount) => {
    const vatRate = 0.20; // %20 KDV
    const subtotal = totalAmount / (1 + vatRate);
    const vatAmount = totalAmount - subtotal;
    
    return {
      subtotal: Math.round(subtotal),
      vatAmount: Math.round(vatAmount),
      total: totalAmount
    };
  };

  const priceBreakdown = calculatePriceBreakdown(paymentAmount);

  // Generate QR Code data for ticket
  const generateQRData = (ticketId) => {
    return `https://mavibilet.com/ticket/verify/${ticketId}`;
  };

  // Download ticket PDF (placeholder function)
  const downloadTicketPDF = (ticketId) => {
    // TODO: Implement actual PDF generation
    console.log(`Downloading PDF for ticket: ${ticketId}`);
    window.print(); // Temporary solution
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Handle multiple bookings from cart or single booking
  const bookingItems = (() => {
    // If coming from cart with multiple items
    if (booking?.cartItems && Array.isArray(booking.cartItems) && booking.cartItems.length > 0) {
      return booking.cartItems;
    }
    // If location state has cartItems (from cart flow)
    if (location.state?.cartItems && Array.isArray(location.state.cartItems) && location.state.cartItems.length > 0) {
      return location.state.cartItems;
    }
    // Single booking fallback
    if (booking) {
      return [booking];
    }
    // Fallback to mock data for testing
    return [
      {
        title: 'Fethiye – Göcek 3 Gece 4 Gün Kabin Turu',
        location: 'Muğla, Göcek',
        duration: '4',
        reservation_type: 'cabin_based',
        singleCabinCount: 1,
        doubleCabinCount: 1,
        selectedDate: {
          formattedDate: '15 Ocak 2025',
          single_cabin_price: 4000,
          double_cabin_price: 6000
        }
      }
    ];
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Başarı Mesajı */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 bg-green-600 rounded-full"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Ödemeniz Başarıyla Tamamlandı
          </h1>
          <p className="text-gray-600">
            Rezervasyonunuz onaylandı ve biletleriniz hazır.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sol Taraf - Kişi Bilgileri */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Kişi Bilgileri</h2>
              
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-800 mb-1">
                    Rezervasyon Durumu
                  </div>
                  <div className="text-green-900 font-semibold">Rezervasyon Onaylandı</div>
                  <div className="text-green-700 text-sm font-mono mt-1">
                    Rezervasyon Kodu: {generateBookingCode()}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Müşteri Bilgileri</h3>
                  <div className="text-sm space-y-2">
                    <div>
                      <div className="text-gray-600">Ad Soyad:</div>
                      <div className="font-medium">
                        {user?.full_name || `${booking.customerInfo?.firstName || 'Recep'} ${booking.customerInfo?.lastName || 'PALİÇ'}`}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">E-posta:</div>
                      <div className="font-medium">
                        {user?.email || booking.customerInfo?.email || 'admin@example.com'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Telefon:</div>
                      <div className="font-medium">
                        {user?.phone || booking.customerInfo?.phone || '0533 413 53 35'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ödeme Detayları */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ödeme Detayları</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ara Toplam:</span>
                  <span className="font-medium">₺{priceBreakdown.subtotal.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">KDV (%20):</span>
                  <span className="font-medium">₺{priceBreakdown.vatAmount.toLocaleString('tr-TR')}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Toplam Ödenen:</span>
                    <span className="text-green-600">₺{priceBreakdown.total.toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Taraf - Rezervasyon Kartları */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Rezervasyon Biletleri ({bookingItems.length} Bilet)
            </h2>
            
            <div className="space-y-6">
              {bookingItems.map((item, index) => {
                const itemPrice = item ? (() => {
                  if (item.reservation_type === 'cabin_based') {
                    return ((item.selectedDate?.single_cabin_price || 0) * (item.singleCabinCount || 0)) + 
                           ((item.selectedDate?.double_cabin_price || 0) * (item.doubleCabinCount || 0));
                  } else if (item.reservation_type === 'person_based') {
                    return ((item.selectedDate?.person_price || 0) * (item.adultCount || 0)) + 
                           ((item.selectedDate?.child_price || 0) * (item.childCount || 0));
                  } else {
                    return item.selectedDate?.total_reservation_price || 0;
                  }
                })() : paymentAmount;
                
                return (
                  <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    
                    {/* Bilet Header */}
                    <div className="bg-gray-100 border-b border-gray-200 px-6 py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {item?.title || item?.tourTitle || item?.tour?.title || booking?.tour?.title || booking?.tourTitle || 'Mavi Yolculuk Turu'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Bilet No: {generateBookingCode()}-{String(index + 1).padStart(3, '0')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            ₺{itemPrice.toLocaleString('tr-TR')}
                          </div>
                          <div className="text-sm text-gray-600">Bilet Fiyatı</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bilet İçeriği */}
                    <div className="p-6">
                      
                      {/* Temel Bilgiler Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">İşlem Tarihi</div>
                          <div className="font-semibold text-gray-900">
                            {new Date().toLocaleDateString('tr-TR', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric' 
                            })}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Tur Tarihi</div>
                          <div className="font-semibold text-gray-900">
                            {item?.selectedDate?.formattedDate || booking.selectedDate?.formattedDate || 
                             new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR', {
                               day: 'numeric',
                               month: 'long', 
                               year: 'numeric'
                             })}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Tur Başlığı</div>
                          <div className="font-semibold text-gray-900 text-sm">
                            {item?.title || item?.tourTitle || item?.tour?.title || booking?.tour?.title || booking?.tourTitle || 'Mavi Yolculuk Turu'}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Biniş Saati</div>
                          <div className="font-semibold text-gray-900">09:00</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 mb-1">İniş Saati</div>
                          <div className="font-semibold text-gray-900">18:00</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Tur Süresi</div>
                          <div className="font-semibold text-gray-900">
                            {item?.duration || booking.tour?.duration || '1'} Gün
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Sınıf</div>
                          <div className="font-semibold text-gray-900">
                            {(item?.reservation_type || booking.reservationDetails?.type) === 'cabin_based' ? 'Kabin' : 
                             (item?.reservation_type || booking.reservationDetails?.type) === 'person_based' ? 'Standart' : 'Premium'}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Lokasyon</div>
                          <div className="font-semibold text-gray-900">
                            {item?.location || booking.tour?.location || 'Göcek'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Rezervasyon Tipi ve Detayları */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Rezervasyon Detayları</h4>
                        
                        {/* Kabin Bazlı */}
                        {(item?.reservation_type || booking.reservationDetails?.type) === 'cabin_based' && (
                          <div>
                            <div className="text-sm font-medium text-gray-800 mb-2">Kabin Bazlı</div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              {(item?.singleCabinCount || booking.reservationDetails?.singleCabinCount || 0) > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-700">Tek Kişilik Kabin:</span>
                                  <span className="font-medium">
                                    {item?.singleCabinCount || booking.reservationDetails?.singleCabinCount} × 
                                    ₺{(item?.selectedDate?.single_cabin_price || 0).toLocaleString('tr-TR')}
                                  </span>
                                </div>
                              )}
                              {(item?.doubleCabinCount || booking.reservationDetails?.doubleCabinCount || 0) > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-700">Çift Kişilik Kabin:</span>
                                  <span className="font-medium">
                                    {item?.doubleCabinCount || booking.reservationDetails?.doubleCabinCount} × 
                                    ₺{(item?.selectedDate?.double_cabin_price || 0).toLocaleString('tr-TR')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Kişi Bazlı */}
                        {(item?.reservation_type || booking.reservationDetails?.type) === 'person_based' && (
                          <div>
                            <div className="text-sm font-medium text-gray-800 mb-2">Kişi Bazlı</div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              {(item?.adultCount || booking.reservationDetails?.adultCount || 0) > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-700">Yetişkin:</span>
                                  <span className="font-medium">
                                    {item?.adultCount || booking.reservationDetails?.adultCount} × 
                                    ₺{(item?.selectedDate?.person_price || 0).toLocaleString('tr-TR')}
                                  </span>
                                </div>
                              )}
                              {(item?.childCount || booking.reservationDetails?.childCount || 0) > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-700">Çocuk:</span>
                                  <span className="font-medium">
                                    {item?.childCount || booking.reservationDetails?.childCount} × 
                                    ₺{(item?.selectedDate?.child_price || 0).toLocaleString('tr-TR')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Rezervasyon (Tüm Tekne) */}
                        {(item?.reservation_type || booking.reservationDetails?.type) === 'reservation' && (
                          <div>
                            <div className="text-sm font-medium text-gray-800 mb-2">Rezervasyon</div>
                            <div className="text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-700">Tüm Tekne / Sabit Fiyat:</span>
                                <span className="font-medium">
                                  ₺{(item?.selectedDate?.total_reservation_price || itemPrice).toLocaleString('tr-TR')}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* QR ve PDF İndirme */}
                      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-gray-200 rounded-lg flex flex-col items-center justify-center mb-2">
                            <div className="w-12 h-12 bg-gray-300 rounded"></div>
                          </div>
                          <p className="text-xs text-gray-600">QR Kod</p>
                          <p className="text-xs text-gray-500">Bilet Doğrulama</p>
                        </div>
                        
                        <div className="text-right">
                          <button
                            onClick={() => downloadTicketPDF(`${generateBookingCode()}-${index + 1}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                          >
                            Bilet PDF İndir
                          </button>
                          <p className="text-xs text-gray-600 mt-1">
                            Bilet #{generateBookingCode()}-{String(index + 1).padStart(3, '0')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bilgilendirme */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Önemli Bilgiler</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>• Rezervasyonunuz onaylandı ve e-posta gönderildi</p>
                <p>• Tur öncesi WhatsApp ile bilgilendirme yapılacak</p>
                <p>• Tur gününde 30 dakika önce buluşma noktasında olun</p>
                <p>• İptal/değişiklik için 48 saat önceden başvurun</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alt Butonlar */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/profile?tab=bookings"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors text-center"
          >
            Rezervasyonlarım
          </Link>
          
          <Link
            to="/turlar"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors text-center"
          >
            Diğer Turlar
          </Link>
          
          <Link
            to="/"
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors text-center"
          >
            Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;