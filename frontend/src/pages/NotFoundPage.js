import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, 
  ArrowLeft, 
  Search,
  MapPin,
  Calendar,
  Users
} from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  const popularLinks = [
    {
      title: 'Tüm Turlar',
      description: 'Mevcut tüm turlarımızı inceleyin',
      href: '/turlar',
      icon: Search
    },
    {
      title: 'Kategoriler',
      description: 'Tur kategorilerimizi keşfedin',
      href: '/kategoriler',
      icon: MapPin
    },
    {
      title: 'Ana Sayfa',
      description: 'Ana sayfaya geri dönün',
      href: '/',
      icon: Home
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative">
            {/* Large 404 Text */}
            <h1 className="text-8xl md:text-9xl font-bold text-blue-100 select-none">
              404
            </h1>
            
            {/* Boat Icon Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                <svg 
                  className="w-12 h-12 md:w-16 md:h-16 text-white" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M6.5 12C5.67 12 5 11.33 5 10.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12M17.5 12C16.67 12 16 11.33 16 10.5S16.67 9 17.5 9 19 9.67 19 10.5 18.33 12 17.5 12M12 14C8.69 14 6 11.31 6 8H18C18 11.31 15.31 14 12 14M12 16L8 20V18H16V20L12 16Z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Sayfa Bulunamadı
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir. 
            Harika mavi yolculuk turlarımızı keşfetmek için aşağıdaki bağlantıları kullanabilirsiniz.
          </p>
          
          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center space-x-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Geri Git</span>
            </button>
            
            <Link
              to="/"
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              <Home className="w-5 h-5" />
              <span>Ana Sayfa</span>
            </Link>
          </div>
        </div>

        {/* Popular Links */}
        <div className="mb-12">
          <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-8">
            Popüler Sayfalar
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {popularLinks.map((link, index) => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={index}
                  to={link.href}
                  className="group bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-600 rounded-lg flex items-center justify-center mb-4 transition-colors duration-300">
                      <IconComponent className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                    </div>
                    
                    <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                      {link.title}
                    </h4>
                    
                    <p className="text-sm text-gray-600">
                      {link.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Aradığınızı Bulamıyor musunuz?
          </h3>
          <p className="text-gray-600 mb-6">
            Hemen arama yaparak istediğiniz turu bulabilirsiniz
          </p>
          
          <Link
            to="/turlar"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors duration-200"
          >
            <Search className="w-5 h-5" />
            <span>Turları Keşfet</span>
          </Link>
        </div>

        {/* Contact Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Hala sorun yaşıyorsanız,{' '}
            <a 
              href="mailto:destek@mavibilet.com" 
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              destek ekibimizle iletişime geçin
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;