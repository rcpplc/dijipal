import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const StandardBreadcrumb = ({ 
  category = null, 
  subcategory = null, 
  product = null,
  categorySlug = null,
  subcategorySlug = null,
  productSlug = null 
}) => {
  const navigate = useNavigate();

  return (
    <nav className="flex items-center space-x-2 text-gray-500 text-sm mb-6">
      {/* Anasayfa */}
      <button 
        onClick={() => navigate('/')} 
        className="hover:text-blue-600 transition-colors"
      >
        Anasayfa
      </button>
      
      {/* Separator */}
      <ChevronRight className="w-4 h-4" />
      
      {/* Turlar */}
      <button 
        onClick={() => navigate('/turlar')} 
        className="hover:text-blue-600 transition-colors"
      >
        Turlar
      </button>
      
      {/* Ana Kategori */}
      {category && (
        <>
          <ChevronRight className="w-4 h-4" />
          {categorySlug ? (
            <button 
              onClick={() => navigate(`/categories/${categorySlug}`)} 
              className="hover:text-blue-600 transition-colors"
            >
              {category}
            </button>
          ) : (
            <span className="text-gray-900">{category}</span>
          )}
        </>
      )}
      
      {/* Alt Kategori */}
      {subcategory && (
        <>
          <ChevronRight className="w-4 h-4" />
          {subcategorySlug && categorySlug ? (
            <button 
              onClick={() => navigate(`/categories/${categorySlug}/${subcategorySlug}`)} 
              className="hover:text-blue-600 transition-colors"
            >
              {subcategory}
            </button>
          ) : (
            <span className="text-gray-900">{subcategory}</span>
          )}
        </>
      )}
      
      {/* Ürün */}
      {product && (
        <>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{product}</span>
        </>
      )}
    </nav>
  );
};

export default StandardBreadcrumb;