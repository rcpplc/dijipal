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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Başarı Mesajı */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ödemeniz Başarıyla Tamamlandı!
          </h1>
          <p className="text-lg text-gray-600">
            Rezervasyonunuz onaylandı ve biletiniz hazırlanıyor.
          </p>
        </div>

        {/* Rezervasyon Detayları */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          {/* Header */}
          <div className="bg-green-50 border-b border-green-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-green-800">
                  Rezervasyon Onaylandı
                </h2>
                <p className="text-sm text-green-600">
                  Rezervasyon Kodu: <span className="font-mono font-bold">{generateBookingCode()}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-800">
                  ₺{paymentAmount.toLocaleString('tr-TR')}
                </p>
                <p className="text-sm text-green-600">Ödendi</p>
              </div>
            </div>
          </div>

          {/* Tur Bilgileri */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tur Bilgileri</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {booking.selectedDate?.formattedDate || 'Tarih belirtilmemiş'}
                      </p>
                      <p className="text-sm text-gray-600">Tur Tarihi</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {booking.tour?.location || 'Konum belirtilmemiş'}
                      </p>
                      <p className="text-sm text-gray-600">Başlangıç Noktası</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Users className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {getReservationSummary()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {booking.reservationDetails?.type === 'cabin_based' && '🏨 Kabin Bazlı'}
                        {booking.reservationDetails?.type === 'person_based' && '👥 Kişi Bazlı'}
                        {booking.reservationDetails?.type === 'reservation' && '🚢 Özel Rezervasyon'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Müşteri Bilgileri</h3>
                <div className="space-y-2">
                  <p className="text-gray-900">
                    <span className="font-medium">Ad Soyad:</span> {booking.customerInfo?.firstName} {booking.customerInfo?.lastName}
                  </p>
                  <p className="text-gray-900">
                    <span className="font-medium">E-posta:</span> {booking.customerInfo?.email}
                  </p>
                  <p className="text-gray-900">
                    <span className="font-medium">Telefon:</span> {booking.customerInfo?.phone}
                  </p>
                  {booking.customerInfo?.notes && (
                    <p className="text-gray-900">
                      <span className="font-medium">Notlar:</span> {booking.customerInfo.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ödeme Detayları */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ödeme Detayları</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Ara Toplam:</span>
              <span className="font-medium">₺{booking.tax?.subtotal?.toLocaleString('tr-TR') || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">KDV (%20):</span>
              <span className="font-medium">₺{booking.tax?.taxAmount?.toLocaleString('tr-TR') || '0'}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>Toplam Ödenen:</span>
              <span className="text-green-600">₺{paymentAmount.toLocaleString('tr-TR')}</span>
            </div>
          </div>
        </div>

        {/* Sonraki Adımlar */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Sonraki Adımlar</h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                1
              </div>
              <p className="text-blue-800">E-posta adresinize rezervasyon onayı gönderilecek</p>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                2
              </div>
              <p className="text-blue-800">Tur öncesi detaylı bilgi mesajı alacaksınız</p>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                3
              </div>
              <p className="text-blue-800">Tur gününde buluşma noktasında olmanız yeterli</p>
            </div>
          </div>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Rezervasyon Detayını İndir
          </button>
          
          <Link
            to="/profile?tab=bookings"
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <User className="w-5 h-5 mr-2" />
            Rezervasyonlarım
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          
          <Link
            to="/"
            className="flex items-center justify-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
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