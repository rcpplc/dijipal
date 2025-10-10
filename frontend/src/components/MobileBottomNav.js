import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Heart, Calendar, User } from 'lucide-react';
import { useAuth } from '../App';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setShowLoginModal } = useAuth();

  // Sayfalarda bottom nav'i gizle
  const hiddenPaths = [
    '/tur/', // Tur detay sayfaları
    '/booking',
    '/payment',
    '/cart'
  ];

  // Eğer hidden path'lerden birindeyse gösterme
  const shouldHide = hiddenPaths.some(path => location.pathname.includes(path));
  
  if (shouldHide) {
    return null;
  }

  const handleNavClick = (item, e) => {
    e.preventDefault();
    
    // Login gerektiren sayfalar
    if (item.requiresAuth && !user) {
      // Login modal'ını aç
      setShowLoginModal(true);
      return;
    }
    
    // Navigate yap
    navigate(item.path);
  };

  const navItems = [
    {
      name: 'Anasayfa',
      path: '/',
      icon: Home,
      requiresAuth: false
    },
    {
      name: 'Rezervasyonlarım',
      path: '/my-bookings',
      icon: Calendar,
      requiresAuth: true
    },
    {
      name: 'Favorilerim',
      path: '/favorites',
      icon: Heart,
      requiresAuth: true
    },
    {
      name: 'Profilim',
      path: '/profile',
      icon: User,
      requiresAuth: true
    }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="grid grid-cols-4 h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.name}
              onClick={(e) => handleNavClick(item, e)}
              className={`flex items-center justify-center transition-colors duration-200 ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 active:text-blue-600'
              }`}
            >
              <Icon className="w-6 h-6" strokeWidth={2} />
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
