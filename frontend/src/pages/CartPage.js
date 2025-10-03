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

const CartPage = () => {
  const { user, setShowLoginModal } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCartItems();
  }, []);

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

  const updateQuantity = (tourId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(tourId);
      return;
    }

    const updatedItems = cartItems.map(item =>
      item.tourId === tourId 
        ? { ...item, participants: newQuantity }
        : item
    );
    updateCartItems(updatedItems);
  };

  const removeItem = (tourId) => {
    const updatedItems = cartItems.filter(item => item.tourId !== tourId);
    updateCartItems(updatedItems);
    toast.success('Tur sepetten kaldırıldı');
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      // Kabin sistemi: cabin type'a göre fiyat hesapla
      const cabinPrice = item.cabinType === 'double' 
        ? (item.double_cabin_price || item.price || 0)
        : (item.single_cabin_price || item.price || 0);
      
      return total + (cabinPrice * item.participants);
    }, 0);
  };

  const handleCheckout = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Sepetiniz boş');
      return;
    }

    // İlk tur için rezervasyon sayfasına git
    const firstTour = cartItems[0];
    const queryParams = new URLSearchParams({
      participants: firstTour.participants.toString()
    });
    
    if (firstTour.selectedDate && firstTour.selectedDate.date) {
      queryParams.append('date', firstTour.selectedDate.date);
      if (firstTour.selectedDate.price) {
        queryParams.append('price', firstTour.selectedDate.price.toString());
      }
    }
    
    navigate(`/booking/${firstTour.tourId}?${queryParams.toString()}`);
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
              Sepetiniz Boş
            </h1>
            <p className="text-gray-600 mb-8 text-lg">
              Harika turlar keşfetmek ve sepete eklemek için turlarımıza göz atın
            </p>
            <Link
              to="/tours"
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
            to="/tours"
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

            {cartItems.map((item) => (
              <div key={item.tourId} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex flex-col md:flex-row gap-6">
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
                          {item.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{item.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{item.duration} gün</span>
                          </div>
                        </div>
                        {/* Seçilen Tarih */}
                        {item.selectedDate && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center space-x-2 text-sm">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-blue-800">
                                Seçilen Tarih: {item.selectedDate.formattedDate}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.tourId)}
                        className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-700">Katılımcı:</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.tourId, item.participants - 1)}
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-lg font-semibold text-gray-900 min-w-[2rem] text-center">
                            {item.participants}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.tourId, item.participants + 1)}
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-1">
                          ₺{item.price} × {item.participants}
                        </div>
                        <div className="text-xl font-bold text-blue-600">
                          ₺{(item.price * item.participants).toLocaleString()}
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
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Sipariş Özeti
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Ara Toplam</span>
                  <span>₺{getTotalPrice().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Hizmet Bedeli</span>
                  <span>₺0</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Vergiler</span>
                  <span>Dahil</span>
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
                  to="/tours"
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