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

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboard();
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

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erişim Reddedildi</h2>
          <p className="text-gray-600">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

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
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Yeni Tur</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Tur</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Lokasyon</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Fiyat</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Durum</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src="/placeholder-tour.jpg"
                            alt="Tour"
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div>
                            <p className="font-medium text-gray-900">İstanbul Tarihi Tur</p>
                            <p className="text-sm text-gray-600">Kültürel</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-700">İstanbul</td>
                      <td className="py-4 px-4 text-gray-700">₺299</td>
                      <td className="py-4 px-4">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Aktif
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-700 p-1 rounded">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-700 p-1 rounded">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-700 p-1 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Other tabs content */}
          {activeTab !== 'dashboard' && activeTab !== 'tours' && (
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
    </div>
  );
};

export default AdminPage;