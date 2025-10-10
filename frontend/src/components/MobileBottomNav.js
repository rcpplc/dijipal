import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Heart, Calendar, User } from 'lucide-react';
import { useAuth } from './ui/useAuth';

const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();

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

  const navItems = [
    {
      name: 'Anasayfa',
      path: '/',
      icon: Home,
      requiresAuth: false
    },
    {
      name: 'Rezervasyonlarım',
      path: user ? '/my-bookings' : '/login',
      icon: Calendar,
      requiresAuth: true
    },
    {
      name: 'Favorilerim',
      path: user ? '/favorites' : '/login',
      icon: Heart,
      requiresAuth: true
    },
    {
      name: user ? 'Profilim' : 'Giriş Yap',
      path: user ? '/profile' : '/login',
      icon: User,
      requiresAuth: false // Her zaman göster ama label değişir
    }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors duration-200 ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-blue-600'
              }`}
            >
              <Icon className="w-6 h-6" strokeWidth={2} />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
