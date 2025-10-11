import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  ArrowRight,
  MapPin,
  Compass
} from 'lucide-react';
import { updateSEOTags } from '../utils/seo';
import axios from 'axios';

const AllCategoriesPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

  // Category configuration with modern design
  const categoryConfig = {
    'mavi-yolculuk': {
      title: 'Mavi Yolculuk',
      icon: '🌊',
      color: 'blue',
      description: 'Türkiye\'nin en güzel koylarında mavi yolculuk deneyimi',
      gradient: 'from-blue-500 to-blue-600',
      locations: ['Göcek', 'Marmaris', 'Bodrum', 'Antalya']
    },
    'gunubirlik-tekne': {
      title: 'Günübirlik Tekne Turları',
      icon: '⛵',
      color: 'green',
      description: 'Günübirlik tekne turları ile denize açılın',
      gradient: 'from-green-500 to-green-600',
      locations: ['İstanbul', 'İzmir', 'Çanakkale']
    },
    'kabin-turlari': {
      title: 'Kabin Turları',
      icon: '🛥️',
      color: 'purple',
      description: 'Konforlu kabin turları ile tatil yapın',
      gradient: 'from-purple-500 to-purple-600',
      locations: ['Göcek', 'Marmaris', 'Bodrum']
    },
    'balik-dalis': {
      title: 'Balık & Dalış',
      icon: '🐠',
      color: 'teal',
      description: 'Balık avı ve dalış turları',
      gradient: 'from-teal-500 to-teal-600',
      locations: ['Antalya', 'Muğla', 'İzmir']
    },
    'yuzme-turlari': {
      title: 'Yüzme Turları',
      icon: '🏊',
      color: 'cyan',
      description: 'Eşsiz koylarda yüzme turları',
      gradient: 'from-cyan-500 to-cyan-600',
      locations: ['Kaş', 'Kalkan', 'Olimpos']
    }
  };

  useEffect(() => {
    initializeCategories();
    updateSEO();
  }, []);

  const initializeCategories = () => {
    const categoryList = Object.entries(categoryConfig).map(([slug, config]) => ({
      slug,
      ...config,
      tourCount: Math.floor(Math.random() * 50) + 5 // Mock data
    }));
    setCategories(categoryList);
  };

  const updateSEO = () => {
    updateSEOTags({
      title: 'Tüm Kategoriler - Mavibilet | Mavi Yolculuk, Tekne Turu ve Kabin Kiralama',
      description: 'Mavibilet\'te 5 farklı kategoride yüzlerce tur seçeneği. Mavi yolculuk, günübirlik tekne turları, kabin kiralama ve daha fazlası. Hemen keşfedin!',
      keywords: 'mavi yolculuk kategoriler, tekne turu türleri, kabin kiralama, günübirlik tur, balık dalış, yüzme turları',
      canonicalUrl: `${window.location.origin}/kategoriler`,
      structuredData: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Tüm Tur Kategorileri",
        "description": "Mavibilet'te bulunan tüm tur kategorileri",
        "url": `${window.location.origin}/kategoriler`,
        "hasPart": Object.entries(categoryConfig).map(([slug, config]) => ({
          "@type": "TouristDestination",
          "name": config.title,
          "description": config.description,
          "url": `${window.location.origin}/${slug}`
        }))
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Back Button to Turlar */}
          <button
            onClick={() => navigate('/turlar')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Turlar</span>
          </button>

          {/* Page Header */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Tüm Kategoriler
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Size en uygun tur kategorisini seçin ve unutulmaz deneyimlere başlayın. 
              Her kategoride yüzlerce tur seçeneği sizi bekliyor.
            </p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/${category.slug}`}
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
              
              {/* Content */}
              <div className="relative p-8">
                {/* Icon */}
                <div className={`w-20 h-20 bg-${category.color}-100 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {category.icon}
                </div>
                
                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-gray-800">
                  {category.title}
                </h2>
                
                {/* Description */}
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {category.description}
                </p>
                
                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {category.locations.length} lokasyon
                  </span>
                  <span className="flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    {category.tourCount} tur
                  </span>
                </div>
                
                {/* Popular Locations */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {category.locations.slice(0, 3).map((location, index) => (
                      <span 
                        key={index}
                        className={`px-3 py-1 bg-${category.color}-50 text-${category.color}-700 text-xs font-medium rounded-full`}
                      >
                        {location}
                      </span>
                    ))}
                    {category.locations.length > 3 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        +{category.locations.length - 3} daha
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Arrow */}
                <div className="flex items-center justify-between">
                  <span className={`text-${category.color}-600 font-medium group-hover:text-${category.color}-700 transition-colors`}>
                    Turları Keşfet
                  </span>
                  <ArrowRight className={`w-5 h-5 text-${category.color}-600 group-hover:translate-x-1 transition-transform duration-300`} />
                </div>
              </div>
              
              {/* Hover Effect Border */}
              <div className={`absolute inset-0 border-2 border-transparent group-hover:border-${category.color}-200 rounded-2xl transition-colors duration-300`}></div>
            </Link>
          ))}
        </div>
        
        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Aradığınızı Bulamadınız mı?
            </h2>
            <p className="text-gray-600 mb-6">
              Tüm turları görüntüleyerek size en uygun seçeneği bulabilirsiniz.
            </p>
            <Link
              to="/turlar"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Tüm Turları Görüntüle
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllCategoriesPage;