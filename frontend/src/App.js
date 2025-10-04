import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'sonner';
import './App.css';
import './watermark-remover.css';

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

  // Remove Emergent watermark (aggressive approach)
  useEffect(() => {
    const removeWatermark = () => {
      try {
        // Method 1: Remove by text content
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
          const text = el.textContent || el.innerText || '';
          if (text.includes('Made with Emergent') || 
              text.includes('Made with') || 
              text.includes('Emergent')) {
            el.remove();
          }
        });

        // Method 2: Remove positioned elements in corners
        const positionedElements = document.querySelectorAll('[style*="position"]');
        positionedElements.forEach(el => {
          const style = window.getComputedStyle(el);
          const position = style.position;
          const bottom = style.bottom;
          const right = style.right;
          const zIndex = style.zIndex;
          
          if ((position === 'fixed' || position === 'absolute') &&
              (bottom === '0px' || bottom === '10px' || bottom === '16px' || bottom === '20px') &&
              (right === '0px' || right === '10px' || right === '16px' || right === '20px')) {
            el.remove();
          }
          
          // Remove high z-index elements
          if (zIndex && parseInt(zIndex) > 900) {
            const text = el.textContent || '';
            if (text.includes('Made with') || text.includes('Emergent') || text.length < 50) {
              el.remove();
            }
          }
        });

        // Method 3: Remove by common watermark selectors
        const watermarkSelectors = [
          '[class*="watermark"]',
          '[class*="branding"]', 
          '[class*="powered"]',
          '[class*="credit"]',
          '[class*="emergent"]',
          '.fixed.bottom-0.right-0',
          '.fixed.bottom-4.right-4',
          '.absolute.bottom-0.right-0',
          '.absolute.bottom-4.right-4',
          '[style*="z-index: 999"]',
          '[style*="z-index: 9999"]'
        ];
        
        watermarkSelectors.forEach(selector => {
          try {
            document.querySelectorAll(selector).forEach(el => el.remove());
          } catch (e) {
            // Ignore invalid selectors
          }
        });

        // Method 4: Remove any element with watermark-like properties
        const suspiciousElements = document.querySelectorAll('div, span, a');
        suspiciousElements.forEach(el => {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          
          // Check if element is in bottom-right corner
          if (rect.bottom > window.innerHeight - 100 && 
              rect.right > window.innerWidth - 200 &&
              rect.width < 200 && rect.height < 50) {
            const text = el.textContent || '';
            if (text.includes('Made with') || text.includes('Emergent')) {
              el.remove();
            }
          }
        });

      } catch (e) {
        console.log('Watermark removal error:', e);
      }
    };

    // Run removal function
    const runRemoval = () => {
      removeWatermark();
      
      // Run again after a short delay for dynamically loaded content
      setTimeout(removeWatermark, 500);
      setTimeout(removeWatermark, 1000);
      setTimeout(removeWatermark, 2000);
    };

    // Initial run
    runRemoval();

    // Run on page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runRemoval);
    } else {
      runRemoval();
    }

    // Run periodically
    const interval = setInterval(removeWatermark, 2000);

    // Run on DOM mutations
    const observer = new MutationObserver(() => {
      setTimeout(removeWatermark, 100);
    });
    
    if (document.body) {
      observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeNames: ['style', 'class']
      });
    }

    // Add white overlay to cover watermark
    const addWatermarkCover = () => {
      // Remove existing cover first
      const existingCover = document.getElementById('watermark-cover');
      if (existingCover) {
        existingCover.remove();
      }

      // Create new overlay
      const cover = document.createElement('div');
      cover.id = 'watermark-cover';
      cover.style.cssText = `
        position: fixed !important;
        bottom: 0 !important;
        right: 0 !important;
        width: 250px !important;
        height: 40px !important;
        background: rgba(255, 255, 255, 0.98) !important;
        z-index: 2147483647 !important;
        pointer-events: none !important;
        border-top: 1px solid #f0f0f0 !important;
      `;
      document.body.appendChild(cover);
    };

    // Add overlay
    addWatermarkCover();

    // Run on window events
    window.addEventListener('load', () => {
      runRemoval();
      addWatermarkCover();
    });
    window.addEventListener('resize', () => {
      removeWatermark();
      addWatermarkCover();
    });

    return () => {
      clearInterval(interval);
      observer.disconnect();
      document.removeEventListener('DOMContentLoaded', runRemoval);
      window.removeEventListener('load', runRemoval);
      window.removeEventListener('resize', removeWatermark);
    };
  }, []);

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
        {/* Watermark cover overlay */}
        <div className="watermark-cover"></div>
        <BrowserRouter>
          <Header />
          
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/tours" element={<ToursPage />} />
              <Route path="/tours/:tourId" element={<TourDetailPage />} />
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