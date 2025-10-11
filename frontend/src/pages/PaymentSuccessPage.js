import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';
import jsPDF from 'jspdf';
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

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PaymentSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [booking, setBooking] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const fetchTourData = async (tourId) => {
    try {
      console.log('🔍 Fetching fresh tour data for ID:', tourId);
      const response = await axios.get(`${API}/tours/${tourId}`);
      console.log('📦 Fresh tour data received:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching tour data:', error);
      return null;
    }
  };

  useEffect(() => {
    const initializeBookingData = async () => {
      // Check for test data in URL params for testing purposes
      const urlParams = new URLSearchParams(window.location.search);
      const isTestMode = urlParams.get('test') === 'pdf';
      
      if (isTestMode) {
        console.log('🧪 TEST MODE: Using mock data for PDF testing');
        const mockBookingData = {
          id: 'TR456770-001',
          tourId: 'test-tour-456',
          tour: {
            title: 'Fethiye – Göcek Premium Kabin Turu',
            location: 'Muğla, Fethiye',
            pickup_time: '12:00',
            dropoff_time: '21:00',
            duration: 5,
            duration_unit: 'hours',
            classification: 'delux'
          },
          selectedDate: {
            formattedDate: '13 Ekim 2025',
            single_cabin_price: 1400,
            double_cabin_price: 2100,
            start_date: '2025-10-13'
          },
          reservationDetails: {
            type: 'cabin_based',
            singleCabinCount: 1,
            doubleCabinCount: 0
          },
          customerInfo: {
            firstName: 'Ahmet',
            lastName: 'Yılmaz',
            email: 'ahmet@example.com',
            phone: '0533 123 45 67'
          }
        };
        
        setBooking(mockBookingData);
        setPaymentAmount(1400);
        return;
      }
      
      if (location.state?.booking) {
        const bookingWithCart = {
          ...location.state.booking,
          cartItems: location.state.cartItems,
          fromCart: location.state.fromCart
        };
        
        // Fetch fresh tour data if we have tourId
        if (bookingWithCart.tourId || bookingWithCart.tour_id) {
          const tourId = bookingWithCart.tourId || bookingWithCart.tour_id;
          const freshTourData = await fetchTourData(tourId);
          
          if (freshTourData) {
            // Update booking with fresh tour data
            bookingWithCart.tour = freshTourData;
            console.log('✅ Updated booking with fresh tour data');
          }
        }
        
        setBooking(bookingWithCart);
        setPaymentAmount(location.state.paymentAmount || 0);
      } else {
        // No booking data found - redirect to home
        console.error('❌ PaymentSuccessPage: No booking data found');
        navigate('/');
        return;
      }
    };

    initializeBookingData();
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

  // Generate clean, properly formatted PDF ticket
  const downloadTicketPDF = (ticketId, itemIndex = 0) => {
    try {
      console.log(`🎫 Generating PDF for ticket: ${ticketId}`);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      
      // Get ticket and customer data
      const ticketItem = bookingItems[itemIndex] || bookingItems[0];
      const tour = booking?.tour || ticketItem?.tour || {};
      const selectedDate = ticketItem?.selectedDate || {};
      const customerInfo = booking?.customerInfo || user || {};
      
      // Calculate pricing
      const itemPrice = calculateItemPrice(ticketItem);
      
      // Colors (Simple black and white)
      const blackColor = [0, 0, 0];
      const lightGrayColor = [230, 230, 230];
      const darkGrayColor = [100, 100, 100];
      
      // Clear background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Main border
      pdf.setDrawColor(...blackColor);
      pdf.setLineWidth(1.2);
      pdf.rect(15, 20, pageWidth - 30, pageHeight - 50);
      
      let currentY = 35;
      
      // Header
      pdf.setTextColor(...blackColor);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(24);
      pdf.text('REZERVASYON BILETI', pageWidth/2, currentY, { align: 'center' });
      
      currentY += 20;
      
      // Date and time in top right
      const tourDate = selectedDate.formattedDate || '13 Ekim 2025';
      const pickupTime = tour.pickup_time || '12:00';
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text(tourDate.toUpperCase(), pageWidth - 20, currentY, { align: 'right' });
      pdf.setFontSize(20);
      pdf.text(pickupTime, pageWidth - 20, currentY + 8, { align: 'right' });
      
      // Location on left
      const location = tour.location || 'FETHIYE';
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(22);
      pdf.text(location.toUpperCase(), 20, currentY + 8);
      
      currentY += 30;
      
      // Separator line
      pdf.setDrawColor(...darkGrayColor);
      pdf.setLineWidth(0.5);
      pdf.line(20, currentY, pageWidth - 20, currentY);
      
      currentY += 15;
      
      // Customer Info Section
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('MUSTERI BILGILERI', 20, currentY);
      
      currentY += 10;
      
      // Customer details
      const customerName = `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim() || 
                          customerInfo.full_name || 'Recep PALIC';
      const customerEmail = customerInfo.email || 'admin@example.com';
      const customerPhone = customerInfo.phone || '05334135335';
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text('Ad Soyad:', 20, currentY);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(customerName, 20, currentY + 5);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text('E-posta:', 20, currentY + 15);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text(customerEmail, 20, currentY + 20);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text('Telefon:', 20, currentY + 30);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text(customerPhone, 20, currentY + 35);
      
      // Right side - Ticket info
      const rightX = pageWidth/2 + 5;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text('Bilet No:', rightX, currentY);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text(ticketId, rightX, currentY + 5);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text('Bilet Fiyati:', rightX, currentY + 18);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      const priceText = `TL${itemPrice.toLocaleString('tr-TR')}`;
      pdf.text(priceText, rightX, currentY + 26);
      
      const currentDate = new Date().toLocaleDateString('tr-TR');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text('Islem Tarihi:', rightX, currentY + 38);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text(currentDate, rightX, currentY + 43);
      
      currentY += 55;
      
      // Separator line
      pdf.line(20, currentY, pageWidth - 20, currentY);
      
      currentY += 12;
      
      // Tour title
      const tourTitle = tour.title || 'Kisi bazli Kisi bazli Kisi bazli Kisi bazli Kisi bazli';
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text('Tur Basligi:', 20, currentY);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      
      // Split long title properly
      const maxTitleWidth = pageWidth - 50;
      const titleLines = pdf.splitTextToSize(tourTitle, maxTitleWidth);
      let titleY = currentY + 5;
      titleLines.forEach(line => {
        pdf.text(line, 20, titleY);
        titleY += 5;
      });
      
      currentY = titleY + 10;
      
      // Tour details in clean format
      const tourDetails = [
        { label: 'Binis Saati:', value: tour.pickup_time || '12:00' },
        { label: 'Inis Saati:', value: tour.dropoff_time || '21:00' },
        { label: 'Tur Suresi:', value: (() => {
          if (tour.duration_unit === 'hours') return `${tour.duration || 5} Saat`;
          if (tour.duration_unit === 'days') return `${tour.duration || 1} Gun`;
          return `${tour.duration || 5} Saat`;
        })() },
        { label: 'Sinif:', value: tour.classification ? 
          tour.classification.charAt(0).toUpperCase() + tour.classification.slice(1) : 'Standart' },
        { label: 'Lokasyon:', value: tour.location || 'Fethiye' }
      ];
      
      tourDetails.forEach((detail, index) => {
        const x = index % 2 === 0 ? 20 : rightX;
        const y = currentY + Math.floor(index / 2) * 15;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(detail.label, x, y);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text(detail.value, x, y + 5);
      });
      
      currentY += Math.ceil(tourDetails.length / 2) * 15 + 10;
      
      // Separator line
      pdf.line(20, currentY, pageWidth - 20, currentY);
      
      currentY += 12;
      
      // Reservation details
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Rezervasyon Detaylari', 20, currentY);
      
      currentY += 8;
      
      const reservationType = ticketItem?.reservation_type || booking?.reservationDetails?.type || 'person_based';
      
      if (reservationType === 'person_based') {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('Kisi Bazli', 20, currentY);
        currentY += 8;
        
        const adultCount = ticketItem?.adultCount || booking?.reservationDetails?.adultCount || 3;
        const childCount = ticketItem?.childCount || booking?.reservationDetails?.childCount || 2;
        const adultPrice = selectedDate.person_price || 300;
        const childPrice = selectedDate.child_price || 250;
        
        if (adultCount > 0) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.text('Yetiskin:', 25, currentY);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.text(`${adultCount} x TL${adultPrice.toLocaleString('tr-TR')}`, 65, currentY);
          currentY += 8;
        }
        
        if (childCount > 0) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.text('Cocuk:', 25, currentY);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.text(`${childCount} x TL${childPrice.toLocaleString('tr-TR')}`, 65, currentY);
          currentY += 8;
        }
      }
      
      // Footer
      const footerY = pageHeight - 25;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...darkGrayColor);
      pdf.text('MaviBilet - Deneyimli Yolculuklar', 20, footerY);
      pdf.text('info@mavibilet.com | www.mavibilet.com', pageWidth - 20, footerY, { align: 'right' });
      
      // Save PDF
      const fileName = `MaviBilet_${ticketId}.pdf`;
      pdf.save(fileName);
      
      console.log(`✅ PDF generated successfully: ${fileName}`);
      
    } catch (error) {
      console.error('❌ PDF generation error:', error);
      // Fallback to print
      window.print();
    }
  };

  // Calculate individual item price (same logic as CartPage)
  const calculateItemPrice = (item) => {
    if (!item.selectedDate) return 0;

    if (item.reservation_type === 'cabin_based') {
      const singleTotal = (item.selectedDate.single_cabin_price || 0) * (item.singleCabinCount || 0);
      const doubleTotal = (item.selectedDate.double_cabin_price || 0) * (item.doubleCabinCount || 0);
      return singleTotal + doubleTotal;
    } else if (item.reservation_type === 'person_based') {
      const adultTotal = (item.selectedDate.person_price || 0) * (item.adultCount || 0);
      const childTotal = (item.selectedDate.child_price || 0) * (item.childCount || 0);
      return adultTotal + childTotal;
    } else if (item.reservation_type === 'reservation') {
      return item.selectedDate.total_reservation_price || 0;
    }
    
    return 0;
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Handle multiple bookings - EXACT same logic as BookingPage
  const bookingItems = (() => {
    
    // SEPETTEN GELME DURUMU: Çoklu tur rezervasyonu
    if (location.state?.fromCart && location.state?.cartItems && Array.isArray(location.state.cartItems)) {
      return location.state.cartItems;
    }
    
    // DETAY SAYFASINDAN GELME DURUMU: Tek tur rezervasyonu  
    if (booking && booking.tour) {
      // Tek booking'i cartItems formatına çevir
      return [{
        id: booking.id || 'single-booking',
        tourId: booking.tourId,
        title: booking.tour.title,
        location: booking.tour.location,
        duration: booking.tour.duration,
        reservation_type: booking.reservationType || booking.tour.reservation_type,
        selectedDate: booking.selectedDate,
        // Reservation details'i item formatına çevir
        ...(booking.reservationDetails?.type === 'cabin_based' && {
          singleCabinCount: booking.reservationDetails.singleCabinCount || 0,
          doubleCabinCount: booking.reservationDetails.doubleCabinCount || 0
        }),
        ...(booking.reservationDetails?.type === 'person_based' && {
          adultCount: booking.reservationDetails.adultCount || 0,
          childCount: booking.reservationDetails.childCount || 0
        })
      }];
    }
    
    // Veri bulunamadı
    return [];
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

        {/* Vertical Layout - Alt Alta Dizilim */}
        <div className="space-y-8">
          
          {/* Kişi Bilgileri - Geniş */}
          <div className="w-full">
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

          {/* Rezervasyon Biletleri - Geniş */}
          <div className="w-full">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Rezervasyon Biletleri ({bookingItems.length} Bilet)
            </h2>
            
            <div className="space-y-6">
              {bookingItems.map((item, index) => {
                const itemPrice = item ? calculateItemPrice(item) : Math.floor(paymentAmount / bookingItems.length);
                
                return (
                  <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    
                    {/* Bilet Header */}
                    <div className="bg-gray-100 border-b border-gray-200 px-6 py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2, 
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {(() => {
                              // Priority: Fresh tour data > item data > booking fallback
                              const title = booking?.tour?.title || 
                                          item?.title || 
                                          item?.tourTitle || 
                                          item?.tour?.title || 
                                          booking?.tourTitle || 
                                          'Mavi Yolculuk Turu';
                              
                              // Truncate very long titles for header
                              return title.length > 80 ? `${title.substring(0, 80)}...` : title;
                            })()}
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
                            {(() => {
                              // Try different date sources
                              const date = item?.selectedDate?.formattedDate || 
                                          booking.selectedDate?.formattedDate ||
                                          item?.selectedDate?.date ||
                                          booking.selectedDate?.date ||
                                          item?.tour_date ||
                                          booking.tour_date;
                              
                              if (date) {
                                // If it's already formatted, use it
                                if (typeof date === 'string' && date.includes(' ')) {
                                  return date;
                                }
                                
                                // Otherwise format it
                                const dateObj = new Date(date);
                                if (!isNaN(dateObj.getTime())) {
                                  return dateObj.toLocaleDateString('tr-TR', {
                                    day: 'numeric',
                                    month: 'long', 
                                    year: 'numeric'
                                  });
                                }
                              }
                              
                              // Default fallback
                              return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'long', 
                                year: 'numeric'
                              });
                            })()}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Tur Başlığı</div>
                          <div className="font-semibold text-gray-900 text-sm" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {(() => {
                              // Priority: Fresh tour data > item data > booking fallback
                              const title = booking?.tour?.title || 
                                          item?.title || 
                                          item?.tourTitle || 
                                          item?.tour?.title || 
                                          booking?.tourTitle || 
                                          'Mavi Yolculuk Turu';
                              
                              // Truncate very long titles
                              return title.length > 100 ? `${title.substring(0, 100)}...` : title;
                            })()}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Biniş Saati</div>
                          <div className="font-semibold text-gray-900">
                            {booking?.tour?.pickup_time || item?.pickup_time || '09:00'}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 mb-1">İniş Saati</div>
                          <div className="font-semibold text-gray-900">
                            {booking?.tour?.dropoff_time || item?.dropoff_time || '18:00'}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Tur Süresi</div>
                          <div className="font-semibold text-gray-900">
                            {(() => {
                              // Use fresh tour data primarily
                              const tour = booking?.tour || item?.tour || item || {};
                              
                              console.log('🔍 Tour duration debug:', {
                                duration: tour.duration,
                                duration_days: tour.duration_days, 
                                duration_hours: tour.duration_hours,
                                duration_unit: tour.duration_unit
                              });
                              
                              // First try duration + duration_unit (admin panel format)
                              if (tour.duration && tour.duration_unit) {
                                if (tour.duration_unit === 'hours') return `${tour.duration} Saat`;
                                if (tour.duration_unit === 'days') return `${tour.duration} Gün`;
                              }
                              
                              // Then try duration_days + duration_unit
                              if (tour.duration_days && tour.duration_unit) {
                                if (tour.duration_unit === 'hours') return `${tour.duration_days} Saat`;
                                if (tour.duration_unit === 'days') return `${tour.duration_days} Gün`;
                              }
                              
                              // Try duration_hours specifically
                              if (tour.duration_hours && tour.duration_hours > 0) {
                                return `${tour.duration_hours} Saat`;
                              }
                              
                              // Fallback to duration_days
                              const fallbackDays = tour.duration_days || tour.duration || 1;
                              return tour.duration_days ? `${fallbackDays} Gün` : `${fallbackDays} Saat`;
                            })()}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Sınıf</div>
                          <div className="font-semibold text-gray-900">
                            {(() => {
                              // Use fresh tour data primarily
                              const tour = booking?.tour || item?.tour || item || {};
                              const classification = tour.classification;
                              
                              console.log('🔍 Classification debug:', classification);
                              
                              if (!classification || classification === 'standart') return 'Standart';
                              
                              // Capitalize first letter (delux -> Delux)
                              return classification.charAt(0).toUpperCase() + classification.slice(1);
                            })()}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Lokasyon</div>
                          <div className="font-semibold text-gray-900">
                            {item?.location || booking.tour?.location || 'Belirtilmemiş'}
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
                                    ₺{(item?.selectedDate?.single_cabin_price || item?.singleCabinPrice || 4000).toLocaleString('tr-TR')}
                                  </span>
                                </div>
                              )}
                              {(item?.doubleCabinCount || booking.reservationDetails?.doubleCabinCount || 0) > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-700">Çift Kişilik Kabin:</span>
                                  <span className="font-medium">
                                    {item?.doubleCabinCount || booking.reservationDetails?.doubleCabinCount} × 
                                    ₺{(item?.selectedDate?.double_cabin_price || item?.doubleCabinPrice || 6000).toLocaleString('tr-TR')}
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
                                    ₺{(item?.selectedDate?.person_price || item?.personPrice || item?.adultPrice || 800).toLocaleString('tr-TR')}
                                  </span>
                                </div>
                              )}
                              {(item?.childCount || booking.reservationDetails?.childCount || 0) > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-700">Çocuk:</span>
                                  <span className="font-medium">
                                    {item?.childCount || booking.reservationDetails?.childCount} × 
                                    ₺{(item?.selectedDate?.child_price || item?.childPrice || 400).toLocaleString('tr-TR')}
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
                                  ₺{(item?.selectedDate?.total_reservation_price || item?.reservationPrice || itemPrice).toLocaleString('tr-TR')}
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
                            onClick={() => downloadTicketPDF(`${generateBookingCode()}-${String(index + 1).padStart(3, '0')}`, index)}
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