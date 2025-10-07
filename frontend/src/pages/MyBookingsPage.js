import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Mail,
  Phone
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MyBookingsPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  const loadBookings = async () => {
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

  const getStatusIcon = (status) => {
    switch(status) {
      case 'confirmed':
      case 'paid':
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      draft: 'Taslak',
      pending: 'Bekliyor',
      confirmed: 'Onaylandı',
      paid: 'Ödendi',
      completed: 'Tamamlandı',
      cancelled: 'İptal Edildi'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['confirmed', 'paid'].includes(booking.booking_status);
    if (filter === 'completed') return booking.booking_status === 'completed';
    if (filter === 'cancelled') return booking.booking_status === 'cancelled';
    return true;
  });

  const filters = [
    { key: 'all', label: 'Tümü', count: bookings.length },
    { key: 'active', label: 'Aktif', count: bookings.filter(b => ['confirmed', 'paid'].includes(b.booking_status)).length },
    { key: 'completed', label: 'Tamamlanan', count: bookings.filter(b => b.booking_status === 'completed').length },
    { key: 'cancelled', label: 'İptal Edilen', count: bookings.filter(b => b.booking_status === 'cancelled').length }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Rezervasyonlarım
          </h1>
          <p className="text-gray-600">
            Geçmiş ve mevcut rezervasyonlarınızı görüntüleyin
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {filters.map(filterItem => (
                <button
                  key={filterItem.key}
                  onClick={() => setFilter(filterItem.key)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    filter === filterItem.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {filterItem.label}
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    filter === filterItem.key 
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

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'Henüz rezervasyonunuz yok' : `${filters.find(f => f.key === filter)?.label} rezervasyon bulunamadı`}
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
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Rezervasyon #{booking.booking_code}
                        </h3>
                        {getStatusIcon(booking.booking_status)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(booking.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>
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
                                return `${booking.participants} × ${booking.cabin_type === 'double' ? 'Çift Kişilik Kabin' : 'Tek Kişilik Kabin'}`;
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.booking_status)}`}>
                        {getStatusText(booking.booking_status)}
                      </span>
                      <div className="mt-2 text-lg font-bold text-blue-600">
                        ₺{booking.total_price?.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  {booking.customer_info && (
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">İletişim:</span>
                          <div className="mt-1 space-y-1">
                            {booking.customer_info.full_name && (
                              <p className="text-gray-600">{booking.customer_info.full_name}</p>
                            )}
                            {booking.customer_info.email && (
                              <div className="flex items-center space-x-1 text-gray-600">
                                <Mail className="w-3 h-3" />
                                <span>{booking.customer_info.email}</span>
                              </div>
                            )}
                            {booking.customer_info.phone && (
                              <div className="flex items-center space-x-1 text-gray-600">
                                <Phone className="w-3 h-3" />
                                <span>{booking.customer_info.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-700">Rezervasyon Detayı:</span>
                          <div className="mt-1 text-gray-600">
                            <p>Kabin Sayısı: {booking.participants} kabin</p>
                            <p>Kabin Tipi: {booking.cabin_type === 'double' ? 'Çift Kişilik Kabin' : 'Tek Kişilik Kabin'}</p>
                            <p>Toplam: ₺{booking.total_price?.toLocaleString()}</p>
                            {booking.payment_status === 'success' && (
                              <span className="inline-flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full mt-1">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Ödeme Tamamlandı
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="font-medium text-gray-700">Tarihler:</span>
                          <div className="mt-1 text-gray-600">
                            <p>Oluşturulma: {new Date(booking.created_at).toLocaleDateString('tr-TR')}</p>
                            <p>Güncelleme: {new Date(booking.updated_at).toLocaleDateString('tr-TR')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Special Requests */}
                  {booking.special_requests && (
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <span className="font-medium text-gray-700">Özel İstekler:</span>
                      <p className="text-gray-600 mt-1">{booking.special_requests}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="border-t border-gray-100 pt-4 mt-4 flex justify-between items-center">
                    <div className="flex space-x-3">
                      {booking.booking_status === 'paid' && (
                        <button className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-200">
                          Detayları Görüntüle
                        </button>
                      )}
                      {['confirmed', 'paid'].includes(booking.booking_status) && (
                        <button className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors duration-200">
                          İptal Et
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 text-sm transition-colors duration-200">
                        <Download className="w-4 h-4" />
                        <span>PDF İndir</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;