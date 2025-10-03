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
          // Validate token by making a request to get user details
          const response = await axios.get(`${API}/users/me`);
          setUser(response.data);
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
    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password
      });
      
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
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
    setShowLoginModal
  };

  return (
    <AuthContext.Provider value={authValue}>
      <div className="App min-h-screen flex flex-col bg-gray-50">
        <BrowserRouter>
          <Header />
          
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/tours" element={<ToursPage />} />
              <Route path="/tours/:tourId" element={<TourDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
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
                element={
                  user && user.role === 'admin' ? <AdminPage /> : <Navigate to="/" replace />
                } 
              />
            </Routes>
          </main>
          
          <Footer />
          
          {showLoginModal && <LoginModal />}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
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