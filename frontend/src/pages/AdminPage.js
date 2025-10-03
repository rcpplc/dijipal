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
  Plus,
  X
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
  const [showTourModal, setShowTourModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTour, setSelectedTour] = useState(null);
  const [tours, setTours] = useState([]);
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tourLoading, setTourLoading] = useState(false);
  const [editingTour, setEditingTour] = useState(null);
  
  // Reviews management
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [reviewFilter, setReviewFilter] = useState('all'); // all, pending, approved, rejected
  
  // Location management
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showDeleteLocationConfirm, setShowDeleteLocationConfirm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  
  // Category management
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteCategoryConfirm, setShowDeleteCategoryConfirm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboard();
    } else if (activeTab === 'tours') {
      loadTours();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'reviews') {
      loadReviews();
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
      console.log('Tours loaded:', response.data);
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
      loadUsers();
      toast.success('Kullanıcı durumu güncellendi');
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error(error.response?.data?.detail || 'Kullanıcı durumu güncellenirken hata oluştu');
    }
  };

  const openTourModal = (tour = null) => {
    setEditingTour(tour);
    setShowTourModal(true);
  };

  const closeTourModal = () => {
    setEditingTour(null);
    setShowTourModal(false);
  };

  const handleTourSaved = () => {
    closeTourModal();
    loadTours();
  };

  // Location Management Functions
  const openLocationModal = (location = null) => {
    setEditingLocation(location);
    setShowLocationModal(true);
  };

  const closeLocationModal = () => {
    setEditingLocation(null);
    setShowLocationModal(false);
  };

  const handleLocationSaved = () => {
    closeLocationModal();
    loadLocations();
  };

  const handleToggleLocationStatus = async (locationId) => {
    try {
      await axios.put(`${API}/admin/locations/${locationId}/status`);
      loadLocations();
      toast.success('Lokasyon durumu güncellendi');
    } catch (error) {
      console.error('Error toggling location status:', error);
      toast.error(error.response?.data?.detail || 'Lokasyon durumu güncellenirken hata oluştu');
    }
  };

  const handleDeleteLocation = async (locationId) => {
    try {
      await axios.delete(`${API}/admin/locations/${locationId}`);
      toast.success('Lokasyon başarıyla silindi');
      loadLocations();
      setShowDeleteLocationConfirm(false);
      setSelectedLocation(null);
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error(error.response?.data?.detail || 'Lokasyon silinirken hata oluştu');
    }
  };

  // Category Management Functions
  const openCategoryModal = (category = null) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setEditingCategory(null);
    setShowCategoryModal(false);
  };

  const handleCategorySaved = () => {
    closeCategoryModal();
    loadCategories();
  };

  const handleToggleCategoryStatus = async (categoryId) => {
    try {
      await axios.put(`${API}/admin/categories/${categoryId}/status`);
      loadCategories();
      toast.success('Kategori durumu güncellendi');
    } catch (error) {
      console.error('Error toggling category status:', error);
      toast.error(error.response?.data?.detail || 'Kategori durumu güncellenirken hata oluştu');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await axios.delete(`${API}/admin/categories/${categoryId}`);
      toast.success('Kategori başarıyla silindi');
      loadCategories();
      setShowDeleteCategoryConfirm(false);
      setSelectedCategory(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(error.response?.data?.detail || 'Kategori silinirken hata oluştu');
    }
  };

  // Helper function to get category name from admin categories
  const getCategoryDisplayName = (categoryValue) => {
    const category = categories.find(cat => 
      cat.name.toLowerCase() === categoryValue.toLowerCase() || 
      cat.id === categoryValue
    );
    return category ? category.name : categoryValue;
  };

  // Helper function to get location name with country from admin locations
  const getLocationDisplayName = (locationValue) => {
    const location = locations.find(loc => 
      loc.name.toLowerCase() === locationValue.toLowerCase() || 
      loc.id === locationValue
    );
    return location ? `${location.name}, ${location.country}` : locationValue;
  };

  // Helper function to get minimum price from tour dates
  const getMinimumPrice = (tour) => {
    if (tour.tour_dates && tour.tour_dates.length > 0) {
      const minPrice = Math.min(...tour.tour_dates.map(date => date.price));
      return `₺${minPrice}`;
    }
    return '₺0';
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Yetkisiz Erişim</h2>
          <p className="text-gray-600">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
            <div className="text-sm text-gray-500">
              Hoş geldin, {user.full_name}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'tours', label: 'Turlar', icon: MapPin },
              { id: 'users', label: 'Kullanıcılar', icon: Users },
              { id: 'reviews', label: 'Değerlendirmeler', icon: Eye },
              { id: 'locations', label: 'Lokasyonlar', icon: MapPin },
              { id: 'categories', label: 'Kategoriler', icon: Calendar }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white p-6 rounded-lg shadow">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : dashboardData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <MapPin className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Toplam Tur
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {dashboardData.total_tours}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Calendar className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Toplam Rezervasyon
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {dashboardData.total_bookings}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Users className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Toplam Kullanıcı
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {dashboardData.total_users}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <DollarSign className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Toplam Gelir
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            ₺{dashboardData.total_revenue}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tours Tab */}
        {activeTab === 'tours' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Tur Yönetimi</h2>
              <button
                onClick={() => openTourModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Tur</span>
              </button>
            </div>

            {tourLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white rounded-xl p-6 shadow">
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
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tur
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lokasyon
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fiyat
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tours.map((tour) => (
                      <tr key={tour.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-12 h-12">
                              <img
                                src={tour.images?.[0] || '/placeholder-tour.jpg'}
                                alt={tour.title}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            </div>
                            <div className="ml-4">
                              <p className="font-medium text-gray-900 max-w-xs truncate">
                                {tour.title}
                              </p>
                              <p className="text-sm text-gray-600">
                                Biniş Saati: {tour.pickup_time || '09:00'} İniş Saati: {tour.dropoff_time || '18:00'} • {tour.classification || 'Standart'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-700">
                          {getLocationDisplayName(tour.location)}
                        </td>
                        <td className="py-4 px-4">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {getCategoryDisplayName(tour.category)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-700">
                          {getMinimumPrice(tour)} <span className="text-xs text-gray-500">den başlayan</span>
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
                              onClick={() => openTourModal(tour)}
                              className="text-indigo-600 hover:text-indigo-700 p-1 rounded transition-colors duration-200"
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
                    ))}
                  </tbody>
                </table>
                
                {tours.length === 0 && (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-4">📍</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Henüz tur yok
                    </h3>
                    <p className="text-gray-600 mb-4">
                      İlk turunuzu ekleyerek başlayın
                    </p>
                    <button
                      onClick={() => openTourModal()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
                    >
                      Tur Ekle
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Kullanıcı Yönetimi</h2>
            
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white rounded-xl p-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-200 w-12 h-12 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="bg-gray-200 h-4 w-1/4 rounded"></div>
                        <div className="bg-gray-200 h-3 w-1/2 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kullanıcı
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kayıt Tarihi
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-medium text-sm">
                                  {user.full_name.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <p className="font-medium text-gray-900">{user.full_name}</p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleToggleUserStatus(user.id)}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-200 ${
                                user.is_active
                                  ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                            >
                              {user.is_active ? 'Deaktif Et' : 'Aktif Et'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Locations Tab */}
        {activeTab === 'locations' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Lokasyon Yönetimi</h2>
              <button
                onClick={() => setShowLocationModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Lokasyon</span>
              </button>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white rounded-xl p-6 shadow">
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
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lokasyon
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ülke
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Oluşturulma
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {locations.map((location) => (
                      <tr key={location.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{location.name}</p>
                            <p className="text-sm text-gray-600">{location.description}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-700">
                          {location.country}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            location.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {location.is_active ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-700">
                          {new Date(location.created_at).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => openLocationModal(location)}
                              className="text-indigo-600 hover:text-indigo-700 p-1 rounded transition-colors duration-200"
                              title="Düzenle"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleLocationStatus(location.id)}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-200 ${
                                location.is_active
                                  ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                            >
                              {location.is_active ? 'Deaktif Et' : 'Aktif Et'}
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedLocation(location);
                                setShowDeleteLocationConfirm(true);
                              }}
                              className="text-red-600 hover:text-red-700 p-1 rounded transition-colors duration-200"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {locations.length === 0 && (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-4">📍</div>
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
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Kategori Yönetimi</h2>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Kategori</span>
              </button>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white rounded-xl p-6 shadow">
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
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İkon
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Oluşturulma
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            {category.image && (
                              <div className="flex-shrink-0 w-12 h-12 mr-4">
                                <img
                                  src={category.image}
                                  alt={category.name}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{category.name || 'İsimsiz Kategori'}</p>
                              <p className="text-sm text-gray-600">{category.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-2xl">{category.icon || '📂'}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            category.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {category.is_active ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-700">
                          {new Date(category.created_at).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => openCategoryModal(category)}
                              className="text-indigo-600 hover:text-indigo-700 p-1 rounded transition-colors duration-200"
                              title="Düzenle"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleCategoryStatus(category.id)}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-200 ${
                                category.is_active
                                  ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                            >
                              {category.is_active ? 'Deaktif Et' : 'Aktif Et'}
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedCategory(category);
                                setShowDeleteCategoryConfirm(true);
                              }}
                              className="text-red-600 hover:text-red-700 p-1 rounded transition-colors duration-200"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {categories.length === 0 && (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-4">📂</div>
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
          </div>
        )}
      </div>

      {/* Tour Modal */}
      {showTourModal && (
        <TourModal
          tour={editingTour}
          isEdit={!!editingTour}
          onClose={closeTourModal}
          onSave={handleTourSaved}
          locations={locations}
          categories={categories}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedTour && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tur Silme Onayı
            </h3>
            <p className="text-gray-600 mb-6">
              "{selectedTour.title}" turunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                İptal
              </button>
              <button
                onClick={() => handleDeleteTour(selectedTour.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <LocationModal
          location={editingLocation}
          isEdit={!!editingLocation}
          onClose={closeLocationModal}
          onSave={handleLocationSaved}
        />
      )}

      {/* Location Delete Confirmation Modal */}
      {showDeleteLocationConfirm && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Lokasyon Silme Onayı
            </h3>
            <p className="text-gray-600 mb-6">
              "{selectedLocation.name}" lokasyonunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteLocationConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                İptal
              </button>
              <button
                onClick={() => handleDeleteLocation(selectedLocation.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          isEdit={!!editingCategory}
          onClose={closeCategoryModal}
          onSave={handleCategorySaved}
        />
      )}

      {/* Category Delete Confirmation Modal */}
      {showDeleteCategoryConfirm && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Kategori Silme Onayı
            </h3>
            <p className="text-gray-600 mb-6">
              "{selectedCategory.name || 'Bu kategori'}" kategorisini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteCategoryConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                İptal
              </button>
              <button
                onClick={() => handleDeleteCategory(selectedCategory.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
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
const TourModal = ({ tour, isEdit, onClose, onSave, locations, categories }) => {
  console.log('TourModal Debug - Locations:', locations?.length || 0, locations);
  console.log('TourModal Debug - Categories:', categories?.length || 0, categories);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: tour?.title || '',
    description: tour?.description || '',
    short_description: tour?.short_description || '',
    location: tour?.location || '',
    pickup_time: tour?.pickup_time || '09:00',
    dropoff_time: tour?.dropoff_time || '18:00',
    category: tour?.category || '',
    classification: tour?.classification || 'standart',
    status: tour?.status || 'draft',
    images: tour?.images || [],
    included_services: tour?.included_services || [],
    excluded_services: tour?.excluded_services || [],
    meeting_point: tour?.meeting_point || '',
    languages: tour?.languages || ['Türkçe'],
    program_details: tour?.program_details || '',
    cancellation_policy: tour?.cancellation_policy || '',
    tags: tour?.tags || [],
    tour_dates: tour?.tour_dates || []
  });
  
  const [loading, setLoading] = useState(false);
  const [newIncludedService, setNewIncludedService] = useState('');
  const [newExcludedService, setNewExcludedService] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newTourDate, setNewTourDate] = useState({ date: '', price: '', capacity: '' });

  // Load tour dates when editing existing tour
  useEffect(() => {
    if (isEdit && tour?.id) {
      loadTourDates();
    }
  }, [isEdit, tour?.id]);

  const loadTourDates = async () => {
    if (!tour?.id) return;
    
    try {
      const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
      const response = await axios.get(`${API}/tours/${tour.id}/dates`);
      console.log('Loaded tour dates:', response.data);
      
      // Convert backend format to form format
      const tourDates = response.data.map(date => ({
        id: date.id,
        date: date.start_date,
        price: date.price,
        capacity: date.available_spots,
        is_active: date.is_active !== false
      }));
      
      setFormData(prev => ({
        ...prev,
        tour_dates: tourDates
      }));
    } catch (error) {
      console.error('Error loading tour dates:', error);
      // Don't show error to user, just log it
    }
  };

  const steps = [
    { id: 1, title: 'Temel Bilgiler', icon: '●' },
    { id: 2, title: 'Görsel & Medya', icon: '◆' },
    { id: 3, title: 'Tarih & Fiyat', icon: '◇' },
    { id: 4, title: 'Hizmetler & Detaylar', icon: '◈' },
    { id: 5, title: 'Ayarlar & Onay', icon: '◉' }
  ];

  const statusOptions = [
    { value: 'draft', label: 'Taslak' },
    { value: 'active', label: 'Aktif' },
    { value: 'inactive', label: 'Pasif' },
    { value: 'archived', label: 'Arşiv' }
  ];

  const classificationOptions = [
    { value: 'standart', label: 'Standart' },
    { value: 'lux', label: 'Lux' },
    { value: 'delux', label: 'Delux' }
  ];

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.title.trim() && formData.location && formData.category && 
               formData.pickup_time && formData.dropoff_time && formData.short_description.trim();
      case 2:
        return true; // Images optional
      case 3:
        return true; // Tour dates optional for now
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
    } else {
      toast.error('Lütfen tüm tarih bilgilerini doldurun');
    }
  };

  const removeTourDate = (index) => {
    setFormData(prev => ({
      ...prev,
      tour_dates: prev.tour_dates.filter((_, i) => i !== index)
    }));
  };

  const editTourDate = (index) => {
    const tourDate = formData.tour_dates[index];
    setNewTourDate({
      date: tourDate.date,
      price: tourDate.price.toString(),
      capacity: tourDate.capacity.toString()
    });
    // Remove the old one so user can add the edited version
    removeTourDate(index);
    toast.info('Tarih bilgileri düzenleme için forma yüklendi');
  };

  const toggleTourDateStatus = (index) => {
    setFormData(prev => ({
      ...prev,
      tour_dates: prev.tour_dates.map((date, i) => 
        i === index 
          ? { ...date, is_active: date.is_active === false ? true : false }
          : date
      )
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Only allow submit on step 5
    if (currentStep !== 5) {
      console.log('Submit blocked - not on step 5, current step:', currentStep);
      return;
    }
    
    console.log('Starting tour submission...');
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
              <X className="w-6 h-6" />
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
                  {step.icon}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`ml-6 w-full h-0.5 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Temel Bilgiler</h3>
                
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
                      {locations.filter(loc => loc.is_active).map(loc => (
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
                      {categories.filter(cat => cat.is_active).map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sınıflandırma
                    </label>
                    <select
                      value={formData.classification}
                      onChange={(e) => setFormData({...formData, classification: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {classificationOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Biniş Saati *
                    </label>
                    <input
                      type="time"
                      value={formData.pickup_time}
                      onChange={(e) => setFormData({...formData, pickup_time: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      İniş Saati *
                    </label>
                    <input
                      type="time"
                      value={formData.dropoff_time}
                      onChange={(e) => setFormData({...formData, dropoff_time: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
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

            {/* Step 2: Images & Media */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🖼️ Görsel & Medya</h3>
                
                {/* Add Image URL */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Resim Ekle</h4>
                  <div className="flex items-center space-x-2">
                    <input
                      type="url"
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Resim URL'si girin..."
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

                {/* Images List */}
                {formData.images.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Eklenen Resimler ({formData.images.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Tour image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.src = '/placeholder-tour.jpg';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeFromList('images', index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addTourDate}
                    className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    Tarih Ekle
                  </button>
                </div>

                {/* Tour Dates Table */}
                {formData.tour_dates.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Eklenen Tarihler ({formData.tour_dates.length})</h4>
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tarih
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fiyat
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kapasite
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Durum
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              İşlemler
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {formData.tour_dates
                            .sort((a, b) => new Date(a.date) - new Date(b.date))
                            .map((tourDate, index) => (
                            <tr key={tourDate.id || index} className="hover:bg-gray-50">
                              <td className="py-3 px-4 text-gray-900">
                                {new Date(tourDate.date).toLocaleDateString('tr-TR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </td>
                              <td className="py-3 px-4 text-gray-900">
                                ₺{tourDate.price}
                              </td>
                              <td className="py-3 px-4 text-gray-900">
                                {tourDate.capacity} kişi
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  tourDate.is_active !== false 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {tourDate.is_active !== false ? 'Aktif' : 'Pasif'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => editTourDate(index)}
                                    className="text-indigo-600 hover:text-indigo-700 p-1 rounded transition-colors duration-200"
                                    title="Düzenle"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleTourDateStatus(index)}
                                    className={`px-3 py-1 rounded text-xs font-medium transition-colors duration-200 ${
                                      tourDate.is_active !== false
                                        ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                                    }`}
                                  >
                                    {tourDate.is_active !== false ? 'Pasif Et' : 'Aktif Et'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeTourDate(index)}
                                    className="text-red-600 hover:text-red-700 p-1 rounded transition-colors duration-200"
                                    title="Sil"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Services & Details */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🛠️ Hizmetler & Detaylar</h3>
                
                {/* Included Services */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dahil Edilen Hizmetler
                  </label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {formData.included_services.map((service, index) => (
                        <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                          <span>{service}</span>
                          <button
                            type="button"
                            onClick={() => removeFromList('included_services', index)}
                            className="text-green-600 hover:text-green-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newIncludedService}
                        onChange={(e) => setNewIncludedService(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Dahil edilen hizmet ekle"
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
                    Dahil Edilmeyen Hizmetler
                  </label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {formData.excluded_services.map((service, index) => (
                        <span key={index} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                          <span>{service}</span>
                          <button
                            type="button"
                            onClick={() => removeFromList('excluded_services', index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newExcludedService}
                        onChange={(e) => setNewExcludedService(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Dahil edilmeyen hizmet ekle"
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
                    placeholder="Buluşma noktası adresi"
                  />
                </div>

                {/* Program Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tur Programı Hakkında Bilgi
                  </label>
                  <textarea
                    value={formData.program_details}
                    onChange={(e) => setFormData({...formData, program_details: e.target.value})}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Günlük program detayları, ziyaret edilecek yerler, aktiviteler ve tur akışı hakkında bilgi..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Turun günlük programını, aktivitelerini ve ziyaret edilecek yerleri detaylıca açıklayın.
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Settings & Confirmation */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">✅ Ayarlar & Onay</h3>
                
                {/* Status */}
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
                      <span className="ml-2 text-gray-900">{formData.category || 'Belirtilmemiş'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Sınıf:</span>
                      <span className="ml-2 text-gray-900">{formData.classification}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Saatler:</span>
                      <span className="ml-2 text-gray-900">{formData.pickup_time} - {formData.dropoff_time}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Tarih Sayısı:</span>
                      <span className="ml-2 text-gray-900">{formData.tour_dates.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-6 py-2 rounded-lg transition-colors duration-200 ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ← Önceki
              </button>

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                >
                  Sonraki →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  {loading ? 'Kaydediliyor...' : (isEdit ? 'Güncelle' : 'Oluştur')}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Location Modal Component
const LocationModal = ({ location, isEdit, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: location?.name || '',
    description: location?.description || '',
    country: location?.country || 'Türkiye',
    is_active: location?.is_active !== undefined ? location.is_active : true
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
      
      if (isEdit) {
        await axios.put(`${API}/admin/locations/${location.id}`, formData);
        toast.success('Lokasyon başarıyla güncellendi');
      } else {
        await axios.post(`${API}/admin/locations`, formData);
        toast.success('Lokasyon başarıyla oluşturuldu');
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error(error.response?.data?.detail || 'Lokasyon kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {isEdit ? 'Lokasyon Düzenle' : 'Yeni Lokasyon'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lokasyon Adı *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ülke *
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="location_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="location_active" className="ml-2 text-sm text-gray-700">
                Aktif
              </label>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? 'Kaydediliyor...' : (isEdit ? 'Güncelle' : 'Oluştur')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Category Modal Component
const CategoryModal = ({ category, isEdit, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    icon: category?.icon || '📂',
    image: category?.image || '',
    seo_title: category?.seo_title || '',
    seo_description: category?.seo_description || '',
    seo_keywords: category?.seo_keywords || '',
    is_active: category?.is_active !== undefined ? category.is_active : true
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
      
      if (isEdit) {
        await axios.put(`${API}/admin/categories/${category.id}`, formData);
        toast.success('Kategori başarıyla güncellendi');
      } else {
        await axios.post(`${API}/admin/categories`, formData);
        toast.success('Kategori başarıyla oluşturuldu');
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error.response?.data?.detail || 'Kategori kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {isEdit ? 'Kategori Düzenle' : 'Yeni Kategori'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori Adı *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İkon
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="📂"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resim URL
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({...formData, image: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SEO Başlık
              </label>
              <input
                type="text"
                value={formData.seo_title}
                onChange={(e) => setFormData({...formData, seo_title: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SEO Açıklama
              </label>
              <textarea
                value={formData.seo_description}
                onChange={(e) => setFormData({...formData, seo_description: e.target.value})}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SEO Anahtar Kelimeler
              </label>
              <input
                type="text"
                value={formData.seo_keywords}
                onChange={(e) => setFormData({...formData, seo_keywords: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="kelime1, kelime2, kelime3"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="category_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="category_active" className="ml-2 text-sm text-gray-700">
                Aktif
              </label>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? 'Kaydediliyor...' : (isEdit ? 'Güncelle' : 'Oluştur')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPage;