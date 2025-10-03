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
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tourLoading, setTourLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboard();
    } else if (activeTab === 'tours') {
      loadTours();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'locations') {
      loadLocations();
    } else if (activeTab === 'categories') {
      loadCategories();
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
  const loadLocations = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/locations`);
      setLocations(response.data);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Lokasyonlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Kategoriler yüklenemedi');
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

  const handleToggleLocationStatus = async (locationId) => {
    try {
      await axios.put(`${API}/admin/locations/${locationId}/status`);
      // Reload locations to get updated data
      loadLocations();
      toast.success('Lokasyon durumu güncellendi');
    } catch (error) {
      console.error('Error toggling location status:', error);
      toast.error(error.response?.data?.detail || 'Lokasyon durumu güncellenirken hata oluştu');
    }
  };

  const handleToggleCategoryStatus = async (categoryId) => {
    try {
      await axios.put(`${API}/admin/categories/${categoryId}/status`);
      // Reload categories to get updated data
      loadCategories();
      toast.success('Kategori durumu güncellendi');
    } catch (error) {
      console.error('Error toggling category status:', error);
      toast.error(error.response?.data?.detail || 'Kategori durumu güncellenirken hata oluştu');
    }
  };

  // Admin kontrolü sadece debug için
  console.log('AdminPage loaded - User:', user?.email, 'Role:', user?.role);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '●' },
    { id: 'tours', label: 'Turlar', icon: '▲' },
    { id: 'users', label: 'Kullanıcılar', icon: '◆' },
    { id: 'locations', label: 'Lokasyonlar', icon: '◐' },
    { id: 'categories', label: 'Kategoriler', icon: '◈' },
    { id: 'bookings', label: 'Rezervasyonlar', icon: '◇' },
    { id: 'reviews', label: 'Değerlendirmeler', icon: '◉' }
  ];

  const StatCard = ({ title, value, icon, change, color = "blue" }) => (
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
        <div className={`w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center`}>
          <span className="text-2xl">{icon}</span>
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
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
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
                      icon="▲"
                      color="blue"
                    />
                    <StatCard
                      title="Toplam Rezervasyon"
                      value={dashboardData.total_bookings}
                      icon="◇"
                      color="green"
                    />
                    <StatCard
                      title="Toplam Kullanıcı"
                      value={dashboardData.total_users}
                      icon="◆"
                      color="purple"
                    />
                    <StatCard
                      title="Toplam Gelir"
                      value={`₺${dashboardData.total_revenue || 0}`}
                      icon="●"
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

          {/* Locations Tab */}
          {activeTab === 'locations' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Lokasyon Yönetimi</h2>
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <span>◐</span>
                  <span>Yeni Lokasyon</span>
                </button>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center space-x-4">
                        <div className="bg-gray-200 w-16 h-16 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="bg-gray-200 h-4 w-1/4 rounded"></div>
                          <div className="bg-gray-200 h-3 w-1/2 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {locations.map((location) => (
                    <div key={location.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-gray-900">{location.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                          location.is_active 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {location.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                      {location.description && (
                        <p className="text-gray-600 text-sm mb-3">{location.description}</p>
                      )}
                      <div className="text-sm text-gray-500 mb-4">
                        <span>🌍 {location.country}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingLocation(location);
                            setShowLocationModal(true);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors duration-200"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleToggleLocationStatus(location.id)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm transition-colors duration-200"
                        >
                          {location.is_active ? 'Deaktif Et' : 'Aktif Et'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && locations.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-4xl mb-4">◐</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Henüz lokasyon yok
                  </h3>
                  <p className="text-gray-600 mb-4">
                    İlk lokasyonunuzu ekleyerek başlayın
                  </p>
                  <button
                    onClick={() => setShowLocationModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
                  >
                    Lokasyon Ekle
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Kategori Yönetimi</h2>
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <span>◈</span>
                  <span>Yeni Kategori</span>
                </button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-50 rounded-xl p-6">
                      <div className="bg-gray-200 w-full h-32 rounded-lg mb-4"></div>
                      <div className="space-y-2">
                        <div className="bg-gray-200 h-4 w-3/4 rounded"></div>
                        <div className="bg-gray-200 h-3 w-full rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories.map((category) => (
                    <div key={category.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                      <div className="h-32 bg-gradient-to-r from-blue-400 to-purple-500 relative">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-4xl text-white">{category.icon || '🏷️'}</span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                            category.is_active 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {category.is_active ? 'Aktif' : 'Pasif'}
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{category.name}</h3>
                        {category.description && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{category.description}</p>
                        )}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingCategory(category);
                              setShowCategoryModal(true);
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors duration-200"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleToggleCategoryStatus(category.id)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm transition-colors duration-200"
                          >
                            {category.is_active ? 'Deaktif Et' : 'Aktif Et'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && categories.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-4xl mb-4">◈</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Henüz kategori yok
                  </h3>
                  <p className="text-gray-600 mb-4">
                    İlk kategorinizi ekleyerek başlayın
                  </p>
                  <button
                    onClick={() => setShowCategoryModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
                  >
                    Kategori Ekle
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Other tabs content */}
          {activeTab !== 'dashboard' && activeTab !== 'tours' && activeTab !== 'users' && 
           activeTab !== 'locations' && activeTab !== 'categories' && (
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

      {/* Location Modal */}
      {showLocationModal && (
        <LocationModal
          location={editingLocation}
          onClose={() => {
            setShowLocationModal(false);
            setEditingLocation(null);
          }}
          onSave={loadLocations}
        />
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
          onSave={loadCategories}
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
    status: tour?.status || 'draft',
    tour_dates: tour?.tour_dates || []
  });
  
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [newIncludedService, setNewIncludedService] = useState('');
  const [newExcludedService, setNewExcludedService] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newImage, setNewImage] = useState('');
  const [availableLocations, setAvailableLocations] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [newTourDate, setNewTourDate] = useState({ date: '', price: '', capacity: '' });

  const steps = [
    { id: 1, title: 'Temel Bilgiler', icon: '●' },
    { id: 2, title: 'Görsel & Medya', icon: '◆' },
    { id: 3, title: 'Tarih & Fiyat', icon: '◇' },
    { id: 4, title: 'Hizmetler & Detaylar', icon: '◈' },
    { id: 5, title: 'Ayarlar & Onay', icon: '◉' }
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
        return formData.tour_dates.length > 0; // At least one tour date
      case 4:
        return true; // Services optional
      case 5:
        return true; // Final validation
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, 5));
    } else {
      toast.error('Lütfen zorunlu alanları doldurun');
    }
  };

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const canProceed = validateStep(currentStep);

  // Load locations and categories on mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [locationsRes, categoriesRes] = await Promise.all([
          axios.get(`${API}/admin/locations`),
          axios.get(`${API}/admin/categories`)
        ]);
        setAvailableLocations(locationsRes.data);
        setAvailableCategories(categoriesRes.data);
      } catch (error) {
        console.error('Error loading options:', error);
      }
    };
    loadOptions();
  }, []);

  const addTourDate = () => {
    if (newTourDate.date && newTourDate.price && newTourDate.capacity) {
      setFormData(prev => ({
        ...prev,
        tour_dates: [...prev.tour_dates, { 
          ...newTourDate, 
          id: Date.now().toString(),
          price: parseFloat(newTourDate.price),
          capacity: parseInt(newTourDate.capacity)
        }]
      }));
      setNewTourDate({ date: '', price: '', capacity: '' });
    }
  };

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
                    <select
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Lokasyon seçin...</option>
                      {availableLocations.map(loc => (
                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                      ))}
                    </select>
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
                      <option value="">Kategori seçin...</option>
                      {availableCategories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
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

            {/* Step 3: Tour Dates & Pricing */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Tur Tarihleri & Fiyatlandırma</h3>
                
                {/* Add Tour Date */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Yeni Tarih Ekle</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tarih *
                      </label>
                      <input
                        type="date"
                        value={newTourDate.date}
                        onChange={(e) => setNewTourDate({...newTourDate, date: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fiyat (₺) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newTourDate.price}
                        onChange={(e) => setNewTourDate({...newTourDate, price: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kapasite *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newTourDate.capacity}
                        onChange={(e) => setNewTourDate({...newTourDate, capacity: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Maksimum kişi sayısı"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addTourDate}
                    disabled={!newTourDate.date || !newTourDate.price || !newTourDate.capacity}
                    className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      newTourDate.date && newTourDate.price && newTourDate.capacity
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Tarih Ekle
                  </button>
                </div>

                {/* Tour Dates List */}
                {formData.tour_dates.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Eklenen Tarihlerde ({formData.tour_dates.length})</h4>
                    <div className="space-y-3">
                      {formData.tour_dates.map((tourDate, index) => (
                        <div key={tourDate.id} className="flex items-center justify-between bg-white p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                {new Date(tourDate.date).toLocaleDateString('tr-TR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-gray-600">
                                {tourDate.capacity} kişi • ₺{tourDate.price}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                tour_dates: prev.tour_dates.filter((_, i) => i !== index)
                              }));
                            }}
                            className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                            title="Tarihi sil"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.tour_dates.length === 0 && (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <div className="text-4xl mb-2">📅</div>
                    <p>Henüz tur tarihi eklenmedi</p>
                    <p className="text-sm">Yukarıdaki formu kullanarak tarih ekleyin</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Services & Details */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Hizmetler & Detaylar</h3>
                
                {/* Included Services */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dahil Olan Hizmetler
                  </label>
                  <div className="space-y-2">
                    {formData.included_services.map((service, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={service}
                          onChange={(e) => {
                            const newServices = [...formData.included_services];
                            newServices[index] = e.target.value;
                            setFormData({...formData, included_services: newServices});
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Örn: Rehber eşliği"
                        />
                        <button
                          type="button"
                          onClick={() => removeFromList('included_services', index)}
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newIncludedService}
                        onChange={(e) => setNewIncludedService(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Yeni hizmet ekle"
                      />
                      <button
                        type="button"
                        onClick={() => addToList('included_services', newIncludedService, setNewIncludedService)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                      >
                        Ekle
                      </button>
                    </div>
                  </div>
                </div>

                {/* Excluded Services */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dahil Olmayan Hizmetler
                  </label>
                  <div className="space-y-2">
                    {formData.excluded_services.map((service, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={service}
                          onChange={(e) => {
                            const newServices = [...formData.excluded_services];
                            newServices[index] = e.target.value;
                            setFormData({...formData, excluded_services: newServices});
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Örn: Öğle yemeği"
                        />
                        <button
                          type="button"
                          onClick={() => removeFromList('excluded_services', index)}
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newExcludedService}
                        onChange={(e) => setNewExcludedService(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Yeni hariç tutulan hizmet ekle"
                      />
                      <button
                        type="button"
                        onClick={() => addToList('excluded_services', newExcludedService, setNewExcludedService)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                      >
                        Ekle
                      </button>
                    </div>
                  </div>
                </div>

                {/* Meeting Point */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buluşma Noktası
                  </label>
                  <input
                    type="text"
                    value={formData.meeting_point}
                    onChange={(e) => setFormData({...formData, meeting_point: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Örn: Sultanahmet Meydanı"
                  />
                </div>

                {/* Languages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diller
                  </label>
                  <select
                    multiple
                    value={formData.languages}
                    onChange={(e) => {
                      const selectedLanguages = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData({...formData, languages: selectedLanguages});
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Turkish">Türkçe</option>
                    <option value="English">İngilizce</option>
                    <option value="German">Almanca</option>
                    <option value="French">Fransızca</option>
                    <option value="Spanish">İspanyolca</option>
                    <option value="Russian">Rusça</option>
                  </select>
                  <p className="text-sm text-gray-600 mt-1">Ctrl/Cmd tuşu ile birden fazla dil seçebilirsiniz</p>
                </div>

                {/* Difficulty Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zorluk Seviyesi
                  </label>
                  <select
                    value={formData.difficulty_level}
                    onChange={(e) => setFormData({...formData, difficulty_level: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Easy">Kolay</option>
                    <option value="Moderate">Orta</option>
                    <option value="Hard">Zor</option>
                    <option value="Expert">Uzman</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 5: Settings & Confirmation */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">✅ Ayarlar & Onay</h3>
                
                {/* Cancellation Policy */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İptal Politikası
                  </label>
                  <textarea
                    value={formData.cancellation_policy}
                    onChange={(e) => setFormData({...formData, cancellation_policy: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="İptal koşulları ve politikası"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etiketler
                  </label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => removeFromList('tags', index)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Yeni etiket ekle"
                      />
                      <button
                        type="button"
                        onClick={() => addToList('tags', newTag, setNewTag)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                      >
                        Ekle
                      </button>
                    </div>
                  </div>
                </div>

                {/* Final Review */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Tur Özeti</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Başlık:</span>
                      <span className="ml-2 text-gray-900">{formData.title || 'Belirtilmemiş'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Lokasyon:</span>
                      <span className="ml-2 text-gray-900">{formData.location || 'Belirtilmemiş'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Kategori:</span>
                      <span className="ml-2 text-gray-900">{categories.find(c => c.value === formData.category)?.label || 'Belirtilmemiş'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Fiyat:</span>
                      <span className="ml-2 text-gray-900">₺{formData.base_price || '0'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Süre:</span>
                      <span className="ml-2 text-gray-900">
                        {formData.duration_days} gün {formData.duration_hours > 0 && `${formData.duration_hours} saat`}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Katılımcı:</span>
                      <span className="ml-2 text-gray-900">Max {formData.max_participants} kişi</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Görsel:</span>
                      <span className="ml-2 text-gray-900">{formData.images.length} resim</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Durum:</span>
                      <span className="ml-2 text-gray-900">{statusOptions.find(s => s.value === formData.status)?.label || 'Belirtilmemiş'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

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

//Location Modal Component
const LocationModal = ({ location, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: location?.name || '',
    description: location?.description || '',
    country: location?.country || 'Turkey',
    is_active: location?.is_active !== undefined ? location.is_active : true
  });
  const [loading, setLoading] = useState(false);

  // Location değiştiğinde formData'yı güncelle
  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name || '',
        description: location.description || '',
        country: location.country || 'Turkey',
        is_active: location.is_active !== undefined ? location.is_active : true
      });
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
      if (location) {
        await axios.put(`${API}/admin/locations/${location.id}`, formData);
        toast.success('Lokasyon güncellendi');
      } else {
        await axios.post(`${API}/admin/locations`, formData);
        toast.success('Lokasyon eklendi');
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error(error.response?.data?.detail || 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {location ? 'Lokasyon Düzenle' : 'Yeni Lokasyon'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lokasyon Adı *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ülke
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({...formData, country: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="mr-2"
            />
            <label className="text-sm text-gray-700">Aktif</label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg"
            >
              {loading ? 'Kaydediliyor...' : (location ? 'Güncelle' : 'Ekle')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Category Modal Component
const CategoryModal = ({ category, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState(1);
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    icon: category?.icon || '◈',
    image: category?.image || '',
    seo_title: category?.seo_title || '',
    seo_description: category?.seo_description || '',
    seo_keywords: category?.seo_keywords || '',
    faq: category?.faq || [],
    is_active: category?.is_active !== undefined ? category.is_active : true
  });
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });

  const modalTabs = [
    { id: 1, title: 'Temel Bilgiler', icon: '●' },
    { id: 2, title: 'Görsel & Medya', icon: '◆' },
    { id: 3, title: 'SEO Ayarları', icon: '◇' },
    { id: 4, title: 'SSS Yönetimi', icon: '◈' }
  ];

  // Category değiştiğinde formData'yı güncelle
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        icon: category.icon || '◈',
        image: category.image || '',
        seo_title: category.seo_title || '',
        seo_description: category.seo_description || '',
        seo_keywords: category.seo_keywords || '',
        faq: category.faq || [],
        is_active: category.is_active !== undefined ? category.is_active : true
      });
    }
  }, [category]);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      const formDataToUpload = new FormData();
      formDataToUpload.append('file', file);

      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/upload/image`, formDataToUpload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setFormData(prev => ({
        ...prev,
        image: response.data.url
      }));

      toast.success('Resim başarıyla yüklendi');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Resim yüklenirken hata oluştu');
    } finally {
      setUploadLoading(false);
    }
  };

  const addFaq = () => {
    if (newFaq.question && newFaq.answer) {
      setFormData(prev => ({
        ...prev,
        faq: [...prev.faq, newFaq]
      }));
      setNewFaq({ question: '', answer: '' });
    }
  };

  const removeFaq = (index) => {
    setFormData(prev => ({
      ...prev,
      faq: prev.faq.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
      if (category) {
        await axios.put(`${API}/admin/categories/${category.id}`, formData);
        toast.success('Kategori güncellendi');
      } else {
        await axios.post(`${API}/admin/categories`, formData);
        toast.success('Kategori eklendi');
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error.response?.data?.detail || 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {category ? 'Kategori Düzenle' : 'Yeni Kategori'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {modalTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                <span className="text-sm">{tab.title}</span>
              </button>
            ))}
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {/* Tab Content */}
          <div className="min-h-[500px]">
            
            {/* Tab 1: Temel Bilgiler */}
            {activeTab === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">●</span>
                  Temel Kategori Bilgileri
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategori Adı *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Kategori adını giriniz"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategori İkonu
                    </label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({...formData, icon: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="◈"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori Açıklaması
                  </label>
                  <ReactQuill
                    value={formData.description}
                    onChange={(value) => setFormData({...formData, description: value})}
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        ['blockquote', 'code-block'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'color': [] }, { 'background': [] }],
                        ['link', 'image'],
                        ['clean']
                      ],
                    }}
                    formats={[
                      'header', 'bold', 'italic', 'underline', 'strike',
                      'blockquote', 'code-block', 'list', 'bullet',
                      'color', 'background', 'link', 'image'
                    ]}
                    placeholder="Kategori hakkında detaylı açıklama yazın..."
                    className="bg-white"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                      Kategoriyi Aktif Et
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Görsel & Medya */}
            {activeTab === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">◆</span>
                  Görsel & Medya Yönetimi
                </h3>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="text-center">
                    {formData.image ? (
                      <div className="relative inline-block">
                        <img
                          src={formData.image}
                          alt="Kategori Görseli"
                          className="w-64 h-40 object-cover rounded-lg shadow-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, image: ''})}
                          className="absolute -top-2 -right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                          title="Görseli Kaldır"
                        >
                          <span className="text-sm">✕</span>
                        </button>
                      </div>
                    ) : (
                      <div className="w-64 h-40 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500 text-lg">◆</span>
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="category-image-upload"
                        disabled={uploadLoading}
                      />
                      <label
                        htmlFor="category-image-upload"
                        className={`cursor-pointer inline-flex items-center space-x-2 px-6 py-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors ${
                          uploadLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {uploadLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            <span>Yükleniyor...</span>
                          </>
                        ) : (
                          <>
                            <span>◆</span>
                            <span className="font-medium">Kategori Görseli Yükle</span>
                          </>
                        )}
                      </label>
                      <p className="text-sm text-gray-500 mt-2">
                        JPG, PNG veya WebP formatında, maksimum 5MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: SEO Ayarları */}
            {activeTab === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">◇</span>
                  SEO ve Meta Bilgileri
                </h3>
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Başlık
                    </label>
                    <input
                      type="text"
                      value={formData.seo_title}
                      onChange={(e) => setFormData({...formData, seo_title: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Arama motorları için başlık"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Google'da görünecek başlık (50-60 karakter önerilir)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Açıklama
                    </label>
                    <textarea
                      value={formData.seo_description}
                      onChange={(e) => setFormData({...formData, seo_description: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Arama sonuçlarında görünecek açıklama"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Meta açıklama (150-160 karakter önerilir)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Anahtar Kelimeler
                    </label>
                    <input
                      type="text"
                      value={formData.seo_keywords}
                      onChange={(e) => setFormData({...formData, seo_keywords: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="kelime1, kelime2, kelime3"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Virgülle ayırarak anahtar kelimeleri girin
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: SSS Yönetimi */}
            {activeTab === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">◈</span>
                  Sık Sorulan Sorular
                </h3>
                
                {/* Add FAQ */}
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-gray-900 mb-4">Yeni SSS Ekle</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Soru
                      </label>
                      <input
                        type="text"
                        value={newFaq.question}
                        onChange={(e) => setNewFaq({...newFaq, question: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Sık sorulan soruyu yazın"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cevap
                      </label>
                      <textarea
                        value={newFaq.answer}
                        onChange={(e) => setNewFaq({...newFaq, answer: e.target.value})}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Sorunun cevabını yazın"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addFaq}
                      disabled={!newFaq.question || !newFaq.answer}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        newFaq.question && newFaq.answer
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      SSS Ekle
                    </button>
                  </div>
                </div>

                {/* FAQ List */}
                {formData.faq.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">
                      Eklenen SSS'ler ({formData.faq.length})
                    </h4>
                    {formData.faq.map((faq, index) => (
                      <div key={index} className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-2">
                              S: {faq.question}
                            </div>
                            <div className="text-gray-600">
                              C: {faq.answer}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFaq(index)}
                            className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="SSS'yi Sil"
                          >
                            <span className="text-lg">✕</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <span className="text-4xl block mb-4">◈</span>
                    <p>Henüz SSS eklenmedi</p>
                    <p className="text-sm">Yukarıdaki formu kullanarak SSS ekleyin</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg"
            >
              {loading ? 'Kaydediliyor...' : (category ? 'Güncelle' : 'Ekle')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPage;