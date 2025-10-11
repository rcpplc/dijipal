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
    if (!user) {
      navigate('/');
      return;
    }

    if (location.state?.booking) {
      setBooking(location.state.booking);
      setPaymentAmount(location.state.paymentAmount || 0);
    } else {
      // Eğer state yoksa profile'a yönlendir
      navigate('/profile?tab=bookings');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Başarı Mesajı */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ödemeniz Başarıyla Tamamlandı!
          </h1>
          <p className="text-lg text-gray-600">
            Rezervasyonunuz onaylandı ve biletleriniz hazır.
          </p>
        </div>

        {/* 1. Kişi Bilgileri Bölümü */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="bg-blue-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Kişi Bilgileri</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Rezervasyon Durumu */}
              <div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-800">
                        Rezervasyon Durumu: Rezervasyon Onaylandı
                      </h3>
                      <p className="text-green-600 font-mono text-lg">
                        Rezervasyon Kodu: {generateBookingCode()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Müşteri Bilgileri */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Müşteri Bilgileri</h3>
                <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Ad Soyad</p>
                      <p className="font-semibold text-gray-900">
                        {user?.full_name || `${booking.customerInfo?.firstName || 'Recep'} ${booking.customerInfo?.lastName || 'PALİÇ'}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">E-posta</p>
                      <p className="font-semibold text-gray-900">
                        {user?.email || booking.customerInfo?.email || 'admin@example.com'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Telefon</p>
                      <p className="font-semibold text-gray-900">
                        {user?.phone || booking.customerInfo?.phone || '0533 413 53 35'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Rezervasyon Kartları ve Bilet Oluşturma */}
        <div className="space-y-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Biletleriniz</h2>
          
          {/* Bilet Kartı - Her rezervasyon için ayrı kart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Bilet Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex justify-between items-start text-white">
                <div>
                  <h3 className="text-xl font-bold">
                    {booking.tour?.title || 'Mavi Yolculuk Turu'}
                  </h3>
                  <p className="text-blue-100">
                    Bilet No: {generateBookingCode()}-001
                  </p>
                </div>
                <div className="text-right">
                  <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                    <Ship className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bilet İçeriği */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">İşlem Tarihi</p>
                  <p className="font-semibold">{new Date().toLocaleDateString('tr-TR')}</p>
                </div>
                
                <div className="text-center">
                  <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Tur Tarihi</p>
                  <p className="font-semibold">
                    {booking.selectedDate?.formattedDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                
                <div className="text-center">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Biniş Saati</p>
                  <p className="font-semibold">09:00</p>
                </div>
                
                <div className="text-center">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">İniş Saati</p>
                  <p className="font-semibold">18:00</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 bg-gray-50 rounded-lg p-4">
                <div>
                  <p className="text-sm text-gray-600">Tur Süresi</p>
                  <p className="font-semibold">{booking.tour?.duration || '1'} Gün</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Sınıf</p>
                  <p className="font-semibold">
                    {booking.reservationDetails?.type === 'cabin_based' ? 'Kabin' : 'Standart'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Lokasyon</p>
                  <p className="font-semibold">{booking.tour?.location || 'Göcek'}</p>
                </div>
              </div>
              
              {/* Kabin Bilgisi */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">Rezervasyon Detayı</h4>
                <p className="text-blue-800">{getReservationSummary()}</p>
                
                {booking.reservationDetails?.type === 'cabin_based' && (
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    {booking.reservationDetails.singleCabinCount > 0 && (
                      <div>
                        <p className="text-blue-700">Tek Kişilik Kabin</p>
                        <p className="font-semibold text-blue-900">{booking.reservationDetails.singleCabinCount} Adet</p>
                      </div>
                    )}
                    {booking.reservationDetails.doubleCabinCount > 0 && (
                      <div>
                        <p className="text-blue-700">2 Kişilik Kabin</p>
                        <p className="font-semibold text-blue-900">{booking.reservationDetails.doubleCabinCount} Adet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Fiyat ve Aksiyonlar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-sm text-gray-600">Bilet Fiyatı</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₺{paymentAmount.toLocaleString('tr-TR')}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                      <span className="text-xs text-gray-500">QR Kod</span>
                    </div>
                    <p className="text-xs text-gray-600">Bilet Doğrulama</p>
                  </div>
                  
                  <button
                    onClick={() => downloadTicketPDF(generateBookingCode())}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>Bilet PDF İndir</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Ödeme Detayları */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Ödeme Detayları</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="space-y-4">
              <div className="flex justify-between text-lg">
                <span className="text-gray-700">Ara Toplam:</span>
                <span className="font-semibold">₺{priceBreakdown.subtotal.toLocaleString('tr-TR')}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-gray-700">KDV (%20):</span>
                <span className="font-semibold">₺{priceBreakdown.vatAmount.toLocaleString('tr-TR')}</span>
              </div>
              <div className="border-t border-gray-300 pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span className="text-gray-900">Toplam Ödenen:</span>
                  <span className="text-green-600">₺{priceBreakdown.total.toLocaleString('tr-TR')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Bilgilendirme Kutucuğu */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Info className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Teşekkür Ederiz!</h3>
              <div className="space-y-2 text-gray-700">
                <p>• Rezervasyonunuz başarıyla tamamlanmıştır ve onay e-postanız gönderilmiştir.</p>
                <p>• Tur öncesi size WhatsApp üzerinden detaylı bilgilendirme yapılacaktır.</p>
                <p>• Herhangi bir sorunuz için 7/24 müşteri hizmetlerimizle iletişime geçebilirsiniz.</p>
                <p>• <strong>Önemli:</strong> Tur gününde lütfen 30 dakika önce buluşma noktasında hazır olunuz.</p>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>İptal ve Değişiklik:</strong> Rezervasyon iptal ve değişiklik işlemleri için tur tarihinden en az 48 saat önce başvurmanız gerekmektedir.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/profile?tab=bookings"
            className="flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            <User className="w-5 h-5 mr-2" />
            Rezervasyonlarım
          </Link>
          
          <Link
            to="/turlar"
            className="flex items-center justify-center px-8 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
          >
            <Ship className="w-5 h-5 mr-2" />
            Diğer Turlar
          </Link>
          
          <Link
            to="/"
            className="flex items-center justify-center px-8 py-4 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;