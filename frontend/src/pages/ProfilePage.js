import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  MapPin,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Edit3,
  Save,
  X,
  Users,
  AlertCircle,
  Settings,
  Bell,
  Shield,
  Trash2,
  Heart,
  ArrowRight
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Helper function to create URL-friendly slugs
const createSlug = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// TourCard Component - Same design as HomePage
const TourCard = ({ tour }) => (
  <a 
    href={`/tur/${createSlug(tour.title)}`} 
    className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 block group"
  >
    {/* Image Section */}
    <div className="relative">
      <img
        src={tour.images?.[0] || '/placeholder-tour.jpg'}
        alt={tour.title}
        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
      />
      
      {/* Favorite Remove Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          removeFavorite(tour.id);
        }}
        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200 z-10"
        title="Favorilerden çıkar"
      >
        <Heart className="w-5 h-5 text-red-500 fill-current" />
      </button>

      {/* Category Badge */}
      {tour.category && (
        <div className="absolute top-3 left-3">
          <span className="bg-blue-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
            {tour.category}
          </span>
        </div>
      )}
    </div>

    {/* Content Section */}
    <div className="p-4">
      {/* Location */}
      <div className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
        <MapPin className="w-4 h-4" />
        <span>{tour.location}</span>
      </div>

      {/* Title */}
      <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 leading-tight">
        {tour.title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
        {tour.short_description || tour.description}
      </p>

      {/* Rating and Duration */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-1">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(tour.rating || 0)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">
            ({tour.review_count || 0})
          </span>
        </div>

        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>
            {tour.duration || tour.duration_days || 1}{' '}
            {(() => {
              if (tour.duration_unit === 'hours') return 'Saat';
              if (tour.duration_unit === 'days') return 'Gün';
              return 'Gün';
            })()}
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="mb-4">
        <div className="text-xl font-bold text-blue-600">
          {(() => {
            if (tour.minimum_price) {
              return `₺${(tour.minimum_price || 0).toLocaleString('tr-TR')}`;
            } else if (tour.tour_dates && tour.tour_dates.length > 0) {
              const allPrices = tour.tour_dates.flatMap(date => [
                date.single_cabin_price || 0,
                date.double_cabin_price || 0
              ]).filter(price => price > 0);
              
              return allPrices.length > 0 
                ? `₺${Math.min(...allPrices).toLocaleString('tr-TR')}` 
                : `₺${(tour.base_price || 0).toLocaleString('tr-TR')}`;
            } else {
              return `₺${(tour.base_price || 0).toLocaleString('tr-TR')}`;
            }
          })()}
        </div>
        <div className="text-sm text-gray-500">den başlayan</div>
      </div>

      {/* Details Button */}
      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2">
        <span>Detayları Görüntüle</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  </a>
);

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [favorites, setFavorites] = useState([]);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordMode, setPasswordMode] = useState(false);
  const [bookingFilter, setBookingFilter] = useState('all');
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: true,
    marketing_emails: false
  });
  const [accountStatus, setAccountStatus] = useState('active'); // active, deactivated
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (activeTab === 'bookings') {
      loadBookings();
    } else if (activeTab === 'favorites') {
      loadFavorites();
    }
  }, [activeTab]);

  useEffect(() => {
    // Sync profile data with user changes
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
      // Load notification settings from localStorage
      const storedSettings = localStorage.getItem(`notification_settings_${user.id}`);
      if (storedSettings) {
        try {
          setNotificationSettings(JSON.parse(storedSettings));
        } catch (error) {
          console.error('Error loading notification settings:', error);
        }
      }
      
      // Load account status from localStorage
      const storedAccountStatus = localStorage.getItem(`account_status_${user.id}`);
      if (storedAccountStatus) {
        setAccountStatus(storedAccountStatus);
      }
    }
  }, [user]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Rezervasyonlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(response.data);
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast.error('Favoriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const response = await axios.put(`${API}/profile`, profileData);
      toast.success('Profil bilgileri güncellendi');
      setEditMode(false);
      
      // Update the profileData state with the response
      if (response.data) {
        setProfileData({
          full_name: response.data.full_name || '',
          email: response.data.email || '',
          phone: response.data.phone || ''
        });
        
        // Update the user context - force a refresh of user data from /api/users/me
        window.location.reload();
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Profil güncellenirken hata oluştu');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }

    try {
      await axios.put(`${API}/change-password`, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      toast.success('Şifre başarıyla değiştirildi');
      setPasswordMode(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Şifre değiştirilirken hata oluştu');
    }
  };

  const removeFavorite = async (tourId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/favorites/${tourId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Favorilerden çıkarıldı');
      loadFavorites();
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Favorilerden çıkarılırken hata oluştu');
    }
  };

  // Notification Settings - Temporary local storage solution
  const updateNotificationSettings = async (settings) => {
    try {
      // Store settings in localStorage temporarily until backend is implemented
      localStorage.setItem(`notification_settings_${user.id}`, JSON.stringify(settings));
      setNotificationSettings(settings);
      toast.success('Bildirim tercihleri güncellendi');
      
      // TODO: Replace with actual API call when backend endpoint is implemented
      // const token = localStorage.getItem('token');
      // await axios.put(`${API}/profile/notifications`, settings, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error('Bildirim tercihleri güncellenemedi');
    }
  };

  // Account Operations
  const deactivateAccount = async () => {
    if (!window.confirm('Hesabınızı gerçekten devre dışı bırakmak istiyor musunuz?\n\nDevre dışı bırakılan hesap:\n- Giriş yapamaz\n- Rezervasyon oluşturamaz\n- E-posta/SMS alamaz\n\nHesabınızı tekrar etkinleştirmek için destek ekibimizle iletişime geçmeniz gerekir.')) {
      return;
    }
    
    try {
      // Temporary localStorage solution until backend is implemented
      localStorage.setItem(`account_status_${user.id}`, 'deactivated');
      setAccountStatus('deactivated');
      toast.success('Hesabınız devre dışı bırakıldı. Destek ekibimizle iletişime geçerek tekrar etkinleştirebilirsiniz.');
      
      // TODO: Replace with actual API call when backend endpoint is implemented
      // const token = localStorage.getItem('token');
      // await axios.put(`${API}/profile/deactivate`, {}, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
    } catch (error) {
      console.error('Error deactivating account:', error);
      toast.error('Hesap devre dışı bırakılırken hata oluştu');
    }
  };

  const deleteAccount = async (confirmationText) => {
    if (confirmationText !== 'HESABI SIL') {
      toast.error('Doğrulama metni yanlış girildi');
      return;
    }
    
    try {
      // Temporary localStorage solution until backend is implemented
      localStorage.removeItem(`user_${user.id}`);
      localStorage.removeItem(`notification_settings_${user.id}`);
      localStorage.removeItem(`account_status_${user.id}`);
      
      toast.success('Hesabınız başarıyla silindi');
      setShowDeleteModal(false);
      
      // Logout after a brief delay to show the success message
      setTimeout(() => {
        logout();
      }, 2000);
      
      // TODO: Replace with actual API call when backend endpoint is implemented
      // const token = localStorage.getItem('token');
      // await axios.delete(`${API}/profile`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Hesap silinirken hata oluştu');
    }
  };

  // Delete Account Modal Component
  const DeleteAccountModal = () => {
    const [confirmationText, setConfirmationText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    
    const handleDelete = async () => {
      setIsDeleting(true);
      await deleteAccount(confirmationText);
      setIsDeleting(false);
    };

    return showDeleteModal ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-md w-full overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-red-200 bg-red-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-900">
                  Hesabı Kalıcı Olarak Sil
                </h2>
                <p className="text-sm text-red-700">
                  Bu işlem geri alınamaz!
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="text-red-400 hover:text-red-600 text-xl"
              disabled={isDeleting}
            >
              ✕
            </button>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">⚠️ Uyarı</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Hesabınız kalıcı olarak silinecek</li>
                <li>• Tüm rezervasyonlarınız iptal edilecek</li>
                <li>• Favori turlarınız kaybolacak</li>
                <li>• Kişisel bilgileriniz silinecek</li>
                <li>• Bu işlem geri alınamaz</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Onaylamak için <strong>"HESABI SIL"</strong> yazın:
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="HESABI SIL"
                disabled={isDeleting}
              />
            </div>
          </div>
          
          <div className="p-6 border-t bg-gray-50 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isDeleting}
            >
              İptal Et
            </button>
            <button
              onClick={handleDelete}
              disabled={confirmationText !== 'HESABI SIL' || isDeleting}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Siliniyor...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Hesabı Sil</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    ) : null;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', text: 'Taslak' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Bekliyor' },
      confirmed: { color: 'bg-blue-100 text-blue-800', text: 'Onaylandı' },
      paid: { color: 'bg-green-100 text-green-800', text: 'Ödendi' },
      completed: { color: 'bg-purple-100 text-purple-800', text: 'Tamamlandı' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'İptal Edildi' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Bekliyor' },
      success: { color: 'bg-green-100 text-green-800', text: 'Başarılı' },
      failed: { color: 'bg-red-100 text-red-800', text: 'Başarısız' },
      refunded: { color: 'bg-purple-100 text-purple-800', text: 'İade Edildi' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const tabs = [
    { id: 'profile', label: 'Profil Bilgileri', icon: User },
    { id: 'bookings', label: 'Rezervasyonlarım', icon: Calendar },
    { id: 'favorites', label: 'Favorilerim', icon: Star },
    { id: 'settings', label: 'Ayarlar', icon: Edit3 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Account Deactivated Warning Banner */}
        {accountStatus === 'deactivated' && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Hesabınız Devre Dışı
                </h3>
                <div className="mt-1 text-sm text-red-700">
                  <p>
                    Hesabınız devre dışı bırakılmıştır. Yeni rezervasyon yapamaz ve bildirim alamazsınız. 
                    Hesabınızı tekrar etkinleştirmek için 
                    <a href="mailto:destek@mavibilet.com" className="font-medium underline hover:text-red-900">
                      {' '}destek ekibimizle iletişime geçin
                    </a>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user?.full_name || user?.email}
              </h1>
              <p className="text-gray-600">{user?.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user?.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : user?.role === 'vendor'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {user?.role === 'admin' ? 'Yönetici' : 
                   user?.role === 'vendor' ? 'Operatör' : 'Müşteri'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white rounded-xl p-2 shadow-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex-1 justify-center ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Profil Bilgileri</h2>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    editMode
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {editMode ? (
                    <>
                      <X className="w-4 h-4" />
                      <span>İptal</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4" />
                      <span>Düzenle</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ad Soyad
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      disabled={!editMode}
                      className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg ${
                        editMode 
                          ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                          : 'bg-gray-50'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!editMode}
                      className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg ${
                        editMode 
                          ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                          : 'bg-gray-50'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!editMode}
                      className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg ${
                        editMode 
                          ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                          : 'bg-gray-50'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Üyelik Tarihi
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={user?.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR') : ''}
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {editMode && (
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => setEditMode(false)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleProfileUpdate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Kaydet</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Rezervasyonlarım</h2>
                <div className="text-sm text-gray-600">
                  {bookings.length} rezervasyon
                </div>
              </div>

              {/* Filter Tabs */}
              {bookings.length > 0 && (
                <div className="mb-6">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                      {[
                        { key: 'all', label: 'Tümü', count: bookings.length },
                        { key: 'active', label: 'Aktif', count: bookings.filter(b => ['confirmed', 'paid'].includes(b.booking_status)).length },
                        { key: 'completed', label: 'Tamamlanan', count: bookings.filter(b => b.booking_status === 'completed').length },
                        { key: 'cancelled', label: 'İptal Edilen', count: bookings.filter(b => b.booking_status === 'cancelled').length }
                      ].map(filterItem => (
                        <button
                          key={filterItem.key}
                          onClick={() => setBookingFilter(filterItem.key)}
                          className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                            bookingFilter === filterItem.key
                              ? 'border-blue-600 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {filterItem.label}
                          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                            bookingFilter === filterItem.key 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {filterItem.count}
                          </span>
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              )}
              
              {loading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-6 shadow-lg animate-pulse">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-2">
                          <div className="bg-gray-200 h-4 w-48 rounded"></div>
                          <div className="bg-gray-200 h-3 w-32 rounded"></div>
                        </div>
                        <div className="bg-gray-200 h-6 w-20 rounded-full"></div>
                      </div>
                      <div className="bg-gray-200 h-3 w-24 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (() => {
                const filteredBookings = bookings.filter(booking => {
                  if (bookingFilter === 'all') return true;
                  if (bookingFilter === 'active') return ['confirmed', 'paid'].includes(booking.booking_status);
                  if (bookingFilter === 'completed') return booking.booking_status === 'completed';
                  if (bookingFilter === 'cancelled') return booking.booking_status === 'cancelled';
                  return true;
                });

                if (filteredBookings.length === 0) {
                  return (
                    <div className="text-center py-16">
                      <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {bookingFilter === 'all' ? 'Henüz rezervasyonunuz yok' : `${bookingFilter} rezervasyon bulunamadı`}
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Harika turları keşfetmeye başlamak için turlarımıza göz atın
                      </p>
                      <a
                        href="/turlar"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                      >
                        Turları Keşfet
                      </a>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {filteredBookings.map((booking) => (
                      <div key={booking.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="p-6">
                          {/* Header */}
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3 sm:gap-0">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {booking.tour_title || `Rezervasyon #${booking.booking_code}`}
                                </h3>
                                {booking.tour_title && (
                                  <p className="text-sm text-gray-500">#{booking.booking_code}</p>
                                )}
                                {(() => {
                                  const status = booking.booking_status;
                                  if (['confirmed', 'paid', 'completed'].includes(status)) {
                                    return <CheckCircle className="w-5 h-5 text-green-500" />;
                                  } else if (status === 'cancelled') {
                                    return <XCircle className="w-5 h-5 text-red-500" />;
                                  } else {
                                    return <AlertCircle className="w-5 h-5 text-yellow-500" />;
                                  }
                                })()}
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{new Date(booking.created_at).toLocaleDateString('tr-TR')}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Users className="w-4 h-4" />
                                  <span>{booking.participants || 0} Kişi</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              {getStatusBadge(booking.booking_status)}
                              <div className="mt-2 text-lg font-bold text-blue-600">
                                ₺{booking.total_price ? booking.total_price.toLocaleString('tr-TR') : '0'}
                              </div>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="border-t border-gray-100 pt-4 mt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Rezervasyon Detayı:</span>
                                <p className="text-gray-600 mt-1">
                                  {(() => {
                                    if (booking.reservation_type === 'person_based') {
                                      const childCount = booking.child_count || 0;
                                      return `${booking.participants || 0} Yetişkin${childCount > 0 ? ` + ${childCount} Çocuk` : ''}`;
                                    } else if (booking.reservation_type === 'reservation') {
                                      return `Tüm Tekne / Sabit Fiyat`;
                                    } else {
                                      const singleCount = booking.single_cabin_count || 0;
                                      const doubleCount = booking.double_cabin_count || 0;
                                      
                                      if (singleCount > 0 || doubleCount > 0) {
                                        const parts = [];
                                        if (singleCount > 0) parts.push(`${singleCount} × Tek Kişilik`);
                                        if (doubleCount > 0) parts.push(`${doubleCount} × Çift Kişilik`);
                                        return parts.join(' + ');
                                      }
                                      
                                      return `${booking.participants} × ${booking.cabin_type === 'double' ? 'Çift Kişilik' : 'Tek Kişilik'}`;
                                    }
                                  })()}
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Ödeme Durumu:</span>
                                <div className="mt-1">
                                  {getPaymentStatusBadge(booking.payment_status)}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Son Güncelleme:</span>
                                <p className="text-gray-600 mt-1">{new Date(booking.updated_at).toLocaleDateString('tr-TR')}</p>
                              </div>
                            </div>

                            {booking.special_requests && (
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <span className="text-sm font-medium text-blue-900">Özel İstekler:</span>
                                <p className="text-sm text-blue-800 mt-1">{booking.special_requests}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Favorilerim</h2>
              
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl overflow-hidden shadow-lg animate-pulse">
                      <div className="h-48 bg-gray-200"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-5 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-16">
                  <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Henüz favori turunuz yok
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Beğendiğiniz turları favorilere ekleyerek daha sonra kolayca bulabilirsiniz
                  </p>
                  <a
                    href="/turlar"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    Turları Keşfet
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {favorites.map((tour) => (
                    <TourCard key={tour.id} tour={tour} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Ayarlar</h2>
              
              <div className="space-y-6">
                {/* Bildirim Tercihleri */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Bell className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Bildirim Tercihleri</h3>
                      <p className="text-sm text-gray-600">Hangi bildirimleri almak istediğinizi seçin</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <span className="font-medium text-gray-900">E-posta bildirimleri</span>
                          <p className="text-sm text-gray-600">Rezervasyon onayları ve güncellemeleri</p>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                        checked={notificationSettings.email_notifications}
                        onChange={(e) => updateNotificationSettings({
                          ...notificationSettings,
                          email_notifications: e.target.checked
                        })}
                      />
                    </label>
                    
                    <label className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <span className="font-medium text-gray-900">SMS bildirimleri</span>
                          <p className="text-sm text-gray-600">Acil bildirimler ve hatırlatmalar</p>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                        checked={notificationSettings.sms_notifications}
                        onChange={(e) => updateNotificationSettings({
                          ...notificationSettings,
                          sms_notifications: e.target.checked
                        })}
                      />
                    </label>
                    
                    <label className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Star className="w-5 h-5 text-gray-400" />
                        <div>
                          <span className="font-medium text-gray-900">Pazarlama e-postaları</span>
                          <p className="text-sm text-gray-600">Özel teklifler ve kampanyalar</p>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                        checked={notificationSettings.marketing_emails}
                        onChange={(e) => updateNotificationSettings({
                          ...notificationSettings,
                          marketing_emails: e.target.checked
                        })}
                      />
                    </label>
                  </div>
                </div>

                {/* Güvenlik */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Güvenlik</h3>
                      <p className="text-sm text-gray-600">Hesap güvenliğinizi yönetin</p>
                    </div>
                  </div>
                  
                  {!passwordMode ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Şifre</h4>
                          <p className="text-sm text-gray-600">Son değiştirme: 2 ay önce</p>
                        </div>
                        <button 
                          onClick={() => setPasswordMode(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          Şifre Değiştir
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mevcut Şifre
                        </label>
                        <input
                          type="password"
                          value={passwordData.current_password}
                          onChange={(e) => setPasswordData(prev => ({
                            ...prev,
                            current_password: e.target.value
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Mevcut şifrenizi girin"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Yeni Şifre
                        </label>
                        <input
                          type="password"
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData(prev => ({
                            ...prev,
                            new_password: e.target.value
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Yeni şifrenizi girin (min. 6 karakter)"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Yeni Şifre Tekrar
                        </label>
                        <input
                          type="password"
                          value={passwordData.confirm_password}
                          onChange={(e) => setPasswordData(prev => ({
                            ...prev,
                            confirm_password: e.target.value
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Yeni şifrenizi tekrar girin"
                        />
                      </div>
                      
                      <div className="flex space-x-3 pt-2">
                        <button
                          onClick={handlePasswordChange}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          Şifreyi Değiştir
                        </button>
                        <button
                          onClick={() => {
                            setPasswordMode(false);
                            setPasswordData({
                              current_password: '',
                              new_password: '',
                              confirm_password: ''
                            });
                          }}
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hesap İşlemleri */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-900">Hesap İşlemleri</h3>
                      <p className="text-sm text-red-700">Hesabınızla ilgili önemli işlemler</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg border border-red-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-red-900">Hesabı Devre Dışı Bırak</h4>
                          <p className="text-sm text-red-700">Hesabınızı geçici olarak devre dışı bırakın</p>
                        </div>
                        <button 
                          onClick={deactivateAccount}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          Devre Dışı Bırak
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-red-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-red-900">Hesabı Kalıcı Olarak Sil</h4>
                          <p className="text-sm text-red-700">Bu işlem geri alınamaz!</p>
                        </div>
                        <button 
                          onClick={deleteAccount}
                          className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Hesabı Sil</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Çıkış Yap */}
                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={logout}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <span>Çıkış Yap</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;