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
  X
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
    }
  }, [user]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/bookings`);
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
      const response = await axios.get(`${API}/favorites`);
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
      await axios.delete(`${API}/favorites/${tourId}`);
      toast.success('Favorilerden çıkarıldı');
      loadFavorites();
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Favorilerden çıkarılırken hata oluştu');
    }
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
              <h2 className="text-xl font-bold text-gray-900 mb-6">Rezervasyonlarım</h2>
              
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-6 animate-pulse">
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
              ) : bookings.length === 0 ? (
                <div className="text-center py-16">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Henüz rezervasyonunuz yok
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Harika turlar keşfetmek ve rezervasyon yapmak için turlarımıza göz atın
                  </p>
                  <a
                    href="/turlar"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    Turları Keşfet
                  </a>
                </div>
              ) : (
                <div className="space-y-6">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            Rezervasyon #{booking.booking_code}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(booking.created_at).toLocaleDateString('tr-TR')}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {getStatusBadge(booking.booking_status)}
                          {getPaymentStatusBadge(booking.payment_status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Rezervasyon:</span>
                          <p className="font-medium">
                            {(() => {
                              if (booking.reservation_type === 'person_based') {
                                const childCount = booking.child_count || 0;
                                return `${booking.participants || 0} Yetişkin${childCount > 0 ? ` + ${childCount} Çocuk` : ''}`;
                              } else if (booking.reservation_type === 'reservation') {
                                return `Tüm Tekne / Sabit Fiyat`;
                              } else {
                                // cabin_based - yeni format
                                const singleCount = booking.single_cabin_count || 0;
                                const doubleCount = booking.double_cabin_count || 0;
                                
                                if (singleCount > 0 || doubleCount > 0) {
                                  const parts = [];
                                  if (singleCount > 0) parts.push(`${singleCount} × Tek Kişilik`);
                                  if (doubleCount > 0) parts.push(`${doubleCount} × Çift Kişilik`);
                                  return parts.join(' + ');
                                }
                                
                                // Fallback: eski format
                                return `${booking.participants} × ${booking.cabin_type === 'double' ? 'Çift Kişilik' : 'Tek Kişilik'}`;
                              }
                            })()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Toplam Tutar:</span>
                          <p className="font-medium text-blue-600">₺{booking.total_price ? booking.total_price.toLocaleString('tr-TR') : '0'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Güncelleme:</span>
                          <p className="font-medium">{new Date(booking.updated_at).toLocaleDateString('tr-TR')}</p>
                        </div>
                      </div>

                      {booking.special_requests && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <span className="text-sm font-medium text-blue-900">Özel İstekler:</span>
                          <p className="text-sm text-blue-800 mt-1">{booking.special_requests}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Favorilerim</h2>
              
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-white rounded-xl shadow p-4">
                      <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                      <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                      <div className="bg-gray-200 h-3 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : favorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((tour) => (
                    <div key={tour.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                      <div className="relative h-48">
                        <img
                          src={tour.images?.[0] || '/placeholder-tour.jpg'}
                          alt={tour.title}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeFavorite(tour.id)}
                          className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow transition-all duration-200"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                      
                      <div className="p-4">
                        <div className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>{tour.location}</span>
                        </div>
                        
                        <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">
                          {tour.title}
                        </h3>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {tour.short_description}
                        </p>
                        
                        <div className="flex items-center justify-between mb-4">
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
                            <span className="text-sm text-gray-500 ml-1">
                              ({tour.review_count || 0})
                            </span>
                          </div>
                          
                          <div className="text-lg font-bold text-blue-600">
                            ₺{tour.minimum_price?.toLocaleString('tr-TR')}
                          </div>
                        </div>
                        
                        <a
                          href={`/turlar/${tour.id}`}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-center block transition-colors duration-200"
                        >
                          Detayları Görüntüle
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Henüz favori turunuz yok
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Beğendiğiniz turları favorilere ekleyerek daha kolay erişebilirsiniz
                  </p>
                  <a
                    href="/turlar"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    Turları Keşfet
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Ayarlar</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Bildirim Tercihleri</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm text-gray-700">E-posta bildirimleri</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm text-gray-700">SMS bildirimleri</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm text-gray-700">Pazarlama e-postaları</span>
                    </label>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Güvenlik</h3>
                  
                  {!passwordMode ? (
                    <div className="space-y-3">
                      <button 
                        onClick={() => setPasswordMode(true)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200"
                      >
                        Şifre Değiştir
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        />
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={handlePasswordChange}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
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
                          className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="font-semibold text-red-900 mb-3">Hesap İşlemleri</h3>
                  <div className="space-y-3">
                    <button className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors duration-200">
                      Hesabı Devre Dışı Bırak
                    </button>
                    <br />
                    <button className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors duration-200">
                      Hesabı Sil
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <button
                    onClick={logout}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    Çıkış Yap
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