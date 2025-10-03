import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { 
  BarChart3, 
  Users, 
  MapPin, 
  Calendar,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddTour, setShowAddTour] = useState(false);
  const [showEditTour, setShowEditTour] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTour, setSelectedTour] = useState(null);
  const [tours, setTours] = useState([]);
  const [users, setUsers] = useState([]);
  const [tourLoading, setTourLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboard();
    } else if (activeTab === 'tours') {
      loadTours();
    } else if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/dashboard`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Dashboard verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const loadTours = async () => {
    setTourLoading(true);
    try {
      const response = await axios.get(`${API}/admin/tours`);
      setTours(response.data);
    } catch (error) {
      console.error('Error loading tours:', error);
      toast.error('Turlar yüklenemedi');
    } finally {
      setTourLoading(false);
    }
  };
  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTour = async (tourId) => {
    try {
      await axios.delete(`${API}/admin/tours/${tourId}`);
      toast.success('Tur başarıyla silindi');
      loadTours();
      setShowDeleteConfirm(false);
      setSelectedTour(null);
    } catch (error) {
      console.error('Error deleting tour:', error);
      toast.error(error.response?.data?.detail || 'Tur silinirken hata oluştu');
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      await axios.put(`${API}/admin/users/${userId}/status`);
      // Reload users to get updated data
      loadUsers();
      toast.success('Kullanıcı durumu güncellendi');
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error(error.response?.data?.detail || 'Kullanıcı durumu güncellenirken hata oluştu');
    }
  };

  // Admin kontrolü sadece debug için
  console.log('AdminPage loaded - User:', user?.email, 'Role:', user?.role);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'tours', label: 'Turlar', icon: MapPin },
    { id: 'bookings', label: 'Rezervasyonlar', icon: Calendar },
    { id: 'users', label: 'Kullanıcılar', icon: Users },
    { id: 'vendors', label: 'Operatörler', icon: Users },
    { id: 'reviews', label: 'Değerlendirmeler', icon: Eye }
  ];

  const StatCard = ({ title, value, icon: Icon, change, color = "blue" }) => (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${
              change > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Paneli</h1>
          <p className="text-gray-600">Platform yönetimi ve istatistikleri</p>
        </div>

        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white rounded-xl p-2 shadow-lg overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Dashboard</h2>
              
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-6 animate-pulse">
                      <div className="flex justify-between items-center">
                        <div className="space-y-2">
                          <div className="bg-gray-200 h-4 w-24 rounded"></div>
                          <div className="bg-gray-200 h-8 w-16 rounded"></div>
                        </div>
                        <div className="bg-gray-200 w-12 h-12 rounded-lg"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : dashboardData ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                      title="Toplam Tur"
                      value={dashboardData.total_tours}
                      icon={MapPin}
                      color="blue"
                    />
                    <StatCard
                      title="Toplam Rezervasyon"
                      value={dashboardData.total_bookings}
                      icon={Calendar}
                      color="green"
                    />
                    <StatCard
                      title="Toplam Kullanıcı"
                      value={dashboardData.total_users}
                      icon={Users}
                      color="purple"
                    />
                    <StatCard
                      title="Toplam Gelir"
                      value={`₺${dashboardData.total_revenue || 0}`}
                      icon={DollarSign}
                      color="yellow"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Aktiviteler</h3>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Yeni rezervasyon alındı</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Yeni tur eklendi</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Yeni kullanıcı kaydı</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Popüler Kategoriler</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Kültürel Turlar</span>
                          <span className="text-sm font-medium text-gray-900">35%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Doğa Turları</span>
                          <span className="text-sm font-medium text-gray-900">28%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Macera Turları</span>
                          <span className="text-sm font-medium text-gray-900">20%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Şehir Turları</span>
                          <span className="text-sm font-medium text-gray-900">17%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* Tours Management Tab */}
          {activeTab === 'tours' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Tur Yönetimi</h2>
                <button 
                  onClick={() => setShowAddTour(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yeni Tur</span>
                </button>
              </div>

              {tourLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse border-b border-gray-100 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="bg-gray-200 w-12 h-12 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="bg-gray-200 h-4 w-48 rounded"></div>
                          <div className="bg-gray-200 h-3 w-32 rounded"></div>
                        </div>
                        <div className="bg-gray-200 h-6 w-20 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Tur</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Lokasyon</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Kategori</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Fiyat</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Durum</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tours.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-8 text-gray-500">
                            Henüz tur eklenmemiş
                          </td>
                        </tr>
                      ) : (
                        tours.map((tour) => (
                          <tr key={tour.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={tour.images[0] || '/placeholder-tour.jpg'}
                                  alt={tour.title}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                                <div>
                                  <p className="font-medium text-gray-900 max-w-xs truncate">
                                    {tour.title}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {tour.duration_days} gün • {tour.max_participants} kişi
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-gray-700">
                              {tour.location}
                            </td>
                            <td className="py-4 px-4">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                {tour.category}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-gray-700">
                              ₺{tour.base_price}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                tour.status === 'active' 
                                  ? 'bg-green-100 text-green-800'
                                  : tour.status === 'draft'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {tour.status === 'active' ? 'Aktif' :
                                 tour.status === 'draft' ? 'Taslak' : 
                                 tour.status === 'inactive' ? 'Pasif' : 'Arşiv'}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => window.open(`/tours/${tour.id}`, '_blank')}
                                  className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors duration-200"
                                  title="Görüntüle"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => {
                                    setSelectedTour(tour);
                                    setShowEditTour(true);
                                  }}
                                  className="text-green-600 hover:text-green-700 p-1 rounded transition-colors duration-200"
                                  title="Düzenle"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => {
                                    setSelectedTour(tour);
                                    setShowDeleteConfirm(true);
                                  }}
                                  className="text-red-600 hover:text-red-700 p-1 rounded transition-colors duration-200"
                                  title="Sil"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  
                  {tours.length > 0 && (
                    <div className="mt-4 text-sm text-gray-600 text-center">
                      Toplam {tours.length} tur bulundu
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Kullanıcı Yönetimi</h2>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center space-x-4">
                        <div className="bg-gray-200 w-12 h-12 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="bg-gray-200 h-4 w-1/4 rounded"></div>
                          <div className="bg-gray-200 h-3 w-1/3 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Kullanıcı</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Telefon</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Rol</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Durum</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Kayıt Tarihi</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-8 text-gray-500">
                            Henüz kullanıcı yok
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm">
                                    {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{user.full_name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-gray-700">{user.email}</td>
                            <td className="py-4 px-4 text-gray-700">{user.phone || '-'}</td>
                            <td className="py-4 px-4">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                user.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-800'
                                  : user.role === 'vendor'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {user.role === 'admin' ? 'Yönetici' :
                                 user.role === 'vendor' ? 'Operatör' : 'Müşteri'}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                user.is_active 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {user.is_active ? 'Aktif' : 'Pasif'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-gray-700">
                              {new Date(user.created_at).toLocaleDateString('tr-TR')}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleToggleUserStatus(user.id)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                  title={user.is_active ? 'Deaktif Et' : 'Aktif Et'}
                                >
                                  {user.is_active ? '🔒' : '🔓'}
                                </button>
                                <button
                                  onClick={() => {
                                    console.log('Edit user:', user.id);
                                  }}
                                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                                  title="Düzenle"
                                >
                                  ✏️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  
                  {users.length > 0 && (
                    <div className="mt-4 text-sm text-gray-600 text-center">
                      Toplam {users.length} kullanıcı bulundu
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Other tabs content */}
          {activeTab !== 'dashboard' && activeTab !== 'tours' && activeTab !== 'users' && (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">🚧</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Bu bölüm yapım aşamasında
              </h3>
              <p className="text-gray-600">
                {tabs.find(t => t.id === activeTab)?.label} yönetimi yakında eklenecek
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tour Add/Edit Modal */}
      {(showAddTour || showEditTour) && (
        <TourModal
          tour={selectedTour}
          isEdit={showEditTour}
          onClose={() => {
            setShowAddTour(false);
            setShowEditTour(false);
            setSelectedTour(null);
          }}
          onSave={() => {
            loadTours();
            setShowAddTour(false);
            setShowEditTour(false);
            setSelectedTour(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Turu Sil
            </h3>
            <p className="text-gray-600 mb-6">
              "{selectedTour?.title}" adlı turu silmek istediğinizden emin misiniz? 
              Bu işlem geri alınamaz.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedTour(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                İptal
              </button>
              <button
                onClick={() => handleDeleteTour(selectedTour.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Tour Modal Component
const TourModal = ({ tour, isEdit, onClose, onSave }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: tour?.title || '',
    description: tour?.description || '',
    short_description: tour?.short_description || '',
    location: tour?.location || '',
    duration_days: tour?.duration_days || 1,
    duration_hours: tour?.duration_hours || 0,
    base_price: tour?.base_price || '',
    max_participants: tour?.max_participants || 1,
    category: tour?.category || 'cultural',
    images: tour?.images || [],
    included_services: tour?.included_services || [],
    excluded_services: tour?.excluded_services || [],
    meeting_point: tour?.meeting_point || '',
    languages: tour?.languages || ['Turkish'],
    difficulty_level: tour?.difficulty_level || 'Easy',
    cancellation_policy: tour?.cancellation_policy || '',
    tags: tour?.tags || [],
    status: tour?.status || 'draft'
  });
  
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [newIncludedService, setNewIncludedService] = useState('');
  const [newExcludedService, setNewExcludedService] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newImage, setNewImage] = useState('');

  const steps = [
    { id: 1, title: 'Temel Bilgiler', icon: '📝' },
    { id: 2, title: 'Görsel & Medya', icon: '📸' },
    { id: 3, title: 'Hizmetler & Detaylar', icon: '⚙️' },
    { id: 4, title: 'Ayarlar & Onay', icon: '✅' }
  ];

  const categories = [
    { value: 'cultural', label: 'Kültürel' },
    { value: 'nature', label: 'Doğa' },
    { value: 'adventure', label: 'Macera' },
    { value: 'city', label: 'Şehir' },
    { value: 'historical', label: 'Tarihi' },
    { value: 'food', label: 'Gastronomi' }
  ];

  const statusOptions = [
    { value: 'draft', label: 'Taslak' },
    { value: 'active', label: 'Aktif' },
    { value: 'inactive', label: 'Pasif' },
    { value: 'archived', label: 'Arşiv' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
      
      if (isEdit) {
        await axios.put(`${API}/admin/tours/${tour.id}`, formData);
        toast.success('Tur başarıyla güncellendi');
      } else {
        await axios.post(`${API}/admin/tours`, formData);
        toast.success('Tur başarıyla oluşturuldu');
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving tour:', error);
      toast.error(error.response?.data?.detail || 'Tur kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const addToList = (listName, newItem, setNewItem) => {
    if (newItem.trim()) {
      setFormData(prev => ({
        ...prev,
        [listName]: [...prev[listName], newItem.trim()]
      }));
      setNewItem('');
    }
  };

  const removeFromList = (listName, index) => {
    setFormData(prev => ({
      ...prev,
      [listName]: prev[listName].filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    setUploadLoading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const formDataToUpload = new FormData();
        formDataToUpload.append('file', file);

        const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/upload/image`, formDataToUpload, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        return {
          url: response.data.url,
          filename: file.name,
          isPrimary: false
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      
      // Add uploaded images to images array
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages.map(img => img.url)]
      }));

      toast.success(`${uploadedImages.length} resim başarıyla yüklendi`);
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Resimler yüklenirken hata oluştu');
    } finally {
      setUploadLoading(false);
    }
  };

  const moveImage = (fromIndex, toIndex) => {
    const newImages = [...formData.images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setFormData({...formData, images: newImages});
  };

  const setAsPrimaryImage = (index) => {
    const newImages = [...formData.images];
    const [primaryImage] = newImages.splice(index, 1);
    newImages.unshift(primaryImage);
    setFormData({...formData, images: newImages});
    toast.success('Ana resim olarak ayarlandı');
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.title && formData.location && formData.category && 
               formData.duration_days && formData.base_price && formData.max_participants;
      case 2:
        return true; // Images optional
      case 3:
        return true; // Services optional
      case 4:
        return true; // Final validation
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, 4));
    } else {
      toast.error('Lütfen zorunlu alanları doldurun');
    }
  };

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const canProceed = validateStep(currentStep);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Wizard Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Tur Düzenle' : 'Yeni Tur Sihirbazı'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                  currentStep >= step.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step.id ? '✓' : step.icon}
                </div>
                <div className="ml-3 hidden md:block">
                  <div className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden md:block w-16 h-0.5 ml-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Step Content */}
          <div className="min-h-[400px]">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Temel Bilgiler</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tur Başlığı *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lokasyon *
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategori *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durum
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {statusOptions.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Süre (Gün) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.duration_days}
                      onChange={(e) => setFormData({...formData, duration_days: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fiyat (₺) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.base_price}
                      onChange={(e) => setFormData({...formData, base_price: parseFloat(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maksimum Katılımcı *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.max_participants}
                      onChange={(e) => setFormData({...formData, max_participants: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Süre (Saat)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={formData.duration_hours}
                      onChange={(e) => setFormData({...formData, duration_hours: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kısa Açıklama *
                    </label>
                    <input
                      type="text"
                      value={formData.short_description}
                      onChange={(e) => setFormData({...formData, short_description: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tur hakkında kısa açıklama"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Detaylı Açıklama *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tur hakkında detaylı bilgi"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Images */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📸 Görsel & Medya</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tur Görselleri
                  </label>

                  {/* Image Upload Section */}

                  <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors">
                    <div className="text-center">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                        disabled={uploadLoading}
                      />
                      <label
                        htmlFor="image-upload"
                        className={`cursor-pointer inline-flex items-center space-x-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                          uploadLoading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200`}
                      >
                        {uploadLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Yükleniyor...</span>
                          </>
                        ) : (
                          <>
                            <span>📸</span>
                            <span>Resim Yükle</span>
                          </>
                        )}
                      </label>
                      <p className="mt-2 text-sm text-gray-600">
                        Birden fazla resim seçebilirsiniz • JPG, PNG, WebP
                      </p>
                    </div>
                  </div>

                  {/* Image Gallery Preview */}
                  {formData.images.length > 0 && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <span>📷</span>
                        <span className="ml-2">Yüklenen Resimler ({formData.images.length})</span>
                        {formData.images.length > 0 && (
                          <span className="ml-2 text-sm text-blue-600">• İlk resim ana resimdir</span>
                        )}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {formData.images.map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <div className={`relative rounded-lg overflow-hidden ${index === 0 ? 'ring-2 ring-blue-500' : ''}`}>
                              <img
                                src={imageUrl}
                                alt={`Tur resmi ${index + 1}`}
                                className="w-full h-24 object-cover"
                                onError={(e) => {
                                  e.target.src = '/placeholder-tour.jpg';
                                }}
                              />
                              {index === 0 && (
                                <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                  Ana Resim
                                </div>
                              )}
                              
                              {/* Overlay with controls */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                                  {index !== 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setAsPrimaryImage(index)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded text-xs"
                                      title="Ana resim yap"
                                    >
                                      ⭐
                                    </button>
                                  )}
                                  {index > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => moveImage(index, index - 1)}
                                      className="bg-gray-600 hover:bg-gray-700 text-white p-1 rounded text-xs"
                                      title="Yukarı taşı"
                                    >
                                      ↑
                                    </button>
                                  )}
                                  {index < formData.images.length - 1 && (
                                    <button
                                      type="button"
                                      onClick={() => moveImage(index, index + 1)}
                                      className="bg-gray-600 hover:bg-gray-700 text-white p-1 rounded text-xs"
                                      title="Aşağı taşı"
                                    >
                                      ↓
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeFromList('images', index)}
                                    className="bg-red-600 hover:bg-red-700 text-white p-1 rounded text-xs"
                                    title="Sil"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Manual URL Input */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Manuel URL Ekleme</h4>
                    <div className="space-y-2">
                      {formData.images.map((image, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="url"
                            value={image}
                            onChange={(e) => {
                              const newImages = [...formData.images];
                              newImages[index] = e.target.value;
                              setFormData({...formData, images: newImages});
                            }}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://example.com/image.jpg"
                          />
                          <button
                            type="button"
                            onClick={() => removeFromList('images', index)}
                            className="text-red-600 hover:text-red-700 p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center space-x-2">
                        <input
                          type="url"
                          value={newImage}
                          onChange={(e) => setNewImage(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Yeni görsel URL'si ekle"
                        />
                        <button
                          type="button"
                          onClick={() => addToList('images', newImage, setNewImage)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                          Ekle
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fiyat (₺) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.base_price}
                onChange={(e) => setFormData({...formData, base_price: parseFloat(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Katılımcı *
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_participants}
                onChange={(e) => setFormData({...formData, max_participants: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Descriptions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kısa Açıklama *
            </label>
            <input
              type="text"
              value={formData.short_description}
              onChange={(e) => setFormData({...formData, short_description: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tur hakkında kısa açıklama"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detaylı Açıklama *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tur hakkında detaylı bilgi"
              required
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Görsel URL'leri
            </label>
            
            {/* Image Upload */}
            <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors">
              <div className="text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={uploadLoading}
                />
                <label
                  htmlFor="image-upload"
                  className={`cursor-pointer inline-flex items-center space-x-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    uploadLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200`}
                >
                  {uploadLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Yükleniyor...</span>
                    </>
                  ) : (
                    <>
                      <span>📸</span>
                      <span>Resim Yükle</span>
                    </>
                  )}
                </label>
                <p className="mt-2 text-sm text-gray-600">
                  Birden fazla resim seçebilirsiniz • JPG, PNG, WebP
                </p>
              </div>
            </div>

            {/* Image Gallery Preview */}
            {formData.images.length > 0 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <span>📷</span>
                  <span className="ml-2">Yüklenen Resimler ({formData.images.length})</span>
                  {formData.images.length > 0 && (
                    <span className="ml-2 text-sm text-blue-600">• İlk resim ana resimdir</span>
                  )}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {formData.images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <div className={`relative rounded-lg overflow-hidden ${index === 0 ? 'ring-2 ring-blue-500' : ''}`}>
                        <img
                          src={imageUrl}
                          alt={`Tur resmi ${index + 1}`}
                          className="w-full h-24 object-cover"
                          onError={(e) => {
                            e.target.src = '/placeholder-tour.jpg';
                          }}
                        />
                        {index === 0 && (
                          <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            Ana Resim
                          </div>
                        )}
                        
                        {/* Overlay with controls */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                            {index !== 0 && (
                              <button
                                type="button"
                                onClick={() => setAsPrimaryImage(index)}
                                className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded text-xs"
                                title="Ana resim yap"
                              >
                                ⭐
                              </button>
                            )}
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => moveImage(index, index - 1)}
                                className="bg-gray-600 hover:bg-gray-700 text-white p-1 rounded text-xs"
                                title="Yukarı taşı"
                              >
                                ↑
                              </button>
                            )}
                            {index < formData.images.length - 1 && (
                              <button
                                type="button"
                                onClick={() => moveImage(index, index + 1)}
                                className="bg-gray-600 hover:bg-gray-700 text-white p-1 rounded text-xs"
                                title="Aşağı taşı"
                              >
                                ↓
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeFromList('images', index)}
                              className="bg-red-600 hover:bg-red-700 text-white p-1 rounded text-xs"
                              title="Sil"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manual URL Input */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Manuel URL Ekleme</h4>

            <div className="space-y-2">
              {formData.images.map((image, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => {
                      const newImages = [...formData.images];
                      newImages[index] = e.target.value;
                      setFormData({...formData, images: newImages});
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                  <button
                    type="button"
                    onClick={() => removeFromList('images', index)}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <input
                  type="url"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Yeni görsel URL'si ekle"
                />
                <button
                  type="button"
                  onClick={() => addToList('images', newImage, setNewImage)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Ekle
                </button>
              </div>
            </div>
          </div>

          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-2 border border-gray-300 rounded-lg transition-colors duration-200 ${
                currentStep === 1 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              ← Önceki
            </button>

            <div className="text-sm text-gray-500">
              {currentStep} / {steps.length}
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                İptal
              </button>
              
              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed}
                  className={`px-6 py-2 rounded-lg transition-colors duration-200 ${
                    canProceed 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Sonraki →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !canProceed}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>{isEdit ? 'Güncelle' : 'Tur Oluştur'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPage;