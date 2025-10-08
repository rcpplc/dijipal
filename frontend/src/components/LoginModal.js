import React, { useState } from 'react';
import { useAuth } from '../App';
import { X, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const LoginModal = ({ initialMode = 'login' }) => {
  const { setShowLoginModal, login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    console.log('🎯 handleSubmit called', { isLogin, formData });
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        console.log('🔑 Calling login function with:', formData.email);
        result = await login(formData.email, formData.password);
        console.log('📡 Login result:', result);
      } else {
        console.log('📝 Calling register function with:', formData);
        result = await register(formData);
        console.log('📡 Register result:', result);
      }

      if (result.success) {
        setShowLoginModal(false);
        toast.success(isLogin ? 'Başarıyla giriş yaptınız!' : 'Hesabınız oluşturuldu!');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('❌ Login/Register error:', error);
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      full_name: '',
      phone: ''
    });
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Mock Google login - in real app, use Google OAuth SDK
      const mockGoogleData = {
        email: 'google.user@gmail.com',
        name: 'Google Kullanıcı'
      };

      const result = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/google`, mockGoogleData);
      
      if (result.data.token) {
        localStorage.setItem('token', result.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${result.data.token}`;
        
        // Auth context'i güncelle (parent component'den gelmeli)
        setShowLoginModal(false);
        toast.success('Google ile giriş başarılı!');
        window.location.reload(); // Basit çözüm - normalde auth state'i güncellenir
      }
    } catch (error) {
      toast.error('Google giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        // Modal'ı sadece backdrop'e tıklanırsa kapat
        if (e.target === e.currentTarget) {
          console.log('🔒 Closing modal via backdrop click');
          setShowLoginModal(false);
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl max-w-md w-full mx-auto shadow-2xl transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => {
          e.stopPropagation(); // Prevent backdrop click from firing
          console.log('📦 Modal content clicked');
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">
            {isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}
          </h2>
          <button
            onClick={() => !loading && setShowLoginModal(false)}
            disabled={loading}
            className={`p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form 
          onSubmit={handleSubmit} 
          className="p-6 space-y-6"
        >
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ad Soyad
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Adınız ve soyadınız"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-posta Adresi
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="ornek@email.com"
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon Numarası
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="+90 5XX XXX XX XX"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Şifre
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {!isLogin && (
              <p className="text-xs text-gray-500 mt-1">
                Şifreniz en az 6 karakter olmalıdır.
              </p>
            )}
          </div>

          {isLogin && (
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-700">Beni hatırla</span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Şifremi unuttum
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{isLogin ? 'Giriş yapılıyor...' : 'Hesap oluşturuluyor...'}</span>
              </div>
            ) : (
              <span>{isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}</span>
            )}
          </button>

          {!isLogin && (
            <div className="text-xs text-gray-500 text-center">
              Hesap oluşturarak{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                Kullanım Koşulları
              </a>{' '}
              ve{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                Gizlilik Politikası
              </a>
              'nı kabul etmiş olursunuz.
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 pb-6 text-center">
          <p className="text-sm text-gray-600">
            {isLogin ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
            {' '}
            <button
              onClick={toggleMode}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              {isLogin ? 'Hesap oluştur' : 'Giriş yap'}
            </button>
          </p>
        </div>

        {/* Social Login (Optional - for future implementation) */}
        <div className="px-6 pb-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">veya</span>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="ml-2">Google</span>
            </button>

            <button
              type="button"
              className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="ml-2">Facebook</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;