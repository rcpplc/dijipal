import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'sonner';
import './App.css';

// Import components
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ToursPage from './pages/ToursPage';
import TourDetailPage from './pages/TourDetailPage';
import BookingPage from './pages/BookingPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import CartPage from './pages/CartPage';
import CategoryPage from './pages/CategoryPage';
import MyBookingsPage from './pages/MyBookingsPage';
import FavoritesPage from './pages/FavoritesPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import HelpPage from './pages/HelpPage';
import FAQPage from './pages/FAQPage';
import CancellationPolicyPage from './pages/CancellationPolicyPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import CookiesPage from './pages/CookiesPage';
import KVKKPage from './pages/KVKKPage';
import LoginModal from './components/LoginModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = React.createContext();

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMode, setLoginMode] = useState('login'); // 'login' or 'register'

  // Set up axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user data on mount
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          // Önce localStorage'dan user verisini al
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            console.log('Loaded user from localStorage:', userData);
          }
          
          // Validate token by making a request to get user details
          const response = await axios.get(`${API}/users/me`);
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
          console.log('Updated user from API:', response.data);
        } catch (error) {
          console.error('Token validation failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    console.log('🚀 Login function called with:', { email, API });
    try {
      console.log('🌐 Making API request to:', `${API}/auth/login`);
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password
      });
      
      console.log('📡 API Response:', response.status, response.data);
      const { token: newToken, user: userData } = response.data;
      
      console.log('Login Response - User Data:', userData);
      console.log('User Role:', userData?.role);
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      console.error('❌ Login API Error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Giriş başarısız'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API}/auth/register`, userData);
      
      const { token: newToken, user: newUser } = response.data;
      
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Kayıt başarısız'
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Platform yükleniyor...</p>
        </div>
      </div>
    );
  }

  const authValue = {
    user,
    token,
    login,
    register,
    logout,
    showLoginModal,
    setShowLoginModal,
    loginMode,
    setLoginMode
  };

  return (
    <AuthContext.Provider value={authValue}>
      <div className="App min-h-screen flex flex-col bg-gray-50">
        <BrowserRouter>
          <Header />
          
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/turlar" element={<ToursPage />} />
              <Route path="/turlar/:tourSlug" element={<TourDetailPage />} />
              <Route path="/category/:category" element={<CategoryPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/bookings" element={user ? <MyBookingsPage /> : <Navigate to="/" replace />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route 
                path="/booking/:tourId" 
                element={
                  user ? <BookingPage /> : <Navigate to="/" replace />
                } 
              />
              <Route 
                path="/profile" 
                element={
                  user ? <ProfilePage /> : <Navigate to="/" replace />
                } 
              />
              <Route 
                path="/admin" 
                element={(() => {
                  // Loading durumunda bekle
                  if (loading) {
                    return (
                      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                          <p className="text-gray-600 font-medium">Admin panel yükleniyor...</p>
                        </div>
                      </div>
                    );
                  }
                  
                  const isAdminFromState = user && user.role === 'admin';
                  const savedUser = localStorage.getItem('user');
                  const isAdminFromStorage = savedUser ? JSON.parse(savedUser)?.role === 'admin' : false;
                  
                  console.log('Admin Route Check:', {
                    loading,
                    user: user?.email,
                    role: user?.role,
                    isAdminFromState,
                    isAdminFromStorage,
                    token: !!token
                  });
                  
                  return (isAdminFromState || isAdminFromStorage) ? <AdminPage /> : <Navigate to="/" replace />;
                })()}
              />
              
              {/* Static Content Pages */}
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/cancellation-policy" element={<CancellationPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/cookies" element={<CookiesPage />} />
              <Route path="/kvkk" element={<KVKKPage />} />
            </Routes>
          </main>
          
          <Footer />
          
          {showLoginModal && <LoginModal initialMode={loginMode} />}
          <Toaster 
            position="top-right"
            closeButton
            toastOptions={{
              duration: 1000,
              style: {
                background: 'white',
                color: '#1f2937',
                border: '1px solid #e5e7eb'
              }
            }}
          />
        </BrowserRouter>
      </div>
    </AuthContext.Provider>
  );
}

export default App;