import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  ShoppingCart, 
  Trash2, 
  MapPin, 
  Calendar,
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

  // YENİ SEPET SİSTEMİ - SIFIRDAN YAZILDI
  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = () => {
    try {
      const savedCart = localStorage.getItem('tour_cart');
      if (savedCart) {
        const items = JSON.parse(savedCart);
        setCartItems(items);
      }
    } catch (error) {
      console.error('Sepet yüklenirken hata:', error);
      setCartItems([]);
    }
  };

  // Sepetten öğe kaldırma
  const removeFromCart = (itemId) => {
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedItems);
    localStorage.setItem('tour_cart', JSON.stringify(updatedItems));
    window.dispatchEvent(new Event('storage'));
    toast.success('Ürün sepetten kaldırıldı');
  };

  // Fiyat hesaplama fonksiyonu
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

  // Toplam fiyat hesaplama
  const calculateTotalPrice = () => {
    return cartItems.reduce((total, item) => total + calculateItemPrice(item), 0);
  };

  // Rezervasyon özeti gösterimi
  const getReservationSummary = (item) => {
    if (item.reservation_type === 'cabin_based') {
      const parts = [];
      if (item.singleCabinCount > 0) {
        parts.push(`${item.singleCabinCount} Tek Kişilik Kabin`);
      }
      if (item.doubleCabinCount > 0) {
        parts.push(`${item.doubleCabinCount} Çift Kişilik Kabin`);
      }
      return parts.length > 0 ? parts.join(' + ') : 'Kabin seçimi yok';
    } else if (item.reservation_type === 'person_based') {
      const parts = [];
      if (item.adultCount > 0) {
        parts.push(`${item.adultCount} Yetişkin`);
      }
      if (item.childCount > 0) {
        parts.push(`${item.childCount} Çocuk`);
      }
      return parts.length > 0 ? parts.join(' + ') : 'Katılımcı seçimi yok';
    } else if (item.reservation_type === 'reservation') {
      return 'Özel Rezervasyon';
    }
    
    return 'Bilinmeyen rezervasyon tipi';
  };

  // Checkout işlemi
  const handleCheckout = () => {
    if (!user) {
      // Login gerekli
      const checkoutState = {
        cartItems: cartItems,
        totalPrice: calculateTotalPrice(),
        timestamp: Date.now()
      };
      localStorage.setItem('pendingCartCheckout', JSON.stringify(checkoutState));
      setShowLoginModal(true);
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Sepetinizde ürün bulunmuyor');
      return;
    }

    // İlk ürün üzerinden booking sayfasına git (multi-item booking henüz desteklenmiyor)
    const firstItem = cartItems[0];
    const cartTotal = calculateTotalPrice(); // SEPET TOPLAMI
    
    navigate(`/booking/${firstItem.tourId}`, {
      state: {
        tour: {
          id: firstItem.tourId,
          title: firstItem.title,
          location: firstItem.location,
          images: [firstItem.image],
          reservation_type: firstItem.reservation_type
        },
        selectedDate: firstItem.selectedDate,
        fromCart: true,
        cartTotal: cartTotal, // SEPET TOPLAMI AKTARILDI
        cartItems: cartItems, // TÜM SEPET ÖĞELERİ
        // Rezervasyon tipine göre seçimler
        ...(firstItem.reservation_type === 'cabin_based' && {
          singleCabinCount: firstItem.singleCabinCount || 0,
          doubleCabinCount: firstItem.doubleCabinCount || 0
        }),
        ...(firstItem.reservation_type === 'person_based' && {
          adultCount: firstItem.adultCount || 0,
          childCount: firstItem.childCount || 0
        })
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                Geri
              </button>
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Sepetim</h1>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {cartItems.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cartItems.length === 0 ? (
          // Boş sepet
          <div className="text-center py-16">
            <ShoppingCart className="w-24 h-24 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sepetiniz boş</h2>
            <p className="text-gray-600 mb-8">Henüz sepetinize ürün eklemediniz.</p>
            <Link
              to="/turlar"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Turları Keşfet
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        ) : (
          // Sepet içeriği
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sepet öğeleri */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, index) => (
                <div
                  key={item.id || index}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Tur resmi */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>

                      {/* Tur bilgileri */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {item.title}
                            </h3>
                            
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {item.location}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {item.selectedDate?.formattedDate}
                              </div>
                            </div>

                            {/* Rezervasyon özeti */}
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                {item.reservation_type === 'cabin_based' && ''}
                                {item.reservation_type === 'person_based' && ''}
                                {item.reservation_type === 'reservation' && ''}
                              </div>
                              <div className="text-sm text-gray-600">
                                {getReservationSummary(item)}
                              </div>
                            </div>
                          </div>

                          {/* Fiyat ve sil butonu */}
                          <div className="text-right">
                            <div className="text-xl font-bold text-blue-600 mb-2">
                              ₺{calculateItemPrice(item).toLocaleString('tr-TR')}
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sepet özeti */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sepet Özeti</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ürün Sayısı:</span>
                    <span className="font-medium">{cartItems.length}</span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Toplam:</span>
                      <span className="text-blue-600">
                        ₺{calculateTotalPrice().toLocaleString('tr-TR')}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0}
                  className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {!user ? 'Giriş Yap & Rezervasyon Tamamla' : 'Rezervasyon Tamamla'}
                </button>

                <div className="mt-4 text-xs text-gray-500 text-center">
                  Güvenli ödeme ile korunuyorsunuz
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;