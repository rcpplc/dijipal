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
  MessageCircle,
  Edit,
  Trash2,
  Plus,
  X
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { createSlug } from '../utils/slug';

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
  // Legacy categories (for tour compatibility only)
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
  
  // Bookings management
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingFilter, setBookingFilter] = useState('all'); // all, confirmed, cancelled, completed
  
  // Messages management
  const [messages, setMessages] = useState([]);
  const [messageFilter, setMessageFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  // Legacy category states removed - using new category system
  
  // New Category System states
  const [newCategories, setNewCategories] = useState([]);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [showDeleteNewCategoryConfirm, setShowDeleteNewCategoryConfirm] = useState(false);
  const [selectedNewCategory, setSelectedNewCategory] = useState(null);
  const [editingNewCategory, setEditingNewCategory] = useState(null);
  const [newCategoriesLoading, setNewCategoriesLoading] = useState(false);
  
  // Sub Category System states
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [showDeleteSubCategoryConfirm, setShowDeleteSubCategoryConfirm] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [currentParentCategoryId, setCurrentParentCategoryId] = useState(null);
  
  // Media Library states moved to modal scope

  // Load locations and categories immediately for tour modal
  useEffect(() => {
    loadLocations();
    loadCategories();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboard();
    } else if (activeTab === 'tours') {
      loadTours();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'reviews') {
      loadReviews();
    } else if (activeTab === 'bookings') {
      loadBookings();
    } else if (activeTab === 'messages') {
      loadMessages();
    } else if (activeTab === 'locations') {
      // Already loaded on component mount
    } else if (activeTab === 'new-categories') {
      loadNewCategories();
    }
  }, [activeTab]);

  // Reload reviews when filter changes
  useEffect(() => {
    if (activeTab === 'reviews') {
      loadReviews();
    }
  }, [reviewFilter]);

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

  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      let url = `${API}/admin/reviews`;
      if (reviewFilter !== 'all') {
        url += `?status=${reviewFilter}`;
      }
      const response = await axios.get(url);
      setReviews(response.data);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Değerlendirmeler yüklenemedi');
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadBookings = async () => {
    setBookingsLoading(true);
    try {
      const response = await axios.get(`${API}/admin/bookings`);
      setBookings(response.data);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Rezervasyonlar yüklenemedi');
    } finally {
      setBookingsLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await axios.put(`${API}/admin/bookings/${bookingId}/status`, 
        { status }
      );
      toast.success('Rezervasyon durumu güncellendi');
      loadBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Rezervasyon durumu güncellenirken hata oluştu');
    }
  };

  // Message management functions
  const updateMessageStatus = async (messageId, newStatus) => {
    try {
      await axios.put(`${API}/admin/contact-messages/${messageId}`, 
        { status: newStatus }
      );
      toast.success('Mesaj durumu güncellendi');
      loadMessages();
    } catch (error) {
      console.error('Error updating message status:', error);
      toast.error('Mesaj durumu güncellenirken hata oluştu');
    }
  };

  const sendReply = async (messageId) => {
    if (!replyText.trim()) {
      toast.error('Lütfen bir yanıt yazın');
      return;
    }
    
    try {
      await axios.put(`${API}/admin/contact-messages/${messageId}`, 
        { admin_reply: replyText, status: 'replied' }
      );
      toast.success('Yanıt gönderildi');
      setReplyText('');
      setSelectedMessage(null);
      loadMessages();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Yanıt gönderilirken hata oluştu');
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await axios.delete(`${API}/admin/contact-messages/${messageId}`);
      toast.success('Mesaj silindi');
      loadMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Mesaj silinirken hata oluştu');
    }
  };

  const handleApproveReview = async (reviewId) => {
    try {
      await axios.put(`${API}/admin/reviews/${reviewId}/approve`);
      toast.success('Yorum onaylandı');
      loadReviews();
    } catch (error) {
      console.error('Error approving review:', error);
      toast.error('Yorum onaylanırken hata oluştu');
    }
  };

  const handleRejectReview = async (reviewId) => {
    try {
      await axios.put(`${API}/admin/reviews/${reviewId}/reject`);
      toast.success('Yorum reddedildi');
      loadReviews();
    } catch (error) {
      console.error('Error rejecting review:', error);
      toast.error('Yorum reddedilirken hata oluştu');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Bu yorumu kalıcı olarak silmek istediğinizden emin misiniz?')) {
      try {
        await axios.delete(`${API}/admin/reviews/${reviewId}`);
        toast.success('Yorum silindi');
        loadReviews();
      } catch (error) {
        console.error('Error deleting review:', error);
        toast.error('Yorum silinirken hata oluştu');
      }
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

  // Legacy categories loading (for tour compatibility)
  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API}/admin/categories`);
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error loading legacy categories:', error);
      setCategories([]);
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/contact-messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Mesajlar yüklenemedi');
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

  const openTourModal = async (tour = null) => {
    // Ensure locations and new categories are loaded before opening modal
    if (!locations || locations.length === 0) {
      await loadLocations();
    }
    if (!categories || categories.length === 0) {
      await loadCategories();
    }
    if (!newCategories || newCategories.length === 0) {
      await loadNewCategories();
    }
    
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
  // Legacy category functions removed - using new hierarchical category system

  // New Category System Management Functions
  const loadNewCategories = async () => {
    setNewCategoriesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/new-categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewCategories(response.data);
    } catch (error) {
      console.error('Error loading new categories:', error);
      toast.error('Kategoriler yüklenemedi');
    } finally {
      setNewCategoriesLoading(false);
    }
  };

  const openNewCategoryModal = (category = null) => {
    setEditingNewCategory(category);
    setShowNewCategoryModal(true);
  };

  const closeNewCategoryModal = () => {
    setEditingNewCategory(null);
    setShowNewCategoryModal(false);
  };

  const handleNewCategorySaved = () => {
    closeNewCategoryModal();
    loadNewCategories();
    toast.success(editingNewCategory ? 'Kategori güncellendi' : 'Kategori oluşturuldu');
  };

  const handleDeleteNewCategory = async (categoryId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API}/admin/new-categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(response.data.message);
      loadNewCategories();
      setShowDeleteNewCategoryConfirm(false);
      setSelectedNewCategory(null);
    } catch (error) {
      console.error('Error deleting new category:', error);
      toast.error(error.response?.data?.detail || 'Kategori silinirken hata oluştu');
    }
  };

  // Sub Category Management Functions
  const openSubCategoryModal = (parentCategoryId, subcategory = null) => {
    setCurrentParentCategoryId(parentCategoryId);
    setEditingSubCategory(subcategory);
    setShowSubCategoryModal(true);
  };

  const closeSubCategoryModal = () => {
    setCurrentParentCategoryId(null);
    setEditingSubCategory(null);
    setShowSubCategoryModal(false);
  };

  const handleSubCategorySaved = () => {
    closeSubCategoryModal();
    loadNewCategories();
    toast.success(editingSubCategory ? 'Alt kategori güncellendi' : 'Alt kategori oluşturuldu');
  };

  const handleDeleteSubCategory = async (subcategoryId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/admin/subcategories/${subcategoryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Alt kategori başarıyla silindi');
      loadNewCategories();
      setShowDeleteSubCategoryConfirm(false);
      setSelectedSubCategory(null);
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      toast.error(error.response?.data?.detail || 'Alt kategori silinirken hata oluştu');
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
    if (tour.minimum_price) {
      return `₺${(tour.minimum_price || 0).toLocaleString('tr-TR')}`;
    } else if (tour.tour_dates && tour.tour_dates.length > 0) {
      // Calculate from cabin prices
      const allPrices = tour.tour_dates.flatMap(date => [
        date.single_cabin_price || 0,
        date.double_cabin_price || 0
      ]).filter(price => price > 0);
      
      if (allPrices.length > 0) {
        const minPrice = Math.min(...allPrices);
        return `₺${(minPrice || 0).toLocaleString('tr-TR')}`;
      }
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
              { id: 'bookings', label: 'Rezervasyonlar', icon: Calendar },
              { id: 'messages', label: 'İletişim', icon: MessageCircle },
              { id: 'locations', label: 'Lokasyonlar', icon: MapPin },
              { id: 'new-categories', label: 'Kategori Sistemi', icon: Calendar }
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
                              onClick={() => window.open(`/turlar/${createSlug(tour.title)}`, '_blank')}
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

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Değerlendirme Yönetimi</h2>
              <div className="flex items-center space-x-4">
                <select
                  value={reviewFilter}
                  onChange={(e) => {
                    setReviewFilter(e.target.value);
                    // Trigger reload with new filter
                    setTimeout(loadReviews, 100);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tüm Yorumlar</option>
                  <option value="pending">Bekleyenler</option>
                  <option value="approved">Onaylananlar</option>
                  <option value="rejected">Reddedilenler</option>
                </select>
                <button
                  onClick={() => {
                    // Add test reviews for specific tour
                    axios.post(`${API}/add-test-reviews`)
                      .then(() => {
                        toast.success('Test yorumları eklendi');
                        loadReviews();
                      })
                      .catch(error => {
                        console.error('Error adding test reviews:', error);
                        toast.error('Test yorumları eklenirken hata oluştu');
                      });
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Test Yorumları Ekle
                </button>
              </div>
            </div>

            {reviewsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white rounded-xl p-6 shadow">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gray-200 w-12 h-12 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="bg-gray-200 h-4 w-1/4 rounded"></div>
                        <div className="bg-gray-200 h-3 w-1/2 rounded"></div>
                        <div className="bg-gray-200 h-3 w-3/4 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kullanıcı & Tur
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Yorum
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Puan
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tarih
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reviews.map((review) => (
                        <tr key={review.id} className="hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{review.user_name}</p>
                              <p className="text-sm text-gray-600">{review.user_email}</p>
                              <p className="text-sm text-blue-600 mt-1">{review.tour_title}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              {review.title && (
                                <p className="font-medium text-gray-900 mb-1">{review.title}</p>
                              )}
                              <p className="text-sm text-gray-600 max-w-xs truncate">
                                {review.comment || 'Yorum yok'}
                              </p>
                              <button
                                onClick={() => {
                                  setSelectedReview(review);
                                  setShowReviewModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm mt-1"
                              >
                                Detayları Görüntüle
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <div className="flex text-yellow-400">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span key={star}>
                                    {star <= review.rating ? '★' : '☆'}
                                  </span>
                                ))}
                              </div>
                              <span className="ml-2 text-sm text-gray-600">{review.rating}/5</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              review.is_verified 
                                ? 'bg-green-100 text-green-800'
                                : review.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {review.is_verified ? 'Onaylı' : 
                               review.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-700 text-sm">
                            {new Date(review.created_at).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => {
                                  setSelectedReview(review);
                                  setShowReviewModal(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-700 p-1 rounded transition-colors duration-200"
                                title="Görüntüle"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button 
                                onClick={() => {
                                  setSelectedReview(review);
                                  setShowReviewModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors duration-200"
                                title="Düzenle"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              
                              {!review.is_verified && review.status !== 'rejected' && (
                                <button
                                  onClick={() => handleApproveReview(review.id)}
                                  className="bg-green-100 text-green-800 hover:bg-green-200 px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
                                >
                                  Onayla
                                </button>
                              )}
                              
                              {review.is_verified && (
                                <button
                                  onClick={() => handleRejectReview(review.id)}
                                  className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
                                >
                                  Reddet
                                </button>
                              )}
                              
                              <button 
                                onClick={() => handleDeleteReview(review.id)}
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
                
                {reviews.length === 0 && (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-4">💬</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {reviewFilter === 'all' ? 'Henüz değerlendirme yok' : 
                       reviewFilter === 'pending' ? 'Bekleyen değerlendirme yok' :
                       reviewFilter === 'approved' ? 'Onaylanmış değerlendirme yok' :
                       'Reddedilmiş değerlendirme yok'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {reviewFilter === 'all' ? 'Kullanıcılar tur deneyimleri hakkında yorum yapmaya başladığında burada görünecek.' :
                       'Bu kategoride henüz değerlendirme bulunmuyor.'}
                    </p>
                    {reviewFilter === 'all' && (
                      <button
                        onClick={() => {
                          axios.post(`${API}/add-test-reviews`)
                            .then(() => {
                              toast.success('Test yorumları eklendi');
                              loadReviews();
                            })
                            .catch(error => {
                              console.error('Error adding test reviews:', error);
                              toast.error('Test yorumları eklenirken hata oluştu');
                            });
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
                      >
                        Test Yorumları Ekle
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Rezervasyon Yönetimi</h2>
              <div className="flex space-x-2">
                <select
                  value={bookingFilter}
                  onChange={(e) => setBookingFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tüm Rezervasyonlar</option>
                  <option value="pending">Bekleyen</option>
                  <option value="confirmed">Onaylandı</option>
                  <option value="paid">Ödendi</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal Edildi</option>
                  <option value="draft">Taslak</option>
                </select>
              </div>
            </div>

            {bookingsLoading ? (
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
              <>
              <div className="grid gap-6 lg:hidden">
                {/* Mobile Card Layout */}
                {bookings
                  .filter(booking => {
                    if (bookingFilter === 'all') return true;
                    return booking.booking_status === bookingFilter;
                  })
                  .map((booking) => (
                    <div key={booking.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
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
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          booking.booking_status === 'confirmed' || booking.booking_status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : booking.booking_status === 'completed' 
                            ? 'bg-blue-100 text-blue-800'
                            : booking.booking_status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : booking.booking_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.booking_status === 'confirmed' ? 'Onaylandı' :
                           booking.booking_status === 'paid' ? 'Ödendi' :
                           booking.booking_status === 'completed' ? 'Tamamlandı' :
                           booking.booking_status === 'cancelled' ? 'İptal Edildi' :
                           booking.booking_status === 'pending' ? 'Bekliyor' :
                           booking.booking_status === 'draft' ? 'Taslak' :
                           booking.booking_status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</span>
                          <p className="text-sm font-medium text-gray-900">{booking.customer_info?.full_name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{booking.customer_info?.email || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rezervasyon</span>
                          <p className="text-sm text-gray-900">
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
                                return `${booking.participants} × ${booking.cabin_type === 'single' ? 'Tek Kişilik' : 'Çift Kişilik'}`;
                              }
                            })()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {booking.reservation_type === 'person_based' ? 'Kişi Bazlı' : 
                             booking.reservation_type === 'reservation' ? 'Rezervasyon Tipi' : 'Kabin Bazlı'}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</span>
                          <p className="text-sm font-bold text-gray-900">₺{booking.total_price ? booking.total_price.toLocaleString('tr-TR') : '0'}</p>
                          <p className="text-xs text-gray-500">
                            {booking.payment_status === 'success' ? 'Ödendi' : 
                             booking.payment_status === 'failed' ? 'Başarısız' :
                             booking.payment_status === 'refunded' ? 'İade Edildi' : 'Bekliyor'}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">ID</span>
                          <p className="text-xs text-gray-600 font-mono">{booking.id.substring(0, 8)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(booking.booking_status === 'confirmed' || booking.booking_status === 'paid') && (
                          <>
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'completed')}
                              className="bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200"
                            >
                              Tamamla
                            </button>
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200"
                            >
                              İptal Et
                            </button>
                          </>
                        )}
                        {booking.booking_status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              className="bg-green-100 text-green-800 hover:bg-green-200 px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200"
                            >
                              Onayla
                            </button>
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200"
                            >
                              İptal Et
                            </button>
                          </>
                        )}
                        {(booking.booking_status === 'completed' || booking.booking_status === 'cancelled') && (
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                            className="bg-green-100 text-green-800 hover:bg-green-200 px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200"
                          >
                            Aktifleştir
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Müşteri & Rezervasyon
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tarih & Kabin
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fiyat
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bookings
                        .filter(booking => {
                          if (bookingFilter === 'all') return true;
                          return booking.booking_status === bookingFilter;
                        })
                        .map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {booking.customer_info?.full_name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">{booking.customer_info?.email || 'N/A'}</div>
                              <div className="text-sm font-medium text-blue-600 mt-1">
                                Rezervasyon #{booking.booking_code}
                              </div>
                              <div className="text-xs text-gray-500">ID: {booking.id.substring(0, 8)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(booking.created_at).toLocaleDateString('tr-TR')}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.cabin_type === 'single' ? 'Tek Kişilik' : 'Çift Kişilik'} Kabin
                            </div>
                            <div className="text-xs text-gray-500">
                              {booking.participants} kabin
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ₺{booking.total_price ? booking.total_price.toLocaleString('tr-TR') : '0'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Ödeme: {booking.payment_status === 'success' ? 'Başarılı' : 
                                     booking.payment_status === 'failed' ? 'Başarısız' :
                                     booking.payment_status === 'refunded' ? 'İade Edildi' : 'Bekliyor'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              booking.booking_status === 'confirmed' || booking.booking_status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : booking.booking_status === 'completed' 
                                ? 'bg-blue-100 text-blue-800'
                                : booking.booking_status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : booking.booking_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.booking_status === 'confirmed' ? 'Onaylandı' :
                               booking.booking_status === 'paid' ? 'Ödendi' :
                               booking.booking_status === 'completed' ? 'Tamamlandı' :
                               booking.booking_status === 'cancelled' ? 'İptal Edildi' :
                               booking.booking_status === 'pending' ? 'Bekliyor' :
                               booking.booking_status === 'draft' ? 'Taslak' :
                               booking.booking_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-2">
                              {(booking.booking_status === 'confirmed' || booking.booking_status === 'paid') && (
                                <>
                                  <button
                                    onClick={() => updateBookingStatus(booking.id, 'completed')}
                                    className="bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1 rounded text-xs font-medium transition-colors duration-200"
                                  >
                                    Tamamla
                                  </button>
                                  <button
                                    onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                    className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded text-xs font-medium transition-colors duration-200"
                                  >
                                    İptal Et
                                  </button>
                                </>
                              )}
                              {booking.booking_status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                    className="bg-green-100 text-green-800 hover:bg-green-200 px-3 py-1 rounded text-xs font-medium transition-colors duration-200"
                                  >
                                    Onayla
                                  </button>
                                  <button
                                    onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                    className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded text-xs font-medium transition-colors duration-200"
                                  >
                                    İptal Et
                                  </button>
                                </>
                              )}
                              {booking.booking_status === 'completed' && (
                                <button
                                  onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                  className="bg-green-100 text-green-800 hover:bg-green-200 px-3 py-1 rounded text-xs font-medium transition-colors duration-200"
                                >
                                  Aktifleştir
                                </button>
                              )}
                              {booking.booking_status === 'cancelled' && (
                                <button
                                  onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                  className="bg-green-100 text-green-800 hover:bg-green-200 px-3 py-1 rounded text-xs font-medium transition-colors duration-200"
                                >
                                  Aktifleştir
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Empty State */}
              {bookings.filter(booking => {
                if (bookingFilter === 'all') return true;
                return booking.booking_status === bookingFilter;
              }).length === 0 && (
                <div className="text-center py-16">
                  <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {bookingFilter === 'all' ? 'Henüz rezervasyon yok' : 
                     bookingFilter === 'confirmed' ? 'Onaylanmış rezervasyon yok' :
                     bookingFilter === 'paid' ? 'Ödenmiş rezervasyon yok' :
                     bookingFilter === 'completed' ? 'Tamamlanmış rezervasyon yok' :
                     bookingFilter === 'cancelled' ? 'İptal edilmiş rezervasyon yok' :
                     bookingFilter === 'pending' ? 'Bekleyen rezervasyon yok' :
                     'Bu kategoride rezervasyon yok'}
                  </h3>
                  <p className="text-gray-600">
                    {bookingFilter === 'all' ? 'Müşteriler rezervasyon yapmaya başladığında burada görünecek.' :
                     'Bu kategoride henüz rezervasyon bulunmuyor.'}
                  </p>
                </div>
              )}
              </>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">İletişim Mesajları</h2>
              <div className="flex space-x-2">
                <select
                  value={messageFilter}
                  onChange={(e) => setMessageFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tüm Mesajlar</option>
                  <option value="new">Yeni</option>
                  <option value="read">Okundu</option>
                  <option value="replied">Yanıtlandı</option>
                  <option value="resolved">Çözüldü</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white p-6 rounded-lg shadow">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-20 bg-gray-200 rounded mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Mobile Card Layout */}
                <div className="grid gap-6 lg:hidden">
                  {messages
                    .filter(message => {
                      if (messageFilter === 'all') return true;
                      return message.status === messageFilter;
                    })
                    .map((message) => (
                      <div key={message.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {message.subject}
                            </h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <MessageCircle className="w-4 h-4" />
                              <span>{new Date(message.created_at).toLocaleDateString('tr-TR')}</span>
                            </div>
                          </div>
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            message.status === 'new' ? 'bg-red-100 text-red-800' :
                            message.status === 'read' ? 'bg-yellow-100 text-yellow-800' :
                            message.status === 'replied' ? 'bg-blue-100 text-blue-800' :
                            message.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {message.status === 'new' ? 'Yeni' :
                             message.status === 'read' ? 'Okundu' :
                             message.status === 'replied' ? 'Yanıtlandı' :
                             message.status === 'resolved' ? 'Çözüldü' :
                             message.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gönderen</span>
                            <p className="text-sm font-medium text-gray-900">{message.name}</p>
                            <p className="text-xs text-gray-500">{message.email}</p>
                            {message.phone && <p className="text-xs text-gray-500">{message.phone}</p>}
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Mesaj</span>
                            <p className="text-sm text-gray-700 line-clamp-3">{message.message}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {message.status === 'new' && (
                            <button
                              onClick={() => updateMessageStatus(message.id, 'read')}
                              className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200"
                            >
                              Okundu İşaretle
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedMessage(message);
                              setReplyText(message.admin_reply || '');
                            }}
                            className="bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200"
                          >
                            {message.admin_reply ? 'Yanıtı Görüntüle' : 'Yanıtla'}
                          </button>
                          <button
                            onClick={() => updateMessageStatus(message.id, 'resolved')}
                            className="bg-green-100 text-green-800 hover:bg-green-200 px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200"
                          >
                            Çözüldü
                          </button>
                          <button
                            onClick={() => deleteMessage(message.id)}
                            className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Gönderen & Konu
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mesaj
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Durum
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tarih
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            İşlemler
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {messages
                          .filter(message => {
                            if (messageFilter === 'all') return true;
                            return message.status === messageFilter;
                          })
                          .map((message) => (
                          <tr key={message.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {message.name}
                                </div>
                                <div className="text-sm text-gray-500">{message.email}</div>
                                <div className="text-sm font-medium text-blue-600 mt-1">
                                  {message.subject}
                                </div>
                                {message.phone && <div className="text-xs text-gray-500">{message.phone}</div>}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs">
                                <p className="line-clamp-3">{message.message}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                message.status === 'new' ? 'bg-red-100 text-red-800' :
                                message.status === 'read' ? 'bg-yellow-100 text-yellow-800' :
                                message.status === 'replied' ? 'bg-blue-100 text-blue-800' :
                                message.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {message.status === 'new' ? 'Yeni' :
                                 message.status === 'read' ? 'Okundu' :
                                 message.status === 'replied' ? 'Yanıtlandı' :
                                 message.status === 'resolved' ? 'Çözüldü' :
                                 message.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(message.created_at).toLocaleDateString('tr-TR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex space-x-2">
                                {message.status === 'new' && (
                                  <button
                                    onClick={() => updateMessageStatus(message.id, 'read')}
                                    className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 px-3 py-1 rounded text-xs font-medium transition-colors duration-200"
                                  >
                                    Okundu
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedMessage(message);
                                    setReplyText(message.admin_reply || '');
                                  }}
                                  className="bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1 rounded text-xs font-medium transition-colors duration-200"
                                >
                                  {message.admin_reply ? 'Görüntüle' : 'Yanıtla'}
                                </button>
                                <button
                                  onClick={() => updateMessageStatus(message.id, 'resolved')}
                                  className="bg-green-100 text-green-800 hover:bg-green-200 px-3 py-1 rounded text-xs font-medium transition-colors duration-200"
                                >
                                  Çözüldü
                                </button>
                                <button
                                  onClick={() => deleteMessage(message.id)}
                                  className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded text-xs font-medium transition-colors duration-200"
                                >
                                  Sil
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Empty State */}
                {messages.filter(message => {
                  if (messageFilter === 'all') return true;
                  return message.status === messageFilter;
                }).length === 0 && (
                  <div className="text-center py-16">
                    <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {messageFilter === 'all' ? 'Henüz mesaj yok' : 
                       messageFilter === 'new' ? 'Yeni mesaj yok' :
                       messageFilter === 'read' ? 'Okunmuş mesaj yok' :
                       messageFilter === 'replied' ? 'Yanıtlanmış mesaj yok' :
                       messageFilter === 'resolved' ? 'Çözülmüş mesaj yok' :
                       'Bu kategoride mesaj yok'}
                    </h3>
                    <p className="text-gray-600">
                      {messageFilter === 'all' ? 'Müşteriler iletişim formunu kullanmaya başladığında burada görünecek.' :
                       'Bu kategoride henüz mesaj bulunmuyor.'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Reply Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Mesaj Detayı & Yanıtla</h3>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Gönderen Bilgileri</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div><span className="font-medium">İsim:</span> {selectedMessage.name}</div>
                    <div><span className="font-medium">E-posta:</span> {selectedMessage.email}</div>
                    {selectedMessage.phone && <div><span className="font-medium">Telefon:</span> {selectedMessage.phone}</div>}
                    <div><span className="font-medium">Konu:</span> {selectedMessage.subject}</div>
                    <div><span className="font-medium">Tarih:</span> {new Date(selectedMessage.created_at).toLocaleString('tr-TR')}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Mesaj İçeriği</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedMessage.message}</p>
                  </div>
                </div>
              </div>

              {selectedMessage.admin_reply && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Mevcut Yanıt</h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedMessage.admin_reply}</p>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {selectedMessage.admin_reply ? 'Yanıtı Güncelle' : 'Yanıt Yazın'}
                </h4>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Yanıtınızı buraya yazın..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={() => sendReply(selectedMessage.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {selectedMessage.admin_reply ? 'Yanıtı Güncelle' : 'Yanıt Gönder'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category System Tab */}
        {activeTab === 'new-categories' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Kategori Sistemi</h2>
                <p className="text-gray-600 mt-2">Ana kategoriler ve alt kategoriler oluşturun, SEO uyumlu URL'ler yönetin</p>
              </div>
              <button
                onClick={() => openNewCategoryModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Kategori Oluştur</span>
              </button>
            </div>

            {newCategoriesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white rounded-xl p-6 shadow">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gray-200 w-20 h-20 rounded-lg"></div>
                      <div className="flex-1 space-y-3">
                        <div className="bg-gray-200 h-5 w-1/3 rounded"></div>
                        <div className="bg-gray-200 h-4 w-2/3 rounded"></div>
                        <div className="bg-gray-200 h-3 w-1/2 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {newCategories.length === 0 ? (
                  <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                    <div className="text-6xl mb-4">🏷️</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Henüz kategori yok
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      İlk kategorinizi oluşturarak başlayın. Her kategori birden fazla lokasyonla ilişkilendirilebilir ve SEO uyumlu URL'ler oluşturur.
                    </p>
                    <button
                      onClick={() => openNewCategoryModal()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 inline-flex items-center space-x-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>İlk Kategorini Oluştur</span>
                    </button>
                  </div>
                ) : (
                  newCategories.map((category) => (
                    <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      {/* Category Header */}
                      <div className="p-6 border-b border-gray-100">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            {category.image ? (
                              <img 
                                src={category.image} 
                                alt={category.title}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">🏷️</span>
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">
                                Slug: <code className="bg-gray-100 px-2 py-1 rounded text-xs">/{category.slug}</code>
                              </p>
                              <div className="flex items-center space-x-4 mt-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {category.is_active ? 'Aktif' : 'Pasif'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {category.subcategories?.length || 0} alt kategori
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openNewCategoryModal(category)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              title="Düzenle"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedNewCategory(category);
                                setShowDeleteNewCategoryConfirm(true);
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Subcategories */}
                      {category.subcategories && category.subcategories.length > 0 && (
                        <div className="p-6 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-900">Alt Kategoriler ({category.subcategories.length})</h4>
                            <button
                              onClick={() => openSubCategoryModal(category.id)}
                              className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded transition-colors"
                            >
                              + Alt Kategori Ekle
                            </button>
                          </div>
                          <div className="space-y-3">
                            {category.subcategories.map((subcategory) => (
                              <div key={subcategory.id} className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-200">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <h5 className="font-medium text-gray-900 text-sm">
                                        {subcategory.location_name || 'Özel Başlık'}
                                      </h5>
                                      {!subcategory.location_name && (
                                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs">
                                          Özel
                                        </span>
                                      )}
                                      <span className={`w-2 h-2 rounded-full ${
                                        subcategory.is_active ? 'bg-green-400' : 'bg-red-400'
                                      }`}></span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">{subcategory.title}</p>
                                    <code className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded mt-1 inline-block">
                                      /{subcategory.slug}
                                    </code>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => openSubCategoryModal(category.id, subcategory)}
                                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                      title="Düzenle"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedSubCategory(subcategory);
                                        setShowDeleteSubCategoryConfirm(true);
                                      }}
                                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                                      title="Sil"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Add subcategory button when no subcategories */}
                      {(!category.subcategories || category.subcategories.length === 0) && (
                        <div className="p-6 border-t border-gray-100">
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-500 mb-3">Henüz alt kategori yok</p>
                            <button
                              onClick={() => openSubCategoryModal(category.id)}
                              className="bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded-lg text-sm transition-colors inline-flex items-center space-x-2"
                            >
                              <Plus className="w-4 h-4" />
                              <span>İlk Alt Kategoriyi Ekle</span>
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  ))
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
          newCategories={newCategories}
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

      {/* New Category System Modal */}
      <NewCategoryModal
        isOpen={showNewCategoryModal}
        onClose={closeNewCategoryModal}
        category={editingNewCategory}
        locations={locations}
        onSave={handleNewCategorySaved}
      />

      {/* New Category Delete Confirmation Modal */}
      {showDeleteNewCategoryConfirm && selectedNewCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Kategori Silme Onayı
            </h3>
            <p className="text-gray-600 mb-2">
              <strong>"{selectedNewCategory.title}"</strong> kategorisini ve tüm alt kategorilerini silmek istediğinizden emin misiniz?
            </p>
            {selectedNewCategory.subcategories && selectedNewCategory.subcategories.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Silinecek URL'ler:</p>
                <div className="bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>→ <code>/{selectedNewCategory.slug}</code></li>
                    {selectedNewCategory.subcategories.map((subcategory) => (
                      <li key={subcategory.id}>→ <code>/{subcategory.slug}</code></li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <p className="text-red-600 text-sm mb-6">
              ⚠️ Bu işlem geri alınamaz ve tüm SEO değerleri kaybolacaktır.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowDeleteNewCategoryConfirm(false);
                  setSelectedNewCategory(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                İptal
              </button>
              <button
                onClick={() => handleDeleteNewCategory(selectedNewCategory.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub Category Delete Confirmation Modal */}
      {showDeleteSubCategoryConfirm && selectedSubCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Alt Kategori Silme Onayı
            </h3>
            <p className="text-gray-600 mb-4">
              <strong>"{selectedSubCategory.title}"</strong> alt kategorisini silmek istediğinizden emin misiniz?
            </p>
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Silinecek URL:</p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <code className="text-xs text-gray-600">/{selectedSubCategory.slug}</code>
              </div>
            </div>
            <p className="text-red-600 text-sm mb-6">
              ⚠️ Bu işlem geri alınamaz.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowDeleteSubCategoryConfirm(false);
                  setSelectedSubCategory(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                İptal
              </button>
              <button
                onClick={() => handleDeleteSubCategory(selectedSubCategory.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub Category Modal */}
      <SubCategoryModal
        isOpen={showSubCategoryModal}
        onClose={closeSubCategoryModal}
        subcategory={editingSubCategory}
        parentCategoryId={currentParentCategoryId}
        locations={locations}
        onSave={handleSubCategorySaved}
      />

      {/* Review Detail Modal */}
      {showReviewModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Değerlendirme Detayları
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedReview(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* User & Tour Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Kullanıcı Bilgileri</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">{selectedReview.user_name}</p>
                    <p className="text-sm text-gray-600">{selectedReview.user_email}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Tur Bilgileri</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">{selectedReview.tour_title}</p>
                    <p className="text-sm text-gray-600">ID: {selectedReview.tour_id}</p>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Puan</h3>
                <div className="flex items-center space-x-2">
                  <div className="flex text-yellow-400 text-xl">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star}>
                        {star <= selectedReview.rating ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                  <span className="text-lg font-medium">{selectedReview.rating}/5</span>
                </div>
              </div>

              {/* Review Title */}
              {selectedReview.title && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Başlık</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">{selectedReview.title}</p>
                  </div>
                </div>
              )}

              {/* Review Comment */}
              {selectedReview.comment && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Yorum</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedReview.comment}</p>
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Durum</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedReview.is_verified 
                    ? 'bg-green-100 text-green-800'
                    : selectedReview.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedReview.is_verified ? 'Onaylı' : 
                   selectedReview.status === 'rejected' ? 'Reddedildi' : 'Onay Bekliyor'}
                </span>
              </div>

              {/* Created Date */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Oluşturulma Tarihi</h3>
                <p className="text-gray-600">
                  {new Date(selectedReview.created_at).toLocaleString('tr-TR')}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedReview(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Kapat
                </button>
                
                {!selectedReview.is_verified && selectedReview.status !== 'rejected' && (
                  <button
                    onClick={() => {
                      handleApproveReview(selectedReview.id);
                      setShowReviewModal(false);
                      setSelectedReview(null);
                    }}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                  >
                    Onayla
                  </button>
                )}
                
                {selectedReview.is_verified && (
                  <button
                    onClick={() => {
                      handleRejectReview(selectedReview.id);
                      setShowReviewModal(false);
                      setSelectedReview(null);
                    }}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                  >
                    Reddet
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Tour Modal Component
const TourModal = ({ tour, isEdit, onClose, onSave, locations, categories, newCategories }) => {
  console.log('TourModal Debug - Locations:', locations?.length || 0, locations);
  console.log('TourModal Debug - Categories:', categories?.length || 0, categories);
  console.log('TourModal Debug - New Categories:', newCategories?.length || 0, newCategories);
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
    duration_days: tour?.duration_days || 1,
    duration_unit: tour?.duration_unit || 'days',
    status: tour?.status || 'draft',
    reservation_type: tour?.reservation_type || 'cabin_based',
    images: tour?.images || [], // Legacy image URLs
    media_library_ids: tour?.media_library_ids || [], // New: Media library references
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
  
  // Simple upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  
  // Subcategory states
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  
  const [newTourDate, setNewTourDate] = useState({
    date: '',
    // Date range fields for person-based
    date_type: 'single', // 'single' or 'range'
    start_date: '',
    end_date: '',
    // Cabin-based fields
    capacity: '',
    single_cabin_price: '',
    double_cabin_price: '',
    // Person-based fields
    max_persons: '',
    person_price: '',
    child_price: '',
    // Reservation-based fields
    total_reservation_price: '',
    max_passengers: ''
  });

  // Load tour dates when editing existing tour
  useEffect(() => {
    if (isEdit && tour?.id) {
      loadTourDates();
    }
  }, [isEdit, tour?.id]);

  // Load subcategories for existing tour in edit mode
  useEffect(() => {
    if (isEdit && tour?.category && newCategories.length > 0) {
      loadSubcategories(tour.category);
      // Find matching subcategory based on location
      setTimeout(() => {
        const selectedCategory = newCategories.find(cat => cat.title === tour.category);
        if (selectedCategory && selectedCategory.subcategories) {
          const matchingSubcategory = selectedCategory.subcategories.find(sub => 
            sub.location_name === tour.location || sub.title === tour.location
          );
          if (matchingSubcategory) {
            setSelectedSubcategory(matchingSubcategory.title);
          }
        }
      }, 100);
    }
  }, [isEdit, tour?.category, tour?.location, newCategories]);

  // Load subcategories when category changes
  const loadSubcategories = async (categoryTitle) => {
    try {
      const selectedCategory = newCategories.find(cat => cat.title === categoryTitle);
      if (selectedCategory && selectedCategory.subcategories) {
        setSubcategories(selectedCategory.subcategories);
        setSelectedCategoryId(selectedCategory.id);
      } else {
        setSubcategories([]);
        setSelectedCategoryId('');
      }
    } catch (error) {
      console.error('Error loading subcategories:', error);
      setSubcategories([]);
    }
  };

  // Handle category change
  const handleCategoryChange = (categoryTitle) => {
    setFormData({...formData, category: categoryTitle, location: ''}); // Clear location when category changes
    setSelectedSubcategory('');
    loadSubcategories(categoryTitle);
  };

  // Handle subcategory change
  const handleSubcategoryChange = (subcategoryTitle) => {
    setSelectedSubcategory(subcategoryTitle);
    // Find the subcategory and set location from it
    const subcategory = subcategories.find(sub => sub.title === subcategoryTitle);
    if (subcategory && subcategory.location_name) {
      setFormData({...formData, location: subcategory.location_name});
    } else {
      setFormData({...formData, location: subcategoryTitle}); // Use subcategory title as location for custom subcategories
    }
  };

  const loadTourDates = async () => {
    if (!tour?.id) return;
    
    try {
      const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
      const response = await axios.get(`${API}/tours/${tour.id}/dates`);
      console.log('Loaded tour dates:', response.data);
      
      // Convert backend format to form format (ALL RESERVATION TYPES)
      const tourDates = response.data.map(date => ({
        id: date.id,
        date: date.start_date,
        // Cabin-based fields
        capacity: date.available_cabins || 0,
        single_cabin_price: date.single_cabin_price || 0,
        double_cabin_price: date.double_cabin_price || 0,
        // Person-based fields  
        max_persons: date.max_persons || 0,
        person_price: date.person_price || 0,
        child_price: date.child_price || null,
        // Reservation-based fields
        total_reservation_price: date.total_reservation_price || 0,
        max_passengers: date.max_passengers || 0,
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

  // Ultra simple upload function
  const handleSimpleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
      console.log('📤 Simple upload to:', `${API}/simple-upload`);
      
      const response = await axios.post(`${API}/simple-upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        // Images come as base64 data URLs - ready to display
        setUploadedImages(prev => [...prev, ...response.data.images]);
        
        // Add to formData as well
        const imageUrls = response.data.images.map(img => img.url);
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...imageUrls]
        }));
        
        toast.success(`${response.data.images.length} resim yüklendi`);
        console.log('✅ Upload success:', response.data.images);
      }
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      toast.error('Yükleme hatası: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };
  
  const removeUploadedImage = (index) => {
    // Get the image to remove
    const imageToRemove = uploadedImages[index];
    
    // Remove from uploaded images
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    
    // Also remove from formData.images
    if (imageToRemove) {
      const imageUrl = `${process.env.REACT_APP_BACKEND_URL}${imageToRemove.url}`;
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter(url => url !== imageUrl)
      }));
    }
  };
  // Old media functions removed - using simple upload now

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

  const reservationTypeOptions = [
    { value: 'cabin_based', label: 'Kabin Bazlı' },
    { value: 'person_based', label: 'Kişi Bazlı' },
    { value: 'reservation', label: 'Rezervasyon (Tüm Tekne/Özel)' }
  ];

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.title.trim() && formData.location && formData.category && 
               formData.pickup_time && formData.dropoff_time && formData.short_description.trim() &&
               formData.reservation_type;
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
    // Debug logging
    console.log('Reservation Type:', formData.reservation_type);
    console.log('New Tour Date:', newTourDate);
    
    // Validation based on reservation type
    let isValid = false;
    
    if (formData.reservation_type === 'cabin_based') {
      isValid = newTourDate.date && newTourDate.capacity && newTourDate.single_cabin_price && newTourDate.double_cabin_price;
    } else if (formData.reservation_type === 'person_based') {
      if (newTourDate.date_type === 'single') {
        isValid = newTourDate.start_date && newTourDate.max_persons && newTourDate.person_price;
        console.log('Person-based single validation:', {
          start_date: !!newTourDate.start_date,
          max_persons: !!newTourDate.max_persons,
          person_price: !!newTourDate.person_price,
          isValid
        });
      } else if (newTourDate.date_type === 'range') {
        isValid = newTourDate.start_date && newTourDate.end_date && newTourDate.max_persons && newTourDate.person_price;
        console.log('Person-based range validation:', {
          start_date: !!newTourDate.start_date,
          end_date: !!newTourDate.end_date,
          max_persons: !!newTourDate.max_persons,
          person_price: !!newTourDate.person_price,
          isValid
        });
      }
    } else if (formData.reservation_type === 'reservation') {
      isValid = newTourDate.date && newTourDate.total_reservation_price && newTourDate.max_passengers;
    }
    
    if (!isValid) {
      if (formData.reservation_type === 'cabin_based') {
        toast.error('Lütfen tarih, kabin kapasitesi ve kabin fiyatlarını doldurun');
      } else if (formData.reservation_type === 'person_based') {
        toast.error('Lütfen tarih, maksimum kişi sayısı ve kişi başı fiyatı doldurun');
      } else if (formData.reservation_type === 'reservation') {
        toast.error('Lütfen tarih, rezervasyon fiyatı ve maksimum yolcu sayısını doldurun');
      }
      return;
    }

    const newDates = [];
    
    if (formData.reservation_type === 'person_based' && newTourDate.date_type === 'range') {
      // Create separate entries for each day in the range
      const startDate = new Date(newTourDate.start_date);
      const endDate = new Date(newTourDate.end_date);
      
      for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
        const dateString = currentDate.toISOString().split('T')[0];
        newDates.push({
          id: `${Date.now()}-${dateString}`,
          date: dateString,
          // Person-based fields
          max_persons: parseInt(newTourDate.max_persons),
          person_price: parseFloat(newTourDate.person_price),
          child_price: newTourDate.child_price ? parseFloat(newTourDate.child_price) : null,
          // Default other fields
          capacity: 0,
          single_cabin_price: 0,
          double_cabin_price: 0,
          total_reservation_price: 0,
          max_passengers: 0,
          is_active: true
        });
      }
    } else {
      // Single date entry
      const dateValue = formData.reservation_type === 'person_based' ? newTourDate.start_date : newTourDate.date;
      
      const newDate = {
        id: Date.now().toString(),
        date: dateValue,
        is_active: true
      };

      // Add fields based on reservation type
      if (formData.reservation_type === 'cabin_based') {
        newDate.capacity = parseInt(newTourDate.capacity);
        newDate.single_cabin_price = parseFloat(newTourDate.single_cabin_price);
        newDate.double_cabin_price = parseFloat(newTourDate.double_cabin_price);
        newDate.max_persons = 0;
        newDate.person_price = 0;
        newDate.child_price = null;
        newDate.total_reservation_price = 0;
        newDate.max_passengers = 0;
      } else if (formData.reservation_type === 'person_based') {
        newDate.max_persons = parseInt(newTourDate.max_persons);
        newDate.person_price = parseFloat(newTourDate.person_price);
        newDate.child_price = newTourDate.child_price ? parseFloat(newTourDate.child_price) : null;
        newDate.capacity = 0;
        newDate.single_cabin_price = 0;
        newDate.double_cabin_price = 0;
        newDate.total_reservation_price = 0;
        newDate.max_passengers = 0;
      } else if (formData.reservation_type === 'reservation') {
        newDate.total_reservation_price = parseFloat(newTourDate.total_reservation_price);
        newDate.max_passengers = parseInt(newTourDate.max_passengers);
        newDate.capacity = 0;
        newDate.single_cabin_price = 0;
        newDate.double_cabin_price = 0;
        newDate.max_persons = 0;
        newDate.person_price = 0;
        newDate.child_price = null;
      }
      
      newDates.push(newDate);
    }
    
    setFormData(prev => ({
      ...prev,
      tour_dates: [...prev.tour_dates, ...newDates]
    }));
    
    // Reset form
    setNewTourDate({
      date: '',
      date_type: 'single',
      start_date: '',
      end_date: '',
      capacity: '',
      single_cabin_price: '',
      double_cabin_price: '',
      max_persons: '',
      person_price: '',
      child_price: '',
      total_reservation_price: '',
      max_passengers: ''
    });

    // Success message
    if (formData.reservation_type === 'person_based' && newTourDate.date_type === 'range') {
      toast.success(`${newDates.length} günlük tarih aralığı eklendi`);
    } else {
      toast.success('Tarih başarıyla eklendi');
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
    
    // Set form fields based on reservation type
    if (formData.reservation_type === 'cabin_based') {
      setNewTourDate({
        date: tourDate.date,
        date_type: 'single',
        start_date: '',
        end_date: '',
        capacity: tourDate.capacity.toString(),
        single_cabin_price: (tourDate.single_cabin_price || '').toString(),
        double_cabin_price: (tourDate.double_cabin_price || '').toString(),
        max_persons: '',
        person_price: '',
        child_price: '',
        total_reservation_price: '',
        max_passengers: ''
      });
    } else if (formData.reservation_type === 'person_based') {
      setNewTourDate({
        date: '',
        date_type: 'single',
        start_date: tourDate.date,
        end_date: '',
        capacity: '',
        single_cabin_price: '',
        double_cabin_price: '',
        max_persons: (tourDate.max_persons || '').toString(),
        person_price: (tourDate.person_price || '').toString(),
        child_price: (tourDate.child_price || '').toString(),
        total_reservation_price: '',
        max_passengers: ''
      });
    } else if (formData.reservation_type === 'reservation') {
      setNewTourDate({
        date: tourDate.date,
        date_type: 'single',
        start_date: '',
        end_date: '',
        capacity: '',
        single_cabin_price: '',
        double_cabin_price: '',
        max_persons: '',
        person_price: '',
        child_price: '',
        total_reservation_price: (tourDate.total_reservation_price || '').toString(),
        max_passengers: (tourDate.max_passengers || '').toString()
      });
    }
    
    // Remove the old one so user can add the edited version
    removeTourDate(index);
    toast.info('Tur tarihi düzenleme için forma yüklendi');
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
    
    console.log('🚀 Starting tour submission...');
    console.log('📋 FormData being submitted:', JSON.stringify(formData, null, 2));
    console.log('📅 Tour dates detail:', JSON.stringify(formData.tour_dates, null, 2));
    
    // Validate required fields
    if (!formData.title || !formData.description) {
      toast.error('Başlık ve açıklama alanları zorunludur');
      return;
    }
    
    // Validate tour dates
    if (formData.tour_dates.length === 0) {
      toast.error('En az bir tarih eklemelisiniz');
      return;
    }
    
    // Validate each tour date based on reservation type
    for (let i = 0; i < formData.tour_dates.length; i++) {
      const date = formData.tour_dates[i];
      let dateValid = false;
      let errorMessage = '';
      
      if (formData.reservation_type === 'cabin_based') {
        dateValid = date.date && date.capacity && date.single_cabin_price && date.double_cabin_price;
        errorMessage = `${i + 1}. tarihte eksik bilgi var: tarih, kabin kapasitesi ve kabin fiyatları gereklidir`;
      } else if (formData.reservation_type === 'person_based') {
        dateValid = date.date && date.max_persons && date.person_price;
        errorMessage = `${i + 1}. tarihte eksik bilgi var: tarih, maksimum kişi sayısı ve kişi başı fiyat gereklidir`;
      } else if (formData.reservation_type === 'reservation') {
        dateValid = date.date && date.total_reservation_price && date.max_passengers;
        errorMessage = `${i + 1}. tarihte eksik bilgi var: tarih, rezervasyon fiyatı ve maksimum yolcu sayısı gereklidir`;
      }
      
      if (!dateValid) {
        toast.error(errorMessage);
        return;
      }
    }
    
    setLoading(true);

    try {
      const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
      
      console.log('📊 FormData being sent to backend:', JSON.stringify(formData, null, 2));
      
      if (isEdit) {
        console.log(`🔄 Updating tour ${tour.id}...`);
        await axios.put(`${API}/admin/tours/${tour.id}`, formData);
        toast.success('Tur başarıyla güncellendi');
      } else {
        console.log('✨ Creating new tour...');
        await axios.post(`${API}/admin/tours`, formData);
        toast.success('Tur başarıyla oluşturuldu');
      }
      
      onSave();
    } catch (error) {
      console.error('❌ Error saving tour:', error);
      
      // Handle different error response formats
      let errorMessage = 'Tur kaydedilirken hata oluştu';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          if (typeof error.response.data.detail === 'string') {
            errorMessage = error.response.data.detail;
          } else {
            // Handle Pydantic validation errors
            errorMessage = 'Veri doğrulama hatası oluştu. Lütfen tüm alanları kontrol edin.';
          }
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      toast.error(errorMessage);
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
                
                {/* Reservation Type - Full Width Card Layout - FIRST FIELD */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Rezervasyon Tipi / Rezervasyon Seçeneği *
                  </label>
                  
                  {/* Locked State Warning for Edit Mode */}
                  {isEdit && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-800">
                            <strong>Rezervasyon tipi kayıt sonrası değiştirilemez.</strong> Bu ayar fiyatlandırma ve stok yapısını belirler.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                      className={`relative cursor-pointer rounded-lg border-2 p-4 hover:bg-gray-50 transition-colors duration-200 ${
                        formData.reservation_type === 'cabin_based' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200'
                      } ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (!isEdit) {
                          setFormData({...formData, reservation_type: 'cabin_based'});
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="reservation_type_cabin_based"
                          name="reservation_type"
                          value="cabin_based"
                          checked={formData.reservation_type === 'cabin_based'}
                          onChange={(e) => {
                            if (!isEdit) {
                              setFormData({...formData, reservation_type: e.target.value});
                            }
                          }}
                          disabled={isEdit}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                          required
                        />
                        <div className="ml-3 flex-1">
                          <label htmlFor="reservation_type_cabin_based" className="block text-sm font-semibold text-gray-900">
                            🏨 Kabin Bazlı
                          </label>
                          <p className="text-xs text-gray-600 mt-1">
                            Tek/çift kişilik kabin fiyatı
                          </p>
                        </div>
                      </div>
                    </div>

                    <div 
                      className={`relative cursor-pointer rounded-lg border-2 p-4 hover:bg-gray-50 transition-colors duration-200 ${
                        formData.reservation_type === 'person_based' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200'
                      } ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (!isEdit) {
                          setFormData({...formData, reservation_type: 'person_based'});
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="reservation_type_person_based"
                          name="reservation_type"
                          value="person_based"
                          checked={formData.reservation_type === 'person_based'}
                          onChange={(e) => {
                            if (!isEdit) {
                              setFormData({...formData, reservation_type: e.target.value});
                            }
                          }}
                          disabled={isEdit}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <div className="ml-3 flex-1">
                          <label htmlFor="reservation_type_person_based" className="block text-sm font-semibold text-gray-900">
                            👥 Kişi Bazlı
                          </label>
                          <p className="text-xs text-gray-600 mt-1">
                            Kişi başı fiyat
                          </p>
                        </div>
                      </div>
                    </div>

                    <div 
                      className={`relative cursor-pointer rounded-lg border-2 p-4 hover:bg-gray-50 transition-colors duration-200 ${
                        formData.reservation_type === 'reservation' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200'
                      } ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (!isEdit) {
                          setFormData({...formData, reservation_type: 'reservation'});
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="reservation_type_reservation"
                          name="reservation_type"
                          value="reservation"
                          checked={formData.reservation_type === 'reservation'}
                          onChange={(e) => {
                            if (!isEdit) {
                              setFormData({...formData, reservation_type: e.target.value});
                            }
                          }}
                          disabled={isEdit}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <div className="ml-3 flex-1">
                          <label htmlFor="reservation_type_reservation" className="block text-sm font-semibold text-gray-900">
                            🚢 Rezervasyon
                          </label>
                          <p className="text-xs text-gray-600 mt-1">
                            Tüm tekne / sabit fiyat
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {!isEdit && (
                    <p className="mt-3 text-sm text-gray-500">
                      Bu seçim fiyatlandırma ve stok yönetimini belirler. Kayıt sonrası değiştirilemez.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tur Başlığı *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategori *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      required
                      disabled={!newCategories || newCategories.length === 0}
                    >
                      <option value="">
                        {!newCategories || newCategories.length === 0 ? "Kategoriler yükleniyor..." : "Ana kategori seçin..."}
                      </option>
                      {newCategories && newCategories.filter(cat => cat.is_active).map(cat => (
                        <option key={cat.id} value={cat.title}>{cat.title}</option>
                      ))}
                    </select>
                    {(!newCategories || newCategories.length === 0) && (
                      <p className="text-sm text-gray-500 mt-1">Ana kategoriler yükleniyor...</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alt Kategori *
                    </label>
                    <select
                      value={selectedSubcategory}
                      onChange={(e) => handleSubcategoryChange(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      required
                      disabled={!formData.category || subcategories.length === 0}
                    >
                      <option value="">
                        {!formData.category ? "Önce kategori seçin..." : 
                         subcategories.length === 0 ? "Alt kategori yükleniyor..." : "Alt kategori seçin..."}
                      </option>
                      {subcategories && subcategories.filter(sub => sub.is_active).map(sub => (
                        <option key={sub.id} value={sub.title}>
                          {sub.location_name ? `${sub.location_name}` : sub.title}
                        </option>
                      ))}
                    </select>
                    {formData.category && subcategories.length === 0 && (
                      <p className="text-sm text-gray-500 mt-1">Bu kategoride alt kategori bulunamadı</p>
                    )}
                    {!formData.category && (
                      <p className="text-sm text-gray-500 mt-1">Önce ana kategori seçin</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sınıflandırma
                    </label>
                    <select
                      value={formData.classification}
                      onChange={(e) => setFormData({...formData, classification: e.target.value})}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      {classificationOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Biniş Saati *
                    </label>
                    <input
                      type="time"
                      value={formData.pickup_time}
                      onChange={(e) => setFormData({...formData, pickup_time: e.target.value})}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tur Süresi *
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        min="1"
                        max={formData.duration_unit === 'hours' ? 48 : 30}
                        value={formData.duration_days}
                        onChange={(e) => setFormData({...formData, duration_days: parseInt(e.target.value) || 1})}
                        className="w-20 px-3 py-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        required
                      />
                      <select
                        value={formData.duration_unit}
                        onChange={(e) => setFormData({...formData, duration_unit: e.target.value})}
                        className="flex-1 px-3 py-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="hours">Saat</option>
                        <option value="days">Gün</option>
                      </select>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.duration_unit === 'hours' 
                        ? 'Turun kaç saat süreceğini belirtin (1-48 saat)' 
                        : 'Turun kaç gün süreceğini belirtin (1-30 gün)'}
                    </p>
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
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Tur hakkında detaylı bilgi"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Simple Image Upload */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🖼️ Resim Yükleme</h3>
                
                {/* Simple File Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="simpleImageUpload"
                    multiple
                    accept="image/*"
                    onChange={handleSimpleUpload}
                    className="hidden"
                  />
                  <label htmlFor="simpleImageUpload" className="cursor-pointer">
                    <div className="text-gray-600">
                      📁 Resimleri Seç
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      JPG, PNG, GIF, WEBP desteklenir
                    </div>
                  </label>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="bg-blue-50 p-4 rounded">
                    <div className="text-blue-800">Yükleniyor...</div>
                  </div>
                )}

                {/* Uploaded Images */}
                {uploadedImages.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Yüklenen Resimler ({uploadedImages.length})</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {uploadedImages.map((img, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={`${process.env.REACT_APP_BACKEND_URL}${img.url}`}
                            alt={img.filename}
                            className="w-full h-24 object-cover rounded border"
                          />
                          <button
                            onClick={() => removeUploadedImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* URL Input Fallback */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">URL ile Resim Ekle</h4>
                  <div className="flex items-center space-x-2">
                    <input
                      type="url"
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Resim URL'si..."
                    />
                    <button
                      type="button"
                      onClick={() => addToList('images', newImage, setNewImage)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    >
                      Ekle
                    </button>
                  </div>
                  
                  {formData.images.length > 0 && (
                    <div className="mt-4">
                      <div className="grid grid-cols-3 gap-2">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image}
                              alt={`Image ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                              onError={(e) => {
                                e.target.src = '/placeholder-tour.jpg';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeFromList('images', index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Tarihler - Dynamic Content Based on Reservation Type */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    Tarihi & {formData.reservation_type === 'cabin_based' ? 'Kabin Fiyatları' : 
                             formData.reservation_type === 'person_based' ? 'Kişi Fiyatları' : 
                             'Rezervasyon Fiyatları'} Ekle
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    {formData.reservation_type === 'cabin_based' ? 'Yeni tarih ve kabin fiyatları belirleyin' : 
                     formData.reservation_type === 'person_based' ? 'Yeni tarih ve kişi başı fiyatları belirleyin' : 
                     'Yeni tarih ve rezervasyon fiyatları belirleyin'}
                  </p>
                  
                  {/* Dynamic Form Fields Based on Reservation Type */}
                  {formData.reservation_type === 'cabin_based' && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4 mb-4">
                      {/* Date Section */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">📅 Tarih Seçimi</h4>
                        <div className="w-full md:w-1/2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tarih *</label>
                          <input
                            type="date"
                            value={newTourDate.date}
                            onChange={(e) => setNewTourDate({...newTourDate, date: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>

                      {/* Capacity & Pricing Combined Section */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">🏨 Kabin Kapasitesi & Fiyatlandırma</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Toplam Kabin Sayısı *</label>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={newTourDate.capacity}
                              onChange={(e) => setNewTourDate({...newTourDate, capacity: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="12"
                              required
                            />
                            <p className="text-xs text-gray-500 mt-1">Mevcut kabin sayısı</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tek Kişilik Kabin (₺) *</label>
                            <input
                              type="number"
                              min="0"
                              step="50"
                              value={newTourDate.single_cabin_price}
                              onChange={(e) => setNewTourDate({...newTourDate, single_cabin_price: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="5000"
                              required
                            />
                            <p className="text-xs text-gray-500 mt-1">Kabin başına fiyat</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Çift Kişilik Kabin (₺) *</label>
                            <input
                              type="number"
                              min="0"
                              step="50"
                              value={newTourDate.double_cabin_price}
                              onChange={(e) => setNewTourDate({...newTourDate, double_cabin_price: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="8000"
                              required
                            />
                            <p className="text-xs text-gray-500 mt-1">Kabin başına fiyat</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.reservation_type === 'person_based' && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4 mb-4">
                      {/* Date Type Selection - Card Style */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Tarih Seçimi *</label>
                        <div className="grid grid-cols-2 gap-3">
                          <div 
                            className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all ${
                              newTourDate.date_type === 'single' 
                                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }`}
                            onClick={() => setNewTourDate({...newTourDate, date_type: 'single', end_date: ''})}
                          >
                            <input
                              type="radio"
                              value="single"
                              checked={newTourDate.date_type === 'single'}
                              onChange={(e) => setNewTourDate({...newTourDate, date_type: e.target.value, end_date: ''})}
                              className="sr-only"
                            />
                            <div className="text-sm font-medium">📅 Aynı Gün</div>
                            <div className="text-xs mt-1">Tek tarih seçimi</div>
                          </div>
                          
                          <div 
                            className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all ${
                              newTourDate.date_type === 'range' 
                                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }`}
                            onClick={() => setNewTourDate({...newTourDate, date_type: 'range'})}
                          >
                            <input
                              type="radio"
                              value="range"
                              checked={newTourDate.date_type === 'range'}
                              onChange={(e) => setNewTourDate({...newTourDate, date_type: e.target.value})}
                              className="sr-only"
                            />
                            <div className="text-sm font-medium">📆 Tarih Aralığı</div>
                            <div className="text-xs mt-1">Başlangıç - bitiş</div>
                          </div>
                        </div>
                      </div>

                      {/* Date Input Fields */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {newTourDate.date_type === 'single' ? 'Tarih *' : 'Başlangıç Tarihi *'}
                            </label>
                            <input
                              type="date"
                              value={newTourDate.start_date}
                              onChange={(e) => setNewTourDate({...newTourDate, start_date: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>
                          
                          {newTourDate.date_type === 'range' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Bitiş Tarihi *</label>
                              <input
                                type="date"
                                value={newTourDate.end_date}
                                onChange={(e) => setNewTourDate({...newTourDate, end_date: e.target.value})}
                                min={newTourDate.start_date}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                required
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Capacity and Pricing Grid */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Kapasite & Fiyatlandırma</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Günlük Maks Kişi *</label>
                            <input
                              type="number"
                              min="1"
                              max="200"
                              value={newTourDate.max_persons}
                              onChange={(e) => setNewTourDate({...newTourDate, max_persons: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="50"
                              required
                            />
                            <p className="text-xs text-gray-500 mt-1">Her gün ayrı stok</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Yetişkin (₺) *</label>
                            <input
                              type="number"
                              min="0"
                              step="10"
                              value={newTourDate.person_price}
                              onChange={(e) => setNewTourDate({...newTourDate, person_price: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="300"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Çocuk (₺)</label>
                            <input
                              type="number"
                              min="0"
                              step="10"
                              value={newTourDate.child_price}
                              onChange={(e) => setNewTourDate({...newTourDate, child_price: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="İsteğe bağlı"
                            />
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {formData.reservation_type === 'reservation' && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4 mb-4">
                      {/* Date Section */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">📅 Tarih Seçimi</h4>
                        <div className="w-full md:w-1/2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tarih *</label>
                          <input
                            type="date"
                            value={newTourDate.date}
                            onChange={(e) => setNewTourDate({...newTourDate, date: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>

                      {/* Pricing & Capacity Combined Section */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">🚢 Rezervasyon Fiyatı & Kapasite</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Toplam Rezervasyon Fiyatı (₺) *</label>
                            <input
                              type="number"
                              min="0"
                              step="100"
                              value={newTourDate.total_reservation_price}
                              onChange={(e) => setNewTourDate({...newTourDate, total_reservation_price: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="50000"
                              required
                            />
                            <p className="text-xs text-gray-500 mt-1">Sabit rezervasyon ücreti</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Maksimum Yolcu *</label>
                            <input
                              type="number"
                              min="1"
                              max="500"
                              value={newTourDate.max_passengers}
                              onChange={(e) => setNewTourDate({...newTourDate, max_passengers: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="100"
                              required
                            />
                            <p className="text-xs text-gray-500 mt-1">Toplam yolcu kapasitesi</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={addTourDate}
                    className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Ekle
                  </button>
                </div>

                {/* Tour Dates Table */}
                {formData.tour_dates.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Eklenen Tarihi ({formData.tour_dates.length})</h4>
                    <div className="border border-gray-200 rounded overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                              Tarih
                            </th>
                            {formData.reservation_type === 'cabin_based' && (
                              <>
                                <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                  Tek Kabin (₺)
                                </th>
                                <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                  Çift Kabin (₺)
                                </th>
                                <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                  Kabin Kapasitesi
                                </th>
                              </>
                            )}
                            {formData.reservation_type === 'person_based' && (
                              <>
                                <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                  Yetişkin (₺)
                                </th>
                                <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                  Çocuk (₺)
                                </th>
                                <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                  Maks Kişi
                                </th>
                              </>
                            )}
                            {formData.reservation_type === 'reservation' && (
                              <>
                                <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                  Toplam Fiyat (₺)
                                </th>
                                <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                  Maks Yolcu
                                </th>
                              </>
                            )}
                            <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                              Durum
                            </th>
                            <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                              İşlemler
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {formData.tour_dates
                            .sort((a, b) => new Date(a.date) - new Date(b.date))
                            .map((tourDate, index) => (
                            <tr key={tourDate.id || index} className="hover:bg-gray-50">
                              <td className="py-3 px-4 text-gray-900 font-medium">
                                {new Date(tourDate.date).toLocaleDateString('tr-TR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </td>
                              
                              {formData.reservation_type === 'cabin_based' && (
                                <>
                                  <td className="py-3 px-4">
                                    <span className="text-green-600 font-semibold">
                                      ₺{(tourDate.single_cabin_price || 0).toLocaleString('tr-TR')}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="text-purple-600 font-semibold">
                                      ₺{(tourDate.double_cabin_price || 0).toLocaleString('tr-TR')}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-gray-900">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                                      {tourDate.capacity} kabin
                                    </span>
                                  </td>
                                </>
                              )}
                              
                              {formData.reservation_type === 'person_based' && (
                                <>
                                  <td className="py-3 px-4">
                                    <span className="text-green-600 font-semibold">
                                      ₺{(tourDate.person_price || 0).toLocaleString('tr-TR')}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="text-orange-600 font-semibold">
                                      {tourDate.child_price ? `₺${(tourDate.child_price || 0).toLocaleString('tr-TR')}` : '-'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-gray-900">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                                      {tourDate.max_persons} kişi
                                    </span>
                                  </td>
                                </>
                              )}
                              
                              {formData.reservation_type === 'reservation' && (
                                <>
                                  <td className="py-3 px-4">
                                    <span className="text-green-600 font-semibold">
                                      ₺{(tourDate.total_reservation_price || 0).toLocaleString('tr-TR')}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-gray-900">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                                      {tourDate.max_passengers} yolcu
                                    </span>
                                  </td>
                                </>
                              )}
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
                
                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm">💡</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-900">Kabin Fiyatlandırma İpucu</h3>
                      <div className="mt-1 text-sm text-blue-700">
                        Tek kişilik kabinler daha küçük, çift kişilik kabinler daha büyük ve konforludur. Fiyatları buna göre ayarlayın.
                      </div>
                    </div>
                  </div>
                </div>
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
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
// Legacy CategoryModal component removed - using new hierarchical category system

// Enhanced Media Item Card Component
const MediaItemCard = ({ item, index, onUpdate, onDelete, onSetPrimary }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [metadata, setMetadata] = useState({
    title: item.title || '',
    description: item.description || '',
    alt_text: item.alt_text || '',
    tags: item.tags ? item.tags.join(', ') : '',
    is_primary: item.is_primary || false
  });

  const handleSave = () => {
    onUpdate(item.id, metadata);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setMetadata({
      title: item.title || '',
      description: item.description || '',
      alt_text: item.alt_text || '',
      tags: item.tags ? item.tags.join(', ') : '',
      is_primary: item.is_primary || false
    });
    setIsEditing(false);
  };

  return (
    <div className={`relative bg-white rounded-xl border-2 transition-all duration-300 ${
      item.is_primary ? 'border-green-500 shadow-lg' : 'border-gray-200 hover:border-blue-300 shadow-md hover:shadow-lg'
    }`}>
      {/* Primary Badge */}
      {item.is_primary && (
        <div className="absolute -top-2 -right-2 z-10 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          ⭐ ANA RESİM
        </div>
      )}
      
      {/* Image */}
      <div className="relative">
        <img
          src={`${process.env.REACT_APP_BACKEND_URL}${item.url}`}
          alt={item.alt_text || `Image ${index + 1}`}
          className="w-full h-40 object-cover rounded-t-xl"
          onError={(e) => {
            e.target.src = '/placeholder-tour.jpg';
          }}
        />
        
        {/* Quick Actions Overlay */}
        <div className="absolute top-2 right-2 flex space-x-1">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-white/90 hover:bg-white text-gray-700 p-1.5 rounded-full shadow-md transition-all duration-200"
            title="Düzenle"
          >
            <Edit className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="bg-red-500/90 hover:bg-red-500 text-white p-1.5 rounded-full shadow-md transition-all duration-200"
            title="Sil"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {!isEditing ? (
          /* View Mode */
          <div className="space-y-3">
            <div>
              <h5 className="font-medium text-gray-900 text-sm">
                {item.title || item.filename}
              </h5>
              <p className="text-xs text-gray-500 mt-1">
                {item.width}×{item.height} • {Math.round(item.file_size / 1024)}KB • WebP
              </p>
            </div>
            
            {item.description && (
              <p className="text-xs text-gray-600 leading-relaxed">
                {item.description}
              </p>
            )}
            
            {item.alt_text && (
              <div className="text-xs">
                <span className="font-medium text-gray-500">Alt:</span>
                <span className="text-gray-600 ml-1">{item.alt_text}</span>
              </div>
            )}
            
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
                {item.tags.length > 3 && (
                  <span className="text-xs text-gray-400">+{item.tags.length - 3}</span>
                )}
              </div>
            )}
            
            {/* Primary Selection */}
            <div className="flex items-center justify-between pt-2 border-t">
              <label className="flex items-center space-x-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="primaryImage"
                  checked={item.is_primary}
                  onChange={() => onSetPrimary(item.id)}
                  className="text-green-500 focus:ring-green-500"
                />
                <span className="text-gray-600">Ana sayfa resmi</span>
              </label>
              
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-600 hover:text-blue-700 text-xs font-medium"
              >
                Düzenle
              </button>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Başlık</label>
              <input
                type="text"
                value={metadata.title}
                onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="SEO başlığı"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Açıklama</label>
              <textarea
                value={metadata.description}
                onChange={(e) => setMetadata({...metadata, description: e.target.value})}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Görsel açıklaması"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Alt Metin (SEO)</label>
              <input
                type="text"
                value={metadata.alt_text}
                onChange={(e) => setMetadata({...metadata, alt_text: e.target.value})}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Alternatif metin"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Etiketler</label>
              <input
                type="text"
                value={metadata.tags}
                onChange={(e) => setMetadata({...metadata, tags: e.target.value})}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="etiket1, etiket2, etiket3"
              />
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <label className="flex items-center space-x-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={metadata.is_primary}
                  onChange={(e) => {
                    setMetadata({...metadata, is_primary: e.target.checked});
                    if (e.target.checked) {
                      onSetPrimary(item.id);
                    }
                  }}
                  className="text-green-500 focus:ring-green-500"
                />
                <span className="text-gray-600">Ana sayfa resmi</span>
              </label>
            </div>
            
            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 rounded transition-colors"
              >
                Kaydet
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs py-1.5 rounded transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Sub Category Modal Component
const SubCategoryModal = ({ isOpen, onClose, subcategory, parentCategoryId, locations, onSave }) => {
  const [formData, setFormData] = useState({
    location_name: '',
    title: '',
    description: '',
    image: '',
    faq: [],
    custom_slug: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    is_active: true
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [newFaqItem, setNewFaqItem] = useState({ question: '', answer: '' });
  
  useEffect(() => {
    if (subcategory) {
      setFormData({
        location_name: subcategory.location_name || '',
        title: subcategory.title || '',
        description: subcategory.description || '',
        image: subcategory.image || '',
        faq: subcategory.faq || [],
        custom_slug: subcategory.custom_slug || '',
        meta_title: subcategory.meta_title || '',
        meta_description: subcategory.meta_description || '',
        meta_keywords: subcategory.meta_keywords || '',
        is_active: subcategory.is_active !== undefined ? subcategory.is_active : true
      });
    } else {
      setFormData({
        location_name: '',
        title: '',
        description: '',
        image: '',
        faq: [],
        custom_slug: '',
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        is_active: true
      });
    }
    setErrors({});
  }, [subcategory, isOpen]);
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.location_name.trim() && !formData.title.trim()) {
      newErrors.general = 'Lokasyon adı veya özel başlık belirtilmelidir';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const requestData = {
        parent_category_id: parentCategoryId,
        location_name: formData.location_name || null,
        title: formData.title || null,
        description: formData.description,
        image: formData.image,
        faq: formData.faq,
        custom_slug: formData.custom_slug || null,
        meta_title: formData.meta_title,
        meta_description: formData.meta_description,
        meta_keywords: formData.meta_keywords,
        is_active: formData.is_active
      };
      
      const endpoint = subcategory 
        ? `${process.env.REACT_APP_BACKEND_URL}/api/admin/subcategories/${subcategory.id}`
        : `${process.env.REACT_APP_BACKEND_URL}/api/admin/new-categories/${parentCategoryId}/subcategories`;
      
      const method = subcategory ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });
      
      if (response.ok) {
        onSave();
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Alt kategori kaydedilirken hata oluştu');
      }
    } catch (error) {
      console.error('Error saving subcategory:', error);
      toast.error(error.message || 'Alt kategori kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  const addFaqItem = () => {
    if (newFaqItem.question.trim() && newFaqItem.answer.trim()) {
      setFormData(prev => ({
        ...prev,
        faq: [...prev.faq, { ...newFaqItem }]
      }));
      setNewFaqItem({ question: '', answer: '' });
    }
  };
  
  const removeFaqItem = (index) => {
    setFormData(prev => ({
      ...prev,
      faq: prev.faq.filter((_, i) => i !== index)
    }));
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {subcategory ? 'Alt Kategori Düzenle' : 'Yeni Alt Kategori Oluştur'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Validation Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lokasyon Adı
                </label>
                <select
                  value={formData.location_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Lokasyon Seçin (Opsiyonel)</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.name}>
                      {location.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Lokasyon seçilmezse özel başlık kullanılır</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Özel Başlık
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Lokasyon seçilmezse zorunlu"
                />
                <p className="text-xs text-gray-500 mt-1">Örn: "Lüks Yacht Turları", "Premium Deneyim"</p>
              </div>
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Açıklama
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Alt kategori hakkında özel açıklama..."
              />
            </div>
            
            {/* Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resim URL (Opsiyonel)
              </label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            {/* FAQ Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                SSS (Sıkça Sorulan Sorular)
              </label>
              
              {/* Existing FAQ Items */}
              <div className="space-y-2 mb-4">
                {formData.faq.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-medium text-gray-900 text-sm">{item.question}</h4>
                      <button
                        type="button"
                        onClick={() => removeFaqItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm">{item.answer}</p>
                  </div>
                ))}
              </div>
              
              {/* Add New FAQ */}
              <div className="border border-dashed border-gray-300 rounded-lg p-3 space-y-2">
                <input
                  type="text"
                  value={newFaqItem.question}
                  onChange={(e) => setNewFaqItem(prev => ({ ...prev, question: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Soru..."
                />
                <textarea
                  value={newFaqItem.answer}
                  onChange={(e) => setNewFaqItem(prev => ({ ...prev, answer: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Cevap..."
                />
                <button
                  type="button"
                  onClick={addFaqItem}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  SSS Ekle
                </button>
              </div>
            </div>
            
            {/* SEO Settings */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-4">
              <h3 className="font-medium text-gray-900">SEO Ayarları</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manuel URL (Opsiyonel)
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">/{" "}</span>
                  <input
                    type="text"
                    value={formData.custom_slug}
                    onChange={(e) => {
                      // Only allow lowercase letters, numbers, and hyphens
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setFormData(prev => ({ ...prev, custom_slug: value }));
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="ozel-tur"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Boş bırakılırsa lokasyon adından veya başlıktan otomatik oluşturulur. Sadece küçük harf, rakam ve tire kullanın.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={formData.meta_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="SEO için özel başlık..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  value={formData.meta_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Arama motorları için açıklama..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anahtar Kelimeler
                </label>
                <input
                  type="text"
                  value={formData.meta_keywords}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_keywords: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="anahtar, kelime, listesi"
                />
              </div>
            </div>
            
            {/* Status */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sub_is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="sub_is_active" className="text-sm font-medium text-gray-700">
                Alt kategori aktif
              </label>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{subcategory ? 'Güncelle' : 'Oluştur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// New Category Modal Component
const NewCategoryModal = ({ isOpen, onClose, category, locations, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    faq: [],
    custom_slug: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    is_active: true
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [newFaqItem, setNewFaqItem] = useState({ question: '', answer: '' });
  
  useEffect(() => {
    if (category) {
      setFormData({
        title: category.title || '',
        description: category.description || '',
        image: category.image || '',
        faq: category.faq || [],
        custom_slug: category.custom_slug || '',
        meta_title: category.meta_title || '',
        meta_description: category.meta_description || '',
        meta_keywords: category.meta_keywords || '',
        is_active: category.is_active !== undefined ? category.is_active : true
      });
    } else {
      setFormData({
        title: '',
        description: '',
        image: '',
        faq: [],
        custom_slug: '',
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        is_active: true
      });
    }
    setErrors({});
  }, [category, isOpen]);
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Kategori adı zorunludur';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = category 
        ? `${process.env.REACT_APP_BACKEND_URL}/api/admin/new-categories/${category.id}`
        : `${process.env.REACT_APP_BACKEND_URL}/api/admin/new-categories`;
      
      const method = category ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        onSave();
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Kategori kaydedilirken hata oluştu');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error.message || 'Kategori kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  const addFaqItem = () => {
    if (newFaqItem.question.trim() && newFaqItem.answer.trim()) {
      setFormData(prev => ({
        ...prev,
        faq: [...prev.faq, { ...newFaqItem }]
      }));
      setNewFaqItem({ question: '', answer: '' });
    }
  };
  
  const removeFaqItem = (index) => {
    setFormData(prev => ({
      ...prev,
      faq: prev.faq.filter((_, i) => i !== index)
    }));
  };
  
  const toggleLocation = (locationName) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.includes(locationName)
        ? prev.locations.filter(loc => loc !== locationName)
        : [...prev.locations, locationName]
    }));
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {category ? 'Kategori Düzenle' : 'Yeni Kategori Oluştur'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      title: e.target.value,
                      meta_title: prev.meta_title || e.target.value
                    }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Örn: Mavi Yolculuk"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori Resmi URL
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Açıklama
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Kategori hakkında detaylı açıklama..."
              />
            </div>
            
            {/* Info about subcategories */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Alt Kategoriler Hakkında</h4>
              <p className="text-sm text-blue-700">
                Ana kategori oluşturduktan sonra, istediğiniz lokasyonlar için alt kategoriler ekleyebilirsiniz.
                Alt kategoriler otomatik olarak "Kategori Adı - Lokasyon" formatında oluşturulur.
              </p>
            </div>
            
            {/* FAQ Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                SSS (Sıkça Sorulan Sorular)
              </label>
              
              {/* Existing FAQ Items */}
              <div className="space-y-3 mb-4">
                {formData.faq.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{item.question}</h4>
                      <button
                        type="button"
                        onClick={() => removeFaqItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm">{item.answer}</p>
                  </div>
                ))}
              </div>
              
              {/* Add New FAQ */}
              <div className="border border-dashed border-gray-300 rounded-lg p-4 space-y-3">
                <input
                  type="text"
                  value={newFaqItem.question}
                  onChange={(e) => setNewFaqItem(prev => ({ ...prev, question: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Soru..."
                />
                <textarea
                  value={newFaqItem.answer}
                  onChange={(e) => setNewFaqItem(prev => ({ ...prev, answer: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Cevap..."
                />
                <button
                  type="button"
                  onClick={addFaqItem}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  SSS Ekle
                </button>
              </div>
            </div>
            
            {/* SEO Settings */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-4">
              <h3 className="font-medium text-gray-900">SEO Ayarları</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manuel URL (Opsiyonel)
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">/{" "}</span>
                  <input
                    type="text"
                    value={formData.custom_slug}
                    onChange={(e) => {
                      // Only allow lowercase letters, numbers, and hyphens
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setFormData(prev => ({ ...prev, custom_slug: value }));
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="mavi-yolculuk"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Boş bırakılırsa kategori adından otomatik oluşturulur. Sadece küçük harf, rakam ve tire kullanın.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={formData.meta_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="SEO için özel başlık..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  value={formData.meta_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Arama motorları için açıklama..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anahtar Kelimeler
                </label>
                <input
                  type="text"
                  value={formData.meta_keywords}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_keywords: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="anahtar, kelime, listesi"
                />
              </div>
            </div>
            
            {/* Status */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Kategori aktif
              </label>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{category ? 'Güncelle' : 'Oluştur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPage;