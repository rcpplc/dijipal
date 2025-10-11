import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  ArrowLeft, 
  CreditCard, 
  CheckCircle,
  Shield,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';

const PaymentPage = () => {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardHolder: ''
  });
  const [isApproved, setIsApproved] = useState(false); // ✅ Onay durumu
  const [showContractModal, setShowContractModal] = useState(false); // Modal durumu

  // ✅ Footer'ı sadece mobilde gizle
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

  // ✅ Modal açıkken MobileBottomNav'ı gizle
  useEffect(() => {
    const mobileNav = document.querySelector('nav.lg\\:hidden');
    if (mobileNav) {
      mobileNav.style.display = showContractModal ? 'none' : '';
    }

    return () => {
      if (mobileNav) {
        mobileNav.style.display = '';
      }
    };
  }, [showContractModal]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (location.state?.booking) {
      setBooking(location.state.booking);
    } else {
      const bookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
      const lastBooking = bookings[bookings.length - 1];
      if (lastBooking) {
        setBooking(lastBooking);
      } else {
        toast.error('Rezervasyon bulunamadı');
        navigate('/profile');
      }
    }
  }, [location.state, user, navigate]);

  // Modal'da "Kabul Ediyorum" butonuna tıklanınca
  const handleAcceptContract = () => {
    setIsApproved(true); // Checkbox'ı otomatik işaretle
    setShowContractModal(false); // Modal'ı kapat
    toast.success('Mesafeli Satış Sözleşmesi ve KVKK Metni kabul edildi.');
    
    // İşlemi otomatik devam ettir
    setTimeout(() => {
      const paymentForm = document.querySelector('form');
      if (paymentForm) {
        paymentForm.requestSubmit();
      }
    }, 500);
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    // ✅ Onay yapılmadıysa özel uyarı sistemi
    if (!isApproved) {
      // 1 saniyelik alert uyarısı
      toast.error('Lütfen Mesafeli Satış Sözleşmesi ve KVKK metnini onaylayın!', {
        duration: 1000
      });

      // Mobilde checkbox'a otomatik focus
      setTimeout(() => {
        const checkbox = document.getElementById('contract-checkbox');
        if (checkbox && window.innerWidth <= 768) {
          checkbox.focus();
          checkbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 1000);

      // Modal'ı aç
      setTimeout(() => {
        setShowContractModal(true);
      }, 1100);
      
      return;
    }
    
    if (!cardData.cardNumber || !cardData.expiryMonth || !cardData.expiryYear || !cardData.cvv || !cardData.cardHolder) {
      toast.error('Lütfen tüm kart bilgilerini doldurun');
      return;
    }

    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (booking) {
        const bookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        const updatedBookings = bookings.map(b => 
          b.id === booking.id 
            ? { ...b, status: 'confirmed', paymentStatus: 'paid', paidAt: new Date().toISOString() }
            : b
        );
        localStorage.setItem('user_bookings', JSON.stringify(updatedBookings));
      }

      toast.success('Ödeme başarıyla tamamlandı!');
      
      navigate('/payment-success', {
        state: {
          booking: { ...booking, status: 'confirmed', paymentStatus: 'paid' },
          paymentAmount: booking?.totalPrice || 0,
          cartItems: booking?.cartItems || null,
          fromCart: booking?.fromCart || false
        }
      });
      
    } catch (error) {
      toast.error('Ödeme işlemi başarısız oldu');
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Sözleşme Modal */}
      {showContractModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4 pb-24 md:pb-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[100vh] md:max-h-[100vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Mesafeli Satış Sözleşmesi ve KVKK Aydınlatma Metni
              </h2>
              <button
                onClick={() => setShowContractModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
              {/* Mesafeli Satış Sözleşmesi */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Mesafeli Satış Sözleşmesi
                </h3>
                <div className="text-sm text-gray-700 space-y-3">
                  <p>
                    <strong>Madde 1 - Taraflar:</strong> Bu sözleşme, Mavibilet şirketi ile müşteri arasında imzalanmıştır.
                  </p>
                  <p>
                    <strong>Madde 2 - Sözleşme Konusu:</strong> Bu sözleşme, müşterinin elektronik ortamda sipariş verdiği ürün/hizmetin satış ve teslimat koşullarını düzenlemektedir.
                  </p>
                  <p>
                    <strong>Madde 3 - Cayma Hakkı:</strong> Müşteri, 14 gün içerisinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir.
                  </p>
                  <p>
                    <strong>Madde 4 - Teslimat:</strong> Ürün/hizmet, en geç 30 gün içerisinde teslim edilecektir.
                  </p>
                  <p>
                    <strong>Madde 5 - Ödeme:</strong> Ödeme, güvenli ödeme sistemleri üzerinden gerçekleştirilecektir.
                  </p>
                  <p>
                    <strong>Madde 6 - Yürürlük:</strong> Bu sözleşme, elektronik ortamda onaylandığı tarihten itibaren yürürlüğe girer.
                  </p>
                </div>
              </div>

              {/* KVKK Aydınlatma Metni */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Kişisel Verilerin Korunması Kanunu (KVKK) Aydınlatma Metni
                </h3>
                <div className="text-sm text-gray-700 space-y-3">
                  <p>
                    <strong>Veri Sorumlusu:</strong> Mavibilet, kişisel verilerinizin işlenme amacını ve yöntemini belirleyen, veri işleme sisteminin kurulmasından ve yönetilmesinden sorumlu olan gerçek veya tüzel kişidir.
                  </p>
                  <p>
                    <strong>Kişisel Veri:</strong> Kimliği belirli veya belirlenebilir gerçek kişiye ilişkin her türlü bilgi kişisel veri olarak tanımlanmaktadır.
                  </p>
                  <p>
                    <strong>İşleme Amaçları:</strong> Kişisel verileriniz; hizmet sunumu, iletişim kurulması, yasal yükümlülüklerin yerine getirilmesi amaçlarıyla işlenmektedir.
                  </p>
                  <p>
                    <strong>Saklama Süresi:</strong> Kişisel verileriniz, işleme amacının ortadan kalkmasına kadar saklanacaktır.
                  </p>
                  <p>
                    <strong>Haklarınız:</strong> KVKK kapsamında bilgi talep etme, düzeltme, silme, işleme sınırlandırılmasını talep etme haklarına sahipsiniz.
                  </p>
                  <p>
                    <strong>İletişim:</strong> KVKK ile ilgili başvurularınızı info@mavibilet.com adresine iletebilirsiniz.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowContractModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal Et
              </button>
              <button
                onClick={handleAcceptContract}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Kabul Ediyorum ve Devam Et
              </button>
            </div>
          </div>
        </div>
      )}

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
            <h1 className="text-2xl font-bold text-gray-900">Güvenli Ödeme</h1>
            <div className="flex items-center text-green-600">
              <Lock className="w-4 h-4 mr-1" />
              <span className="text-sm">SSL Güvenli</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ödeme Formu */}
          <div className="lg:col-span-2">
            <form onSubmit={handlePayment} className="space-y-6">
              {/* Ödeme Yöntemi */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ödeme Yöntemi</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="credit_card"
                      checked={paymentMethod === 'credit_card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                    <span className="font-medium">Kredi/Banka Kartı</span>
                  </label>
                </div>
              </div>

              {/* Kart Bilgileri */}
              {paymentMethod === 'credit_card' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Kart Bilgileri</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kart Üzerindeki İsim *
                      </label>
                      <input
                        type="text"
                        required
                        value={cardData.cardHolder}
                        onChange={(e) => setCardData({...cardData, cardHolder: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ad Soyad"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kart Numarası *
                      </label>
                      <input
                        type="text"
                        required
                        value={cardData.cardNumber}
                        onChange={(e) => setCardData({...cardData, cardNumber: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0000 0000 0000 0000"
                        maxLength="19"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ay *
                        </label>
                        <select
                          required
                          value={cardData.expiryMonth}
                          onChange={(e) => setCardData({...cardData, expiryMonth: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Ay</option>
                          {[...Array(12)].map((_, i) => (
                            <option key={i+1} value={String(i+1).padStart(2, '0')}>
                              {String(i+1).padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Yıl *
                        </label>
                        <select
                          required
                          value={cardData.expiryYear}
                          onChange={(e) => setCardData({...cardData, expiryYear: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Yıl</option>
                          {[...Array(10)].map((_, i) => (
                            <option key={i} value={new Date().getFullYear() + i}>
                              {new Date().getFullYear() + i}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV *
                        </label>
                        <input
                          type="text"
                          required
                          value={cardData.cvv}
                          onChange={(e) => setCardData({...cardData, cvv: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="000"
                          maxLength="4"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Güvenlik Bilgisi */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-green-600 mr-2" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium">Güvenli Ödeme</p>
                    <p>Kart bilgileriniz SSL şifreleme ile korunmaktadır.</p>
                  </div>
                </div>
              </div>

              {/* Masaüstü Butonu */}
              <button
                type="submit"
                disabled={loading}
                className="hidden md:flex w-full bg-blue-600 text-white font-medium py-4 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors items-center justify-center text-lg"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    ₺{booking.totalPrice?.toLocaleString('tr-TR')} Öde
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Sipariş Özeti + Onay */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rezervasyon Özeti</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-1 min-w-0">
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ara Toplam:</span>
                    <span className="font-medium">₺{booking.tax?.subtotal?.toLocaleString('tr-TR') || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">KDV (%20):</span>
                    <span className="font-medium">₺{booking.tax?.taxAmount?.toLocaleString('tr-TR') || '0'}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Toplam:</span>
                    <span className="text-blue-600">₺{booking.totalPrice?.toLocaleString('tr-TR') || '0'}</span>
                  </div>
                </div>
              </div>

              {/* ✅ Mesafeli Satış Sözleşmesi ve KVKK Onayı */}
              <div className="border-t pt-4 mt-4">
                <label className="flex items-start space-x-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    id="contract-checkbox"
                    type="checkbox"
                    checked={isApproved}
                    onChange={(e) => setIsApproved(e.target.checked)}
                    className="mt-1 accent-blue-600 w-4 h-4"
                  />
                  <span>
                    <strong>Mesafeli Satış Sözleşmesi</strong> ve <strong>KVKK Aydınlatma Metni</strong>'ni okudum ve onaylıyorum.
                    <br />
                    <button
                      type="button"
                      onClick={() => setShowContractModal(true)}
                      className="text-blue-600 hover:text-blue-800 underline text-xs mt-1 inline-block"
                    >
                      Metinleri okumak için tıklayınız
                    </button>
                  </span>
                </label>
              </div>

              <div className="text-xs text-gray-500 text-center mt-4">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Güvenli ödeme sistemi
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📱 Mobil Sabit Ödeme Butonu */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2 md:hidden z-50">
        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              ₺{booking.totalPrice?.toLocaleString('tr-TR')} Öde
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;
