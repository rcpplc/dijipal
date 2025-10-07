import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  MapPin, 
  Calendar,
  Users,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { createSlug } from '../utils/slug';

const CartPage = () => {
  const { user, setShowLoginModal } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCartItems();
  }, []);

  // Restore cart checkout after login
  useEffect(() => {
    if (user) {
      const savedCartCheckout = localStorage.getItem('pendingCartCheckout');
      if (savedCartCheckout) {
        try {
          const cartState = JSON.parse(savedCartCheckout);
          console.log('🔄 Restoring cart checkout after login:', cartState);
          
          // Check if not too old (5 minutes)
          const isRecent = (Date.now() - cartState.timestamp) < 5 * 60 * 1000; // 5 minutes
          
          if (isRecent && cartState.cartItems && cartState.cartItems.length > 0) {
            // Restore cart items if they were saved
            setCartItems(cartState.cartItems);
            localStorage.setItem('tour_cart', JSON.stringify(cartState.cartItems));
            
            console.log('✅ Cart state restored successfully - redirecting immediately');
            
            // Immediately redirect to checkout after restoration (no alerts)
            if (cartState.cartItems.length > 0) {
              const firstTour = cartState.cartItems[0];
              
              // Immediate redirect - no delay, no toast
              navigate(`/booking/${firstTour.tourId}`, {
                state: {
                  tour: firstTour,
                  selectedDate: firstTour.selectedDate,
                  cabinType: firstTour.cabinType,
                  participants: firstTour.participants,
                  fromLogin: true // Flag to indicate this came from login restoration
                }
              });
            }
            
            // Clear the saved state
            localStorage.removeItem('pendingCartCheckout');
          } else {
            // Clear old or invalid state
            localStorage.removeItem('pendingCartCheckout');
            console.log('🗑️ Cleared old cart checkout state');
          }
        } catch (error) {
          console.error('❌ Error restoring cart checkout state:', error);
          localStorage.removeItem('pendingCartCheckout');
        }
      }
    }
  }, [user, navigate]);

  const loadCartItems = () => {
    // Sepet verilerini localStorage'dan yükle
    const savedCart = localStorage.getItem('tour_cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  };

  const updateCartItems = (items) => {
    setCartItems(items);
    localStorage.setItem('tour_cart', JSON.stringify(items));
  };

  const updateQuantity = (tourId, selectedDate, cabinType, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(tourId, selectedDate, cabinType);
      return;
    }

    // Belirli tour + tarih + kabin tipi kombinasyonunu bul ve kapasitesini kontrol et
    const currentItem = cartItems.find(item => 
      item.tourId === tourId && 
      item.selectedDate?.date === selectedDate &&
      item.cabinType === cabinType
    );
    
    if (!currentItem) {
      toast.error('Sepet öğesi bulunamadı');
      return;
    }
    
    const maxCapacity = currentItem.selectedDate?.capacity || currentItem.selectedDate?.available_cabins || 20;

    // Aynı tarihteki diğer sepet kartlarındaki toplam kabin sayısını hesapla
    const sameeDateItems = cartItems.filter(item => 
      item.selectedDate?.date === selectedDate && 
      !(item.tourId === tourId && item.cabinType === cabinType) // Mevcut öğeyi hariç tut
    );
    
    const otherCabinsOnSameDate = sameeDateItems.reduce((total, item) => total + item.participants, 0);
    const totalCabinsAfterUpdate = otherCabinsOnSameDate + newQuantity;

    // Toplam kapasite kontrolü
    if (totalCabinsAfterUpdate > maxCapacity) {
      const availableSlots = maxCapacity - otherCabinsOnSameDate;
      toast.error(`Bu tarihte sadece ${availableSlots} kabin daha ekleyebilirsiniz. Toplam kabin kapasitesi: ${maxCapacity}`);
      return;
    }

    const updatedItems = cartItems.map(item =>
      (item.tourId === tourId && item.selectedDate?.date === selectedDate && item.cabinType === cabinType)
        ? { ...item, participants: newQuantity }
        : item
    );
    updateCartItems(updatedItems);
    
    // Başarı mesajı
    const dateStr = new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    const cabinTypeStr = cabinType === 'single' ? 'Tek kişilik' : 'Çift kişilik';
    const totalUsed = otherCabinsOnSameDate + newQuantity;
    toast.success(`${dateStr} - ${cabinTypeStr}: ${newQuantity} kabin (Toplam kullanılan: ${totalUsed}/${maxCapacity})`);
  };

  const updateChildQuantity = (tourId, selectedDate, newChildCount) => {
    if (newChildCount < 0) return;

    // Belirli tour + tarih kombinasyonunu bul
    const currentItem = cartItems.find(item => 
      item.tourId === tourId && 
      item.selectedDate?.date === selectedDate
    );
    
    if (!currentItem) {
      toast.error('Sepet öğesi bulunamadı');
      return;
    }
    
    const maxCapacity = currentItem.selectedDate?.max_persons || 20;
    const totalPersons = currentItem.participants + newChildCount;

    // Toplam kişi sayısı kontrolü
    if (totalPersons > maxCapacity) {
      toast.error(`Maksimum ${maxCapacity} kişi katılabilir`);
      return;
    }

    const updatedItems = cartItems.map(item =>
      (item.tourId === tourId && item.selectedDate?.date === selectedDate)
        ? { ...item, childCount: newChildCount, selectedDate: { ...item.selectedDate, childCount: newChildCount } }
        : item
    );
    updateCartItems(updatedItems);
    
    // Başarı mesajı
    const dateStr = new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    toast.success(`${dateStr} - Çocuk sayısı: ${newChildCount}`);
  };

  const updateCabinQuantity = (tourId, selectedDate, cabinType, newCount) => {
    if (newCount < 0) return;

    // Belirli tour + tarih kombinasyonunu bul
    const currentItem = cartItems.find(item => 
      item.tourId === tourId && 
      item.selectedDate?.date === selectedDate
    );
    
    if (!currentItem) {
      toast.error('Sepet öğesi bulunamadı');
      return;
    }
    
    const maxCapacity = currentItem.selectedDate?.available_cabins || 20;
    const otherCabinCount = cabinType === 'single' 
      ? (currentItem.doubleCabinCount || 0) 
      : (currentItem.singleCabinCount || 0);
    const totalCabins = newCount + otherCabinCount;

    // Toplam kabin sayısı kontrolü
    if (totalCabins > maxCapacity) {
      toast.error(`Maksimum ${maxCapacity} kabin seçebilirsiniz`);
      return;
    }

    const updatedItems = cartItems.map(item =>
      (item.tourId === tourId && item.selectedDate?.date === selectedDate)
        ? { 
            ...item, 
            [cabinType === 'single' ? 'singleCabinCount' : 'doubleCabinCount']: newCount,
            participants: totalCabins // Toplam kabin sayısı
          }
        : item
    );
    updateCartItems(updatedItems);
    
    // Başarı mesajı
    const dateStr = new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    const cabinTypeStr = cabinType === 'single' ? 'Tek kişilik' : 'Çift kişilik';
    toast.success(`${dateStr} - ${cabinTypeStr} kabin: ${newCount}`);
  };

  const removeItem = (tourId, selectedDate = null, cabinType = null) => {
    const updatedItems = (selectedDate && cabinType)
      ? cartItems.filter(item => !(item.tourId === tourId && item.selectedDate?.date === selectedDate && item.cabinType === cabinType))
      : selectedDate 
      ? cartItems.filter(item => !(item.tourId === tourId && item.selectedDate?.date === selectedDate))
      : cartItems.filter(item => item.tourId !== tourId);
    updateCartItems(updatedItems);
    toast.success('Tur sepetten kaldırıldı');
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      // Debug temizlendi
      
      if (item.reservation_type === 'person_based') {
        // Kişi bazlı: Yetişkin + Çocuk fiyatları
        const adultTotal = (item.person_price || 0) * item.participants;
        const childTotal = (item.child_price || 0) * (item.childCount || 0);
        return total + adultTotal + childTotal;
      } else if (item.reservation_type === 'reservation') {
        // Rezervasyon bazlı: Sabit toplam fiyat
        return total + (item.total_reservation_price || 0);
      } else {
        // Kabin bazlı: tek ve çift kabin ayrı hesaplama
        let singleTotal = 0;
        let doubleTotal = 0;
        
        // HER ZAMAN: Tek ve çift kabin fiyatlarını ayrı hesapla
        const singleCount = item.singleCabinCount || 0;
        const doubleCount = item.doubleCabinCount || 0;
        
        singleTotal = (item.single_cabin_price || 0) * singleCount;
        doubleTotal = (item.double_cabin_price || 0) * doubleCount;
        
        // BACKWARD COMPATIBILITY: Eski format kontrol
        if (singleCount === 0 && doubleCount === 0 && item.participants > 0) {
          // Eski sepet item'ları için
          if (item.cabinType === 'single') {
            singleTotal = (item.single_cabin_price || item.price || 0) * item.participants;
          } else if (item.cabinType === 'double') {
            doubleTotal = (item.double_cabin_price || item.price || 0) * item.participants;
          }
        }
        
        // Debug temizlendi
        return total + singleTotal + doubleTotal;
      }
    }, 0);
  };

  // KDV ve fiyat hesaplamaları
  const getSubtotal = () => {
    const totalWithVat = getTotalPrice();
    // KDV dahil fiyattan KDV'siz fiyatı hesapla (fiyat / 1.20)
    return Math.round(totalWithVat / 1.20);
  };

  const getVatAmount = () => {
    const subtotal = getSubtotal();
    return Math.round(subtotal * 0.20);
  };

  const handleCheckout = () => {
    if (!user) {
      // Save current cart state before showing login modal
      const cartState = {
        cartItems: cartItems,
        timestamp: Date.now(),
        source: 'cart'
      };
      
      localStorage.setItem('pendingCartCheckout', JSON.stringify(cartState));
      console.log('💾 Saved cart state before login:', cartState);
      
      setShowLoginModal(true);
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Planlanmış Rezervasyonunuz Yok');
      return;
    }

    // İlk tur için rezervasyon sayfasına git - tam veriyi state ile gönder
    const firstTour = cartItems[0];
    
    // Clear any pending cart state since we're proceeding
    localStorage.removeItem('pendingCartCheckout');
    
    navigate(`/booking/${firstTour.tourId}`, {
      state: {
        tour: firstTour,
        selectedDate: firstTour.selectedDate,
        cabinType: firstTour.cabinType,
        participants: firstTour.participants
      }
    });
  };

  const clearCart = () => {
    updateCartItems([]);
    toast.success('Sepet temizlendi');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Planlanmış rezervasyonunuz yok            </h1>
            <p className="text-gray-600 mb-8 text-lg">
              Harika turlar keşfetmek ve sepete eklemek için turlarımıza göz atın
            </p>
            <Link
              to="/turlar"
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
            >
              <span>Turları Keşfet</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link
            to="/turlar"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Turlar</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Sepetim</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Sepetinizdeki Turlar ({cartItems.length})
              </h2>
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors duration-200"
              >
                Sepeti Temizle
              </button>
            </div>

            {cartItems.map((item, index) => (
              <div key={`${item.tourId}-${item.selectedDate?.date}-${item.cabinType}-${index}`} className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                  {/* Tour Image */}
                  <div className="md:w-48 flex-shrink-0">
                    <img
                      src={item.image || '/placeholder-tour.jpg'}
                      alt={item.title}
                      className="w-full h-32 md:h-40 object-cover rounded-lg"
                    />
                  </div>

                  {/* Tour Details */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          <Link
                            to={`/turlar/${createSlug(item.title)}`}
                            className="hover:text-blue-600 transition-colors duration-200"
                          >
                            {item.title}
                          </Link>
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{item.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {item.duration || item.duration_days || 1}{' '}
                              {(() => {
                                if (item.duration_unit === 'hours') return 'Saat';
                                if (item.duration_unit === 'days') return 'Gün';
                                return item.duration_days ? 'Gün' : 'Saat'; // fallback
                              })()}
                            </span>
                          </div>
                        </div>
                        {/* Seçilen Tarih ve Kabin Tipi */}
                        <div className="mt-2 space-y-2">
                          {item.selectedDate && (
                            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center space-x-2 text-sm">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-blue-800">
                                  Seçilen Tarih: {item.selectedDate.formattedDate}
                                </span>
                              </div>
                            </div>
                          )}
                          <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center space-x-2 text-sm">
                              <span className="font-medium text-green-800">
                                {(() => {
                                  if (item.reservation_type === 'person_based') {
                                    return `${item.participants} Yetişkin${item.childCount > 0 ? ` + ${item.childCount} Çocuk` : ''}`;
                                  } else if (item.reservation_type === 'reservation') {
                                    return `Toplam Rezervasyon`;
                                  } else {
                                    // cabin_based - YENİ FORMAT ÖNCELİKLİ
                                    const singleCount = item.singleCabinCount || 0;
                                    const doubleCount = item.doubleCabinCount || 0;
                                    
                                    // YENİ FORMAT: ayrı kabin sayıları varsa
                                    if (item.hasOwnProperty('singleCabinCount') || item.hasOwnProperty('doubleCabinCount')) {
                                      const parts = [];
                                      if (singleCount > 0) parts.push(`${singleCount} × Tek Kişilik`);
                                      if (doubleCount > 0) parts.push(`${doubleCount} × Çift Kişilik`);
                                      return parts.length > 0 ? parts.join(' + ') : 'Kabin Seçimi';
                                    }
                                    
                                    // ESKİ FORMAT: tek kabin tipi
                                    return `Kabin Tipi: ${item.cabinType === 'single' ? 'Tek Kişilik Kabin' : 'Çift Kişilik Kabin'}`;
                                  }
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.tourId, item.selectedDate?.date, item.cabinType)}
                        className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-3">
                        {item.reservation_type === 'person_based' ? (
                          // Kişi Bazlı - Sade 2x2 Grid Layout
                          <div className="grid grid-cols-2 gap-4 w-full">
                            {/* Yetişkin Sayısı */}
                            <div className="space-y-2">
                              <span className="text-xs font-medium text-gray-600 block">Yetişkin</span>
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => updateQuantity(item.tourId, item.selectedDate?.date, item.cabinType, item.participants - 1)}
                                  disabled={item.participants <= 1}
                                  className="w-8 h-8 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 text-blue-600 border border-blue-400 hover:border-blue-500 rounded-md flex items-center justify-center transition-all duration-200"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-lg font-bold text-gray-900 min-w-[1.5rem] text-center">
                                  {item.participants}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.tourId, item.selectedDate?.date, item.cabinType, item.participants + 1)}
                                  disabled={item.participants >= (item.selectedDate?.max_persons || 20)}
                                  className="w-8 h-8 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 text-blue-600 border border-blue-400 hover:border-blue-500 rounded-md flex items-center justify-center transition-all duration-200"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Çocuk Sayısı */}
                            <div className="space-y-2">
                              <span className="text-xs font-medium text-gray-600 block">Çocuk</span>
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => updateChildQuantity(item.tourId, item.selectedDate?.date, (item.childCount || 0) - 1)}
                                  disabled={(item.childCount || 0) <= 0}
                                  className="w-8 h-8 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 text-blue-600 border border-blue-400 hover:border-blue-500 rounded-md flex items-center justify-center transition-all duration-200"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-lg font-bold text-gray-900 min-w-[1.5rem] text-center">
                                  {item.childCount || 0}
                                </span>
                                <button
                                  onClick={() => updateChildQuantity(item.tourId, item.selectedDate?.date, (item.childCount || 0) + 1)}
                                  disabled={(item.participants + (item.childCount || 0)) >= (item.selectedDate?.max_persons || 20)}
                                  className="w-8 h-8 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 text-blue-600 border border-blue-400 hover:border-blue-500 rounded-md flex items-center justify-center transition-all duration-200"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : item.reservation_type === 'reservation' ? (
                          // Rezervasyon Bazlı - Sabit Gösterim
                          <span className="text-sm font-medium text-gray-700">
                            Rezervasyon: <span className="text-lg font-semibold text-gray-900 ml-2">1 × Toplam Rezervasyon</span>
                          </span>
                        ) : (
                          // Kabin Bazlı - Yeni 2x2 Grid Tasarım
                          <div className="grid grid-cols-2 gap-4 w-full">
                            {/* Tek Kişilik Kabin */}
                            <div className="space-y-2">
                              <span className="text-xs font-medium text-gray-600 block">Tek Kişilik</span>
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => updateCabinQuantity(item.tourId, item.selectedDate?.date, 'single', (item.singleCabinCount || 0) - 1)}
                                  disabled={(item.singleCabinCount || 0) <= 0}
                                  className="w-8 h-8 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 text-blue-600 border border-blue-400 hover:border-blue-500 rounded-md flex items-center justify-center transition-all duration-200"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-lg font-bold text-gray-900 min-w-[1.5rem] text-center">
                                  {item.singleCabinCount || 0}
                                </span>
                                <button
                                  onClick={() => updateCabinQuantity(item.tourId, item.selectedDate?.date, 'single', (item.singleCabinCount || 0) + 1)}
                                  disabled={((item.singleCabinCount || 0) + (item.doubleCabinCount || 0)) >= (item.selectedDate?.available_cabins || 20)}
                                  className="w-8 h-8 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 text-blue-600 border border-blue-400 hover:border-blue-500 rounded-md flex items-center justify-center transition-all duration-200"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Çift Kişilik Kabin */}
                            <div className="space-y-2">
                              <span className="text-xs font-medium text-gray-600 block">Çift Kişilik</span>
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => updateCabinQuantity(item.tourId, item.selectedDate?.date, 'double', (item.doubleCabinCount || 0) - 1)}
                                  disabled={(item.doubleCabinCount || 0) <= 0}
                                  className="w-8 h-8 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 text-blue-600 border border-blue-400 hover:border-blue-500 rounded-md flex items-center justify-center transition-all duration-200"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-lg font-bold text-gray-900 min-w-[1.5rem] text-center">
                                  {item.doubleCabinCount || 0}
                                </span>
                                <button
                                  onClick={() => updateCabinQuantity(item.tourId, item.selectedDate?.date, 'double', (item.doubleCabinCount || 0) + 1)}
                                  disabled={((item.singleCabinCount || 0) + (item.doubleCabinCount || 0)) >= (item.selectedDate?.available_cabins || 20)}
                                  className="w-8 h-8 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 text-blue-600 border border-blue-400 hover:border-blue-500 rounded-md flex items-center justify-center transition-all duration-200"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Toplam kullanılan yazısı kaldırıldı */}
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <div className="text-xs text-gray-600 mb-2 space-y-1">
                          {(() => {
                            if (item.reservation_type === 'person_based') {
                              const adultPrice = item.person_price || 0;
                              const childPrice = item.child_price || 0;
                              const adultTotal = adultPrice * item.participants;
                              const childTotal = childPrice * (item.childCount || 0);
                              return (
                                <div>
                                  <div className="flex justify-between">
                                    <span>Yetişkin: ₺{adultPrice.toLocaleString('tr-TR')} × {item.participants}</span>
                                    <span>₺{adultTotal.toLocaleString('tr-TR')}</span>
                                  </div>
                                  {item.childCount > 0 && (
                                    <div className="flex justify-between">
                                      <span>Çocuk: ₺{childPrice.toLocaleString('tr-TR')} × {item.childCount}</span>
                                      <span>₺{childTotal.toLocaleString('tr-TR')}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            } else if (item.reservation_type === 'reservation') {
                              return (
                                <div className="flex justify-between">
                                  <span>Toplam Rezervasyon</span>
                                  <span>₺{(item.total_reservation_price || 0).toLocaleString('tr-TR')}</span>
                                </div>
                              );
                            } else {
                              // cabin_based - Ayrı kabin fiyatları
                              const singlePrice = item.single_cabin_price || 0;
                              const doublePrice = item.double_cabin_price || 0;
                              const singleCount = item.singleCabinCount || 0;
                              const doubleCount = item.doubleCabinCount || 0;
                              const singleTotal = singlePrice * singleCount;
                              const doubleTotal = doublePrice * doubleCount;
                              
                              return (
                                <div>
                                  {singleCount > 0 && (
                                    <div className="flex justify-between">
                                      <span>Tek Kişilik: ₺{singlePrice.toLocaleString('tr-TR')} × {singleCount}</span>
                                      <span>₺{singleTotal.toLocaleString('tr-TR')}</span>
                                    </div>
                                  )}
                                  {doubleCount > 0 && (
                                    <div className="flex justify-between">
                                      <span>Çift Kişilik: ₺{doublePrice.toLocaleString('tr-TR')} × {doubleCount}</span>
                                      <span>₺{doubleTotal.toLocaleString('tr-TR')}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          })()}
                        </div>
                        <div className="text-xl font-bold text-blue-600">
                          ₺{(() => {
                            if (item.reservation_type === 'person_based') {
                              const adultTotal = (item.person_price || 0) * item.participants;
                              const childTotal = (item.child_price || 0) * (item.childCount || 0);
                              return (adultTotal + childTotal).toLocaleString();
                            } else if (item.reservation_type === 'reservation') {
                              return (item.total_reservation_price || 0).toLocaleString();
                            } else {
                              // cabin_based - FİX: Aynı logic getTotalPrice ile
                              let singleTotal = 0;
                              let doubleTotal = 0;
                              
                              const singleCount = item.singleCabinCount || 0;
                              const doubleCount = item.doubleCabinCount || 0;
                              
                              singleTotal = (item.single_cabin_price || 0) * singleCount;
                              doubleTotal = (item.double_cabin_price || 0) * doubleCount;
                              
                              // Backward compatibility
                              if (singleCount === 0 && doubleCount === 0 && item.participants > 0) {
                                if (item.cabinType === 'single') {
                                  singleTotal = (item.single_cabin_price || item.price || 0) * item.participants;
                                } else if (item.cabinType === 'double') {
                                  doubleTotal = (item.double_cabin_price || item.price || 0) * item.participants;
                                }
                              }
                              
                              return (singleTotal + doubleTotal).toLocaleString();
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:sticky lg:top-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                Sipariş Özeti
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Ara Toplam</span>
                  <span>₺{getSubtotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>KDV (%20)</span>
                  <span>₺{getVatAmount().toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Toplam</span>
                    <span>₺{getTotalPrice().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading || cartItems.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none mb-4"
              >
                {user ? 'Rezervasyona Geç' : 'Giriş Yaparak Devam Et'}
              </button>

              <div className="text-center">
                <Link
                  to="/turlar"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                >
                  Alışverişe Devam Et
                </Link>
              </div>

              {/* Security Notice */}
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Güvenli Ödeme</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  SSL sertifikası ile korumalı ödeme sistemi
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;