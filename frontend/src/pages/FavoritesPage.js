import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  Heart, 
  MapPin, 
  Calendar, 
  Star, 
  ArrowLeft,
  Trash2
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { createSlug } from '../utils/slug';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FavoritesPage = () => {
  const { user, setShowLoginModal } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    loadFavorites();
  }, [user]);

  const loadFavorites = async () => {
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

  const removeFavorite = async (tourId) => {
    try {
      await axios.delete(`${API}/favorites/${tourId}`);
      setFavorites(prev => prev.filter(tour => tour.id !== tourId));
      toast.success('Favorilerden çıkarıldı');
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Bir hata oluştu');
    }
  };

  if (!user) {
    return null; // setShowLoginModal already called
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl p-6 shadow-lg">
                <div className="flex space-x-4">
                  <div className="bg-gray-200 w-32 h-24 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="bg-gray-200 h-5 w-3/4 rounded"></div>
                    <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
                    <div className="bg-gray-200 h-4 w-1/4 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <Link
              to="/turlar"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Turlar</span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Favorilerim</h1>
          </div>

          {/* Empty State */}
          <div className="text-center py-16">
            <Heart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Henüz favori turunuz yok
            </h2>
            <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
              Beğendiğiniz turları favorilere ekleyerek daha sonra kolayca bulabilirsiniz
            </p>
            <Link
              to="/turlar"
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
            >
              <span>Turları Keşfet</span>
              <Heart className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              to="/turlar"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Turlar</span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Favorilerim</h1>
          </div>
          <div className="text-gray-600">
            {favorites.length} favori tur
          </div>
        </div>

        {/* Favorites List */}
        <div className="space-y-6">
          {favorites.map((tour) => (
            <div key={tour.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div className="flex flex-col md:flex-row">
                {/* Tour Image */}
                <div className="md:w-80 flex-shrink-0">
                  <Link to={`/turlar/${createSlug(tour.title)}`}>
                    <img
                      src={tour.images[0] || '/placeholder-tour.jpg'}
                      alt={tour.title}
                      className="w-full h-48 md:h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                </div>

                {/* Tour Details */}
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{tour.location}</span>
                        <div className="flex items-center space-x-1 ml-4">
                          <Calendar className="w-4 h-4" />
                          <span>{tour.duration_days} gün</span>
                        </div>
                      </div>

                      <Link to={`/turlar/${createSlug(tour.title)}`}>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors duration-200">
                          {tour.title}
                        </h3>
                      </Link>

                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {tour.short_description}
                      </p>

                      <div className="flex items-center space-x-4 mb-4">
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
                          <span className="ml-2 text-sm text-gray-600">
                            ({tour.reviews_count || 0})
                          </span>
                        </div>

                        {tour.category && (
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            {tour.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => removeFavorite(tour.id)}
                      className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all duration-200 ml-4"
                      title="Favorilerden çıkar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        ₺{tour.base_price}
                        <span className="text-sm font-normal text-gray-600 ml-1">/kişi</span>
                      </div>
                    </div>

                    <Link
                      to={`/tours/${tour.id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                    >
                      Detayları Gör
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FavoritesPage;