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
  const [loading, setLoading] = useState(true);

  // Backend URL'i al
  const API = process.env.REACT_APP_BACKEND_URL || 'https://tourslug.preview.emergentagent.com/api';

  // Fallback categories for when API is not available
  const defaultCategories = [
    {
      id: 1,
      slug: 'mavi-yolculuk',
      title: 'Mavi Yolculuk',
      description: 'Türkiye\'nin en güzel koylarında mavi yolculuk deneyimi yaşayın',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxtYXZpJTIweW9sY3VsdWt8ZW58MHx8fHwxNzYwMTA4MjIxfDA&ixlib=rb-4.1.0&q=85',
      color: 'from-blue-500 to-indigo-500',
      tours_count: 12
    },
    {
      id: 2,
      slug: 'gunubirlik-tekne',
      title: 'Günübirlik Tekne Turları',
      description: 'Günübirlik tekne turları ile denize açılın',
      image: 'https://images.unsplash.com/photo-1565011523534-747a8601f10a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHx0ZWtuZSUyMHR1cnV8ZW58MHx8fHwxNzYwMTA4MjM2fDA&ixlib=rb-4.1.0&q=85',
      color: 'from-green-500 to-emerald-500',
      tours_count: 8
    },
    {
      id: 3,
      slug: 'kabin-turlari',
      title: 'Kabin Turları',
      description: 'Konforlu kabin turları ile tatil yapın',
      image: 'https://images.unsplash.com/photo-1583245833604-51ae0fa4805a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxrYWJpbiUyMHlhdCUyMGludGVyaW9yfGVufDB8fHx8MTc2MDEwODI0MXww&ixlib=rb-4.1.0&q=85',
      color: 'from-purple-500 to-pink-500',
      tours_count: 15
    },
    {
      id: 4,
      slug: 'balik-dalis',
      title: 'Balık & Dalış',
      description: 'Balık avı ve dalış turları keşfedin',
      image: 'https://images.unsplash.com/photo-1583872263937-b3778da8d97f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxkaXZpbmclMjBmaXNoaW5nfGVufDB8fHx8MTc2MDEwODI1NHww&ixlib=rb-4.1.0&q=85',
      color: 'from-teal-500 to-cyan-500',
      tours_count: 6
    }
  ];

  useEffect(() => {
    loadCategories();
    updateSEO();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      
      // Try to load categories from API
      const categoriesResponse = await axios.get(`${API}/public/categories`);
      if (categoriesResponse.data?.categories && Array.isArray(categoriesResponse.data.categories)) {
        const categoryList = categoriesResponse.data.categories.map(category => ({
          id: category.id,
          slug: category.slug,
          title: category.title,
          description: category.description || `${category.title} kategorisindeki turları keşfedin`,
          image: category.image,
          color: 'from-blue-500 to-indigo-500', // Default gradient
          tours_count: category.tours_count || 0
        }));
        setCategories(categoryList);
      } else {
        setCategories(defaultCategories);
      }
    } catch (error) {
      console.log('Categories API not available, using default categories');
      setCategories(defaultCategories);
    } finally {
      setLoading(false);
    }
  };

  const navigateToCategory = (category) => {
    navigate(`/${category.slug}`);
  };

  const updateSEO = () => {
    updateSEOTags({
      title: 'Tüm Kategoriler - Mavibilet | Mavi Yolculuk, Tekne Turu ve Kabin Kiralama',
      description: 'Mavibilet\'te farklı kategorilerde yüzlerce tur seçeneği. Mavi yolculuk, günübirlik tekne turları, kabin kiralama ve daha fazlası. Hemen keşfedin!',
      keywords: 'mavi yolculuk kategoriler, tekne turu türleri, kabin kiralama, günübirlik tur, balık dalış, yüzme turları',
      canonicalUrl: `${window.location.origin}/kategoriler`,
    });
  };

  // Category Card Component - Same as HomePage design
  const CategoryCard = ({ category }) => {
    const IconComponent = Compass; // Default icon
    
    return (
      <div
        onClick={() => navigateToCategory(category)}
        className="group relative bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-blue-300 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
      >
        {/* Category Image with Gradient Overlay */}
        <div className="relative h-56 overflow-hidden">
          {category.image ? (
            <>
              <img
                src={category.image}
                alt={category.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  // Fallback to gradient background if image fails to load
                  e.target.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            </>
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${category.color} flex items-center justify-center relative`}>
              <IconComponent className="w-20 h-20 text-white opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
          )}
          
          {/* Tour Count Badge - Modern Design */}
          <div className="absolute top-4 right-4">
            <div className="bg-white/95 backdrop-blur-md rounded-lg px-3 py-1.5 shadow-lg">
              <div className="flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-sm font-semibold text-gray-800">
                  {category.tours_count || 0} Tur
                </span>
              </div>
            </div>
          </div>

          {/* Category Title on Image */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">
              {category.title}
            </h3>
          </div>
        </div>
        
        {/* Category Info - Cleaner Design */}
        <div className="p-5">
          <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2 min-h-[40px]">
            {category.description || 'En güzel rotalar ve deneyimler sizi bekliyor'}
          </p>
          
          {/* Action Button */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
              Turları Keşfet
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-all duration-300">
              <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </div>
    );
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
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
                <div className="h-56 bg-gray-200"></div>
                <div className="p-5">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
        
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
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold transition-colors duration-200"
            >
              <span>Tüm Turları Görüntüle</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllCategoriesPage;